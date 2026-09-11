import AreaTags from "../lib/area-tags.js";
import areaAudit from "../lib/travel-area-audit.js";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const c = vm.createContext({ AreaTags, escapeHtml: (s) => String(s).replaceAll('"', '&quot;'), state: {} });
vm.runInContext(section("function restaurantTagValues", "function placesScreen"), c);
const places = [
 { name: "a", kind: "restaurant", travelAreaKey: "ueno", travelAreaZh: "上野", restaurantTags: ["燒肉", "日式"] },
 { name: "b", kind: "restaurant", travelAreaKey: "shinjuku", travelAreaZh: "新宿", restaurantTags: ["壽喜燒"] },
 { name: "c", kind: "attraction", travelAreaKey: "ueno", travelAreaZh: "上野" },
 { name: "d", kind: "restaurant" },
 { name: "e", kind: "restaurant", travelAreaKey: "other", travelAreaZh: "上野", restaurantTags: ["燒肉"] },
];
const names = (model) => Array.from(model.visible, (p) => p.name);
test("area choices use trip records, stable keys, and include missing areas under all", () => {
 const selection = { placeKind: "all" };
 const model = c.placesFilterModel(places, selection);
 assert.equal(model.areas.length, 3);
 assert.deepEqual(names(model), ["a", "b", "c", "d", "e"]);
 selection.placeAreaFilter = "ueno";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a", "c"]);
 assert.equal(places[3].travelAreaKey, undefined);
});
test("area AND multi-valued cuisine, cuisine applies across top-level kinds, stale filters reset", () => {
 const selection = { placeKind: "restaurant", placeAreaFilter: "ueno", restaurantTagFilter: "燒肉" };
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a"]);
 selection.placeAreaFilter = "shinjuku"; selection.restaurantTagFilter = "壽喜燒";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["b"]);
 selection.restaurantTagFilter = "燒肉";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["b"]);
 assert.equal(selection.restaurantTagFilter, "");
 selection.placeKind = "attraction"; selection.placeAreaFilter = "ueno"; selection.restaurantTagFilter = "燒肉";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), []);
 selection.placeKind = "all";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a"]);
 selection.placeKind = "restaurant";
 c.placesFilterModel([places[3]], selection);
 assert.equal(selection.placeAreaFilter, ""); assert.equal(selection.restaurantTagFilter, "");
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
test("filter controls expose pressed state, scroll horizontally, and do not invoke resolver", () => {
 c.state = { placeKind: "restaurant", placeAreaFilter: "", restaurantTagFilter: "" };
 const html = c.placesFilterChips(c.placesFilterModel(places, c.state));
 assert.match(html, /aria-label="類別"/); assert.match(html, /aria-pressed="true"/);
 c.state.placeKind = "all";
 assert.match(c.placesFilterChips(c.placesFilterModel(places, c.state)), /aria-label="類別"/);
 assert.doesNotMatch(c.placesFilterChips(c.placesFilterModel([{ kind: "restaurant" }], c.state)), /aria-label="類別"/);
 assert.doesNotMatch(section("function placesFilterModel", "function placesScreen"), /fetch\(|resolve|ensureTravelArea/);
 const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
 assert.match(css, /\.places-filter-chips \{[^}]*overflow-x: auto/);
});


test("List and Map share stable area key; area changes filter map without cuisine leakage", () => {
 const context = vm.createContext({ AreaTags, state: { placeKind: "all", placeAreaFilter: "ueno", mapCategory: "all", mapPreference: "all" }, placeVoters: () => [] });
 vm.runInContext(section("function matchesMapFilters", "function spreadOverlappingPins"), context);
 assert.deepEqual(places.filter(context.matchesMapFilters).map(p => p.name), ["a", "c"]);
 context.state.placeAreaFilter = "shinjuku";
 assert.deepEqual(places.filter(context.matchesMapFilters).map(p => p.name), ["b"]);
 context.state.placeAreaFilter = "";
 assert.equal(places.filter(context.matchesMapFilters).length, places.length);
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

test("map chips and adjacent location/fullscreen controls exist in both layouts", () => {
 const map = section("function mapScreen", "function mapPinColor");
 assert.equal((map.match(/\$\{areaFilters\}/g) || []).length, 1);
 assert.equal((map.match(/\$\{areaDropdown\}/g) || []).length, 1);
 assert.equal((map.match(/\$\{mapActions\}/g) || []).length, 2);
 assert.match(map, /class="map-operation-actions"/);
 assert.doesNotMatch(map, /map-toolbar-actions[^\n]*fullscreenButton/);
 const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
 assert.match(css, /places-filter-chips[^}]*flex-wrap: nowrap/);
 assert.match(css, /places-filter-chips::-webkit-scrollbar/);
});


test("category options derive from selected area only and reset unavailable selection", () => {
 const selection = { placeKind: "all", placeAreaFilter: "ueno", restaurantTagFilter: "" };
 assert.deepEqual(Array.from(c.placesFilterModel(places, selection).tags), ["燒肉", "日式"]);
 selection.restaurantTagFilter = "燒肉"; selection.placeAreaFilter = "shinjuku";
 assert.deepEqual(Array.from(c.placesFilterModel(places, selection).tags), ["壽喜燒"]);
 assert.equal(selection.restaurantTagFilter, "");
 selection.placeAreaFilter = "";
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


test("fullscreen categories reuse common chips without duplicate area and retain mode selections", () => {
 c.state = {placeKind:"restaurant",placeAreaFilter:"ueno",restaurantTagFilter:"燒肉"};
 const html=c.placesFilterChips(c.placesFilterModel(places,c.state),{area:false});
 assert.match(html,/aria-label="類別"/);assert.doesNotMatch(html,/data-place-area-filter/);assert.doesNotMatch(html,/壽喜燒/);
 const mode=section('  const mode = event.target.closest("[data-places-mode]")','  const listFilter =');
 assert.doesNotMatch(mode,/state\.(?:placeKind|mapCategory|mapPreference)\s*=/);
 assert.match(source,/const visiblePlaces = filters.visible.filter\(matchesMapFilters\)/);
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
 assert.doesNotMatch(c.placesFilterChips(c.placesFilterModel([], c.state)), /data-restaurant-tag-filter/);
 const html = c.restaurantTagEditor({ kind: "restaurant", restaurantTags: ["全新自訂"] }, "restaurant");
 assert.match(html, /value="全新自訂" checked aria-label="全新自訂"/);
 assert.doesNotMatch(html, /restaurant-tag-remove|×|data-restaurant-tags-selected/);
});
