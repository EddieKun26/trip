#!/usr/bin/env node
// AI Trip Planner release-quality evaluation for the production candidate gpt-5.6-luna at
// reasoning effort high (local/development only; never production data or endpoints).
//
//   node scripts/ai-planner-eval.mjs --runs 3 --out ../ai-planner-eval-out
//   node scripts/ai-planner-eval.mjs --mock --out <dir>      # pipeline check, zero network
//   node scripts/ai-planner-eval.mjs --rescore <eval-runs.json> --out <dir>   # zero network
//   node scripts/ai-planner-eval.mjs --runs 1 --hours-runs 3 --out <dir>      # Phase 2A.5 release set
//   node scripts/ai-planner-eval.mjs --only I,J,K --runs 1 --out <dir>         # a subset of fixtures
//
// Reads OPENAI_API_KEY from the environment only; it is never printed, logged or written. Without
// it a real run stops with REAL_LUNA_EVAL_BLOCKED_NO_CREDENTIALS. Each run is one planner request
// through the production lib path: at most two model calls (initial + one repair). Output belongs
// outside the repository. Fixtures A–E form the comparable set ("overall"); coverage fixtures (G,
// H) are aggregated separately ("coverage") and never merged into it; opening-hours fixtures (I–K,
// P) form their own "hours" set, run --hours-runs times (default --runs). --rescore recomputes the
// current diagnostics for an earlier eval-runs.json without any model call.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import PlanningGeography from "../lib/planning-geography.js";
import audit from "../lib/travel-area-audit.js";
import {
  OPENAI_RESPONSES_URL,
  PlannerError,
  buildPlannerContext,
  buildPlannerPreview,
  callPlannerModel,
  checkPlannerFeasibility,
  runPlanner,
} from "../lib/ai-trip-planner.mjs";
import { PLANNER_DAILY_CAPACITY, PLANNER_PERIOD_LABELS } from "../lib/ai-trip-planner-schema.mjs";
import { planQualityMetrics, validatePlannerPlan } from "../lib/ai-trip-planner-validator.mjs";
import { plannerFixtures } from "../tests/fixtures/ai-planner-fixtures.mjs";
import { mockValidPlan, responsesPayload } from "../tests/helpers/ai-planner-mock.mjs";
import { aggregateDiagnostics, percentile, planDiagnostics, planFromPreview } from "./ai-planner-eval-diagnostics.mjs";

const MODEL = "gpt-5.6-luna";
const EFFORT = "high";
const MAX_RUNS = 5;
const ARTIFACT_FIXTURES = ["B", "C", "E", "G", "H", "I", "J", "K"];
// Review thresholds for soft quality (flags for human review, never hard validity).
const CONCERN = { repairRate: 0.34, preferenceAdherence: 0.5, meanLegKm: 8, maxLegKm: 20 };

function args(argv) {
  const options = { runs: 3, hoursRuns: 0, only: null, out: "", mock: false, rescore: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--mock") options.mock = true;
    else if (flag === "--runs") options.runs = Math.min(MAX_RUNS, Math.max(1, Number(argv[++index]) || 1));
    else if (flag === "--hours-runs") options.hoursRuns = Math.min(MAX_RUNS, Math.max(1, Number(argv[++index]) || 1));
    else if (flag === "--only") options.only = new Set(String(argv[++index] || "").split(",").map((id) => id.trim()).filter(Boolean));
    else if (flag === "--out") options.out = argv[++index];
    else if (flag === "--rescore") options.rescore = argv[++index];
  }
  if (!options.out) throw new Error("--out <dir> is required");
  return options;
}

function contextFor(fixture) {
  const places = fixture.trip.places.map((place) => audit.reclassify(PlanningGeography.normalizePlace(place), null));
  return buildPlannerContext({ trip: fixture.trip, places, selected: fixture.selected });
}

const sum = (values) => values.reduce((total, value) => total + (Number(value) || 0), 0);
const mean = (values) => { const present = values.filter((value) => value !== null && value !== undefined); return present.length ? Number((sum(present) / present.length).toFixed(4)) : null; };
const rate = (values) => (values.length ? Number((values.filter(Boolean).length / values.length).toFixed(4)) : null);

/* Model response digest for diagnosis: HTTP/response status, incomplete reason and the model's
 * output text. Never headers, the credential or refusal text (same policy as production). */
