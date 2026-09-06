import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import placesHandler from "../api/places.mjs";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const shinjukuId = "ChIJL5-SRCaNGGAROpfSORNTpp4";
const orixId = "ChIJMeaUejNOGGARxXDvgCM7TRg";
const photo = (id) => ({ name: `places/${id}/photos/test-photo`, attribution: id });
function savedPlace(overrides = {}) {
  return { name: "同名地點", fullName: "新宿原名", placeId: shinjukuId,
    formattedAddress: "新宿區大久保1-16-19", latitude: 35.7005251, longitude: 139.7031715,
    sourceUrl: "https://maps.google.com/?cid=11431916046166169402", category: "住宿",
    phone: "原電話", photos: [photo(shinjukuId)], ...overrides };
}
function functionSource(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
}
function frontend(places, resolved) {
  const calls = [], saves = [];
  const context = {
    state: { places, destination: "藤澤", tripId: "test-trip" },
    normalizeGoogleMapsUrl: (url) => url || "",
    isGoogleMapsUrl: (url) => /^https:\/\/(?:maps\.google\.com|www\.google\.com)\//.test(url || ""),
    URL, CSS: { escape: (s) => s }, document: { querySelector: () => null },
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => ({ places: [resolved] }) }; },
    normalizedPlaceKind: () => "lodging", applyPlanningRegionResolution: () => {},
    persist: (options) => saves.push(options), sheetRoot: { innerHTML: "" },
    escapeHtml: (s) => String(s || ""), placeReferenceMeta: () => null,
    placeNavigationUrl: () => "maps", safeTabelogUrl: () => "", tabelogMultilingualWebUrl: () => "",
    tabelogAppLink: () => "", placeVoters: () => [], travelAreaDisplayName: () => "新宿",
    formatOpeningHours: () => "", placeAssignments: () => [], placeScheduleLabel: () => "",
    canEdit: () => false, placeCreatorName: () => "測試", currentMemberId: () => "test",
  };
  vm.createContext(context);
  for (const name of ["placeDetailKey", "resolveDetailPlace", "isSelectedMapDetailPlace", "detailGooglePlaceId", "isAddressDetailPlace", "identitySafePhotos", "ensurePlaceDetails", "openPlaceSheet"]) {
    vm.runInContext(functionSource(name), context);
  }
  return { context, calls, saves };
}

test("saved identity detail lookup never searches name plus trip destination", async () => {
  const place = savedPlace();
  const { context, calls, saves } = frontend([place], { ...place, name: place.fullName, photos: [photo(shinjukuId), photo(orixId)] });
  await context.ensurePlaceDetails(place);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { places: [{ sourceUrl: place.sourceUrl, placeId: shinjukuId, resolveDetails: true }] });
  assert.equal(place.placeId, shinjukuId);
  assert.equal(place.formattedAddress, "新宿區大久保1-16-19");
  assert.equal(place.latitude, 35.7005251);
  assert.equal(place.longitude, 139.7031715);
  assert.deepEqual(Array.from(place.photos, p => p.name), [photo(shinjukuId).name]);
  assert.equal(saves.length, 1);
});

test("mismatched or missing response identity cannot mutate or persist Google metadata", async () => {
  for (const id of [orixId, undefined]) {
    const place = savedPlace(), before = structuredClone(place);
    const { context, saves } = frontend([place], { placeId: id, name: "Orix", formattedAddress: "藤澤", latitude: 35.339026, longitude: 139.4851213, photos: [photo(orixId)], phone: "0466", googleMapsUrl: "wrong" });
    await context.ensurePlaceDetails(place);
    const { detailsLoading, ...after } = place;
    assert.equal(detailsLoading, false);
    assert.deepEqual(after, before);
    assert.equal(saves.length, 0);
  }
});

test("address records and CID-only legacy records never trigger business detail search", async () => {
  for (const overrides of [{ category: "建築物" }, { category: "郵遞區號" }, { coordinateLocation: true }, { manualLocation: true }, { addressProvider: "google" }, { placeId: "osm-123" }, { placeId: "" }]) {
    const place = savedPlace(overrides), before = structuredClone(place);
    const { context, calls, saves } = frontend([place], { placeId: orixId });
    await context.ensurePlaceDetails(place);
    assert.deepEqual(place, before);
    assert.equal(calls.length, 0);
    assert.equal(saves.length, 0);
  }
});

test("explicit Maps Place ID is queried exactly, without a text-search fallback", async () => {
  const place = savedPlace({ placeId: "", sourceUrl: `https://www.google.com/maps/search/?api=1&query=x&query_place_id=${shinjukuId}` });
  const { context, calls } = frontend([place], { placeId: shinjukuId });
  await context.ensurePlaceDetails(place);
  assert.equal(calls[0].body.places[0].placeId, shinjukuId);
  assert.equal(place.placeId, shinjukuId);
});

