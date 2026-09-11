import "../lib/travel-area-audit.js";
import AreaTags from "../lib/area-tags.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

// Regression coverage for the candidate confirmation page -> candidate draft editor -> batch add
// flow. These tests exercise the real app.js functions (extracted by name/section, same technique
// as tests/lodging-editor.test.mjs and tests/maps-text-import.test.mjs), never a reimplementation.

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const catalog = JSON.parse(readFileSync(new URL("../data/area-geometry/travel-area-boundaries.json", import.meta.url), "utf8"));

const functionSource = (name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, `function not found: ${name}`);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
};
const section = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));

const CANDIDATE_DRAFT_IDENTITY_FIELDS = ["placeId", "latitude", "longitude", "photos", "sourceUrl", "formattedAddress",
  "rating", "ratingCount", "phone", "openingHours", "description", "addressComponents",
  "addressComponentsOriginal", "countryCode", "addressProvider", "locationApproximate", "coordinateFallback", "coordinateLocation"];

function node(value = "") {
  return {
    value, disabled: false, hidden: false, textContent: "", placeholder: "", dataset: {}, attributes: {},
    listeners: {}, formNoValidate: false, innerHTML: "",
    setAttribute(n, v) { this.attributes[n] = v; }, removeAttribute(n) { delete this.attributes[n]; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    fire(type, event = {}) { let r; for (const fn of this.listeners[type] || []) r = fn(event); return r; },
  };
}

function makeForm(seed = {}) {
  const form = node();
  form.id = "place-editor-form";
  form.isConnected = true;
  form.dataset = { originalPlaceName: "", originalAddress: "" };
  form.elements = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName",
    "sourceListingId", "photoOrigin", "travelAreaZh", "travelAreaLocal", "kind", "category"].map((key) => [key, node()]));
  Object.assign(form.elements.name, { value: seed.name || "" });
  form.elements.address.value = seed.address || seed.formattedAddress || "";
  form.elements.kind.value = seed.kind || "attraction";
  form.elements.category.value = seed.category || "景點";
  form.elements.category.dataset.categoryKind = form.elements.kind.value;
  form.elements.referenceUrl.value = seed.referenceUrl || "";
  for (const key of ["sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin"]) form.elements[key].value = seed[key] || "";
  const nodes = new Map();
  form.querySelector = (selector) => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  form.querySelectorAll = () => Object.values(form.elements);
  return form;
}

function candidate(overrides = {}) {
  return {
    placeId: "place-ginza-1", name: "銀座候選", fullName: "銀座候選", category: "景點", kind: "attraction",
    sourceUrl: "https://maps.google.com/?cid=1", formattedAddress: "東京都中央区銀座8丁目",
    latitude: 35.6672123, longitude: 139.7618203, countryCode: "JP",
    addressComponents: [{ longText: "銀座", types: ["sublocality_level_2", "sublocality", "political"] }],
    addressComponentsOriginal: [{ longText: "銀座", types: ["sublocality_level_2", "sublocality", "political"] }],
    photos: [{ name: "places/place-ginza-1/photos/1", attribution: "Google" }],
    rating: 4.5, ratingCount: 100, phone: "03-0000-0000", openingHours: "每日 10:00–20:00",
    description: "候選地點描述", swatch: "#587a73", mark: "銀",
    canImport: true, recognition: "complete", isExisting: false, selected: false,
    isSocialCandidate: true, candidateGroupId: "social-1-1", candidateRank: 1,
    areaTags: [],
    ...overrides,
  };
}

