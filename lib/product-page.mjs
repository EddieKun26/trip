import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";

// Fail closed on non-public/special-use ranges, including IPv4 transition forms.
const denied = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
]) denied.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
]) denied.addSubnet(address, prefix, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");

export function isPublicAddress(address) {
  if (isIP(address) === 4) return !denied.check(address, "ipv4");
  if (isIP(address) === 6) return globalV6.check(address, "ipv6") && !denied.check(address, "ipv6");
  return false;
}

class ReadError extends Error {
  constructor(reason, status = "blocked") {
    super(reason);
    this.readStatus = status;
  }
}

export function validateProductUrl(value, base) {
  if (typeof value !== "string" || value.length > 4096 || /[\u0000-\u0020\u007f\\]/u.test(value)) {
    throw new ReadError("invalid_url", "unsupported");
  }
  let url;
  try { url = new URL(value, base); } catch { throw new ReadError("invalid_url", "unsupported"); }
  if (url.protocol !== "https:") throw new ReadError("https_required", "unsupported");
  if (url.username || url.password || (url.port && url.port !== "443")) throw new ReadError("unsafe_url");
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!host || host === "localhost" || /(?:^|\.)(?:localhost|local|internal|lan|home|arpa)$/.test(host) ||
      (!isIP(host) && !host.includes(".")) || (isIP(host) && !isPublicAddress(host))) {
    throw new ReadError("non_public_host");
  }
  return url;
}

// One overall deadline covers DNS, TLS, redirects and streaming, even a stalled DNS resolver.
function withinDeadline(work, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new ReadError("timeout"));
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve().then(work).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function requestOnce(url, options, request) {
  return new Promise((resolve, reject) => {
    const req = request(url, options, (res) => {
      // A redirect body is never consumed. Its Location goes through the complete validator.
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        resolve({ status: res.statusCode, location: res.headers.location });
        res.destroy();
        return;
      }
      const fail = (reason, status) => {
        reject(new ReadError(reason, status));
        res.destroy();
      };
      if (res.statusCode < 200 || res.statusCode >= 300) {
        fail(`http_${res.statusCode}`, [401, 403, 407, 429, 451].includes(res.statusCode) || res.statusCode >= 500 ? "blocked" : "unsupported");
        return;
      }
      const mime = String(res.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (!options.allowedTypes.includes(mime)) return fail("invalid_content_type", "unsupported");
      if (res.headers["content-encoding"] && res.headers["content-encoding"] !== "identity") {
        return fail("unsupported_content_encoding", "unsupported");
      }
      if (Number(res.headers["content-length"]) > options.maxBytes) return fail("response_too_large");
      let size = 0;
      const chunks = [];
      res.on("data", (chunk) => {
        size += chunk.length;
        if (size > options.maxBytes) return fail("response_too_large");
        chunks.push(chunk);
      });
      res.on("end", () => resolve({ status: res.statusCode, mime, body: Buffer.concat(chunks) }));
      res.on("error", reject);
      res.on("aborted", () => reject(new ReadError("response_aborted")));
    });
    req.on("error", reject);
    req.end();
  });
}

