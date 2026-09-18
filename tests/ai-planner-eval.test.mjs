import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import { buildPlannerContext, checkPlannerFeasibility, plannerModelInput } from "../lib/ai-trip-planner.mjs";
import { PLANNER_DAILY_CAPACITY } from "../lib/ai-trip-planner-schema.mjs";
import { haversineKm, validatePlannerPlan } from "../lib/ai-trip-planner-validator.mjs";
import { aggregateDiagnostics, percentile, planDiagnostics, preferredPeriodChoice } from "../scripts/ai-planner-eval-diagnostics.mjs";
import { plannerFixtures } from "./fixtures/ai-planner-fixtures.mjs";

const script = fileURLToPath(new URL("../scripts/ai-planner-eval.mjs", import.meta.url));
const source = readFileSync(script, "utf8");
const contextOf = (fixture) => buildPlannerContext({ trip: fixture.trip, places: fixture.trip.places.map((place) => audit.reclassify(PlanningGeography.normalizePlace(place), null)), selected: fixture.selected });

test("eval harness targets only gpt-5.6-luna at high effort, with no model comparison or blind A/B", () => {
  assert.match(source, /const MODEL = "gpt-5\.6-luna";/);
  assert.match(source, /const EFFORT = "high";/);
  assert.doesNotMatch(source, /terra|sol\b|--models|blind/i);
});

test("eval harness refuses a real run without OPENAI_API_KEY and writes nothing", () => {
  const out = mkdtempSync(join(tmpdir(), "planner-eval-"));
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  const result = spawnSync(process.execPath, [script, "--out", join(out, "real")], { env, encoding: "utf8" });
  assert.equal(result.status, 3);
  assert.equal(result.stdout.trim(), "REAL_LUNA_EVAL_BLOCKED_NO_CREDENTIALS");
  assert.equal(existsSync(join(out, "real")), false);
  rmSync(out, { recursive: true, force: true });
});

