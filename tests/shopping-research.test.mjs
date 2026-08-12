import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import shoppingHandler from "../api/shopping.mjs";
import shoppingResearchHandler, { stripSourceReferences } from "../api/shopping-research.mjs";
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
      output: [
        {
          type: "message",
          content: [{
            type: "output_text",
            text: JSON.stringify({
              summaryZh: "日本製的胃腸保健商品。([kowa.example])(https://kowa.example/product?utm_source=openai)",
              featuresZh: ["包裝與用途標示清楚", "適合作為旅行採買辨識資料"],
              usageZh: ["依產品包裝或官方說明使用"],
              cautionsZh: ["若有疾病、用藥或不適，應先詢問醫師或藥師"],
              confidence: 0.91,
            }),
            annotations: [{ type: "url_citation", title: "Kowa product", url: "https://example.com/kowa-product" }],
          }],
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (String(url) === "https://example.com/kowa-product") {
    return new Response('<script type="application/ld+json">{"@type":"Product","image":["https://cdn.example.com/kowa-1.jpg","https://cdn.example.com/kowa-2.jpg","https://cdn.example.com/kowa-3.jpg"]}</script>', {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (String(url).startsWith("https://cdn.example.com/kowa-")) {
    return new Response(new Uint8Array([255, 216, 255, 217]), { status: 200, headers: { "Content-Type": "image/jpeg", "Content-Length": "4" } });
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

test("legacy shopping research uses its private screenshot and returns web product-photo candidates", async () => {
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
      categories: [], tags: [],
      photos: { "photo-1": { dataUrl: "data:image/jpeg;base64,QUJDRA==", createdAt: "2026-08-12T00:00:00.000Z" } },
      items: [{ id: "item-1", brand: "Kowa", name: "新表飛鳴 S 錠", benefits: "幫助整腸", categoryId: "medicine", photoId: "photo-1" }],
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
  assert.equal(response.payload.annotation.summary, "日本製的胃腸保健商品。");
  assert.equal(response.payload.annotation.features[0], "包裝與用途標示清楚");
  assert.deepEqual(response.payload.annotation.sources, []);
  assert.equal(response.payload.annotation.productImages.length, 3);
  assert.equal(response.payload.annotation.productImages.every((image) => image.kind === "web-product"), true);
  assert.doesNotMatch(JSON.stringify(response.payload), /https?:\/\//);
  assert.doesNotMatch(JSON.stringify(response.payload), /test-openai-key/);

  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].model, "gpt-5.6-luna");
  assert.equal(openAiRequests[0].input[1].content[1].detail, "original");
  assert.deepEqual(openAiRequests[0].tools, [{ type: "web_search" }]);
  assert.equal(openAiRequests[0].tool_choice, "required");
  assert.equal(openAiRequests[0].text.format.type, "json_schema");
  assert.equal(openAiRequests[0].store, false);
  assert.doesNotMatch(JSON.stringify(openAiRequests[0]), /image_generation|gpt-image|純白背景商品攝影圖/i);
  assert.match(openAiRequests[0].input[0].content, /禁止出現網址/);
});

test("source-reference cleanup removes markdown links, bare URLs, and domains", () => {
  const dirty = "商品說明。([example.com])(https://example.com/item?utm_source=openai) 更多見 www.brand.example/help";
  const clean = stripSourceReferences(dirty, 200);
  assert.equal(clean, "商品說明。 更多見");
  assert.doesNotMatch(clean, /https|example/i);
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
