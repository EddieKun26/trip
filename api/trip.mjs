import areaTags from "../lib/area-tags.js";
import PlanningGeography from "../lib/planning-geography.js";
import areaAudit from "../lib/travel-area-audit.js";
import {
  PlannerError,
  buildPlannerContext,
  buildPlannerPreview,
  callPlannerModel,
  checkPlannerFeasibility,
  plannerDailyLimit,
  plannerModelConfig,
  runPlanner,
} from "../lib/ai-trip-planner.mjs";
import { readFileSync } from "node:fs";
let areaCatalog = null;
try { areaCatalog = JSON.parse(readFileSync(new URL("../data/area-geometry/travel-area-boundaries.json", import.meta.url), "utf8")); }
catch { /* Geometry is optional; address/evidence conversion and trip access still work. */ }
import { createHash, randomBytes } from "node:crypto";

const LEGACY_TRIP_KEY = "tokyo-family-trip:v1";
/* The AI Planner action makes up to PLANNER_MAX_MODEL_CALLS model calls, so this route declares its
 * duration explicitly like the other AI routes, which also makes it independent of any project-level
 * default. This project has no framework, so the authoritative setting is the matching vercel.json
 * functions entry (kept in sync by a test); the export documents the intent at the call site.
 * 150s comfortably covers two sequential PLANNER_MODEL_TIMEOUT_MS calls plus preprocessing,
 * validation and the response, and is well inside the platform's 300s ceiling for this plan. */
export const maxDuration = 150;

const DEFAULT_TRIP_ID = "tokyo-family-2026";
const TRIP_PREFIX = "tokyo-family-trip:trip:";
const INVITE_PREFIX = "tokyo-family-trip:invite:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const PLANNER_LIMIT_PREFIX = "tokyo-family-trip:ai-planner:";

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

function redisConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("SHARED_DATABASE_NOT_CONFIGURED");
  const result = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!result.ok) throw new Error(`DATABASE_${result.status}`);
  const payload = await result.json();
  if (payload.error) throw new Error("DATABASE_COMMAND_FAILED");
  return payload.result;
}

