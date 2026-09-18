// Deterministic post-validator for AI Trip Planner output. The model's output is never trusted:
// every identity, date, hard time constraint, duration and capacity rule is re-checked here.
// It never repairs a hard semantic error itself; it only sorts and reports.
import {
  PLANNER_DAILY_CAPACITY,
  PLANNER_DURATION_STEP,
  PLANNER_MAX_DURATION,
  PLANNER_MIN_DURATION,
  PLANNER_PERIOD_RANGES,
  PLANNER_TIME_PATTERN,
} from "./ai-trip-planner-schema.mjs";

export function minutesOf(time) {
  if (!PLANNER_TIME_PATTERN.test(String(time || ""))) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeInPeriod(time, periodKey) {
  const range = PLANNER_PERIOD_RANGES[periodKey];
  const value = minutesOf(time);
  if (!range || value === null) return false;
  return value >= minutesOf(range[0]) && value <= minutesOf(range[1]);
}

function itemWindow(time, durationMinutes) {
  const start = minutesOf(time);
  if (start === null || !Number.isInteger(durationMinutes) || durationMinutes <= 0) return null;
  return { start, end: start + durationMinutes };
}

export function windowsOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/* context: { days: [{dayKey}], candidates: [{ref, required, kind, dateOptions}], existingByDay:
 * Map<dayKey, [{time, itemType}]>, capacityByDay: Map<dayKey, number> } (see buildPlannerContext).
 * Returns { ok, errors, warnings, days } where days is the normalized plan: trip day order, each
 * day's items sorted by startTime (ties by candidate order). */
export function validatePlannerPlan(plan, context) {
  const errors = [];
  const warnings = [];
  const error = (code, detail = {}) => errors.push({ code, ...detail });
  if (!isPlainObject(plan) || !Array.isArray(plan.days)) {
    error("SCHEMA_INVALID");
    return { ok: false, errors, warnings, days: [] };
  }
  const dayOrder = new Map(context.days.map((day, index) => [day.dayKey, index]));
  const candidateOrder = new Map(context.candidates.map((candidate, index) => [candidate.ref, index]));
  const candidates = new Map(context.candidates.map((candidate) => [candidate.ref, candidate]));
  const seenDays = new Set();
  const placements = new Map();
  const normalizedDays = [];

  for (const day of plan.days) {
    if (!isPlainObject(day) || typeof day.dayKey !== "string" || !Array.isArray(day.items)) {
      error("SCHEMA_INVALID");
      continue;
    }
    if (!dayOrder.has(day.dayKey)) {
      error("INVALID_DAY", { dayKey: day.dayKey });
      continue;
    }
    if (seenDays.has(day.dayKey)) {
      error("DUPLICATE_DAY", { dayKey: day.dayKey });
      continue;
    }
    seenDays.add(day.dayKey);
    const items = [];
    for (const item of day.items) {
      if (!isPlainObject(item) || typeof item.candidateRef !== "string") {
        error("SCHEMA_INVALID", { dayKey: day.dayKey });
        continue;
      }
      const ref = item.candidateRef;
      const candidate = candidates.get(ref);
      if (!candidate) {
        error("UNKNOWN_REF", { candidateRef: ref, dayKey: day.dayKey });
        continue;
      }
      if (candidate.kind === "lodging") error("LODGING_NOT_ALLOWED", { candidateRef: ref });
      if (placements.has(ref)) {
        error(candidate.required ? "REQUIRED_DUPLICATED" : "SOFT_DUPLICATED", { candidateRef: ref });
        continue;
      }
      const startTime = typeof item.startTime === "string" ? item.startTime : "";
      if (minutesOf(startTime) === null) error("INVALID_START_TIME", { candidateRef: ref, startTime: String(item.startTime ?? "") });
      const duration = item.durationMinutes;
      if (!Number.isInteger(duration) || duration < PLANNER_MIN_DURATION || duration > PLANNER_MAX_DURATION || duration % PLANNER_DURATION_STEP !== 0) {
        error("INVALID_DURATION", { candidateRef: ref, durationMinutes: duration ?? null });
      }
      if (candidate.dateOptions.length) {
        const option = candidate.dateOptions.find((entry) => entry.dayKey === day.dayKey);
        if (!option) {
          error("DISALLOWED_DAY", { candidateRef: ref, dayKey: day.dayKey, allowedDayKeys: candidate.dateOptions.map((entry) => entry.dayKey) });
        } else if (option.mode === "exact" && startTime !== option.exactTime) {
          error("EXACT_TIME_MISMATCH", { candidateRef: ref, dayKey: day.dayKey, expected: option.exactTime, actual: startTime });
        } else if (option.mode === "preferred" && minutesOf(startTime) !== null
          && !option.preferredPeriods.some((period) => timeInPeriod(startTime, period))) {
          warnings.push({ code: "PREFERENCE_MISS", candidateRef: ref, dayKey: day.dayKey });
        }
      }
      placements.set(ref, day.dayKey);
      items.push({ candidateRef: ref, startTime, durationMinutes: duration });
    }
    items.sort((a, b) => (minutesOf(a.startTime) ?? -1) - (minutesOf(b.startTime) ?? -1)
      || candidateOrder.get(a.candidateRef) - candidateOrder.get(b.candidateRef));
    normalizedDays.push({ dayKey: day.dayKey, items });
  }

  for (const candidate of context.candidates) {
    if (candidate.required && !placements.has(candidate.ref)) error("MISSING_REQUIRED", { candidateRef: candidate.ref });
  }

  for (const day of normalizedDays) {
    const capacity = context.capacityByDay.get(day.dayKey) ?? PLANNER_DAILY_CAPACITY;
    if (day.items.length > capacity) error("DAY_OVER_CAPACITY", { dayKey: day.dayKey, capacity, count: day.items.length });
    const starts = new Map();
    for (const item of day.items) {
      if (minutesOf(item.startTime) === null) continue;
      if (starts.has(item.startTime)) {
        error("DUPLICATE_START_TIME", { dayKey: day.dayKey, startTime: item.startTime, candidateRefs: [starts.get(item.startTime), item.candidateRef] });
      } else starts.set(item.startTime, item.candidateRef);
    }
    // Interval overlap between AI additions: [start, start + duration). Adjacent intervals
    // (one ends exactly when the next starts) are allowed; no travel buffer is invented.
    const intervals = day.items.map((item) => ({ ref: item.candidateRef, window: itemWindow(item.startTime, item.durationMinutes) })).filter((entry) => entry.window);
    for (let a = 0; a < intervals.length; a += 1) {
      for (let b = a + 1; b < intervals.length; b += 1) {
        if (windowsOverlap(intervals[a].window, intervals[b].window)) {
          error("TIME_OVERLAP", { dayKey: day.dayKey, candidateRefs: [intervals[a].ref, intervals[b].ref] });
        }
      }
    }
    for (const existing of context.existingByDay.get(day.dayKey) || []) {
      if (starts.has(existing.time)) {
        error("EXISTING_TIME_COLLISION", { dayKey: day.dayKey, startTime: existing.time, candidateRef: starts.get(existing.time) });
      }
      // Only an existing item with a trusted stored duration has a window; a start-time-only
      // item is never given a guessed duration (same-start conflict above still applies).
      const existingWindow = Number.isInteger(existing.durationMinutes) && existing.durationMinutes > 0 ? itemWindow(existing.time, existing.durationMinutes) : null;
      if (!existingWindow) continue;
      for (const entry of intervals) {
        if (existing.time !== undefined && starts.get(existing.time) === entry.ref) continue;
        if (windowsOverlap(existingWindow, entry.window)) {
          error("EXISTING_TIME_OVERLAP", { dayKey: day.dayKey, startTime: existing.time, candidateRef: entry.ref });
        }
      }
    }
  }

  normalizedDays.sort((a, b) => dayOrder.get(a.dayKey) - dayOrder.get(b.dayKey));
  return { ok: errors.length === 0, errors, warnings, days: normalizedDays };
}

const toRadians = (value) => (value * Math.PI) / 180;

export function haversineKm(a, b) {
  const earth = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

const round = (value, digits = 2) => (Number.isFinite(value) ? Number(value.toFixed(digits)) : null);

/* Quality metrics for evaluation only (never a validity gate): hard-constraint compliance
 * figures, preferred-period adherence, density and a haversine geographic cohesion metric
 * (mean consecutive distance between AI additions within a day, in time order). */
export function planQualityMetrics(context, validation) {
  const candidates = new Map(context.candidates.map((candidate) => [candidate.ref, candidate]));
  const placed = new Map();
  for (const day of validation.days) for (const item of day.items) placed.set(item.candidateRef, { dayKey: day.dayKey, ...item });
  const required = context.candidates.filter((candidate) => candidate.required);
  const soft = context.candidates.filter((candidate) => !candidate.required);
  const constrained = required.filter((candidate) => candidate.dateOptions.length && placed.has(candidate.ref));
  const allowedDateOk = constrained.filter((candidate) => candidate.dateOptions.some((option) => option.dayKey === placed.get(candidate.ref).dayKey));
  const exactChosen = constrained.map((candidate) => ({ candidate, option: candidate.dateOptions.find((option) => option.dayKey === placed.get(candidate.ref).dayKey) }))
    .filter(({ option }) => option?.mode === "exact");
  const exactOk = exactChosen.filter(({ candidate, option }) => placed.get(candidate.ref).startTime === option.exactTime);
  const preferredChosen = constrained.map((candidate) => ({ candidate, option: candidate.dateOptions.find((option) => option.dayKey === placed.get(candidate.ref).dayKey) }))
    .filter(({ option }) => option?.mode === "preferred");
  const preferredOk = preferredChosen.filter(({ candidate, option }) => option.preferredPeriods.some((period) => timeInPeriod(placed.get(candidate.ref).startTime, period)));
  const legs = [];
  const perDay = [];
  for (const day of validation.days) {
    const points = day.items.map((item) => candidates.get(item.candidateRef)).filter((candidate) => Number.isFinite(candidate?.latitude) && Number.isFinite(candidate?.longitude));
    const dayLegs = [];
    for (let index = 1; index < points.length; index += 1) dayLegs.push(haversineKm(points[index - 1], points[index]));
    legs.push(...dayLegs);
    const existingCount = (context.existingByDay.get(day.dayKey) || []).filter((item) => item.itemType !== "flight").length;
    perDay.push({ dayKey: day.dayKey, newCount: day.items.length, existingPlaceCount: existingCount, totalPlaceCount: existingCount + day.items.length,
      meanLegKm: dayLegs.length ? round(dayLegs.reduce((sum, leg) => sum + leg, 0) / dayLegs.length) : null });
  }
  const ratio = (numerator, denominator) => (denominator ? round(numerator / denominator, 4) : null);
  const errorCodes = validation.errors.map((entry) => entry.code);
  return {
    hardValid: validation.ok,
    selectedInclusion: ratio(required.filter((candidate) => placed.has(candidate.ref)).length, required.length),
    duplicateCount: errorCodes.filter((code) => code === "REQUIRED_DUPLICATED" || code === "SOFT_DUPLICATED").length,
    invalidRefCount: errorCodes.filter((code) => code === "UNKNOWN_REF").length,
    allowedDateCompliance: ratio(allowedDateOk.length, constrained.length),
    exactTimeCompliance: ratio(exactOk.length, exactChosen.length),
    existingCollisionCount: errorCodes.filter((code) => code === "EXISTING_TIME_COLLISION" || code === "EXISTING_TIME_OVERLAP").length,
    timeOverlapCount: errorCodes.filter((code) => code === "TIME_OVERLAP").length,
    durationStepCompliance: ratio([...placed.values()].filter((item) => Number.isInteger(item.durationMinutes) && item.durationMinutes % PLANNER_DURATION_STEP === 0).length, placed.size),
    preferenceAdherence: ratio(preferredOk.length, preferredChosen.length),
    preferredChosenCount: preferredChosen.length,
    scheduledSoftCount: soft.filter((candidate) => placed.has(candidate.ref)).length,
    softCandidateCount: soft.length,
    maxDailyTotal: perDay.reduce((max, day) => Math.max(max, day.totalPlaceCount), 0),
    meanLegKm: legs.length ? round(legs.reduce((sum, leg) => sum + leg, 0) / legs.length) : null,
    maxLegKm: legs.length ? round(Math.max(...legs)) : null,
    perDay,
  };
}
