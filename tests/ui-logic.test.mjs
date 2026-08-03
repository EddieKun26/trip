import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function sourceSection(start, end) {
  const startIndex = appSource.indexOf(start);
  const endIndex = appSource.indexOf(end, startIndex);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `missing source section: ${start}`);
  return appSource.slice(startIndex, endIndex);
}

test("persisted romanized Tokyo areas display as Chinese and Japanese", () => {
  const section = sourceSection("const knownAreaLabels", "function placeVoters");
  const areaDisplayName = new Function(`${section}; return areaDisplayName;`)();
  assert.equal(areaDisplayName("Ginza", "Ginza"), "銀座（銀座）");
  assert.equal(areaDisplayName("Ebisunishi", "Ebisunishi"), "惠比壽西（恵比寿西）");
});

test("day map numbers places by itinerary time and excludes flights", () => {
  const section = sourceSection("function filteredMapPlaces", "function mapScreen");
  const state = {
    mapView: "day",
    mapDate: "9/20",
    selectedDate: "9/20",
    places: [{ name: "下午景點" }, { name: "早上景點" }],
    itinerary: {
      "9/20": [
        { name: "下午景點", time: "14:00" },
        { type: "flight", flightId: "outbound", time: "09:30" },
        { name: "早上景點", time: "09:00" },
      ],
    },
  };
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", `const dateMeta = [["9/20", "週日"]]; ${section}; return filteredMapPlaces;`)(state, (places) => places, () => true);
  assert.deepEqual(filteredMapPlaces().map(({ name, dayOrder }) => [name, dayOrder]), [["早上景點", 1], ["下午景點", 2]]);
});

test("all-date route map keeps daily ordering and assigns different route colors", () => {
  const section = sourceSection("function filteredMapPlaces", "function mapScreen");
  const state = {
    mapView: "day",
    mapDate: "all",
    places: [{ name: "東京景點" }, { name: "首爾景點" }],
    itinerary: {
      "9/20": [{ name: "東京景點", time: "10:00" }],
      "9/21": [{ name: "首爾景點", time: "09:00" }],
    },
  };
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", `const dateMeta = [["9/20", "週日"], ["9/21", "週一"]]; ${section}; return filteredMapPlaces;`)(state, (places) => places, () => true);
  const places = filteredMapPlaces();
  assert.deepEqual(places.map(({ routeDate, dayOrder }) => [routeDate, dayOrder]), [["9/20", 1], ["9/21", 1]]);
  assert.notEqual(places[0].routeColor, places[1].routeColor);
});

test("itinerary uses custom solid drag behavior instead of native translucent dragging", () => {
  assert.doesNotMatch(appSource, /draggable="true"/);
  assert.match(appSource, /row\.animate\(/);
  assert.match(appSource, /data-swipe-item/);
  assert.match(appSource, /position: "fixed"/);
  assert.doesNotMatch(appSource, /window\.prompt\("輸入時間/);
  assert.doesNotMatch(appSource, /id="time-picker-form"/);
  assert.match(appSource, /type="time"[^>]+data-edit-time/);
  assert.match(appSource, /sortItineraryByTime\(state\.selectedDate\)/);
  assert.match(appSource, /id="itinerary-places-form"/);
});

test("changing a time sorts places and flights chronologically", () => {
  const section = sourceSection("function itineraryItemTime", "function syncFlightItineraryItems");
  const state = {
    flights: [{ id: "outbound", departureTime: "09:55" }],
    itinerary: {
      "9/20": [
        { name: "下午景點", time: "14:00" },
        { type: "flight", flightId: "outbound", time: "09:55" },
        { name: "早上景點", time: "08:30" },
      ],
    },
  };
  const sortItineraryByTime = new Function("state", `${section}; return sortItineraryByTime;`)(state);
  sortItineraryByTime("9/20");
  assert.deepEqual(state.itinerary["9/20"].map((item) => item.name || item.flightId), ["早上景點", "outbound", "下午景點"]);
});

test("day route markers keep place mark and votes with a separate order badge", () => {
  const section = sourceSection("function markerHtml", "async function getGoogleMapsBrowserKey");
  const markerHtml = new Function("state", "escapeHtml", "mapPinColor", "placeMapStatus", "placeVoters", `${section}; return markerHtml;`)(
    { mapView: "day" },
    (value) => String(value),
    () => "#000",
    () => "scheduled",
    () => ["a", "b"],
  );
  const html = markerHtml({ name: "景點", mark: "景", dayOrder: 3, routeDate: "9/20", routeColor: "#123" });
  assert.match(html, /<span>景<\/span>/);
  assert.match(html, /★ 2/);
  assert.match(html, /<em>3<\/em>/);
  assert.match(appSource, /class TripPlaceOverlay extends google\.maps\.OverlayView/);
});
