import { createHash } from "node:crypto";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MAX_IMAGE_BYTES = 700000;
const MAX_SOURCE_PAGES = 12;

function cleanText(value, length = 200) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, length);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLocaleLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return "";
    if (/^(?:127|10|0)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host)) return "";
    const second = Number(host.split(".")[1]);
    if (/^172\./.test(host) && second >= 16 && second <= 31) return "";
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return "";
    return url.href;
  } catch {
    return "";
  }
}

function openAiSources(payload) {
  const sources = [];
  const add = (value, title = "") => {
    const url = safeHttpsUrl(value);
    if (!url || sources.some((source) => source.url === url)) return;
    sources.push({ url, title: cleanText(title, 160) });
  };
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type === "web_search_call") {
      for (const source of Array.isArray(item?.action?.sources) ? item.action.sources : []) add(source?.url, source?.title);
    }
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      for (const annotation of Array.isArray(part?.annotations) ? part.annotations : []) {
        if (annotation?.type === "url_citation") add(annotation.url, annotation.title);
      }
    }
  }
  return sources.slice(0, MAX_SOURCE_PAGES);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function absoluteImageUrl(value, pageUrl) {
  try {
    return safeHttpsUrl(new URL(decodeHtml(value), pageUrl).href);
  } catch {
    return "";
  }
}

function htmlAttributes(tag) {
  const attributes = {};
  for (const match of String(tag || "").matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attributes[match[1].toLocaleLowerCase()] = decodeHtml(match[3]);
  }
  return attributes;
}

function imageUrlScore(value) {
  const url = String(value || "").toLocaleLowerCase();
  if (/favicon|avatar|sprite|logo|icon|badge|payment|tracking|pixel/.test(url)) return -100;
  let score = 0;
  if (/product|goods|item|sku|catalog|main|large|zoom/.test(url)) score += 3;
  if (/thumb|small|100x|120x|150x/.test(url)) score -= 2;
  if (/\.webp(?:\?|$)|\.jpe?g(?:\?|$)|\.png(?:\?|$)/.test(url)) score += 1;
  return score;
}

function jsonLdImages(html, pageUrl) {
  const images = [];
  const collect = (value, depth = 0) => {
    if (depth > 7 || value == null) return;
    if (Array.isArray(value)) return value.forEach((item) => collect(item, depth + 1));
    if (typeof value !== "object") return;
    const type = Array.isArray(value["@type"]) ? value["@type"].join(" ") : value["@type"];
    if (/product/i.test(String(type || ""))) {
      const raw = value.image;
      const list = Array.isArray(raw) ? raw : [raw];
      list.forEach((entry) => {
        const candidate = typeof entry === "string" ? entry : entry?.url || entry?.contentUrl;
        const url = absoluteImageUrl(candidate, pageUrl);
        if (url) images.push(url);
      });
    }
    Object.values(value).forEach((entry) => collect(entry, depth + 1));
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collect(JSON.parse(match[1].trim())); } catch { /* Ignore malformed page metadata. */ }
  }
  return images;
}

function productImageUrls(html, pageUrl) {
  const images = jsonLdImages(html, pageUrl);
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = htmlAttributes(match[0]);
    if (!/^(?:og:image(?::secure_url)?|twitter:image(?::src)?)$/i.test(attributes.property || attributes.name || "")) continue;
    const url = absoluteImageUrl(attributes.content, pageUrl);
    if (url) images.push(url);
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = htmlAttributes(match[0]);
    if (attributes.rel?.toLocaleLowerCase() !== "image_src") continue;
    const url = absoluteImageUrl(attributes.href, pageUrl);
    if (url) images.push(url);
  }
  return [...new Set(images)].sort((a, b) => imageUrlScore(b) - imageUrlScore(a)).slice(0, 5);
}

