import { tagOptionsNode } from "./helpers/tag-options-node.mjs";
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
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
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
    ...tagOptionsNode(),
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
    formatOpeningHours: (value) => value,
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
    + functionSource("submitCandidateDraftEditor")
    + functionSource("closeImportSourceImagePreview")
    + functionSource("closeImportSourcePreview")
    + functionSource("closeImportCandidatePreview")
    + functionSource("importCandidateGalleryMarkup")
    + functionSource("openImportCandidatePreview"),
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


test("structured candidate defaults prioritize primary type, ignore generic types and preserve manual arrays", () => {
  for (const [evidence, expected] of [
    [{ primaryType: "hot_pot_restaurant", types: ["restaurant", "ramen_restaurant"], category: "餐廳" }, ["火鍋"]],
    [{ types: ["food", "sushi_restaurant", "point_of_interest"], category: "餐廳" }, ["壽司"]],
    [{ primaryType: "steak_house" }, ["牛排"]],
    [{ primaryType: "korean_barbecue_restaurant" }, ["燒肉"]],
    [{ primaryType: "barbecue_restaurant" }, ["燒肉"]],
    [{ primaryTypeDisplayName: { text: "火鍋餐廳" }, category: "餐廳" }, ["火鍋"]],
    [{ googleMapsTypeLabel: "拉麵店", category: "餐廳" }, ["拉麵"]],
    [{ primaryType: "restaurant", types: ["food", "establishment", "point_of_interest"], category: "餐廳", name: "海底撈燒肉拉麵" }, []],
    [{ primaryType: "hot_pot_restaurant", restaurantTags: [] }, []],
    [{ primaryType: "hot_pot_restaurant", restaurantTags: ["麻辣鍋"] }, ["麻辣鍋"]],
  ]) {
    const original = candidate({ kind: "restaurant", description: "", ...evidence });
    const { context } = makeContext();
    const draft = context.candidateDraft("structured", original);
    assert.deepEqual(Array.from(draft.restaurantTags), expected);
    draft.restaurantTags = [];
    assert.deepEqual(Array.from(context.candidateDraft("structured", original).restaurantTags), []);
  }
});

// -----------------------------------------------------------------------------------------------
// Candidate Tag display-source + Add-Tag UX unification round (2026-09-12).
// Same real-function technique as the lettered tests above: production candidateDraft/
// bindPlaceEditor/submitCandidateDraftEditor/openImportCandidatePreview, real AreaTags module,
// real travel-area-boundaries.json containment catalog.
// -----------------------------------------------------------------------------------------------

const clickAreaTagEditor = (form, dataset) => form.querySelector("[data-area-tag-editor]")
  .fire("click", { target: { closest: () => ({ dataset, hasAttribute: (name) => name in dataset }) } });

test("U. candidate Area suggestion never merges the Trip-wide vocabulary (production editor render)", () => {
  // The default candidate() fixture sits at real Ginza coordinates, so its own canonical
  // suggestion via verified Travel Area containment is 銀座 (proven by test F above).
  const original = candidate();
  const { context } = makeContext({ pendingPlaceImports: [original] });
  context.state.places = [
    { kind: "attraction", areaTags: ["代代木"] },
    { kind: "attraction", areaTags: ["淺草"] },
  ];
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  const options = form.querySelector("[data-area-tags-selected]").innerHTML;
  assert.match(options, /data-area-tag-toggle="銀座" aria-pressed="true"/, "own canonical suggestion still renders, selected");
  assert.doesNotMatch(options, /代代木/, "an unrelated place's area tag must not leak into a candidate suggestion");
  assert.doesNotMatch(options, /淺草/, "Trip-wide vocabulary is filter-only, never a candidate suggestion source");
});

