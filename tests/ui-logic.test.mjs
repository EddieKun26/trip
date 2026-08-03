import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

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

test("day map follows itinerary order and represents flights with the relevant airport", () => {
  const section = sourceSection("function flightAirportInfo", "function mapScreen");
  const state = {
    mapView: "day",
    mapDate: "9/20",
    selectedDate: "9/20",
    flights: [{ id: "outbound", direction: "去程", departureCode: "KHH", departureCity: "高雄", arrivalCode: "NRT", arrivalCity: "成田", departureTime: "09:30" }],
    places: [{ name: "下午景點" }, { name: "早上景點" }],
    itinerary: {
      "9/20": [
        { name: "下午景點", time: "14:00" },
        { type: "flight", flightId: "outbound", time: "09:30" },
        { name: "早上景點", time: "09:00" },
      ],
    },
  };
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", `const dateMeta = [["9/20", "週日"]]; const airportCoordinateCache = { KHH: { latitude: 22.57, longitude: 120.35 }, NRT: { latitude: 35.77, longitude: 140.39 } }; ${section}; return filteredMapPlaces;`)(state, (places) => places, () => true);
  assert.deepEqual(filteredMapPlaces().map(({ name, dayOrder, isAirport = false }) => [name, dayOrder, isAirport]), [
    ["下午景點", 1, false],
    ["高雄機場（KHH）", 2, true],
    ["成田機場（NRT）", 3, true],
    ["早上景點", 4, false],
  ]);
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
  assert.match(appSource, /class="time-wheel-picker"/);
  assert.match(appSource, /data-cancel-time/);
  assert.match(appSource, /data-confirm-time/);
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

test("map type filter uses the same attraction restaurant and lodging groups as the list", () => {
  const mapSection = sourceSection("function mapScreen", "function mapPinColor");
  assert.match(mapSection, /\["attraction", "景點"\]/);
  assert.match(mapSection, /\["restaurant", "餐廳"\]/);
  assert.match(mapSection, /\["lodging", "住宿"\]/);
  assert.doesNotMatch(mapSection, /data-map-category/);
  assert.match(mapSection, /data-map-kind/);
});

test("day map renders flight legs as red dashed route segments", () => {
  const routeSection = sourceSection("function mapRouteGroups", "function offsetOverlappingMapPins");
  const mapRouteSegments = new Function("state", "routeColorForDate", `${routeSection}; return mapRouteSegments;`)(
    { mapDate: "9/20" },
    () => "#123456",
  );
  const segments = mapRouteSegments([
    { name: "高雄機場", routeDate: "9/20", isAirport: true, flightId: "flight-1", airportRole: "departure" },
    { name: "成田機場", routeDate: "9/20", isAirport: true, flightId: "flight-1", airportRole: "arrival" },
    { name: "銀座", routeDate: "9/20" },
  ]);
  assert.equal(segments[0].isFlight, true);
  assert.equal(segments[1].isFlight, false);
  assert.match(appSource, /strokeColor: segment\.isFlight \? "#c8452d"/);
  assert.match(appSource, /dashArray: segment\.isFlight \? "10 9"/);
});

test("shared invite links prefill login and use the native share sheet", () => {
  assert.match(appSource, /URLSearchParams\(window\.location\.search\)\.get\("invite"\)/);
  assert.match(appSource, /name="inviteCode"/);
  assert.match(appSource, /navigator\.share/);
  assert.match(appSource, /navigator\.clipboard\.writeText/);
  assert.match(appSource, /id="empty-join-trip-form"/);
});

test("Google Maps search links keep their place query when checking duplicates", () => {
  const section = sourceSection("function normalizeGoogleMapsUrl", "function importAlreadyExists");
  const { normalizeGoogleMapsUrl, samePlaceIdentity } = new Function(`${section}; return { normalizeGoogleMapsUrl, samePlaceIdentity };`)();
  const firstUrl = "https://www.google.com/maps/search/?api=1&query=東京鐵塔";
  const secondUrl = "https://www.google.com/maps/search/?api=1&query=晴空塔";
  assert.notEqual(normalizeGoogleMapsUrl(firstUrl), normalizeGoogleMapsUrl(secondUrl));
  assert.equal(
    normalizeGoogleMapsUrl("https://maps.app.goo.gl/abc123?g_st=il"),
    normalizeGoogleMapsUrl("https://maps.app.goo.gl/abc123?g_st=ic"),
  );
  assert.equal(
    samePlaceIdentity({ name: "同名分店", sourceUrl: firstUrl }, { name: "同名分店", sourceUrl: secondUrl }),
    false,
  );
  assert.notEqual(
    normalizeGoogleMapsUrl("https://maps.google.com/?cid=15925741963762439993&g_mp=abc"),
    normalizeGoogleMapsUrl("https://maps.google.com/?cid=123456789&g_mp=abc"),
  );
});

test("leave trip is a compact action inside the account member sheet", () => {
  const overviewSection = sourceSection("function overviewScreen", "function placesScreen");
  const profileSection = sourceSection("function openProfileSheet", "function openTripsSheet");
  assert.doesNotMatch(overviewSection, /data-request-leave-trip/);
  assert.match(profileSection, /class="account-leave-button"/);
  assert.match(profileSection, /data-request-leave-trip/);
});

test("place import sheet stays fixed on iPhone and avoids focus zoom", () => {
  assert.match(stylesSource, /\.import-places-sheet\s*{[^}]*overflow:\s*hidden/s);
  assert.match(stylesSource, /\.import-places-sheet \.field select,\s*\.import-places-sheet \.field textarea\s*{[^}]*font-size:\s*16px/s);
  assert.match(stylesSource, /\.import-preview\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(appSource, /state\.placeKind = addedKinds\.length === 1 \? addedKinds\[0\] : "all"/);
});
