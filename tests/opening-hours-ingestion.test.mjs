// Phase 2A.5 structured opening hours acquisition and persistence: Google search vs exact-details
// semantics, Trip PUT/GET/reload round trip, the one-time lazy Detail backfill, and identity safety.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import placesHandler from "../api/places.mjs";
import tripHandler from "../api/trip.mjs";
import { boot, trip, place, bindFullEditor, edit, submitFull, json, source } from "./helpers/phase-c-browser.mjs";

const PERIODS = [{ open: { day: 2, hour: 10, minute: 0 }, close: { day: 2, hour: 18, minute: 0 } }];
const GOOGLE_PERIODS = [{ open: { day: 2, hour: 10, minute: 0, date: { year: 2026, month: 9, day: 22 } }, close: { day: 2, hour: 18, minute: 0, truncated: false } }];
const COMPONENTS = [
  { longText: "西新宿", types: ["sublocality_level_2"] },
  { longText: "新宿區", types: ["locality"] },
  { longText: "東京都", types: ["administrative_area_level_1"] },
  { longText: "日本", shortText: "JP", types: ["country"] },
];

function responseMock() {
  return { statusCode: 200, payload: null, headers: {},
    status(code) { this.statusCode = code; return this; }, setHeader(name, value) { this.headers[name] = value; return this; }, json(payload) { this.payload = payload; return this; } };
}

function googlePlace(id, regularOpeningHours) {
  return { id, displayName: { text: "測試景點" }, formattedAddress: "東京都新宿區西新宿", addressComponents: COMPONENTS, primaryType: "tourist_attraction",
    types: ["tourist_attraction"], primaryTypeDisplayName: { text: "景點" }, location: { latitude: 35.69, longitude: 139.69 },
    googleMapsUri: `https://www.google.com/maps/place/?q=place_id:${id}`, nationalPhoneNumber: "03-0000-0000",
    ...(regularOpeningHours ? { regularOpeningHours } : {}) };
}

async function resolvePlaces(item, googleHours) {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url) => {
    const target = String(url);
    calls.push(target);
    if (target.includes("places:searchText")) return new Response(JSON.stringify({ places: [googlePlace("search-id", googleHours)] }), { status: 200 });
    const id = decodeURIComponent(target.match(/\/v1\/places\/([^?]+)/)?.[1] || "");
    return new Response(JSON.stringify(googlePlace(id, googleHours)), { status: 200 });
  };
  const response = responseMock();
  await placesHandler({ method: "POST", body: { places: [item] } }, response);
  return { resolved: response.payload.places[0], calls };
}

test("search/import: usable periods are stored as known; a search result without periods leaves the field absent", async () => {
  const known = await resolvePlaces({ hintName: "測試景點", destination: "東京" }, { weekdayDescriptions: ["星期二: 10:00–18:00"], periods: GOOGLE_PERIODS });
  assert.equal(known.resolved.regularOpeningPeriods.status, "known");
  assert.equal(known.resolved.regularOpeningPeriods.placeId, "search-id");
  assert.deepEqual(known.resolved.regularOpeningPeriods.periods, PERIODS);
  assert.ok(!Number.isNaN(Date.parse(known.resolved.regularOpeningPeriods.fetchedAt)));
  assert.equal(known.resolved.openingHours, "星期二: 10:00–18:00", "display string kept for the UI");
  for (const hours of [undefined, { weekdayDescriptions: ["星期二: 10:00–18:00"] }, { periods: [{ open: { day: 2, hour: 10, minute: 0 } }] }]) {
    const { resolved } = await resolvePlaces({ hintName: "測試景點", destination: "東京" }, hours);
    assert.equal("regularOpeningPeriods" in resolved, false, "not authoritative: no unavailable marker from search");
  }
});

test("exact Place Details decide known or unavailable once; malformed data never enters the record", async () => {
  const known = await resolvePlaces({ placeId: "ChIJexact", resolveDetails: true }, { weekdayDescriptions: ["星期二: 10:00–18:00"], periods: GOOGLE_PERIODS });
  assert.deepEqual({ ...known.resolved.regularOpeningPeriods, fetchedAt: "t" }, { v: 1, status: "known", placeId: "ChIJexact", periods: PERIODS, fetchedAt: "t" });
  assert.ok(known.calls.every((url) => !url.includes("searchText")));
  for (const hours of [undefined, { weekdayDescriptions: ["星期二: 10:00–18:00"] }, { periods: [{ open: { day: 2, hour: 30, minute: 0 }, close: { day: 2, hour: 18, minute: 0 } }] }]) {
    const { resolved } = await resolvePlaces({ placeId: "ChIJexact", resolveDetails: true }, hours);
    assert.deepEqual({ ...resolved.regularOpeningPeriods, fetchedAt: "t" }, { v: 1, status: "unavailable", placeId: "ChIJexact", periods: [], fetchedAt: "t" });
  }
});

