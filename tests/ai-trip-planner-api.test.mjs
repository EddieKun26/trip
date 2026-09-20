import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import tripHandler, { maxDuration } from "../api/trip.mjs";
import { PLANNER_MAX_MODEL_CALLS, PLANNER_MODEL_TIMEOUT_MS, buildPlannerContext } from "../lib/ai-trip-planner.mjs";
import { key, plannerFixtures, plannerTrip } from "./fixtures/ai-planner-fixtures.mjs";
import { mockValidPlan, responsesPayload } from "./helpers/ai-planner-mock.mjs";

const store = new Map();
const redisCommands = [];
const openAiRequests = [];
let openAiReplies = [];
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";

globalThis.fetch = async (url, options = {}) => {
  if (String(url) === "https://api.openai.com/v1/responses") {
    openAiRequests.push(JSON.parse(options.body));
    const next = openAiReplies.shift();
    assert.ok(next, "unexpected extra OpenAI call");
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.payload), { status: next.status || 200 });
  }
  const [command, redisKey, value] = JSON.parse(options.body);
  redisCommands.push(command);
  let result = null;
  if (command === "GET") result = store.get(redisKey) ?? null;
  if (command === "SET") { store.set(redisKey, value); result = "OK"; }
  if (command === "INCR") { result = Number(store.get(redisKey) || 0) + 1; store.set(redisKey, String(result)); }
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), { status: 200 });
};

const TRIP_KEY = "tokyo-family-trip:trip:planner-fixture";
const quotaKey = (memberId = "alice") => `tokyo-family-trip:ai-planner:${memberId}:${new Date().toISOString().slice(0, 10)}`;

function reset({ trip = plannerTrip(), env = { AI_PLANNER_MODEL: "gpt-5.6-luna", OPENAI_API_KEY: "sk-test" } } = {}) {
  store.clear();
  redisCommands.length = 0;
  openAiRequests.length = 0;
  openAiReplies = [];
  delete process.env.AI_PLANNER_MODEL;
  delete process.env.AI_PLANNER_REASONING_EFFORT;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_PLANNER_DAILY_LIMIT;
  Object.assign(process.env, env);
  store.set(TRIP_KEY, JSON.stringify(trip));
  for (const [token, member] of [["alice-token", { id: "alice", nickname: "alice" }], ["mallory-token", { id: "mallory", nickname: "mallory" }]]) {
    store.set(`tokyo-family-trip:session:${createHash("sha256").update(token).digest("hex")}`, JSON.stringify(member));
  }
  return trip;
}

