// Phase 2A.5 structured regular opening hours: sanitizer, persisted record, per-day normalizer
// and calendar-date → weekday stability. Google Places API (New) period semantics: day 0 =
// Sunday … 6 = Saturday, hour 0–23, minute 0–59, place-local time; always open = one period
// open day 0 00:00 with no close.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  dayOpeningWindows,
  formatWindow,
  intervalWithinWindows,
  openingPeriodsRecord,
  sanitizeOpeningPeriods,
  trustedOpeningPeriods,
} from "../lib/opening-hours.mjs";
import { plannerOpeningWindows, plannerTripDays } from "../lib/ai-trip-planner.mjs";
import { PLANNER_DAY_HORIZON } from "../lib/ai-trip-planner-schema.mjs";
import { alwaysOpenPeriods, weeklyPeriods, withHours } from "./fixtures/ai-planner-fixtures.mjs";

const at = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const win = (start, end) => ({ startMinute: at(start), endMinute: typeof end === "number" ? end : at(end) });
const NOW = new Date("2026-09-18T00:00:00.000Z");

test("sanitizer keeps only day/hour/minute and rejects malformed or unsupported shapes", () => {
  const google = [{ open: { day: 2, hour: 10, minute: 0, date: { year: 2026 }, truncated: false }, close: { day: 2, hour: 18, minute: 0, extra: "x" } }];
  assert.deepEqual(sanitizeOpeningPeriods(google), [{ open: { day: 2, hour: 10, minute: 0 }, close: { day: 2, hour: 18, minute: 0 } }]);
  for (const bad of [
    undefined, null, [], "10:00-18:00", {},
    [{ open: { day: 7, hour: 10, minute: 0 }, close: { day: 0, hour: 18, minute: 0 } }],
    [{ open: { day: 1, hour: 24, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } }],
    [{ open: { day: 1, hour: 10, minute: 60 }, close: { day: 1, hour: 18, minute: 0 } }],
    [{ open: { day: 1, hour: "10", minute: 0 }, close: { day: 1, hour: 18, minute: 0 } }],
    [{ open: { day: 1, hour: 10.5, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } }],
    [{ open: { day: 1, hour: 10, minute: 0 }, close: { day: 1, hour: 10, minute: 0 } }], // zero-length
    [{ open: { day: 1, hour: 10, minute: 0 } }], // missing close that is not Google's always-open form
    [{ open: { day: 0, hour: 0, minute: 0 } }, { open: { day: 1, hour: 10, minute: 0 }, close: { day: 1, hour: 12, minute: 0 } }],
    [null],
    Array.from({ length: 29 }, () => ({ open: { day: 1, hour: 1, minute: 0 }, close: { day: 1, hour: 2, minute: 0 } })),
  ]) assert.equal(sanitizeOpeningPeriods(bad), null, JSON.stringify(bad)?.slice(0, 80));
  assert.deepEqual(sanitizeOpeningPeriods(alwaysOpenPeriods()), [{ open: { day: 0, hour: 0, minute: 0 }, close: null }]);
});

test("record: search results are known-or-absent; authoritative exact details are known-or-unavailable", () => {
  const periods = weeklyPeriods("10:00", "18:00");
  assert.deepEqual(openingPeriodsRecord({ periods, weekdayDescriptions: ["x"] }, { placeId: "ChIJx", now: NOW }),
    { v: 1, status: "known", placeId: "ChIJx", periods, fetchedAt: NOW.toISOString() });
  // Search/import response without usable periods: not authoritative → field stays absent.
  for (const hours of [undefined, { weekdayDescriptions: ["星期一: 10:00–18:00"] }, { periods: [{ open: { day: 9 } }] }]) {
    assert.equal(openingPeriodsRecord(hours, { placeId: "ChIJx", now: NOW }), null);
    // Exact details: completed fetch without usable periods → unavailable (not closed, not 24h).
    assert.deepEqual(openingPeriodsRecord(hours, { placeId: "ChIJx", authoritative: true, now: NOW }),
      { v: 1, status: "unavailable", placeId: "ChIJx", periods: [], fetchedAt: NOW.toISOString() });
  }
  // Malformed metadata never reaches the record, and only real Google identities get one.
  const malformed = openingPeriodsRecord({ periods: [{ open: { day: 1, hour: 10, minute: 0, note: "<script>" } }] }, { placeId: "ChIJx", authoritative: true, now: NOW });
  assert.deepEqual(malformed.periods, []);
  for (const placeId of ["", "custom-place-1", "osm-1", "coordinate-1", "manual-address-1"]) {
    assert.equal(openingPeriodsRecord({ periods }, { placeId, authoritative: true }), null);
  }
});

