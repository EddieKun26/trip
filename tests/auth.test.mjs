import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import tripHandler from "../api/trip.mjs";

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
  if (command === "DEL") {
    result = store.delete(key) ? 1 : 0;
  }
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("four-digit PIN restores one member across devices and protects writes", async () => {
  store.set(
    "tokyo-family-trip:v1",
    JSON.stringify({ places: [], votes: {}, itinerary: {}, members: { "member-old": "弟弟" }, revision: 1 }),
  );

  const firstLogin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "1234" },
      headers: { "x-forwarded-for": "203.0.113.10" },
    },
    firstLogin,
  );
  assert.equal(firstLogin.statusCode, 200);
  assert.equal(firstLogin.payload.member.id, "member-old");
  assert.equal(firstLogin.payload.member.authVersion, 2);

  const secondLogin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "1234" },
      headers: { "x-forwarded-for": "203.0.113.11" },
    },
    secondLogin,
  );
  assert.equal(secondLogin.statusCode, 200);
  assert.equal(secondLogin.payload.member.id, "member-old");

  const wrongPin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "9999" },
      headers: { "x-forwarded-for": "203.0.113.12" },
    },
    wrongPin,
  );
  assert.equal(wrongPin.statusCode, 401);
  assert.equal(wrongPin.payload.error, "INVALID_PIN");

  const cookie = firstLogin.headers["set-cookie"].split(";")[0];
  const authorizedWrite = responseMock();
  await tripHandler(
    {
      method: "PUT",
      headers: { cookie },
      body: { places: [], votes: {}, itinerary: {}, members: {} },
    },
    authorizedWrite,
  );
  assert.equal(authorizedWrite.statusCode, 200);
  assert.equal(authorizedWrite.payload.members["member-old"], "弟弟");

  const guestWrite = responseMock();
  await tripHandler(
    { method: "PUT", headers: {}, body: { places: [], votes: {}, itinerary: {}, members: {} } },
    guestWrite,
  );
  assert.equal(guestWrite.statusCode, 401);
  assert.equal(guestWrite.payload.error, "AUTH_REQUIRED");
});
