import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import {
  PLANNER_MAX_MODEL_CALLS,
  PlannerError,
  buildPlannerContext,
  buildPlannerPreview,
  callPlannerModel,
  checkPlannerFeasibility,
  normalizePlannerDateOptions,
  placeDetailKey,
  normalizeGoogleMapsUrl,
  normalizedPlaceKind,
  plannerDailyLimit,
  plannerEligiblePlaces,
  plannerModelConfig,
  plannerModelInput,
  plannerRequestPayload,
  plannerTripDays,
  runPlanner,
} from "../lib/ai-trip-planner.mjs";
import { PLANNER_DAILY_CAPACITY, PLANNER_PERIOD_RANGES, plannerOutputSchema, plannerRepairInstruction, plannerSystemInstruction } from "../lib/ai-trip-planner-schema.mjs";
import { planQualityMetrics, timeInPeriod, validatePlannerPlan, windowsOverlap } from "../lib/ai-trip-planner-validator.mjs";
import { key, plannerFixtures, plannerPlace, plannerTrip, tokyoPlaces } from "./fixtures/ai-planner-fixtures.mjs";
import { mockValidPlan, responsesPayload } from "./helpers/ai-planner-mock.mjs";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const appSection = (start, end) => {
  const a = appSource.indexOf(start), b = appSource.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return appSource.slice(a, b);
};
const normalized = (trip) => trip.places.map((place) => audit.reclassify(PlanningGeography.normalizePlace(place), null));
const context = (trip, selected = []) => buildPlannerContext({ trip, places: normalized(trip), selected });
const fixture = (id) => plannerFixtures().find((entry) => entry.id === id);
const refOf = (ctx, slug) => ctx.candidates.find((candidate) => candidate.key === key(slug)).ref;
const rejects = (fn, code, reason) => {
  try { fn(); } catch (error) {
    assert.ok(error instanceof PlannerError, String(error));
    assert.equal(error.code, code);
    if (reason) assert.equal(error.detail.reason, reason);
    return error;
  }
  assert.fail(`expected ${code}`);
};

test("server identity/kind/date helpers match the client's app.js contracts exactly", () => {
  const client = vm.createContext({ URL });
  vm.runInContext(`${appSection("function normalizeGoogleMapsUrl", "function isGoogleMapsUrl")}
    ${appSection("function placeDetailKey", "function resolveDetailPlace")}
    ${appSection("function inferPlaceKind", "function isWithinJapanCoordinates")}
    const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    ${appSection("function buildDateMeta", "let dateMeta")}
    ${appSection("const POOL_PREFERRED_PERIOD_RANGES", "// Normalizes one draft day entry")}
    this.api = { normalizeGoogleMapsUrl, placeDetailKey, normalizedPlaceKind, buildDateMeta, POOL_PREFERRED_PERIOD_RANGES };`, client);
  const api = client.api;
  const samples = [
    { id: "abc", placeId: "g", sourceUrl: "https://maps.google.com/?cid=1", name: "x" },
    { placeId: "ChIJ123", name: "x" },
    { sourceUrl: "https://www.google.com/maps/place/?q=Ｔｏｋｙｏ%20Tower&x=1", name: "x" },
    { sourceUrl: "https://maps.app.goo.gl/abc/", name: "x" },
    { sourceUrl: "not a url", name: "x" },
    { name: "只有名稱" },
  ];
  for (const sample of samples) assert.equal(placeDetailKey(sample), api.placeDetailKey(sample));
  for (const url of ["https://maps.google.com/maps?query_place_id=ABC", "https://goo.gl/maps/x/", "bad"]) assert.equal(normalizeGoogleMapsUrl(url), api.normalizeGoogleMapsUrl(url));
  for (const sample of [{ kind: "lodging" }, { category: "Hotel Gracery" }, { category: "拉麵店" }, { kind: "attraction", category: "購物中心" }, { category: "神社" }, {}]) {
    assert.equal(normalizedPlaceKind(sample), api.normalizedPlaceKind(sample));
  }
  for (const [startDate, endDate] of [["2026-09-20", "2026-09-26"], ["2026-12-30", "2027-01-02"], ["2028-02-27", "2028-03-01"]]) {
    assert.deepEqual(plannerTripDays({ startDate, endDate }).map((day) => [day.dayKey, day.weekday]), JSON.parse(JSON.stringify(api.buildDateMeta(startDate, endDate))));
  }
  assert.deepEqual(PLANNER_PERIOD_RANGES, JSON.parse(JSON.stringify(api.POOL_PREFERRED_PERIOD_RANGES)));
  assert.deepEqual(plannerTripDays({ startDate: "2026-09-24", endDate: "2026-09-22" }), []);
  assert.deepEqual(plannerTripDays({ startDate: "2026-02-30", endDate: "2026-03-02" }), []);
});

test("six preferred period boundaries are inclusive and deterministic", () => {
  const cases = [["00:00", "early_morning"], ["05:59", "early_morning"], ["06:00", "morning"], ["11:29", "morning"], ["11:30", "noon"], ["13:29", "noon"],
    ["13:30", "afternoon"], ["17:29", "afternoon"], ["17:30", "evening"], ["21:59", "evening"], ["22:00", "late_night"], ["23:59", "late_night"]];
  for (const [time, period] of cases) {
    for (const candidate of Object.keys(PLANNER_PERIOD_RANGES)) assert.equal(timeInPeriod(time, candidate), candidate === period, `${time} ${candidate}`);
  }
  assert.equal(timeInPeriod("24:00", "late_night"), false);
  assert.equal(timeInPeriod("9:30", "morning"), false);
});