test("trusted periods: only a v1 known record bound to the Place's own Google placeId", () => {
  const place = withHours({ placeId: "ChIJa" }, weeklyPeriods("10:00", "18:00"));
  assert.ok(trustedOpeningPeriods(place));
  assert.equal(trustedOpeningPeriods({ placeId: "ChIJa" }), null); // absent (legacy)
  assert.equal(trustedOpeningPeriods(withHours({ placeId: "ChIJa" }, [], { status: "unavailable" })), null);
  assert.equal(trustedOpeningPeriods({ ...place, placeId: "ChIJb" }), null); // identity changed
  assert.equal(trustedOpeningPeriods({ ...place, placeId: "" }), null);
  assert.equal(trustedOpeningPeriods({ ...place, regularOpeningPeriods: { ...place.regularOpeningPeriods, v: 2 } }), null);
  assert.equal(trustedOpeningPeriods({ ...place, regularOpeningPeriods: { ...place.regularOpeningPeriods, periods: [{ open: {} }] } }), null);
  assert.equal(trustedOpeningPeriods({ ...place, regularOpeningPeriods: "每日 10:00–18:00" }), null);
  // The display string alone is never Planner data.
  assert.equal(trustedOpeningPeriods({ placeId: "ChIJa", openingHours: "星期一: 10:00–18:00；星期二: 10:00–18:00" }), null);
});

test("normalizer: same-day, split hours, closed weekday, 24h, overnight carry-in and adjacent merge", () => {
  const H = PLANNER_DAY_HORIZON;
  // Tuesday = 2.
  assert.deepEqual(dayOpeningWindows(weeklyPeriods("10:00", "18:00"), 2, H), [win("10:00", "18:00")]);
  const split = [...weeklyPeriods("11:30", "14:00"), ...weeklyPeriods("17:00", "22:00")];
  assert.deepEqual(dayOpeningWindows(split, 2, H), [win("11:30", "14:00"), win("17:00", "22:00")]);
  assert.deepEqual(dayOpeningWindows(weeklyPeriods("10:00", "18:00", [0, 1, 3]), 2, H), []); // known closed
  // Always open (Google: day 0 00:00, no close) covers the whole extended day.
  assert.deepEqual(dayOpeningWindows(alwaysOpenPeriods(), 6, H), [{ startMinute: 0, endMinute: H }]);
  assert.deepEqual(dayOpeningWindows(alwaysOpenPeriods(), 0, H), [{ startMinute: 0, endMinute: H }]);
  // Overnight 18:00–02:00 every day: the day's own window runs into the next day, and the
  // previous day's period carries into 00:00–02:00.
  assert.deepEqual(dayOpeningWindows(weeklyPeriods("18:00", "02:00"), 2, H), [win("00:00", "02:00"), { startMinute: at("18:00"), endMinute: 24 * 60 + 120 }]);
  // Overnight only on Friday (5): Saturday gets the carry-in only; Friday gets no carry-in.
  const fridayNight = weeklyPeriods("18:00", "02:00", [5]);
  assert.deepEqual(dayOpeningWindows(fridayNight, 6, H), [win("00:00", "02:00")]);
  assert.deepEqual(dayOpeningWindows(fridayNight, 5, H), [{ startMinute: at("18:00"), endMinute: 24 * 60 + 120 }]);
  // Week-spanning: Saturday 22:00 → Sunday 02:00 carries into Sunday.
  assert.deepEqual(dayOpeningWindows(weeklyPeriods("22:00", "02:00", [6]), 0, H), [win("00:00", "02:00")]);
  // Adjacent periods (10–14, 14–18) and a 24:00 close touching the next day's 00:00 are merged.
  const adjacent = [...weeklyPeriods("10:00", "14:00", [2]), ...weeklyPeriods("14:00", "18:00", [2])];
  assert.deepEqual(dayOpeningWindows(adjacent, 2, H), [win("10:00", "18:00")]);
  const untilMidnight = [...weeklyPeriods("17:00", "24:00", [2]), ...weeklyPeriods("00:00", "03:00", [3])];
  assert.deepEqual(dayOpeningWindows(untilMidnight, 2, H), [{ startMinute: at("17:00"), endMinute: 24 * 60 + 180 }]);
  // A window that only opens after midnight cannot hold a start on this day and is dropped.
  assert.deepEqual(dayOpeningWindows([...weeklyPeriods("10:00", "20:00", [2]), ...weeklyPeriods("01:00", "05:00", [3])], 2, H), [win("10:00", "20:00")]);
});