function responseDigest(httpStatus, payload) {
  if (!payload || typeof payload !== "object") return { httpStatus, unreadable: true };
  if (payload.error) return { httpStatus, errorType: String(payload.error.type || ""), errorCode: String(payload.error.code || "") };
  const parts = (Array.isArray(payload.output) ? payload.output : []).filter((item) => item?.type === "message").flatMap((item) => (Array.isArray(item.content) ? item.content : []));
  const text = typeof payload.output_text === "string" ? payload.output_text : parts.find((part) => part?.type === "output_text")?.text;
  return { httpStatus, status: payload.status ?? null, incompleteReason: payload.incomplete_details?.reason ?? null,
    refusal: parts.some((part) => part?.type === "refusal"), outputText: typeof text === "string" ? text : null };
}

// Records the request contract fields (never headers or the credential) and a digest of each
// model response into the current call's slot.
function contractRecorder(sink, slotFor) {
  return async (url, options) => {
    const isPlanner = String(url) === OPENAI_RESPONSES_URL;
    if (isPlanner) {
      const body = JSON.parse(options.body);
      sink.push({ model: body.model, effort: body.reasoning?.effort, store: body.store, format: body.text?.format?.type, strict: body.text?.format?.strict });
    }
    const response = await fetch(url, options);
    if (isPlanner) slotFor().response = responseDigest(response.status, await response.clone().json().catch(() => null));
    return response;
  };
}

async function evaluateRun({ fixture, apiKey, mock, run, contract }) {
  const context = contextFor(fixture);
  let calls = 0;
  // One slot per model call, in call order: raw response, raw plan, then (after runPlanner) the
  // validator-normalized plan and that call's validation result.
  const slots = [];
  const fetchImpl = contractRecorder(contract, () => slots.at(-1));
  const invoke = async ({ repair }) => {
    calls += 1;
    const slot = { kind: repair ? "repair" : "initial", call: calls, response: null, outputError: "", rawPlan: null };
    slots.push(slot);
    let result;
    if (!mock) result = await callPlannerModel({ apiKey, model: MODEL, effort: EFFORT, context, repair, fetchImpl });
    else {
      // Mock: the first call of odd runs is deliberately broken so repair accounting is exercised.
      const plan = mockValidPlan(context);
      if (!repair && run % 2 === 1) plan.days[0].items.push({ candidateRef: "p999", startTime: "23:00", durationMinutes: 60 });
      const payload = responsesPayload(plan);
      slot.response = responseDigest(200, payload);
      result = { plan: JSON.parse(payload.output[0].content[0].text), latencyMs: 1, usage: payload.usage, modelReported: `mock:${MODEL}` };
    }
    slot.outputError = result.outputError || "";
    slot.rawPlan = result.plan ?? null;
    return result;
  };
  const started = Date.now();
  try {
    const result = await runPlanner(context, invoke);
    const first = result.attempts[0];
    const final = result.attempts.at(-1);
    const attempts = slots.map((slot, index) => {
      const attempt = result.attempts[index] || {};
      return { ...slot, normalizedPlan: slot.rawPlan ? validatePlannerPlan(slot.rawPlan, context).days : null,
        schemaValid: attempt.schemaValid ?? null, hardValid: attempt.hardValid ?? null, errors: attempt.errors ?? [], warnings: attempt.warnings ?? [], latencyMs: attempt.latencyMs ?? null };
    });
    const record = {
      fixture: fixture.id, set: fixture.set || "comparable", model: MODEL, effort: EFFORT, run, calls,
      // First-pass opening-hours violations (OUTSIDE_OPENING_HOURS) before any repair.
      initialHoursViolations: first.errors.filter((entry) => entry.code === "OUTSIDE_OPENING_HOURS").length,
      initialSchemaValid: first.schemaValid,
      initialHardValid: first.hardValid,
      repairNeeded: !first.hardValid && !first.refused,
      repairSuccess: !first.hardValid && !first.refused ? result.ok : null,
      refused: Boolean(result.refused),
      finalHardValid: result.ok,
      initialErrorCodes: first.errors.map((entry) => entry.code),
      finalErrorCodes: final.errors.map((entry) => entry.code),
      latencyMs: Date.now() - started,
      modelLatencyMs: sum(result.attempts.map((attempt) => attempt.latencyMs)),
      usage: {
        inputTokens: sum(result.attempts.map((attempt) => attempt.usage?.input_tokens)),
        cachedInputTokens: sum(result.attempts.map((attempt) => attempt.usage?.input_tokens_details?.cached_tokens)),
        outputTokens: sum(result.attempts.map((attempt) => attempt.usage?.output_tokens)),
        reasoningTokens: sum(result.attempts.map((attempt) => attempt.usage?.output_tokens_details?.reasoning_tokens)),
        totalTokens: sum(result.attempts.map((attempt) => attempt.usage?.total_tokens)),
      },
      modelReported: [...new Set(result.attempts.map((attempt) => attempt.modelReported).filter(Boolean))],
      repairAttempted: result.attempts.length > 1,
      attempts,
    };
    if (result.ok) {
      record.finalPlan = result.validation.days;
      record.metrics = planQualityMetrics(context, result.validation);
      record.diagnostics = planDiagnostics(context, result.validation, fixture.annotations);
      record.preview = buildPlannerPreview(context, result.validation);
      record.warnings = result.validation.warnings.map((entry) => entry.code);
      const softAvailable = context.candidates.some((candidate) => !candidate.required);
      record.overfilledEveryDay = softAvailable && record.metrics.perDay.length === context.days.length
        && record.metrics.perDay.every((day) => day.totalPlaceCount >= PLANNER_DAILY_CAPACITY);
    }
    return record;
  } catch (error) {
    return { fixture: fixture.id, set: fixture.set || "comparable", model: MODEL, effort: EFFORT, run, calls,
      upstreamError: error instanceof PlannerError ? error.code : "UNEXPECTED_ERROR", latencyMs: Date.now() - started, attempts: slots };
  }
}