test("same-name different Place IDs open their own real detail sheets and photo resources", () => {
  const first = savedPlace({ detailsLocked: true }), second = savedPlace({ placeId: orixId, formattedAddress: "第二分店", photos: [photo(orixId), photo(shinjukuId)], detailsLocked: true });
  const { context } = frontend([first, second]);
  for (const place of [first, second]) {
    const key = context.placeDetailKey(place);
    assert.equal(context.resolveDetailPlace(key), place);
    context.openPlaceSheet(key);
    assert.ok(context.sheetRoot.innerHTML.includes(place.formattedAddress));
    assert.ok(context.sheetRoot.innerHTML.includes(encodeURIComponent(photo(place.placeId).name)));
    const wrong = place === first ? orixId : shinjukuId;
    assert.ok(!context.sheetRoot.innerHTML.includes(encodeURIComponent(photo(wrong).name)));
  }
  assert.equal(context.resolveDetailPlace("同名地點"), null);
  context.state.selectedMapPlace = second.name;
  context.state.selectedMapPlaceKey = context.placeDetailKey(second);
  assert.equal(context.isSelectedMapDetailPlace(first), false);
  assert.equal(context.isSelectedMapDetailPlace(second), true);
  assert.equal(context.placeDetailKey({ ...first, id: "app-123" }), "app:app-123");
  assert.match(source, /data-open-place="\$\{escapeHtml\(placeDetailKey\(place\)\)\}"/);
  assert.match(source, /data-open-map-place-detail="\$\{escapeHtml\(placeDetailKey\(place\)\)\}"/);
});

test("late detail response cannot persist after a trip switch or identity edit", async () => {
  for (const change of [c => { c.state.tripId = "other"; }, c => { c.state.places[0].placeId = orixId; }]) {
    const place = savedPlace();
    const { context, saves } = frontend([place], place);
    context.fetch = async () => { change(context); return { ok: true, json: async () => ({ places: [{ placeId: shinjukuId, fullName: "late" }] }) }; };
    await context.ensurePlaceDetails(place);
    assert.equal(saves.length, 0);
    assert.equal(place.fullName, "新宿原名");
  }
});

function responseMock() {
  return { status(code) { this.statusCode = code; return this; }, setHeader() { return this; }, json(data) { this.payload = data; } };
}
test("API resolves known Google identity with GET details, never searchText", async (t) => {
  const originalFetch = globalThis.fetch, originalKey = process.env.GOOGLE_MAPS_API_KEY;
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY; else process.env.GOOGLE_MAPS_API_KEY = originalKey; });
  process.env.GOOGLE_MAPS_API_KEY = "test";
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return Response.json({ id: shinjukuId, displayName: { text: "新宿" }, formattedAddress: "大久保", location: { latitude: 35.7, longitude: 139.7 }, photos: [photo(shinjukuId), photo(orixId)] });
  };
  const response = responseMock();
  await placesHandler({ method: "POST", body: { places: [{ placeId: shinjukuId, resolveDetails: true, hintName: "新宿", destination: "藤澤" }] } }, response);
  assert.equal(response.payload.places[0].placeId, shinjukuId);
  assert.ok(calls.every(url => new URL(url).pathname === `/v1/places/${shinjukuId}`));
  assert.equal(response.payload.places[0].photos.length, 1);
  assert.equal(response.payload.places[0].photos[0].name, photo(shinjukuId).name);
});

test("API fails closed on mismatched identity, failed details, or missing identity", async (t) => {
  const originalFetch = globalThis.fetch, originalKey = process.env.GOOGLE_MAPS_API_KEY;
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY; else process.env.GOOGLE_MAPS_API_KEY = originalKey; });
  process.env.GOOGLE_MAPS_API_KEY = "test";
  for (const failure of ["mismatch", "404", "missing", "address"]) {
    const calls = [];
    globalThis.fetch = async (url) => { calls.push(String(url)); return failure === "404" ? new Response("", { status: 404 }) : Response.json({ id: orixId }); };
    const response = responseMock();
    await placesHandler({ method: "POST", body: { places: [{ resolveDetails: true, placeId: failure === "missing" ? "" : shinjukuId, coordinateLocation: failure === "address", hintName: "新宿", destination: "藤澤" }] } }, response);
    assert.ok(response.payload.places[0].error);
    assert.equal(response.payload.places[0].placeId, undefined);
    assert.ok(calls.every(url => !url.includes("searchText")));
    assert.equal(calls.length, ["missing", "address"].includes(failure) ? 0 : 1);
  }
});