function responseMock() {
  return {
    statusCode: 200, headers: {}, payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

async function post(body, { token = "alice-token", id = "planner-fixture" } = {}) {
  const response = responseMock();
  await tripHandler({ method: "POST", query: { id }, url: `/api/trip?id=${id}`, headers: token ? { cookie: `tokyo_trip_session=${token}` } : {}, body }, response);
  return response;
}

const planBody = (selected = [], expectedRevision = 7) => ({ action: "plan", expectedRevision, selected });
const contextFor = (trip, selected) => buildPlannerContext({ trip, places: trip.places.map((place) => audit.reclassify(PlanningGeography.normalizePlace(place), null)), selected });
const noQuota = () => assert.equal(store.has(quotaKey()), false, "quota must not be consumed");

test("API function count stays 12 and the planner lives inside api/trip.mjs", () => {
  const functions = readdirSync(new URL("../api/", import.meta.url)).filter((name) => name.endsWith(".mjs"));
  assert.equal(functions.length, 12);
  assert.ok(!functions.some((name) => /plan/i.test(name)));
});

test("auth: unauthenticated, guest and non-member requests are refused before any AI or quota work", async () => {
  reset({ trip: { ...plannerTrip(), publicRead: true } });
  assert.equal((await post(planBody(), { token: "" })).statusCode, 401);
  assert.equal((await post(planBody(), { token: "unknown-token" })).statusCode, 401);
  const nonMember = await post(planBody(), { token: "mallory-token" });
  assert.equal(nonMember.statusCode, 403);
  assert.equal(openAiRequests.length, 0);
  noQuota();
  assert.equal(store.has(quotaKey("mallory")), false);
  const missing = await post(planBody(), { id: "other-trip" });
  assert.equal(missing.statusCode, 404);
});

test("AI_PLANNER_MODEL missing → 503 before quota and OpenAI, with no OPENAI_MODEL fallback", async () => {
  reset({ env: { OPENAI_API_KEY: "sk-test", OPENAI_MODEL: "gpt-5.6-luna" } });
  const response = await post(planBody());
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, "PLANNER_MODEL_NOT_CONFIGURED");
  assert.equal(openAiRequests.length, 0);
  noQuota();
  reset({ env: { AI_PLANNER_MODEL: "gpt-5.6-luna", AI_PLANNER_REASONING_EFFORT: "extreme", OPENAI_API_KEY: "sk-test" } });
  assert.equal((await post(planBody())).payload.error, "PLANNER_MODEL_NOT_CONFIGURED");
  reset({ env: { AI_PLANNER_MODEL: "gpt-5.6-luna" } });
  assert.equal((await post(planBody())).payload.error, "AI_PLANNER_NOT_CONFIGURED");
  assert.equal(openAiRequests.length, 0);
  noQuota();
  delete process.env.OPENAI_MODEL;
});

test("preflight failures never call the model or consume quota", async () => {
  const F = plannerFixtures().find((entry) => entry.id === "F");
  const cases = [
    [{ action: "plan", selected: [] }, 400, "INVALID_PLANNER_REQUEST"],
    [{ action: "plan", expectedRevision: 7 }, 400, "INVALID_PLANNER_REQUEST"],
    [planBody([], 6), 409, "TRIP_STALE"],
    [planBody([{ ref: "app:fixture-missing", dateOptions: [] }]), 422, "INVALID_PLANNER_PLACE_REF"],
    [planBody([{ ref: "淺草寺", dateOptions: [] }]), 422, "INVALID_PLANNER_PLACE_REF"],
    [planBody([{ ref: key("meiji"), dateOptions: [{ dayKey: "9/30", mode: "none" }] }]), 422, "INVALID_PLANNER_CONSTRAINTS"],
    [planBody([{ ref: key("meiji"), dateOptions: [{ dayKey: "9/22", mode: "exact", exactTime: "18:3" }] }]), 422, "INVALID_PLANNER_CONSTRAINTS"],
    [planBody([{ ref: key("meiji"), dateOptions: [{ dayKey: "9/22", mode: "none" }, { dayKey: "9/22", mode: "none" }] }]), 422, "INVALID_PLANNER_CONSTRAINTS"],
    [planBody([{ ref: key("hotel"), dateOptions: [] }]), 422, "PLANNER_LODGING_SELECTED"],
    [planBody(F.selected), 422, "PLANNER_CONSTRAINTS_INFEASIBLE"],
  ];
  for (const [body, status, code] of cases) {
    reset();
    const response = await post(body);
    assert.equal(response.statusCode, status, `${code}: ${JSON.stringify(response.payload)}`);
    assert.equal(response.payload.error, code);
    assert.equal(openAiRequests.length, 0, code);
    noQuota();
  }
  reset();
  const stale = await post(planBody([], 6));
  assert.deepEqual(stale.payload, { error: "TRIP_STALE", revision: 7 });
  const infeasible = await post(planBody(F.selected));
  assert.equal(infeasible.payload.reason, "CAPACITY_EXCEEDED");
  assert.deepEqual(infeasible.payload.placeKeys, [key("ginza-mitsukoshi")]);
  reset({ trip: plannerTrip({ places: plannerTrip().places.filter((place) => place.kind === "lodging") }) });
  const empty = await post(planBody());
  assert.equal(empty.statusCode, 422);
  assert.equal(empty.payload.error, "NO_PLANNING_CANDIDATES");
  assert.equal(openAiRequests.length, 0);
  noQuota();
});

test("valid plan: one model call, canonical Preview, quota consumed once, and zero Trip/revision/itinerary mutation", async () => {
  const B = plannerFixtures().find((entry) => entry.id === "B");
  const trip = reset({ trip: B.trip, env: { AI_PLANNER_MODEL: "gpt-5.6-terra", AI_PLANNER_REASONING_EFFORT: "high", OPENAI_API_KEY: "sk-test" } });
  const before = store.get(TRIP_KEY);
  const plan = mockValidPlan(contextFor(trip, B.selected));
  plan.days[0].items[0].name = "模型亂寫的名稱";
  openAiReplies = [{ payload: responsesPayload(plan) }];
  const response = await post(planBody(B.selected));
  assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].model, "gpt-5.6-terra");
  assert.deepEqual(openAiRequests[0].reasoning, { effort: "high" });
  assert.equal(openAiRequests[0].store, false);
  assert.equal(openAiRequests[0].text.format.strict, true);
  assert.equal(store.get(quotaKey()), "1");
  assert.equal(store.get(TRIP_KEY), before);
  assert.deepEqual(JSON.parse(store.get(TRIP_KEY)), trip);
  assert.ok(redisCommands.every((command) => ["GET", "MGET", "INCR", "EXPIRE"].includes(command)), redisCommands.join(","));
  const { preview, planning } = response.payload;
  assert.deepEqual(planning, { modelCalls: 1, repaired: false });
  assert.equal(preview.revision, 7);
  assert.deepEqual(preview.days.map((day) => day.dayKey), ["9/22", "9/23", "9/24"]);
  const items = preview.days.flatMap((day) => day.items);
  assert.deepEqual(items.filter((entry) => entry.source === "required").map((entry) => entry.placeKey).sort(), B.selected.map((entry) => entry.ref).sort());
  assert.ok(items.every((entry) => !("candidateRef" in entry)));
  assert.ok(!JSON.stringify(response.payload).includes("模型亂寫的名稱"));
  assert.ok(!JSON.stringify(response.payload).includes("sk-test"));
});