test("eval harness mock mode: F rejected with zero calls, A–E overall kept separate from G/H coverage, every call's plan and validation preserved, artifacts written", () => {
  const out = mkdtempSync(join(tmpdir(), "planner-eval-"));
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  execFileSync(process.execPath, [script, "--mock", "--runs", "3", "--out", out], { env, encoding: "utf8" });
  const summary = JSON.parse(readFileSync(join(out, "eval-summary.json"), "utf8"));
  assert.deepEqual(summary.preflight, [
    { fixture: "F", rejected: true, reason: "CAPACITY_EXCEEDED", modelCalls: 0, expectedReason: null, reasonMatches: null },
    { fixture: "P", rejected: true, reason: "OPENING_HOURS_CONFLICT", modelCalls: 0, expectedReason: "OPENING_HOURS_CONFLICT", reasonMatches: true },
  ]);
  assert.equal(summary.model, "gpt-5.6-luna");
  assert.equal(summary.effort, "high");
  assert.equal(summary.expectedRuns, 30);
  assert.deepEqual(summary.comparableFixtures, ["A", "B", "C", "D", "E"]);
  assert.deepEqual(summary.coverageFixtures, ["G", "H"]);
  // Opening-hours fixtures (Phase 2A.5) are their own set and never leak into overall/coverage.
  assert.deepEqual(summary.hoursFixtures, ["I", "J", "K"]);
  assert.equal(summary.hours.runs, 9);
  assert.equal(summary.hours.finalHardValidRate, 1);
  assert.equal(summary.hours.openingHoursCompliance, 1);
  assert.ok(summary.hours.openingHoursCheckedItems > 0);
  assert.equal(summary.hours.finalHoursViolationRuns, 0);
  assert.equal(summary.overall.openingHoursCompliance, null, "A–E have no structured hours");
  // overall is the A–E comparable set only; coverage fixtures never leak into it.
  assert.equal(summary.overall.runs, 15);
  assert.equal(summary.coverage.runs, 6);
  assert.equal(summary.overall.diagnostics.density.travelDays, 45);
  assert.equal(summary.coverage.diagnostics.density.travelDays, 21);
  assert.equal(summary.overall.finalHardValidRate, 1);
  assert.equal(summary.overall.firstPassHardValidRate, 0.3333);
  assert.equal(summary.overall.repairRate, 0.6667);
  assert.equal(summary.overall.selectedInclusion, 1);
  assert.equal(summary.overall.durationStepCompliance, 1);
  assert.equal(summary.overall.timeOverlapViolationRuns, 0);
  assert.ok(Number.isFinite(summary.overall.latencyMsP50));
  assert.ok(summary.qualityConcerns.includes("QUALITY_CONCERN_REPAIR_RATE"));
  const runs = JSON.parse(readFileSync(join(out, "eval-runs.json"), "utf8"));
  assert.ok(runs.every((run) => run.calls <= 2 && run.attempts.length === run.calls && "initialHardValid" in run && "finalHardValid" in run));
  // The broken first call stays inspectable before repair: raw response, raw plan, normalized plan, errors.
  const repaired = runs.find((run) => run.fixture === "A" && run.run === 1);
  const [initial, repair] = repaired.attempts;
  assert.equal(repaired.repairAttempted, true);
  assert.equal(initial.kind, "initial");
  assert.equal(initial.hardValid, false);
  assert.deepEqual(initial.errors.map((entry) => entry.code), ["UNKNOWN_REF"]);
  assert.ok(initial.rawPlan.days[0].items.some((item) => item.candidateRef === "p999"));
  assert.equal(JSON.parse(initial.response.outputText).days.length, initial.rawPlan.days.length);
  assert.ok(Array.isArray(initial.normalizedPlan));
  assert.equal(repair.kind, "repair");
  assert.equal(repair.hardValid, true);
  assert.deepEqual(repaired.finalPlan, repair.normalizedPlan);
  assert.ok(runs.filter((run) => run.finalHardValid).every((run) => run.diagnostics && run.finalPlan));
  assert.deepEqual(readdirSync(out).sort(), ["eval-runs.json", "eval-summary.json", "fixture-B-run-1.md", "fixture-C-run-1.md", "fixture-E-run-1.md", "fixture-G-run-1.md", "fixture-H-run-1.md", "fixture-I-run-1.md", "fixture-J-run-1.md", "fixture-K-run-1.md"]);
  const artifact = readFileSync(join(out, "fixture-C-run-1.md"), "utf8");
  for (const section of ["## 硬性條件", "## 行程", "## 指標", "指定 18:30", "時間重疊", "每日密度", "相鄰站距離 vs 空檔"]) assert.ok(artifact.includes(section), section);
  assert.ok(readFileSync(join(out, "fixture-G-run-1.md"), "utf8").includes("偏好時段選擇："));

  // --rescore recomputes the same diagnostics from the stored runs with zero model calls.
  const rescored = join(out, "rescore");
  execFileSync(process.execPath, [script, "--rescore", join(out, "eval-runs.json"), "--out", rescored], { env, encoding: "utf8" });
  const again = JSON.parse(readFileSync(join(rescored, "rescore-summary.json"), "utf8"));
  assert.equal(again.metricsMismatchRuns, 0);
  assert.deepEqual(again.overall.diagnostics, summary.overall.diagnostics);
  assert.deepEqual(again.coverage.diagnostics, summary.coverage.diagnostics);
  rmSync(out, { recursive: true, force: true });
});

test("coverage fixture G genuinely tests preferred-period choice: no exact times, and preferred and non-preferred starts both pass the hard validator", () => {
  const G = plannerFixtures().find((entry) => entry.id === "G");
  assert.equal(G.set, "coverage");
  const ctx = contextOf(G);
  assert.deepEqual(checkPlannerFeasibility(ctx), { feasible: true });
  const required = ctx.candidates.filter((candidate) => candidate.required);
  assert.equal(required.length, 3);
  assert.ok(required.every((candidate) => candidate.dateOptions.length === 1 && candidate.dateOptions[0].mode === "preferred"));
  const plan = (times) => ({ days: required.map((candidate, index) => ({ dayKey: candidate.dateOptions[0].dayKey, items: [{ candidateRef: candidate.ref, startTime: times[index], durationMinutes: 90 }] })) });
  const inPreferred = required.map((candidate) => ({ afternoon: "14:00", morning: "10:00" })[candidate.dateOptions[0].preferredPeriods[0]]);
  const outOfPreferred = required.map((candidate) => ({ afternoon: "10:00", morning: "14:00" })[candidate.dateOptions[0].preferredPeriods[0]]);
  const hit = validatePlannerPlan(plan(inPreferred), ctx);
  const miss = validatePlannerPlan(plan(outOfPreferred), ctx);
  assert.equal(hit.ok, true);
  assert.deepEqual(hit.warnings, []);
  assert.equal(miss.ok, true);
  assert.deepEqual(miss.warnings.map((entry) => entry.code), ["PREFERENCE_MISS", "PREFERENCE_MISS", "PREFERENCE_MISS"]);
  const choice = [...preferredPeriodChoice(ctx, hit), ...preferredPeriodChoice(ctx, miss)];
  assert.equal(choice.length, 6);
  assert.ok(choice.every((entry) => entry.contested));
  assert.deepEqual(choice.map((entry) => entry.hit), [true, true, true, false, false, false]);
});

