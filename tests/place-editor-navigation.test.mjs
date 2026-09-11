import { tagOptionsNode } from "./helpers/tag-options-node.mjs";
import AreaTags from "../lib/area-tags.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const functionSource = (name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, `function ${name} not found`);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
};

const helpers = section("function manualPlaceSeed", "async function compressPlacePhoto(file)");
const editorValueHelpers = section("function defaultPlaceCategory", "function openPlaceEditSheet");
const submit = section('if (event.target.id === "place-editor-form")', 'if (event.target.id === "shopping-item-form")');
const editorCore = section("function restaurantTagValues", "function placesScreen")
  + section("const TRAVEL_AREA_RESOLUTION_VERSION", "function placeVoters")
  + section("function saveRestaurantTagsOnly", "function renamePlaceReferences")
  + helpers + editorValueHelpers;
const detailCore = ["placeDetailKey", "resolveDetailPlace", "identitySafePhotos", "detailGalleryPhotos",
  "detailGalleryCard", "bindDetailGallery", "googleMapsNavigationUrl", "detailGooglePlaceId", "placeMapsUrl", "openPlaceSheet"]
  .map(functionSource).join("\n");
// The real Cancel/backdrop-dismiss branches added this round, extracted verbatim -- this is
// the actual shipped click-delegation code, not a re-implementation of its intent.
const dismissSnippet = section('if (event.target.closest("[data-close-sheet]")) {', 'const reorderMenu = event.target.closest("[data-reorder-menu]");');

function node(value = "") {
  return { value, disabled: false, hidden: false, textContent: "", placeholder: "", dataset: {}, attributes: {}, clickCount: 0, listeners: {},
    ...tagOptionsNode(),
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    fire(type, event = {}) { let result; for (const fn of this.listeners[type] || []) result = fn(event); return result; },
    click() { this.clickCount += 1; } };
}

