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

test("Google Places groups a Jingumae shop under Shibuya ward instead of its neighborhood", async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("places:searchText")) {
      return new Response(JSON.stringify({
        places: [{
          id: "test-place-id",
          displayName: { text: "測試景點" },
          addressComponents: [
            { longText: "Jingumae", types: ["neighborhood"] },
            { longText: "Shibuya", types: ["locality"] },
            { longText: "Japan", shortText: "JP", types: ["country"] },
          ],
          primaryTypeDisplayName: { text: "景點" },
          location: { latitude: 35.64, longitude: 139.71 },
          googleMapsUri: "https://www.google.com/maps/place/test",
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      results: [{ address_components: [
        { long_name: "神宮前", types: ["neighborhood"] },
        { long_name: "渋谷区", types: ["locality"] },
      ] }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "https://www.google.com/maps/search/?api=1&query=test", hintName: "測試景點" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.places[0].placeId, "test-place-id");
  assert.equal(response.payload.places[0].area, "澀谷區");
  assert.equal(response.payload.places[0].areaOriginal, "渋谷区");
  assert.equal(response.payload.places[0].areaResolutionVersion, 2);
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /maps\/api\/geocode\/json/);
  assert.equal(new URL(calls[1].url).searchParams.get("language"), "ja");

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
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("maps.googleapis.com")) {
      return new Response(JSON.stringify({ status: "REQUEST_DENIED", results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      place_id: 12345,
      display_name: "日本、〒169-0072 東京都新宿区大久保1丁目16-19",
      address: { neighbourhood: "大久保", postcode: "169-0072", country_code: "jp" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const sourceUrl = "https://www.google.com/maps/place/35%C2%B042'02.9%22N+139%C2%B042'09.7%22E/?entry=ttu";
  const response = responseMock();

  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl, hintName: "" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /maps\/api\/geocode\/json/);
  const [latitude, longitude] = new URL(calls[0].url).searchParams.get("latlng").split(",").map(Number);
  assert.ok(Math.abs(latitude - 35.7008056) < 0.000001);
  assert.ok(Math.abs(longitude - 139.7026944) < 0.000001);
  assert.match(calls[1].url, /maps\/api\/geocode\/json/);
  assert.equal(new URL(calls[1].url).searchParams.has("language"), false);
  assert.match(calls[2].url, /nominatim\.openstreetmap\.org\/reverse/);
  assert.match(calls[2].options.headers["User-Agent"], /trip-eddie23\.vercel\.app/);
  assert.equal(response.payload.places[0].name, "地址位置｜東京都新宿区大久保1丁目16-19");
  assert.equal(response.payload.places[0].formattedAddress, "日本、〒169-0072 東京都新宿区大久保1丁目16-19");
  assert.equal(response.payload.places[0].coordinateLocation, true);
  assert.equal(response.payload.places[0].addressProvider, "OpenStreetMap");
});

test("manual lodging addresses are geocoded directly instead of matched to a nearby business", async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const language = new URL(String(url)).searchParams.get("language");
    const isJapanese = language === "ja";
    return new Response(JSON.stringify({
      results: [{
        place_id: "exact-address-id",
        formatted_address: isJapanese ? "日本、〒251-0032 神奈川県藤沢市片瀬3丁目8-12" : "日本神奈川縣藤澤市片瀨 3 丁目 8-12",
        address_components: [
          { long_name: isJapanese ? "片瀬" : "片瀨", types: ["neighborhood"] },
          { long_name: isJapanese ? "藤沢市" : "藤澤市", types: ["locality"] },
          { long_name: isJapanese ? "日本" : "日本", short_name: "JP", types: ["country"] },
        ],
        geometry: { location: { lat: 35.3131, lng: 139.4872 } },
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const response = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{
      sourceUrl: "https://maps.app.goo.gl/iXpNE6SznKgZD4Kq5",
      manualAddress: "神奈川縣藤澤市片瀨3-8-12",
    }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((url) => url.includes("maps/api/geocode/json")));
  assert.equal(new URL(calls[0]).searchParams.get("language"), "zh-TW");
  assert.equal(new URL(calls[1]).searchParams.get("language"), "ja");
  assert.equal(calls.every((url) => !new URL(url).searchParams.has("region")), true);
  assert.equal(response.payload.places[0].placeId, "exact-address-id");
  assert.equal(response.payload.places[0].area, "藤澤市");
  assert.equal(response.payload.places[0].areaOriginal, "藤沢市");
  assert.equal(response.payload.places[0].latitude, 35.3131);
  assert.equal(response.payload.places[0].longitude, 139.4872);
  assert.equal(response.payload.places[0].manualLocation, true);
  assert.equal(response.payload.places[0].areaResolvedByGoogle, true);
  assert.equal(response.payload.places[0].googleMapsUrl, "https://maps.app.goo.gl/iXpNE6SznKgZD4Kq5");
});

test("stored areas are relocalized from Google address components across writing systems", async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    calls.push(requestUrl);
    const language = requestUrl.searchParams.get("language");
    const placeId = requestUrl.searchParams.get("place_id");
    const korean = placeId === "korean-place";
    const neighborhood = korean ? (language === "zh-TW" ? "明洞" : "명동") : "Montmartre";
    const district = korean ? (language === "zh-TW" ? "中區" : "중구") : "Paris";
    return new Response(JSON.stringify({
      results: [{
        place_id: placeId,
        formatted_address: korean ? "韓國首爾特別市中區明洞" : "Montmartre, Paris, France",
        address_components: [
          { long_name: neighborhood, types: ["neighborhood"] },
          { long_name: district, types: [korean ? "sublocality_level_1" : "locality"] },
          { long_name: korean ? "韓國" : "法國", short_name: korean ? "KR" : "FR", types: ["country"] },
        ],
        geometry: { location: korean ? { lat: 37.5636, lng: 126.9869 } : { lat: 48.8867, lng: 2.3431 } },
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [
      { localizeArea: true, placeId: "korean-place" },
      { localizeArea: true, placeId: "french-place" },
    ] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map((url) => url.searchParams.get("language")), ["zh-TW", "zh-TW", "ko", "fr"]);
  assert.deepEqual(
    response.payload.places.map(({ area, areaOriginal, areaResolvedByGoogle, areaResolutionVersion }) => ({ area, areaOriginal, areaResolvedByGoogle, areaResolutionVersion })),
    [
      { area: "中區", areaOriginal: "중구", areaResolvedByGoogle: true, areaResolutionVersion: 2 },
      { area: "Paris", areaOriginal: "Paris", areaResolvedByGoogle: true, areaResolutionVersion: 2 },
    ],
  );
});
