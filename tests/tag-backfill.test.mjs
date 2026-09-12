import "../lib/travel-area-audit.js";
import AreaTags from "../lib/area-tags.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const catalog = JSON.parse(readFileSync(new URL("../data/area-geometry/travel-area-boundaries.json", import.meta.url), "utf8"));
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));
const json = (value) => JSON.parse(JSON.stringify(value));
// vm.createContext objects live in a different realm; deepStrictEqual (what assert/strict's
// deepEqual aliases to) rejects cross-realm plain objects even with identical structure, so
// every comparison against a value that touched the vm context goes through this JSON round
// trip first to normalize it back into this file's own realm.
const eq = (actual, expected, message) => assert.deepEqual(json(actual), expected, message);

// Real production-shaped coordinates/address components, same fixtures proven against the
// deployed boundary file in tests/area-tag-containment.test.mjs.
const chome = (name, level = "sublocality_level_2") => ({ longText: name, types: [level, "sublocality", "political"] });
const place = (name, lat, lng, town, extra = {}) => ({
  name, latitude: lat, longitude: lng, countryCode: "JP",
  formattedAddress: `${town}, Tokyo`,
  addressComponentsOriginal: [chome(town)], addressComponents: [chome(town)], ...extra,
});
const HANAKAWADO = place("淺草牛光", 35.711483699999995, 139.7985892, "花川戸", { areaTags: [] });
const JINGUMAE = place("BEAMS 原宿", 35.6711722, 139.7076413, "神宮前", { areaTags: [] }); // no verified polygon -> address fallback only

function makeContext(overrides = {}) {
  const restaurantHelpers = section("function restaurantTagValues", "function placesScreen");
  const identityHelpers = section("function placeDetailKey", "function isAddressDetailPlace");
  const urlHelper = section("function isGoogleMapsUrl", "function googleMapsNavigationUrl");
  const migration = section("let tagBackfillMigrationDone", "async function saveSharedTrip");
  const context = {
    AreaTags,
    escapeHtml: String,
    state: { places: [], tripId: "trip-1", ...overrides.state },
    canEdit: overrides.canEdit || (() => true),
    loadAreaGeometry: overrides.loadAreaGeometry || (() => Promise.resolve(catalog)),
    persist: overrides.persist || (() => {}),
    render: overrides.render || (() => {}),
    fetch: overrides.fetch || (() => { throw new Error("unexpected fetch"); }),
    console,
  };
  const c = vm.createContext(context);
  vm.runInContext(restaurantHelpers + identityHelpers + urlHelper + migration, c);
  return c;
}

test("area backfill: verified containment wins, fills at most one canonical tag, never touches an existing value", () => {
  const c = makeContext();
  const tagged = { ...json(HANAKAWADO), areaTags: ["原宿"] }; // already has a value -> must stay untouched
  const manifest = c.buildTagBackfillManifest([json(HANAKAWADO), tagged], catalog);
  eq(manifest[0].area, { status: "auto-safe", proposed: ["淺草"] });
  eq(manifest[1].area, { status: "skip" });
});

test("area backfill: no verified polygon falls back to the unambiguous address token; no candidates at all is a skip", () => {
  const c = makeContext();
  const manifest = c.buildTagBackfillManifest([json(JINGUMAE)], catalog);
  eq(manifest[0].area, { status: "auto-safe", proposed: ["神宮前"] });
  const blank = { name: "nothing", areaTags: [] };
  eq(c.buildTagBackfillManifest([blank], catalog)[0].area, { status: "skip" });
});

test("area backfill never mutates its inputs while computing the manifest", () => {
  const c = makeContext();
  const places = [json(HANAKAWADO), json(JINGUMAE)];
  const before = json(places);
  c.buildTagBackfillManifest(places, catalog);
  assert.deepEqual(places, before);
});

test("restaurant backfill: structured evidence only, at most one tag, generic-only types are a skip pending lookup", () => {
  const c = makeContext();
  const cases = [
    [{ kind: "restaurant", restaurantTags: [], primaryType: "hot_pot_restaurant" }, { status: "auto-safe", proposed: ["火鍋"], evidence: "local" }],
    [{ kind: "restaurant", primaryType: "hot_pot_restaurant" }, { status: "auto-safe", proposed: ["火鍋"], evidence: "local" }], // missing array entirely
    [{ kind: "restaurant", types: ["food", "sushi_restaurant", "point_of_interest"] }, { status: "auto-safe", proposed: ["壽司"], evidence: "local" }],
    [{ kind: "restaurant", primaryTypeDisplayName: { text: "火鍋餐廳" } }, { status: "auto-safe", proposed: ["火鍋"], evidence: "local" }],
    [{ kind: "restaurant", primaryType: "restaurant", types: ["food", "establishment", "point_of_interest"], name: "海底撈燒肉拉麵", description: "火鍋" }, { status: "skip" }], // no placeId -> skip, name/description never read
    [{ kind: "restaurant", primaryType: "restaurant", types: ["food"], placeId: "ChIJExactLookupNeeded" }, { status: "needs-lookup", placeId: "ChIJExactLookupNeeded" }],
    [{ kind: "attraction", primaryType: "hot_pot_restaurant" }, { status: "skip" }], // not a restaurant kind
  ];
  for (const [input, expected] of cases) {
    eq(c.buildTagBackfillManifest([input], catalog)[0].restaurant, expected, JSON.stringify(input));
  }
});

