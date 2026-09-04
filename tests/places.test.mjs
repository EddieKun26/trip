import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import placesHandler from "../api/places.mjs";

const placesSource = readFileSync(new URL("../api/places.mjs", import.meta.url), "utf8");

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

test("Google Places maps Jingumae evidence to the Shibuya travel area", async () => {
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
            { longText: "神宮前", types: ["sublocality_level_2"] },
            { longText: "澀谷區", types: ["locality"] },
            { longText: "東京都", types: ["administrative_area_level_1"] },
            { longText: "日本", shortText: "JP", types: ["country"] },
          ],
          primaryTypeDisplayName: { text: "景點" },
          location: { latitude: 35.64, longitude: 139.71 },
          googleMapsUri: "https://www.google.com/maps/place/test",
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      id: "test-place-id",
      formattedAddress: "日本、〒150-0001 東京都渋谷区神宮前",
      addressComponents: [
        { longText: "神宮前", types: ["sublocality_level_2"] },
        { longText: "渋谷区", types: ["locality"] },
        { longText: "東京都", types: ["administrative_area_level_1"] },
        { longText: "日本", shortText: "JP", types: ["country"] },
      ],
      location: { latitude: 35.64, longitude: 139.71 },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "https://www.google.com/maps/search/?api=1&query=test", hintName: "測試景點", destination: "東京" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.places[0].placeId, "test-place-id");
  assert.equal(response.payload.places[0].area, "澀谷區");
  assert.equal(response.payload.places[0].areaOriginal, "渋谷区");
  assert.equal(response.payload.places[0].travelAreaKey, "shibuya");
  assert.equal(response.payload.places[0].travelAreaZh, "澀谷");
  assert.equal(response.payload.places[0].travelAreaLocal, "渋谷");
  assert.equal(response.payload.places[0].travelAreaResolved, true);
  assert.equal(response.payload.places[0].travelAreaResolutionVersion, 5);
  assert.equal(response.payload.places[0].administrativeAreas.local.find((item) => item.types.includes("locality")).longText, "渋谷区");
  assert.equal(response.payload.places[0].countryCode, "JP");
  assert.equal(response.payload.places[0].addressComponents[0].longText, "神宮前");
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[0].options.body).textQuery, "測試景點 東京");
  assert.equal(JSON.parse(calls[0].options.body).regionCode, "JP");
  assert.match(calls[1].url, /places\/test-place-id/);
  assert.equal(new URL(calls[1].url).searchParams.get("languageCode"), "ja");

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

  const seoulResponse = responseMock();
  await placesHandler({
    method: "POST",
    body: { places: [{ sourceUrl: "", hintName: "COEX", destination: "首爾" }] },
  }, seoulResponse);
  const seoulSearchBody = JSON.parse(calls[6].options.body);
  assert.equal(seoulSearchBody.textQuery, "COEX 首爾");
  assert.equal(seoulSearchBody.regionCode, "KR");
  assert.equal("locationBias" in seoulSearchBody, false);
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
           { long_name: isJapanese ? "神奈川県" : "神奈川縣", types: ["administrative_area_level_1"] },
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
  assert.equal(response.payload.places[0].travelAreaKey, "fujisawa");
  assert.equal(response.payload.places[0].travelAreaZh, "藤澤");
  assert.equal(response.payload.places[0].travelAreaLocal, "藤沢");
  assert.equal(response.payload.places[0].travelAreaResolutionVersion, 5);
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
    const language = requestUrl.searchParams.get("languageCode");
    const placeId = decodeURIComponent(requestUrl.pathname.split("/").at(-1));
    const korean = placeId === "korean-place";
    const neighborhood = korean ? (language === "zh-TW" ? "明洞" : "명동") : "Montmartre";
    const district = korean ? (language === "zh-TW" ? "中區" : "중구") : "Paris";
    return new Response(JSON.stringify({
      id: placeId,
      formattedAddress: korean ? "韓國首爾特別市中區明洞" : "Montmartre, Paris, France",
      addressComponents: [
          { longText: neighborhood, types: ["neighborhood"] },
          { longText: district, types: [korean ? "sublocality_level_1" : "locality"] },
          { longText: korean ? "韓國" : "法國", shortText: korean ? "KR" : "FR", types: ["country"] },
        ],
      location: korean ? { latitude: 37.5636, longitude: 126.9869 } : { latitude: 48.8867, longitude: 2.3431 },
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
  assert.deepEqual(calls.map((url) => url.searchParams.get("languageCode")), ["zh-TW", "zh-TW", "ko", "fr"]);
  assert.deepEqual(
    response.payload.places.map(({ area, areaOriginal, travelAreaKey, travelAreaZh, travelAreaLocal, travelAreaResolved, travelAreaResolutionVersion }) => ({ area, areaOriginal, travelAreaKey, travelAreaZh, travelAreaLocal, travelAreaResolved, travelAreaResolutionVersion })),
    [
      { area: "中區", areaOriginal: "중구", travelAreaKey: "myeongdong", travelAreaZh: "明洞", travelAreaLocal: "명동", travelAreaResolved: true, travelAreaResolutionVersion: 5 },
      { area: "Paris", areaOriginal: "Paris", travelAreaKey: "montmartre", travelAreaZh: "蒙馬特", travelAreaLocal: "Montmartre", travelAreaResolved: true, travelAreaResolutionVersion: 5 },
    ],
  );
});

test("place search context is destination-aware and has no Tokyo fallback", () => {
  assert.match(placesSource, /countryCodeForDestination\(destination\)/);
  assert.match(placesSource, /destination: state|destination/);
  assert.doesNotMatch(placesSource, /`\$\{textQuery\} 東京`/);
  assert.doesNotMatch(placesSource, /latitude: 35\.6762/);
  assert.doesNotMatch(placesSource, /requestBody\.regionCode = "JP"/);
});
