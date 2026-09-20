// Apply reconstructs itinerary records from the stored Trip, never model/client metadata.
import { PlannerError, plannerTripDays, plannerEligiblePlaces } from './ai-trip-planner.mjs';
import { minutesOf } from './ai-trip-planner-validator.mjs';
import { trustedOpeningPeriods, dayOpeningWindows, intervalWithinWindows, formatWindow } from './opening-hours.mjs';

const fail = (code, detail = {}) => { throw new PlannerError(code, 422, detail); };
const clone = value => structuredClone(value);
export const existingRef = (revision, day, index) => `existing:${revision}:${day}:${index}`;

export function enrichApplyPreview(preview, trip) {
  const result = clone(preview);
  for (const day of result.days) {
    let index = 0;
    for (const item of day.items) {
      if (item.source !== 'existing') { item.ref = item.placeKey; continue; }
      const original = trip.itinerary?.[day.dayKey]?.[index];
      if (!original) fail('INVALID_EXISTING_REF');
      item.ref = existingRef(result.revision, day.dayKey, index++);
      item.protected = original.type === 'flight';
      item.durationMinutes = Number.isInteger(original.durationMinutes) && original.durationMinutes > 0 ? original.durationMinutes : null;
    }
  }
  return result;
}

export function reconstructPlan(trip, body) {
  const revision = Number(trip.revision) || 0;
  if (!Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) fail('INVALID_EXPECTED_REVISION');
  if (body.expectedRevision !== revision) throw new PlannerError('TRIP_STALE', 409);
  const days = plannerTripDays(trip);
  const byDay = new Map(days.map(day => [day.dayKey, day]));
  if (!days.length || !Array.isArray(body.days) || body.days.length !== days.length) fail('INVALID_DRAFT_DAYS');
  const originals = new Map();
  for (const [day, items] of Object.entries(trip.itinerary || {})) {
    if (!Array.isArray(items)) fail('INVALID_CANONICAL_ITINERARY');
    if (!byDay.has(day) && items.length) fail('INVALID_CANONICAL_ITINERARY');
    items.forEach((item, index) => originals.set(existingRef(revision, day, index), { item, day, index }));
  }
  const saved = new Map(plannerEligiblePlaces(trip.places || [], trip.itinerary).map(entry => [entry.key, entry.place]));
  const seen = new Set(), seenDays = new Set(), itinerary = {}, visits = [];
  for (const day of body.days) {
    if (!day || !byDay.has(day.dayKey) || seenDays.has(day.dayKey) || !Array.isArray(day.items)) fail('INVALID_DRAFT_DAYS');
    if (day.items.length > originals.size + saved.size) fail('INVALID_DRAFT_ORDER');
    seenDays.add(day.dayKey);
    itinerary[day.dayKey] = day.items.map(intent => {
      if (!intent || typeof intent.ref !== 'string') fail('INVALID_ITEM_REF');
      if (seen.has(intent.ref)) fail('DUPLICATE_ITEM_REF');
      seen.add(intent.ref);
      const original = originals.get(intent.ref);
      if (!original && intent.ref.startsWith('existing:')) fail('UNKNOWN_EXISTING_ITEM_REF');
      const place = original ? (trip.places || []).filter(p => p.name === original.item.name) : [saved.get(intent.ref)].filter(Boolean);
      if (!original && !place.length) fail('UNKNOWN_SAVED_PLACE_REF');
      const item = original ? clone(original.item) : { id: `planner:${revision + 1}:${intent.ref}`, name: place[0].name };
      const duration = intent.durationMinutes;
      const validDuration = duration == null || (Number.isInteger(duration) && duration > 0 && duration <= 1440);
      if (!validDuration || (!original && (duration == null || duration < 30 || duration > 240 || duration % 15))) fail('INVALID_DURATION');
      if (original?.item.type === 'flight') {
        const flight = (trip.flights || []).find(f => f.id === item.flightId);
        if (!flight) fail('INVALID_CANONICAL_ITINERARY');
        if (day.dayKey !== original.day || intent.startTime !== (flight.departureTime || original.item.time || '') || duration !== (original.item.durationMinutes ?? null)) fail('PROTECTED_ITEM_MUTATION');
        const start = minutesOf(flight.departureTime || item.time);
        if (start !== null) visits.push({ day: days.findIndex(d => d.dayKey === day.dayKey), start, duration: null, name: '航班' });
        return item;
      }
      const start = minutesOf(intent.startTime);
      if (start === null) fail('INVALID_START_TIME');
      item.time = intent.startTime;
      if (duration == null) delete item.durationMinutes; else item.durationMinutes = duration;
      if (place.length > 1) fail('AMBIGUOUS_CANONICAL_PLACE');
      const periods = trustedOpeningPeriods(place[0]);
      if (periods) {
        const windows = dayOpeningWindows(periods, byDay.get(day.dayKey).weekdayIndex, 2880);
        const inside = duration == null
          ? windows.some(w => w.startMinute <= start && start < w.endMinute)
          : intervalWithinWindows(windows, start, start + duration);
        if (!inside) fail('OPENING_HOURS_CONFLICT', { name: item.name, dayKey: day.dayKey, startTime: item.time, openingWindows: windows.map(w => formatWindow(w, 2880)) });
      }
      visits.push({ day: days.findIndex(d => d.dayKey === day.dayKey), start, duration, name: item.name });
      return item;
    });
  }
  for (const ref of originals.keys()) if (!seen.has(ref)) fail('MISSING_EXISTING_ITEM');
  // Start-only canonical records have same-start collision semantics; no guessed duration.
  for (let i = 0; i < visits.length; i++) for (let j = i + 1; j < visits.length; j++) {
    const a = visits[i], b = visits[j], startA = a.day * 1440 + a.start, startB = b.day * 1440 + b.start;
    if (startA === startB || (a.duration && b.duration && startA < startB + b.duration && startB < startA + a.duration)) fail('TIME_OVERLAP', { name: a.name, otherName: b.name });
  }
  const adjacency = new Set();
  for (const [day, items] of Object.entries(itinerary)) {
    const key = item => item.id || (item.type === 'flight' ? `flight:${item.flightId}` : `place:${day}:${String(item.name || '行程項目').normalize('NFKC')}`);
    items.slice(0, -1).forEach((item, i) => adjacency.add(`${day}\u0000${key(item)}\u0000${key(items[i + 1])}`));
  }
  return { ...clone(trip), itinerary, transports: (trip.transports || []).map(t => ({ ...t, needsReview: !adjacency.has(`${t.date}\u0000${t.fromItemId}\u0000${t.toItemId}`) })) };
}