test("coverage fixture H oversupplies soft candidates across clusters, a distant pair and isolated outliers", () => {
  const H = plannerFixtures().find((entry) => entry.id === "H");
  assert.equal(H.set, "coverage");
  const ctx = contextOf(H);
  const soft = ctx.candidates.filter((candidate) => !candidate.required);
  assert.equal(ctx.days.length, 4);
  assert.equal(ctx.candidates.length - soft.length, 2);
  // More soft candidates than even the hard maximum could hold, let alone a comfortable trip.
  assert.ok(soft.length > ctx.days.length * PLANNER_DAILY_CAPACITY);
  const byKey = new Map(ctx.candidates.map((candidate) => [candidate.key, candidate]));
  const nearestKm = (candidate) => Math.min(...ctx.candidates.filter((other) => other !== candidate).map((other) => haversineKm(candidate, other)));
  for (const placeKey of H.annotations.isolatedKeys) assert.ok(nearestKm(byKey.get(placeKey)) > 5, placeKey);
  const [daibutsu, enoshima] = H.annotations.distantClusterKeys.map((placeKey) => byKey.get(placeKey));
  assert.ok(haversineKm(daibutsu, enoshima) < 6);
  assert.ok(haversineKm(daibutsu, byKey.get("app:fixture-sensoji")) > 40);
  const areas = new Map();
  for (const candidate of soft) areas.set(candidate.area, (areas.get(candidate.area) || 0) + 1);
  assert.ok([...areas.values()].filter((count) => count >= 3).length >= 3, "several local clusters");
  assert.doesNotMatch(JSON.stringify(plannerModelInput(ctx)), /isolated|annotation|cluster/i);
});