function makeContext({ pendingPlaceImports = [], candidateDraftStore = new Map(), areaGeometryCatalog = catalog } = {}) {
  const toasts = [];
  let persistCalls = 0;
  const context = vm.createContext({
    AreaTags, escapeHtml: String, URL, console,
    pendingPlaceImports, pendingLodgingDrafts: [], pendingPlacePhoto: "", removePendingPlacePhoto: false,
    candidateDraftStore, importSheetReturnState: null, CANDIDATE_DRAFT_IDENTITY_FIELDS,
    state: { tripId: "trip", destination: "東京", places: [], votes: {}, itinerary: {}, transports: [] },
    setTimeout(fn) { fn(); return 0; }, clearTimeout() {},
    fetch() { throw new Error("candidate draft editor must never call fetch (no re-geocode/re-search)"); },
    isGoogleMapsUrl: (v) => /maps|google/.test(String(v)), isLodgingShareUrl: () => false,
    placeReferenceMeta: () => null, validMapCoordinates: (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0),
    compressPlacePhotoDataUrl: async (data) => { if (data === "broken") throw Error("image"); return "data:image/jpeg;base64,compressed"; },
    renderPlacePhotoEditor() {}, kindLabel: (kind) => ({ attraction: "景點", restaurant: "餐廳", lodging: "住宿", shopping: "購物" }[kind] || "地點"),
    placeAreaFromAddress: () => "", currentMemberId: () => "member",
    canEdit: () => true, guestOnlyMessage() {}, showToast: (message) => toasts.push(message),
    crypto: { randomUUID: () => `id-${Math.random().toString(36).slice(2)}` },
    persist() { persistCalls += 1; },
    render() {}, renamePlaceReferences() {}, closeSheet() {},
    renderImportPreview() {}, updateImportConfirmState() {}, reopenImportCandidateSheet() {},
    normalizeGoogleMapsUrl: (url) => url || "", openPlaceSheet() {},
    areaGeometryCatalog, loadAreaGeometry: () => Promise.resolve(catalog),
    FormData: class {
      constructor(f) { this.tags = f.checkedTags || []; this.values = Object.fromEntries(Object.entries(f.elements).map(([k, n]) => [k, n.value])); }
      get(key) { return this.values[key]; } getAll() { return this.tags; }
    },
    document: { querySelector: () => null },
    sheetRoot: { innerHTML: "", querySelector: () => null, insertAdjacentHTML() {} },
  });
  vm.runInContext(
    section("function restaurantTagValues", "function placesScreen")
    + section("const TRAVEL_AREA_RESOLUTION_VERSION", "function placeVoters")
    + section("function saveRestaurantTagsOnly", "function renamePlaceReferences")
    + section("function manualPlaceSeed", "async function compressPlacePhoto(file)")
    + section("function defaultPlaceCategory", "function openPlaceEditSheet")
    + functionSource("placeDetailKey")
    + functionSource("importCandidateIdentity")
    + functionSource("cloneCandidateForDraft")
    + functionSource("candidateDraft")
    + functionSource("candidateDraftEditorSeed")
    + functionSource("finalizeCandidateForBatchAdd")
    + functionSource("selectImportCandidate")
    + functionSource("importCandidateSelectionMode")
    + functionSource("samePlaceIdentity")
    + functionSource("importAlreadyExists")
    + functionSource("importCanBeAdded")
    + functionSource("samePendingImportIdentity")
    + functionSource("submittablePlaceImports")
    + functionSource("endImportSession")
    + functionSource("submitCandidateDraftEditor"),
    context,
  );
  return { context, toasts, get persistCalls() { return persistCalls; } };
}

function openEditor(context, identity, original) {
  const draft = context.candidateDraft(identity, original);
  const seed = context.candidateDraftEditorSeed(identity, draft);
  const form = makeForm(seed);
  form.dataset.editorMode = "candidate-draft";
  form.dataset.candidateIdentity = identity;
  const session = context.bindPlaceEditor(form, null, seed);
  return { form, session };
}

test("A. candidate editor Save updates only the draft, never state.places", async () => {
  const original = candidate();
  const { context, persistCalls } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  form.elements.name.value = "銀座候選（改名）";
  await context.submitCandidateDraftEditor(form);
  assert.equal(context.state.places.length, 0, "candidate draft save must never write to state.places");
  assert.equal(persistCalls, 0, "candidate draft save must never persist the trip");
  const draft = context.candidateDraftStore.get(identity);
  assert.equal(draft.name, "銀座候選(改名)");
});

