import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import {
  PlannerError,
  buildPlannerContext,
  buildPlannerPreview,
  checkPlannerFeasibility,
  normalizePlannerDateOptions,
  placeDetailKey,
  normalizeGoogleMapsUrl,
  normalizedPlaceKind,
  plannerEligiblePlaces,
  plannerTripDays,
} from "../lib/ai-trip-planner.mjs";
import { PLANNER_DAILY_CAPACITY, PLANNER_PERIOD_RANGES } from "../lib/ai-trip-planner-schema.mjs";
import { planQualityMetrics, timeInPeriod, validatePlannerPlan, windowsOverlap } from "../lib/ai-trip-planner-validator.mjs";
import { key, plannerFixtures, plannerPlace, plannerTrip, tokyoPlaces } from "./fixtures/ai-planner-fixtures.mjs";
import { mockValidPlan, responsesPayload } from "./helpers/ai-planner-mock.mjs";

const appSource = ["../lib/canonical-travel-catalog.js", "../lib/planning-geography.js", "../lib/trip-workspace.js", "../workspace-v3.js", "../app.js"].map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
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
  assert.deepEqual(ctx.existingByDay.get('9/22').map(i=>[i.position,i.time,i.kind,i.name]),[[0,'10:00','attraction','淺草寺'],[1,'13:00','attraction','上野恩賜公園'],[2,'15:00','attraction','東京國立博物館']]);
  assert.equal(ctx.existingByDay.get('9/24')[0].kind,'flight');
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
  const result = validatePlannerPlan(plan, ctx);
  assert.equal(result.ok, true);
  assert.deepEqual(result.warnings.map((w) => w.code), ["PREFERENCE_MISS"]);
});