test("model config requires AI_PLANNER_MODEL, never falls back, and fails closed on unknown effort", () => {
  assert.equal(plannerModelConfig({ OPENAI_MODEL: "gpt-5.6-luna" }), null);
  assert.equal(plannerModelConfig({ AI_PLANNER_MODEL: "  " }), null);
  assert.deepEqual(plannerModelConfig({ AI_PLANNER_MODEL: "gpt-5.6-terra" }), { model: "gpt-5.6-terra", effort: "high" });
  assert.deepEqual(plannerModelConfig({ AI_PLANNER_MODEL: "m", AI_PLANNER_REASONING_EFFORT: "Medium" }), { model: "m", effort: "medium" });
  assert.equal(plannerModelConfig({ AI_PLANNER_MODEL: "m", AI_PLANNER_REASONING_EFFORT: "ultra" }), null);
});

test("candidate refs are opaque, stable in canonical Place order, selected→HARD and unselected→SOFT; lodging never a candidate", () => {
  const trip = plannerTrip();
  const selected = [{ ref: key("gyoen"), dateOptions: [] }, { ref: key("sensoji"), dateOptions: [] }];
  const first = context(trip, selected);
  const second = context(plannerTrip(), [...selected].reverse());
  assert.deepEqual(first.candidates.map((c) => [c.ref, c.key]), second.candidates.map((c) => [c.ref, c.key]));
  assert.ok(first.candidates.every((c, index) => c.ref === `p${String(index + 1).padStart(3, "0")}`));
  assert.deepEqual(first.candidates.map((c) => c.name), tokyoPlaces().filter((p) => p.kind !== "lodging").map((p) => p.name));
  assert.deepEqual(first.candidates.filter((c) => c.required).map((c) => c.key), [key("sensoji"), key("gyoen")]);
  assert.ok(first.candidates.filter((c) => !c.required).every((c) => c.dateOptions.length === 0));
  assert.ok(!first.candidates.some((c) => c.kind === "lodging"));
  const input = JSON.stringify(plannerModelInput(first));
  for (const forbidden of ["app:fixture", "google-fixture", "fixture-", "Synthetic fixture address"]) assert.ok(!input.includes(forbidden), forbidden);
});

test("client refs are validated against canonical eligible Places, never client names; stale/ambiguous/duplicate refs fail", () => {
  const places = tokyoPlaces();
  places.push(plannerPlace("dup-a", "同名", "ginza", 35.67, 139.76), plannerPlace("dup-b", "同名", "ginza", 35.67, 139.76));
  const trip = plannerTrip({ places, itinerary: { "9/22": [{ name: "淺草寺", time: "10:00" }] } });
  let error = rejects(() => context(trip, [{ ref: key("sensoji") }]), "INVALID_PLANNER_PLACE_REF", "UNRESOLVED_REF");
  assert.deepEqual(error.detail.refs, [key("sensoji")]);
  rejects(() => context(trip, [{ ref: key("dup-a") }]), "INVALID_PLANNER_PLACE_REF");
  rejects(() => context(trip, [{ ref: "app:fixture-deleted" }]), "INVALID_PLANNER_PLACE_REF");
  rejects(() => context(trip, [{ ref: "淺草寺" }]), "INVALID_PLANNER_PLACE_REF");
  rejects(() => context(trip, [{ ref: key("meiji") }, { ref: key("meiji") }]), "INVALID_PLANNER_PLACE_REF", "DUPLICATE_REF");
  rejects(() => context(trip, [{ ref: 12 }]), "INVALID_PLANNER_REQUEST");
  // Same stable key on two differently named Places: fail closed, never guessed.
  const shared = [plannerPlace("x", "甲", "ginza", 1, 1, { id: "same" }), plannerPlace("y", "乙", "ginza", 1, 1, { id: "same" }), plannerPlace("z", "丙", "ginza", 1, 1)];
  assert.deepEqual(plannerEligiblePlaces(shared, {}).map((entry) => entry.place.name), ["丙"]);
  error = rejects(() => context(plannerTrip({ places: shared }), [{ ref: "app:same" }]), "INVALID_PLANNER_PLACE_REF");
  assert.equal(error.detail.details[0].reason, "AMBIGUOUS");
  // Client-provided descriptive fields are ignored entirely.
  const ctx = context(plannerTrip(), [{ ref: key("meiji"), name: "假名稱", latitude: 0, area: "假地區", dateOptions: [] }]);
  const meiji = ctx.candidates.find((c) => c.key === key("meiji"));
  assert.equal(meiji.name, "明治神宮");
  assert.equal(meiji.latitude, 35.6764);
});