test("B. draft survives navigating away and back (view another candidate, then return)", async () => {
  const a = candidate({ placeId: "place-a", name: "候選 A" });
  const b = candidate({ placeId: "place-b", name: "候選 B", candidateGroupId: "social-1-2", candidateRank: 2 });
  const { context } = makeContext({ pendingPlaceImports: [a, b] });
  const identityA = context.importCandidateIdentity(a);
  const identityB = context.importCandidateIdentity(b);
  const { form: formA } = openEditor(context, identityA, a);
  formA.elements.name.value = "候選 A（已編輯）";
  await context.submitCandidateDraftEditor(formA);
  // "return to list, view B" -- B has no draft of its own yet.
  assert.equal(context.candidateDraftStore.has(identityB), false);
  // "view A again" -- the saved edit is still there.
  const draftA = context.candidateDraft(identityA, a);
  assert.equal(draftA.name, "候選 A(已編輯)");
});

test("C. commit boundary: Cancel only discards the unsaved working copy, not the prior Save", async () => {
  const original = candidate({ areaTags: [] });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  // First edit: add an areaTag and Save.
  const first = openEditor(context, identity, original);
  first.session.areaTags = ["銀座"];
  first.session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(first.form);
  const afterFirstSave = context.candidateDraftStore.get(identity);
  assert.deepEqual(afterFirstSave.areaTags, ["銀座"]);
  assert.equal(afterFirstSave.name, original.name);
  // Second edit: change the name, then Cancel (never call submit; just discard this working copy).
  const second = openEditor(context, identity, original);
  second.form.elements.name.value = "改壞的名字";
  // Cancel: no submit call. The draft in the store must be untouched.
  const afterCancel = context.candidateDraftStore.get(identity);
  assert.deepEqual(afterCancel.areaTags, ["銀座"], "areaTag from the first Save must still exist");
  assert.equal(afterCancel.name, original.name, "the unsaved second-edit name change must be discarded");
});

test("D. original candidate is never mutated by editor operations", async () => {
  const original = candidate({ areaTags: [] });
  const snapshot = JSON.parse(JSON.stringify(original));
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form, session } = openEditor(context, identity, original);
  form.elements.name.value = "改名";
  form.elements.kind.value = "restaurant";
  session.areaTags = ["銀座"];
  session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(form);
  assert.deepEqual(original, snapshot, "the original candidate object must be byte-for-byte unchanged");
});

test("E. stable identity survives reordering pendingPlaceImports (never uses array index)", async () => {
  const a = candidate({ placeId: "place-a", name: "候選 A" });
  const b = candidate({ placeId: "place-b", name: "候選 B", candidateGroupId: "social-1-2", candidateRank: 2 });
  const { context } = makeContext({ pendingPlaceImports: [a, b] });
  const identityA = context.importCandidateIdentity(a);
  const { form } = openEditor(context, identityA, a);
  form.elements.name.value = "候選 A（已編輯）";
  await context.submitCandidateDraftEditor(form);
  // Reorder the underlying array (e.g. a re-render after filter/sort changed order).
  context.pendingPlaceImports = [b, a];
  const stillA = context.pendingPlaceImports.find((place) => context.importCandidateIdentity(place) === identityA);
  assert.equal(stillA, a);
  const draft = context.candidateDraftStore.get(identityA);
  assert.equal(draft.name, "候選 A(已編輯)", "draft must still resolve to A after reordering, not to whatever now sits at A's old index");
});

test("F. candidate draft mode gets a verified containment areaTags suggestion (Ginza) without being in state.places", () => {
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  assert.equal(context.state.places.length, 0);
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  const suggestions = form.querySelector("[data-area-tags-selected]").innerHTML;
  assert.match(suggestions, /銀座/, "a Ginza-coordinate candidate must suggest 銀座 via verified Travel Area containment");
});

test("G. no semantic guessing: an unverified candidate (Jingumae) falls back to itself, never becomes Harajuku", () => {
  const original = candidate({
    placeId: "place-jingumae-1", name: "神宮前候選", fullName: "神宮前候選",
    formattedAddress: "東京都渋谷区神宮前1丁目", latitude: 35.6711722, longitude: 139.7076413,
    addressComponents: [{ longText: "神宮前", types: ["sublocality_level_2", "sublocality", "political"] }],
    addressComponentsOriginal: [{ longText: "神宮前", types: ["sublocality_level_2", "sublocality", "political"] }],
  });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  const suggestions = form.querySelector("[data-area-tags-selected]").innerHTML;
  assert.match(suggestions, /神宮前/);
  assert.doesNotMatch(suggestions, /原宿/, "no verified polygon hit means no semantic alias to a coarser area");
});