test("repair success uses exactly two calls; repair failure returns PLANNER_INVALID_OUTPUT with no third call", async () => {
  const B = plannerFixtures().find((entry) => entry.id === "B");
  let trip = reset({ trip: B.trip });
  const valid = mockValidPlan(contextFor(trip, B.selected));
  openAiReplies = [{ payload: responsesPayload({ days: [{ dayKey: "9/22", items: [{ candidateRef: "p999", startTime: "10:00", durationMinutes: 60 }] }] }) }, { payload: responsesPayload(valid) }];
  const repaired = await post(planBody(B.selected));
  assert.equal(repaired.statusCode, 200);
  assert.deepEqual(repaired.payload.planning, { modelCalls: 2, repaired: true });
  assert.equal(openAiRequests.length, 2);
  assert.ok(openAiRequests[1].input.at(-1).content[0].text.includes("UNKNOWN_REF"));
  assert.equal(store.get(quotaKey()), "1");

  trip = reset({ trip: B.trip });
  const invalid = { payload: responsesPayload({ days: [] }) };
  openAiReplies = [invalid, invalid, invalid];
  const failed = await post(planBody(B.selected));
  assert.equal(failed.statusCode, 422);
  assert.deepEqual(failed.payload, { error: "PLANNER_INVALID_OUTPUT" });
  assert.equal(openAiRequests.length, 2);
  assert.equal(openAiReplies.length, 1);
  assert.deepEqual(JSON.parse(store.get(TRIP_KEY)), trip);
});

