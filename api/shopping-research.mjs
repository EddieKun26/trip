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
4. recommendationScore 是 1 到 5 的「採買參考指數」，只衡量資料完整度、來源一致性、用途清楚度與旅途中辨識實用性，不是療效、安全性或適合個人的評分。資料不足時不得高於 3。
5. recommendationReason 必須說明分數依據；summaryZh 用一至兩句話說明這是什麼商品。
6. 不要捏造售價、成分、用量、功效或來源沒有支持的資訊。`;
}

const responseSchema = {
  type: "object",
  properties: {
    summaryZh: { type: "string" },
    featuresZh: { type: "array", items: { type: "string" } },
    usageZh: { type: "array", items: { type: "string" } },
    cautionsZh: { type: "array", items: { type: "string" } },
    recommendationScore: { type: "integer", minimum: 1, maximum: 5 },
    recommendationReason: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["summaryZh", "featuresZh", "usageZh", "cautionsZh", "recommendationScore", "recommendationReason", "confidence"],
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
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type !== "message") continue;
    for (const part of Array.isArray(item.content) ? item.content : []) {
      for (const annotation of Array.isArray(part?.annotations) ? part.annotations : []) {
        if (annotation?.type !== "url_citation") continue;
        const url = cleanText(annotation.url, 600);
        if (!/^https:\/\//i.test(url) || sources.some((source) => source.url === url)) continue;
        sources.push({ title: cleanText(annotation.title, 140) || "商品資料來源", url });
      }
    }
  }
  return sources.slice(0, 4);
}

function openAiError(status, payload) {
  const type = cleanText(payload?.error?.type || payload?.error?.code, 50)
    .toLocaleUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return new Error(`OPENAI_${status}${type ? `_${type}` : ""}`);
}

function cleanAnnotation(value, sources = []) {
  return {
    summary: cleanText(value?.summaryZh, 500),
    features: cleanList(value?.featuresZh),
    usage: cleanList(value?.usageZh),
    cautions: cleanList(value?.cautionsZh),
    recommendationScore: Math.max(1, Math.min(5, Math.round(Number(value?.recommendationScore) || 1))),
    recommendationReason: cleanText(value?.recommendationReason, 300),
    confidence: Math.max(0, Math.min(1, Number(value?.confidence) || 0)),
    sources,
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
  return cleanAnnotation(parseOpenAiContent(openAiOutputText(payload)), openAiSources(payload));
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

export { cleanAnnotation, openAiCredential, responseSchema };
