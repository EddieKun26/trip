// Evaluation-only itinerary quality diagnostics for scripts/ai-planner-eval.mjs. Never imported by
// production code and never a validity gate. Distances are straight-line haversine between stored
// coordinates; no routing, travel-time estimate or km→minutes rule is assumed. Missing
// coordinates or durations yield null, never an invented value.
import { PLANNER_DAILY_CAPACITY } from "../lib/ai-trip-planner-schema.mjs";
import { haversineKm, minutesOf, timeInPeriod, validatePlannerPlan } from "../lib/ai-trip-planner-validator.mjs";

const round = (value, digits = 2) => (Number.isFinite(value) ? Number(value.toFixed(digits)) : null);
const located = (entry) => Number.isFinite(entry?.latitude) && Number.isFinite(entry?.longitude);
const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const ratio = (numerator, denominator) => (denominator ? round(numerator / denominator, 4) : null);

// Linear interpolation between closest ranks (numpy's default).
export function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  return sorted[low] + (sorted[Math.ceil(index)] - sorted[low]) * (index - low);
}

export function distribution(values) {
  const present = values.filter(Number.isFinite);
  if (!present.length) return { n: 0, mean: null, median: null, p75: null, p90: null, p95: null, max: null };
  return {
    n: present.length,
    mean: round(sum(present) / present.length),
    median: round(percentile(present, 0.5)),
    p75: round(percentile(present, 0.75)),
    p90: round(percentile(present, 0.9)),
    p95: round(percentile(present, 0.95)),
    max: round(Math.max(...present)),
  };
}

/* Rebuilds a model-shaped plan from a stored Preview (placeKey → this context's candidateRef) so
 * earlier eval-runs.json files can be re-scored under the current diagnostics. Only days with at
 * least one AI addition are emitted, matching how a model output without that day validates. */
export function planFromPreview(context, preview) {
  const refs = new Map(context.candidates.map((candidate) => [candidate.key, candidate.ref]));
  return {
    days: preview.days
      .map((day) => ({ dayKey: day.dayKey, items: day.items.filter((item) => item.source !== "existing")
        .map((item) => ({ candidateRef: refs.get(item.placeKey) ?? "", startTime: item.startTime, durationMinutes: item.durationMinutes })) }))
      .filter((day) => day.items.length),
  };
}

/* Preferred-period choice over a hard-valid plan. A placement is "contested" when the other side
 * was also available: for a hit, some start outside every preferred period (06:00–21:45, 15-minute
 * grid) would still pass the deterministic hard validator with the rest of the plan unchanged; for
 * a miss, some start inside a preferred period would. Only contested placements measure a genuine
 * model choice rather than a result forced by hard constraints. */
export function preferredPeriodChoice(context, validation) {
  const candidates = new Map(context.candidates.map((candidate) => [candidate.ref, candidate]));
  const plan = { days: validation.days.map((day) => ({ dayKey: day.dayKey, items: day.items.map((item) => ({ ...item })) })) };
  const placements = [];
  plan.days.forEach((day, dayIndex) => day.items.forEach((item, itemIndex) => {
    const candidate = candidates.get(item.candidateRef);
    const option = candidate?.dateOptions.find((entry) => entry.dayKey === day.dayKey);
    if (option?.mode !== "preferred") return;
    const inPreferred = (time) => option.preferredPeriods.some((period) => timeInPeriod(time, period));
    const hit = inPreferred(item.startTime);
    let contested = false;
    for (let minutes = hit ? 6 * 60 : 0; minutes <= (hit ? 21 * 60 + 45 : 23 * 60 + 45) && !contested; minutes += 15) {
      if (inPreferred(clock(minutes)) === hit) continue;
      const trial = { days: plan.days.map((entry, index) => (index !== dayIndex ? entry
        : { ...entry, items: entry.items.map((other, position) => (position === itemIndex ? { ...other, startTime: clock(minutes) } : other)) })) };
      contested = validatePlannerPlan(trial, context).ok;
    }
    placements.push({ name: candidate.name, dayKey: day.dayKey, startTime: item.startTime, preferredPeriods: option.preferredPeriods, hit, contested });
  }));
  return placements;
}

/* Per-run diagnostics over every trip day (a day the model left out counts as zero new stops):
 * density and optional fill, AI-addition legs in time order (same definition as
 * planQualityMetrics.meanLegKm), a merged locked+new timeline for distance vs available gap, and
 * preferred-period choice. annotations are evaluation-only fixture labels. */