test("dateOptions normalization: empty/free, day validation, duplicate days, modes, periods and exact time", () => {
  const days = ["9/22", "9/23", "9/24"];
  assert.deepEqual(normalizePlannerDateOptions(undefined, days), []);
  assert.deepEqual(normalizePlannerDateOptions([], days), []);
  assert.deepEqual(normalizePlannerDateOptions([
    { dayKey: "9/24", mode: "preferred", preferredPeriods: ["late_night", "evening"], exactTime: "10:00" },
    { dayKey: "9/22", mode: "none", preferredPeriods: ["morning"], exactTime: "10:00" },
    { dayKey: "9/23", mode: "exact", preferredPeriods: ["morning"], exactTime: "18:30" },
  ], days), [
    { dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null },
    { dayKey: "9/23", mode: "exact", preferredPeriods: [], exactTime: "18:30" },
    { dayKey: "9/24", mode: "preferred", preferredPeriods: ["evening", "late_night"], exactTime: null },
  ]);
  const all = ["early_morning", "morning", "noon", "afternoon", "evening", "late_night"];
  assert.equal(normalizePlannerDateOptions([{ dayKey: "9/22", mode: "preferred", preferredPeriods: all }], days)[0].mode, "none");
  const bad = [
    [{ dayKey: "9/25", mode: "none" }, "INVALID_DAY"],
    [{ dayKey: "2026-09-22", mode: "none" }, "INVALID_DAY"],
    [[{ dayKey: "9/22", mode: "none" }, { dayKey: "9/22", mode: "exact", exactTime: "10:00" }], "DUPLICATE_DAY"],
    [{ dayKey: "9/22", mode: "later" }, "INVALID_MODE"],
    [{ dayKey: "9/22", mode: "preferred", preferredPeriods: [] }, "PREFERRED_PERIODS_REQUIRED"],
    [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["brunch"] }, "INVALID_PERIOD"],
    [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["noon", "noon"] }, "DUPLICATE_PERIOD"],
    [{ dayKey: "9/22", mode: "exact", exactTime: "24:00" }, "INVALID_EXACT_TIME"],
    [{ dayKey: "9/22", mode: "exact", exactTime: "9:30" }, "INVALID_EXACT_TIME"],
    [{ dayKey: "9/22", mode: "exact" }, "INVALID_EXACT_TIME"],
    ["9/22", "DATE_OPTION_INVALID"],
  ];
  for (const [options, reason] of bad) rejects(() => normalizePlannerDateOptions(Array.isArray(options) ? options : [options], days), "INVALID_PLANNER_CONSTRAINTS", reason);
  rejects(() => normalizePlannerDateOptions("9/22", days), "INVALID_PLANNER_CONSTRAINTS", "DATE_OPTIONS_NOT_ARRAY");
});

test("lodging policy: selected lodging is refused explicitly; unselected lodging is silently not a stop", () => {
  const error = rejects(() => context(plannerTrip(), [{ ref: key("hotel") }]), "PLANNER_LODGING_SELECTED");
  assert.deepEqual(error.detail.refs, [key("hotel")]);
  const onlyLodging = plannerTrip({ places: tokyoPlaces().filter((p) => p.kind === "lodging") });
  rejects(() => context(onlyLodging, []), "NO_PLANNING_CANDIDATES");
  rejects(() => context(plannerTrip({ places: [] }), []), "NO_PLANNING_CANDIDATES");
  rejects(() => context(plannerTrip({ startDate: "", endDate: "" }), []), "PLANNER_TRIP_DATES_INVALID");
});

test("existing itinerary is locked context: scheduled Places leave the pool, capacity counts existing Places but not flights", () => {
  const ctx = context(fixture("E").trip, fixture("E").selected);
  assert.ok(!ctx.candidates.some((c) => ["淺草寺", "上野恩賜公園", "東京國立博物館", "明治神宮"].includes(c.name)));
  assert.deepEqual([...ctx.capacityByDay], [["9/22", 2], ["9/23", 4], ["9/24", 5]]);
  const input = plannerModelInput(ctx);
  assert.deepEqual(input.days[0].existingItems.map((item) => [item.order, item.time, item.type, item.name]),
    [[1, "10:00", "attraction", "淺草寺"], [2, "13:00", "attraction", "上野恩賜公園"], [3, "15:00", "attraction", "東京國立博物館"]]);
  assert.deepEqual(input.days[2].existingItems.map((item) => [item.type, item.name, item.time]), [["flight", "回程 NRT→KHH", "17:50"]]);
  assert.equal(input.days[0].existingItems[0].area, "上野・淺草・秋葉原");
});

test("feasibility preflight: capacity, multi-date matching, exact slot conflicts and existing-time collisions", () => {
  const F = fixture("F");
  const infeasible = checkPlannerFeasibility(context(F.trip, F.selected));
  assert.equal(infeasible.feasible, false);
  assert.equal(infeasible.reason, "CAPACITY_EXCEEDED");
  assert.equal(infeasible.placeKeys.length, 1);
  // Same six Places but two may also use 9/23: bipartite matching finds the assignment.
  const flexible = F.selected.map((entry, index) => index < 2 ? { ...entry, dateOptions: [...entry.dateOptions, { dayKey: "9/23", mode: "none" }] } : entry);
  assert.deepEqual(checkPlannerFeasibility(context(F.trip, flexible)), { feasible: true });
  const slot = (slug, options) => ({ ref: key(slug), dateOptions: options });
  const exact = (dayKey, exactTime) => ({ dayKey, mode: "exact", exactTime });
  let result = checkPlannerFeasibility(context(plannerTrip(), [slot("meiji", [exact("9/22", "10:00")]), slot("gyoen", [exact("9/22", "10:00")])]));
  assert.equal(result.reason, "EXACT_TIME_CONFLICT");
  assert.equal(checkPlannerFeasibility(context(plannerTrip(), [slot("meiji", [exact("9/22", "10:00")]), slot("gyoen", [exact("9/22", "10:00"), { dayKey: "9/23", mode: "none" }])])).feasible, true);
  result = checkPlannerFeasibility(context(fixture("E").trip, [slot("skytree", [exact("9/22", "13:00")])]));
  assert.equal(result.reason, "EXACT_TIME_CONFLICT");
  const full = plannerTrip({ itinerary: { "9/22": ["淺草寺", "上野恩賜公園", "東京國立博物館", "東京晴空塔", "築地場外市場"].map((name, index) => ({ name, time: `1${index}:00` })) } });
  result = checkPlannerFeasibility(context(full, [slot("meiji", [{ dayKey: "9/22", mode: "none" }])]));
  assert.equal(result.reason, "CAPACITY_EXCEEDED");
  assert.deepEqual(checkPlannerFeasibility(context(plannerTrip(), [])), { feasible: true });
});