function aggregate(records) {
  const completed = records.filter((record) => !record.upstreamError);
  const metrics = completed.filter((record) => record.finalHardValid).map((record) => record.metrics);
  const finalOr = (field) => (completed.length ? mean(completed.map((record) => (record.finalHardValid ? record.metrics[field] : 0))) : null);
  return {
    runs: records.length,
    completedRuns: completed.length,
    upstreamErrors: records.filter((record) => record.upstreamError).map((record) => record.upstreamError),
    schemaValidRate: rate(completed.map((record) => record.initialSchemaValid)),
    firstPassHardValidRate: rate(completed.map((record) => record.initialHardValid)),
    finalHardValidRate: rate(completed.map((record) => record.finalHardValid)),
    repairRate: rate(completed.map((record) => record.repairNeeded)),
    repairSuccessRate: rate(completed.filter((record) => record.repairNeeded).map((record) => record.repairSuccess)),
    refusalCount: completed.filter((record) => record.refused).length,
    // Final compliance counts an invalid final run as 0, so "100%" can only mean every run passed.
    selectedInclusion: finalOr("selectedInclusion"),
    allowedDateCompliance: mean(metrics.map((entry) => entry.allowedDateCompliance)),
    exactTimeCompliance: mean(metrics.map((entry) => entry.exactTimeCompliance)),
    durationStepCompliance: finalOr("durationStepCompliance"),
    // Final opening-hours compliance over AI additions on known-hours days; a final-invalid run
    // counts 0 so 100% means every run's final plan kept every known-hours visit inside a window.
    openingHoursCompliance: mean(completed.filter((record) => (record.finalHardValid ? record.metrics.openingHoursChecked > 0 : record.set === "hours"))
      .map((record) => (record.finalHardValid ? record.metrics.openingHoursCompliance : 0))),
    openingHoursCheckedItems: sum(metrics.map((entry) => entry.openingHoursChecked)),
    hoursViolationFirstPassRuns: completed.filter((record) => record.initialHoursViolations > 0).length,
    hoursViolationFirstPassItems: sum(completed.map((record) => record.initialHoursViolations)),
    finalHoursViolationRuns: completed.filter((record) => !record.finalHardValid && record.finalErrorCodes.includes("OUTSIDE_OPENING_HOURS")).length,
    modelCallsDistribution: Object.fromEntries([...new Set(completed.map((record) => record.calls))].sort().map((calls) => [calls, completed.filter((record) => record.calls === calls).length])),
    totalModelCalls: sum(completed.map((record) => record.calls)),
    timeOverlapViolationRuns: completed.filter((record) => !record.finalHardValid && record.finalErrorCodes.includes("TIME_OVERLAP")).length,
    initialTimeOverlapRuns: completed.filter((record) => record.initialErrorCodes.includes("TIME_OVERLAP")).length,
    initialDurationStepRuns: completed.filter((record) => record.initialErrorCodes.includes("INVALID_DURATION")).length,
    duplicateFinal: sum(metrics.map((entry) => entry.duplicateCount)),
    unknownRefFinal: sum(metrics.map((entry) => entry.invalidRefCount)),
    preferenceAdherence: mean(metrics.map((entry) => entry.preferenceAdherence)),
    meanLegKm: mean(metrics.map((entry) => entry.meanLegKm)),
    maxLegKm: metrics.length ? Math.max(...metrics.map((entry) => entry.maxLegKm ?? 0)) : null,
    scheduledSoftMean: mean(metrics.map((entry) => entry.scheduledSoftCount)),
    maxDailyTotal: metrics.length ? Math.max(...metrics.map((entry) => entry.maxDailyTotal)) : null,
    overfilledEveryDayRuns: completed.filter((record) => record.overfilledEveryDay).length,
    latencyMsMean: mean(completed.map((record) => record.latencyMs)),
    latencyMsP50: completed.length ? Math.round(percentile(completed.map((record) => record.latencyMs), 0.5)) : null,
    latencyMsMax: completed.length ? Math.max(...completed.map((record) => record.latencyMs)) : null,
    usageMean: {
      inputTokens: mean(completed.map((record) => record.usage.inputTokens)),
      cachedInputTokens: mean(completed.map((record) => record.usage.cachedInputTokens)),
      outputTokens: mean(completed.map((record) => record.usage.outputTokens)),
      reasoningTokens: mean(completed.map((record) => record.usage.reasoningTokens)),
      totalTokens: mean(completed.map((record) => record.usage.totalTokens)),
    },
    initialErrorCodes: completed.flatMap((record) => record.initialErrorCodes),
    // Evaluation-only quality diagnostics (density, optional fill, geography, distance vs gap,
    // preferred-period choice), pooled over final hard-valid runs.
    diagnostics: aggregateDiagnostics(completed.filter((record) => record.finalHardValid && record.diagnostics)),
  };
}

