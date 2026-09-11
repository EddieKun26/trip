import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
function functionSource(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
}
function frontend() {
  const button = {}, calls = [], preview = { innerHTML: "", scrollTop: 120 };
  const context = {
    URL, state: { places: [], profile: {}, destination: "東京" },
    fallbackPlaces: [], placeDetails: {}, currentMemberId: () => "test",
    pendingPlaceImports: [], pendingLodgingDrafts: [], pendingPlaceImportNotice: "",
    candidateDraftStore: new Map(), endImportSession: () => {},
    CANDIDATE_DRAFT_IDENTITY_FIELDS: ["placeId", "latitude", "longitude", "photos", "sourceUrl", "formattedAddress",
      "rating", "ratingCount", "phone", "openingHours", "description", "addressComponents",
      "addressComponentsOriginal", "countryCode", "addressProvider", "locationApproximate", "coordinateFallback", "coordinateLocation"],
    escapeHtml: (value) => String(value ?? "").replaceAll('"', '&quot;'),
    lodgingDraftsMarkup: () => "",
    document: { querySelector: (selector) => selector === "[data-confirm-import]" ? button : preview },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body); calls.push({ url, body });
      return { ok: true, json: async () => ({ places: body.places.map((place) => ({
        requestUrl: place.sourceUrl, name: "地址位置", formattedAddress: place.manualAddress,
        category: "自訂地址", coordinateLocation: true, latitude: 35.7, longitude: 139.7,
      })) }) };
    },
  };
  vm.createContext(context);
  for (const name of ["isGoogleMapsUrl", "isSocialPlaceUrl", "normalizeGoogleMapsUrl", "validMapCoordinates", "coordinatesFromText", "coordinatesFromGoogleMapsUrl", "extractNameFromGoogleMapsUrl", "inferPlaceArea", "inferPlaceCategory", "inferPlaceKind", "knownGooglePlace", "addressImportLineParts", "groupPlainTextAddressCandidates", "googleMapsImportCandidates", "parseGoogleMapsList", "samePlaceIdentity", "importAlreadyExists", "importCanBeAdded", "importCandidateSelectionMode", "samePendingImportIdentity", "submittablePlaceImports", "importCandidateIdentity", "selectImportCandidate", "updateImportConfirmState", "renderImportPreview", "socialImportStats", "importPreviewMarkup", "enrichPlaceImportsFromApi", "expandGoogleMapsSharedLists", "promoteSinglePlaceImport", "placeAreaFromAddress", "finalizeCandidateForBatchAdd"]) {
    vm.runInContext(functionSource(name), context);
  }
  return { c: context, button, calls, preview };
}
const address = "Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072";

const exactProductionInput = `251-0032, Kanagawa, Fujisawa, Katase, 3-chōme-8-12 Katase, Japan

Room 202 , 1 Chome - 16 - 19 Okubo
Shinjuku - ku, Tōkyō - to 169 - 0072`;

test("production Katase and Room 202 Okubo input stays two uncontaminated selected addresses", () => {
  const { c } = frontend();
  const [katase, okubo] = exactProductionInput.split("\n\n");
  const kataseParts = c.addressImportLineParts(katase);
  assert.equal(kataseParts.streetHouse, true);
  assert.equal(kataseParts.postal, true);
  const roomParts = c.addressImportLineParts(okubo.split("\n")[0]);
  assert.equal(roomParts.streetHouse, true);
  assert.equal(roomParts.roomFloor, true);
  for (const input of [exactProductionInput, exactProductionInput.replaceAll("\n", "\r\n"), exactProductionInput.replace("\n\n", "\n")]) {
    const candidates = c.googleMapsImportCandidates(input);
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].address, katase);
    assert.equal(candidates[1].address, okubo);
    assert.match(candidates[0].address, /Katase/);
    assert.match(candidates[0].address, /Fujisawa/);
    assert.doesNotMatch(candidates[0].address, /Room 202|Okubo|Shinjuku|169 - 0072/);
    for (const component of ["Room 202", "Okubo", "Shinjuku", "169 - 0072"]) assert.ok(candidates[1].address.includes(component));
    assert.doesNotMatch(candidates[1].address, /Katase|Fujisawa|251-0032/);
    const imports = c.parseGoogleMapsList(input);
    assert.equal(imports.length, 2);
    assert.ok(imports.every((place) => place.selected && place.canImport));
    assert.notEqual(imports[0].candidateGroupId, imports[1].candidateGroupId);
  }
});