test("V. a custom Area tag toggled off stays an available re-selectable option across editor re-opens, and is excluded from the committed selection", async () => {
  const original = candidate(); // canonical -> 銀座
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);

  const first = openEditor(context, identity, original);
  clickAreaTagEditor(first.form, { areaTagToggle: "原宿" }); // not yet selected -> adds it (chooseAreaTag)
  assert.match(first.form.querySelector("[data-area-tags-selected]").innerHTML, /data-area-tag-toggle="原宿" aria-pressed="true"/);
  await context.submitCandidateDraftEditor(first.form);
  assert.deepEqual(Array.from(context.candidateDraftStore.get(identity).areaTags).sort(), ["原宿", "銀座"].sort());

  const second = openEditor(context, identity, original);
  clickAreaTagEditor(second.form, { areaTagToggle: "原宿" }); // already selected -> toggles off
  await context.submitCandidateDraftEditor(second.form);
  const committed = context.candidateDraftStore.get(identity);
  assert.deepEqual(Array.from(committed.areaTags), ["銀座"], "toggling off excludes it from the committed selection");
  assert.doesNotMatch(context.placeTagsDetail(committed), /原宿/, "candidate list/detail must never show an unselected suggestion");
  assert.match(context.placeTagsDetail(committed), /銀座/);

  const third = openEditor(context, identity, original);
  const reopenedOptions = third.form.querySelector("[data-area-tags-selected]").innerHTML;
  assert.match(reopenedOptions, /data-area-tag-toggle="原宿" aria-pressed="false"/, "the custom tag is still offered, unselected, for re-selection");
  assert.match(reopenedOptions, /data-area-tag-toggle="銀座" aria-pressed="true"/);
});

test("W. candidate Restaurant suggestion never merges the Trip-wide vocabulary; multi-type structured evidence still converges to one canonical tag (production render)", () => {
  const original = candidate({
    placeId: "place-hotpot-1", kind: "attraction",
    primaryType: "hot_pot_restaurant", types: ["hot_pot_restaurant", "restaurant", "food", "point_of_interest"],
    category: "餐廳", description: "",
  });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  context.state.places = [
    { kind: "restaurant", restaurantTags: ["牛排"] },
    { kind: "restaurant", restaurantTags: ["拉麵"] },
  ];
  const identity = context.importCandidateIdentity(original);
  const draft = context.candidateDraft(identity, original);
  assert.equal(draft.kind, "restaurant", "trusted structured evidence classifies this candidate as a restaurant");
  assert.deepEqual(Array.from(draft.restaurantTags), ["火鍋"], "the generic types never fan out into extra system suggestions");
  const seed = context.candidateDraftEditorSeed(identity, draft);
  const html = context.restaurantTagEditor(seed, "restaurant", true);
  assert.match(html, /value="火鍋" checked/);
  assert.doesNotMatch(html, /value="牛排"/, "Trip-wide vocabulary from an unrelated persisted place must not appear");
  assert.doesNotMatch(html, /value="拉麵"/);
});

test("X. a custom Restaurant tag replaces a toggled-off canonical suggestion through Save -> candidate detail -> batch add", async () => {
  const original = candidate({ placeId: "place-hotpot-2", kind: "restaurant", primaryType: "hot_pot_restaurant" });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  context.state.places = [];
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  assert.deepEqual(Array.from(context.candidateDraft(identity, original).restaurantTags), ["火鍋"]);
  form.querySelector("[data-custom-restaurant-tag]").value = "麻辣鍋";
  context.addCustomRestaurantTag(form);
  form.checkedTags = ["麻辣鍋"]; // 火鍋's checkbox is now unchecked; only 麻辣鍋 is submitted
  await context.submitCandidateDraftEditor(form);
  const committed = context.candidateDraftStore.get(identity);
  assert.deepEqual(Array.from(committed.restaurantTags), ["麻辣鍋"]);
  assert.doesNotMatch(context.placeTagsDetail(committed), /火鍋/, "an unselected suggestion never reaches candidate detail");
  assert.match(context.placeTagsDetail(committed), /麻辣鍋/);

  context.selectImportCandidate(original.candidateGroupId, identity, true);
  const finalPlace = context.finalizeCandidateForBatchAdd(original);
  assert.deepEqual(Array.from(finalPlace.restaurantTags), ["麻辣鍋"], "a toggled-off suggestion never becomes part of the persisted place");
});

test("Y. custom tag options added during one import session never survive endImportSession (the existing close-import-sheet cleanup path)", async () => {
  const original = candidate({ placeId: "place-hotpot-3", kind: "restaurant", primaryType: "hot_pot_restaurant" });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  const identity = context.importCandidateIdentity(original);
  const { form } = openEditor(context, identity, original);
  form.querySelector("[data-custom-restaurant-tag]").value = "麻辣鍋";
  context.addCustomRestaurantTag(form);
  form.checkedTags = ["麻辣鍋"];
  await context.submitCandidateDraftEditor(form);
  assert.match(JSON.stringify(context.candidateDraftStore.get(identity).restaurantTagOptions), /麻辣鍋/);

  context.endImportSession(); // the real cleanup already invoked on batch-add success and on closing/cancelling the import sheet
  assert.equal(context.candidateDraftStore.size, 0);

  const fresh = context.candidateDraft(identity, original);
  assert.deepEqual(Array.from(fresh.restaurantTags), ["火鍋"], "a fresh import session recomputes the canonical suggestion only");
  assert.doesNotMatch(JSON.stringify(fresh.restaurantTagOptions || []), /麻辣鍋/, "an abandoned custom tag never survives into the next import session");
});