test("H. confirming a candidate only sets checked=true; it never touches state.places", () => {
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  context.selectImportCandidate(original.candidateGroupId, context.importCandidateIdentity(original), true);
  assert.equal(original.selected, true);
  assert.equal(context.state.places.length, 0);
});

test("I. after confirming selection and returning to the candidate list, the candidate shows checked", () => {
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  context.selectImportCandidate(original.candidateGroupId, identity, true);
  // "the list" reads place.selected directly off the same pendingPlaceImports entry.
  const inList = context.pendingPlaceImports.find((place) => context.importCandidateIdentity(place) === identity);
  assert.equal(inList.selected, true);
});

test("J. unchecking a candidate preserves its draft", async () => {
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  form.elements.name.value = "已編輯的候選";
  await context.submitCandidateDraftEditor(form);
  context.selectImportCandidate(original.candidateGroupId, identity, true);
  assert.equal(original.selected, true);
  context.selectImportCandidate(original.candidateGroupId, identity, false);
  assert.equal(original.selected, false);
  const draft = context.candidateDraftStore.get(identity);
  assert.equal(draft.name, "已編輯的候選", "draft must survive check -> uncheck");
});

test("K. multi-candidate isolation: editing A never leaks into B", async () => {
  const a = candidate({ placeId: "place-a", name: "候選 A", areaTags: [] });
  const b = candidate({ placeId: "place-b", name: "候選 B", candidateGroupId: "social-1-2", candidateRank: 2, areaTags: [] });
  const { context } = makeContext({ pendingPlaceImports: [a, b] });
  const identityA = context.importCandidateIdentity(a);
  const identityB = context.importCandidateIdentity(b);
  const editorA = openEditor(context, identityA, a);
  editorA.session.areaTags = ["銀座"];
  editorA.session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(editorA.form);
  const editorB = openEditor(context, identityB, b);
  editorB.session.areaTags = ["淺草"];
  editorB.session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(editorB.form);
  assert.deepEqual(context.candidateDraftStore.get(identityA).areaTags, ["銀座"]);
  assert.deepEqual(context.candidateDraftStore.get(identityB).areaTags, ["淺草"]);
});

test("L. batch add only includes checked candidates", () => {
  const a = candidate({ placeId: "place-a", name: "候選 A", selected: true });
  const b = candidate({ placeId: "place-b", name: "候選 B", candidateGroupId: "social-1-2", candidateRank: 2, selected: false });
  const { context } = makeContext({ pendingPlaceImports: [a, b] });
  const additions = context.submittablePlaceImports();
  assert.equal(additions.length, 1);
  assert.equal(additions[0].name, "候選 A");
});

test("M. batch add builds the final place from the candidate draft, not the original", async () => {
  const original = candidate({ areaTags: [] });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const editor = openEditor(context, identity, original);
  editor.session.areaTags = ["銀座"];
  editor.session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(editor.form);
  assert.deepEqual(original.areaTags, [], "original candidate stays untouched");
  const finalPlace = context.finalizeCandidateForBatchAdd(original);
  assert.deepEqual(finalPlace.areaTags, ["銀座"]);
});

test("N. original candidate fields cannot overwrite already-saved draft edits at batch add", async () => {
  const original = candidate({ name: "原始名稱", kind: "attraction", category: "景點", areaTags: [] });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const editor = openEditor(context, identity, original);
  editor.form.elements.name.value = "使用者改的名稱";
  editor.form.elements.kind.value = "restaurant";
  editor.form.elements.category.value = "燒肉";
  editor.session.areaTags = ["銀座"];
  editor.session.dirty.add("areaTags");
  await context.submitCandidateDraftEditor(editor.form);
  const finalPlace = context.finalizeCandidateForBatchAdd(original);
  assert.equal(finalPlace.name, "使用者改的名稱");
  assert.equal(finalPlace.kind, "restaurant");
  assert.equal(finalPlace.category, "燒肉");
  assert.deepEqual(finalPlace.areaTags, ["銀座"]);
});