export function planDiagnostics(context, validation, { isolatedKeys = [], distantClusterKeys = [] } = {}) {
  const candidates = new Map(context.candidates.map((candidate) => [candidate.ref, candidate]));
  const planned = new Map(validation.days.map((day) => [day.dayKey, day.items]));
  const placedDay = new Map();
  const days = [];
  const legs = [];
  const transitions = [];
  for (const { dayKey } of context.days) {
    const existing = context.existingByDay.get(dayKey) || [];
    const additions = [...(planned.get(dayKey) || [])]
      .map((item) => ({ ...item, candidate: candidates.get(item.candidateRef) }))
      .filter((item) => item.candidate)
      .sort((a, b) => (minutesOf(a.startTime) ?? -1) - (minutesOf(b.startTime) ?? -1));
    for (const item of additions) placedDay.set(item.candidate.key, dayKey);
    const lockedPlaceCount = existing.filter((item) => item.itemType !== "flight").length;
    const requiredCount = additions.filter((item) => item.candidate.required).length;
    const softCount = additions.length - requiredCount;

    const points = additions.filter((item) => located(item.candidate));
    for (let index = 1; index < points.length; index += 1) {
      legs.push({ dayKey, from: points[index - 1].candidate.name, to: points[index].candidate.name, km: round(haversineKm(points[index - 1].candidate, points[index].candidate)) });
    }

    const timeline = [
      ...existing.filter((item) => minutesOf(item.time) !== null).map((item) => ({
        source: item.itemType === "flight" ? "flight" : "locked", name: item.name, start: minutesOf(item.time),
        duration: Number.isInteger(item.durationMinutes) ? item.durationMinutes : null, latitude: item.latitude, longitude: item.longitude })),
      ...additions.filter((item) => minutesOf(item.startTime) !== null).map((item) => ({
        source: item.candidate.required ? "required" : "soft", name: item.candidate.name, start: minutesOf(item.startTime),
        duration: item.durationMinutes, latitude: item.candidate.latitude, longitude: item.candidate.longitude })),
    ].sort((a, b) => a.start - b.start);
    for (let index = 1; index < timeline.length; index += 1) {
      const previous = timeline[index - 1];
      const next = timeline[index];
      // A locked item without a stored duration has no known end, so its following gap is unknown.
      const previousEnd = Number.isInteger(previous.duration) ? previous.start + previous.duration : null;
      transitions.push({
        dayKey, from: previous.name, fromSource: previous.source, to: next.name, toSource: next.source,
        previousEnd: previousEnd === null ? null : clock(previousEnd), nextStart: clock(next.start),
        gapMinutes: previousEnd === null ? null : next.start - previousEnd,
        distanceKm: located(previous) && located(next) ? round(haversineKm(previous, next)) : null,
      });
    }

    const stops = [
      ...existing.filter((item) => item.itemType !== "flight").map((item) => ({ area: item.area, latitude: item.latitude, longitude: item.longitude })),
      ...additions.map((item) => item.candidate),
    ];
    const spots = stops.filter(located);
    let span = null;
    for (let a = 0; a < spots.length; a += 1) for (let b = a + 1; b < spots.length; b += 1) span = Math.max(span ?? 0, haversineKm(spots[a], spots[b]));
    days.push({
      dayKey,
      hasFlight: existing.some((item) => item.itemType === "flight"),
      lockedPlaceCount,
      requiredCount,
      softCount,
      totalPlaceCount: lockedPlaceCount + additions.length,
      // Evaluation-only: hard max − locked stops − required stops actually placed that day.
      remainingOptionalCapacity: Math.max(0, PLANNER_DAILY_CAPACITY - lockedPlaceCount - requiredCount),
      distinctAreaCount: new Set(stops.map((stop) => stop.area).filter(Boolean)).size,
      daySpanKm: round(span),
    });
  }
  const labelled = (keys) => keys.map((placeKey) => ({ name: context.candidates.find((candidate) => candidate.key === placeKey)?.name ?? placeKey, dayKey: placedDay.get(placeKey) ?? null }));
  return {
    softCandidateCount: context.candidates.filter((candidate) => !candidate.required).length,
    days,
    legs,
    transitions,
    preferredPeriod: preferredPeriodChoice(context, validation),
    ...(isolatedKeys.length ? { isolated: labelled(isolatedKeys) } : {}),
    ...(distantClusterKeys.length ? { distantCluster: labelled(distantClusterKeys) } : {}),
  };
}

const kmStats = (pairs) => {
  const stats = distribution(pairs.map((pair) => pair.distanceKm));
  return { n: stats.n, meanKm: stats.mean, medianKm: stats.median, p90Km: stats.p90, maxKm: stats.max };
};

