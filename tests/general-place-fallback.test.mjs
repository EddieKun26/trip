import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
function harness() {
  const opened = [], html = [], requests = [];
  const query = { value: "Ｃａｆｅ  Taipei" }, status = {}, button = {};
  const root = { querySelector: (selector) => selector.includes("query") ? query : selector.includes("status") ? status : button };
  status.dataset = {};
  const context = vm.createContext({ console, URL, pendingLodgingDrafts: [], state: { tripId: "trip", profile: { nickname: "Tester" } },
    loadAreaGeometry: async () => null, candidateDraft: () => {}, importCandidateIdentity: p => p.placeId,
    currentMemberId: () => "member", importAlreadyExists: () => false, importCanBeAdded: p => p.canImport && p.selected,
    importCandidateSelectionMode: p => p.candidateCategory === "lodging" ? "single" : "multiple",
    lodgingCandidateSource: c => c, lodgingDraftToEditorSeed: d => ({ ...d, kind: "lodging" }),
    isLodgingShareUrl: u => /booking\.com/.test(u), isGoogleMapsUrl: u => /maps/.test(u),
    socialPlaceUrls: u => /instagram/.test(u) ? [u] : [], placeReferenceMeta: () => null,
    openPlaceEditSheet: (name, seed) => opened.push(seed), sheetRoot: { insertAdjacentHTML: (_, s) => html.push(s), querySelector: () => root },
    closeImportRematchSheet: () => {}, renderImportPreview: () => {}, updateImportConfirmState: () => {}, showToast: () => {},
    fetch: async (_, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ candidates: [
      { placeId: "google-real", name: "Actual Google Name", kind: "restaurant", sourceUrl: "https://maps.google.com/real", formattedAddress: "Real address" }
    ] }) }; },
  });
  vm.runInContext(section("function socialGroupsToImports", "async function recognizeSocialPlace"), context);
  // Load independently bounded helpers; avoid initializing the App itself.
  vm.runInContext(section("function manualPlaceSeed", "function lodgingSourceKey"), context);
  vm.runInContext(section("let pendingManualPlaceSeed", "function openPlaceEditSheet"), context);
  vm.runInContext(section("async function rematchImportCandidateGroup", "function closeImportCandidatePreview"), context);
  return { context, opened, html, requests };
}

test("zero-candidate groups retain source and kind but can never be imported as Google places", () => {
  const { context } = harness();
  for (const kind of ["restaurant", "attraction", "shopping", "lodging", "auto"]) {
    const result = context.socialGroupsToImports({ source: { url: "https://www.instagram.com/reels/example/" },
      groups: [{ id: kind, extracted: { name: "Source Name", category: kind, address: "Source address" }, candidates: [] }] });
    assert.equal(result.imports.length, 1);
    const place = result.imports[0];
    assert.equal(place.canImport, false);
    assert.equal(place.selected, false);
    assert.equal(place.placeId, undefined);
    assert.equal(place.candidateCategory, kind);
    assert.equal(place.candidateAddress, "Source address");
    assert.match(place.referenceUrl, /instagram/);
  }
});

test("manual routing uses the source kind; unknown asks for all four kinds without opening lodging", () => {
  const { context, opened, html } = harness();
  for (const kind of ["restaurant", "attraction", "shopping", "lodging"]) {
    const seed = context.manualImportGroupSeed({ candidateCategory: kind, candidateLabel: "Source Name", candidateAddress: "Source address",
      placeId: "wrong-google-id", name: "Wrong Google name", latitude: 30, longitude: 130 });
    context.openManualPlaceEditor(seed);
    assert.equal(opened.at(-1).kind, kind);
    assert.equal(opened.at(-1).name, "Source Name");
    assert.equal(opened.at(-1).placeId, undefined);
    assert.equal(opened.at(-1).latitude, undefined);
  }
  context.openManualPlaceEditor({ kind: "auto" });
  assert.equal(opened.length, 4);
  for (const kind of ["restaurant", "attraction", "shopping", "lodging"]) assert.ok(html[0].includes(`data-manual-place-kind="${kind}"`));
  assert.equal(context.manualPlaceSeed("https://www.instagram.com/reels/example/", "restaurant").kind, "restaurant");
  assert.equal(context.manualPlaceSeed("").kind, "auto");
  assert.equal(context.manualPlaceSeed("https://www.booking.com/hotel/test").kind, "lodging");
});

test("keyword search replaces only the empty target group and reuses selectable Google candidates", async () => {
  const { context, requests } = harness();
  context.pendingPlaceImports = [
    { candidateGroupId: "empty", candidateCategory: "restaurant", isSearchPlaceholder: true, canImport: false },
    { candidateGroupId: "keep", placeId: "keep-id", selected: true, canImport: true },
  ];
  await context.rematchImportCandidateGroup("empty");
  assert.equal(requests[0].query, "Ｃａｆｅ  Taipei");
  assert.equal(requests[0].searchMode, "keyword");
  const result = context.pendingPlaceImports;
  assert.equal(result[0].placeId, "google-real");
  assert.equal(result[0].name, "Actual Google Name");
  assert.equal(result[0].selected, true);
  assert.equal(result[0].isSearchPlaceholder, undefined);
  assert.equal(result[1].placeId, "keep-id");
  assert.equal(result[1].selected, true);
});

test("manual entry handler preserves the resolved source kind instead of overwriting it with lodging", () => {
  const handler = section('const manualPlace = event.target.closest("[data-manual-place]")', 'const lodgingDraftButton =');
  const run = new Function('event', 'canEdit', 'manualPlaceSeed', 'document', 'openManualPlaceEditor', handler);
  for (const kind of ["restaurant", "attraction", "shopping", "lodging", "auto"]) {
    let opened;
    run({ target: { closest: () => ({ closest: () => ({ elements: { mapsList: { value: "source" } } }) }) } },
      () => true, () => ({ kind }), { querySelector: () => ({ value: "auto" }) }, seed => { opened = seed; });
    assert.equal(opened.kind, kind);
  }
});
