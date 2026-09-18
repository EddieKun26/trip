// Phase 2A.5 Opening Hours constraint through the Planner lib: normalized availability shared by
// the model input and the validator, conservative preflight, repair, and the POST action=plan
// route (no Google Places call, no Trip write, at most two model calls).
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import tripHandler from "../api/trip.mjs";
import { buildPlannerContext, checkPlannerFeasibility, plannerModelInput, plannerRequestPayload, runPlanner } from "../lib/ai-trip-planner.mjs";
import { plannerSystemInstruction } from "../lib/ai-trip-planner-schema.mjs";
import { planQualityMetrics, validatePlannerPlan } from "../lib/ai-trip-planner-validator.mjs";
import { hoursPlaces, key, plannerFixtures, plannerTrip, weeklyPeriods, withHours } from "./fixtures/ai-planner-fixtures.mjs";
import { mockValidPlan, responsesPayload } from "./helpers/ai-planner-mock.mjs";

const none = (dayKey) => ({ dayKey, mode: "none", preferredPeriods: [], exactTime: null });
const exact = (dayKey, exactTime) => ({ dayKey, mode: "exact", preferredPeriods: [], exactTime });
const preferred = (dayKey, preferredPeriods) => ({ dayKey, mode: "preferred", preferredPeriods, exactTime: null });
const fixture = (id) => plannerFixtures().find((entry) => entry.id === id);

function contextFor(trip, selected = []) {
  const places = trip.places.map((place) => audit.reclassify(PlanningGeography.normalizePlace(place), null));
  return buildPlannerContext({ trip, places, selected });
}
const hoursContext = (selected = [], extra = {}) => contextFor(plannerTrip({ places: hoursPlaces(), ...extra }), selected);
const refOf = (ctx, slug) => ctx.candidates.find((candidate) => candidate.key === key(slug)).ref;
const plan = (ctx, dayKey, items) => ({ days: [{ dayKey, items: items.map(([slug, startTime, durationMinutes]) => ({ candidateRef: refOf(ctx, slug), startTime, durationMinutes })) }] });
const hoursErrors = (validation) => validation.errors.filter((entry) => entry.code === "OUTSIDE_OPENING_HOURS");

test("context: one normalized availability per candidate; model input is compact and never raw Google/persistence data", () => {
  const ctx = hoursContext([{ ref: key("gyoen"), dateOptions: [none("9/22"), none("9/23")] }]);
  const gyoen = ctx.candidates.find((candidate) => candidate.key === key("gyoen"));
  assert.deepEqual(gyoen.openingWindows, { "9/22": [], "9/23": [{ startMinute: 540, endMinute: 960 }], "9/24": [] });
  assert.equal(ctx.candidates.find((candidate) => candidate.key === key("meiji")).openingWindows, null);
  const input = plannerModelInput(ctx);
  const byName = new Map(input.candidates.map((candidate) => [candidate.name, candidate]));
  // Only the candidate's own allowed days; [] = known closed.
  assert.deepEqual(byName.get("新宿御苑").openingHours, { "9/22": [], "9/23": ["09:00-16:00"] });
  assert.equal(byName.get("新宿御苑").hoursUnknown, undefined);
  assert.deepEqual(byName.get("築地場外市場").openingHours, { "9/22": ["11:30-14:00", "17:00-22:00"], "9/23": ["11:30-14:00", "17:00-22:00"], "9/24": ["11:30-14:00", "17:00-22:00"] });
  assert.deepEqual(byName.get("淺草寺").openingHours, { "9/22": ["全天"], "9/23": ["全天"], "9/24": ["全天"] });
  assert.deepEqual(byName.get("新宿黃金街 酒吧").openingHours["9/22"], ["00:00-03:00", "19:00-03:00(+1)"]);
  assert.equal(byName.get("明治神宮").hoursUnknown, true);
  assert.equal(byName.get("明治神宮").openingHours, undefined);
  const text = JSON.stringify(input);
  for (const forbidden of ["regularOpeningPeriods", "periods", "fetchedAt", "weekdayDescriptions", "\"v\":", "placeId", "startMinute"]) assert.ok(!text.includes(forbidden), forbidden);
  // Existing locked items never carry hours.
  const k = fixture("K");
  const kInput = plannerModelInput(contextFor(k.trip, k.selected));
  assert.ok(kInput.days.every((day) => day.existingItems.every((item) => !("openingHours" in item) && !("hoursUnknown" in item))));
});