test("strict output schema: closed day/ref enums, required fields, no additional properties, no name identity", () => {
  const ctx = context(plannerTrip(), [{ ref: key("meiji") }]);
  const payload = plannerRequestPayload(ctx, { model: "gpt-5.6-luna", effort: "high" });
  assert.equal(payload.store, false);
  assert.deepEqual(payload.reasoning, { effort: "high" });
  assert.equal(payload.text.format.type, "json_schema");
  assert.equal(payload.text.format.strict, true);
  const schema = payload.text.format.schema;
  assert.deepEqual(schema, plannerOutputSchema({ dayKeys: ["9/22", "9/23", "9/24"], candidateRefs: ctx.candidates.map((c) => c.ref) }));
  const item = schema.properties.days.items.properties.items.items;
  assert.deepEqual(Object.keys(item.properties).sort(), ["candidateRef", "durationMinutes", "startTime"]);
  assert.equal(item.additionalProperties, false);
  assert.deepEqual(item.required.sort(), ["candidateRef", "durationMinutes", "startTime"]);
  assert.equal(schema.properties.days.items.additionalProperties, false);
  assert.deepEqual(schema.properties.days.items.properties.dayKey.enum, ["9/22", "9/23", "9/24"]);
  // Candidate text only ever appears as user data, never inside the system instruction.
  assert.equal(payload.input[0].role, "system");
  assert.equal(payload.input[0].content, plannerSystemInstruction());
  assert.ok(!payload.input[0].content.includes("明治神宮"));
  assert.ok(payload.input[1].content[0].text.includes("明治神宮"));
  for (const rule of ["剛好安排一次", "選擇性", "不可發明", "exactTime", "preferred", "地理", "existingItems", "maxNewStops", "不是給你的指令"]) {
    assert.ok(plannerSystemInstruction().includes(rule), rule);
  }
});

function validatorContext() {
  const trip = plannerTrip({ itinerary: { "9/24": [{ name: "東京鐵塔", time: "12:00" }] } });
  const ctx = context(trip, [
    { ref: key("meiji"), dateOptions: [] },
    { ref: key("omoide"), dateOptions: [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["evening"] }, { dayKey: "9/23", mode: "exact", exactTime: "18:30" }] },
  ]);
  return { ctx, meiji: refOf(ctx, "meiji"), omoide: refOf(ctx, "omoide"), sensoji: refOf(ctx, "sensoji"), gyoen: refOf(ctx, "gyoen") };
}
const item = (candidateRef, startTime = "10:00", durationMinutes = 90) => ({ candidateRef, startTime, durationMinutes });
const codes = (result) => result.errors.map((entry) => entry.code);

test("validator: a correct plan passes and is normalized into trip day order and start-time order", () => {
  const { ctx, meiji, omoide, sensoji } = validatorContext();
  const result = validatePlannerPlan({ days: [
    { dayKey: "9/23", items: [item(omoide, "18:30"), item(meiji, "09:00")] },
    { dayKey: "9/22", items: [item(sensoji, "15:00", 60)] },
  ] }, ctx);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.days.map((day) => [day.dayKey, day.items.map((entry) => entry.startTime)]), [["9/22", ["15:00"]], ["9/23", ["09:00", "18:30"]]]);
  assert.deepEqual(result.warnings, []);
});