test("diagnostics: density and optional fill over every trip day, AI-leg geography, distance vs gap without invented durations, pre-flight gap", () => {
  const E = plannerFixtures().find((entry) => entry.id === "E");
  const ctx = contextOf(E);
  const ref = (slug) => ctx.candidates.find((candidate) => candidate.key === `app:fixture-${slug}`).ref;
  // 9/22 has 3 locked stops (10:00, 13:00, 15:00; no stored durations); 9/24 has the 17:50 flight.
  const validation = validatePlannerPlan({ days: [
    { dayKey: "9/22", items: [{ candidateRef: ref("skytree"), startTime: "16:30", durationMinutes: 90 }] },
    { dayKey: "9/24", items: [
      { candidateRef: ref("takeshita"), startTime: "10:00", durationMinutes: 60 },
      { candidateRef: ref("gyoen"), startTime: "11:00", durationMinutes: 90 },
    ] },
  ] }, ctx);
  assert.equal(validation.ok, true);
  const diagnostics = planDiagnostics(ctx, validation);
  assert.deepEqual(diagnostics.days.map((day) => [day.dayKey, day.lockedPlaceCount, day.requiredCount, day.softCount, day.totalPlaceCount, day.remainingOptionalCapacity, day.hasFlight]), [
    ["9/22", 3, 1, 0, 4, 1, false],
    ["9/23", 1, 0, 0, 1, 4, false], // omitted by the plan, still a travel day
    ["9/24", 0, 1, 1, 2, 4, true],
  ]);
  assert.deepEqual(diagnostics.legs.map((leg) => [leg.dayKey, leg.from, leg.to]), [["9/24", "竹下通", "新宿御苑"]]);
  const day22 = diagnostics.transitions.filter((pair) => pair.dayKey === "9/22");
  // Locked stops have no stored duration: their following gaps stay unknown, never guessed.
  assert.deepEqual(day22.map((pair) => [pair.fromSource, pair.toSource, pair.gapMinutes]), [["locked", "locked", null], ["locked", "locked", null], ["locked", "required", null]]);
  const day24 = diagnostics.transitions.filter((pair) => pair.dayKey === "9/24");
  assert.deepEqual(day24.map((pair) => [pair.toSource, pair.previousEnd, pair.nextStart, pair.gapMinutes]), [["soft", "11:00", "11:00", 0], ["flight", "12:30", "17:50", 320]]);
  assert.ok(day24[0].distanceKm > 0);
  assert.equal(day24[1].distanceKm, null);

  const aggregate = aggregateDiagnostics([{ fixture: "E", run: 1, diagnostics }]);
  assert.equal(aggregate.density.travelDays, 3);
  assert.equal(aggregate.density.meanStopsPerDay, 2.33);
  assert.equal(aggregate.density.fiveStopDayRate, 0);
  assert.equal(aggregate.density.scheduledSoft, 1);
  assert.equal(aggregate.density.remainingOptionalCapacity, 9);
  assert.equal(aggregate.density.optionalFillRatio, 0.1111);
  assert.equal(aggregate.transitions.pairsWithDistanceAndGap, 1);
  assert.equal(aggregate.transitions.positiveDistanceZeroGapCount, 1);
  assert.equal(aggregate.transitions.positiveDistanceZeroGapRate, 1);
  assert.equal(aggregate.transitions.distanceWhereGapAtMost15.n, 1);
  assert.deepEqual(aggregate.transitions.preFlightGaps.map((pair) => [pair.fixture, pair.run, pair.gapMinutes]), [["E", 1, 320]]);
  // Zero remaining optional capacity and no runs are handled without division errors.
  const full = { softCandidateCount: 0, days: [{ dayKey: "9/22", hasFlight: false, lockedPlaceCount: 5, requiredCount: 0, softCount: 0, totalPlaceCount: 5, remainingOptionalCapacity: 0, distinctAreaCount: 1, daySpanKm: null }], legs: [], transitions: [], preferredPeriod: [] };
  const zero = aggregateDiagnostics([{ fixture: "X", run: 1, diagnostics: full }]);
  assert.equal(zero.density.optionalFillRatio, null);
  assert.equal(zero.density.softScheduleRate, null);
  assert.equal(zero.density.fiveStopDayRate, 1);
  assert.equal(aggregateDiagnostics([]).density.meanStopsPerDay, null);
  assert.equal(percentile([1, 2, 3, 4], 0.5), 2.5);
});

test("real E2E harness targets the production route and planner contract, never production, and refuses to run without a credential", () => {
  const e2e = fileURLToPath(new URL("../scripts/ai-planner-e2e.mjs", import.meta.url));
  const text = readFileSync(e2e, "utf8");
  // Exercises the real handler and the real model contract.
  assert.match(text, /const MODEL = "gpt-5\.6-luna";/);
  assert.match(text, /const EFFORT = "high";/);
  assert.match(text, /await import\("\.\.\/api\/trip\.mjs"\)/);
  assert.match(text, /action: "plan"/);
  assert.doesNotMatch(text, /terra|--models|blind/i);
  // Never production: the only outbound host is OpenAI; the store is in-memory and outbound
  // requests to anything else throw instead of being attempted.
  assert.match(text, /unexpected outbound request/);
  assert.doesNotMatch(text, /trip-eddie23|trip-snowy-five|vercel\.app|UPSTASH|upstash\.io/i);
  assert.match(text, /in-memory\.invalid/);
  // Prints outcome/shape only, never plan content, and writes nothing.
  assert.doesNotMatch(text, /writeFileSync|mkdirSync|appendFileSync/);
  assert.match(text, /never names, times or any plan content/);
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  const blocked = spawnSync(process.execPath, [e2e], { env, encoding: "utf8" });
  assert.equal(blocked.status, 3);
  assert.equal(blocked.stdout.trim(), "REAL_E2E_BLOCKED_MISSING_API_KEY");
});