async function fetchWithSafeRedirects(url, options = {}, limit = 2) {
  let current = safeHttpsUrl(url);
  for (let index = 0; current && index <= limit; index += 1) {
    const response = await fetch(current, { ...options, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: current };
    current = absoluteImageUrl(response.headers.get("location"), current);
  }
  throw new Error("UNSAFE_OR_EXCESSIVE_REDIRECT");
}

async function fetchProductPage(source) {
  try {
    const { response, url } = await fetchWithSafeRedirects(source.url, {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 TripPlannerProductImage/1.0" },
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type") || "")) return [];
    const html = (await response.text()).slice(0, 1400000);
    return productImageUrls(html, url).map((imageUrl) => ({ imageUrl, pageUrl: url, sourceTitle: source.title }));
  } catch {
    return [];
  }
}

async function materializeProductImage(candidate) {
  try {
    const { response } = await fetchWithSafeRedirects(candidate.imageUrl, {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.6", "User-Agent": "Mozilla/5.0 TripPlannerProductImage/1.0" },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    const type = String(response.headers.get("content-type") || "").split(";")[0].toLocaleLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return null;
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
    const id = createHash("sha256").update(candidate.imageUrl).digest("hex").slice(0, 20);
    return {
      id,
      url: `data:${type};base64,${Buffer.from(bytes).toString("base64")}`,
      pageUrl: "",
      sourceTitle: cleanText(candidate.sourceTitle, 120) || "網路商品頁",
      kind: "web-product",
    };
  } catch {
    return null;
  }
}

async function findProductImages(sources, { limit = 3, excludeIds = [] } = {}) {
  const excluded = new Set((Array.isArray(excludeIds) ? excludeIds : []).map(String));
  const pages = await Promise.all((Array.isArray(sources) ? sources : []).slice(0, MAX_SOURCE_PAGES).map(fetchProductPage));
  const candidates = pages.flat().filter((candidate, index, list) => list.findIndex((entry) => entry.imageUrl === candidate.imageUrl) === index);
  const images = [];
  for (let offset = 0; offset < candidates.length && images.length < limit; offset += 4) {
    const batch = await Promise.all(candidates.slice(offset, offset + 4).map(materializeProductImage));
    for (const image of batch) {
      if (!image || excluded.has(image.id) || images.some((candidate) => candidate.id === image.id)) continue;
      images.push(image);
      if (images.length >= limit) break;
    }
  }
  return images;
}

function imageSearchPrompt(product, round, strategy = "primary") {
  const roundText = `這是第 ${Number(round) + 1} 輪搜尋`;
  if (strategy === "official") {
    return `搜尋「${product}」的官方商品頁、品牌型錄頁與可信賴零售商商品頁。${roundText}的備援目標是找到可公開讀取、含 Product JSON-LD、og:image 或 twitter:image 的頁面；請優先列出不同網域，避開社群貼文、影片、廣告文章、人物代言圖、比價列表與搜尋結果頁。至少提供 10 個最可能含商品正面圖的來源頁。`;
  }
  if (strategy === "multilingual") {
    return `以繁體中文、商品原文與英文交叉搜尋「${product}」的精確商品頁。${roundText}的備援目標是補齊三張清楚商品圖；請找品牌官網、原產國藥妝或大型零售通路中可直接開啟的獨立商品頁，優先含結構化 Product image 或 og:image 的不同網域，排除社群、影片、廣告與人物圖。至少提供 10 個來源頁。`;
  }
  return `搜尋「${product}」的正確商品頁，優先品牌官網、原產國官方型錄與可信賴大型零售商。需要三張可公開讀取的清楚商品正面圖；來源頁應含 Product JSON-LD、og:image 或 twitter:image。排除社群貼文、影片、廣告文章、人物代言圖、比價列表與搜尋結果頁。${roundText}，請提供至少 10 個不同且最相關的商品頁來源。`;
}

async function searchProductSources(apiKey, prompt) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search" }],
      tool_choice: "required",
      include: ["web_search_call.action.sources"],
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      max_output_tokens: 500,
      store: false,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OPENAI_${response.status}`);
  return openAiSources(payload);
}

function interleaveSources(sourceLists) {
  const sources = [];
  const seen = new Set();
  const longest = Math.max(0, ...sourceLists.map((list) => list.length));
  for (let index = 0; index < longest && sources.length < MAX_SOURCE_PAGES; index += 1) {
    for (const list of sourceLists) {
      const source = list[index];
      if (!source || seen.has(source.url)) continue;
      seen.add(source.url);
      sources.push(source);
      if (sources.length >= MAX_SOURCE_PAGES) break;
    }
  }
  return sources;
}

async function searchProductImageCandidates(apiKey, { brand = "", name = "", excludeIds = [], round = 0 } = {}) {
  const product = [cleanText(brand, 100), cleanText(name, 120)].filter(Boolean).join(" ");
  if (!product) return [];
  const primarySources = await searchProductSources(apiKey, imageSearchPrompt(product, round, "primary"));
  const primaryImages = await findProductImages(primarySources, { limit: 3, excludeIds });
  if (primaryImages.length >= 3) return primaryImages;

  const fallbackSourceLists = await Promise.all([
    searchProductSources(apiKey, imageSearchPrompt(product, round + 1, "official")).catch(() => []),
    searchProductSources(apiKey, imageSearchPrompt(product, round + 2, "multilingual")).catch(() => []),
  ]);
  const fallbackImages = await findProductImages(interleaveSources(fallbackSourceLists), {
    limit: 3 - primaryImages.length,
    excludeIds: [...excludeIds, ...primaryImages.map((image) => image.id)],
  });
  return [...primaryImages, ...fallbackImages].slice(0, 3);
}

export { findProductImages, openAiSources, productImageUrls, searchProductImageCandidates };