test("production exact addresses cancel independently and actual submit saves only the remaining address", () => {
  for (const cancelledIndex of [0, 1]) {
    const { c, button } = frontend();
    c.pendingPlaceImports = c.parseGoogleMapsList(exactProductionInput);
    const cancelled = c.pendingPlaceImports[cancelledIndex];
    const remaining = c.pendingPlaceImports[1 - cancelledIndex];
    c.selectImportCandidate(cancelled.candidateGroupId, c.importCandidateIdentity(cancelled), false);
    assert.equal(cancelled.selected, false);
    assert.equal(remaining.selected, true);
    assert.equal(button.textContent, "加入已選 1 個地點");
    assert.equal(c.submittablePlaceImports().length, 1);
    assert.equal(c.submittablePlaceImports()[0], remaining);
    let saves = 0;
    Object.assign(c, {
      event: { target: { id: "import-places-form" }, preventDefault() {} },
      canEdit: () => true, FormData: class { get() { return "auto"; } },
      withStoredTabelogLink: (place) => place,
      persist: () => { saves += 1; }, closeSheet() {}, render() {}, showToast() {},
    });
    const start = source.indexOf('  if (event.target.id === "import-places-form")');
    const end = source.indexOf('  if (event.target.id === "add-area-form")', start);
    vm.runInContext(`(function () { ${source.slice(start, end)} })()`, c);
    assert.equal(saves, 1);
    assert.equal(c.state.places.length, 1);
    assert.equal(c.state.places[0].formattedAddress, remaining.formattedAddress);
  }
});

test("A: one complete address split across three lines remains one candidate", () => {
  const { c } = frontend();
  for (const text of ["1 Chome-16-19 Okubo\nShinjuku-ku, Tokyo-to\n169-0072", "台北市信義區\n信義路五段7號\n11049"]) {
    const candidates = c.googleMapsImportCandidates(text);
    assert.equal(candidates.length, 1, text);
    assert.equal(candidates[0].address, text);
    const imports = c.parseGoogleMapsList(text);
    assert.equal(imports.length, 1);
    assert.equal(imports[0].selected, true);
    assert.equal(imports[0].formattedAddress, candidates[0].address);
    assert.equal(c.submittablePlaceImports(imports).length, 1);
  }
  const withParagraph = "1 Chome-16-19 Okubo\n\nShinjuku-ku, Tokyo-to\n169-0072";
  assert.equal(c.googleMapsImportCandidates(withParagraph)[0].address, withParagraph);
});

test("B: room floor address and postal code remain one candidate", () => {
  const { c } = frontend();
  for (const text of [address, "Room 202\n2nd Floor\n123 Main Street\nBrooklyn, NY 11201", "〒169-0072\n東京都新宿区大久保1-16-19\n2階 Room 202"]) {
    const candidates = c.googleMapsImportCandidates(text);
    assert.equal(candidates.length, 1, text);
    assert.equal(candidates[0].address, text);
  }
});

test("C: two complete addresses on separate lines remain two clean candidates", () => {
  const { c } = frontend();
  const text = "東京都新宿区大久保1-16-19 169-0072\n東京都新宿区大久保2-8-5 169-0072";
  const candidates = c.googleMapsImportCandidates(text);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].address, "東京都新宿区大久保1-16-19 169-0072");
  assert.equal(candidates[1].address, "東京都新宿区大久保2-8-5 169-0072");
  assert.doesNotMatch(candidates[0].address, /2-8-5/);
  assert.doesNotMatch(candidates[1].address, /1-16-19/);
});

test("D: two multiline addresses without a blank separator remain two candidates", () => {
  const { c } = frontend();
  const text = "1 Chome-16-19 Okubo\nShinjuku-ku, Tokyo-to\n169-0072\n2 Chome-8-5 Okubo\nShinjuku-ku, Tokyo-to\n169-0072";
  const candidates = c.googleMapsImportCandidates(text);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].address, "1 Chome-16-19 Okubo\nShinjuku-ku, Tokyo-to\n169-0072");
  assert.equal(candidates[1].address, "2 Chome-8-5 Okubo\nShinjuku-ku, Tokyo-to\n169-0072");
  assert.doesNotMatch(candidates[0].address, /2 Chome/);
  assert.doesNotMatch(candidates[1].address, /1 Chome/);
});

