#!/usr/bin/env node
// Real end-to-end check of the production AI Planner route: POST /api/trip { action: "plan" }
// through the real api/trip.mjs handler, the real lib orchestration and one real gpt-5.6-luna
// request. Production is never involved: the Trip/session/quota store is an in-memory stand-in and
// only api.openai.com leaves this process.
//
//   node scripts/ai-planner-e2e.mjs
//
// Reads OPENAI_API_KEY from the environment only; it is never printed, logged or written. Without
// it the run stops with REAL_E2E_BLOCKED_MISSING_API_KEY. Prints the request contract, the outcome
// and timings only — never the Preview, plan content or model text. Writes no files.
import { createHash } from "node:crypto";
import { OPENAI_RESPONSES_URL, PLANNER_MAX_MODEL_CALLS, PLANNER_MODEL_TIMEOUT_MS } from "../lib/ai-trip-planner.mjs";
import { plannerFixtures } from "../tests/fixtures/ai-planner-fixtures.mjs";

const MODEL = "gpt-5.6-luna";
const EFFORT = "high";
const FIXTURE = "B";
const TOKEN = "e2e-token";
const MEMBER = { id: "alice", nickname: "alice" };

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.log("REAL_E2E_BLOCKED_MISSING_API_KEY");
  process.exitCode = 3;
} else {
  await main();
}

async function main() {
  const fixture = plannerFixtures().find((entry) => entry.id === FIXTURE);
  const trip = fixture.trip;
  // In-memory stand-in for the shared store: no production Redis, no production Trip or Place.
  const store = new Map([
    [`tokyo-family-trip:trip:${trip.id}`, JSON.stringify(trip)],
    [`tokyo-family-trip:session:${createHash("sha256").update(TOKEN).digest("hex")}`, JSON.stringify(MEMBER)],
  ]);
  process.env.KV_REST_API_URL = "https://in-memory.invalid";
  process.env.KV_REST_API_TOKEN = "in-memory";
  process.env.AI_PLANNER_MODEL = MODEL;
  process.env.AI_PLANNER_REASONING_EFFORT = EFFORT;

  const contract = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url) === OPENAI_RESPONSES_URL) {
      const body = JSON.parse(options.body);
      contract.push({ model: body.model, effort: body.reasoning?.effort, store: body.store, format: body.text?.format?.type, strict: body.text?.format?.strict, repair: body.input.length > 2 });
      return realFetch(url, options);
    }
    if (!String(url).startsWith(process.env.KV_REST_API_URL)) throw new Error(`unexpected outbound request: ${new URL(String(url)).origin}`);
    const [command, key, value] = JSON.parse(options.body);
    let result = null;
    if (command === "GET") result = store.get(key) ?? null;
    if (command === "SET") { store.set(key, value); result = "OK"; }
    if (command === "INCR") { result = Number(store.get(key) || 0) + 1; store.set(key, String(result)); }
    if (command === "EXPIRE") result = 1;
    return new Response(JSON.stringify({ result }), { status: 200 });
  };

  const { default: tripHandler } = await import("../api/trip.mjs");
  const call = async (body) => {
    const response = { statusCode: 0, payload: null, status(code) { this.statusCode = code; return this; }, setHeader() { return this; }, json(payload) { this.payload = payload; return this; } };
    await tripHandler({ method: "POST", query: { id: trip.id }, url: `/api/trip?id=${trip.id}`, headers: { cookie: `tokyo_trip_session=${TOKEN}` }, body }, response);
    return response;
  };

  // 1) Deterministic preflight rejection must cost zero model calls (fixture F is infeasible).
  const infeasible = plannerFixtures().find((entry) => entry.id === "F");
  store.set(`tokyo-family-trip:trip:${trip.id}`, JSON.stringify(infeasible.trip));
  const preflight = await call({ action: "plan", expectedRevision: infeasible.trip.revision, selected: infeasible.selected });
  const preflightCalls = contract.length;
  store.set(`tokyo-family-trip:trip:${trip.id}`, JSON.stringify(trip));

  // 2) One real planning request through the production route.
  const started = Date.now();
  const response = await call({ action: "plan", expectedRevision: trip.revision, selected: fixture.selected });
  const elapsedMs = Date.now() - started;
  const preview = response.payload?.preview || null;

  const tripUnchanged = store.get(`tokyo-family-trip:trip:${trip.id}`) === JSON.stringify(trip);
  const result = {
    mode: "real",
    fixture: FIXTURE,
    preflight: { status: preflight.statusCode, error: preflight.payload?.error || null, reason: preflight.payload?.reason || null, modelCalls: preflightCalls },
    plan: {
      status: response.statusCode,
      error: response.payload?.error || null,
      modelCalls: contract.length - preflightCalls,
      repaired: Boolean(response.payload?.planning?.repaired),
      elapsedMs,
      // Shape only, never names, times or any plan content.
      previewDays: preview ? preview.days.length : null,
      previewItemCount: preview ? preview.days.reduce((total, day) => total + day.items.length, 0) : null,
      summary: preview?.summary ?? null,
    },
    requestContract: {
      calls: contract.length,
      allModelLuna: contract.every((entry) => entry.model === MODEL),
      allEffortHigh: contract.every((entry) => entry.effort === EFFORT),
      allStoreFalse: contract.every((entry) => entry.store === false),
      allStrictJsonSchema: contract.every((entry) => entry.format === "json_schema" && entry.strict === true),
      maxCallsAllowed: PLANNER_MAX_MODEL_CALLS,
      perCallTimeoutMs: PLANNER_MODEL_TIMEOUT_MS,
    },
    tripStoreUnchanged: tripUnchanged,
  };
  const ok = response.statusCode === 200 && preflight.statusCode === 422 && preflightCalls === 0 && tripUnchanged
    && contract.length - preflightCalls <= PLANNER_MAX_MODEL_CALLS && result.requestContract.allModelLuna
    && result.requestContract.allEffortHigh && result.requestContract.allStoreFalse && result.requestContract.allStrictJsonSchema;
  console.log(JSON.stringify(result, null, 2));
  console.log(ok ? "REAL_E2E_PASS" : "REAL_E2E_FAIL");
  if (!ok) process.exitCode = 1;
}