test("upstream failures map to 502/429 without repair, and exhausted daily quota blocks before OpenAI", async () => {
  reset();
  openAiReplies = [{ status: 500, payload: { error: { type: "server_error" } } }];
  let response = await post(planBody());
  assert.equal(response.statusCode, 502);
  assert.equal(response.payload.error, "OPENAI_500_SERVER_ERROR");
  assert.equal(openAiRequests.length, 1);

  reset();
  openAiReplies = [{ status: 429, payload: { error: { type: "insufficient_quota" } } }];
  response = await post(planBody());
  assert.equal(response.statusCode, 429);
  assert.equal(response.payload.error, "OPENAI_429_INSUFFICIENT_QUOTA");

  reset();
  openAiReplies = [new TypeError("network down")];
  response = await post(planBody());
  assert.equal(response.statusCode, 502);
  assert.equal(response.payload.error, "PLANNER_UPSTREAM_FAILED");

  reset();
  store.set(quotaKey(), "20");
  response = await post(planBody());
  assert.equal(response.statusCode, 429);
  assert.equal(response.payload.error, "DAILY_PLANNER_LIMIT");
  assert.equal(openAiRequests.length, 0);
});

test("existing GET/PUT contracts are unchanged and POST without the plan action is still refused", async () => {
  const trip = reset();
  let response = responseMock();
  await tripHandler({ method: "GET", query: { id: trip.id }, headers: { cookie: "tokyo_trip_session=alice-token" } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.revision, 7);
  response = await post({ action: "delete" });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "GET, PUT, POST");
  response = responseMock();
  await tripHandler({ method: "PUT", query: { id: trip.id }, headers: { cookie: "tokyo_trip_session=alice-token" }, body: { ...trip, expectedRevision: 3 } }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(response.payload.error, "REVISION_CONFLICT");
});

// --- Phase 2A.1 hardening ----------------------------------------------------------------------

const baseEnv = { AI_PLANNER_MODEL: "gpt-5.6-luna", AI_PLANNER_REASONING_EFFORT: "high", OPENAI_API_KEY: "sk-test" };

test("AI_PLANNER_DAILY_LIMIT: missing → 20, override → that value, before any OpenAI call", async () => {
  reset({ env: baseEnv });
  store.set(quotaKey(), "19");
  openAiReplies = [{ payload: responsesPayload(mockValidPlan(contextFor(plannerTrip(), []))) }];
  assert.equal((await post(planBody())).statusCode, 200);
  assert.equal(store.get(quotaKey()), "20");
  let response = await post(planBody());
  assert.equal(response.statusCode, 429);
  assert.equal(response.payload.error, "DAILY_PLANNER_LIMIT");
  assert.equal(openAiRequests.length, 1);

  reset({ env: { ...baseEnv, AI_PLANNER_DAILY_LIMIT: "10" } });
  store.set(quotaKey(), "10");
  response = await post(planBody());
  assert.equal(response.statusCode, 429);
  assert.equal(openAiRequests.length, 0);
  reset({ env: { ...baseEnv, AI_PLANNER_DAILY_LIMIT: "10" } });
  store.set(quotaKey(), "9");
  openAiReplies = [{ payload: responsesPayload(mockValidPlan(contextFor(plannerTrip(), []))) }];
  assert.equal((await post(planBody())).statusCode, 200);
});

test("invalid AI_PLANNER_DAILY_LIMIT fails closed: 503, zero quota consumption, zero OpenAI calls", async () => {
  for (const invalid of ["0", "-1", "1.5", "abc", ""]) {
    reset({ env: { ...baseEnv, AI_PLANNER_DAILY_LIMIT: invalid } });
    const response = await post(planBody());
    assert.equal(response.statusCode, 503, invalid);
    assert.equal(response.payload.error, "PLANNER_QUOTA_NOT_CONFIGURED", invalid);
    assert.equal(openAiRequests.length, 0, invalid);
    noQuota();
  }
  delete process.env.AI_PLANNER_DAILY_LIMIT;
});

test("explicit refusal: one call, no repair, safe PLANNER_INVALID_OUTPUT without refusal text; no Trip write", async () => {
  const trip = reset({ env: baseEnv });
  openAiReplies = [
    { payload: { status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "SECRET_REFUSAL_TEXT" }] }] } },
    { payload: responsesPayload(mockValidPlan(contextFor(trip, []))) },
  ];
  const response = await post(planBody());
  assert.equal(response.statusCode, 422);
  assert.deepEqual(response.payload, { error: "PLANNER_INVALID_OUTPUT" });
  assert.equal(openAiRequests.length, 1);
  assert.ok(!JSON.stringify(response.payload).includes("SECRET_REFUSAL_TEXT"));
  assert.equal(store.get(quotaKey()), "1");
  assert.deepEqual(JSON.parse(store.get(TRIP_KEY)), trip);
});