const good = { latitude: 35.7, longitude: 139.7, formattedAddress: "Google 標準地址 1-2-3", countryCode: "JP",
  travelAreaKey: "shinjuku", travelAreaZh: "新宿", travelAreaLocal: "新宿", travelAreaResolved: true,
  travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
// A fully-classified travel area on every fixture keeps ensureTravelAreaFields (called by the
// real travelAreaDisplayName whenever any detail sheet renders) a no-op, isolating each
// assertion to what Save/Cancel themselves are responsible for.
const classified = { travelAreaKey: "shibuya", travelAreaZh: "澀谷", travelAreaLocal: "渋谷", travelAreaResolved: true,
  travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };

function harness({ existing = null, extraState = {} } = {}) {
  const requests = [];
  const renderCalls = [];
  const sheetRoot = { innerHTML: "" };
  const places = existing ? [existing] : [];
  const state = { tripId: "trip", destination: "東京", places, votes: {}, itinerary: {}, transports: [],
    placeKind: "all", selectedArea: "", ...extraState };
  const form = node();
  form.id = "place-editor-form";
  form.isConnected = true;
  form.dataset = { originalPlaceName: existing?.name || "", originalAddress: existing?.formattedAddress || "" };
  form.elements = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin", "travelAreaZh", "travelAreaLocal", "kind", "category"].map((key) => [key, node()]));
  Object.assign(form.elements.name, { value: existing?.name || "私人住宿" });
  form.elements.address.value = existing?.manualAddress || existing?.formattedAddress || "";
  form.elements.kind.value = existing?.kind || "lodging";
  form.elements.category.value = existing?.category || "私人住宿";
  form.elements.category.dataset.categoryKind = form.elements.kind.value;
  form.elements.referenceUrl.value = existing?.referenceUrl || "";
  const nodes = new Map();
  form.querySelector = (selector) => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  form.querySelectorAll = () => Object.values(form.elements);

  const context = vm.createContext({
    AreaTags, escapeHtml: (s) => String(s ?? ""), URL, console,
    pendingLodgingDrafts: [], pendingPlacePhoto: "", removePendingPlacePhoto: false,
    state,
    setTimeout, clearTimeout,
    fetch(url, options) { return new Promise((resolve) => requests.push({ url, body: JSON.parse(options.body), resolve })); },
    isGoogleMapsUrl: (value) => /maps/.test(value || ""), isLodgingShareUrl: () => false,
    placeReferenceMeta: () => null, validMapCoordinates: (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0),
    compressPlacePhotoDataUrl: async (data) => data, renderPlacePhotoEditor() {}, kindLabel: (kind) => ({ lodging: "住宿" }[kind] || "地點"),
    placeAreaFromAddress: () => "", currentMemberId: () => "member",
    canEdit: () => true, guestOnlyMessage() {}, showToast() {},
    crypto: { randomUUID: () => "id" }, persist() {}, renamePlaceReferences() {},
    render(options) { renderCalls.push(options); },
    closeSheet() { sheetRoot.innerHTML = ""; },
    FormData: class {
      constructor(form) { this.tags = form.checkedTags || []; this.values = Object.fromEntries(Object.entries(form.elements).map(([key, node]) => [key, node.value])); }
      get(key) { return this.values[key]; }
      getAll(key) { return this.tags; }
    },
    sheetRoot,
    normalizeGoogleMapsUrl: (url) => url || "",
    normalizedPlaceKind: () => "lodging", applyPlanningRegionResolution: () => {},
    placeNavigationUrl: () => "maps", safeTabelogUrl: () => "", tabelogMultilingualWebUrl: () => "", tabelogAppLink: () => "",
    placeVoters: () => [], travelAreaDisplayName: () => "新宿",
    formatOpeningHours: () => "", avatarMarkup: () => "", memberName: () => "",
    placeAssignments: () => [], placeScheduleLabel: () => "", placeCreatorName: () => "測試",
    ensurePlaceDetails: async () => {},
    areaGeometryCatalog: null, loadAreaGeometry: () => Promise.resolve(null),
  });
  vm.runInContext(editorCore + detailCore
    + `\nasync function submitEditor(event) { ${submit} }\nfunction dismissSheet(event) { ${dismissSnippet} }`, context);
  const session = context.bindPlaceEditor(form, existing, {});
  return { context, form, session, requests, renderCalls, sheetRoot, state,
    reply(index, place = good) { requests[index].resolve({ ok: true, json: async () => ({ places: [place] }) }); },
    save() { return context.submitEditor({ target: form, preventDefault() {} }); },
    cancelViaButton() { return context.dismissSheet({ target: { closest: (sel) => ["[data-close-sheet]", "#place-editor-form"].includes(sel) ? form : null } }); },
    cancelViaBackdrop() { return context.dismissSheet({ target: { matches: (sel) => sel === "[data-dismiss-sheet]", querySelector: (sel) => sel === "#place-editor-form" ? form : null, closest: () => null } }); },
  };
}

test("place-editor action bar is a sticky in-scroll footer, not a viewport-fixed one", () => {
  assert.match(source, /<div class="modal-actions">.*data-close-sheet.*儲存變更.*確認新增/s);
  assert.match(stylesSource, /\.place-editor-sheet > \.modal-actions\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0;/s);
  const rule = stylesSource.slice(stylesSource.indexOf(".place-editor-sheet > .modal-actions"), stylesSource.indexOf("}", stylesSource.indexOf(".place-editor-sheet > .modal-actions")));
  assert.doesNotMatch(rule, /position:\s*fixed/, "must stay sticky inside the sheet's own scroll container, never viewport-fixed");
  assert.match(rule, /env\(safe-area-inset-bottom\)/, "must respect the iOS home-indicator safe area");
  assert.match(rule, /background:\s*var\(--paper-2\)/, "opaque background so scrolled content cannot show through");
  assert.match(rule, /border-top|box-shadow/, "must visually separate from the scrolled content above it");
  assert.match(stylesSource, /\.place-editor-sheet\s*\{[^}]*overflow-y:\s*auto;/s, "the sheet itself, not the viewport, must be the sticky positioning context");
});

test("Save on an existing place returns to the same place's updated detail, preserves list scroll/filter state, and never resets it to list top", async () => {
  const existing = { id: "p1", name: "自由之家", kind: "lodging", areaTags: [], category: "私人住宿",
    manualAddress: "Room 202, 1 Chome-16-19 Okubo, Shinjuku-ku, Tokyo-to 169-0072", formattedAddress: "舊地址",
    latitude: 35.7, longitude: 139.7, placeId: "", sourceUrl: "", ...classified };
  const h = harness({ existing, extraState: { placeKind: "restaurant", selectedArea: "shinjuku", areaTagFilter: "銀座" } });
  const saved = h.save();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.requests.length, 1);
  h.reply(0, good);
  await saved;

  assert.equal(h.state.places.length, 1, "save must update the same record, not add a duplicate");
  assert.equal(h.state.places[0].formattedAddress, good.formattedAddress, "detail must reflect the newly saved data");
  assert.match(h.sheetRoot.innerHTML, /自由之家/, "must reopen the same place's detail, not the list");
  assert.doesNotMatch(h.sheetRoot.innerHTML, /place-editor-form/, "the editor sheet must be closed, replaced by the detail sheet");
  assert.equal(h.renderCalls.length, 1, "the underlying list render must run exactly once");
  assert.equal(h.renderCalls[0].preserveScroll, true, "the underlying list render must preserve scroll");
  assert.equal(h.state.placeKind, "restaurant", "an existing-place save must not silently change the kind filter");
  assert.equal(h.state.selectedArea, "shinjuku", "an existing-place save must not clear the selected area");
  assert.equal(h.state.areaTagFilter, "銀座", "an existing-place save must not touch unrelated filter state");
});