test("validator hard failures: unknown/duplicate/missing refs, days, exact time, time format, duration, capacity, collisions", () => {
  const { ctx, meiji, omoide, sensoji, gyoen } = validatorContext();
  const base = (extra) => ({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30"), item(meiji, "09:00"), ...extra] }] });
  const expect = (plan, code) => { const result = validatePlannerPlan(plan, ctx); assert.equal(result.ok, false); assert.ok(codes(result).includes(code), `${code} in ${codes(result)}`); };
  expect(base([item("p999", "12:00")]), "UNKNOWN_REF");
  expect(base([item("淺草寺", "12:00")]), "UNKNOWN_REF");
  expect({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30")] }] }, "MISSING_REQUIRED");
  expect({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30"), item(meiji, "09:00")] }, { dayKey: "9/22", items: [item(meiji, "10:00")] }] }, "REQUIRED_DUPLICATED");
  expect(base([item(sensoji, "12:00"), item(sensoji, "14:00")]), "SOFT_DUPLICATED");
  expect({ days: [{ dayKey: "9/30", items: [item(meiji)] }, { dayKey: "9/23", items: [item(omoide, "18:30")] }] }, "INVALID_DAY");
  expect({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30")] }, { dayKey: "9/23", items: [item(meiji)] }] }, "DUPLICATE_DAY");
  expect({ days: [{ dayKey: "9/24", items: [item(omoide, "18:30"), item(meiji)] }] }, "DISALLOWED_DAY");
  expect({ days: [{ dayKey: "9/23", items: [item(omoide, "18:45"), item(meiji)] }] }, "EXACT_TIME_MISMATCH");
  expect(base([item(sensoji, "25:00")]), "INVALID_START_TIME");
  expect(base([item(sensoji, "9:00")]), "INVALID_START_TIME");
  expect(base([item(sensoji, "12:00", 10)]), "INVALID_DURATION");
  expect(base([item(sensoji, "12:00", 600)]), "INVALID_DURATION");
  expect(base([item(sensoji, "12:00", 90.5)]), "INVALID_DURATION");
  expect(base([item(sensoji, "09:00")]), "DUPLICATE_START_TIME");
  expect({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30"), item(meiji)] }, { dayKey: "9/24", items: [item(sensoji, "12:00")] }] }, "EXISTING_TIME_COLLISION");
  const refs = ctx.candidates.filter((c) => !c.required).slice(0, 4).map((c, index) => item(c.ref, `1${index}:15`));
  expect(base(refs), "DAY_OVER_CAPACITY");
  expect({ days: "nope" }, "SCHEMA_INVALID");
  expect(null, "SCHEMA_INVALID");
  expect(base([{ candidateRef: gyoen }]), "INVALID_START_TIME");
  // Lodging is never in the universe, so a lodging identity can only ever be unknown.
  expect(base([item("新宿王子大飯店", "12:00")]), "UNKNOWN_REF");
});

test("validator: preferred-period miss stays valid and is reported as a server-computed warning only", () => {
  const { ctx, meiji, omoide } = validatorContext();
  const miss = validatePlannerPlan({ days: [{ dayKey: "9/22", items: [item(omoide, "12:00"), item(meiji, "15:00")] }] }, ctx);
  assert.equal(miss.ok, true);
  assert.deepEqual(miss.warnings, [{ code: "PREFERENCE_MISS", candidateRef: omoide, dayKey: "9/22" }]);
  const hit = validatePlannerPlan({ days: [{ dayKey: "9/22", items: [item(omoide, "17:30"), item(meiji, "15:00")] }] }, ctx);
  assert.deepEqual(hit.warnings, []);
  const preview = buildPlannerPreview(ctx, miss);
  const entry = preview.days[0].items.find((i) => i.placeKey === key("omoide"));
  assert.equal(entry.preferenceMiss, true);
  assert.equal(preview.summary.preferenceMissCount, 1);
});

test("preview enrichment uses canonical names/areas, merges locked existing items by time and never exposes refs", () => {
  const E = fixture("E");
  const ctx = context(E.trip, E.selected);
  const plan = mockValidPlan(ctx, { softPerDay: 0 });
  plan.days[2].items.push({ candidateRef: refOf(ctx, "tokyo-tower"), startTime: "11:00", durationMinutes: 60, name: "假的名稱" });
  const validation = validatePlannerPlan(plan, ctx);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors));
  const preview = buildPlannerPreview(ctx, validation);
  assert.deepEqual(preview.days.map((day) => day.dayKey), ["9/22", "9/23", "9/24"]);
  const day22 = preview.days[0].items.map((entry) => [entry.source, entry.name, entry.time || entry.startTime]);
  assert.deepEqual(day22, [["existing", "淺草寺", "10:00"], ["required", "東京晴空塔", "10:15"], ["required", "竹下通", "11:45"],
    ["existing", "上野恩賜公園", "13:00"], ["existing", "東京國立博物館", "15:00"]]);
  const tower = preview.days[2].items.find((entry) => entry.placeKey === key("tokyo-tower"));
  assert.equal(tower.name, "東京鐵塔");
  assert.equal(tower.source, "saved");
  assert.ok(tower.area.length > 0);
  assert.deepEqual(preview.days[2].items.map((entry) => entry.source), ["saved", "existing"]);
  const serialized = JSON.stringify(preview);
  assert.ok(!/"p\d{3}"/.test(serialized));
  assert.ok(!serialized.includes("假的名稱"));
  assert.ok(!serialized.includes("candidateRef"));
  const required = preview.days.flatMap((day) => day.items).filter((entry) => entry.source === "required");
  assert.deepEqual(required.map((entry) => entry.placeKey).sort(), [key("skytree"), key("takeshita")].sort());
  assert.equal(preview.summary.requiredCount, 2);
  assert.equal(preview.days[2].items.at(-1).itemType, "flight");
  assert.equal(preview.summary.savedCount, 1);
});

test("repair: invalid first output → exactly one repair call with errors; valid repair succeeds", async () => {
  const ctx = context(fixture("B").trip, fixture("B").selected);
  const valid = mockValidPlan(ctx);
  const broken = structuredClone(valid);
  broken.days[0].items = broken.days[0].items.slice(1);
  const calls = [];
  const result = await runPlanner(ctx, async ({ repair }) => {
    calls.push(repair);
    return { plan: calls.length === 1 ? broken : valid, latencyMs: 5, usage: null };
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0], null);
  assert.deepEqual(calls[1].previousPlan, broken);
  assert.ok(calls[1].errors.some((entry) => entry.code === "MISSING_REQUIRED"));
  assert.deepEqual(result.attempts.map((attempt) => [attempt.kind, attempt.hardValid]), [["initial", false], ["repair", true]]);
});

test("repair: a still-invalid repair fails and there is never a third model call; unparseable output is also repairable", async () => {
  const ctx = context(fixture("B").trip, fixture("B").selected);
  let calls = 0;
  const failed = await runPlanner(ctx, async () => { calls += 1; return { plan: { days: [{ dayKey: "9/22", items: [item("p999")] }] } }; });
  assert.equal(failed.ok, false);
  assert.equal(calls, PLANNER_MAX_MODEL_CALLS);
  assert.equal(PLANNER_MAX_MODEL_CALLS, 2);
  calls = 0;
  const recovered = await runPlanner(ctx, async ({ repair }) => { calls += 1; return repair ? { plan: mockValidPlan(ctx) } : { plan: null, outputError: "OUTPUT_UNPARSEABLE" }; });
  assert.equal(recovered.ok, true);
  assert.equal(calls, 2);
  assert.equal(recovered.attempts[0].schemaValid, false);
  // Upstream errors are thrown, never repaired.
  calls = 0;
  await assert.rejects(runPlanner(ctx, async () => { calls += 1; throw new PlannerError("OPENAI_500", 502); }), /OPENAI_500/);
  assert.equal(calls, 1);
});

test("callPlannerModel sends store:false strict json_schema with explicit effort and parses output, incomplete, refusal and HTTP errors", async () => {
  const ctx = context(fixture("A").trip, []);
  const requests = [];
  const reply = (payload, status = 200) => async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return new Response(JSON.stringify(payload), { status }); };
  const plan = mockValidPlan(ctx);
  let result = await callPlannerModel({ apiKey: "k", model: "gpt-5.6-luna", effort: "high", context: ctx, fetchImpl: reply(responsesPayload(plan)) });
  assert.deepEqual(result.plan, plan);
  assert.equal(result.usage.output_tokens, 800);
  assert.equal(requests[0].url, "https://api.openai.com/v1/responses");
  assert.equal(requests[0].body.store, false);
  assert.equal(requests[0].body.model, "gpt-5.6-luna");
  assert.deepEqual(requests[0].body.reasoning, { effort: "high" });
  assert.equal(requests[0].body.text.format.strict, true);
  result = await callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, repair: { previousPlan: plan, errors: [{ code: "MISSING_REQUIRED" }] }, fetchImpl: reply(responsesPayload(plan)) });
  assert.equal(requests[1].body.input.length, 4);
  assert.ok(requests[1].body.input[3].content[0].text.includes("MISSING_REQUIRED"));
  result = await callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, fetchImpl: reply(responsesPayload("", { status: "incomplete" })) });
  assert.equal(result.outputError, "OUTPUT_INCOMPLETE");
  result = await callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, fetchImpl: reply({ output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] }) });
  assert.equal(result.outputError, "OUTPUT_REFUSED");
  result = await callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, fetchImpl: reply(responsesPayload("not json")) });
  assert.equal(result.outputError, "OUTPUT_UNPARSEABLE");
  await assert.rejects(callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, fetchImpl: reply({ error: { type: "rate_limit_exceeded" } }, 429) }),
    (error) => error.code === "OPENAI_429_RATE_LIMIT_EXCEEDED" && error.status === 429);
  await assert.rejects(callPlannerModel({ apiKey: "k", model: "m", effort: "high", context: ctx, fetchImpl: async () => { throw new Error("network"); } }),
    (error) => error.code === "PLANNER_UPSTREAM_FAILED" && error.status === 502);
});