test("incomplete output and interval overlap are repaired once through the API; OpenAI 429/500 are never repaired", async () => {
  const B = plannerFixtures().find((entry) => entry.id === "B");
  let trip = reset({ trip: B.trip, env: baseEnv });
  const valid = mockValidPlan(contextFor(trip, B.selected));
  openAiReplies = [{ payload: responsesPayload("", { status: "incomplete" }) }, { payload: responsesPayload(valid) }];
  let response = await post(planBody(B.selected));
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload.planning, { modelCalls: 2, repaired: true });

  trip = reset({ trip: B.trip, env: baseEnv });
  const overlapping = structuredClone(valid);
  const day = overlapping.days.find((entry) => entry.items.length >= 2);
  day.items[1].startTime = `${day.items[0].startTime.slice(0, 2)}:${day.items[0].startTime.slice(3) === "45" ? "30" : "45"}`;
  openAiReplies = [{ payload: responsesPayload(overlapping) }, { payload: responsesPayload(valid) }];
  response = await post(planBody(B.selected));
  assert.equal(response.statusCode, 200);
  assert.equal(openAiRequests.length, 2);
  assert.ok(openAiRequests[1].input.at(-1).content[0].text.includes("TIME_OVERLAP"));

  for (const [status, type] of [[429, "rate_limit_exceeded"], [500, "server_error"], [503, "service_unavailable"]]) {
    reset({ trip: B.trip, env: baseEnv });
    openAiReplies = [{ status, payload: { error: { type } } }, { payload: responsesPayload(valid) }];
    response = await post(planBody(B.selected));
    assert.equal(response.statusCode, status === 429 ? 429 : 502);
    assert.equal(openAiRequests.length, 1, String(status));
  }
});

test("a 15-minute-step violation is a hard failure: repaired once, and a second violation fails without a third call", async () => {
  const B = plannerFixtures().find((entry) => entry.id === "B");
  const trip = reset({ trip: B.trip, env: baseEnv });
  const bad = mockValidPlan(contextFor(trip, B.selected), { durationMinutes: 50 });
  openAiReplies = [{ payload: responsesPayload(bad) }, { payload: responsesPayload(bad) }, { payload: responsesPayload(bad) }];
  const response = await post(planBody(B.selected));
  assert.equal(response.statusCode, 422);
  assert.equal(response.payload.error, "PLANNER_INVALID_OUTPUT");
  assert.equal(openAiRequests.length, 2);
  assert.ok(openAiRequests[1].input.at(-1).content[0].text.includes("INVALID_DURATION"));
});

/* Phase 2A.4 production readiness. */

test("the planner route declares its serverless duration in both places, and the planner's own worst case fits inside it", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const declared = config.functions["api/trip.mjs"].maxDuration;
  // Same explicit pattern the other AI routes use: vercel.json entry + an export in the route.
  assert.equal(typeof declared, "number");
  assert.equal(declared, maxDuration);
  assert.match(readFileSync(new URL("../api/trip.mjs", import.meta.url), "utf8"), /^export const maxDuration = \d+;$/m);
  // Existing includeFiles must survive the added duration.
  assert.equal(config.functions["api/trip.mjs"].includeFiles, "data/area-geometry/travel-area-boundaries.json");
  // The whole chain must hold: both sequential model calls (worst case, each timing out) finish
  // inside the route's declared duration, which finishes inside the client's planning timeout. So a
  // stuck request always ends as this path's own coded error, never a platform kill or a client
  // giving up first.
  const worstCaseSeconds = (PLANNER_MAX_MODEL_CALLS * PLANNER_MODEL_TIMEOUT_MS) / 1000;
  assert.ok(worstCaseSeconds < declared, `planner worst case ${worstCaseSeconds}s must stay under maxDuration ${declared}s`);
  assert.ok(declared - worstCaseSeconds >= 20, "headroom for preprocessing, validation and the response");
  const clientTimeoutMs = Number(/const PLACE_POOL_PLANNER_TIMEOUT_MS = (\d+);/.exec(readFileSync(new URL("../app.js", import.meta.url), "utf8"))[1]);
  assert.ok(declared * 1000 < clientTimeoutMs, `maxDuration ${declared}s must stay under the client timeout ${clientTimeoutMs}ms`);
});

