import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import shoppingRecognizeHandler from "../api/shopping-recognize.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
const gatewayRequests = [];
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";

globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("ai-gateway.vercel.sh")) {
    const body = JSON.parse(options.body);
    gatewayRequests.push(body);
    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            brandOriginal: "Kowa",
            brandZh: "興和",
            productNameOriginal: "新ビオフェルミンS錠",
            productNameZh: "新表飛鳴 S 錠",
            benefitsZh: ["幫助整腸", "改善便秘與腹部脹氣"],
            category: "medicine",
            language: "日文",
            confidence: 0.94,
          }),
        },
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
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
    headers: cookie ? { cookie } : {},
  }, response);
  return response;
}

test("shopping recognition is authorized and returns translated structured product data", async () => {
  store.clear();
  gatewayRequests.length = 0;
  const owner = await login("阿璋", "1111", "203.0.113.71");
  const trip = await createTrip(owner.cookie);

  const anonymous = await recognize("", trip.id);
  assert.equal(anonymous.statusCode, 401);
  assert.equal(gatewayRequests.length, 0);

  const response = await recognize(owner.cookie, trip.id);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.details.brand, "興和（Kowa）");
  assert.equal(response.payload.details.name, "新表飛鳴 S 錠（新ビオフェルミンS錠）");
  assert.equal(response.payload.details.categoryId, "medicine");
  assert.equal(response.payload.details.benefits, "幫助整腸、改善便秘與腹部脹氣");
  assert.equal(response.payload.source.language, "日文");
  assert.equal(response.payload.confidence, 0.94);

  assert.equal(gatewayRequests.length, 1);
  assert.equal(gatewayRequests[0].model, "openai/gpt-5.6-terra");
  assert.equal(gatewayRequests[0].messages[1].content[1].image_url.detail, "high");
  assert.equal(gatewayRequests[0].response_format.type, "json_schema");
  assert.match(gatewayRequests[0].messages[0].content, /繁體中文、簡體中文、日文、韓文、英文、泰文/);
});

test("shopping recognition rejects invalid images before calling AI", async () => {
  store.clear();
  gatewayRequests.length = 0;
  const owner = await login("小美", "2222", "203.0.113.72");
  const trip = await createTrip(owner.cookie);
  const response = responseMock();
  await shoppingRecognizeHandler({ method: "POST", body: { tripId: trip.id, imageDataUrl: "not-an-image" }, headers: { cookie: owner.cookie } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "VALID_IMAGE_REQUIRED");
  assert.equal(gatewayRequests.length, 0);
});