function qualityConcerns(overall) {
  const concerns = [];
  if (overall.repairRate !== null && overall.repairRate >= CONCERN.repairRate) concerns.push("QUALITY_CONCERN_REPAIR_RATE");
  if (overall.preferenceAdherence !== null && overall.preferenceAdherence < CONCERN.preferenceAdherence) concerns.push("QUALITY_CONCERN_PREFERENCE");
  if ((overall.meanLegKm ?? 0) > CONCERN.meanLegKm || (overall.maxLegKm ?? 0) > CONCERN.maxLegKm) concerns.push("QUALITY_CONCERN_GEOGRAPHY");
  if (overall.overfilledEveryDayRuns > 0) concerns.push("QUALITY_CONCERN_OVERFILL");
  return concerns;
}

function constraintLines(fixture) {
  return contextFor(fixture).candidates.filter((candidate) => candidate.required).map((candidate) => {
    const options = candidate.dateOptions.length
      ? candidate.dateOptions.map((option) => option.mode === "exact" ? `${option.dayKey} 指定 ${option.exactTime}`
        : option.mode === "preferred" ? `${option.dayKey} 偏好${option.preferredPeriods.map((key) => PLANNER_PERIOD_LABELS[key]).join("、")}` : option.dayKey).join(" / ")
      : "日期自由";
    return `- 我指定想去：${candidate.name}（${options}）`;
  });
}