test("restaurant backfill: an existing non-empty restaurantTags is never reconsidered, even when Google evidence disagrees", () => {
  const c = makeContext();
  const place1 = { kind: "restaurant", restaurantTags: ["麻辣鍋"], primaryType: "hot_pot_restaurant" };
  eq(c.buildTagBackfillManifest([place1], catalog)[0].restaurant, { status: "skip" });
});

test("area and restaurant fields are judged completely independently on the same place", () => {
  const c = makeContext();
  const mixed = { ...json(HANAKAWADO), areaTags: ["銀座"], kind: "restaurant", restaurantTags: [], primaryType: "ramen_restaurant" };
  const entry = c.buildTagBackfillManifest([mixed], catalog)[0];
  eq(entry.area, { status: "skip" });
  eq(entry.restaurant, { status: "auto-safe", proposed: ["拉麵"], evidence: "local" });
});

test("exact placeId lookup: identity-matched success classifies from structured fields only, never a name/Nearby search", async () => {
  const c = makeContext({
    fetch: async (url, options) => {
      assert.equal(url, "/api/places");
      const body = JSON.parse(options.body);
      assert.deepEqual(body.places.map((p) => p.placeId), ["ChIJGood"]);
      assert.equal(body.places[0].resolveDetails, true);
      return { ok: true, json: async () => ({ places: [{ placeId: "ChIJGood", primaryType: "hot_pot_restaurant", types: [] }] }) };
    },
  });
  const target = { kind: "restaurant", placeId: "ChIJGood" };
  const manifest = c.buildTagBackfillManifest([target], catalog);
  assert.equal(manifest[0].restaurant.status, "needs-lookup");
  const summary = await c.resolveTagBackfillLookups(manifest, [target]);
  eq(summary, { lookupNeededCount: 1, attempted: 1, succeeded: 1 });
  eq(manifest[0].restaurant, { status: "auto-safe", proposed: ["火鍋"], evidence: "exact-lookup" });
});

test("exact placeId lookup: a server identity mismatch or error is a skip, never a retry with a different query", async () => {
  for (const response of [
    { placeId: "ChIJDifferent", primaryType: "hot_pot_restaurant" },
    { placeId: "ChIJGood", error: "PLACE_DETAILS_404" },
  ]) {
    const c = makeContext({ fetch: async () => ({ ok: true, json: async () => ({ places: [response] }) }) });
    const target = { kind: "restaurant", placeId: "ChIJGood" };
    const manifest = c.buildTagBackfillManifest([target], catalog);
    await c.resolveTagBackfillLookups(manifest, [target]);
    eq(manifest[0].restaurant, { status: "skip" });
  }
});

test("exact placeId lookup: generic-only result (restaurant/food/establishment) stays a skip, never a placeholder tag", async () => {
  const c = makeContext({ fetch: async () => ({ ok: true, json: async () => ({ places: [{ placeId: "ChIJGood", primaryType: "restaurant", types: ["food", "point_of_interest"] }] }) }) });
  const target = { kind: "restaurant", placeId: "ChIJGood" };
  const manifest = c.buildTagBackfillManifest([target], catalog);
  await c.resolveTagBackfillLookups(manifest, [target]);
  eq(manifest[0].restaurant, { status: "skip" });
});

test("lookup batching cap: more than 20 needed lookups performs zero network calls this pass and reports the count", async () => {
  let fetches = 0;
  const c = makeContext({ fetch: async () => { fetches += 1; return { ok: true, json: async () => ({ places: [] }) }; } });
  const targets = Array.from({ length: 21 }, (_, i) => ({ kind: "restaurant", placeId: `ChIJ${i}` }));
  const manifest = c.buildTagBackfillManifest(targets, catalog);
  assert.equal(manifest.filter((e) => e.restaurant.status === "needs-lookup").length, 21);
  const summary = await c.resolveTagBackfillLookups(manifest, targets);
  eq(summary, { lookupNeededCount: 21, attempted: 0, succeeded: 0, skippedCapExceeded: true });
  assert.equal(fetches, 0);
  assert.ok(manifest.every((e) => e.restaurant.status === "needs-lookup"), "nothing is silently downgraded to skip by the cap");
});

test("lookup batching: exactly 20 needed lookups is safe and runs in chunks of at most 10 per request", async () => {
  const chunkSizes = [];
  const c = makeContext({
    fetch: async (url, options) => {
      const body = JSON.parse(options.body);
      chunkSizes.push(body.places.length);
      return { ok: true, json: async () => ({ places: body.places.map((p) => ({ placeId: p.placeId, primaryType: "hot_pot_restaurant" })) }) };
    },
  });
  const targets = Array.from({ length: 20 }, (_, i) => ({ kind: "restaurant", placeId: `ChIJ${i}` }));
  const manifest = c.buildTagBackfillManifest(targets, catalog);
  const summary = await c.resolveTagBackfillLookups(manifest, targets);
  eq(summary, { lookupNeededCount: 20, attempted: 20, succeeded: 20 });
  assert.deepEqual(chunkSizes, [10, 10]);
  assert.ok(manifest.every((e) => e.restaurant.status === "auto-safe"));
});