test("Save persists a rename under a stable identity and still reopens that same place's detail", async () => {
  const existing = { id: "p4", name: "舊名字", kind: "attraction", areaTags: [], category: "景點",
    formattedAddress: "地址四", manualAddress: "地址四", latitude: 35.7, longitude: 139.7, placeId: "", sourceUrl: "", ...classified };
  const h = harness({ existing });
  h.form.elements.name.value = "新名字";
  const saved = h.save();
  await new Promise((resolve) => setImmediate(resolve));
  h.reply(0, good);
  await saved;
  assert.equal(h.state.places[0].id, "p4", "renaming must preserve the stable P0 identity");
  assert.equal(h.state.places[0].name, "新名字");
  assert.match(h.sheetRoot.innerHTML, /新名字/, "detail must reopen under the saved record's new name");
});

test("saveAreaTagsOnly (the bulk-tagging fast path) reopens the same detail with fresh evidence, never a filtered-list lookup", async () => {
  const existing = { id: "p3", name: "三越新館", kind: "attraction", areaTags: [], category: "景點",
    formattedAddress: "地址三", manualAddress: "地址三", latitude: 35.7, longitude: 139.7, placeId: "", sourceUrl: "", ...classified };
  // A filter this place will no longer match once it is tagged -- proves detail reopen never
  // re-derives the place from any currently-visible/filtered subset.
  const h = harness({ existing, extraState: { areaTagFilter: "地區待確認" } });
  h.session.areaTags = ["銀座"];
  h.session.dirty.add("areaTags");
  assert.equal(h.context.canSaveAreaTagsOnly(h.form), true);
  assert.equal(h.context.saveAreaTagsOnly(h.form), true);
  assert.deepEqual(Array.from(h.state.places[0].areaTags), ["銀座"]);
  assert.match(h.sheetRoot.innerHTML, /三越新館/, "detail must render even though the place no longer matches the active filter");
  assert.equal(h.renderCalls.length, 1);
  assert.equal(h.renderCalls[0].preserveScroll, true);
  assert.equal(h.renderCalls[0].filterOnly, true);
  assert.equal(h.state.areaTagFilter, "地區待確認", "the filter itself is not reset by a tag-only save");
});

test("Cancel via the button or the backdrop discards the draft and returns to the original, pre-edit detail without touching list state", () => {
  const existing = { id: "p2", name: "咖啡店", kind: "attraction", areaTags: ["原宿"], category: "咖啡",
    manualAddress: "地址", formattedAddress: "地址", latitude: 35.7, longitude: 139.7, placeId: "", sourceUrl: "", ...classified };
  for (const trigger of ["cancelViaButton", "cancelViaBackdrop"]) {
    const before = structuredClone(existing);
    const h = harness({ existing, extraState: { placeKind: "restaurant", areaTagFilter: "銀座" } });
    h.session.areaTags.push("尚未儲存的標籤");
    h.session.dirty.add("areaTags");
    h[trigger]();
    assert.deepEqual(existing, before, `${trigger}: cancelling must never write the draft back to the Place`);
    assert.match(h.sheetRoot.innerHTML, /咖啡店/, `${trigger}: must reopen the original detail, not the list`);
    assert.match(h.sheetRoot.innerHTML, /原宿/, `${trigger}: detail must show the original saved areaTags, not the discarded draft`);
    assert.doesNotMatch(h.sheetRoot.innerHTML, /尚未儲存的標籤/);
    assert.equal(h.renderCalls.length, 0, `${trigger}: the underlying list must not re-render at all`);
    assert.equal(h.state.placeKind, "restaurant");
    assert.equal(h.state.areaTagFilter, "銀座");
  }
});

test("adding a brand-new place (no prior detail to return to) keeps its existing close-to-list behavior", async () => {
  const h = harness({});
  h.form.elements.name.value = "全新地點";
  h.form.elements.address.value = "某個地址";
  const saved = h.save();
  await new Promise((resolve) => setImmediate(resolve));
  h.reply(0, good);
  await saved;
  assert.equal(h.state.places.length, 1);
  assert.equal(h.sheetRoot.innerHTML, "", "a brand-new place has no prior detail context, so the sheet just closes to the list");
  assert.equal(h.state.placeKind, "lodging", "unlike an edit, adding a new place may still switch the list to show it");
});
