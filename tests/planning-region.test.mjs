import assert from "node:assert/strict";
import test from "node:test";
import { TRAVEL_AREA_RESOLUTION_VERSION, resolveTravelArea, administrativeInfoFromAddressComponents } from "../api/planning-region.mjs";

const component = (longText, type, shortText = "") => ({ longText, shortText, types: [type] });
const address = (countryCode, entries) => ({
  originalAddressComponents: [...entries.map(([name, type]) => component(name, type)), component(countryCode, "country", countryCode)],
});
const japanese = (neighborhood, locality, prefecture = "東京都") => address("JP", [
  ...(neighborhood ? [[neighborhood, "sublocality_level_2"]] : []),
  [locality, "locality"], [prefecture, "administrative_area_level_1"],
]);

test("required address evidence maps to final traveler-facing groups, not administrative levels", () => {
  const cases = [
    [japanese("神宮前", "渋谷区"), "shibuya", "澀谷（渋谷）"],
    [japanese("神南", "渋谷区"), "shibuya", "澀谷（渋谷）"],
    [japanese("花川戸", "台東区"), "asakusa", "淺草（浅草）"],
    [japanese("雷門", "台東区"), "asakusa", "淺草（浅草）"],
    [japanese("銀座", "中央区"), "ginza", "銀座（銀座）"],
    [japanese("", "練馬区"), "nerima", "練馬（練馬）"],
    [japanese("", "鎌倉市", "神奈川県"), "kamakura", "鎌倉（鎌倉）"],
    [address("KR", [["명동", "neighborhood"], ["중구", "sublocality_level_1"], ["서울특별시", "locality"]]), "myeongdong", "明洞（명동）"],
    [address("US", [["Brooklyn", "sublocality_level_1"], ["New York", "locality"]]), "brooklyn", "布魯克林（Brooklyn）"],
  ];
  for (const [input, key, title] of cases) {
    const result = resolveTravelArea(input);
    assert.equal(result.travelAreaKey, key, title);
    assert.equal(`${result.travelAreaZh}（${result.travelAreaLocal}）`, title);
    assert.equal(result.travelAreaResolved, true);
    assert.equal(result.travelAreaResolutionVersion, TRAVEL_AREA_RESOLUTION_VERSION);
  }
});

test("Jingumae/Jinnan and Hanakawado/Kaminarimon share stable keys independent of raw labels", () => {
  const results = ["神宮前", "神南"].map((name) => resolveTravelArea(japanese(name, "渋谷区")));
  assert.equal(new Set(results.map((place) => place.travelAreaKey)).size, 1);
  const asakusa = ["花川戸", "雷門"].map((name) => resolveTravelArea(japanese(name, "台東区")));
  assert.equal(new Set(asakusa.map((place) => place.travelAreaKey)).size, 1);
  for (const place of [...results, ...asakusa]) assert.doesNotMatch(place.travelAreaZh, /神宮前|神南|花川戶|雷門|台東|澀谷區/);
});

test("a named Japanese travel area does not require a Google parent ward component", () => {
  const result = resolveTravelArea(address("JP", [["神宮前", "sublocality_level_2"]]));
  assert.equal(result.travelAreaKey, "shibuya");
  assert.equal(result.travelAreaZh, "澀谷");
});

test("Google zh-TW romanization does not replace the true Chinese/local names", () => {
  const result = resolveTravelArea({
    localizedAddressComponents: [component("Jingūmae", "sublocality_level_2"), component("Shibuya", "locality"), component("日本", "country", "JP")],
    originalAddressComponents: [component("神宮前", "sublocality_level_2"), component("渋谷区", "locality"), component("日本", "country", "JP")],
  });
  assert.equal(result.travelAreaZh, "澀谷");
  assert.equal(result.travelAreaLocal, "渋谷");
});

test("Korean and French named neighborhoods are not widened to Jung-gu or Paris", () => {
  const myeongdong = resolveTravelArea(address("KR", [["명동", "neighborhood"], ["중구", "sublocality_level_1"]]));
  const montmartre = resolveTravelArea(address("FR", [["Montmartre", "neighborhood"], ["Paris", "locality"]]));
  assert.equal(myeongdong.travelAreaZh, "明洞");
  assert.equal(montmartre.travelAreaZh, "蒙馬特");
  assert.equal(montmartre.travelAreaLocal, "Montmartre");
  const gangnam = resolveTravelArea(address("KR", [["강남구", "sublocality_level_1"]]));
  assert.equal(gangnam.travelAreaZh, "江南");
});

test("unknown evidence stays unresolved instead of treating an API answer as success", () => {
  const result = resolveTravelArea(address("JP", [["未知町名", "sublocality_level_2"]]));
  assert.equal(result.travelAreaResolved, false);
  assert.equal(result.travelAreaResolutionVersion, 0);
  assert.equal(result.travelAreaKey, "");
});

test("unmapped Korean and US neighborhoods require a rule instead of widening to their parent", () => {
  const korea = resolveTravelArea(address("KR", [["신촌동", "neighborhood"], ["마포구", "sublocality_level_1"], ["서울특별시", "locality"]]));
  const us = resolveTravelArea(address("US", [["SoHo", "neighborhood"], ["New York", "locality"]]));
  assert.equal(korea.travelAreaResolved, false);
  assert.equal(us.travelAreaResolved, false);
  assert.equal(korea.travelAreaKey, "");
  assert.equal(us.travelAreaKey, "");
});

test("raw address components and administrative information remain distinct from travel areas", () => {
  const input = japanese("銀座", "中央区");
  const snapshot = JSON.stringify(input);
  const admin = administrativeInfoFromAddressComponents([], input.originalAddressComponents);
  const result = resolveTravelArea(input);
  assert.equal(admin.local.find((entry) => entry.types.includes("locality")).longText, "中央区");
  assert.equal(result.travelAreaKey, "ginza");
  assert.equal(result.travelAreaZh, "銀座");
  assert.equal(JSON.stringify(input), snapshot);
});