test("quality metrics: inclusion, exact/allowed compliance, preference adherence, density and haversine cohesion", () => {
  const C = fixture("C");
  const ctx = context(C.trip, C.selected);
  const omoide = refOf(ctx, "omoide"), meiji = refOf(ctx, "meiji"), gyoen = refOf(ctx, "gyoen"), daibutsu = refOf(ctx, "daibutsu");
  const validation = validatePlannerPlan({ days: [
    { dayKey: "9/22", items: [item(meiji, "09:00"), item(gyoen, "11:00")] },
    { dayKey: "9/24", items: [item(omoide, "12:00"), item(daibutsu, "15:00")] },
  ] }, ctx);
  assert.equal(validation.ok, true);
  const metrics = planQualityMetrics(ctx, validation);
  assert.equal(metrics.selectedInclusion, 1);
  assert.equal(metrics.allowedDateCompliance, 1);
  assert.equal(metrics.exactTimeCompliance, null);
  assert.equal(metrics.preferenceAdherence, 0);
  assert.equal(metrics.scheduledSoftCount, 2);
  assert.equal(metrics.maxDailyTotal, 2);
  assert.ok(metrics.maxLegKm > 40, String(metrics.maxLegKm));
  assert.ok(metrics.perDay[0].meanLegKm < 2);
});

// --- Phase 2A.1 hardening ----------------------------------------------------------------------

test("AI_PLANNER_DAILY_LIMIT: default 20, positive integer override, anything else fails closed", () => {
  assert.equal(plannerDailyLimit({}), 20);
  assert.equal(plannerDailyLimit({ AI_PLANNER_DAILY_LIMIT: "10" }), 10);
  assert.equal(plannerDailyLimit({ AI_PLANNER_DAILY_LIMIT: " 35 " }), 35);
  for (const invalid of ["0", "-1", "1.5", "abc", "", "  ", "1e3", "010", "NaN", "Infinity", "20abc"]) {
    assert.equal(plannerDailyLimit({ AI_PLANNER_DAILY_LIMIT: invalid }), null, JSON.stringify(invalid));
  }
});

test("duration must be an integer 30–240 in 15-minute steps", () => {
  const { ctx, meiji, omoide, sensoji } = validatorContext();
  const withDuration = (duration) => validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 60), item(meiji, "09:00", 60), item(sensoji, "13:00", duration)] }] }, ctx);
  for (const valid of [30, 45, 60, 75, 90, 105, 120, 240]) assert.equal(withDuration(valid).ok, true, String(valid));
  for (const invalid of [37, 50, 92, 241, 15, 255, 0]) {
    const result = withDuration(invalid);
    assert.equal(result.ok, false, String(invalid));
    assert.ok(codes(result).includes("INVALID_DURATION"), String(invalid));
  }
});

