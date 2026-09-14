import AreaTags from "../lib/area-tags.js";
import areaAudit from "../lib/travel-area-audit.js";
import PlanningGeography from "../lib/planning-geography.js";
import canonicalCatalog from "../lib/canonical-travel-catalog.js";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const c = vm.createContext({ AreaTags, PlanningGeography, TravelAreaAudit: areaAudit, escapeHtml: (s) => String(s).replaceAll('"', '&quot;'),
 state: {}, placeVoters: () => [], currentMemberId: () => "me" });
vm.runInContext(section("const TRAVEL_AREA_RESOLUTION_VERSION", "function placeVoters") + section("function restaurantTagValues", "function placesScreen")
 + section("function matchesMapFilters", "function spreadOverlappingPins"), c);
const area = (key, extra = {}) => ({ ...canonicalCatalog.catalog[key], travelAreaResolved: true, travelAreaSource: "automatic",
 travelAreaResolver: "JP_TRAVEL_AREA", travelAreaResolutionVersion: 5, travelAreaResolutionStatus: "resolved", travelAreaResolutionError: "", ...extra });
const UENO = "group:ueno-asakusa-akihabara";
const places = [
 area("ueno", { name: "a", kind: "restaurant", restaurantTags: ["燒肉", "日式"] }),
 area("shinjuku", { name: "b", kind: "restaurant", restaurantTags: ["壽喜燒"] }),
 area("asakusa", { name: "c", kind: "attraction" }),
 { name: "d", kind: "restaurant" },
 area("ueno", { name: "e", kind: "restaurant", restaurantTags: ["燒肉"] }),
];
const names = (model) => Array.from(model.visible, (p) => p.name);
test("大地區 choices use Planning Geography sections with stable sectionKey identity and include unresolved sections under all", () => {
 const selection = { placeKind: "all" };
 const model = c.placesFilterModel(places, selection);
 assert.deepEqual(Array.from(model.sections, ([key]) => key), [UENO, "area:shinjuku", "area:unclassified:d"]);
 assert.deepEqual(Array.from(model.sections.slice(0, 2), ([, label]) => label), ["上野・淺草・秋葉原", "新宿"]);
 assert.ok(!model.sections.some(([key, label]) => key === "ueno" || label === "上野"), "grouped Canonical Areas are not 大地區 options");
 assert.deepEqual(names(model), ["a", "b", "c", "d", "e"]);
 selection.placeSectionFilter = UENO;
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a", "c", "e"]);
 selection.placeSectionFilter = "ueno";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a", "b", "c", "d", "e"]);
 assert.equal(selection.placeSectionFilter, "", "a Canonical Area key is not a 大地區 identity");
});
test("地點類別 → 大地區 → 餐廳類別 cascade: hidden category resets, stale selections reset and nothing is resurrected", () => {
 const selection = { placeKind: "restaurant", placeSectionFilter: UENO, restaurantTagFilter: "燒肉" };
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a", "e"]);
 selection.placeSectionFilter = "area:shinjuku"; selection.restaurantTagFilter = "壽喜燒";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["b"]);
 selection.restaurantTagFilter = "燒肉";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["b"]);
 assert.equal(selection.restaurantTagFilter, "");
 selection.placeKind = "attraction"; selection.placeSectionFilter = UENO; selection.restaurantTagFilter = "燒肉";
 const attraction = c.placesFilterModel(places, selection);
 assert.deepEqual(names(attraction), ["c"]); assert.equal(attraction.cuisineVisible, false); assert.equal(selection.restaurantTagFilter, "");
 selection.placeKind = "all";
 const all = c.placesFilterModel(places, selection);
 assert.equal(all.cuisineVisible, true); assert.equal(selection.restaurantTagFilter, ""); assert.deepEqual(names(all), ["a", "c", "e"]);
 selection.placeKind = "lodging"; selection.restaurantTagFilter = "燒肉";
 const lodging = c.placesFilterModel(places, selection);
 assert.equal(lodging.cuisineVisible, false); assert.equal(selection.restaurantTagFilter, ""); assert.equal(selection.placeSectionFilter, "");
 selection.placeKind = "restaurant";
 c.placesFilterModel([places[3]], selection);
 assert.equal(selection.placeSectionFilter, ""); assert.equal(selection.restaurantTagFilter, "");
});
test("old and malformed tags are safe, nonrestaurants ignored, custom tags selectable", () => {
 assert.equal(c.restaurantTagValues({ kind: "restaurant", restaurantTags: "燒肉" }).length, 0);
 assert.equal(c.restaurantTagValues({ kind: "shopping", restaurantTags: ["燒肉"] }).length, 0);
 assert.deepEqual(Array.from(c.restaurantTagValues({ kind: "restaurant", restaurantTags: [null, "燒肉", "燒肉", "日式"] })), ["燒肉", "日式"]);
 assert.match(c.restaurantTagEditor(places[0], "restaurant"), /value="日式" checked/);
 assert.match(c.restaurantTagEditor(places[0], "attraction"), /data-restaurant-tag-editor hidden/);
});
test("automatic suggestions only accept exact explicit categories, never names", () => {
 for (const [category, tag] of [["拉麵店", "拉麵"], ["壽喜燒店", "壽喜燒"], ["燒肉店", "燒肉"]]) assert.deepEqual(Array.from(c.restaurantTagsFromCategory(category)), [tag]);
 assert.equal(c.restaurantTagsFromCategory("壽喜燒名店 Aidaya").length, 0);
 assert.equal(c.restaurantTagsFromCategory("餐廳").length, 0);
 const update = section("async function ensurePlaceDetails", "function openProfileSheet");
 assert.doesNotMatch(update, /restaurantTagsFromCategory|restaurantTags:/);
});
test("shared sanitizer and JSON reload retain optional tags and explicit empty arrays", () => {
 const server = readFileSync(new URL("../api/trip.mjs", import.meta.url), "utf8");
 const fn = server.slice(server.indexOf("function cleanTrip"), server.indexOf("export default async function"));
 const clean = new Function("areaAudit", "areaCatalog", "areaTags", `${fn}; return cleanTrip;`)(areaAudit, {}, AreaTags);
 const before = [...places, { kind: "restaurant", restaurantTags: [] }];
 const payload = clean({ places: before }, { title: "旅程" }, { id: "a", nickname: "a" });
 const reload = JSON.parse(JSON.stringify(payload));
 assert.deepEqual(reload.places, before);
 assert.match(section("function sharedTripPayload", "function applySharedTrip"), /places: state.places/);
});
test("filters render as four labelled dropdowns, category only for all/restaurant, and never invoke resolver", () => {
 c.state = { placeKind: "restaurant", placeSectionFilter: "", areaTagFilter: "", restaurantTagFilter: "" };
 const html = c.placesFilterDropdowns(c.placesFilterModel(places, c.state));
 for (const [filter, label] of [["kind", "地點類別"], ["section", "大地區"], ["areaTag", "地區標籤"], ["restaurantTag", "餐廳類別"]]) {
  assert.match(html, new RegExp(`<label for="places-filter-${filter}">${label}</label><select id="places-filter-${filter}" data-places-filter="${filter}">`), filter);
 }
 assert.match(html, /<option value="restaurant" selected>餐廳<\/option>/);
 assert.doesNotMatch(html, /<button|aria-pressed|data-place-kind|data-area-tag-filter|data-restaurant-tag-filter|data-place-area-filter|multiple/);
 c.state.placeKind = "all";
 assert.match(c.placesFilterDropdowns(c.placesFilterModel(places, c.state)), /data-places-filter="restaurantTag"/);
 for (const kind of ["attraction", "lodging", "shopping"]) {
  c.state.placeKind = kind;
  assert.doesNotMatch(c.placesFilterDropdowns(c.placesFilterModel(places, c.state)), /data-places-filter="restaurantTag"/, kind);
 }
 assert.doesNotMatch(section("function placesFilterModel", "function placesScreen"), /fetch\(|resolve|persist\(|saveSharedTrip/);
 const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
 assert.match(css, /\.places-filter-field select \{[^}]*min-height: 44px[^}]*font-size: 16px/);
 assert.doesNotMatch(css, /\.places-filter-chips|\.place-kind-tabs/);
});


test("List and Map share the sectionKey filter; section changes filter the map without cuisine leakage", () => {
 c.state = { placeKind: "all", placeSectionFilter: UENO, restaurantTagFilter: "", mapCategory: "all", mapPreference: "all" };
 assert.deepEqual(places.filter(c.matchesMapFilters).map(p => p.name), ["a", "c", "e"]);
 c.state.placeSectionFilter = "area:shinjuku";
 assert.deepEqual(places.filter(c.matchesMapFilters).map(p => p.name), ["b"]);
 c.state.placeSectionFilter = "";
 assert.equal(places.filter(c.matchesMapFilters).length, places.length);
 c.state.placeKind = "attraction"; c.state.restaurantTagFilter = "燒肉";
 assert.deepEqual(places.filter(c.matchesMapFilters).map(p => p.name), ["c"], "a hidden category never filters the map");
});

test("empty area preserves Google/Leaflet viewport, scoped to the current trip", () => {
 const context = vm.createContext({ AreaTags, state: { tripId: "trip" }, activeGoogleMap: { getCenter: () => ({ lat: () => 35.64, lng: () => 139.7 }), getZoom: () => 15 }, activeLeafletMap: null });
 vm.runInContext(section("let lastMapViewport", "function renderGoogleInteractiveMap"), context);
 context.rememberMapViewport();
 assert.equal(context.emptyMapViewport().zoom, 15);
 assert.equal(context.emptyMapViewport().latitude, 35.64);
 context.activeGoogleMap = null;
 context.activeLeafletMap = { getCenter: () => ({ lat: 34.6, lng: 135.5 }), getZoom: () => 13 };
 context.rememberMapViewport();
 assert.equal(context.emptyMapViewport().longitude, 135.5);
 context.state.tripId = "different";
 assert.equal(context.emptyMapViewport().zoom, 11);
 const google = section("function renderGoogleInteractiveMap", "function renderLeafletInteractiveMap");
 const leaflet = section("function renderLeafletInteractiveMap", "async function ensureMapCoordinates");
 assert.match(google, /if \(places.length > 1\) map.fitBounds/);
 assert.match(leaflet, /if \(bounds.length > 1\) activeLeafletMap.fitBounds/);
 assert.match(google, /emptyMapViewport\(\).zoom/);
 assert.match(leaflet, /emptyMapViewport\(\).zoom/);
});

test("map dropdowns and adjacent location/fullscreen controls exist in both layouts", () => {
 const map = section("function mapScreen", "function mapPinColor");
 assert.equal((map.match(/\$\{placeFilters\}/g) || []).length, 2);
 assert.match(map, /const placeFilters = placesFilterDropdowns\(filterModel, \{ idPrefix: mapFullscreen \? "map-drawer" : "map" \}\)/);
 assert.equal((map.match(/\$\{mapActions\}/g) || []).length, 2);
 assert.match(map, /class="map-operation-actions"/);
 assert.doesNotMatch(map, /map-toolbar-actions[^\n]*fullscreenButton/);
 assert.doesNotMatch(map, /data-map-kind|data-map-area|data-place-kind|sidebarKindButtons/);
 const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
 assert.match(css, /\.places-filter-bar \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(css, /\.map-fullscreen-sidebar > \.places-filter-bar/);
});


test("category options derive from the selected 大地區 only and reset unavailable selection", () => {
 const selection = { placeKind: "all", placeSectionFilter: UENO, restaurantTagFilter: "" };
 assert.deepEqual(Array.from(c.placesFilterModel(places, selection).tags), ["燒肉", "日式"]);
 selection.restaurantTagFilter = "燒肉"; selection.placeSectionFilter = "area:shinjuku";
 assert.deepEqual(Array.from(c.placesFilterModel(places, selection).tags), ["壽喜燒"]);
 assert.equal(selection.restaurantTagFilter, "");
 selection.placeSectionFilter = "";
 assert.deepEqual(Array.from(c.placesFilterModel(places, selection).tags), ["燒肉", "日式", "壽喜燒"]);
});


test("editor choices are actual trip tags plus current values; unused and name-only guesses stay absent", () => {
 c.state.places = [{ kind: "restaurant", restaurantTags: ["牛排", "海鮮自助餐"] }, { kind: "attraction", restaurantTags: ["不該出現"] }];
 const html = c.restaurantTagEditor({ kind: "restaurant", restaurantTags: ["和牛"] }, "restaurant");
 for (const tag of ["牛排", "海鮮自助餐", "和牛"]) assert.ok(html.includes('value="' + tag + '"'));
 for (const tag of ["拉麵", "壽喜燒", "火鍋", "不該出現"]) assert.ok(!html.includes('value="' + tag + '"'));
 assert.match(html, /data-add-restaurant-tag/);
 assert.doesNotMatch(html, /data-save-restaurant-tags/);
 assert.deepEqual(Array.from(c.restaurantTagValues({ kind: "restaurant", name: "ラーメン燒肉店" })), []);
 assert.deepEqual(Array.from(c.restaurantTagValues({ kind: "restaurant", category: "海鮮自助餐" })), ["海鮮自助餐"]);
 c.state.places = [];
 assert.doesNotMatch(c.restaurantTagEditor({ kind: "restaurant", restaurantTags: [] }, "restaurant"), /name="restaurantTags"/);
});

test("custom input trims, deduplicates exact values and does not persist before Save", () => {
 const input={value:"  和牛  "}, existing={value:"和牛",checked:false,setAttribute(){},closest(){return this;}}, dirty=new Set(), entry={hidden:false};
 let inserted="";
 const form={querySelector(selector){ return selector.includes("data-custom") ? input : selector === ".tag-custom-entry" ? entry : {querySelector:()=>({append(){},querySelector:()=>null}),querySelectorAll:()=>[existing],insertAdjacentHTML:(_,html)=>inserted+=html}; },placeEditorSession:{dirty}};
 c.addCustomRestaurantTag(form);
 assert.equal(existing.checked,true);assert.equal(inserted,"");assert.equal(entry.hidden,true);assert(dirty.has("restaurantTags"));
 input.value="  漢堡  ";c.addCustomRestaurantTag(form);assert.match(inserted,/value="漢堡" checked/);
 const before=inserted;input.value="   ";c.addCustomRestaurantTag(form);assert.equal(inserted,before);
});


test("fullscreen reuses the shared dropdowns and mode switches retain filter selections", () => {
 c.state = { placeKind: "restaurant", placeSectionFilter: UENO, restaurantTagFilter: "燒肉" };
 const html = c.placesFilterDropdowns(c.placesFilterModel(places, c.state), { idPrefix: "map-drawer" });
 assert.match(html, /<select id="map-drawer-filter-section" data-places-filter="section">/);
 assert.match(html, /<option value="燒肉" selected>燒肉<\/option>/); assert.doesNotMatch(html, /壽喜燒/);
 const mode = section('  const mode = event.target.closest("[data-places-mode]")', '  if (event.target.closest("[data-toggle-map-fullscreen]"))');
 assert.doesNotMatch(mode, /state\.(?:placeKind|mapCategory|mapPreference|placeSectionFilter|areaTagFilter|restaurantTagFilter)\s*=/);
 assert.match(source, /const visiblePlaces = filters.visible.filter\(matchesMapFilters\)/);
});


test("formal vocabulary and detail use persisted arrays only, never defaults or legacy inference", () => {
 const old = { kind: "restaurant", category: "燒肉店", description: "火鍋", name: "拉麵" };
 c.state = { places: [old], placeKind: "all" };
 assert.deepEqual(Array.from(c.placesFilterModel(c.state.places, c.state).tags), []);
 assert.equal(c.placeTagsDetail(old), "");
 assert.doesNotMatch(c.restaurantTagEditor(old, "restaurant"), /name="restaurantTags"/);
 assert.deepEqual(Array.from(c.initialCandidateRestaurantTags(old)), ["燒肉", "火鍋"]);
 const committed = { kind: "restaurant", restaurantTags: ["火鍋"] };
 c.state.places = [committed];
 assert.deepEqual(Array.from(c.placesFilterModel(c.state.places, c.state).tags), ["火鍋"]);
 c.state.places = [];
 assert.deepEqual(Array.from(c.placesFilterModel(c.state.places, c.state).tags), []);
 assert.doesNotMatch(c.placesFilterDropdowns(c.placesFilterModel([], c.state)), /<option value="火鍋"/);
 const html = c.restaurantTagEditor({ kind: "restaurant", restaurantTags: ["全新自訂"] }, "restaurant");
 assert.match(html, /value="全新自訂" checked aria-label="全新自訂"/);
 assert.doesNotMatch(html, /restaurant-tag-remove|×|data-restaurant-tags-selected/);
});
