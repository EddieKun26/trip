import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import shoppingHandler from "../api/shopping.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";

globalThis.fetch = async (_url, options) => {
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
  if (command === "DEL") result = store.delete(key) ? 1 : 0;
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

async function tripRequest(cookie, body) {
  const response = responseMock();
  await tripsHandler({ method: body ? "POST" : "GET", body, headers: { cookie } }, response);
  return response;
}

async function shoppingRequest(cookie, tripId, method = "GET", body = undefined) {
  const response = responseMock();
  await shoppingHandler({ method, body, headers: cookie ? { cookie } : {}, query: { tripId }, url: `/api/shopping?tripId=${tripId}` }, response);
  return response;
}

test("shopping lists are private per member and per trip", async () => {
  store.clear();
  const owner = await login("小明", "1111", "203.0.113.41");
  const companion = await login("小美", "2222", "203.0.113.42");
  const created = await tripRequest(owner.cookie, { action: "create", destination: "東京", title: "東京旅行", startDate: "2026-09-20", endDate: "2026-09-26" });
  const tripId = created.payload.trip.id;
  await tripRequest(companion.cookie, { action: "join", inviteCode: created.payload.trip.inviteCode });

  const ownerList = {
    categories: [{ id: "souvenir", name: "伴手禮", builtIn: true }],
    tags: [{ id: "tag-mom", name: "媽媽" }],
    photos: {
      "photo-1": { dataUrl: `data:image/jpeg;base64,${"A".repeat(200000)}`, createdAt: "2026-08-09T00:00:00.000Z" },
    },
    items: [{
      id: "item-1", brand: "東京ばな奈", name: "東京香蕉", benefits: "旅行伴手禮", price: "1,280", currency: "jpy", categoryId: "souvenir",
      recipientTagIds: ["tag-mom"], note: "一盒", purchased: false, photoId: "photo-1",
      preferredProductImageUrl: "data:image/jpeg;base64,QUJDRA==",
      aiAnnotation: {
        summary: "東京常見伴手禮。", features: ["獨立包裝"], usage: ["依包裝保存"], cautions: ["留意保存期限"],
        confidence: 0.9,
        sources: [{ title: "官方網站", url: "https://example.com/product" }], researchedAt: "2026-08-12T00:00:00.000Z",
        productImages: [{ url: "data:image/jpeg;base64,QUJDRA==", pageUrl: "", sourceTitle: "品牌官方商品頁", kind: "web-product" }],
      },
    }],
  };
  const saved = await shoppingRequest(owner.cookie, tripId, "PUT", ownerList);
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.payload.scope, "private");
  assert.equal(saved.payload.items[0].name, "東京香蕉");
  assert.equal(saved.payload.items[0].brand, "東京ばな奈");
  assert.equal(saved.payload.items[0].benefits, "旅行伴手禮");
  assert.equal(saved.payload.items[0].price, 1280);
  assert.equal(saved.payload.items[0].currency, "JPY");
  assert.equal(saved.payload.items[0].preferredProductImageUrl, "data:image/jpeg;base64,QUJDRA==");
  assert.equal(saved.payload.items[0].aiAnnotation.productImages[0].sourceTitle, "品牌官方商品頁");
  assert.equal(saved.payload.items[0].aiAnnotation.productImages[0].kind, "web-product");
  assert.deepEqual(saved.payload.items[0].aiAnnotation.sources, []);
  assert.equal(saved.payload.items[0].aiAnnotation.recommendationScore, undefined);

  const companionRead = await shoppingRequest(companion.cookie, tripId);
  assert.equal(companionRead.statusCode, 200);
  assert.deepEqual(companionRead.payload.items, []);
  assert.deepEqual(companionRead.payload.tags, []);

  const companionSaved = await shoppingRequest(companion.cookie, tripId, "PUT", {
    categories: [], tags: [], photos: {}, items: [{ id: "item-2", name: "吹風機", categoryId: "appliance" }],
  });
  assert.equal(companionSaved.statusCode, 200);
  const ownerRead = await shoppingRequest(owner.cookie, tripId);
  assert.deepEqual(ownerRead.payload.items.map((item) => item.name), ["東京香蕉"]);
  assert.equal(ownerRead.payload.photos["photo-1"].dataUrl.startsWith("data:image/jpeg"), true);

  const otherTrip = await tripRequest(companion.cookie, { action: "create", destination: "首爾", title: "首爾旅行", startDate: "2026-10-01", endDate: "2026-10-05" });
  const otherTripRead = await shoppingRequest(companion.cookie, otherTrip.payload.trip.id);
  assert.deepEqual(otherTripRead.payload.items, []);

  await tripRequest(owner.cookie, { action: "leave", tripId });
  assert.equal(store.has(`tokyo-family-trip:shopping:${owner.member.id}:${tripId}`), false);
});

test("shopping data requires a signed-in trip member", async () => {
  store.clear();
  const owner = await login("哥哥", "3333", "203.0.113.43");
  const outsider = await login("路人", "4444", "203.0.113.44");
  const created = await tripRequest(owner.cookie, { action: "create", destination: "大阪", title: "大阪旅行", startDate: "2026-11-01", endDate: "2026-11-05" });
  const tripId = created.payload.trip.id;
  assert.equal((await shoppingRequest("", tripId)).statusCode, 401);
  assert.equal((await shoppingRequest(outsider.cookie, tripId)).statusCode, 403);
});