/* entries: [{ fixture, run, diagnostics }] for final hard-valid runs. Pooled across runs. */
export function aggregateDiagnostics(entries) {
  const tag = (entry, item) => ({ fixture: entry.fixture, run: entry.run, ...item });
  const days = entries.flatMap((entry) => entry.diagnostics.days);
  const totals = days.map((day) => day.totalPlaceCount);
  const scheduledSoft = sum(days.map((day) => day.softCount));
  const softCandidates = sum(entries.map((entry) => entry.diagnostics.softCandidateCount));
  const remaining = sum(days.map((day) => day.remainingOptionalCapacity));
  const optionalDays = days.filter((day) => day.remainingOptionalCapacity > 0);
  const flightDays = days.filter((day) => day.hasFlight);
  const histogram = Object.fromEntries(Array.from({ length: PLANNER_DAILY_CAPACITY + 1 }, (_, count) => [count, totals.filter((total) => total === count).length]));

  const legs = entries.flatMap((entry) => entry.diagnostics.legs.map((leg) => tag(entry, leg)));
  const longest = legs.reduce((best, leg) => (!best || leg.km > best.km ? leg : best), null);
  const spans = days.map((day) => day.daySpanKm).filter(Number.isFinite);

  const transitions = entries.flatMap((entry) => entry.diagnostics.transitions.map((pair) => tag(entry, pair)));
  const known = transitions.filter((pair) => pair.gapMinutes !== null && pair.distanceKm !== null);
  const zeroGap = known.filter((pair) => pair.distanceKm > 0 && pair.gapMinutes === 0);
  const gapStats = distribution(known.map((pair) => pair.gapMinutes));
  const within = (minutes) => known.filter((pair) => pair.gapMinutes <= minutes);

  const placements = entries.flatMap((entry) => entry.diagnostics.preferredPeriod.map((placement) => tag(entry, placement)));
  const contested = placements.filter((placement) => placement.contested);

  const result = {
    density: {
      travelDays: days.length,
      meanStopsPerDay: totals.length ? round(sum(totals) / totals.length) : null,
      medianStopsPerDay: round(percentile(totals, 0.5)),
      fiveStopDayRate: ratio(totals.filter((total) => total === PLANNER_DAILY_CAPACITY).length, totals.length),
      stopsPerDayHistogram: histogram,
      unusedCapacityDayRate: ratio(totals.filter((total) => total < PLANNER_DAILY_CAPACITY).length, totals.length),
      scheduledSoft,
      softCandidates,
      softScheduleRate: ratio(scheduledSoft, softCandidates),
      remainingOptionalCapacity: remaining,
      optionalFillRatio: ratio(scheduledSoft, remaining),
      optionalCapacityFullyUsedDayRate: ratio(optionalDays.filter((day) => day.softCount >= day.remainingOptionalCapacity).length, optionalDays.length),
      flightDays: flightDays.length,
      meanStopsOnFlightDays: flightDays.length ? round(sum(flightDays.map((day) => day.totalPlaceCount)) / flightDays.length) : null,
    },
    geography: {
      legs: distribution(legs.map((leg) => leg.km)),
      longestLeg: longest,
      meanDistinctAreasPerDay: days.length ? round(sum(days.map((day) => day.distinctAreaCount)) / days.length) : null,
      meanDaySpanKm: spans.length ? round(sum(spans) / spans.length) : null,
    },
    transitions: {
      adjacentPairs: transitions.length,
      pairsWithDistanceAndGap: known.length,
      positiveDistanceZeroGapCount: zeroGap.length,
      positiveDistanceZeroGapRate: ratio(zeroGap.length, known.length),
      negativeGapCount: known.filter((pair) => pair.gapMinutes < 0).length,
      gapMinutes: { mean: gapStats.mean, median: gapStats.median },
      distanceWhereGapAtMost15: kmStats(within(15)),
      distanceWhereGapAtMost30: kmStats(within(30)),
      largestDistanceWithGapAtMost30: within(30).sort((a, b) => b.distanceKm - a.distanceKm).slice(0, 8),
      preFlightGaps: transitions.filter((pair) => pair.toSource === "flight" && pair.gapMinutes !== null),
    },
    preferredPeriod: {
      placements: placements.length,
      hits: placements.filter((placement) => placement.hit).length,
      hitRate: ratio(placements.filter((placement) => placement.hit).length, placements.length),
      contestedPlacements: contested.length,
      contestedHits: contested.filter((placement) => placement.hit).length,
      contestedHitRate: ratio(contested.filter((placement) => placement.hit).length, contested.length),
    },
  };
  const isolated = entries.flatMap((entry) => entry.diagnostics.isolated || []);
  if (isolated.length) {
    result.isolatedCandidates = { offered: isolated.length, scheduled: isolated.filter((place) => place.dayKey).length };
  }
  const clusters = entries.filter((entry) => entry.diagnostics.distantCluster).map((entry) => entry.diagnostics.distantCluster);
  if (clusters.length) {
    const scheduledDays = clusters.map((cluster) => cluster.map((place) => place.dayKey).filter(Boolean));
    result.distantCluster = {
      runs: clusters.length,
      noneScheduled: scheduledDays.filter((dayKeys) => !dayKeys.length).length,
      allOnSameDay: clusters.filter((cluster, index) => scheduledDays[index].length === cluster.length && new Set(scheduledDays[index]).size === 1).length,
      partialOrSplit: clusters.filter((cluster, index) => scheduledDays[index].length && (scheduledDays[index].length < cluster.length || new Set(scheduledDays[index]).size > 1)).length,
    };
  }
  return result;
}