test("unknown hours: absent, unavailable, malformed, foreign-identity and display-string-only are all unknown, never closed or 24h", () => {
  const base = plannerTrip().places.find((place) => place.id === "fixture-skytree");
  const variants = [
    { ...base },
    withHours(base, [], { status: "unavailable" }),
    withHours(base, [{ open: { day: 9, hour: 0, minute: 0 } }]),
    withHours(base, weeklyPeriods("10:00", "11:00"), { placeId: "google-fixture-other" }),
    { ...base, openingHours: "星期二: 10:00–11:00" },
  ];
  for (const variant of variants) {
    const trip = plannerTrip({ places: [variant] });
    const ctx = contextFor(trip, [{ ref: key("skytree"), dateOptions: [exact("9/22", "03:00")] }]);
    assert.equal(ctx.candidates[0].openingWindows, null);
    assert.equal(plannerModelInput(ctx).candidates[0].hoursUnknown, true);
    assert.equal(checkPlannerFeasibility(ctx).feasible, true);
    assert.deepEqual(hoursErrors(validatePlannerPlan(plan(ctx, "9/22", [["skytree", "03:00", 60]]), ctx)), []);
  }
});

test("validator: whole visit [start, start+duration) inside one window; ends-at-close valid; split gap and closed day invalid", () => {
  const ctx = hoursContext();
  const check = (slug, startTime, duration, dayKey = "9/22") => hoursErrors(validatePlannerPlan(plan(ctx, dayKey, [[slug, startTime, duration]]), ctx));
  // 東京晴空塔 10:00–21:00.
  assert.equal(check("skytree", "09:30", 60).length, 1); // starts before open
  assert.equal(check("skytree", "20:30", 60).length, 1); // ends after close
  assert.deepEqual(check("skytree", "20:00", 60), []); // ends exactly at close
  assert.deepEqual(check("skytree", "12:00", 90), []);
  // 築地 split 11:30–14:00 / 17:00–22:00: start inside but crosses the closed gap.
  const [gap] = check("tsukiji", "13:30", 90);
  assert.deepEqual(gap, { code: "OUTSIDE_OPENING_HOURS", candidateRef: refOf(ctx, "tsukiji"), dayKey: "9/22", startTime: "13:30", endTime: "15:00", openingWindows: ["11:30-14:00", "17:00-22:00"] });
  assert.deepEqual(check("tsukiji", "12:00", 120), []);
  // 新宿御苑 is closed on Tuesday 9/22 (known closed ≠ unknown).
  const [closed] = check("gyoen", "10:00", 60);
  assert.deepEqual(closed.openingWindows, []);
  assert.deepEqual(check("gyoen", "10:00", 60, "9/23"), []);
  // 24h and overnight under the existing item semantics (an item may run past 24:00; no new rule).
  assert.deepEqual(check("sensoji", "23:30", 240), []);
  assert.deepEqual(check("golden-gai", "23:30", 120), []); // 19:00–03:00(+1)
  assert.deepEqual(check("golden-gai", "01:00", 60), []); // carry-in from the previous night
  assert.equal(check("golden-gai", "23:59", 240)[0].endTime, "03:59(+1)");
  assert.equal(check("golden-gai", "03:00", 30).length, 1);
  assert.equal(check("golden-gai", "18:30", 60).length, 1);
  // Unknown hours are never checked.
  assert.deepEqual(check("meiji", "02:00", 60), []);
});