test("standalone postal room floor and administrative fragments are not collections", () => {
  const { c } = frontend();
  for (const text of ["169-0072", "〒169 - 0072", "Room 202", "2nd Floor", "202室", "新宿區", "Shinjuku - ku", "11201", "Room 202\n169-0072"]) {
    assert.equal(c.parseGoogleMapsList(text).length, 0, text);
  }
  assert.equal(c.parseGoogleMapsList("東京都美術館\n東京タワー").length, 2);
});

test("E: single Maps URL with multiline address text yields only the URL candidate", () => {
  const { c } = frontend();
  for (const url of ["https://maps.app.goo.gl/example", `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`]) {
    for (const text of [url, `${address}\n${url}`, `${url}\n${address}`]) {
      const candidates = c.googleMapsImportCandidates(text);
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].url, url);
      assert.equal(candidates[0].address, undefined);
    }
  }
});

test("F: room or floor between two address cores is retained as unresolved", () => {
  const { c } = frontend();
  for (const component of ["Room 202", "2nd Floor"]) {
    const text = `1 Chome-16-19 Okubo\n${component}\n2 Chome-8-5 Okubo\nShinjuku-ku, Tokyo-to 169-0072`;
    const candidates = c.googleMapsImportCandidates(text);
    assert.equal(candidates.length, 3);
    assert.equal(candidates[0].address, "1 Chome-16-19 Okubo");
    assert.equal(candidates[1].label, component);
    assert.equal(candidates[1].requiresAddressConfirmation, true);
    assert.equal(candidates[2].address, "2 Chome-8-5 Okubo\nShinjuku-ku, Tokyo-to 169-0072");
    assert.doesNotMatch(candidates[0].address, /2 Chome/);
    assert.doesNotMatch(candidates[2].address, /1 Chome/);
    const imports = c.parseGoogleMapsList(text);
    assert.equal(imports[1].recognition, "unresolved");
    assert.equal(imports[1].canImport, false);
    assert.equal(imports[1].selected, false);
    assert.equal(c.submittablePlaceImports(imports).length, 2);
  }
});

test("ambiguous address components never reach geocoding", async () => {
  const { c, calls } = frontend();
  const imports = c.parseGoogleMapsList("1 Chome-16-19 Okubo\nRoom 202\n2 Chome-8-5 Okubo\nShinjuku-ku, Tokyo-to 169-0072");
  await c.enrichPlaceImportsFromApi(imports);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.places.length, 2);
  assert.equal(calls[0].body.places.some((place) => /Room 202/.test(place.manualAddress)), false);
});

test("ordinary text and Maps checkboxes independently cancel with count and submit in sync", () => {
  const { c, button, preview } = frontend();
  for (const text of ["東京タワー\n東京都美術館", "https://maps.app.goo.gl/a\nhttps://maps.app.goo.gl/b"]) {
    c.pendingPlaceImports = c.parseGoogleMapsList(text);
    // Short URL resolution normally makes these importable before review.
    c.pendingPlaceImports.forEach((place) => { place.recognition = "partial"; });
    c.renderImportPreview(); c.updateImportConfirmState();
    assert.equal((preview.innerHTML.match(/type="checkbox"/g) || []).length, 2);
    assert.equal(button.textContent, "加入已選 2 個地點");
    const [first, second] = c.pendingPlaceImports;
    c.selectImportCandidate(first.candidateGroupId, c.importCandidateIdentity(first), false);
    assert.equal(first.selected, false); assert.equal(second.selected, true);
    assert.equal(button.textContent, "加入已選 1 個地點");
    assert.equal(c.submittablePlaceImports()[0], second);
    assert.equal(preview.scrollTop, 120);
    c.selectImportCandidate(second.candidateGroupId, c.importCandidateIdentity(second), false);
    assert.equal(button.disabled, true);
    assert.equal(c.submittablePlaceImports().length, 0);
    c.selectImportCandidate(first.candidateGroupId, c.importCandidateIdentity(first), true);
    assert.equal(c.submittablePlaceImports().length, 1);
  }
  assert.match(source, /const additions = submittablePlaceImports\(parsed\)/);
});

test("enrichment sends one full exact address and preserves cancellation", async () => {
  const { c, calls } = frontend();
  const imports = c.parseGoogleMapsList(address);
  imports[0].selected = false;
  const enriched = await c.enrichPlaceImportsFromApi(imports);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.places.length, 1);
  assert.equal(calls[0].body.places[0].manualAddress, address);
  assert.equal(enriched.length, 1);
  assert.equal(enriched[0].selected, false);
  assert.equal(enriched[0].coordinateLocation, true);
  assert.equal(enriched[0].formattedAddress, address);
  assert.equal(c.submittablePlaceImports(enriched).length, 0);
});

