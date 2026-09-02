import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import shoppingRecognizeHandler, { openAiCredential } from "../api/shopping-recognize.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
const openAiRequests = [];
const openAiAuthorizations = [];
let blockProductImages = false;
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.OPENAI_API_KEY = "test-openai-key";

globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("api.openai.com/v1/responses")) {
    const body = JSON.parse(options.body);
    openAiRequests.push(body);
    openAiAuthorizations.push(options.headers.Authorization);
    return new Response(JSON.stringify({
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            brandOriginal: "Kowa",
            brandZh: "興和",
            productNameOriginal: "新ビオフェルミンS錠",
            productNameZh: "新表飛鳴 S 錠",
            benefitsZh: ["幫助整腸", "改善便秘與腹部脹氣"],
            priceAmount: 1280,
            priceCurrency: "JPY",
            category: "medicine",
            summaryZh: "日本興和的整腸商品。[官方資料](https://example.com/kowa)",
            featuresZh: ["含多種乳酸菌"],
            usageZh: ["依商品包裝標示使用"],
            cautionsZh: ["使用前閱讀包裝說明"],
            language: "日文",
            confidence: 0.94,
          }),
          annotations: [{ type: "url_citation", title: "Kowa 商品資訊", url: "https://example.com/kowa" }],
        }],
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (String(url) === "https://example.com/kowa") {
    return new Response('<html><head><script type="application/ld+json">{"@type":"Product","image":["https://cdn.example.com/kowa-front-1.jpg","https://cdn.example.com/kowa-front-2.jpg","https://cdn.example.com/kowa-front-3.jpg"]}</script></head></html>', {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (String(url).startsWith("https://cdn.example.com/kowa-front-")) {
    return new Response(blockProductImages ? "" : new Uint8Array([255, 216, 255, 217]), {
      status: blockProductImages ? 404 : 200,
      headers: { "Content-Type": "image/jpeg", "Content-Length": blockProductImages ? "0" : "4" },
    });
  }

  const [command, key, value, ...flags] = JSON.parse(options.body);
  let result = null;
  if (command === "GET") result = store.get(key) ?? null;
  if (command === "SET") {
    if (flags.includes("NX") && store.has(key)) result = null;
    else {
      store.set(key, value);
      result = "OK";
    }
  }
  if (command === "INCR") {
    result = Number(store.get(key) || 0) + 1;
    store.set(key, String(result));
  }
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), { status: 200, headers: { "Content-Type": "application/json" } });
};

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

async function login(nickname, pin, ip) {
  const response = responseMock();
  await memberHandler({ method: "POST", body: { nickname, pin }, headers: { "x-forwarded-for": ip } }, response);
  assert.equal(response.statusCode, 200);
  return { member: response.payload.member, cookie: response.headers["set-cookie"].split(";")[0] };
}

async function createTrip(cookie) {
  const response = responseMock();
  await tripsHandler({
    method: "POST",
    body: { action: "create", destination: "東京", title: "東京購物", startDate: "2026-09-20", endDate: "2026-09-26" },
    headers: { cookie },
  }, response);
  assert.equal(response.statusCode, 201);
  return response.payload.trip;
}

async function recognize(cookie, tripId) {
  const response = responseMock();
  await shoppingRecognizeHandler({
    method: "POST",
    body: { tripId, imageDataUrl: "data:image/jpeg;base64,QUJDRA==" },
    headers: { ...(cookie ? { cookie } : {}) },
  }, response);
  return response;
}

test("shopping AI health check detects the server-side OpenAI key without exposing it", async () => {
  const response = responseMock();
  await shoppingRecognizeHandler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { status: "ok", aiReady: true });
  assert.doesNotMatch(JSON.stringify(response.payload), /test-openai-key/);
});

test("shopping AI uses only the server-side OpenAI key", () => {
  assert.equal(openAiCredential(), "test-openai-key");
});