test("validator: soft and required candidates are both hard-checked; existing locked items are ignored", () => {
  const soft = hoursContext();
  assert.equal(soft.candidates.find((candidate) => candidate.key === key("omoide")).required, false);
  assert.equal(hoursErrors(validatePlannerPlan(plan(soft, "9/22", [["omoide", "10:00", 60]]), soft)).length, 1);
  const required = hoursContext([{ ref: key("omoide"), dateOptions: [] }]);
  const result = validatePlannerPlan(plan(required, "9/22", [["omoide", "10:00", 60]]), required);
  assert.equal(result.ok, false);
  assert.equal(hoursErrors(result).length, 1);
  // Fixture K has a locked 思い出横丁 09:00 on 9/23 (opens 17:00): not this validator's concern.
  const k = fixture("K");
  const ctx = contextFor(k.trip, k.selected);
  const valid = validatePlannerPlan({ days: [
    { dayKey: "9/22", items: [{ candidateRef: refOf(ctx, "sensoji"), startTime: "06:30", durationMinutes: 60 }, { candidateRef: refOf(ctx, "meiji"), startTime: "10:00", durationMinutes: 60 }] },
    { dayKey: "9/23", items: [{ candidateRef: refOf(ctx, "golden-gai"), startTime: "22:00", durationMinutes: 90 }] },
  ] }, ctx);
  assert.equal(valid.ok, true, JSON.stringify(valid.errors));
  // Other hard constraints stay separate codes alongside the hours check.
  const mixed = validatePlannerPlan({ days: [{ dayKey: "9/22", items: [
    { candidateRef: refOf(ctx, "sensoji"), startTime: "07:00", durationMinutes: 60 },
    { candidateRef: refOf(ctx, "skytree"), startTime: "09:00", durationMinutes: 60 },
  ] }] }, ctx);
  assert.deepEqual(mixed.errors.map((entry) => entry.code).sort(), ["EXACT_TIME_MISMATCH", "MISSING_REQUIRED", "MISSING_REQUIRED", "OUTSIDE_OPENING_HOURS"]);
  const metrics = planQualityMetrics(ctx, valid);
  assert.equal(metrics.openingHoursChecked, 2);
  assert.equal(metrics.openingHoursCompliance, 1);
});

test("preflight: only a safe proof of impossibility rejects, with OPENING_HOURS_CONFLICT and zero model calls", async () => {
  const reject = (selected, extra) => checkPlannerFeasibility(hoursContext(selected, extra));
  // 東京國立博物館 09:30–17:00: exact start + 30 minutes must fit.
  assert.equal(reject([{ ref: key("tnm"), dateOptions: [exact("9/22", "16:30")] }]).feasible, true);
  const late = reject([{ ref: key("tnm"), dateOptions: [exact("9/22", "16:45")] }]);
  assert.deepEqual(late, { feasible: false, reason: "OPENING_HOURS_CONFLICT", refs: ["p003"], placeKeys: [key("tnm")] });
  assert.equal(reject([{ ref: key("tnm"), dateOptions: [exact("9/22", "08:00")] }]).reason, "OPENING_HOURS_CONFLICT");
  // Closed on the only allowed date; closed on every trip day when dates are free.
  assert.equal(reject([{ ref: key("gyoen"), dateOptions: [none("9/22")] }]).reason, "OPENING_HOURS_CONFLICT");
  assert.equal(reject([{ ref: key("gyoen"), dateOptions: [none("9/22"), none("9/24")] }]).reason, "OPENING_HOURS_CONFLICT");
  // Multi-date with one open date stays feasible; so do free dates when any day is open.
  assert.equal(reject([{ ref: key("gyoen"), dateOptions: [none("9/22"), none("9/23"), none("9/24")] }]).feasible, true);
  assert.equal(reject([{ ref: key("gyoen"), dateOptions: [] }]).feasible, true);
  // Unknown hours keep their edge even at 03:00.
  assert.equal(reject([{ ref: key("meiji"), dateOptions: [exact("9/22", "03:00")] }]).feasible, true);
  // A preferred period outside the hours alone is soft, never infeasible.
  assert.equal(reject([{ ref: key("omoide"), dateOptions: [preferred("9/22", ["morning"])] }]).feasible, true);
  // A day whose only window is shorter than the 30-minute minimum visit is impossible.
  const tiny = plannerTrip().places.map((place) => (place.id === "fixture-skytree" ? withHours(place, weeklyPeriods("10:00", "10:20")) : place));
  assert.equal(checkPlannerFeasibility(contextFor(plannerTrip({ places: tiny }), [{ ref: key("skytree"), dateOptions: [] }])).reason, "OPENING_HOURS_CONFLICT");
  // Existing reasons are preserved.
  const F = fixture("F");
  assert.equal(checkPlannerFeasibility(contextFor(F.trip, F.selected)).reason, "CAPACITY_EXCEEDED");
  assert.equal(reject([{ ref: key("skytree"), dateOptions: [exact("9/22", "12:00")] }, { ref: key("tokyo-tower"), dateOptions: [exact("9/22", "12:00")] }]).reason, "EXACT_TIME_CONFLICT");
  // Fixture P is rejected before any model call.
  const P = fixture("P");
  const ctx = contextFor(P.trip, P.selected);
  const feasibility = checkPlannerFeasibility(ctx);
  assert.equal(feasibility.reason, "OPENING_HOURS_CONFLICT");
  assert.deepEqual(feasibility.placeKeys.sort(), [key("gyoen"), key("tnm")].sort());
});