test("containment uses [open, close): ending exactly at close is inside; any overhang is not", () => {
  const windows = [win("10:00", "18:00")];
  assert.equal(intervalWithinWindows(windows, at("17:00"), at("18:00")), true);
  assert.equal(intervalWithinWindows(windows, at("17:30"), at("19:00")), false);
  assert.equal(intervalWithinWindows(windows, at("09:45"), at("10:45")), false);
  const split = [win("11:30", "14:00"), win("17:00", "22:00")];
  assert.equal(intervalWithinWindows(split, at("13:30"), at("15:00")), false); // crosses the closed gap
  assert.equal(formatWindow(win("18:00", 24 * 60 + 120), PLANNER_DAY_HORIZON), "18:00-02:00(+1)");
  assert.equal(formatWindow(win("17:00", "24:00"), PLANNER_DAY_HORIZON), "17:00-24:00");
  assert.equal(formatWindow({ startMinute: 0, endMinute: PLANNER_DAY_HORIZON }, PLANNER_DAY_HORIZON), "全天");
});

test("availability by trip day: weekday mapping, leap day, year boundary and unknown hours", () => {
  const tuesdayOnly = withHours({ placeId: "ChIJa" }, weeklyPeriods("10:00", "18:00", [2]));
  const days = plannerTripDays({ startDate: "2026-09-21", endDate: "2026-09-23" }); // Mon, Tue, Wed
  assert.deepEqual(days.map((day) => [day.dayKey, day.weekdayIndex]), [["9/21", 1], ["9/22", 2], ["9/23", 3]]);
  assert.deepEqual(plannerOpeningWindows(tuesdayOnly, days), { "9/21": [], "9/22": [win("10:00", "18:00")], "9/23": [] });
  assert.equal(plannerOpeningWindows({ placeId: "ChIJa" }, days), null);
  assert.deepEqual(plannerTripDays({ startDate: "2028-02-28", endDate: "2028-03-01" }).map((day) => [day.dayKey, day.weekdayIndex]), [["2/28", 1], ["2/29", 2], ["3/1", 3]]);
  assert.deepEqual(plannerTripDays({ startDate: "2026-12-31", endDate: "2027-01-01" }).map((day) => [day.dayKey, day.weekdayIndex]), [["12/31", 4], ["1/1", 5]]);
});

test("the same YYYY-MM-DD maps to the same weekday and availability under any TZ", () => {
  const script = `
    import { plannerTripDays, plannerOpeningWindows } from "./lib/ai-trip-planner.mjs";
    import { weeklyPeriods, withHours } from "./tests/fixtures/ai-planner-fixtures.mjs";
    const days = plannerTripDays({ startDate: "2026-09-22", endDate: "2026-09-24" });
    const place = withHours({ placeId: "ChIJa" }, weeklyPeriods("18:00", "02:00", [2]));
    process.stdout.write(JSON.stringify({ offset: new Date("2026-09-22T00:00:00").getTimezoneOffset(), days, windows: plannerOpeningWindows(place, days) }));`;
  const cwd = new URL("..", import.meta.url);
  const results = ["UTC", "Asia/Tokyo", "Pacific/Kiritimati", "America/Los_Angeles", "Pacific/Pago_Pago"].map((TZ) =>
    execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd, env: { ...process.env, TZ }, encoding: "utf8" }));
  const parsed = results.map((result) => JSON.parse(result));
  assert.equal(new Set(parsed.map((result) => result.offset)).size, 5, "each child really ran in a different time zone");
  assert.equal(new Set(parsed.map(({ days, windows }) => JSON.stringify({ days, windows }))).size, 1, "weekday/availability must not depend on the process time zone");
  const { days, windows } = parsed[0];
  assert.deepEqual(days.map((day) => day.weekdayIndex), [2, 3, 4]);
  assert.deepEqual(windows["9/23"], [win("00:00", "02:00")]);
});