test("shopping recognition is authorized and returns translated structured product data", async () => {
  store.clear();
  openAiRequests.length = 0;
  openAiAuthorizations.length = 0;
  const owner = await login("阿璋", "1111", "203.0.113.71");
  const trip = await createTrip(owner.cookie);

  const anonymous = await recognize("", trip.id);
  assert.equal(anonymous.statusCode, 401);
  assert.equal(openAiRequests.length, 0);

  const response = await recognize(owner.cookie, trip.id);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.details.brand, "興和（Kowa）");
  assert.equal(response.payload.details.name, "新表飛鳴 S 錠（新ビオフェルミンS錠）");
  assert.equal(response.payload.details.categoryId, "medicine");
  assert.equal(response.payload.details.benefits, "幫助整腸、改善便秘與腹部脹氣");
  assert.equal(response.payload.details.price, 1280);
  assert.equal(response.payload.details.currency, "JPY");
  assert.equal(response.payload.source.language, "日文");
  assert.equal(response.payload.confidence, 0.94);
  assert.equal(response.payload.annotation.summary, "日本興和的整腸商品。官方資料");
  assert.equal(response.payload.annotation.productImages.length, 3);
  assert.equal(response.payload.annotation.productImages.every((image) => image.url === "data:image/jpeg;base64,/9j/2Q=="), true);
  assert.equal(response.payload.annotation.productImages.every((image) => image.kind === "web-product"), true);
  assert.deepEqual(response.payload.annotation.sources, []);

  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiAuthorizations[0], "Bearer test-openai-key");
  assert.equal(openAiRequests[0].model, "gpt-5.6-luna");
  assert.equal(openAiRequests[0].input[1].content[1].detail, "original");
  assert.equal(openAiRequests[0].text.format.type, "json_schema");
  assert.equal(openAiRequests[0].text.format.strict, true);
  assert.equal(openAiRequests[0].store, false);
  assert.deepEqual(openAiRequests[0].tools, [{ type: "web_search" }]);
  assert.equal(openAiRequests[0].tool_choice, "required");
  assert.deepEqual(openAiRequests[0].include, ["web_search_call.action.sources"]);
  assert.match(openAiRequests[0].input[0].content, /繁體中文、簡體中文、日文、韓文、英文、泰文/);
  assert.doesNotMatch(JSON.stringify(openAiRequests[0]), /image_generation|gpt-image|純白背景/i);
  assert.match(openAiRequests[0].input[0].content, /禁止出現網址/);
  assert.match(openAiRequests[0].input[0].content, /priceAmount/);
});

test("shopping recognition rejects invalid images before calling AI", async () => {
  store.clear();
  openAiRequests.length = 0;
  openAiAuthorizations.length = 0;
  const owner = await login("小美", "2222", "203.0.113.72");
  const trip = await createTrip(owner.cookie);
  const response = responseMock();
  await shoppingRecognizeHandler({ method: "POST", body: { tripId: trip.id, imageDataUrl: "not-an-image" }, headers: { cookie: owner.cookie } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "VALID_IMAGE_REQUIRED");
  assert.equal(openAiRequests.length, 0);
});

test("shopping recognition keeps product data when web product images are unavailable", async () => {
  store.clear();
  openAiRequests.length = 0;
  blockProductImages = true;
  const owner = await login("圖片測試", "2424", "203.0.113.74");
  const trip = await createTrip(owner.cookie);
  const response = await recognize(owner.cookie, trip.id);
  blockProductImages = false;
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.details.name.length > 0, true);
  assert.deepEqual(response.payload.annotation.productImages, []);
  assert.equal(response.payload.imageError, undefined);
});

test("shopping recognition requires a configured OpenAI key before consuming the daily limit", async () => {
  store.clear();
  const owner = await login("小華", "3333", "203.0.113.73");
  const trip = await createTrip(owner.cookie);
  delete process.env.OPENAI_API_KEY;
  const response = await recognize(owner.cookie, trip.id);
  process.env.OPENAI_API_KEY = "test-openai-key";
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, "AI_RECOGNITION_NOT_CONFIGURED");
  assert.equal([...store.keys()].some((key) => key.includes("shopping-recognition")), false);
});
