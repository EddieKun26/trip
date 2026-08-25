import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const vercelSource = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");

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
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", "ensureItineraryItemIds", "itineraryItemKey", `const dateMeta = [["9/20", "週日"]]; const airportCoordinateCache = { KHH: { latitude: 22.57, longitude: 120.35 }, NRT: { latitude: 35.77, longitude: 140.39 } }; ${section}; return filteredMapPlaces;`)(state, (places) => places, () => true, () => {}, (item) => item.id || (item.type === "flight" ? `flight:${item.flightId}` : `place:${item.name}`));
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
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", "ensureItineraryItemIds", "itineraryItemKey", `const dateMeta = [["9/20", "週日"], ["9/21", "週一"]]; ${section}; return filteredMapPlaces;`)(state, (places) => places, () => true, () => {}, (item) => item.id || `place:${item.name}`);
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
  const sortItineraryByTime = new Function("state", "reconcileTransportSegments", `${section}; return sortItineraryByTime;`)(state, () => {});
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

test("map type filter uses the same attraction restaurant lodging and shopping groups as the list", () => {
  const mapSection = sourceSection("function mapScreen", "function mapPinColor");
  assert.match(mapSection, /\["attraction", "景點"\]/);
  assert.match(mapSection, /\["restaurant", "餐廳"\]/);
  assert.match(mapSection, /\["lodging", "住宿"\]/);
  assert.match(mapSection, /\["shopping", "購物"\]/);
  assert.doesNotMatch(mapSection, /data-map-category/);
  assert.match(mapSection, /data-map-kind/);
});

test("map has a toggleable fullscreen workspace with a left filter and place list", () => {
  const mapSection = sourceSection("function mapScreen", "function mapPinColor");
  assert.match(mapSection, /data-toggle-map-fullscreen/);
  assert.match(mapSection, /map-fullscreen-sidebar/);
  assert.match(mapSection, /data-toggle-map-sidebar/);
  assert.match(mapSection, /data-focus-map-place/);
  assert.match(stylesSource, /body\.map-fullscreen-open \.phone\s*{[^}]*position:\s*fixed[^}]*width:\s*100vw[^}]*height:\s*100dvh/s);
  assert.match(stylesSource, /\.map-screen\.is-fullscreen\s*{[^}]*grid-template-columns:\s*286px minmax\(0, 1fr\)/s);
});

test("shopping places are recognized and available throughout place workflows", () => {
  const kindSection = sourceSection("function kindLabel", "function placesSegment");
  const classification = sourceSection("function inferPlaceKind", "function placeKindTabs");
  const { inferPlaceKind, normalizedPlaceKind } = new Function(`${classification}; return { inferPlaceKind, normalizedPlaceKind };`)();
  assert.match(kindSection, /shopping:\s*"購物"/);
  assert.match(kindSection, /服飾/);
  assert.equal(inferPlaceKind("運動鞋店"), "shopping");
  assert.equal(normalizedPlaceKind({ kind: "attraction", category: "服飾店" }), "shopping");
  assert.match(appSource, /<option value="shopping">購物<\/option>/);
  assert.match(appSource, /\["shopping", "購物"\]/);
  assert.match(stylesSource, /\.place-kind-tabs\s*{[^}]*repeat\(5, 1fr\)/s);
});

test("Japanese restaurant details show a Tabelog search button below the phone", () => {
  const section = sourceSection("function isWithinJapanCoordinates", "function placeKindTabs");
  const state = { destination: "首爾" };
  const { isJapaneseRestaurant, tabelogRestaurantUrl } = new Function("state", "normalizedPlaceKind", `${section}; return { isJapaneseRestaurant, tabelogRestaurantUrl };`)(
    state,
    (place) => place.kind,
  );
  const tokyoRestaurant = {
    name: "牛たんの檸檬",
    fullName: "牛たんの檸檬 新宿焼肉センター",
    area: "西新宿",
    kind: "restaurant",
    latitude: 35.69,
    longitude: 139.69,
  };
  assert.equal(isJapaneseRestaurant(tokyoRestaurant), true);
  assert.equal(isJapaneseRestaurant({ ...tokyoRestaurant, kind: "attraction" }), false);
  state.destination = "東京";
  assert.equal(isJapaneseRestaurant({ ...tokyoRestaurant, latitude: 37.56, longitude: 126.97 }), false);
  assert.equal(isJapaneseRestaurant({ ...tokyoRestaurant, latitude: null, longitude: null, formattedAddress: "日本、〒160-0023 東京都新宿区" }), true);
  const url = new URL(tabelogRestaurantUrl(tokyoRestaurant));
  assert.equal(url.hostname, "tabelog.com");
  assert.equal(url.searchParams.get("sk"), "牛たんの檸檬 新宿焼肉センター 西新宿");

  const details = sourceSection("function openPlaceSheet", "async function ensurePlaceDetails");
  assert.match(details, /<small>電話<\/small>[\s\S]*data-open-tabelog/);
  assert.match(details, /食べログ查看/);
  assert.match(appSource, /tabelogLink\.dataset\.openTabelog/);
  assert.match(stylesSource, /\.tabelog-navigation-button\s*\{[^}]*min-height:\s*44px/s);
});

test("planning map live location is private, optional, and cleaned up", () => {
  const locationSection = sourceSection("function liveLocationLabel", "function markerHtml");
  const payloadSection = sourceSection("function sharedTripPayload", "function applySharedTrip");
  const mapSection = sourceSection("function mapScreen", "function mapPinColor");
  assert.match(mapSection, /state\.mapView === "planning"[\s\S]*data-toggle-live-location/);
  assert.ok(mapSection.indexOf("data-toggle-live-location") < mapSection.indexOf('class="map-canvas"'));
  assert.match(locationSection, /navigator\.geolocation\.watchPosition/);
  assert.match(locationSection, /navigator\.geolocation\.clearWatch/);
  assert.match(locationSection, /new google\.maps\.Circle/);
  assert.match(locationSection, /L\.circleMarker/);
  assert.match(appSource, /window\.addEventListener\("pagehide", \(\) => stopLiveLocation\(\)\)/);
  assert.doesNotMatch(payloadSection, /liveLocation/);
  assert.match(stylesSource, /\.map-live-location-toggle\.active/);
  assert.doesNotMatch(stylesSource, /\.map-live-location-toggle\s*\{[^}]*position:\s*absolute/s);
});

