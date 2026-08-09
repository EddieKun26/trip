import { createHash } from "node:crypto";

const TRIP_PREFIX = "tokyo-family-trip:trip:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const RECOGNITION_LIMIT_PREFIX = "tokyo-family-trip:shopping-recognition:";
const MAX_IMAGE_LENGTH = 500000;
const DAILY_RECOGNITION_LIMIT = 60;
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

function openAiCredential() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

function cleanText(value, length) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, length);
}

function comparableText(value) {
  return cleanText(value, 200).toLocaleLowerCase().replace(/[\s()（）・·\-_/]/g, "");
}

function translatedLabel(chinese, original) {
  const zh = cleanText(chinese, 100);
  const source = cleanText(original, 100);
  if (!zh) return source;
  if (!source || comparableText(zh) === comparableText(source) || comparableText(zh).includes(comparableText(source))) return zh;
  return `${zh}（${source}）`.slice(0, 100);
}

function cleanCategory(value) {
  const category = cleanText(value, 20);
  return ["souvenir", "appliance", "daily", "medicine", "skincare"].includes(category) ? category : "daily";
}

function cleanRecognition(value) {
  const benefits = (Array.isArray(value?.benefitsZh) ? value.benefitsZh : [])
    .map((item) => cleanText(item, 80))
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => comparableText(candidate) === comparableText(item)) === index)
    .slice(0, 4);
  return {
    details: {
      brand: translatedLabel(value?.brandZh, value?.brandOriginal),
      name: translatedLabel(value?.productNameZh, value?.productNameOriginal),
      benefits: benefits.join("、").slice(0, 500),
      categoryId: cleanCategory(value?.category),
    },
    source: {
      brandOriginal: cleanText(value?.brandOriginal, 100),
      productNameOriginal: cleanText(value?.productNameOriginal, 100),
      language: cleanText(value?.language, 40),
    },
    confidence: Math.max(0, Math.min(1, Number(value?.confidence) || 0)),
  };
}

function recognitionPrompt() {
  return `你是多語言商品影像辨識專家。請直接理解整張商品推薦圖，而不是只抄 OCR 字串。圖片可能包含繁體中文、簡體中文、日文、韓文、英文、泰文或其他語言。

目標：找出圖片中唯一主要、可購買的商品，並輸出可供台灣旅客使用的結構化資料。

判讀規則：
1. 品牌必須是製造商或商品品牌；不可把「日本製造」「安心選擇」「推薦」等標語當品牌。
2. 商品名稱必須是包裝或海報上的正式品名；不可把功效、成分、用法、容量、促銷標題或分類名稱當商品名。
3. brandOriginal 與 productNameOriginal 保留圖片中的原文；brandZh 與 productNameZh 以自然的繁體中文表達其名稱與意義。專有名稱無通行譯名時可音譯或保留原文，但不得輸出破碎字元。
4. benefitsZh 最多四項，只整理圖片明確寫出的功效或推薦重點並翻成繁體中文；不要自行提供診斷、療效保證或圖片未提及的醫療主張。
5. category 只能是：souvenir（伴手禮）、appliance（家電）、daily（日常）、medicine（藥品／保健食品）、skincare（保養品）。藥品、漢方、維他命與營養補充品皆歸 medicine。
6. 一張圖只回傳一個主要商品。若圖片文字不清楚，仍應依包裝、商標與版面做最佳整體判斷，並降低 confidence；不可用不連貫的 OCR 碎字填欄位。
7. 所有欄位都必須有值；真的無法辨識品牌時 brandOriginal 與 brandZh 可填空字串。`;
}

const responseSchema = {
  type: "object",
  properties: {
    brandOriginal: { type: "string" },
    brandZh: { type: "string" },
    productNameOriginal: { type: "string" },
    productNameZh: { type: "string" },
    benefitsZh: { type: "array", items: { type: "string" } },
    category: { type: "string", enum: ["souvenir", "appliance", "daily", "medicine", "skincare"] },
    language: { type: "string" },
    confidence: { type: "number" },
  },
  required: ["brandOriginal", "brandZh", "productNameOriginal", "productNameZh", "benefitsZh", "category", "language", "confidence"],
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
        // Fall through to the stable error code below.
      }
    }
    throw new Error("AI_INVALID_RESULT");
  }
}

function openAiError(status, payload) {
  const type = cleanText(payload?.error?.type || payload?.error?.code, 50)
    .toLocaleUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return new Error(`OPENAI_${status}${type ? `_${type}` : ""}`);
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

async function callOpenAi(apiKey, imageDataUrl) {
  const result = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: recognitionPrompt() },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "辨識這張推薦圖中的主要商品，理解品牌、正式品名與圖片明確寫出的功效。",
            },
            { type: "input_image", image_url: imageDataUrl, detail: "original" },
          ],
        },
      ],
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "shopping_product_recognition",
          strict: true,
          schema: responseSchema,
        },
      },
      max_output_tokens: 1200,
      store: false,
    }),
    signal: AbortSignal.timeout(50000),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw openAiError(result.status, payload);
  return parseOpenAiContent(openAiOutputText(payload));
}

async function enforceDailyLimit(memberId) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${RECOGNITION_LIMIT_PREFIX}${memberId}:${day}`;
  const count = Number(await redisCommand(["INCR", key])) || 0;
  if (count === 1) await redisCommand(["EXPIRE", key, 86400]);
  return count <= DAILY_RECOGNITION_LIMIT;
}

export default async function shoppingRecognizeHandler(request, response) {
  try {
    if (request.method === "GET") {
      const apiKey = openAiCredential();
      return sendJson(response, 200, { status: "ok", aiReady: Boolean(apiKey) });
    }
    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
    }
    const member = await authenticatedMember(request);
    if (!member?.id) return sendJson(response, 401, { error: "AUTH_REQUIRED" });
    const body = requestBody(request);
    const tripId = cleanText(body.tripId, 80);
    if (!tripId) return sendJson(response, 400, { error: "TRIP_REQUIRED" });
    const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
    if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
    const imageDataUrl = String(body.imageDataUrl || "");
    if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(imageDataUrl) || imageDataUrl.length > MAX_IMAGE_LENGTH) {
      return sendJson(response, 400, { error: "VALID_IMAGE_REQUIRED" });
    }
    const apiKey = openAiCredential();
    if (!apiKey) return sendJson(response, 503, { error: "AI_RECOGNITION_NOT_CONFIGURED" });
    if (!(await enforceDailyLimit(member.id))) return sendJson(response, 429, { error: "DAILY_RECOGNITION_LIMIT" });
    const result = cleanRecognition(await callOpenAi(apiKey, imageDataUrl));
    if (!result.details.name) return sendJson(response, 422, { error: "PRODUCT_NOT_RECOGNIZED" });
    return sendJson(response, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI_RECOGNITION_FAILED";
    console.warn("shopping-recognize failed", { code: message });
    const status = message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : message.startsWith("OPENAI_429") ? 429 : 502;
    return sendJson(response, status, { error: message });
  }
}

export { cleanRecognition, openAiCredential, responseSchema };