test("regularOpeningPeriods survives Trip PUT → GET unchanged, alongside the display string", async () => {
  const store = new Map();
  process.env.KV_REST_API_URL = "https://redis.test";
  process.env.KV_REST_API_TOKEN = "test-token";
  globalThis.fetch = async (url, options = {}) => {
    const [command, redisKey, value] = JSON.parse(options.body);
    let result = null;
    if (command === "GET") result = store.get(redisKey) ?? null;
    if (command === "SET") { store.set(redisKey, value); result = "OK"; }
    if (command === "EVAL") throw new Error("NO_SCRIPTING");
    return new Response(JSON.stringify({ result }), { status: 200 });
  };
  const record = { v: 1, status: "known", placeId: "google-shinjuku", periods: PERIODS, fetchedAt: "2026-09-18T00:00:00.000Z" };
  const unavailable = { v: 1, status: "unavailable", placeId: "google-ginza", periods: [], fetchedAt: "2026-09-18T00:00:00.000Z" };
  const stored = { ...trip([]), id: "hours", members: { alice: "alice" } };
  store.set("tokyo-family-trip:trip:hours", JSON.stringify(stored));
  store.set(`tokyo-family-trip:session:${createHash("sha256").update("alice-token").digest("hex")}`, JSON.stringify({ id: "alice", nickname: "alice" }));
  const headers = { cookie: "tokyo_trip_session=alice-token" };
  const places = [place("shinjuku", { openingHours: "星期二: 10:00–18:00", regularOpeningPeriods: record }), place("ginza", { regularOpeningPeriods: unavailable }), place("shibuya")];
  const put = responseMock();
  await tripHandler({ method: "PUT", query: { id: "hours" }, url: "/api/trip?id=hours", headers, body: { ...stored, places } }, put);
  assert.equal(put.statusCode, 200, JSON.stringify(put.payload));
  const get = responseMock();
  await tripHandler({ method: "GET", query: { id: "hours" }, url: "/api/trip?id=hours", headers }, get);
  assert.deepEqual(get.payload.places[0].regularOpeningPeriods, record);
  assert.equal(get.payload.places[0].openingHours, "星期二: 10:00–18:00");
  assert.deepEqual(get.payload.places[1].regularOpeningPeriods, unavailable);
  assert.equal("regularOpeningPeriods" in get.payload.places[2], false, "legacy absent stays absent (no migration)");
});

const RECORD = (placeId, status = "known") => ({ v: 1, status, placeId, periods: status === "known" ? PERIODS : [], fetchedAt: "2026-09-18T00:00:00.000Z" });
const detailRequests = (b) => b.requests.filter((request) => request.url === "/api/places");
async function openDetails(b, resolved) {
  const before = detailRequests(b).length;
  const pending = b.run("ensurePlaceDetails(state.places[0])");
  const request = detailRequests(b)[before];
  if (request) await b.reply(request, { places: [resolved] });
  await pending;
  return detailRequests(b).length - before;
}
function trackPersist(b) {
  b.run("var hoursPersist = 0; var hoursOriginalPersist = persist; persist = (...args) => { hoursPersist += 1; return hoursOriginalPersist(...args); }");
  return () => b.run("hoursPersist");
}

test("reload/hydration keeps the stored structured hours", async () => {
  const b = await boot(trip([place("shinjuku", { regularOpeningPeriods: RECORD("google-shinjuku") })]));
  assert.deepEqual(json(b.state.places[0].regularOpeningPeriods), RECORD("google-shinjuku"));
});

test("legacy Place (photos already loaded, no structured hours): first Detail open backfills once; reopen never refetches", async () => {
  const b = await boot(trip([place("shinjuku", { photosLoaded: true, fullName: "原名", openingHours: "原營業字串", phone: "原電話" })]));
  const persisted = trackPersist(b);
  const before = json(b.state.places[0]);
  const resolved = { placeId: "google-shinjuku", name: "Google 新名稱", fullName: "x", openingHours: "新字串", phone: "新電話", photos: [], regularOpeningPeriods: RECORD("google-shinjuku") };
  assert.equal(await openDetails(b, resolved), 1);
  const after = json(b.state.places[0]);
  assert.deepEqual(after.regularOpeningPeriods, RECORD("google-shinjuku"));
  // Hours-only backfill touches nothing else (display string, names, phone, area stay as stored).
  assert.deepEqual({ ...after, regularOpeningPeriods: undefined, detailsLoading: undefined }, { ...before, regularOpeningPeriods: undefined, detailsLoading: undefined });
  assert.equal(persisted(), 1);
  assert.equal(await openDetails(b, resolved), 0, "second open: no structured-hours refetch");
  // Also through the real Detail sheet open path.
  b.run("openPlaceSheet(placeDetailKey(state.places[0]))");
  assert.equal(detailRequests(b).length, 1);
});