test("O. identity evidence (placeId/coordinates/photos) is preserved through batch add, never re-searched", async () => {
  const original = candidate({
    placeId: "place-real-google-id", latitude: 35.6672123, longitude: 139.7618203,
    photos: [{ name: "places/real/photos/1", attribution: "Google" }],
  });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  // Simulate a draft whose identity fields have somehow diverged (must never win).
  context.candidateDraftStore.set(identity, {
    ...context.cloneCandidateForDraft(original),
    placeId: "corrupted", latitude: 0, longitude: 0, photos: [],
  });
  const finalPlace = context.finalizeCandidateForBatchAdd(original);
  assert.equal(finalPlace.placeId, original.placeId);
  assert.equal(finalPlace.latitude, original.latitude);
  assert.equal(finalPlace.longitude, original.longitude);
  assert.deepEqual(finalPlace.photos, original.photos);
});

test("P. persisted-place editor mode is unchanged: the editor form is explicitly tagged persisted-place, not candidate-draft", () => {
  assert.match(source, /data-editor-mode="\$\{isCandidateDraftMode \? "candidate-draft" : "persisted-place"\}"/);
  assert.match(source, /const isCandidateDraftMode = !existing && seed\.editorMode === "candidate-draft" && Boolean\(seed\.candidateIdentity\);/);
});

test("Q. import session cleanup after batch add clears every candidate draft", async () => {
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  await context.submitCandidateDraftEditor(form);
  assert.equal(context.candidateDraftStore.size, 1);
  context.endImportSession();
  assert.equal(context.candidateDraftStore.size, 0);
});

test("R. cancelling the whole import flow clears every candidate draft", async () => {
  const a = candidate({ placeId: "place-a" });
  const b = candidate({ placeId: "place-b", candidateGroupId: "social-1-2", candidateRank: 2 });
  const { context } = makeContext({ pendingPlaceImports: [a, b] });
  await context.submitCandidateDraftEditor(openEditor(context, context.importCandidateIdentity(a), a).form);
  await context.submitCandidateDraftEditor(openEditor(context, context.importCandidateIdentity(b), b).form);
  assert.equal(context.candidateDraftStore.size, 2);
  context.endImportSession(); // whole import flow cancelled/closed
  assert.equal(context.candidateDraftStore.size, 0);
});


test("S. first initialization reuses cuisine evidence, ignores names, and freezes manual empties", () => {
  for (const [extra, expected] of [
    [{ kind: "restaurant", category: "燒肉店" }, ["燒肉"]],
    [{ kind: "restaurant", category: "餐廳", name: "燒肉拉麵店", description: "" }, []],
    [{ kind: "restaurant", category: "燒肉店", restaurantTags: [] }, []],
  ]) {
    const original = candidate(extra);
    const { context } = makeContext({ pendingPlaceImports: [original] });
    const identity = context.importCandidateIdentity(original);
    const draft = context.candidateDraft(identity, original);
    assert.deepEqual(Array.from(draft.areaTags), ["銀座"]);
    assert.deepEqual(Array.from(draft.restaurantTags), expected);
    draft.areaTags = []; draft.restaurantTags = [];
    assert.equal(context.candidateDraft(identity, original), draft);
    context.selectImportCandidate(original.candidateGroupId, identity, true);
    context.selectImportCandidate(original.candidateGroupId, identity, false);
    assert.deepEqual(Array.from(context.finalizeCandidateForBatchAdd(original).areaTags), []);
    assert.deepEqual(Array.from(context.finalizeCandidateForBatchAdd(original).restaurantTags), []);
  }
});

test("T. missing containment/address evidence stays empty without consulting legacy area or name", () => {
  const original = candidate({ latitude: null, longitude: null, formattedAddress: "", addressComponents: [], addressComponentsOriginal: [], name: "銀座燒肉", travelAreaZh: "銀座", areaTags: [] });
  const { context } = makeContext();
  assert.deepEqual(Array.from(context.candidateDraft("unknown", original).areaTags), []);
});