test("real submit handler saves exactly the displayed count after cancellation, including zero", () => {
  for (const deselectAll of [false, true]) {
    const { c, button } = frontend();
    c.pendingPlaceImports = c.parseGoogleMapsList("東京タワー\n東京都美術館");
    const [a, b] = c.pendingPlaceImports;
    c.selectImportCandidate(a.candidateGroupId, c.importCandidateIdentity(a), false);
    if (deselectAll) c.selectImportCandidate(b.candidateGroupId, c.importCandidateIdentity(b), false);
    let saves = 0;
    Object.assign(c, {
      event: { target: { id: "import-places-form" }, preventDefault() {} },
      canEdit: () => true, FormData: class { get() { return "auto"; } },
      withStoredTabelogLink: (place) => place,
      persist: () => { saves += 1; }, closeSheet() {}, render() {}, showToast() {},
    });
    const start = source.indexOf('  if (event.target.id === "import-places-form")');
    const end = source.indexOf('  if (event.target.id === "add-area-form")', start);
    vm.runInContext(`(function () { ${source.slice(start, end)} })()`, c);
    assert.equal(c.state.places.length, deselectAll ? 0 : 1);
    assert.equal(saves, deselectAll ? 0 : 1);
    assert.equal(button.disabled, deselectAll);
    if (!deselectAll) {
      assert.equal(button.textContent, "加入已選 1 個地點");
      assert.equal(c.state.places[0].name, b.name);
      assert.equal(c.state.places[0].selected, undefined);
      assert.equal(c.state.places[0].candidateGroupId, undefined);
    }
  }
});

test("two grouped addresses can be cancelled independently and submit writes the displayed one", () => {
  const { c, button } = frontend();
  c.pendingPlaceImports = c.parseGoogleMapsList("東京都新宿区大久保1-16-19 169-0072\n東京都新宿区大久保2-8-5 169-0072");
  const [first, second] = c.pendingPlaceImports;
  c.selectImportCandidate(first.candidateGroupId, c.importCandidateIdentity(first), false);
  assert.equal(button.textContent, "加入已選 1 個地點");
  assert.equal(c.submittablePlaceImports().length, 1);
  assert.equal(c.submittablePlaceImports()[0], second);
  let saves = 0;
  Object.assign(c, {
    event: { target: { id: "import-places-form" }, preventDefault() {} },
    canEdit: () => true, FormData: class { get() { return "auto"; } },
    withStoredTabelogLink: (place) => place,
    persist: () => { saves += 1; }, closeSheet() {}, render() {}, showToast() {},
  });
  const start = source.indexOf('  if (event.target.id === "import-places-form")');
  const end = source.indexOf('  if (event.target.id === "add-area-form")', start);
  vm.runInContext(`(function () { ${source.slice(start, end)} })()`, c);
  assert.equal(saves, 1);
  assert.equal(c.state.places.length, 1);
  assert.equal(c.state.places[0].formattedAddress, second.formattedAddress);
  assert.doesNotMatch(c.state.places[0].formattedAddress, /1-16-19/);
});

test("expanded Maps list rows initialize independent selection including lodging", async () => {
  const { c } = frontend();
  const sourceUrl = "https://maps.app.goo.gl/list";
  c.fetch = async () => ({ ok: true, json: async () => ({ results: [{ requestUrl: sourceUrl, isList: true, places: [
    { name: "A Hotel", sourceUrl: "https://maps.app.goo.gl/a" },
    { name: "B Hotel", sourceUrl: "https://maps.app.goo.gl/b" },
  ] }] }) });
  c.pendingPlaceImports = await c.expandGoogleMapsSharedLists(c.parseGoogleMapsList(sourceUrl));
  const [a, b] = c.pendingPlaceImports;
  a.kind = b.kind = "lodging";
  assert.equal(a.selected, true); assert.equal(b.selected, true);
  assert.notEqual(a.candidateGroupId, b.candidateGroupId);
  c.selectImportCandidate(a.candidateGroupId, c.importCandidateIdentity(a), false);
  assert.equal(a.selected, false); assert.equal(b.selected, true);
});
