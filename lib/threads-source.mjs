import { request as httpsRequest } from "node:https";
import { safeFetchProductResource, validateProductUrl } from "./product-page.mjs";

export const SOCIAL_HTML_POLICY = Object.freeze({ maxBytes: 4 * 1024 * 1024, timeoutMs: 15000, maxRedirects: 4 });
const IMAGE_POLICY = Object.freeze({ kind: "image", maxBytes: 2 * 1024 * 1024, timeoutMs: 4000, maxRedirects: 3 });
const MAX_IMAGES = 6; // Two workers; at most 12 MiB of accepted media, no media persisted or sent to AI.
const HOSTS = new Set(["threads.com", "www.threads.com", "threads.net", "www.threads.net"]);
const list = (v) => v == null ? [] : Array.isArray(v) ? v : [v];
const clean = (v, max = 6000) => typeof v === "string" ? v.trim().slice(0, max) || null : null;
const typeIs = (n, type) => list(n?.["@type"]).some((t) => typeof t === "string" && t.replace(/^https?:\/\/schema.org\//, "") === type);

function threadsUrl(value, base) {
  const url = validateProductUrl(value, base);
  if (!HOSTS.has(url.hostname)) throw new Error("unsupported_source");
  const post = url.pathname.match(/^\/@([a-z0-9._]+)\/post\/([a-zA-Z0-9_-]+)\/?$/i);
  if (post) return { url, id: post[2], user: post[1].toLowerCase(), key: `${post[1].toLowerCase()}/${post[2]}` };
  if (/^\/share\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)) return { url, key: null };
  throw new Error("unsupported_threads_path");
}
function postIdentity(value, base) {
  try { const p = threadsUrl(value, base); return p.key ? p : null; } catch { return null; }
}
function decode(value) {
  return String(value).replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const n = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "";
  });
}
function attrs(tag) {
  const result = Object.create(null);
  for (const m of tag.matchAll(/([^\s=<>/'"]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const k = m[1].toLowerCase();
    if (!(k in result)) result[k] = decode(m[2] ?? m[3] ?? m[4]);
  }
  return result;
}

// Only head metadata and explicitly typed JSON scripts are considered. Body <img>,
// recommendations, arbitrary JS strings, comments and inert markup are never image evidence.
function scanHtml(html) {
  const meta = new Map(), canonicals = [], scripts = [], titles = [];
  const tokens = /<!--|<(\/?)([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  let head = false, inert = 0, malformed = false, challenge = false, m;
  while ((m = tokens.exec(html))) {
    if (m[0] === "<!--") {
      const end = html.indexOf("-->", tokens.lastIndex);
      if (end < 0) break;
      tokens.lastIndex = end + 3; continue;
    }
    const tag = m[2].toLowerCase(), closing = Boolean(m[1]), a = attrs(m[0]);
    if (["template", "noscript"].includes(tag)) { inert = Math.max(0, inert + (closing ? -1 : 1)); continue; }
    if (!inert && tag === "head") head = !closing;
    if (!inert && tag === "body") head = false;
    if (!inert && !closing && (a.id?.startsWith("cf-chl-") ||
        (tag === "form" && (a.id === "challenge-form" || /captcha/i.test(a.action || ""))))) challenge = true;
    if (!closing && ["script", "style", "textarea", "title"].includes(tag)) {
      const endTag = new RegExp(`</${tag}\\s*>`, "gi"); endTag.lastIndex = tokens.lastIndex;
      const end = endTag.exec(html);
      if (!end) break;
      const body = html.slice(tokens.lastIndex, end.index);
      if (!inert && head && tag === "title") titles.push(decode(body));
      if (!inert && tag === "script" && ["application/ld+json", "application/json"].includes(a.type?.toLowerCase())) {
        try { scripts.push({ value: JSON.parse(body), type: a.type.toLowerCase() }); } catch { malformed = true; }
      }
      tokens.lastIndex = endTag.lastIndex; continue;
    }
    if (inert || closing || !head) continue;
    if (tag === "meta") {
      const key = (a.property || a.name || "").toLowerCase();
      if (key && a.content) {
        if (!meta.has(key)) meta.set(key, new Set());
        meta.get(key).add(a.content);
      }
    }
    if (tag === "link" && a.rel?.toLowerCase().split(/\s+/).includes("canonical") && a.href) canonicals.push(a.href);
  }
  return { meta, canonicals, scripts, titles, malformed, challenge };
}
function blank(originalReferenceUrl, fetchedAt) {
  return { originalReferenceUrl, finalUrl: null, sourceCanonicalUrl: null, sourceHost: null,
    postId: null, caption: null, imageCandidates: [], outboundLinkEvidence: [], metadata: {},
    fieldEvidence: {}, readStatus: "unsupported", readReason: "missing_metadata", fetchedAt };
}
function mediaUrl(value) {
  const url = validateProductUrl(value);
  if (![".fbcdn.net", ".cdninstagram.com"].some((suffix) => url.hostname.endsWith(suffix))) throw new Error("unsupported_image_host");
  // Restrict even OG/structured media to post-photo paths; avatar formats fail closed.
  if (!/\/t51\.\d+-15\//.test(url.pathname)) throw new Error("not_post_image");
  return url;
}

export function parseThreadsSource(html, { originalReferenceUrl, finalUrl, fetchedAt = new Date().toISOString() }) {
  const draft = { ...blank(originalReferenceUrl, fetchedAt), finalUrl };
  const post = postIdentity(finalUrl);
  try { draft.sourceHost = new URL(finalUrl).hostname; } catch { return draft; }
  const scanned = scanHtml(html);
  if (scanned.titles.some((s) => /^(?:(?:just a moment|access denied|attention required|robot check|verify you are human|log in|login)\b|登入|登录)/i.test(s.trim())) || scanned.challenge) {
    return { ...draft, readStatus: "blocked", readReason: "source_challenge" };
  }
  if (!post) return { ...draft, readReason: "post_identity_unresolved" };
  draft.postId = post.id;
  const issues = new Set();
  const unique = (key) => {
    const values = [...(scanned.meta.get(key) || [])];
    if (values.length > 1) issues.add(`ambiguous_${key}`);
    return values.length === 1 ? values[0] : null;
  };
  const ogUrls = [...(scanned.meta.get("og:url") || [])];
  const canonicalKeys = scanned.canonicals.map((v) => postIdentity(v, finalUrl));
  const canonicalValid = canonicalKeys.length > 0 && canonicalKeys.every((p) => p?.key === post.key);
  const ogValid = ogUrls.length > 0 && ogUrls.every((v) => postIdentity(v, finalUrl)?.key === post.key);
  // Contradictory page identities invalidate OG, even if another tag names the desired post.
  const headConflict = (ogUrls.length > 0 && !ogValid) || (canonicalKeys.length > 0 && !canonicalValid);
  if (headConflict) issues.add("metadata_identity_mismatch");
  const headBound = !headConflict && (ogValid || canonicalValid);
  if (canonicalValid && !headConflict) {
    draft.sourceCanonicalUrl = canonicalKeys[0].url.href;
    draft.fieldEvidence.sourceCanonicalUrl = { source: "link[rel=canonical]", postId: post.id };
  }

  const records = [], seen = new Set();
  let nodeCount = 0, complexity = false;
  function walk(node, type, depth = 0) {
    if (++nodeCount > 30000 || depth > 48) { complexity = true; return; }
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const n of node) { walk(n, type, depth + 1); if (complexity) break; } return; }
    let record;
    if (type === "application/ld+json" && typeIs(node, "SocialMediaPosting") && postIdentity(node.url || node.mainEntityOfPage?.["@id"], finalUrl)?.key === post.key) {
      record = { caption: clean(node.articleBody), images: list(node.image).map((i) => typeof i === "string" ? i : i?.contentUrl || i?.url), source: "jsonld-post" };
    } else if (type === "application/json" && node.code === post.id && clean(node.user?.username)?.toLowerCase() === post.user) {
      const media = list(node.carousel_media?.length ? node.carousel_media : node);
      record = { caption: clean(node.caption?.text), images: media.map((item) => {
        const candidates = list(item?.image_versions2?.candidates).filter((c) => typeof c?.url === "string" && Number(c.width) > 128 && Number(c.height) > 128);
        return candidates.sort((a, b) => Number(b.width) - Number(a.width))[0]?.url;
      }), source: "threads-post-json" };
    }
    if (record) {
      const key = JSON.stringify(record);
      if (!seen.has(key)) { seen.add(key); records.push(record); }
    }
    for (const value of Object.values(node)) { walk(value, type, depth + 1); if (complexity) break; }
  }
  for (const script of scanned.scripts) { walk(script.value, script.type); if (complexity) break; }
  if (complexity) { records.length = 0; issues.add("metadata_complexity_limit"); }
  if (scanned.malformed) issues.add("malformed_metadata");
  const captions = [...new Set(records.map((r) => r.caption).filter(Boolean))];
  if (captions.length > 1) issues.add("caption_conflict");
  if (captions.length === 1) {
    draft.caption = captions[0];
    draft.fieldEvidence.caption = { source: "post-json", postId: post.id, completeness: "structured" };
  }
  if (headBound) {
    draft.metadata = { title: clean(unique("og:title"), 500), type: clean(unique("og:type"), 80),
      description: clean(unique("og:description") || unique("description")) };
    if (!draft.caption && !captions.length && !issues.has("ambiguous_og:description")) {
      draft.caption = draft.metadata.description;
      if (draft.caption) draft.fieldEvidence.caption = { source: "og:description", postId: post.id, completeness: "summary" };
    }
  }
  const imageSources = [];
  if (captions.length <= 1) for (const r of records) for (const url of r.images) if (url) imageSources.push({ url, source: r.source });
  if (headBound) for (const url of scanned.meta.get("og:image") || []) imageSources.push({ url, source: "og:image" });
  const imageKeys = new Set();
  for (const candidate of imageSources) {
    try {
      const url = mediaUrl(candidate.url), key = `${url.hostname}${url.pathname}`;
      if (imageKeys.has(key)) continue;
      imageKeys.add(key);
      if (draft.imageCandidates.length === MAX_IMAGES) { issues.add("image_limit"); continue; }
      draft.imageCandidates.push({ url: url.href, source: candidate.source, postId: post.id, readStatus: "unverified" });
    } catch { issues.add("image_rejected"); }
  }
  // Only links literally present in the bound caption. Never scan navigation/replies or guess a product URL.
  for (const match of (draft.caption || "").matchAll(/https:\/\/[^\s<>"']+/g)) {
    try {
      const url = validateProductUrl(match[0].replace(/[.,!?;，。！？；)）]+$/, ""));
      if (HOSTS.has(url.hostname) || draft.outboundLinkEvidence.some((e) => e.url === url.href)) continue;
      if (draft.outboundLinkEvidence.length >= 10) break;
      draft.outboundLinkEvidence.push({ url: url.href, source: draft.fieldEvidence.caption.source, postId: post.id, fetched: false });
    } catch { /* Invalid/private literals are not actionable link evidence. */ }
  }
  if (!draft.caption && !draft.imageCandidates.length) {
    return { ...draft, readStatus: issues.size ? "partial" : "unsupported", readReason: [...issues].join(",") || "missing_metadata" };
  }
  if (!draft.caption) issues.add("missing_caption");
  if (draft.caption?.includes("…") || /\.\.\.$/.test(draft.caption || "")) issues.add("caption_may_be_truncated");
  draft.readStatus = issues.size ? "partial" : "success";
  draft.readReason = [...issues].join(",") || "source_metadata";
  return draft;
}

function imageSignature(body, mime) {
  return mime === "image/jpeg" ? body.subarray(0, 3).equals(Buffer.from([255, 216, 255])) :
    mime === "image/png" ? body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) :
    mime === "image/webp" ? body.subarray(0, 4).toString() === "RIFF" && body.subarray(8, 12).toString() === "WEBP" : false;
}
function failure(error) {
  if (error.message === "response_too_large") return { readStatus: "partial", readReason: "too_large" };
  return { readStatus: error.readStatus || "blocked", readReason: error.message || "fetch_failed" };
}

/** Dependencies are internal test injection, never taken from an HTTP request body. */
export async function readThreadsSource(sourceUrl, { lookup, request = httpsRequest } = {}) {
  const original = typeof sourceUrl === "string" ? sourceUrl : null;
  const fetchedAt = new Date().toISOString();
  let initial;
  try { initial = threadsUrl(sourceUrl); } catch (error) {
    return { ...blank(original, fetchedAt), ...failure(error), readStatus: error.readStatus || "unsupported" };
  }
  let finalUrl = null, expectedPost = initial.key, restriction;
  let result;
  try {
    result = await safeFetchProductResource(sourceUrl, { ...SOCIAL_HTML_POLICY, lookup,
      request: (url, options, callback) => {
        let next;
        try { next = threadsUrl(url.href); } catch { restriction = "redirect_source_rejected"; throw new Error(restriction); }
        if (expectedPost && next.key !== expectedPost) { restriction = "redirect_post_mismatch"; throw new Error(restriction); }
        expectedPost ||= next.key;
        return request(url, options, (res) => { finalUrl = url.href; callback(res); });
      },
    });
  } catch (error) {
    return { ...blank(original, fetchedAt), finalUrl, sourceHost: new URL(finalUrl || sourceUrl).hostname,
      ...failure(error), ...(restriction ? { readReason: restriction } : {}) };
  }
  const draft = parseThreadsSource(result.body.toString("utf8"), { originalReferenceUrl: original, finalUrl: result.finalUrl, fetchedAt });
  let cursor = 0;
  async function worker() {
    while (cursor < draft.imageCandidates.length) {
      const candidate = draft.imageCandidates[cursor++];
      let mediaRestriction;
      try {
        const image = await safeFetchProductResource(candidate.url, { ...IMAGE_POLICY, lookup,
          request: (url, options, callback) => {
            try { mediaUrl(url.href); } catch { mediaRestriction = "image_redirect_rejected"; throw new Error(mediaRestriction); }
            return request(url, options, callback);
          },
        });
        if (!imageSignature(image.body, image.mime)) throw new Error("invalid_image_content");
        Object.assign(candidate, { readStatus: "success", readReason: "image_verified", finalUrl: image.finalUrl, mime: image.mime, byteLength: image.body.length });
      } catch (error) {
        Object.assign(candidate, failure(error), mediaRestriction ? { readReason: mediaRestriction } : {});
      }
    }
  }
  await Promise.all([worker(), worker()]);
  if (draft.imageCandidates.some((i) => i.readStatus !== "success")) {
    draft.readStatus = "partial";
    draft.readReason = [draft.readReason === "source_metadata" ? null : draft.readReason, "image_unavailable"].filter(Boolean).join(",");
  }
  return draft;
}
