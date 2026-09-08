import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const c = vm.createContext({ escapeHtml: (s) => String(s).replaceAll('"', '&quot;'), state: {} });
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
test("area AND multi-valued cuisine, cuisine hidden/inactive for other kinds, stale filters reset", () => {
 const selection = { placeKind: "restaurant", placeAreaFilter: "ueno", restaurantTagFilter: "燒肉" };
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["a"]);
 selection.placeAreaFilter = "shinjuku"; selection.restaurantTagFilter = "壽喜燒";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["b"]);
 selection.restaurantTagFilter = "燒肉";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), []);
 selection.placeKind = "attraction"; selection.placeAreaFilter = "ueno";
 assert.deepEqual(names(c.placesFilterModel(places, selection)), ["c"]);
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
 assert.match(update, /!Array.isArray\(place.restaurantTags\)/);
});
test("shared sanitizer and JSON reload retain optional tags and explicit empty arrays", () => {
 const server = readFileSync(new URL("../api/trip.mjs", import.meta.url), "utf8");
 const fn = server.slice(server.indexOf("function cleanTrip"), server.indexOf("export default async function"));
 const clean = new Function(`${fn}; return cleanTrip;`)();
 const before = [...places, { kind: "restaurant", restaurantTags: [] }];
 const payload = clean({ places: before }, { title: "旅程" }, { id: "a", nickname: "a" });
 const reload = JSON.parse(JSON.stringify(payload));
 assert.deepEqual(reload.places, before);
 assert.match(section("function sharedTripPayload", "function applySharedTrip"), /places: state.places/);
});
test("filter controls expose pressed state, scroll horizontally, and do not invoke resolver", () => {
 c.state = { placeKind: "restaurant", placeAreaFilter: "", restaurantTagFilter: "" };
 const html = c.placesFilterChips(c.placesFilterModel(places, c.state));
 assert.match(html, /aria-label="餐飲"/); assert.match(html, /aria-pressed="true"/);
 c.state.placeKind = "all";
 assert.doesNotMatch(c.placesFilterChips(c.placesFilterModel(places, c.state)), /aria-label="餐飲"/);
 assert.doesNotMatch(section("function placesFilterModel", "function placesScreen"), /fetch\(|resolve|ensureTravelArea/);
 const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
 assert.match(css, /\.places-filter-chips \{[^}]*overflow-x: auto/);
});