function planMarkdown(fixture, record) {
  const lines = [`# Fixture ${fixture.id} — run ${record?.run ?? "n/a"}（${MODEL} / ${EFFORT}）`, "", fixture.title, "", "## 硬性條件", "", ...constraintLines(fixture), ""];
  if (!record?.preview) {
    lines.push("_此 fixture 沒有通過驗證的計畫。_", "", `- 最終錯誤：${(record?.finalErrorCodes || [record?.upstreamError]).join(", ")}`);
    return `${lines.join("\n")}\n`;
  }
  lines.push("## 行程", "");
  for (const day of record.preview.days) {
    lines.push(`**${day.dayKey} ${day.weekday}**`);
    if (!day.items.length) lines.push("- （無）");
    for (const item of day.items) {
      if (item.source === "existing") lines.push(`- ${item.time || "--:--"} 🔒 ${item.name}（既有行程）`);
      else lines.push(`- ${item.startTime} ${item.name}（${item.source === "required" ? "我指定想去" : "已在我的清單"}・${item.area || "—"}・${item.durationMinutes} 分鐘${item.exactTime ? "・指定時間" : ""}${item.preferenceMiss ? "・偏好時段未符合" : ""}）`);
    }
  }
  const m = record.metrics;
  lines.push("", "## 指標", "",
    `- 第一次輸出：schema ${record.initialSchemaValid ? "有效" : "無效"}、硬性檢查${record.initialHardValid ? "通過" : `未通過（${record.initialErrorCodes.join(", ")}），經一次修正`}`,
    `- 指定地點納入：${m.selectedInclusion ?? "n/a"}；允許日期符合：${m.allowedDateCompliance ?? "n/a"}；指定時間符合：${m.exactTimeCompliance ?? "n/a"}`,
    `- 時間重疊：${m.timeOverlapCount}；15 分鐘單位符合：${m.durationStepCompliance ?? "n/a"}`,
    `- 偏好時段符合：${m.preferenceAdherence ?? "n/a"}（${m.preferredChosenCount} 個偏好選擇）`,
    `- 地理：同日相鄰新增地點平均 ${m.meanLegKm ?? "n/a"} km，最遠 ${m.maxLegKm ?? "n/a"} km`,
    `- 每日密度（含既有）：${m.perDay.map((day) => `${day.dayKey}=${day.totalPlaceCount}`).join("、")}；從清單安排 ${m.scheduledSoftCount}/${m.softCandidateCount}`);
  const d = record.diagnostics;
  if (d) {
    const remaining = d.days.reduce((total, day) => total + day.remainingOptionalCapacity, 0);
    const soft = d.days.reduce((total, day) => total + day.softCount, 0);
    const known = d.transitions.filter((pair) => pair.gapMinutes !== null && pair.distanceKm !== null);
    lines.push(
      `- 選擇性名額（評估用）：已排 soft ${soft} / 扣除既有與指定後的剩餘上限 ${remaining}；每日總站數 ${d.days.map((day) => `${day.dayKey}=${day.totalPlaceCount}`).join("、")}`,
      `- 相鄰站距離 vs 空檔：${known.map((pair) => `${pair.from}→${pair.to} ${pair.distanceKm} km / ${pair.gapMinutes} 分`).join("；") || "n/a"}`,
      `- 偏好時段選擇：${d.preferredPeriod.map((entry) => `${entry.name} ${entry.dayKey} ${entry.startTime} ${entry.hit ? "符合" : "未符合"}${entry.contested ? "（兩邊皆可行）" : ""}`).join("；") || "n/a"}`);
  }
  lines.push(`- 延遲：${record.latencyMs} ms；tokens：input ${record.usage.inputTokens} / output ${record.usage.outputTokens} / reasoning ${record.usage.reasoningTokens}`);
  return `${lines.join("\n")}\n`;
}

/* Re-scores an earlier eval-runs.json under the current diagnostics with zero model calls: each
 * final plan (stored finalPlan, else rebuilt from its Preview) is re-validated against the same
 * deterministic fixture context. Recorded validity, repair and latency fields are kept as-is. */