test("AI proposed intervals on the same day may not overlap; adjacent intervals are allowed", () => {
  const { ctx, meiji, omoide, sensoji, gyoen } = validatorContext();
  const day23 = (...items) => validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 60), item(meiji, "07:00", 60), ...items] }] }, ctx);
  let result = day23(item(sensoji, "10:00", 120), item(gyoen, "11:00", 60));
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.filter((e) => e.code === "TIME_OVERLAP").map((e) => e.candidateRefs), [[sensoji, gyoen]]);
  assert.equal(day23(item(sensoji, "10:00", 60), item(gyoen, "11:00", 60)).ok, true);
  assert.equal(day23(item(sensoji, "09:00", 60), item(gyoen, "12:00", 60)).ok, true);
  // Exact 18:30 stays exact and its window still participates in overlap checks.
  result = validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 120), item(meiji, "19:00", 60)] }] }, ctx);
  assert.deepEqual(codes(result), ["TIME_OVERLAP"]);
  result = validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:45", 60), item(meiji, "10:00", 60)] }] }, ctx);
  assert.ok(codes(result).includes("EXACT_TIME_MISMATCH"));
  // Different days never overlap each other; overlap and capacity are independent checks.
  assert.equal(validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 120)] }, { dayKey: "9/22", items: [item(meiji, "19:00", 60)] }] }, ctx).ok, true);
  assert.equal(windowsOverlap({ start: 600, end: 660 }, { start: 660, end: 720 }), false);
  assert.equal(windowsOverlap({ start: 600, end: 720 }, { start: 660, end: 720 }), true);
});

test("overlap is enforced even on a light day, and capacity is enforced even without overlap", () => {
  const { ctx, meiji, omoide, sensoji } = validatorContext();
  const light = validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 60), item(meiji, "09:00", 120), item(sensoji, "10:00", 60)] }] }, ctx);
  assert.deepEqual(codes(light), ["TIME_OVERLAP"]);
  const softs = ctx.candidates.filter((c) => !c.required).slice(0, 4).map((c, index) => item(c.ref, `1${index}:00`, 60));
  const full = validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(omoide, "18:30", 60), item(meiji, "07:00", 60), ...softs] }] }, ctx);
  assert.deepEqual(codes(full), ["DAY_OVER_CAPACITY"]);
});

test("existing items: a trusted stored duration forms a window; start-time-only items never get a fabricated duration", () => {
  const trip = plannerTrip({ itinerary: {
    "9/22": [{ name: "淺草寺", time: "10:00", durationMinutes: 120 }],
    "9/23": [{ name: "上野恩賜公園", time: "10:00" }, { type: "flight", flightId: "x", time: "17:00" }],
  } });
  const ctx = context(trip, [{ ref: key("meiji"), dateOptions: [] }]);
  assert.equal(ctx.existingByDay.get("9/22")[0].durationMinutes, 120);
  assert.equal(ctx.existingByDay.get("9/23")[0].durationMinutes, null);
  assert.equal(ctx.existingByDay.get("9/23")[1].durationMinutes, null);
  assert.equal(plannerModelInput(ctx).days[1].existingItems[0].durationMinutes, null);
  const meiji = refOf(ctx, "meiji");
  let result = validatePlannerPlan({ days: [{ dayKey: "9/22", items: [item(meiji, "11:00", 60)] }] }, ctx);
  assert.deepEqual(codes(result), ["EXISTING_TIME_OVERLAP"]);
  assert.equal(validatePlannerPlan({ days: [{ dayKey: "9/22", items: [item(meiji, "12:00", 60)] }] }, ctx).ok, true);
  // No stored duration: 10:30 right after a 10:00 start-only item is not an invented overlap…
  assert.equal(validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(meiji, "10:30", 60)] }] }, ctx).ok, true);
  assert.equal(validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(meiji, "16:30", 60)] }] }, ctx).ok, true);
  // …but the same start remains a conflict, reported once.
  result = validatePlannerPlan({ days: [{ dayKey: "9/23", items: [item(meiji, "10:00", 60)] }] }, ctx);
  assert.deepEqual(codes(result), ["EXISTING_TIME_COLLISION"]);
  result = validatePlannerPlan({ days: [{ dayKey: "9/22", items: [item(meiji, "10:00", 60)] }] }, ctx);
  assert.deepEqual(codes(result), ["EXISTING_TIME_COLLISION"]);
  // Malformed stored durations are not trusted.
  const bad = context(plannerTrip({ itinerary: { "9/22": [{ name: "淺草寺", time: "10:00", durationMinutes: "120" }, { name: "上野恩賜公園", time: "12:00", durationMinutes: -5 }] } }), []);
  assert.deepEqual(bad.existingByDay.get("9/22").map((entry) => entry.durationMinutes), [null, null]);
});

test("preferred periods stay soft after hardening: a miss is valid with a warning and never triggers repair", async () => {
  const { ctx, meiji, omoide } = validatorContext();
  const plan = { days: [{ dayKey: "9/22", items: [item(omoide, "12:00", 60), item(meiji, "15:00", 60)] }] };
  let calls = 0;
  const result = await runPlanner(ctx, async () => { calls += 1; return { plan }; });
  assert.equal(result.ok, true);
  assert.equal(calls, 1);
  assert.deepEqual(result.validation.warnings.map((w) => w.code), ["PREFERENCE_MISS"]);
});