test("repair: an hours violation gets exactly one repair; a repeated violation fails with at most two calls", async () => {
  const ctx = hoursContext([{ ref: key("tsukiji"), dateOptions: [] }]);
  const bad = plan(ctx, "9/22", [["tsukiji", "13:30", 90]]);
  const good = plan(ctx, "9/22", [["tsukiji", "12:00", 90]]);
  const repairs = [];
  let calls = 0;
  const fixed = await runPlanner(ctx, async ({ repair }) => { calls += 1; if (repair) repairs.push(repair); return { plan: calls === 1 ? bad : good }; });
  assert.equal(fixed.ok, true);
  assert.equal(calls, 2);
  assert.equal(repairs[0].errors[0].code, "OUTSIDE_OPENING_HOURS");
  assert.deepEqual(repairs[0].errors[0].openingWindows, ["11:30-14:00", "17:00-22:00"]);
  calls = 0;
  const failed = await runPlanner(ctx, async () => { calls += 1; return { plan: bad }; });
  assert.equal(failed.ok, false);
  assert.equal(calls, 2);
  assert.deepEqual(failed.attempts.map((attempt) => attempt.errors.map((entry) => entry.code)), [["OUTSIDE_OPENING_HOURS"], ["OUTSIDE_OPENING_HOURS"]]);
});

test("prompt: opening hours are a hard rule; unknown is neither 24h nor closed; earlier rules unchanged; output schema unchanged", () => {
  const instruction = plannerSystemInstruction();
  for (const rule of ["11. 營業時間", "必須完全落在當天列出的其中一個時段內", "不能只讓開始時間落在時段內", "空陣列代表當天公休", "不代表 24 小時營業，也不代表公休",
    "maxPlacesPerDay 與 maxNewStops 都只是上限，不是目標", "required=false 的候選地點是選擇性的", "絕不可為了符合偏好時段而違反任何硬性規則"]) {
    assert.ok(instruction.includes(rule), rule);
  }
  const payload = plannerRequestPayload(hoursContext(), { model: "gpt-5.6-luna", effort: "high" });
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.strict, true);
  assert.deepEqual(Object.keys(payload.text.format.schema.properties.days.items.properties.items.items.properties).sort(), ["candidateRef", "durationMinutes", "startTime"]);
});

// ---------------------------------------------------------------------------------------------
// POST /api/trip action=plan: no Google Places call, no Trip write, ≤ 2 model calls.
// ---------------------------------------------------------------------------------------------
const store = new Map();
const redisCommands = [];
const openAiRequests = [];
const googleCalls = [];
let openAiReplies = [];
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (/googleapis\.com|maps\.google|google\.com\/maps/.test(target)) {
    googleCalls.push(target);
    throw new Error("GOOGLE_CALL_DURING_PLANNING");
  }
  if (target === "https://api.openai.com/v1/responses") {
    openAiRequests.push(JSON.parse(options.body));
    const next = openAiReplies.shift();
    assert.ok(next, "unexpected extra OpenAI call");
    return new Response(JSON.stringify(next), { status: 200 });
  }
  assert.equal(target, "https://redis.test", `unexpected network target ${target}`);
  const [command, redisKey, value] = JSON.parse(options.body);
  redisCommands.push([command, redisKey]);
  let result = null;
  if (command === "GET") result = store.get(redisKey) ?? null;
  if (command === "SET") { store.set(redisKey, value); result = "OK"; }
  if (command === "INCR") { result = Number(store.get(redisKey) || 0) + 1; store.set(redisKey, String(result)); }
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), { status: 200 });
};
const TRIP_KEY = "tokyo-family-trip:trip:planner-fixture";

