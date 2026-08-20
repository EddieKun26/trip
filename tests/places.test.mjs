import assert from "node:assert/strict";
import test from "node:test";

import placesHandler from "../api/places.mjs";

function responseMock() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("Google Places converts romanized areas to Chinese and keeps the local original", async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("places:searchText")) {
      return new Response(JSON.stringify({
        places: [{
          id: "test-place-id",
          displayName: { text: "測試景點" },
          addressComponents: [{ longText: "Ginza", types: ["neighborhood"] }],
          primaryTypeDisplayName: { text: "景點" },
          location: { latitude: 35.64, longitude: 139.71 },
          googleMapsUri: "https://www.google.com/maps/place/test",
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      addressComponents: [{ longText: "銀座", types: ["neighborhood"] }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "https://www.google.com/maps/search/?api=1&query=test", hintName: "測試景點" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.places[0].placeId, "test-place-id");
  assert.equal(response.payload.places[0].area, "銀座");
  assert.equal(response.payload.places[0].areaOriginal, "銀座");
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /languageCode=ja/);

  const airportResponse = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "", hintName: "KHH airport", globalSearch: true }] },
  }, airportResponse);
  const airportSearchBody = JSON.parse(calls[2].options.body);
  assert.equal(airportSearchBody.textQuery, "KHH airport");
  assert.equal("regionCode" in airportSearchBody, false);
  assert.equal("locationBias" in airportSearchBody, false);

  const listPlaceResponse = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "", hintName: "添食埊粒", globalSearch: true, latitude: 22.646195, longitude: 120.3021201 }] },
  }, listPlaceResponse);
  const listPlaceSearchBody = JSON.parse(calls[4].options.body);
  assert.deepEqual(listPlaceSearchBody.locationBias.circle.center, { latitude: 22.646195, longitude: 120.3021201 });
  assert.equal(listPlaceSearchBody.locationBias.circle.radius, 3000);
  assert.equal("regionCode" in listPlaceSearchBody, false);
});

test("coordinate-only Google Maps links become readable address locations", async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      status: "OK",
      results: [{
        place_id: "coordinate-address-okubo",
        formatted_address: "日本、〒169-0072 東京都新宿区大久保1丁目16-19",
        address_components: [{ long_name: "大久保", types: ["sublocality_level_2"] }],
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const sourceUrl = "https://www.google.com/maps/place/35%C2%B042'02.9%22N+139%C2%B042'09.7%22E/?entry=ttu";
  const response = responseMock();

  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl, hintName: "" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /maps\/api\/geocode\/json/);
  const [latitude, longitude] = new URL(calls[0]).searchParams.get("latlng").split(",").map(Number);
  assert.ok(Math.abs(latitude - 35.7008056) < 0.000001);
  assert.ok(Math.abs(longitude - 139.7026944) < 0.000001);
  assert.equal(response.payload.places[0].name, "地址位置｜東京都新宿区大久保1丁目16-19");
  assert.equal(response.payload.places[0].formattedAddress, "日本、〒169-0072 東京都新宿区大久保1丁目16-19");
  assert.equal(response.payload.places[0].coordinateLocation, true);
});
