// Temporary production-truth diagnostics. Never a persistence or planning input contract.
import { createHash } from "node:crypto";
import { placeDetailKey, plannerOpeningWindows, plannerTripDays } from "./ai-trip-planner.mjs";
import { resolveStructuredOpeningPeriods, structuredHoursPlaceId } from "./opening-hours.mjs";
import { readOpeningHoursSidecars } from "./opening-hours-sidecar.mjs";

export const hoursTraceHash = value => value ? createHash("sha256").update(String(value)).digest("hex").slice(0, 16) : null;
export function hoursTraceId(request) {
  const id = request.headers?.["x-planner-hours-trace"];
  return typeof id === "string" && /^[a-f0-9]{24}$/.test(id) ? id : null;
}
export function emitHoursTrace(request, stage, fields) {
  const traceId = hoursTraceId(request);
  if (traceId) console.info("planner-hours-trace", JSON.stringify({ traceId, stage, ...fields }));
}

const counts = new Map();
export function admitHoursTrace(memberId, now = Date.now()) {
  // Per warm process, per authenticated member. Bounded memory, no Redis writes or timers.
  for (const [key, value] of counts) if (now - value.start > 600000) counts.delete(key);
  const key = hoursTraceHash(memberId);
  const value = counts.get(key) || { start: now, count: 0 };
  if (value.count >= 40 || (!counts.has(key) && counts.size >= 256)) return false;
  value.count += 1; counts.set(key, value); return true;
}

const booleans = ["selected", "hasDirectPlaceId", "hasSourceUrl", "trustedSourceUrl", "recoveredTrustedGoogleId",
  "addressExcluded", "hydrationRequired", "hydrationStarted", "pending", "hasRegularOpeningPeriods",
  "recordIdentityMatches", "hasOpeningWindows", "calendarMatches", "activeCandidateReceived",
  "conflictEvaluable", "conflictComputed", "clientConflict", "mainMounted", "selectedMounted", "mainWarningMounted",
  "selectedWarningMounted", "mainWarningVisible", "selectedWarningVisible", "constraintEditorOpen"];
export function traceOptions(value) {
  return (Array.isArray(value) ? value : []).slice(0, 61).map(option => ({
    dayKey: typeof option?.dayKey === "string" && /^\d{1,2}\/\d{1,2}$/.test(option.dayKey) ? option.dayKey : null,
    mode: ["none", "preferred", "exact"].includes(option?.mode) ? option.mode : "invalid",
    exactTime: typeof option?.exactTime === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(option.exactTime) ? option.exactTime : null,
  }));
}
export function safeClientHours(value = {}) {
  value = value && typeof value === "object" ? value : {};
  const result = Object.fromEntries(booleans.map(key => [key, typeof value[key] === "boolean" ? value[key] : null]));
  result.identityHash = typeof value.identityHash === "string" && /^[a-f0-9]{16}$/.test(value.identityHash) ? value.identityHash : null;
  result.effectiveStatus = ["known", "unavailable", "unknown"].includes(value.effectiveStatus) ? value.effectiveStatus : "unknown";
  result.hydrationResult = ["known", "unavailable", "transient_failure", "not_needed", "no_identity", "pending"].includes(value.hydrationResult) ? value.hydrationResult : "not_needed";
  result.response = Object.fromEntries(["ok", "hasRecord", "hasWindows", "hasCalendar", "calendarMatches", "identityMatches", "accepted"].map(key =>
    [key, typeof value.response?.[key] === "boolean" ? value.response[key] : null]));
  result.dateOptions = traceOptions(value.dateOptions);
  result.draftDateOptions = traceOptions(value.draftDateOptions);
  return result;
}

export async function recordClientHoursTrace(request, trip, redisCommand) {
  const rows = request.body.candidates.slice(0, 20);
  const matches = rows.map(row => (trip.places || []).filter(place => placeDetailKey(place) === row?.ref));
  let readFailed = false;
  const sidecars = await readOpeningHoursSidecars(matches.flat(), redisCommand, () => { readFailed = true; });
  const days = plannerTripDays(trip);
  const candidates = rows.map((row, index) => {
    const place = matches[index].length === 1 ? matches[index][0] : null;
    const id = structuredHoursPlaceId(place);
    const sidecar = resolveStructuredOpeningPeriods({ placeId: id }, sidecars.get(id));
    const effective = resolveStructuredOpeningPeriods(place, sidecars.get(id));
    const windows = place ? plannerOpeningWindows({ ...place, regularOpeningPeriods: effective }, days) : null;
    const client = safeClientHours(row?.client);
    return { candidateRef: hoursTraceHash(row?.ref), canonicalMatches: matches[index].length, client,
      server: { hasDirectPlaceId: Boolean(place?.placeId), hasSourceUrl: Boolean(place?.sourceUrl), identityHash: hoursTraceHash(id),
        recoveredTrustedGoogleId: Boolean(id && !place?.placeId), sidecarRead: readFailed ? "error" : sidecar?.status || "miss",
        embeddedStatus: resolveStructuredOpeningPeriods(place)?.status || "unknown", effectiveStatus: effective?.status || "unknown",
        hasOpeningWindows: windows !== null,
        days: client.dateOptions.map(option => ({ dayKey: option.dayKey,
          weekday: days.find(day => day.dayKey === option.dayKey)?.weekdayIndex ?? null,
          windows: windows?.[option.dayKey] ?? null })) } };
  });
  const ui = request.body.ui || {};
  emitHoursTrace(request, "client_snapshot", { version: 1, candidates,
    ui: { selectedCount: Number.isInteger(ui.selectedCount) ? Math.min(250, Math.max(0, ui.selectedCount)) : null,
      conflictCount: Number.isInteger(ui.conflictCount) ? Math.min(250, Math.max(0, ui.conflictCount)) : null,
      summaryMounted: ui.summaryMounted === true, ctaMounted: ui.ctaMounted === true, ctaDisabled: ui.ctaDisabled === true,
      narrowViewport: ui.narrowViewport === true, drawerOpen: ui.drawerOpen === true,
      activeDay: typeof ui.activeDay === "string" && /^\d{1,2}\/\d{1,2}$/.test(ui.activeDay) ? ui.activeDay : null,
      plannerStartAttempted: ui.plannerStartAttempted === true, planSent: ui.planSent === true,
      previewMounted: ui.previewMounted === true, otherTimeEditorOpen: ui.otherTimeEditorOpen === true } });
}
