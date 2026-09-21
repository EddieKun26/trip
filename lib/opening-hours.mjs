// Structured regular opening hours (Phase 2A.5). Server-only, pure and deterministic.
//
// Google Places API (New) `regularOpeningHours.periods`: each period has `open` and usually `close`
// points of { day, hour, minute } in place-local time (day 0 = Sunday … 6 = Saturday, hour 0–23,
// minute 0–59). A period whose close is on a later day (or earlier in the week) spans midnight or
// the week boundary. A place that is always open is represented by exactly one period whose open is
// day 0, 00:00 and which has no close. Nothing else about a missing close is assumed: any other
// shape is treated as unusable.
//
// Persisted Place field `regularOpeningPeriods` (v1), Planner correctness data only (the display
// string `openingHours` stays the UI's):
//   { v: 1, status: "known", placeId, periods: [{ open: {day, hour, minute}, close: {…} | null }], fetchedAt }
//   { v: 1, status: "unavailable", placeId, periods: [], fetchedAt }   // authoritative details had none
// Absent = the structured fetch has not happened yet. Only "known" data bound to the Place's own
// Google placeId ever becomes a hard constraint; everything else is "hours unknown".
//
// All times are the destination's local wall clock; nothing here converts time zones.

export const OPENING_PERIODS_VERSION = 1;
const DAY = 24 * 60;
const WEEK = 7 * DAY;
const MAX_PERIODS = 28;
const NON_GOOGLE_ID = /^(?:osm-|coordinate-|manual-address-|custom-place-)/u;
const GOOGLE_MAPS_HOSTS = new Set(["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"]);

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const intIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function sanitizePoint(point) {
  if (!isPlainObject(point) || !intIn(point.day, 0, 6) || !intIn(point.hour, 0, 23) || !intIn(point.minute, 0, 59)) return null;
  return { day: point.day, hour: point.hour, minute: point.minute };
}

const weekMinute = (point) => point.day * DAY + point.hour * 60 + point.minute;

// The same explicit legacy identity already accepted by Place Detail: a stored placeId wins;
// otherwise a Google Maps source URL may carry query_place_id/place_id. Names, categories,
// coordinates, CID-only links and opaque short links never fabricate a Google identity.
export function structuredHoursPlaceId(place) {
  const stored = String(place?.placeId || "").trim();
  if (stored) return NON_GOOGLE_ID.test(stored) ? "" : stored;
  try {
    const url = new URL(String(place?.sourceUrl || ""));
    if (!GOOGLE_MAPS_HOSTS.has(url.hostname.toLowerCase())) return "";
    const explicit = String(url.searchParams.get("query_place_id") || url.searchParams.get("place_id") || "").trim();
    return explicit && !NON_GOOGLE_ID.test(explicit) ? explicit : "";
  } catch {
    return "";
  }
}

/* Returns the minimal { open, close } list, or null when the data is missing or not safely usable
 * (so malformed metadata never reaches a Trip or a hard constraint). */
export function sanitizeOpeningPeriods(periods) {
  if (!Array.isArray(periods) || !periods.length || periods.length > MAX_PERIODS) return null;
  const result = [];
  for (const period of periods) {
    if (!isPlainObject(period)) return null;
    const open = sanitizePoint(period.open);
    if (!open) return null;
    if (period.close === undefined || period.close === null) {
      // Only Google's documented always-open form may omit close.
      if (periods.length !== 1 || weekMinute(open) !== 0) return null;
      result.push({ open, close: null });
      continue;
    }
    const close = sanitizePoint(period.close);
    if (!close || weekMinute(close) === weekMinute(open)) return null;
    result.push({ open, close });
  }
  return result;
}

/* Builds the persisted record from a Google response's regularOpeningHours. A search result
 * without usable periods is not authoritative and yields null (field left absent, so the first
 * exact Place Details fetch can still decide); authoritative exact details without usable periods
 * yield "unavailable". */