async function readJson(key) {
  const raw = await redisCommand(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function inviteCode() {
  return randomBytes(5).toString("base64url").replace(/[-_0OIl]/g, "A").slice(0, 6).toUpperCase();
}

function cookieValue(request, name) {
  const cookies = String(request.headers.cookie || "").split(";");
  const match = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : "";
}

async function authenticatedMember(request) {
  const token = cookieValue(request, "tokyo_trip_session");
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return readJson(`${SESSION_PREFIX}${tokenHash}`);
}

function requestedTripId(request) {
  const direct = String(request.query?.id || "").trim();
  if (direct) return direct;
  try {
    return new URL(request.url, "https://trip.local").searchParams.get("id") || DEFAULT_TRIP_ID;
  } catch {
    return DEFAULT_TRIP_ID;
  }
}

function defaultFlights() {
  return [
    {
      id: "flight-khh-nrt",
      direction: "去程",
      departureDate: "2026-09-20",
      departureTime: "09:55",
      departureCity: "高雄",
      departureCode: "KHH",
      arrivalDate: "2026-09-20",
      arrivalTime: "14:45",
      arrivalCity: "成田",
      arrivalCode: "NRT",
      travelers: "尚未註記",
    },
    {
      id: "flight-nrt-khh",
      direction: "回程",
      departureDate: "2026-09-26",
      departureTime: "17:50",
      departureCity: "成田",
      departureCode: "NRT",
      arrivalDate: "2026-09-26",
      arrivalTime: "21:00",
      arrivalCity: "高雄",
      arrivalCode: "KHH",
      travelers: "尚未註記",
    },
  ];
}

async function ensureLegacyTrip() {
  const key = `${TRIP_PREFIX}${DEFAULT_TRIP_ID}`;
  const existing = await readJson(key);
  if (existing) {
    let changed = false;
    let previousInviteCode = "";
    if (existing.publicRead !== false) {
      existing.publicRead = false;
      changed = true;
    }
    if (!existing.inviteCode || existing.inviteCode === "TOKYO6") {
      previousInviteCode = existing.inviteCode || "";
      existing.inviteCode = inviteCode();
      changed = true;
    }
    if (changed) await redisCommand(["SET", key, JSON.stringify(existing)]);
    if (previousInviteCode) {
      await redisCommand(["SET", `${INVITE_PREFIX}${existing.inviteCode}`, existing.id]);
      await redisCommand(["DEL", `${INVITE_PREFIX}${previousInviteCode}`]);
    }
    return existing;
  }
  const legacy = await readJson(LEGACY_TRIP_KEY);
  if (!legacy) return null;
  const trip = {
    id: DEFAULT_TRIP_ID,
    title: "東京 7 日",
    destination: "東京",
    startDate: "2026-09-20",
    endDate: "2026-09-26",
    inviteCode: inviteCode(),
    publicRead: false,
    ownerId: Object.keys(legacy.members || {})[0] || "",
    flights: defaultFlights(),
    places: Array.isArray(legacy.places) ? legacy.places : [],
    votes: legacy.votes && typeof legacy.votes === "object" ? legacy.votes : {},
    itinerary: legacy.itinerary && typeof legacy.itinerary === "object" ? legacy.itinerary : {},
    transports: Array.isArray(legacy.transports) ? legacy.transports : [],
    members: legacy.members && typeof legacy.members === "object" ? legacy.members : {},
    revision: Number(legacy.revision) || 1,
    updatedAt: legacy.updatedAt || new Date().toISOString(),
    updatedBy: legacy.updatedBy || "migration",
  };
  const created = await redisCommand(["SET", key, JSON.stringify(trip), "NX"]);
  if (created) await redisCommand(["SET", `${INVITE_PREFIX}${trip.inviteCode}`, trip.id]);
  return created ? trip : readJson(key);
}

async function readTrip(id) {
  if (id === DEFAULT_TRIP_ID) return ensureLegacyTrip();
  return readJson(`${TRIP_PREFIX}${id}`);
}

// Compare-and-set the whole Trip inside one Redis command, so no member write can land
// between the revision check and the store.
const REVISION_CAS_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'MISSING' end
local current = cjson.decode(raw)
local revision = tonumber(current['revision']) or 0
if revision ~= tonumber(ARGV[1]) then return 'CONFLICT:' .. tostring(revision) end
redis.call('SET', KEYS[1], ARGV[2])
return 'OK'
`;

let scriptingSupport = null;

// Read-only probe; never touches Trip data. Cached for the life of the function instance.
async function supportsScripting() {
  if (scriptingSupport !== null) return scriptingSupport;
  try {
    await redisCommand(["EVAL", "return 1", "0"]);
    scriptingSupport = true;
  } catch {
    scriptingSupport = false;
  }
  return scriptingSupport;
}

/* Optimistic concurrency for the migration write. With server-side scripting the compare and
 * the store are one atomic command. Without it the handler re-reads, compares and writes:
 * that narrows the race window but is NOT atomic, and reports itself as `cas-window` so the
 * weaker guarantee is visible rather than assumed. */
async function conditionalSetTrip(key, payload, expectedRevision) {
  if (await supportsScripting()) {
    const result = String(await redisCommand(["EVAL", REVISION_CAS_SCRIPT, "1", key, String(expectedRevision), payload]));
    if (result === "OK") return { ok: true, writeMode: "atomic" };
    if (result.startsWith("CONFLICT:")) {
      return { ok: false, conflict: true, writeMode: "atomic", revision: Number(result.slice("CONFLICT:".length)) || 0 };
    }
    return { ok: false, writeMode: "atomic", reason: result === "MISSING" ? "TRIP_NOT_FOUND" : "WRITE_FAILED" };
  }
  const current = await readJson(key);
  const revision = Number(current?.revision) || 0;
  if (revision !== expectedRevision) return { ok: false, conflict: true, writeMode: "cas-window", revision };
  await redisCommand(["SET", key, payload]);
  return { ok: true, writeMode: "cas-window" };
}

function cleanTrip(input, previous, member) {
  // `canonicalAreaMigrationVersion` records that the one-shot Canonical Travel Area data
  // migration completed; it is not a feature-rollout version. It is the one client-supplied
  // top-level field allowed through, and only upwards, so a stale payload can never roll a
  // completed migration back. A trip that never migrated gains no marker at all.
  const storedMarker = Number(previous?.canonicalAreaMigrationVersion) || 0;
  const incomingMarker = Number(input?.canonicalAreaMigrationVersion);
  const marker = Number.isFinite(incomingMarker) && incomingMarker > storedMarker ? incomingMarker : storedMarker;
  return {
    ...previous,
    ...(marker > 0 ? { canonicalAreaMigrationVersion: marker } : {}),
    title: String(input?.title || previous.title).trim().slice(0, 40),
    destination: String(input?.destination || previous.destination).trim().slice(0, 40),
    startDate: String(input?.startDate || previous.startDate),
    endDate: String(input?.endDate || previous.endDate),
    flights: Array.isArray(input?.flights) ? input.flights.slice(0, 30) : previous.flights || [],
    places: Array.isArray(input?.places) ? input.places.slice(0, 250).map(place => areaTags.cleanPlace(areaAudit.reclassify(place, areaCatalog), previous.places || [])) : [],
    votes: input?.votes && typeof input.votes === "object" ? input.votes : {},
    itinerary: input?.itinerary && typeof input.itinerary === "object" ? input.itinerary : {},
    transports: Array.isArray(input?.transports) ? input.transports.slice(0, 500) : previous.transports || [],
    members: {
      ...(previous.members || {}),
      [member.id]: member.nickname,
    },
    revision: (Number(previous.revision) || 0) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: member.id,
  };
}

// Same per-member daily counter pattern as the other AI endpoints; only reached right before
// the first model call, after every configuration, revision and constraint preflight passed.
async function enforceDailyPlannerLimit(memberId, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${PLANNER_LIMIT_PREFIX}${memberId}:${day}`;
  const count = Number(await redisCommand(["INCR", key])) || 0;
  if (count === 1) await redisCommand(["EXPIRE", key, 86400]);
  return count <= limit;
}

/* POST { action: "plan" }: read-only AI Planner Preview over the server-loaded canonical Trip.
 * The client sends only expectedRevision plus selected Place refs and their dateOptions. This
 * path never writes the Trip, its revision, its itinerary or undo state.
 * Every exit logs one "ai-planner" line of stable codes and counters — outcome, error code,
 * elapsed ms, model calls, repair attempted, first-pass validity — so a production failure is
 * diagnosable by category and repair frequency is monitorable. It never logs Trip content, Place
 * names, dateOptions, prompts, model output, refusal text or the credential. */
async function planTrip(request, response, trip, member) {
  const started = Date.now();
  let modelCalls = 0;
  const finish = (outcome, status, payload, extra = {}) => {
    console.info("ai-planner", { outcome, code: outcome === "success" ? "OK" : String(payload.error || ""), status, ms: Date.now() - started, modelCalls, ...extra });
    return sendJson(response, status, payload);
  };
  const config = plannerModelConfig();
  if (!config) return finish("not_configured", 503, { error: "PLANNER_MODEL_NOT_CONFIGURED" });
  const dailyLimit = plannerDailyLimit();
  if (!dailyLimit) return finish("not_configured", 503, { error: "PLANNER_QUOTA_NOT_CONFIGURED" });
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return finish("not_configured", 503, { error: "AI_PLANNER_NOT_CONFIGURED" });
  const body = request.body && typeof request.body === "object" ? request.body : {};
  const expectedRevision = Number(body.expectedRevision);
  if (body.expectedRevision === undefined || body.expectedRevision === null || !Number.isFinite(expectedRevision) || !Array.isArray(body.selected)) {
    return finish("bad_request", 400, { error: "INVALID_PLANNER_REQUEST" });
  }
  const revision = Number(trip.revision) || 0;
  if (expectedRevision !== revision) return finish("stale", 409, { error: "TRIP_STALE", revision });
  try {
    const places = (trip.places || []).map(place => areaAudit.reclassify(PlanningGeography.normalizePlace(place), areaCatalog));
    const context = buildPlannerContext({ trip, places, selected: body.selected });
    const feasibility = checkPlannerFeasibility(context);
    if (!feasibility.feasible) {
      return finish("preflight_rejected", 422, { error: "PLANNER_CONSTRAINTS_INFEASIBLE", reason: feasibility.reason, placeKeys: feasibility.placeKeys }, { reason: feasibility.reason });
    }
    if (!(await enforceDailyPlannerLimit(member.id, dailyLimit))) return finish("quota_exhausted", 429, { error: "DAILY_PLANNER_LIMIT" });
    const result = await runPlanner(context, ({ repair }) => {
      modelCalls += 1;
      return callPlannerModel({ apiKey, model: config.model, effort: config.effort, context, repair });
    });
    const attempts = { repaired: result.attempts.length > 1, firstPassValid: Boolean(result.attempts[0]?.hardValid) };
    if (!result.ok) {
      // Codes only: never the refusal text or plan content.
      return finish("invalid_output", 422, { error: "PLANNER_INVALID_OUTPUT" }, { ...attempts, refused: Boolean(result.refused), codes: result.attempts.map(attempt => attempt.errors.map(entry => entry.code)) });
    }
    return finish("success", 200, {
      preview: buildPlannerPreview(context, result.validation),
      planning: { modelCalls: result.attempts.length, repaired: result.attempts.length > 1 },
    }, attempts);
  } catch (error) {
    if (!(error instanceof PlannerError)) throw error;
    const detail = error.detail || {};
    return finish(error.status >= 500 || error.status === 429 ? "upstream_failed" : "rejected", error.status, {
      error: error.code,
      ...(detail.reason ? { reason: detail.reason } : {}),
      ...(Array.isArray(detail.refs) ? { placeKeys: detail.refs } : {}),
    }, detail.reason ? { reason: detail.reason } : {});
  }
}

export default async function tripHandler(request, response) {
  try {
    const tripId = requestedTripId(request);
    const trip = await readTrip(tripId);
    if (!trip) return sendJson(response, 404, { error: "TRIP_NOT_FOUND" });
    const member = await authenticatedMember(request);
    const isMember = Boolean(member?.id && trip.members?.[member.id]);

    if (request.method === "GET") {
      if (!isMember && !trip.publicRead) return sendJson(response, member ? 403 : 401, { error: "TRIP_ACCESS_REQUIRED" });
      if (!isMember) {
        const { inviteCode, ownerId, ...publicTrip } = trip;
        publicTrip.places = (publicTrip.places || []).map(place => areaAudit.reclassify(PlanningGeography.normalizePlace(place), areaCatalog));
        return sendJson(response, 200, publicTrip);
      }
      return sendJson(response, 200, { ...trip, places: (trip.places || []).map(place => areaAudit.reclassify(PlanningGeography.normalizePlace(place), areaCatalog)) });
    }

    if (request.method === "PUT") {
      if (!isMember) return sendJson(response, member ? 403 : 401, { error: "AUTH_REQUIRED" });
      // `expectedRevision` is a request precondition only; it is never stored on the Trip.
      // Omitting it keeps the existing last-write-wins behaviour for ordinary saves.
      const expectedRevision = Number(request.body?.expectedRevision);
      const conditional = Number.isFinite(expectedRevision);
      const current = Number(trip.revision) || 0;
      if (conditional && expectedRevision !== current) {
        return sendJson(response, 409, { error: "REVISION_CONFLICT", revision: current });
      }
      // Validate the incoming geography before legacy/tag cleaning and any Redis write.
      const input = { ...request.body, places: Array.isArray(request.body?.places)
        ? request.body.places.slice(0, 250).map(place => PlanningGeography.normalizePlace(place)) : [] };
      const updated = cleanTrip(input, trip, member);
      const key = `${TRIP_PREFIX}${trip.id}`;
      const payload = JSON.stringify(updated);
      if (!conditional) {
        await redisCommand(["SET", key, payload]);
        return sendJson(response, 200, updated);
      }
      const result = await conditionalSetTrip(key, payload, expectedRevision);
      if (result.conflict) {
        return sendJson(response, 409, { error: "REVISION_CONFLICT", revision: result.revision, writeMode: result.writeMode });
      }
      if (!result.ok) {
        return sendJson(response, result.reason === "TRIP_NOT_FOUND" ? 404 : 500, { error: result.reason, writeMode: result.writeMode });
      }
      return sendJson(response, 200, { ...updated, writeMode: result.writeMode });
    }

    if (request.method === "POST" && request.body?.action === "plan") {
      if (!isMember) return sendJson(response, member ? 403 : 401, { error: "AUTH_REQUIRED" });
      return planTrip(request, response, trip, member);
    }

    response.setHeader("Allow", "GET, PUT, POST");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SHARED_DATABASE_ERROR";
    return sendJson(response, message.startsWith("INVALID_CANONICAL_") || message === "INVALID_AUTO_SNAPSHOT" ? 400 : message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, { error: message });
  }
}