function reset(trip) {
  store.clear();
  redisCommands.length = 0;
  openAiRequests.length = 0;
  googleCalls.length = 0;
  openAiReplies = [];
  Object.assign(process.env, { AI_PLANNER_MODEL: "gpt-5.6-luna", OPENAI_API_KEY: "sk-test" });
  store.set(TRIP_KEY, JSON.stringify(trip));
  store.set(`tokyo-family-trip:session:${createHash("sha256").update("alice-token").digest("hex")}`, JSON.stringify({ id: "alice", nickname: "alice" }));
}
async function post(selected) {
  const response = { statusCode: 200, headers: {}, payload: null,
    status(code) { this.statusCode = code; return this; }, setHeader(name, value) { this.headers[name] = value; return this; }, json(payload) { this.payload = payload; return this; } };
  await tripHandler({ method: "POST", query: { id: "planner-fixture" }, url: "/api/trip?id=planner-fixture", headers: { cookie: "tokyo_trip_session=alice-token" },
    body: { action: "plan", expectedRevision: 7, selected } }, response);
  return response;
}
const selectedOf = (entry) => entry.selected.map(({ ref, dateOptions }) => ({ ref, dateOptions }));
const tripWrites = () => redisCommands.filter(([command, redisKey]) => command !== "GET" && redisKey === TRIP_KEY);

test("API plan: reads stored structured hours only — zero Google calls, zero Trip writes, one model call", async () => {
  const I = fixture("I");
  reset(I.trip);
  const before = store.get(TRIP_KEY);
  openAiReplies.push(responsesPayload(mockValidPlan(contextFor(I.trip, I.selected))));
  const response = await post(selectedOf(I));
  assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
  assert.equal(googleCalls.length, 0);
  assert.deepEqual(tripWrites(), []);
  assert.equal(store.get(TRIP_KEY), before, "tripStoreUnchanged");
  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].store, false);
  assert.equal(openAiRequests[0].text.format.strict, true);
  const sent = openAiRequests[0].input[1].content[0].text;
  assert.match(sent, /"openingHours":\{"9\/22":\["17:00-24:00"\]/);
  assert.match(sent, /"hoursUnknown":true/);
  assert.ok(!/regularOpeningPeriods|fetchedAt|weekdayDescriptions/.test(sent));
  assert.equal(response.payload.planning.modelCalls, 1);
});

test("API plan: hours preflight rejects with OPENING_HOURS_CONFLICT before quota and before any model call", async () => {
  const P = fixture("P");
  reset(P.trip);
  const response = await post(selectedOf(P));
  assert.equal(response.statusCode, 422);
  assert.equal(response.payload.error, "PLANNER_CONSTRAINTS_INFEASIBLE");
  assert.equal(response.payload.reason, "OPENING_HOURS_CONFLICT");
  assert.deepEqual(response.payload.placeKeys.sort(), [key("gyoen"), key("tnm")].sort());
  assert.equal(openAiRequests.length, 0);
  assert.equal(googleCalls.length, 0);
  assert.ok(!redisCommands.some(([command]) => command === "INCR"), "quota must not be consumed");
  assert.deepEqual(tripWrites(), []);
});

test("API plan: an hours violation is repaired once; a repeated violation is PLANNER_INVALID_OUTPUT with no third call", async () => {
  const J = fixture("J");
  const ctx = contextFor(J.trip, J.selected);
  const good = mockValidPlan(ctx);
  const bad = structuredClone(good);
  const tsukiji = bad.days.flatMap((day) => day.items).find((item) => item.candidateRef === refOf(ctx, "tsukiji"));
  tsukiji.startTime = "13:30"; // crosses the 14:00–17:00 closed gap
  tsukiji.durationMinutes = 90;
  reset(J.trip);
  openAiReplies.push(responsesPayload(bad), responsesPayload(good));
  const repaired = await post(selectedOf(J));
  assert.equal(repaired.statusCode, 200, JSON.stringify(repaired.payload));
  assert.equal(openAiRequests.length, 2);
  const repairText = openAiRequests[1].input.at(-1).content[0].text;
  assert.match(repairText, /OUTSIDE_OPENING_HOURS/);
  assert.match(repairText, /"openingWindows":\["11:30-14:00","17:00-22:00"\]/);
  assert.ok(!/regularOpeningPeriods|periods"|fetchedAt/.test(repairText));
  assert.equal(googleCalls.length, 0);
  assert.deepEqual(tripWrites(), []);

  reset(J.trip);
  openAiReplies.push(responsesPayload(bad), responsesPayload(bad));
  const failed = await post(selectedOf(J));
  assert.equal(failed.statusCode, 422);
  assert.equal(failed.payload.error, "PLANNER_INVALID_OUTPUT");
  assert.equal(openAiRequests.length, 2);
  assert.ok(openAiRequests.every((request) => request.store === false && request.text.format.strict === true));
  assert.deepEqual(tripWrites(), []);
});