test("apply: fingerprint gate aborts the whole manifest with zero mutations when the trip changed underneath it", () => {
  const c = makeContext();
  const places = [json(HANAKAWADO)];
  c.state.places = places;
  const before = c.tagBackfillFingerprint(places);
  const manifest = c.buildTagBackfillManifest(places, catalog);
  places[0].areaTags = ["手動加的"]; // trip changed between dry-run and apply
  const result = c.applyTagBackfillManifest(manifest, before);
  eq(result, { aborted: true, areaCount: 0, restaurantCount: 0 });
  assert.deepEqual(places[0].areaTags, ["手動加的"]);
});

test("apply: writes only the manifest's auto-safe fields, nothing else, and only through the existing persist path", () => {
  const c = makeContext();
  const restaurant = { kind: "restaurant", restaurantTags: [], primaryType: "ramen_restaurant", placeId: "keep-me", name: "keep-me" };
  const places = [json(HANAKAWADO), restaurant];
  c.state.places = places;
  const before = c.tagBackfillFingerprint(places);
  const manifest = c.buildTagBackfillManifest(places, catalog);
  const result = c.applyTagBackfillManifest(manifest, before);
  eq(result, { aborted: false, areaCount: 1, restaurantCount: 1 });
  eq(places[0].areaTags, ["淺草"]);
  eq(restaurant.restaurantTags, ["拉麵"]);
  assert.equal(restaurant.placeId, "keep-me");
  assert.equal(restaurant.name, "keep-me");
});

test("idempotency: a second dry run after apply proposes zero further mutations", () => {
  const c = makeContext();
  const places = [json(HANAKAWADO)];
  c.state.places = places;
  const before = c.tagBackfillFingerprint(places);
  const manifest = c.buildTagBackfillManifest(places, catalog);
  c.applyTagBackfillManifest(manifest, before);
  const second = c.buildTagBackfillManifest(places, catalog);
  eq(second[0].area, { status: "skip" });
});

test("scheduleTagBackfillMigration: one-shot per trip, no-op when nothing is pending, persists exactly once through the real path", async () => {
  let persistCalls = 0, renderCalls = 0, geometryCalls = 0;
  const restaurant = { kind: "restaurant", restaurantTags: [], primaryType: "ramen_restaurant", placeId: "keep-me" };
  const c = makeContext({
    state: { places: [json(HANAKAWADO), restaurant], tripId: "trip-1" },
    loadAreaGeometry: () => { geometryCalls += 1; return Promise.resolve(catalog); },
    persist: () => { persistCalls += 1; },
    render: () => { renderCalls += 1; },
  });
  c.scheduleTagBackfillMigration();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  eq(c.state.places[0].areaTags, ["淺草"]);
  eq(c.state.places[1].restaurantTags, ["拉麵"]);
  assert.equal(persistCalls, 1);
  assert.equal(renderCalls, 1);
  assert.equal(geometryCalls, 1);

  // Second hydration of the same trip: already backfilled, so nothing is even pending.
  c.scheduleTagBackfillMigration();
  await Promise.resolve();
  assert.equal(geometryCalls, 1, "one-shot guard short-circuits before loading geometry again");
  assert.equal(persistCalls, 1);
});

test("scheduleTagBackfillMigration: does nothing for a guest/readonly session", async () => {
  let geometryCalls = 0;
  const c = makeContext({
    state: { places: [json(HANAKAWADO)], tripId: "trip-2" },
    canEdit: () => false,
    loadAreaGeometry: () => { geometryCalls += 1; return Promise.resolve(catalog); },
  });
  c.scheduleTagBackfillMigration();
  await Promise.resolve();
  assert.equal(geometryCalls, 0);
  eq(c.state.places[0].areaTags, []);
});

test("scheduleTagBackfillMigration: aborts with zero writes if the trip switched during the async geometry/lookup load", async () => {
  let persistCalls = 0;
  const c = makeContext({
    state: { places: [json(HANAKAWADO)], tripId: "trip-1" },
    loadAreaGeometry: () => Promise.resolve(catalog).then((value) => { c.state.tripId = "trip-switched"; return value; }),
    persist: () => { persistCalls += 1; },
  });
  c.scheduleTagBackfillMigration();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(persistCalls, 0);
  eq(c.state.places[0].areaTags, []);
});

test("existing containment-migration wiring and hydration call sites are both still present", () => {
  assert.match(source, /scheduleContainmentMigration\(\);\r?\n\s*scheduleTagBackfillMigration\(\);/);
  assert.match(section("function scheduleTagBackfillMigration", "async function saveSharedTrip"), /tagBackfillMigrationDone === state\.tripId \|\| !canEdit\(\)/);
});