function rescore(options) {
  const fixtures = new Map(plannerFixtures().map((fixture) => [fixture.id, fixture]));
  const consistency = ["hardValid", "selectedInclusion", "allowedDateCompliance", "exactTimeCompliance", "preferenceAdherence", "scheduledSoftCount", "meanLegKm", "maxLegKm", "maxDailyTotal"];
  let metricsMismatchRuns = 0;
  const records = JSON.parse(readFileSync(options.rescore, "utf8")).map((stored) => {
    const fixture = fixtures.get(stored.fixture);
    const record = { ...stored, set: stored.set || fixture?.set || "comparable" };
    if (!fixture || !stored.finalHardValid || !(stored.finalPlan || stored.preview)) return record;
    const context = contextFor(fixture);
    const validation = validatePlannerPlan(stored.finalPlan ? { days: stored.finalPlan } : planFromPreview(context, stored.preview), context);
    const metrics = planQualityMetrics(context, validation);
    if (!validation.ok || consistency.some((field) => metrics[field] !== stored.metrics?.[field])) metricsMismatchRuns += 1;
    return { ...record, metrics, diagnostics: planDiagnostics(context, validation, fixture.annotations) };
  });
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: "rescore",
    source: basename(options.rescore),
    model: MODEL,
    effort: EFFORT,
    metricsMismatchRuns,
    overall: aggregate(records.filter((record) => record.set === "comparable")),
    coverage: aggregate(records.filter((record) => record.set === "coverage")),
    byFixture: Object.fromEntries([...new Set(records.map((record) => record.fixture))].map((id) => [id, aggregate(records.filter((record) => record.fixture === id))])),
  };
  mkdirSync(options.out, { recursive: true });
  writeFileSync(join(options.out, "rescore-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, byFixture: undefined }, null, 2));
}

async function main() {
  const options = args(process.argv.slice(2));
  if (options.rescore) return rescore(options);
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!options.mock && !apiKey) {
    console.log("REAL_LUNA_EVAL_BLOCKED_NO_CREDENTIALS");
    process.exitCode = 3;
    return;
  }
  mkdirSync(options.out, { recursive: true });
  const fixtures = plannerFixtures().filter((fixture) => !options.only || options.only.has(fixture.id));
  const preflight = [];
  const records = [];
  const contract = [];
  for (const fixture of fixtures) {
    if (fixture.expectPreflight) {
      let calls = 0;
      const context = contextFor(fixture);
      const feasibility = checkPlannerFeasibility(context);
      if (feasibility.feasible) await runPlanner(context, async () => { calls += 1; return { plan: null }; });
      preflight.push({ fixture: fixture.id, rejected: !feasibility.feasible, reason: feasibility.reason || null, modelCalls: calls,
        expectedReason: fixture.expectReason || null, reasonMatches: fixture.expectReason ? feasibility.reason === fixture.expectReason : null });
      continue;
    }
    const runs = fixture.set === "hours" && options.hoursRuns ? options.hoursRuns : options.runs;
    for (let run = 1; run <= runs; run += 1) {
      const record = await evaluateRun({ fixture, apiKey, mock: options.mock, run, contract });
      records.push(record);
      console.log(`${fixture.id} run ${run}: ${record.upstreamError ? `upstream ${record.upstreamError}` : `initial=${record.initialHardValid} final=${record.finalHardValid} calls=${record.calls} ${record.latencyMs}ms`}`);
      // A quota/rate-limit stop is a legitimate limitation: keep completed runs, do not retry around it.
      if (record.upstreamError?.startsWith("OPENAI_429")) break;
    }
  }
  // overall = comparable A–E set only (same scope as the Phase 2A.1 baseline); coverage fixtures
  // are aggregated on their own.
  const planned = fixtures.filter((fixture) => !fixture.expectPreflight);
  const overall = aggregate(records.filter((record) => record.set === "comparable"));
  const coverage = aggregate(records.filter((record) => record.set === "coverage"));
  const hours = aggregate(records.filter((record) => record.set === "hours"));
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: options.mock ? "mock" : "real",
    model: MODEL,
    effort: EFFORT,
    expectedRuns: planned.reduce((total, fixture) => total + (fixture.set === "hours" && options.hoursRuns ? options.hoursRuns : options.runs), 0),
    all: aggregate(records),
    comparableFixtures: planned.filter((fixture) => !fixture.set).map((fixture) => fixture.id),
    coverageFixtures: planned.filter((fixture) => fixture.set === "coverage").map((fixture) => fixture.id),
    hoursFixtures: planned.filter((fixture) => fixture.set === "hours").map((fixture) => fixture.id),
    requestContract: {
      calls: contract.length,
      allModelLuna: contract.every((entry) => entry.model === MODEL),
      allEffortHigh: contract.every((entry) => entry.effort === EFFORT),
      allStoreFalse: contract.every((entry) => entry.store === false),
      allStrictJsonSchema: contract.every((entry) => entry.format === "json_schema" && entry.strict === true),
    },
    preflight,
    overall,
    coverage,
    hours,
    byFixture: Object.fromEntries(planned.map((fixture) => [fixture.id, aggregate(records.filter((record) => record.fixture === fixture.id))])),
    qualityConcerns: qualityConcerns(overall),
  };
  writeFileSync(join(options.out, "eval-runs.json"), JSON.stringify(records, null, 2));
  writeFileSync(join(options.out, "eval-summary.json"), JSON.stringify(summary, null, 2));
  for (const fixtureId of ARTIFACT_FIXTURES) {
    const fixture = fixtures.find((entry) => entry.id === fixtureId);
    const record = records.find((entry) => entry.fixture === fixtureId && entry.run === 1);
    if (!fixture) continue;
    writeFileSync(join(options.out, `fixture-${fixtureId}-run-1.md`), planMarkdown(fixture, record));
  }
  console.log(JSON.stringify({ ...summary, all: { ...summary.all, initialErrorCodes: undefined, diagnostics: undefined }, overall: { ...overall, initialErrorCodes: undefined }, coverage: { ...coverage, initialErrorCodes: undefined }, hours: { ...hours, initialErrorCodes: undefined }, byFixture: undefined }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "EVAL_FAILED");
  process.exitCode = 1;
});