test("repair policy: hard-invalid, schema-invalid, unparseable and incomplete each get exactly one repair; refusal and upstream errors get none", async () => {
  const ctx = context(fixture("B").trip, fixture("B").selected);
  const valid = mockValidPlan(ctx);
  for (const [label, first] of [
    ["hard invalid", { plan: { days: [{ dayKey: "9/22", items: [item("p999")] }] } }],
    ["schema invalid item", { plan: { days: [{ dayKey: "9/22", items: [{ ref: "p001" }] }] } }],
    ["schema invalid top-level", { plan: { itinerary: [] } }],
    ["unparseable", { plan: null, outputError: "OUTPUT_UNPARSEABLE" }],
    ["incomplete", { plan: null, outputError: "OUTPUT_INCOMPLETE" }],
  ]) {
    let calls = 0;
    const result = await runPlanner(ctx, async ({ repair }) => { calls += 1; return repair ? { plan: valid } : first; });
    assert.equal(result.ok, true, label);
    assert.equal(calls, 2, label);
    assert.equal(result.attempts[0].hardValid, false, label);
    assert.equal(result.attempts[1].kind, "repair", label);
  }
  let calls = 0;
  const refused = await runPlanner(ctx, async () => { calls += 1; return { plan: null, outputError: "OUTPUT_REFUSED" }; });
  assert.equal(refused.ok, false);
  assert.equal(refused.refused, true);
  assert.equal(calls, 1);
  for (const code of ["OPENAI_429_RATE_LIMIT_EXCEEDED", "OPENAI_500_SERVER_ERROR", "OPENAI_503", "PLANNER_UPSTREAM_FAILED"]) {
    calls = 0;
    await assert.rejects(runPlanner(ctx, async () => { calls += 1; throw new PlannerError(code, code.includes("429") ? 429 : 502); }), (error) => error.code === code);
    assert.equal(calls, 1, code);
  }
  // Every repairable failure on both calls still stops at two calls.
  for (const failure of [{ plan: null, outputError: "OUTPUT_INCOMPLETE" }, { plan: { days: [] } }, { plan: null, outputError: "OUTPUT_UNPARSEABLE" }]) {
    calls = 0;
    const failed = await runPlanner(ctx, async () => { calls += 1; return failure; });
    assert.equal(failed.ok, false);
    assert.equal(calls, 2);
  }
  calls = 0;
  const repairRefused = await runPlanner(ctx, async ({ repair }) => { calls += 1; return repair ? { plan: null, outputError: "OUTPUT_REFUSED" } : { plan: { days: [] } }; });
  assert.equal(repairRefused.ok, false);
  assert.equal(repairRefused.refused, true);
  assert.equal(calls, 2);
});

test("system instruction states the 15-minute duration step and the no-overlap rule", () => {
  const instruction = plannerSystemInstruction();
  assert.ok(instruction.includes("15 的倍數"));
  assert.ok(instruction.includes("時間區間不可重疊"));
  assert.ok(instruction.includes("剛好接續可以"));
});

test("model-facing daily count is only a hard maximum, never a target; quality semantics are guidance, not new rules", () => {
  const ctx = context(fixture("E").trip, fixture("E").selected);
  const input = plannerModelInput(ctx);
  assert.equal(PLANNER_DAILY_CAPACITY, 5);
  assert.equal(input.maxPlacesPerDay, 5);
  assert.deepEqual(input.days.map((day) => day.maxNewStops), [2, 4, 5]);
  // Internal capacity semantics are unchanged; only the model-facing name/meaning changed.
  assert.deepEqual([...ctx.capacityByDay], [["9/22", 2], ["9/23", 4], ["9/24", 5]]);
  assert.doesNotMatch(JSON.stringify(input), /pace|target|capacityForNewStops/i);
  const instruction = plannerSystemInstruction();
  for (const removed of ["標準步調", "約 5 個地點", "targetPlacesPerFullDay"]) assert.ok(!instruction.includes(removed), removed);
  // No replacement numeric density target of any kind (e.g. "3 個地點", "3–4 個地點").
  assert.doesNotMatch(instruction, /[0-9０-９一二三四五六]\s*(?:[-–~～至到]\s*[0-9０-９一二三四五六]\s*)?個(?:地點|景點|站)/);
  for (const phrase of [
    "只是上限，不是目標", "沒用完的名額", "不要因為還有名額或時段空著就加入地點", // capacity is not a target
    "不是待辦清單", "不安排也是正確的規劃決定", // soft saved Places
    "地理上集中的區塊", "避免不必要的折返", "連貫的半日或一日行程", // geography (guidance only)
    "不要假設移動不花時間", "同一場所、同一建築或同一園區", // transitions (no km→minutes rule)
    "時間錨點與地理錨點", "絕不可移動、修改或取代", // locked anchors
    "航班日的可靠度比行程密度更重要", // flight days
    "不是指定時間", "絕不可為了符合偏好時段而違反任何硬性規則", // preferred period stays soft, exact stays hard
  ]) assert.ok(instruction.includes(phrase), phrase);
  assert.ok(plannerRepairInstruction().includes("不需要為了補回被移除或調整的地點而加入其他選擇性地點"));
  assert.equal(PLANNER_MAX_MODEL_CALLS, 2);
});
