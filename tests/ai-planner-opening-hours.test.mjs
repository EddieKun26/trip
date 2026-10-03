// Phase 2A.5 Opening Hours constraint through the Planner lib: normalized availability shared by
// the model input and the validator, conservative preflight, repair, and the POST action=plan
// route (no Google Places call, no Trip write, at most two model calls).
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import tripHandler from "../api/trip.mjs";
import { buildPlannerContext, checkPlannerFeasibility } from "../lib/ai-trip-planner.mjs";

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
