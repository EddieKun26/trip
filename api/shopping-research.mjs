import { createHash } from "node:crypto";

const TRIP_PREFIX = "tokyo-family-trip:trip:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const SHOPPING_PREFIX = "tokyo-family-trip:shopping:";
const RESEARCH_LIMIT_PREFIX = "tokyo-family-trip:shopping-research:";
const DAILY_RESEARCH_LIMIT = 30;
const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

function redisConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("SHARED_DATABASE_NOT_CONFIGURED");
  const result = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!result.ok) throw new Error(`DATABASE_${result.status}`);
  const payload = await result.json();
  if (payload.error) throw new Error("DATABASE_COMMAND_FAILED");
  return payload.result;
}

async function readJson(key) {
  const raw = await redisCommand(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const match = String(request.headers.cookie || "")
    .split(";")
    .find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : "";
}

async function authenticatedMember(request) {
  const token = cookieValue(request, "tokyo_trip_session");
  if (!token) return null;
  const digest = createHash("sha256").update(token).digest("hex");
  return readJson(`${SESSION_PREFIX}${digest}`);
}

function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  try {
    return JSON.parse(String(request.body || "{}"));
  } catch {
    return {};
  }
}

function cleanText(value, length) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, length);
}

function cleanList(value, limit = 4, itemLength = 180) {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanText(item, itemLength))
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.toLocaleLowerCase() === item.toLocaleLowerCase()) === index)
    .slice(0, limit);
}

function openAiCredential() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

function categoryLabel(value) {
  return ({ souvenir: "伴手禮", appliance: "家電", daily: "日常用品", medicine: "藥品或保健品", skincare: "保養品" })[value] || "一般商品";
}

function researchPrompt() {
  return `你是旅遊採買清單的商品資料研究助理。請使用網路搜尋，優先查找品牌／製造商官方頁、官方說明書、政府或可信賴零售通路，整理成自然、易讀的繁體中文。

安全與品質規則：
1. 只研究輸入指定的商品；若品牌或品名不足以確認，清楚標示不確定，不可混用同系列其他產品。
2. featuresZh 整理商品特色與適用情境；usageZh 只整理來源可支持的一般使用方式或標示用法，不可提供個人化醫療建議。
3. cautionsZh 整理重要限制、保存或安全提醒。藥品、保健品與保養品不得宣稱保證療效，也不得替代醫師、藥師或產品標示。
4. summaryZh 用一至兩句話說明這是什麼商品，不要重複其餘欄位。
5. 不要捏造售價、成分、用量、功效或來源沒有支持的資訊。
6. 請實際開啟與這個商品完全相符的官方商品頁或可信零售商品頁，並在回答中引用它們；系統會從你查證過的商品頁中尋找一張正面商品照片。不要只引用首頁、搜尋結果頁或泛用文章。`;
}

const responseSchema = {
  type: "object",
  properties: {
    summaryZh: { type: "string" },
    featuresZh: { type: "array", items: { type: "string" } },
    usageZh: { type: "array", items: { type: "string" } },
    cautionsZh: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["summaryZh", "featuresZh", "usageZh", "cautionsZh", "confidence"],
  additionalProperties: false,
};

function parseOpenAiContent(content) {
  if (content && typeof content === "object" && !Array.isArray(content)) return content;
  const text = String(content || "").trim();
  if (!text) throw new Error("AI_EMPTY_RESULT");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        // Fall through to the stable error below.
      }
    }
    throw new Error("AI_INVALID_RESULT");
  }
}

function openAiOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type !== "message") continue;
    for (const part of Array.isArray(item.content) ? item.content : []) {
      if (part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function openAiSources(payload) {
  const sources = [];
  const addSource = (value) => {
    const url = cleanText(value?.url, 600);
    if (!safeHttpsUrl(url) || sources.some((source) => source.url === url)) return;
    sources.push({ title: cleanText(value?.title, 140) || "商品資料來源", url });
  };
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type !== "message") continue;
    for (const part of Array.isArray(item.content) ? item.content : []) {
      for (const annotation of Array.isArray(part?.annotations) ? part.annotations : []) {
        if (annotation?.type === "url_citation") addSource(annotation);
      }
    }
  }
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type === "web_search_call") {
      for (const source of Array.isArray(item?.action?.sources) ? item.action.sources : []) addSource(source);
    }
  }
  return sources.slice(0, 6);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return "";
    const host = url.hostname.toLocaleLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return "";
    if (/^(?:0|10|127|169\.254|172\.(?:1[6-9]|2\d|3[01])|192\.168)(?:\.|$)/.test(host)) return "";
    if (host === "::1" || host === "::" || /^f[cd][0-9a-f:]*$/i.test(host) || /^fe8[0-9a-f:]*$/i.test(host)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function htmlAttributes(tag) {
  const attributes = {};
  for (const match of String(tag || "").matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
    attributes[match[1].toLocaleLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function absoluteImageUrl(value, pageUrl) {
  try {
    return safeHttpsUrl(new URL(decodeHtml(value), pageUrl).href);
  } catch {
    return "";
  }
}

function jsonLdImages(value, found = []) {
  if (!value || found.length >= 5) return found;
  if (typeof value === "string") return found;
  if (Array.isArray(value)) {
    value.forEach((entry) => jsonLdImages(entry, found));
    return found;
  }
  if (typeof value !== "object") return found;
  const image = value.image;
  const add = (candidate) => {
    if (typeof candidate === "string") found.push(candidate);
    else if (candidate && typeof candidate === "object") add(candidate.url || candidate.contentUrl);
  };
  if (Array.isArray(image)) image.forEach(add);
  else add(image);
  Object.values(value).forEach((entry) => jsonLdImages(entry, found));
  return found;
}

function productImageUrls(html, pageUrl) {
  const preferred = [];
  for (const match of String(html || "").matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      preferred.push(...jsonLdImages(JSON.parse(decodeHtml(match[1]))));
    } catch {
      // Invalid third-party JSON-LD is ignored; Open Graph metadata can still supply a photo.
    }
  }
  for (const tag of String(html || "").match(/<meta\b[^>]*>/gi) || []) {
    const attributes = htmlAttributes(tag);
    const key = String(attributes.property || attributes.name || "").toLocaleLowerCase();
    if (["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(key)) preferred.push(attributes.content);
  }
  for (const tag of String(html || "").match(/<link\b[^>]*>/gi) || []) {
    const attributes = htmlAttributes(tag);
    if (String(attributes.rel || "").toLocaleLowerCase() === "image_src") preferred.push(attributes.href);
  }
  return preferred
    .map((value) => absoluteImageUrl(value, pageUrl))
    .filter(Boolean)
    .filter((url, index, list) => list.indexOf(url) === index)
    .slice(0, 3);
}

async function fetchProductPage(source) {
  let pageUrl = safeHttpsUrl(source?.url);
  if (!pageUrl) return [];
  for (let redirect = 0; redirect <= 2; redirect += 1) {
    const result = await fetch(pageUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; TripShoppingResearch/1.0)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (result.status >= 300 && result.status < 400) {
      const nextUrl = absoluteImageUrl(result.headers.get("location"), pageUrl);
      if (!nextUrl) return [];
      pageUrl = nextUrl;
      continue;
    }
    if (!result.ok || !String(result.headers.get("content-type") || "").toLocaleLowerCase().includes("text/html")) return [];
    const html = (await result.text()).slice(0, 1200000);
    return productImageUrls(html, pageUrl).map((url) => ({
      url,
      pageUrl,
      sourceTitle: cleanText(source?.title, 140) || "商品資料來源",
    }));
  }
  return [];
}

async function findProductImages(sources, limit = 1) {
  const images = [];
  for (const source of (Array.isArray(sources) ? sources : []).slice(0, 5)) {
    try {
      const found = await fetchProductPage(source);
      for (const image of found) {
        if (!images.some((candidate) => candidate.url === image.url)) images.push(image);
        if (images.length >= limit) return images;
      }
    } catch {
      // A blocked source page should not prevent text research or trying the next cited page.
    }
  }
  return images;
}

function openAiError(status, payload) {
  const type = cleanText(payload?.error?.type || payload?.error?.code, 50)
    .toLocaleUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return new Error(`OPENAI_${status}${type ? `_${type}` : ""}`);
}

function cleanAnnotation(value, sources = [], productImages = []) {
  return {
    summary: cleanText(value?.summaryZh, 500),
    features: cleanList(value?.featuresZh),
    usage: cleanList(value?.usageZh),
    cautions: cleanList(value?.cautionsZh),
    confidence: Math.max(0, Math.min(1, Number(value?.confidence) || 0)),
    sources: sources.slice(0, 4),
    productImages: (Array.isArray(productImages) ? productImages : []).slice(0, 1),
    researchedAt: new Date().toISOString(),
  };
}

async function callOpenAi(apiKey, item) {
  const product = {
    brand: cleanText(item.brand, 100),
    productName: cleanText(item.name, 100),
    currentImageNotes: cleanText(item.benefits, 500),
    category: categoryLabel(item.categoryId),
  };
  const result = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: researchPrompt() },
        { role: "user", content: `請查證並整理這個商品：\n${JSON.stringify(product)}` },
      ],
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "shopping_product_research",
          strict: true,
          schema: responseSchema,
        },
      },
      max_output_tokens: 2200,
      store: false,
    }),
    signal: AbortSignal.timeout(50000),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw openAiError(result.status, payload);
  const sources = openAiSources(payload);
  const productImages = await findProductImages(sources);
  return cleanAnnotation(parseOpenAiContent(openAiOutputText(payload)), sources, productImages);
}