test("day map renders flight legs as red dashed route segments", () => {
  const routeSection = sourceSection("function mapRouteGroups", "function offsetOverlappingMapPins");
  const mapRouteSegments = new Function("state", "routeColorForDate", "transportForPair", "transportModeMeta", `${routeSection}; return mapRouteSegments;`)(
    { mapDate: "9/20" },
    () => "#123456",
    () => null,
    () => ({ color: "#777", dash: "" }),
  );
  const segments = mapRouteSegments([
    { name: "高雄機場", routeDate: "9/20", isAirport: true, flightId: "flight-1", airportRole: "departure" },
    { name: "成田機場", routeDate: "9/20", isAirport: true, flightId: "flight-1", airportRole: "arrival" },
    { name: "銀座", routeDate: "9/20" },
  ]);
  assert.equal(segments[0].isFlight, true);
  assert.equal(segments[1].isFlight, false);
  assert.match(appSource, /if \(segment\.isFlight\) return \{ color: "#c8452d", dash: "10 9"/);
  assert.match(appSource, /dashArray: style\.dash \|\| undefined/);
});

test("transport segments use stable itinerary IDs and become review items after reordering", () => {
  const section = sourceSection("function itineraryItemKey", "function itineraryItemLabel");
  const state = {
    itinerary: {
      "9/20": [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
    },
    transports: [{ id: "t1", date: "9/20", fromItemId: "a", toItemId: "b" }],
    flights: [],
    places: [],
  };
  const reconcileTransportSegments = new Function("state", `${section}; return reconcileTransportSegments;`)(state);
  reconcileTransportSegments("9/20");
  assert.equal(state.transports[0].needsReview, false);
  state.itinerary["9/20"] = [state.itinerary["9/20"][0], state.itinerary["9/20"][2], state.itinerary["9/20"][1]];
  reconcileTransportSegments("9/20");
  assert.equal(state.transports[0].needsReview, true);
});

test("transport UI supports compact and scheduled cards, route links, members, and confirmed deletion", () => {
  assert.match(appSource, /function transportBetweenMarkup/);
  assert.match(appSource, /data-toggle-transport-ticket/);
  assert.match(appSource, /班次、票價與訂票連結需要時才展開/);
  assert.match(appSource, /function estimatedWalkingMinutes/);
  assert.match(appSource, /data-auto-duration/);
  assert.match(appSource, /name="travelers"/);
  assert.match(appSource, /data-open-transport-route/);
  assert.match(appSource, /data-request-delete-transport/);
  assert.match(appSource, /data-confirm-delete-transport/);
  assert.match(appSource, /交通待確認/);
  assert.match(stylesSource, /\.transport-sheet\s*{[^}]*overflow:\s*hidden/s);
  assert.match(stylesSource, /\.transport-sheet-body\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(stylesSource, /\.transport-sheet-body\s*{[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesSource, /\.transport-sheet \.field-grid\s*{[^}]*minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(stylesSource, /\.transport-sheet \.transport-time-grid\s*{[^}]*minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(stylesSource, /\.transport-sheet input\[type="time"\]\s*{[^}]*-webkit-appearance:\s*none/s);
  assert.match(stylesSource, /\.transport-sheet \.transport-time-grid input\[type="time"\]\s*{[^}]*font-size:\s*20px[^}]*text-align:\s*center/s);
  assert.match(stylesSource, /input\[type="time"\]::\-webkit-datetime-edit\s*{[^}]*align-items:\s*center[^}]*justify-content:\s*center/s);
  assert.doesNotMatch(stylesSource, /\.transport-sheet \.transport-time-grid \.field\s*{[^}]*overflow:\s*hidden/s);
  assert.match(appSource, /data-transport-validation/);
  assert.match(appSource, /data-transport-save/);
  assert.match(appSource, /document\.body\.classList\.add\("transport-sheet-open"\)/);
  assert.match(appSource, /document\.body\.classList\.remove\("transport-sheet-open"\)/);
});

test("overview is a decision dashboard and one-level undo is available", () => {
  const overviewSection = sourceSection("function overviewTripStatus", "function placesScreen");
  assert.match(overviewSection, /規劃完成度/);
  assert.match(overviewSection, /flightProgress \* 20/);
  assert.match(overviewSection, /itineraryProgress \* 40/);
  assert.match(overviewSection, /接下來處理/);
  assert.match(overviewSection, /overview-flight-section/);
  assert.match(overviewSection, /data-add-flight/);
  assert.match(appSource, /function reversibleTripSnapshot/);
  assert.match(appSource, /function restoreLastAction/);
  assert.match(appSource, /data-undo-last/);
  assert.match(stylesSource, /\.toast button/);
});

test("overview titles stay complete and undo is available across pages and edit sheets", () => {
  const titleRule = stylesSource.slice(stylesSource.indexOf(".overview-screen .trip-title-button h1"), stylesSource.indexOf(".overview-screen .subtitle"));
  assert.doesNotMatch(titleRule, /text-overflow:\s*ellipsis/);
  assert.match(titleRule, /white-space:\s*normal/);
  assert.match(appSource, /function decorateEditableSheetUndo/);
  assert.match(appSource, /sheetUndoObserver\.observe/);
  assert.match(appSource, /undoButtonMarkup\(\"overview-undo-button\"\)/);
  assert.match(appSource, /map-toolbar[\s\S]*undoButtonMarkup\(\)/);
  assert.match(appSource, /每日行程[\s\S]*undoButtonMarkup\(\)/);
});

test("place list keeps only the bottom add action and fully masks swipe deletion", () => {
  const placesSection = sourceSection("function placesScreen", "function kindLabel");
  assert.equal((placesSection.match(/data-add-place/g) || []).length, 1);
  assert.doesNotMatch(placesSection, /round-button/);
  assert.match(stylesSource, /\.place-thumb\s*{[^}]*border:\s*0/s);
  assert.match(stylesSource, /\.swipe-delete\s*{[^}]*visibility:\s*hidden/s);
  assert.match(stylesSource, /\.swipe-row\.delete-visible \.swipe-delete/);
  assert.match(stylesSource, /\.reaction-button\s*{[^}]*place-content:\s*center[^}]*place-items:\s*center/s);
});

test("place details opened from lists or maps offer confirmed deletion to editors", () => {
  const details = sourceSection("function openPlaceSheet", "async function ensurePlaceDetails");
  const confirmation = sourceSection("function openDeleteConfirmation", "function openMembershipConfirmation");
  assert.match(details, /place-detail-delete-button/);
  assert.match(details, /data-request-delete-place/);
  assert.match(details, /place\.kind === "lodging"[\s\S]*刪除這間住宿/);
  assert.match(details, /canEdit\(\) \? `<button class="place-detail-delete-button"/);
  assert.match(confirmation, /returnToDetails = false/);
  assert.match(confirmation, /data-return-place/);
  assert.match(appSource, /returnToDetails: Boolean\(requestPlaceDelete\.closest\("\.place-detail-sheet"\)\)/);
  assert.match(appSource, /if \(returnPlace\) return openPlaceSheet/);
  assert.match(stylesSource, /\.place-detail-delete-button\s*{[^}]*min-height:\s*44px[^}]*color:\s*#9d2e23/s);
});

test("day route lines terminate at pins and transport legend stays off the map", () => {
  const mapSection = sourceSection("function mapScreen", "function mapPinColor");
  assert.doesNotMatch(mapSection, /transportLegend|transport-route-legend/);
  assert.match(appSource, /state\.mapView === \"day\"\) return places\.map\(\(place\) => \(\{ \.\.\.place, pinOffsetX: 0, pinOffsetY: 0 \}\)\)/);
  assert.match(appSource, /iconAnchor: \[27 - \(place\.pinOffsetX \|\| 0\), 36 - \(place\.pinOffsetY \|\| 0\)\]/);
  assert.match(stylesSource, /\.google-html-marker\s*{[^}]*height:\s*36px/s);
  assert.match(stylesSource, /\.map-live-location-icon::before/);
  assert.match(stylesSource, /\.map-live-location-icon::after/);
});

test("the sticky place action is opaque and place notes avoid iPhone focus zoom", () => {
  assert.match(stylesSource, /\.list-footer\s*{[^}]*z-index:\s*12[^}]*background:\s*var\(--paper\)/s);
  assert.match(stylesSource, /\.place-note-card textarea\s*{[^}]*font-size:\s*16px/s);
});

test("transport timing must stay ordered and inside adjacent itinerary times", () => {
  const section = sourceSection("function clockMinutes", "function sortItineraryByTime");
  const state = { flights: [] };
  const validate = new Function("state", `${section}; return transportTimingError;`)(state);
  const pair = { from: { name: "A", time: "10:00" }, to: { name: "B", time: "11:00" } };

  assert.equal(validate(pair, { journeyType: "scheduled", departureTime: "10:30", arrivalTime: "10:20" }), "抵達時間必須晚於出發時間");
  assert.match(validate(pair, { journeyType: "scheduled", departureTime: "09:50" }), /不能早於/);
  assert.match(validate(pair, { journeyType: "scheduled", arrivalTime: "11:10" }), /不能晚於/);
  assert.match(validate(pair, { durationMinutes: "70" }), /不能超過前後行程間的 60 分鐘/);
  assert.match(validate(pair, { journeyType: "scheduled", departureTime: "10:20", arrivalTime: "10:50", durationMinutes: "40" }), /不能超過出發至抵達間的 30 分鐘/);
  assert.equal(validate(pair, { journeyType: "scheduled", departureTime: "10:20" }), "");
  assert.equal(validate(pair, { journeyType: "scheduled", departureTime: "10:20", arrivalTime: "10:50", durationMinutes: "30" }), "");
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

test("coordinate-only Google Maps links do not expose encoded coordinates as place names", () => {
  const section = sourceSection("function validMapCoordinates", "function inferPlaceArea");
  const { coordinatesFromGoogleMapsUrl, extractNameFromGoogleMapsUrl } = new Function(
    `${section}; return { coordinatesFromGoogleMapsUrl, extractNameFromGoogleMapsUrl };`,
  )();
  const mapsUrl = "https://www.google.com/maps/place/35%C2%B042'02.9%22N+139%C2%B042'09.7%22E/?entry=ttu";
  const coordinates = coordinatesFromGoogleMapsUrl(mapsUrl);

  assert.ok(Math.abs(coordinates.latitude - 35.7008056) < 0.000001);
  assert.ok(Math.abs(coordinates.longitude - 139.7026944) < 0.000001);
  assert.equal(extractNameFromGoogleMapsUrl(mapsUrl), "");
  const addressUrl = "https://www.google.com/maps/place/1-chome-16-19+Okubo/@35.7007763,139.7033787,7a/data=!4m15!8m2!3d35.7008698!4d139.7030542";
  assert.deepEqual(coordinatesFromGoogleMapsUrl(addressUrl), { latitude: 35.7008698, longitude: 139.7030542 });
  assert.equal(coordinatesFromGoogleMapsUrl("https://www.google.com/maps/search/?api=1&query=0,0"), null);
  assert.match(appSource, /class="import-location-preview"/);
  assert.match(appSource, /這是地址座標，不是住宿名稱/);
  assert.match(appSource, /地址資料 © OpenStreetMap contributors/);
  assert.match(stylesSource, /\.import-location-preview iframe\s*{[^}]*height:\s*190px/s);
});

test("place references hide misclassified Google Maps URLs and derive labels from trusted source hosts", () => {
  const section = sourceSection("function isGoogleMapsUrl", "function socialPlaceUrls");
  const { googleMapsNavigationUrl, placeReferenceMeta } = new Function(
    `${section}; return { googleMapsNavigationUrl, placeReferenceMeta };`,
  )();
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=東京鐵塔";

  assert.equal(placeReferenceMeta({ referenceUrl: mapsUrl, sourcePlatform: "Threads" }), null);
  assert.deepEqual(placeReferenceMeta({ referenceUrl: "https://www.threads.com/@traveler/post/ABC", sourcePlatform: "錯誤標籤" }), {
    url: "https://www.threads.com/@traveler/post/ABC",
    platform: "Threads",
  });
  assert.deepEqual(placeReferenceMeta({ referenceUrl: "https://www.booking.com/hotel/jp/example.html" }), {
    url: "https://www.booking.com/hotel/jp/example.html",
    platform: "Booking.com",
  });
  assert.equal(googleMapsNavigationUrl(mapsUrl), new URL(mapsUrl).toString());
  assert.equal(googleMapsNavigationUrl("https://example.com/not-maps"), "");
  assert.match(appSource, /if \(mapLink\) return openGoogleMaps\(mapLink\.dataset\.openMaps\)/);
  assert.match(appSource, /window\.location\.assign\(url\)/);
  assert.doesNotMatch(appSource, /window\.open\(mapLink\.dataset\.openMaps/);
});

test("Google Maps links navigate in place on phones and open a new tab on desktop", () => {
  const section = sourceSection("function isMobileNavigationDevice", "function socialPlaceUrls");
  const run = (userAgent, maxTouchPoints, openResult) => {
    const calls = { assigned: [], opened: [], replaced: [], closed: 0 };
    const defaultPopup = {
      opener: {},
      location: { replace: (url) => calls.replaced.push(url) },
      close: () => { calls.closed += 1; },
    };
    const popup = openResult === undefined ? defaultPopup : openResult;
    const openGoogleMaps = new Function(
      "navigator", "window", "googleMapsNavigationUrl", "showToast",
      `${section}; return openGoogleMaps;`,
    )(
      { userAgent, maxTouchPoints },
      {
        location: { assign: (url) => calls.assigned.push(url) },
        open: (url, target, features) => { calls.opened.push([url, target, features]); return popup; },
      },
      (value) => value,
      () => {},
    );
    openGoogleMaps("https://www.google.com/maps/search/?api=1&query=東京鐵塔");
    return calls;
  };
  const iphone = run("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5);
  assert.equal(iphone.assigned.length, 1);
  assert.equal(iphone.opened.length, 0);
  const ipadDesktopUa = run("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5);
  assert.equal(ipadDesktopUa.assigned.length, 1);
  assert.equal(ipadDesktopUa.opened.length, 0);
  const desktop = run("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0);
  assert.equal(desktop.assigned.length, 0);
  assert.deepEqual(desktop.opened[0], ["about:blank", "_blank", undefined]);
  assert.deepEqual(desktop.replaced, ["https://www.google.com/maps/search/?api=1&query=東京鐵塔"]);
  const blockedPopup = run("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0, null);
  assert.equal(blockedPopup.opened.length, 1);
  assert.equal(blockedPopup.assigned.length, 1, "a blocked popup must fall back to same-tab navigation");
  const failedPopup = {
    opener: {},
    location: { replace: () => { throw new Error("navigation failed"); } },
    close() { this.closed = true; },
  };
  const failedNavigation = run("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0, failedPopup);
  assert.equal(failedPopup.opener, null, "the opened tab must not retain access to the app window");
  assert.equal(failedPopup.closed, true);
  assert.equal(failedNavigation.assigned.length, 1, "a failed new-tab navigation must fall back to the app tab");
  assert.match(appSource, /if \(place\.isAirport\) return openGoogleMaps\(place\.sourceUrl\)/);
  assert.match(appSource, /const url = transportDirectionsUrl\(segment\.transport\);\s*if \(url\) openGoogleMaps\(url\)/);
  assert.match(appSource, /return url \? openGoogleMaps\(url\) : showToast\("請先補上交通起點與終點"\)/);
});

test("a Google Maps shared-list title followed by its URL is one import candidate", () => {
  const section = sourceSection("function googleMapsImportCandidates", "function parseGoogleMapsList");
  const googleMapsImportCandidates = new Function("isGoogleMapsUrl", "isSocialPlaceUrl", `${section}; return googleMapsImportCandidates;`)(
    (value) => /(?:google\.com\/maps|maps\.app\.goo\.gl)/.test(value),
    (value) => /booking\.com/.test(value),
  );
  const candidates = googleMapsImportCandidates("高雄合菜 · Eddie\nhttps://maps.app.goo.gl/RbuDr1WSBJHoquGi8?g_st=i");
  assert.deepEqual(candidates, [{
    label: "高雄合菜 · Eddie",
    url: "https://maps.app.goo.gl/RbuDr1WSBJHoquGi8?g_st=i",
  }]);
  const lodgingContext = googleMapsImportCandidates("1、公寓名称：自由之家\n2、公寓地址：东京 新宿区 大久保 1 丁目 16-19 -169-0072\n3、地图链接：https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8\nhttps://www.booking.com/hotel/jp/liberty-stay.html");
  assert.equal(lodgingContext.length, 1);
  assert.equal(lodgingContext[0].url, "https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8");
});

test("explicit lodging name address map and Booking evidence merge into one candidate", () => {
  const section = sourceSection("function explicitLodgingDetailsFromText", "function samePlaceIdentity");
  const mergeLodgingMapEvidence = new Function(
    "socialPlaceUrls",
    "isLodgingShareUrl",
    "isGoogleMapsUrl",
    "validMapCoordinates",
    "importAlreadyExists",
    `${section}; return mergeLodgingMapEvidence;`,
  )(
    (value) => String(value).match(/https:\/\/www\.booking\.com\/[^\s]+/g) || [],
    (value) => /booking\.com/.test(value),
    (value) => /google\.com|maps\.app\.goo\.gl/.test(value),
    (latitude, longitude) => Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0),
    () => false,
  );
  const sourceText = "1、公寓名称：自由之家\n2、公寓地址：东京 新宿区 大久保 1 丁目 16-19 -169-0072\n3、地图链接：https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8\nhttps://www.booking.com/hotel/jp/liberty-stay.html";
  const merged = mergeLodgingMapEvidence([{
    name: "1-chome-16-19 Okubo",
    formattedAddress: "〒169-0072 東京都新宿区大久保1丁目16-19",
    sourceUrl: "https://www.google.com/maps/place/address",
    latitude: 35.7008698,
    longitude: 139.7030542,
    canImport: true,
  }, {
    name: "自由之家(Liberty Stay)",
    formattedAddress: "〒169-0072 東京都新宿区大久保1丁目16-19",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=address",
    referenceUrl: "https://www.booking.com/hotel/jp/liberty-stay.html",
    latitude: 35.7008,
    longitude: 139.703,
    kind: "lodging",
    isSocialCandidate: true,
    candidateGroupId: "social-1",
    selected: true,
  }], sourceText);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].name, "自由之家");
  assert.equal(merged[0].latitude, 35.7008698);
  assert.equal(merged[0].referenceUrl, "https://www.booking.com/hotel/jp/liberty-stay.html");
  assert.equal(merged[0].coordinateFallback, true);
});

test("shared-list imports expand before Places enrichment and support global chunks", () => {
  assert.match(appSource, /fetch\("\/api\/place-list"/);
  assert.match(appSource, /expandGoogleMapsSharedLists\(pendingPlaceImports\)/);
  assert.match(appSource, /globalSearch: place\.globalSearch === true \|\| place\.recognition === "unresolved"/);
  assert.match(appSource, /latitude: place\.latitude/);
  assert.match(appSource, /longitude: place\.longitude/);
  assert.match(appSource, /targets\.length \/ 10/);
  assert.match(appSource, /inferPlaceCategory\(`\$\{result\.title \|\| ""\} \$\{name\}`\)/);
});

test("a single short Google Maps link remains importable after list detection", () => {
  assert.match(appSource, /const canImport = Boolean\(parsedName \|\| normalizeGoogleMapsUrl\(url\)\)/);
  assert.match(appSource, /place\?\.recognition !== "unresolved"/);
  const section = sourceSection("function promoteSinglePlaceImport", "async function expandGoogleMapsSharedLists");
  const promoteSinglePlaceImport = new Function(
    "extractNameFromGoogleMapsUrl",
    "inferPlaceCategory",
    "inferPlaceKind",
    "inferPlaceArea",
    "importAlreadyExists",
    `${section}; return promoteSinglePlaceImport;`,
  )(
    (value) => new URL(value).searchParams.get("q") || "",
    () => "博物館／美術館",
    () => "attraction",
    () => "豐洲",
    () => false,
  );
  const promoted = promoteSinglePlaceImport({
    name: "正在辨識 Google Maps 地點",
    sourceUrl: "https://maps.app.goo.gl/single-place",
    recognition: "unresolved",
    canImport: true,
  }, {
    requestUrl: "https://maps.app.goo.gl/single-place",
    expandedUrl: "https://www.google.com/maps?q=teamLab+Planets+TOKYO+DMM",
    isList: false,
  });

  assert.equal(promoted.name, "teamLab Planets TOKYO DMM");
  assert.equal(promoted.recognition, "partial");
  assert.equal(promoted.canImport, true);
  assert.equal(promoted.globalSearch, true);
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
  assert.match(stylesSource, /\.import-places-sheet \.field textarea\s*{[^}]*min-height:\s*56px[^}]*max-height:\s*56px/s);
  assert.match(stylesSource, /\.import-preview\s*{[^}]*overflow-y:\s*scroll[^}]*touch-action:\s*pan-y/s);
  assert.match(appSource, /state\.placeKind = addedKinds\.length === 1 \? addedKinds\[0\] : "all"/);
  assert.match(appSource, /<h2>新增地點<\/h2>/);
  assert.doesNotMatch(appSource, /<h2>一次新增多個景點<\/h2>/);
  assert.doesNotMatch(appSource, /新增飯店或民宿時可直接選擇/);
  assert.doesNotMatch(appSource, /連結和截圖可擇一使用/);
});

test("place import accepts social links with a confirmation-only Google candidate flow", () => {
  assert.match(appSource, /fetch\("\/api\/social-place-import"/);
  assert.match(appSource, /Agoda、Booking\.com、Airbnb 或社群連結/);
  assert.match(appSource, /data-social-place-screenshot/);
  assert.match(appSource, /截圖／照片/);
  assert.doesNotMatch(appSource, /id="social-share-text"/);
  assert.doesNotMatch(appSource, /data-social-import-fallback/);
  assert.match(appSource, /data-social-place-candidate/);
  assert.match(appSource, /data-preview-import-candidate/);
  assert.match(appSource, /data-select-import-candidate/);
  assert.match(appSource, /<article class="import-place-row[^`]*\$\{previewTarget\}/s);
  assert.match(appSource, /previewImportCandidate && !clickedCandidateRadio/);
  assert.match(appSource, /function openImportCandidatePreview/);
  assert.match(appSource, /\/api\/place-photo\?name=/);
  assert.match(appSource, /place\.selected === true/);
  assert.match(appSource, /referenceUrl/);
  assert.match(appSource, /data-open-reference/);
  assert.match(stylesSource, /\.import-place-row\.social-candidate\s*{[^}]*grid-template-columns:\s*20px 36px minmax\(0, 1fr\) auto/s);
  assert.match(stylesSource, /\.import-candidate-backdrop\s*{[^}]*z-index:\s*130/s);
  assert.match(stylesSource, /\.import-candidate-sheet\s*{[^}]*max-height:\s*88dvh[^}]*overflow-y:\s*auto/s);
  assert.match(stylesSource, /\.social-screenshot-picker-standalone\s*{/);
  assert.match(appSource, /place\.coordinateFallback \? `<p class="coordinate-fallback-notice"/);
  assert.match(stylesSource, /\.coordinate-fallback-notice\s*{/);
  assert.match(appSource, /function mergeLodgingMapEvidence/);
  assert.match(appSource, /textarea\.value,\s*sourceIndex === 0 \? pendingPlaceImportScreenshot/s);
  assert.match(stylesSource, /\.icon-button\s*{[^}]*flex:\s*0 0 40px;[^}]*aspect-ratio:\s*1;/s);
  assert.doesNotMatch(stylesSource, /\.social-import-fallback\s*{/);
});

test("social place import distinguishes recognized places from Google candidate rows", () => {
  assert.match(appSource, /function socialImportStats/);
  assert.match(appSource, /辨識到 \$\{socialStats\.groupCount\} 個地點/);
  assert.match(appSource, /共 \$\{socialStats\.candidateCount\} 筆 Google Maps 配對候選/);
  assert.match(appSource, /每個地點都可重搜或略過/);
  assert.match(appSource, /加入全部 \$\{addableCount\} 個地點/);
  assert.match(appSource, /class="import-candidate-group-label/);
  assert.match(stylesSource, /\.import-group-summary\s*{/);
  assert.match(stylesSource, /\.import-candidate-group-label\s*{/);
});

test("social candidate groups can compare original text and relevant source images", () => {
  assert.match(appSource, /sourceOriginalText: payload\.source\?\.originalText/);
  assert.match(appSource, /sourceOriginalImages/);
  assert.match(appSource, /function openImportSourcePreview/);
  assert.match(appSource, /function openImportSourceImagePreview/);
  assert.match(appSource, /data-preview-import-source=/);
  assert.match(appSource, /data-preview-import-source-image=/);
  assert.match(appSource, /查看原文／原圖，比對這個候選/);
  assert.match(appSource, /原文敘述/);
  assert.match(appSource, /AI 辨識線索/);
  assert.match(appSource, /開啟完整.*連結/);
  assert.match(appSource, /sourceOriginalText, sourceOriginalImages, sourceImageIndexes/);
  assert.match(stylesSource, /\.import-source-backdrop\s*{[^}]*z-index:\s*145/s);
  assert.match(stylesSource, /\.import-source-image-backdrop\s*{[^}]*z-index:\s*155/s);
});

test("each social place group can be rematched or skipped without forcing a wrong candidate", () => {
  assert.match(appSource, /action: "rematch"/);
  assert.match(appSource, /function openImportRematchSheet/);
  assert.match(appSource, /function rematchImportCandidateGroup/);
  assert.match(appSource, /data-rematch-import-group=/);
  assert.match(appSource, /data-skip-import-group=/);
  assert.match(appSource, /略過不加/);
  assert.match(appSource, /不必從錯誤候選中選擇/);
  assert.match(appSource, /candidateGroupSkipped/);
  assert.match(appSource, /加入其餘 \$\{addableCount\} 個地點/);
  assert.match(stylesSource, /\.import-candidate-group-actions\s*{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(stylesSource, /\.import-rematch-backdrop\s*{[^}]*z-index:\s*145/s);
  assert.match(stylesSource, /\.import-rematch-sheet input\s*{[^}]*font-size:\s*16px/s);
});

test("deployed frontend revalidates assets and refreshes long-lived tabs", () => {
  assert.match(indexSource, /styles\.css\?v=\d{8}\.\d+/);
  assert.match(indexSource, /app\.js\?v=\d{8}\.\d+/);
  assert.match(vercelSource, /"source": "\/app\.js"[\s\S]*"value": "[^"]*max-age=0, must-revalidate"/);
  assert.match(vercelSource, /"source": "\/"[\s\S]*"no-cache, no-store, must-revalidate"/);
  assert.match(appSource, /function checkForAppUpdate/);
  assert.match(appSource, /method: "HEAD", cache: "no-store"/);
  assert.match(appSource, /window\.addEventListener\("pageshow"/);
  assert.match(appSource, /document\.addEventListener\("visibilitychange"/);
});

test("the App ships its own icons and map library instead of relying on a public CDN", () => {
  const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
  const iconSizes = manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose}`);
  assert.ok(iconSizes.includes("192x192 any"), "home-screen installs need a 192px icon");
  assert.ok(iconSizes.includes("512x512 any"));
  assert.ok(iconSizes.includes("512x512 maskable"), "Android adaptive icons need a maskable variant");
  for (const icon of manifest.icons) {
    const bytes = readFileSync(new URL(`../${icon.src.replace("./", "")}`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 4)], [137, 80, 78, 71], `${icon.src} must be a real PNG`);
  }
  assert.match(indexSource, /rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png"/);
  assert.match(indexSource, /href="\.\/vendor\/leaflet\/leaflet\.css"/);
  assert.match(indexSource, /src="\.\/vendor\/leaflet\/leaflet\.js"/);
  assert.doesNotMatch(indexSource, /unpkg\.com/, "the map library must not load from a third-party CDN");
  const leaflet = readFileSync(new URL("../vendor/leaflet/leaflet.js", import.meta.url), "utf8");
  assert.match(leaflet.slice(0, 200), /Leaflet 1\.9\.4/);
  assert.match(vercelSource, /"source": "\/vendor\/\(\.\*\)"[\s\S]*immutable/);
});

test("tab-bar uses meaningful accessible travel icons and lodging imports explain the booking-site limitation", () => {
  const tabIcons = [...indexSource.matchAll(/<span class="tab-icon"([^>]*)>[\s\S]*?<\/span>/g)];
  assert.equal(tabIcons.length, 4);
  for (const [markup, attributes] of tabIcons) {
    assert.match(attributes, /aria-hidden="true"/, "decorative glyphs must not be announced by VoiceOver");
    assert.match(markup, /<svg[^>]*viewBox="0 0 24 24"/, "each tab must use one consistent vector icon family");
  }
  assert.doesNotMatch(indexSource, /[◇●□▱]/, "abstract geometric tab glyphs must not return");
  assert.match(indexSource, /data-tab="overview" aria-current="page"/);
  assert.match(stylesSource, /\.tab\.active \.tab-icon\s*{[^}]*background:\s*var\(--accent\)/s);
  assert.match(appSource, /function syncTabBarState\(\)[\s\S]*setAttribute\("aria-current", "page"\)/);
  assert.match(appSource, /class="field-hint">訂房平台常擋住自動讀取/);
  assert.match(stylesSource, /\.field-hint\s*{[^}]*color:\s*var\(--muted\)/s);
});

test("flight form offers city-aware airports and creates round trips as two legs", () => {
  const section = sourceSection("const flightAirportCatalog", "function itineraryItemKey");
  const { airportsForCity, airportOptionsMarkup, parseFlightTicketText } = new Function(
    "escapeHtml",
    `${section}; return { airportsForCity, airportOptionsMarkup, parseFlightTicketText };`,
  )((value) => String(value));

  assert.deepEqual(airportsForCity("高雄").map((airport) => airport.code), ["KHH"]);
  assert.deepEqual(airportsForCity("東京").map((airport) => airport.code), ["NRT", "HND"]);
  assert.match(airportOptionsMarkup("高雄"), /value="KHH" selected/);
  assert.match(appSource, /<option>來回<\/option>/);
  assert.doesNotMatch(sourceSection("function openFlightSheet", "function openTransportSheet"), /<option[^>]*>其他<\/option>/);
  assert.match(appSource, /direction: "去程"/);
  assert.match(appSource, /direction: "回程"/);
  assert.match(appSource, /departureCity: baseFlight\.arrivalCity/);
  assert.match(appSource, /arrivalCity: baseFlight\.departureCity/);

  const parsed = parseFlightTicketText(
    "KHH NRT 20 SEP 2026 09:55 14:45 NRT KHH 26 SEP 2026 17:50 21:00",
    { startDate: "2026-09-20", endDate: "2026-09-26" },
  );
  assert.equal(parsed.isRoundTrip, true);
  assert.equal(parsed.fields.departureCode, "KHH");
  assert.equal(parsed.fields.arrivalCode, "NRT");
  assert.equal(parsed.fields.departureDate, "2026-09-20");
  assert.equal(parsed.fields.returnDepartureDate, "2026-09-26");
  assert.equal(parsed.fields.departureTime, "09:55");
  assert.equal(parsed.fields.returnArrivalTime, "21:00");
});

test("flight and itinerary time fields fit and center on iPhone", () => {
  assert.match(stylesSource, /\.timeline-item\s*{[^}]*grid-template-columns:\s*72px minmax\(0, 1fr\) auto/s);
  assert.match(stylesSource, /\.time-button\s*{[^}]*width:\s*72px[^}]*place-items:\s*center/s);
  assert.match(stylesSource, /\.flight-date-time-grid\s*{[^}]*minmax\(0, 1\.45fr\) minmax\(118px, \.85fr\)/s);
  assert.match(stylesSource, /\.flight-form-grid\s*{[^}]*minmax\(0, \.78fr\) minmax\(0, 1\.22fr\)/s);
  assert.match(stylesSource, /\.flight-native-control span\s*{[^}]*display:\s*grid[^}]*place-items:\s*center[^}]*line-height:\s*1/s);
  assert.match(appSource, /data-flight-native-display/);
});

test("overview flight cards keep direction left and passenger note vertically centered", () => {
  const section = sourceSection("function flightMarkup", "function overviewTripStatus");
  assert.match(section, /flight-direction-badge/);
  assert.match(section, /departure-airport/);
  assert.match(section, /arrival-airport/);
  assert.match(stylesSource, /\.flight-leg\s*{[^}]*grid-template-areas:[^}]*"direction departure arrow arrival"[^}]*"direction travelers travelers travelers"/s);
  assert.match(stylesSource, /\.flight-travelers\s*{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*font-size:\s*13px/s);
});

test("flight ticket images are recognized locally and used to prefill the form", () => {
  const section = sourceSection("function openFlightSheet", "function openTransportSheet");
  assert.match(section, /type="file" accept="image\/\*" data-flight-ticket-input/);
  assert.match(section, /照片只在此裝置辨識，不會儲存或分享/);
  assert.match(appSource, /tesseract\.js@5\/dist\/tesseract\.min\.js/);
  assert.match(appSource, /worker\.recognize\(file\)/);
  assert.match(appSource, /applyFlightTicketData\(form, parsed\)/);
});

test("place import placeholder is neutral", () => {
  const section = sourceSection("function openAddPlaceSheet", "function openDateSheet");
  assert.doesNotMatch(section, /高雄合菜 · Eddie/);
  assert.match(section, /Google Maps、Agoda、Booking\.com、Airbnb 或社群連結/);
});

test("shopping is a fourth private tab with categories reusable tags and completion state", () => {
  assert.match(indexSource, /data-tab="shopping"[\s\S]*購物/);
  assert.match(stylesSource, /\.tab-bar\s*{[^}]*grid-template-columns:\s*repeat\(4, 1fr\)/s);
  const screen = sourceSection("function shoppingScreen", "function shoppingTagOptions");
  assert.match(screen, /只有你看得到/);
  assert.match(screen, /data-shopping-category/);
  assert.match(screen, /data-shopping-status/);
  assert.match(appSource, /data-toggle-shopping-item/);
  assert.match(appSource, /defaultShoppingCategories[\s\S]*伴手禮[\s\S]*家電[\s\S]*日常[\s\S]*藥品[\s\S]*保養品/);
  assert.match(appSource, /name="recipientTag"/);
  assert.match(appSource, /newTags/);
  assert.match(appSource, /newCategory/);
  assert.match(stylesSource, /\.shopping-form-sheet \.field input,[\s\S]*font-size:\s*16px/s);
});

test("shopping screenshots use server-side multilingual vision AI", () => {
  const sharedPayload = sourceSection("function sharedTripPayload", "function applySharedTrip");
  assert.doesNotMatch(sharedPayload, /shopping/);
  assert.match(appSource, /fetch\(`\/api\/shopping\?tripId=/);
  assert.match(appSource, /fetch\("\/api\/shopping-recognize"/);
  assert.doesNotMatch(appSource, /parseShoppingScreenshotDetails/);
  assert.doesNotMatch(appSource, /Tesseract\.createWorker\(\["eng", "chi_tra", "jpn"\]/);
  assert.match(appSource, /AI 已理解/);
  assert.match(appSource, /compressShoppingScreenshot/);
  assert.match(appSource, /shoppingPhoto\(item\.photoId\)/);
});

test("shopping supports left-swipe deletion, batch deletion, and clearer stored photos", () => {
  const screen = sourceSection("function shoppingItemMarkup", "function shoppingTagOptions");
  assert.match(screen, /class="swipe-row shopping-swipe-row/);
  assert.match(screen, /data-swipe-item="shopping:/);
  assert.match(screen, /data-request-delete-shopping/);
  assert.match(screen, /data-toggle-shopping-selection/);
  assert.match(screen, /data-select-all-shopping/);
  assert.match(screen, /data-request-delete-shopping-batch/);
  assert.match(appSource, /data-confirm-delete-shopping-batch/);
  assert.match(stylesSource, /\.shopping-item\.selected/);
  assert.match(stylesSource, /\.shopping-list-tools/);
  assert.ok(screen.indexOf("shopping-list-tools") < screen.indexOf('<div class="shopping-list">'));
  assert.match(appSource, /drawAtMaxEdge\(1600\)/);
  assert.match(appSource, /dataUrl\.length > 480000/);
  assert.match(stylesSource, /\.shopping-detail-photo\s*{[^}]*object-fit:\s*contain/s);
});

test("shopping detail uses the selected web product photo and readable annotations", () => {
  const detail = sourceSection("function openShoppingDetailSheet", "function openShoppingItemSheet");
  assert.match(detail, /原始推薦截圖/);
  assert.match(detail, /你從網路候選圖片中選擇的商品圖/);
  assert.match(detail, /搜尋商品資料與圖片/);
  assert.match(detail, /shopping-ai-product-photo/);
  assert.doesNotMatch(detail, /data-set-shopping-product-image/);
  assert.doesNotMatch(detail, /查看來源/);
  assert.doesNotMatch(detail, /data-shopping-product-photo-input/);
  assert.doesNotMatch(detail, /新增照片/);
  assert.match(detail, /data-research-shopping-item/);
  assert.doesNotMatch(detail, /採買參考/);
  assert.match(detail, /請以產品標示及醫師、藥師建議為準/);
  assert.match(appSource, /fetch\("\/api\/shopping-research"/);
  assert.match(appSource, /shoppingPreferredPhoto\(item\)/);
  assert.match(appSource, /shoppingAiProductImages\(item\)/);
  assert.match(appSource, /compressAiProductImage/);
  assert.match(appSource, /data:image\\\/\(\?:jpeg\|png\|webp\);base64/);
  assert.match(stylesSource, /\.shopping-ai-product-photo img\s*{[^}]*max-height:\s*310px/s);
  assert.match(stylesSource, /\.shopping-detail-backdrop\s*{[^}]*align-items:\s*center/s);
  assert.match(stylesSource, /\.shopping-ai-annotation/);
});

test("shopping import offers three web product-photo candidates and can refresh the batch", () => {
  const importer = sourceSection("function syncPendingShoppingImportEdits", "function itineraryScreen");
  assert.match(importer, /type="file" accept="image\/\*" multiple/);
  assert.match(appSource, /SHOPPING_IMPORT_MAX_FILES = 12/);
  assert.match(importer, /data-max-files="\$\{SHOPPING_IMPORT_MAX_FILES\}"/);
  assert.match(importer, /selectedFiles\.length > SHOPPING_IMPORT_MAX_FILES/);
  assert.match(importer, /input\.value = ""/);
  assert.match(importer, /data-import-brand/);
  assert.match(importer, /data-import-name/);
  assert.match(importer, /data-import-benefits/);
  assert.match(importer, /data-import-category/);
  assert.match(importer, /entry\.annotation = result\.annotation/);
  assert.match(importer, /result\.annotation\?\.productImages/);
  assert.match(importer, /slice\(0, 3\)/);
  assert.match(importer, /data-import-product-image/);
  assert.match(importer, /data-preview-shopping-image/);
  assert.match(importer, /function openShoppingImagePreview/);
  assert.match(importer, /data-step-shopping-image-preview/);
  assert.match(importer, /data-select-shopping-image-preview/);
  assert.match(importer, /data-refresh-shopping-images/);
  assert.match(importer, /fetch\("\/api\/shopping-images"/);
  assert.match(importer, /換一批圖片/);
  assert.match(importer, /shopping-import-image-options/);
  assert.match(importer, /Promise\.all\(entries\.map\(async \(entry\)/);
  assert.match(importer, /AI 正在同時辨識/);
  assert.match(importer, /shoppingImportProgressMarkup/);
  assert.match(importer, /recognitionStage = "recognizing"/);
  assert.match(importer, /recognitionStage = "complete"/);
  assert.match(importer, /toDataURL\("image\/jpeg"/);
  assert.doesNotMatch(importer, /for \(let currentIndex = 0; currentIndex < pendingShoppingImports\.length/);
  assert.doesNotMatch(appSource, /OPENAI_IMAGE_403|API 組織驗證|AI 純白商品圖/);
  assert.match(importer, /shopping-original-screenshot/);
  assert.match(stylesSource, /\.shopping-import-fields\s*{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(stylesSource, /\.shopping-import-image-options\s*{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(stylesSource, /\.shopping-image-preview-backdrop\s*{[^}]*place-items:\s*center/s);
  assert.match(stylesSource, /\.shopping-image-preview-stage img\s*{[^}]*max-height:\s*58dvh/s);
  assert.match(stylesSource, /\.shopping-import-item-progress\[data-stage="recognizing"\] i::before/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
});

test("shopping categories and recipient filters can be managed from the list and forms", () => {
  const screen = sourceSection("function shoppingScreen", "function openShoppingDetailSheet");
  assert.match(screen, /shopping-recipient-filter/);
  assert.match(screen, /data-shopping-recipient/);
  assert.match(screen, /已買/);
  assert.match(screen, /未買/);
  assert.match(screen, /data-remove-shopping-tag/);
  assert.match(screen, /__custom__/);
  assert.match(appSource, /data-confirm-delete-shopping-category/);
  assert.match(appSource, /data-shopping-category-select/);
  assert.match(stylesSource, /\.shopping-tag-option-row > button/);
  assert.match(stylesSource, /\.shopping-custom-category-field\[hidden\]/);
});
