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
});