async function enforceDailyLimit(memberId) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${RESEARCH_LIMIT_PREFIX}${memberId}:${day}`;
  const count = Number(await redisCommand(["INCR", key])) || 0;
  if (count === 1) await redisCommand(["EXPIRE", key, 86400]);
  return count <= DAILY_RESEARCH_LIMIT;
}

export default async function shoppingResearchHandler(request, response) {
  try {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
    }
    const member = await authenticatedMember(request);
    if (!member?.id) return sendJson(response, 401, { error: "AUTH_REQUIRED" });
    const body = requestBody(request);
    const tripId = cleanText(body.tripId, 80);
    const itemId = cleanText(body.itemId, 80);
    if (!tripId || !itemId) return sendJson(response, 400, { error: "PRODUCT_REQUIRED" });
    const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
    if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
    const shopping = await readJson(`${SHOPPING_PREFIX}${member.id}:${tripId}`);
    const item = (Array.isArray(shopping?.items) ? shopping.items : []).find((candidate) => candidate?.id === itemId);
    if (!item?.name) return sendJson(response, 404, { error: "SHOPPING_ITEM_NOT_FOUND" });
    const apiKey = openAiCredential();
    if (!apiKey) return sendJson(response, 503, { error: "AI_RESEARCH_NOT_CONFIGURED" });
    if (!(await enforceDailyLimit(member.id))) return sendJson(response, 429, { error: "DAILY_RESEARCH_LIMIT" });
    const annotation = await callOpenAi(apiKey, item);
    if (!annotation.summary && !annotation.features.length) return sendJson(response, 422, { error: "PRODUCT_RESEARCH_EMPTY" });
    return sendJson(response, 200, { annotation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI_RESEARCH_FAILED";
    console.warn("shopping-research failed", { code: message });
    const status = message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : message.startsWith("OPENAI_429") ? 429 : 502;
    return sendJson(response, status, { error: message });
  }
}

export { cleanAnnotation, findProductImages, openAiCredential, openAiSources, productImageUrls, responseSchema, safeHttpsUrl };