test("completed fetch state (known or unavailable) bound to the same placeId is never retried", async () => {
  for (const status of ["known", "unavailable"]) {
    const b = await boot(trip([place("shinjuku", { photosLoaded: true, regularOpeningPeriods: RECORD("google-shinjuku", status) })]));
    assert.equal(await openDetails(b, {}), 0, status);
    b.run("openPlaceSheet(placeDetailKey(state.places[0]))");
    assert.equal(detailRequests(b).length, 0, status);
  }
});

test("unavailable result is stored and ends retries; a failed backfill is not retried again within the session", async () => {
  const b = await boot(trip([place("shinjuku", { photosLoaded: true })]));
  assert.equal(await openDetails(b, { placeId: "google-shinjuku", regularOpeningPeriods: RECORD("google-shinjuku", "unavailable") }), 1);
  assert.equal(json(b.state.places[0].regularOpeningPeriods).status, "unavailable");
  assert.equal(await openDetails(b, {}), 0);
  const failing = await boot(trip([place("shinjuku", { photosLoaded: true })]));
  const persisted = trackPersist(failing);
  assert.equal(await openDetails(failing, { error: "PLACE_DETAILS_500" }), 1);
  assert.equal("regularOpeningPeriods" in failing.state.places[0], false);
  assert.equal(persisted(), 0);
  assert.equal(await openDetails(failing, {}), 0, "no loop / no repeated Google call in the same session");
});

test("a Place still needing photos gets photos and structured hours from one request", async () => {
  const b = await boot(trip([place("shinjuku", {})]));
  const resolved = { placeId: "google-shinjuku", name: "新宿", openingHours: "星期二: 10:00–18:00", photos: [{ name: "places/google-shinjuku/photos/a" }], regularOpeningPeriods: RECORD("google-shinjuku") };
  assert.equal(await openDetails(b, resolved), 1);
  assert.equal(b.state.places[0].photosLoaded, true);
  assert.equal(b.state.places[0].openingHours, "星期二: 10:00–18:00");
  assert.deepEqual(json(b.state.places[0].regularOpeningPeriods), RECORD("google-shinjuku"));
  assert.equal(await openDetails(b, resolved), 0);
});

test("identity safety: a record bound to another placeId is ignored and refetched; mismatched responses and custom Places never write hours", async () => {
  // Stored hours belong to an older Google identity → treated as not fetched for this one.
  const moved = await boot(trip([place("shinjuku", { photosLoaded: true, regularOpeningPeriods: RECORD("google-older") })]));
  assert.equal(await openDetails(moved, { placeId: "google-shinjuku", regularOpeningPeriods: RECORD("google-shinjuku") }), 1);
  assert.equal(moved.state.places[0].regularOpeningPeriods.placeId, "google-shinjuku");
  // A response whose record is for a different Place is never stored.
  const foreign = await boot(trip([place("shinjuku", { photosLoaded: true })]));
  await openDetails(foreign, { placeId: "google-shinjuku", regularOpeningPeriods: RECORD("google-other") });
  assert.equal("regularOpeningPeriods" in foreign.state.places[0], false);
  // Custom / address / locked Places never call Google for hours.
  for (const extra of [{ placeId: "", sourceUrl: "" }, { placeId: "custom-place-1" }, { manualLocation: true }, { detailsLocked: true }, { coordinateLocation: true }]) {
    const custom = await boot(trip([place("shinjuku", { photosLoaded: true, ...extra })]));
    assert.equal(await openDetails(custom, {}), 0, JSON.stringify(extra));
  }
});

test("identity safety: a full self-confirmed-address save drops Google structured hours; candidate drafts can never override them", async () => {
  const b = await boot(trip([place("shinjuku", { photosLoaded: true, regularOpeningPeriods: RECORD("google-shinjuku") })]));
  const form = bindFullEditor(b);
  edit(form, "address", "東京都新宿區西新宿 9-9-9");
  await submitFull(b, form, place("shinjuku", { formattedAddress: "東京都新宿區西新宿 9-9-9" }));
  assert.equal(b.state.places[0].manualLocation, true);
  assert.equal("regularOpeningPeriods" in b.state.places[0], false);
  // Candidate draft overlay: the original Google candidate's record always wins.
  const c = await boot(trip([place("shinjuku")]));
  c.run(`candidateDraftStore.set("google-cand", { placeId: "google-cand", name: "改名", regularOpeningPeriods: { v: 1, status: "known", placeId: "google-cand", periods: [] } })`);
  const merged = json(c.run(`finalizeCandidateForBatchAdd({ placeId: "google-cand", name: "原名", regularOpeningPeriods: ${JSON.stringify(RECORD("google-cand"))} })`));
  assert.equal(merged.name, "改名");
  assert.deepEqual(merged.regularOpeningPeriods, RECORD("google-cand"));
  assert.ok(json(c.run("CANDIDATE_DRAFT_IDENTITY_FIELDS")).includes("regularOpeningPeriods"));
  // Import enrichment only keeps a record bound to the resolved Google placeId.
  assert.match(source, /regularOpeningPeriods: resolved\.regularOpeningPeriods\?\.placeId && resolved\.regularOpeningPeriods\.placeId === resolved\.placeId/);
});