/** Internal dependency injection is for offline tests only; callers cannot supply it via HTTP. */
export async function safeFetchProductResource(sourceUrl, {
  kind = "html", timeoutMs = kind === "html" ? 12000 : 5000,
  maxBytes = kind === "html" ? 1024 * 1024 : 2 * 1024 * 1024,
  maxRedirects = 4, lookup = dnsLookup, request = httpsRequest,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const { signal } = controller;
  try {
    return await withinDeadline(async () => {
      let url = validateProductUrl(sourceUrl);
      for (let hop = 0; hop <= maxRedirects; hop++) {
        const host = url.hostname.replace(/^\[|\]$/g, "");
        const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] :
          await withinDeadline(() => lookup(host, { all: true, verbatim: true }), signal);
        if (!addresses.length || addresses.some(({ address, family }) => !isPublicAddress(address) || isIP(address) !== family)) {
          throw new ReadError("non_public_dns");
        }
        if (signal.aborted) throw new ReadError("timeout");
        const pinned = addresses[0];
        const result = await requestOnce(url, {
          method: "GET", agent: false, signal, rejectUnauthorized: true,
          // Keep the original hostname for TLS certificate verification, SNI and Host.
          // The socket lookup returns only our checked IP; there is no second DNS query.
          lookup: (_host, opts, callback) => callback(null, opts?.all ? [pinned] : pinned.address, pinned.family),
          headers: { Accept: kind === "html" ? "text/html, application/xhtml+xml" : "image/jpeg,image/png,image/webp,image/gif",
            "Accept-Encoding": "identity", "User-Agent": "TravelProductDraft/1.0" },
          maxHeaderSize: 16384,
          maxBytes,
          allowedTypes: kind === "html" ? ["text/html", "application/xhtml+xml"] : ["image/jpeg", "image/png", "image/webp", "image/gif"],
        }, request);
        if (!result.location && [301, 302, 303, 307, 308].includes(result.status)) throw new ReadError("invalid_redirect");
        if (!result.location) return { ...result, finalUrl: url.href };
        if (hop === maxRedirects) throw new ReadError("redirect_limit");
        url = validateProductUrl(result.location, url);
      }
    }, signal);
  } catch (error) {
    if (error instanceof ReadError) throw error;
    throw new ReadError(signal.aborted ? "timeout" : "fetch_failed");
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

const array = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const text = (value) => typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, 500) || null : null;
const hasType = (node, type) => array(node?.["@type"]).some((t) => typeof t === "string" && t.replace(/^https?:\/\/schema.org\//, "") === type);
function decode(value) {
  return String(value).replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const n = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  });
}
function attributes(tag) {
  const result = {};
  for (const m of tag.matchAll(/([^\s=<>/'"]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const key = m[1].toLowerCase();
    if (!(key in result)) result[key] = decode(m[2] ?? m[3] ?? m[4]);
  }
  return result;
}
function metadata(html) {
  const json = [], meta = new Map(), canonicals = [];
  let malformed = false;
  // Scan forward only. An unterminated raw-text block must not repeatedly scan the rest
  // of an attacker-controlled document or expose fake metadata from inside the block.
  const lower = html.toLowerCase();
  const tokens = /<!--|<(\/?)([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  let inertDepth = 0, m;
  while ((m = tokens.exec(html))) {
    if (m[0] === "<!--") {
      const end = html.indexOf("-->", tokens.lastIndex);
      if (end < 0) break;
      tokens.lastIndex = end + 3;
      continue;
    }
    const tag = m[2].toLowerCase(), closing = Boolean(m[1]);
    if (["template", "noscript"].includes(tag)) {
      inertDepth = Math.max(0, inertDepth + (closing ? -1 : 1));
      continue;
    }
    const attrs = attributes(m[0]);
    if (!closing && ["script", "style", "textarea", "title"].includes(tag)) {
      const close = new RegExp(`</${tag}\\s*>`, "gi");
      close.lastIndex = tokens.lastIndex;
      const end = close.exec(lower);
      if (!end) break;
      if (!inertDepth && tag === "script" && attrs.type?.toLowerCase() === "application/ld+json") {
        try { json.push(JSON.parse(html.slice(tokens.lastIndex, end.index))); } catch { malformed = true; }
      }
      tokens.lastIndex = close.lastIndex;
      continue;
    }
    if (inertDepth || closing) continue;
    if (tag === "meta") {
      const key = (attrs.property || attrs.name || "").toLowerCase();
      if (key && attrs.content) meta.set(key, [...(meta.get(key) || []), attrs.content]);
    }
    if (tag === "link" && attrs.rel?.toLowerCase().split(/\s+/).includes("canonical") && attrs.href) canonicals.push(attrs.href);
  }
  return { json, meta, canonicals, malformed };
}
function safeReference(value, base) {
  try { return validateProductUrl(value, base).href; } catch { return null; }
}
function pageKey(value, base) {
  const ref = safeReference(value, base);
  if (!ref) return null;
  const url = new URL(ref);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ["gclid", "fbclid"].includes(key)) url.searchParams.delete(key);
  }
  return url.href;
}

function emptyDraft(originalReferenceUrl, fetchedAt) {
  return {
    originalReferenceUrl, sourceCanonicalUrl: null, sourceHost: null,
    sourceProductId: null, sourceProductIdType: null, sourceProductIdScope: null,
    name: null, brand: null, merchant: null, price: null, currency: null,
    variantId: null, size: null, color: null, imageUrl: null,
    readStatus: "unsupported", readReason: "no_product_metadata", fetchedAt, fieldEvidence: {},
  };
}

/** Pure parser: all fields come from one selected Product (or one page-scoped OG record). */
export function parseProductPage(html, { originalReferenceUrl, finalUrl = originalReferenceUrl, fetchedAt = new Date().toISOString() } = {}) {
  const draft = emptyDraft(originalReferenceUrl, fetchedAt);
  draft.sourceHost = new URL(finalUrl).hostname;
  const evidence = draft.fieldEvidence;
  const issues = new Set();
  const page = pageKey(finalUrl, finalUrl);
  if (/<title\b[^>]*>\s*(?:Just a moment|Access denied|Attention Required|Robot Check|Verify you are human)/i.test(html) ||
      /(?:id=["']cf-chl-|\/cdn-cgi\/challenge-platform\/|<form\b[^>]*(?:id=["']challenge-form|action=["'][^"']*captcha))/i.test(html)) {
    return { ...draft, readStatus: "blocked", readReason: "source_challenge" };
  }
  const { json, meta, canonicals, malformed } = metadata(html);
  const nodes = [], products = [], pages = [], ids = new Map();
  let exhausted = false;
  const visit = (node, path, eligible, depth = 0) => {
    if (depth > 32 || nodes.length > 2000) { exhausted = true; return; }
    if (Array.isArray(node)) return node.forEach((n, i) => visit(n, `${path}[${i}]`, eligible, depth + 1));
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    if (typeof node["@id"] === "string") {
      const id = safeReference(node["@id"], finalUrl);
      // Reference-only nodes do not overwrite definitions. Conflicting definitions remain unresolved.
      if (id && Object.keys(node).length > 1) ids.set(id, ids.has(id) ? null : node);
    }
    if (hasType(node, "Product") || hasType(node, "ProductGroup")) products.push({ node, path, eligible });
    if (hasType(node, "WebPage") || hasType(node, "ItemPage")) pages.push(node);
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "object") visit(value, `${path}.${key}`, eligible &&
        (key === "@graph" || (key === "hasVariant" && (hasType(node, "Product") || hasType(node, "ProductGroup")))), depth + 1);
    }
  };
  json.forEach((n, i) => visit(n, `jsonld[${i}]`, true));
  if (exhausted) return { ...draft, readReason: "metadata_complexity_limit" };
  const deref = (n) => n && typeof n === "object" && Object.keys(n).length === 1 && n["@id"] ? ids.get(safeReference(n["@id"], finalUrl)) || null : n;
  const refs = (n) => [text(n?.url), text(n?.["@id"])].filter(Boolean).map((u) => pageKey(u, finalUrl));
  const mainNodes = pages.filter((n) => !n.url && !n["@id"] || refs(n).includes(page))
    .flatMap((n) => array(n.mainEntity).map((v) => typeof v === "string" ? ids.get(safeReference(v, finalUrl)) : deref(v))).filter(Boolean);
  const anchors = products.filter(({ node }) => mainNodes.includes(node) ||
    array(node.mainEntityOfPage).some((v) => pageKey(typeof v === "string" ? v : v?.["@id"] || v?.url, finalUrl) === page));
  const matches = products.filter(({ node, eligible }) => eligible && refs(node).includes(page));
  let selected = null;
  if (anchors.length === 1) selected = anchors[0];
  else if (!anchors.length && matches.length === 1) selected = matches[0];
  else if (!anchors.length && !matches.length) {
    const candidates = products.filter(({ node, eligible }) => eligible && (!refs(node).filter(Boolean).length || refs(node).includes(page)));
    if (candidates.length === 1 && products.filter((p) => p.eligible).length === 1) selected = candidates[0];
  }
  const set = (field, value, path) => {
    if (value != null) { draft[field] = value; evidence[field] = { source: selected ? "jsonld" : "opengraph", path, value }; }
  };
  const uniqueMeta = (key) => {
    const values = [...new Set(meta.get(key) || [])];
    if (values.length > 1) issues.add(`ambiguous_${key}`);
    return values.length === 1 ? text(values[0]) : null;
  };
  let product, productPath, offer, offerPath;
  if (selected) {
    product = selected.node; productPath = selected.path;
    evidence.identity = { source: "jsonld", path: productPath, id: text(product["@id"]), selection: anchors.length ? "page_main_entity" : matches.length ? "page_url" : "single_product" };
    set("name", text(product.name), `${productPath}.name`);
    const brand = deref(product.brand);
    set("brand", text(brand?.name ?? brand), `${productPath}.brand`);
    const image = deref(array(product.image)[0]);
    const imageUrl = safeReference(text(image?.contentUrl ?? image?.url ?? image), finalUrl);
    set("imageUrl", imageUrl, `${productPath}.image[0]`);
    if (product.image && !imageUrl) issues.add("invalid_image_url");
    for (const type of ["productID", "sku"]) {
      const id = text(product[type]);
      if (id) {
        set("sourceProductId", id, `${productPath}.${type}`);
        draft.sourceProductIdType = type;
        draft.sourceProductIdScope = { host: draft.sourceHost, productIdentity: text(product["@id"]) || text(product.url) || productPath };
        evidence.sourceProductId.type = type;
        evidence.sourceProductId.scope = draft.sourceProductIdScope;
        break;
      }
    }
    set("size", text(product.size), `${productPath}.size`);
    set("color", text(product.color), `${productPath}.color`);
    const parent = deref(product.isVariantOf);
    const ambiguousVariant = hasType(product, "ProductGroup") || array(product.hasVariant).length > 0 || Boolean(product.variesBy) ||
      Array.isArray(product.size) || Array.isArray(product.color);
    if (ambiguousVariant) {
      issues.add("variant_ambiguous");
      draft.size = null; draft.color = null;
      delete evidence.size; delete evidence.color;
      evidence.variant = { source: "jsonld", path: productPath, reason: "variant_not_selected" };
    } else if (parent || product.inProductGroupWithID) {
      // A SKU is a variant identifier only when the selected Product explicitly belongs to a group.
      set("variantId", text(product.sku) || text(product.productID), `${productPath}.${product.sku ? "sku" : "productID"}`);
      evidence.variant = { source: "jsonld", path: productPath, group: text(parent?.["@id"]) || text(parent?.productGroupID) || text(product.inProductGroupWithID) };
    }
    const offers = array(product.offers).map(deref);
    if (offers.length > 1) issues.add("multiple_offers");
    else if (offers.length === 1 && offers[0] && typeof offers[0] === "object") {
      offer = offers[0]; offerPath = `${productPath}.offers[0]`;
      const item = deref(offer.itemOffered);
      if (offer.itemOffered && item !== product && !(item?.["@id"] && item["@id"] === product["@id"])) {
        issues.add("offer_identity_mismatch"); offer = null;
      }
    }
    if (offer) {
      const merchant = deref(offer.seller);
      set("merchant", text(merchant?.name ?? merchant), `${offerPath}.seller`);
      const specs = array(offer.priceSpecification).map(deref);
      if (specs.some((s) => !s || typeof s !== "object")) issues.add("unresolved_price_specification");
      if (hasType(offer, "AggregateOffer") || offer.lowPrice != null || offer.highPrice != null || Number(offer.offerCount) > 1 ||
          specs.some((s) => s?.minPrice != null || s?.maxPrice != null)) issues.add("price_range");
      if (offer.validForMemberTier || offer.eligibleCustomerType || specs.some((s) => s?.validForMemberTier || s?.eligibleCustomerType)) issues.add("restricted_price");
      if (Array.isArray(offer.seller) || Array.isArray(offer.price) || Array.isArray(offer.priceCurrency) || specs.length > 1) issues.add("ambiguous_price");
      if (specs.some((s) => s?.priceType || s?.billingDuration || s?.billingIncrement || s?.referenceQuantity)) issues.add("conditional_price");
      const start = Date.parse(offer.validFrom || ""), end = Date.parse(offer.priceValidUntil || offer.validThrough || "");
      if (start > Date.parse(fetchedAt) || end < Date.parse(fetchedAt)) issues.add("inactive_offer");
      const spec = specs[0];
      if (offer.price != null && spec?.price != null && String(offer.price) !== String(spec.price)) issues.add("conflicting_price");
      if (offer.priceCurrency && spec?.priceCurrency && offer.priceCurrency !== spec.priceCurrency) issues.add("conflicting_currency");
      const amount = offer.price ?? spec?.price;
      const currency = text(offer.priceCurrency ?? spec?.priceCurrency);
      // ICU's ISO list rejects arbitrary three-letter strings (and ambiguous currency symbols).
      const knownCurrency = currency && /^[A-Z]{3}$/.test(currency) && Intl.supportedValuesOf("currency").includes(currency);
      if (!knownCurrency) issues.add("unknown_currency");
      const validAmount = (typeof amount === "string" || typeof amount === "number") && /^\d+(?:\.\d+)?$/.test(String(amount)) && Number.isFinite(Number(amount)) && Number(amount) <= 1e9;
      if (!validAmount) issues.add("missing_or_invalid_price");
      evidence.offer = { source: "jsonld", path: offerPath, reasons: [...issues].filter((x) => x !== "invalid_image_url") };
      if (knownCurrency) set("currency", currency, `${offerPath}.${offer.priceCurrency ? "priceCurrency" : "priceSpecification.priceCurrency"}`);
      if (validAmount && ![...issues].some((x) => x !== "invalid_image_url")) {
        set("price", Number(amount), `${offerPath}.${offer.price != null ? "price" : "priceSpecification.price"}`);
      }
    }
  } else {
    // Never repair ambiguous JSON-LD identities with unrelated page-wide OG fields.
    if (products.length) return { ...draft, readReason: "product_identity_ambiguous" };
    const type = uniqueMeta("og:type");
    const name = uniqueMeta("og:title");
    if (!["product", "og:product"].includes(type) || !name) return { ...draft, readReason: malformed ? "malformed_product_metadata" : "no_product_metadata" };
    const ogUrl = uniqueMeta("og:url");
    if (ogUrl && pageKey(ogUrl, finalUrl) !== page) return { ...draft, readReason: "metadata_identity_mismatch" };
    evidence.identity = { source: "opengraph", path: "og:type + og:title", selection: "page_product_metadata" };
    set("name", name, "og:title");
    set("brand", uniqueMeta("product:brand"), "product:brand");
    set("imageUrl", safeReference(uniqueMeta("og:image"), finalUrl), "og:image");
    // OG cannot prove Offer/variant/customer eligibility, so price is evidence only.
    const amount = uniqueMeta("product:price:amount"), currency = uniqueMeta("product:price:currency");
    if (amount || currency) evidence.offer = { source: "opengraph", amount, currency, reason: "offer_scope_unverified" };
    issues.add("metadata_fallback");
  }
  // Canonical must be explicitly declared and tied to the selected identity, on the final source host.
  const canonicalRefs = [...new Set(canonicals.map((u) => safeReference(u, finalUrl)).filter(Boolean))];
  if (canonicalRefs.length === 1 && canonicals.length === 1) {
    const canonical = canonicalRefs[0];
    const sameHost = new URL(canonical).host === new URL(finalUrl).host;
    const key = pageKey(canonical, finalUrl);
    const otherProduct = products.some(({ node }) => node !== product && refs(node).includes(key));
    const sameIdentity = key === page || (product && refs(product).includes(key));
    if (sameHost && sameIdentity && !otherProduct) set("sourceCanonicalUrl", canonical, "link[rel=canonical]");
    else evidence.sourceCanonicalUrl = { source: "html", path: "link[rel=canonical]", reason: "canonical_identity_unverified" };
  }
  if (malformed) issues.add("malformed_jsonld");
  if (!draft.name) return { ...emptyDraft(originalReferenceUrl, fetchedAt), sourceHost: draft.sourceHost, readReason: "missing_product_name" };
  if (!draft.imageUrl) issues.add("missing_image");
  if (draft.price == null) issues.add("missing_trusted_price");
  draft.readStatus = issues.size ? "partial" : "success";
  draft.readReason = issues.size ? [...issues].join(",") : "product_metadata";
  return draft;
}

function validImage(body, mime) {
  if (mime === "image/jpeg") return body.length >= 3 && body[0] === 255 && body[1] === 216 && body[2] === 255;
  if (mime === "image/png") return body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif") return /^GIF8[79]a$/.test(body.subarray(0, 6).toString());
  return mime === "image/webp" && body.subarray(0, 4).toString() === "RIFF" && body.subarray(8, 12).toString() === "WEBP";
}

export async function readProductDraft(sourceUrl, dependencies = {}) {
  const fetchedAt = new Date().toISOString();
  const original = typeof sourceUrl === "string" ? sourceUrl : null;
  let page;
  try {
    page = await safeFetchProductResource(sourceUrl, dependencies);
  } catch (error) {
    return { ...emptyDraft(original, fetchedAt), readStatus: error.readStatus || "blocked", readReason: error.message };
  }
  const draft = parseProductPage(page.body.toString("utf8"), { originalReferenceUrl: original, finalUrl: page.finalUrl, fetchedAt });
  if (draft.imageUrl) {
    try {
      const image = await safeFetchProductResource(draft.imageUrl, { ...dependencies, kind: "image" });
      if (!validImage(image.body, image.mime)) throw new ReadError("invalid_image_content");
      draft.fieldEvidence.imageUrl.readStatus = "success";
      draft.fieldEvidence.imageUrl.fetchedUrl = image.finalUrl;
    } catch (error) {
      draft.imageUrl = null;
      draft.fieldEvidence.imageUrl.readStatus = error.readStatus || "blocked";
      draft.fieldEvidence.imageUrl.readReason = error.message;
      draft.readStatus = "partial";
      draft.readReason = [draft.readReason === "product_metadata" ? "" : draft.readReason, "image_unavailable"].filter(Boolean).join(",");
    }
  }
  return draft;
}