test("J. a general Google Maps restaurant candidate never renders the lodging coordinate warning (production candidate preview render)", () => {
  const original = candidate({
    placeId: "place-coordinate-restaurant", kind: "restaurant", category: "地址座標",
    coordinateLocation: true, coordinateFallback: false, addressProvider: "Google Maps",
  });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  let captured = "";
  context.sheetRoot.insertAdjacentHTML = (_, html) => { captured = html; };
  context.openImportCandidatePreview(context.importCandidateIdentity(original));
  assert.doesNotMatch(captured, /這是地址座標，不是住宿名稱/);
});

test("K. a general attraction candidate never renders the lodging coordinate warning", () => {
  const original = candidate({
    placeId: "place-coordinate-attraction", kind: "attraction", category: "地址座標",
    coordinateLocation: true, coordinateFallback: false, addressProvider: "Google Maps",
  });
  const { context } = makeContext({ pendingPlaceImports: [original] });
  let captured = "";
  context.sheetRoot.insertAdjacentHTML = (_, html) => { captured = html; };
  context.openImportCandidatePreview(context.importCandidateIdentity(original));
  assert.doesNotMatch(captured, /這是地址座標，不是住宿名稱/);
});

test("L. a genuine lodging candidate keeps its original coordinate-warning gating unaffected", () => {
  const lodgingCoordinateOnly = candidate({
    placeId: "place-lodging-coordinate", kind: "lodging", category: "自訂地址",
    coordinateLocation: true, coordinateFallback: false, addressProvider: "Google Maps",
  });
  const { context: contextA } = makeContext({ pendingPlaceImports: [lodgingCoordinateOnly] });
  let capturedA = "";
  contextA.sheetRoot.insertAdjacentHTML = (_, html) => { capturedA = html; };
  contextA.openImportCandidatePreview(contextA.importCandidateIdentity(lodgingCoordinateOnly));
  assert.match(capturedA, /這是地址座標，不是住宿名稱/, "a true lodging candidate resolved only to a raw coordinate keeps its warning");

  const lodgingAddressFallback = candidate({
    placeId: "place-lodging-fallback", kind: "lodging", category: "住宿地址座標",
    coordinateLocation: true, coordinateFallback: true,
  });
  const { context: contextB } = makeContext({ pendingPlaceImports: [lodgingAddressFallback] });
  let capturedB = "";
  contextB.sheetRoot.insertAdjacentHTML = (_, html) => { capturedB = html; };
  contextB.openImportCandidatePreview(contextB.importCandidateIdentity(lodgingAddressFallback));
  assert.match(capturedB, /這是住宿地址座標/, "the existing coordinateFallback lodging warning is unaffected");
  assert.doesNotMatch(capturedB, /這是地址座標，不是住宿名稱/);
});

test("M. Area and Restaurant share one add-tag interaction pattern (button text, structure, CSS classes)", () => {
  const { context } = makeContext();
  const restaurantHtml = context.restaurantTagEditor({ kind: "restaurant", restaurantTags: ["火鍋"] }, "restaurant", true);
  const areaHtml = context.areaTagEditor();
  for (const html of [restaurantHtml, areaHtml]) {
    assert.match(html, /class="tag-add-row"/);
    assert.match(html, /class="tag-add-button"[^>]*>＋新增 TAG</);
    assert.match(html, /class="tag-custom-entry" hidden/);
    assert.match(html, /placeholder="輸入標籤"/);
    assert.match(html, />加入</);
    assert.match(html, />取消</);
  }
  // Shared CSS classes, not a per-editor duplicate: one generic rule set drives both rows.
  assert.match(stylesSource, /\.tag-add-row \{[^}]*height: 44px/);
  assert.match(stylesSource, /\.tag-add-row input, \.tag-add-row button \{[^}]*height: 44px/);
  assert.doesNotMatch(stylesSource, /\.area-tag-input \{/, "the old area-only input wrapper class must be gone, not left as dead CSS");
});
