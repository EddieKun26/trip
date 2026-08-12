import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import shoppingHandler from "../api/shopping.mjs";
import shoppingResearchHandler, { productImageUrls, safeHttpsUrl } from "../api/shopping-research.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
const openAiRequests = [];
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.OPENAI_API_KEY = "test-openai-key";

globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("api.openai.com/v1/responses")) {
    openAiRequests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            summaryZh: "日本製的胃腸保健商品。",
            featuresZh: ["包裝與用途標示清楚", "適合作為旅行採買辨識資料"],
            usageZh: ["依產品包裝或官方說明使用"],
            cautionsZh: ["若有疾病、用藥或不適，應先詢問醫師或藥師"],
            confidence: 0.91,
          }),
          annotations: [{ type: "url_citation", title: "Kowa 商品資訊", url: "https://example.com/kowa" }],
        }],
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (String(url) === "https://example.com/kowa") {
    return new Response('<html><head><meta property="og:image" content="https://cdn.example.com/kowa-product.jpg"></head></html>', {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
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

async function login() {
  const response = responseMock();
  await memberHandler({ method: "POST", body: { nickname: "阿璋", pin: "1111" }, headers: { "x-forwarded-for": "203.0.113.90" } }, response);
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

test("shopping AI research is member-only, web-grounded, structured, and never exposes the key", async () => {
  store.clear();
  openAiRequests.length = 0;
  const owner = await login();
  const trip = await createTrip(owner.cookie);
  const save = responseMock();
  await shoppingHandler({
    method: "PUT",
    query: { tripId: trip.id },
    url: `/api/shopping?tripId=${trip.id}`,
    headers: { cookie: owner.cookie },
    body: {
      categories: [], tags: [], photos: {},
      items: [{ id: "item-1", brand: "Kowa", name: "新表飛鳴 S 錠", benefits: "幫助整腸", categoryId: "medicine" }],
    },
  }, save);
  assert.equal(save.statusCode, 200);

  const anonymous = responseMock();
  await shoppingResearchHandler({ method: "POST", headers: {}, body: { tripId: trip.id, itemId: "item-1" } }, anonymous);
  assert.equal(anonymous.statusCode, 401);
  assert.equal(openAiRequests.length, 0);

  const response = responseMock();
  await shoppingResearchHandler({ method: "POST", headers: { cookie: owner.cookie }, body: { tripId: trip.id, itemId: "item-1" } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.annotation.features[0], "包裝與用途標示清楚");
  assert.deepEqual(response.payload.annotation.sources, [{ title: "Kowa 商品資訊", url: "https://example.com/kowa" }]);
  assert.deepEqual(response.payload.annotation.productImages, [{
    url: "https://cdn.example.com/kowa-product.jpg",
    pageUrl: "https://example.com/kowa",
    sourceTitle: "Kowa 商品資訊",
  }]);
  assert.doesNotMatch(JSON.stringify(response.payload), /test-openai-key/);

  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].model, "gpt-5.6-luna");
  assert.deepEqual(openAiRequests[0].tools, [{ type: "web_search" }]);
  assert.deepEqual(openAiRequests[0].include, ["web_search_call.action.sources"]);
  assert.equal(openAiRequests[0].text.format.type, "json_schema");
  assert.equal(openAiRequests[0].text.format.strict, true);
  assert.equal(openAiRequests[0].store, false);
  assert.match(openAiRequests[0].input[0].content, /一張正面商品照片/);
  assert.match(openAiRequests[0].input[0].content, /實際開啟.*商品頁/);
});

test("product-image discovery accepts public HTTPS metadata and rejects private destinations", () => {
  assert.equal(safeHttpsUrl("https://brand.example/product"), "https://brand.example/product");
  assert.equal(safeHttpsUrl("http://brand.example/product"), "");
  assert.equal(safeHttpsUrl("https://127.0.0.1/private"), "");
  assert.equal(safeHttpsUrl("https://192.168.1.8/private"), "");
  assert.deepEqual(productImageUrls(`
    <meta name="twitter:image" content="/images/front.webp">
    <meta property="og:image" content="https://cdn.brand.example/front.jpg">
  `, "https://brand.example/products/item"), [
    "https://brand.example/images/front.webp",
    "https://cdn.brand.example/front.jpg",
  ]);
});

test("shopping AI research only accepts an item from the signed-in member's private list", async () => {
  store.clear();
  openAiRequests.length = 0;
  const owner = await login();
  const trip = await createTrip(owner.cookie);
  const response = responseMock();
  await shoppingResearchHandler({ method: "POST", headers: { cookie: owner.cookie }, body: { tripId: trip.id, itemId: "missing" } }, response);
  assert.equal(response.statusCode, 404);
  assert.equal(response.payload.error, "SHOPPING_ITEM_NOT_FOUND");
  assert.equal(openAiRequests.length, 0);
});