export function openingPeriodsRecord(regularOpeningHours, { placeId, authoritative = false, now = new Date() } = {}) {
  const id = String(placeId || "").trim();
  if (!id || NON_GOOGLE_ID.test(id)) return null;
  const periods = sanitizeOpeningPeriods(regularOpeningHours?.periods);
  const fetchedAt = now.toISOString();
  if (periods) return { v: OPENING_PERIODS_VERSION, status: "known", placeId: id, periods, fetchedAt };
  return authoritative ? { v: OPENING_PERIODS_VERSION, status: "unavailable", placeId: id, periods: [], fetchedAt } : null;
}

/* The stored periods a Planner may trust for this Place, or null (= hours unknown): the record
 * must be v1 "known", bound to this Place's own Google placeId, and re-validate cleanly. */
export function trustedOpeningPeriods(place) {
  const record = resolveStructuredOpeningPeriods(place);
  return record?.status === "known" ? sanitizeOpeningPeriods(record.periods) : null;
}

// A sidecar record takes precedence only when it is valid for the Place's current Google
// identity. Legacy embedded records remain readable without a migration.
export function resolveStructuredOpeningPeriods(place, sidecarRecord = null) {
  const placeId = structuredHoursPlaceId(place);
  if (!placeId) return null;
  for (const record of [sidecarRecord, place?.regularOpeningPeriods]) {
    if (!isPlainObject(record) || record.v !== OPENING_PERIODS_VERSION || record.placeId !== placeId) continue;
    if (record.status === "unavailable" && Array.isArray(record.periods) && record.periods.length === 0) return record;
    if (record.status === "known" && sanitizeOpeningPeriods(record.periods)) return record;
  }
  return null;
}

// Weekly intervals [start, end) in minutes from Sunday 00:00; end may pass the week boundary.
function weeklyIntervals(periods) {
  return periods.map(({ open, close }) => {
    if (!close) return { start: 0, end: WEEK };
    const start = weekMinute(open);
    let end = weekMinute(close);
    if (end <= start) end += WEEK;
    return { start, end };
  });
}

/* Opening windows for one calendar day with the given weekday (0 = Sunday), on that day's
 * extended minute timeline [0, horizon): 0 is 00:00 of the day, values past 1440 belong to the
 * early hours of the next day. Carry-in from the previous day's overnight period appears as a
 * window starting at 0. Overlapping/adjacent windows are merged; windows that only begin after
 * midnight are dropped (no item can start there). [] means known closed. */
export function dayOpeningWindows(periods, weekday, horizon = DAY) {
  const base = weekday * DAY;
  const pieces = [];
  for (const { start, end } of weeklyIntervals(periods)) {
    for (const shift of [-WEEK, 0, WEEK]) {
      const from = Math.max(0, start + shift - base);
      const to = Math.min(horizon, end + shift - base);
      if (from < to) pieces.push({ startMinute: from, endMinute: to });
    }
  }
  pieces.sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const merged = [];
  for (const piece of pieces) {
    const last = merged.at(-1);
    if (last && piece.startMinute <= last.endMinute) last.endMinute = Math.max(last.endMinute, piece.endMinute);
    else merged.push({ ...piece });
  }
  return merged.filter((window) => window.startMinute < DAY);
}

// [start, end) lies entirely inside one window ([open, close): ending exactly at close is fine).
export function intervalWithinWindows(windows, start, end) {
  return windows.some((window) => window.startMinute <= start && end <= window.endMinute);
}

const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Compact wall-clock label; "(+1)" marks the next day's early hours.
export function formatMinute(minutes) {
  return minutes > DAY ? `${clock(minutes - DAY)}(+1)` : clock(minutes);
}

export function formatWindow(window, horizon = DAY) {
  if (window.startMinute === 0 && window.endMinute >= horizon) return "全天";
  return `${clock(window.startMinute)}-${formatMinute(window.endMinute)}`;
}