test("every planner outcome logs one privacy-safe ai-planner record: category, code, ms, model calls, repair and first-pass validity, never trip content or secrets", async () => {
  const B = plannerFixtures().find((entry) => entry.id === "B");
  const info = [];
  const original = console.info;
  console.info = (...args) => info.push(args);
  try {
    // success, no repair
    let trip = reset({ trip: B.trip, env: baseEnv });
    const valid = mockValidPlan(contextFor(trip, B.selected));
    openAiReplies = [{ payload: responsesPayload(valid) }];
    assert.equal((await post(planBody(B.selected))).statusCode, 200);
    // success after exactly one repair
    trip = reset({ trip: B.trip, env: baseEnv });
    openAiReplies = [{ payload: responsesPayload({ days: [{ dayKey: "9/22", items: [{ candidateRef: "p999", startTime: "09:00", durationMinutes: 60 }] }] }) }, { payload: responsesPayload(valid) }];
    assert.equal((await post(planBody(B.selected))).statusCode, 200);
    // upstream failure
    reset({ trip: B.trip, env: baseEnv });
    openAiReplies = [{ status: 500, payload: { error: { type: "server_error" } } }];
    assert.equal((await post(planBody(B.selected))).statusCode, 502);
    // deterministic preflight rejection: zero model calls
    const F = plannerFixtures().find((entry) => entry.id === "F");
    reset({ trip: F.trip, env: baseEnv });
    assert.equal((await post(planBody(F.selected))).statusCode, 422);
    // quota exhausted
    trip = reset({ trip: B.trip, env: baseEnv });
    store.set(quotaKey(), "20");
    assert.equal((await post(planBody(B.selected))).statusCode, 429);
    // missing configuration
    reset({ trip: B.trip, env: {} });
    assert.equal((await post(planBody(B.selected))).statusCode, 503);
  } finally {
    console.info = original;
  }
  const records = info.filter(([label]) => label === "ai-planner").map(([, fields]) => fields);
  assert.equal(records.length, 6);
  assert.ok(records.every((record) => record.label === undefined && Number.isInteger(record.ms) && record.ms >= 0 && Number.isInteger(record.modelCalls)));
  assert.deepEqual(records.map((record) => [record.outcome, record.code, record.status, record.modelCalls]), [
    ["success", "OK", 200, 1],
    ["success", "OK", 200, 2],
    ["upstream_failed", "OPENAI_500_SERVER_ERROR", 502, 1],
    ["preflight_rejected", "PLANNER_CONSTRAINTS_INFEASIBLE", 422, 0],
    ["quota_exhausted", "DAILY_PLANNER_LIMIT", 429, 0],
    ["not_configured", "PLANNER_MODEL_NOT_CONFIGURED", 503, 0],
  ]);
  // First-pass validity and repair are observable, so repair frequency can be monitored.
  assert.deepEqual(records.slice(0, 2).map((record) => [record.firstPassValid, record.repaired]), [[true, false], [false, true]]);
  assert.equal(records[3].reason, "CAPACITY_EXCEEDED");
  // Nothing private: no trip/place text, no dateOptions, no prompt/model output, no credential.
  const serialized = JSON.stringify(records);
  for (const forbidden of ["淺草寺", "澀谷", "app:fixture", "sk-test", "dateOptions", "preview", "startTime", "Authorization"]) {
    assert.ok(!serialized.includes(forbidden), forbidden);
  }
});
