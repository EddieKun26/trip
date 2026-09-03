import assert from "node:assert/strict";
import test from "node:test";

import { extractStructuredLodgingMetadata } from "../api/lodging-page.mjs";

test("Airbnb JSON-LD keeps the listing name and marks locality-only coordinates as approximate", () => {
  const result = extractStructuredLodgingMetadata(`
    <script type="application/ld+json">{"@type":"Product","name":"海景、風景如畫的露臺、溫泉、烤肉","description":"熱海住宿"}</script>
    <script type="application/ld+json">{"@type":"VacationRental","latitude":35.03297,"longitude":139.07494,"address":{"addressLocality":"熱海市"}}</script>
  `);
  assert.equal(result.lodgingName, "海景、風景如畫的露臺、溫泉、烤肉");
  assert.equal(result.address, undefined);
  assert.equal(result.locationLabel, "熱海市");
  assert.equal(result.latitude, 35.03297);
  assert.equal(result.longitude, 139.07494);
  assert.equal(result.locationApproximate, true);
});
test("Trip.com Hotel JSON-LD exposes the official name and full street address", () => {
  const result = extractStructuredLodgingMetadata(`
    <script type="application/ld+json">{
      "@type":"Hotel",
      "name":"湘南藤澤微笑飯店(Smile Hotel Shonan Fujisawa)",
      "address":{"@type":"PostalAddress","streetAddress":"19-12 Minamifujisawa, 251-0055 藤澤市, 神奈川縣, 日本","postalCode":"251-0055"}
    }</script>
  `);
  assert.equal(result.lodgingName, "湘南藤澤微笑飯店(Smile Hotel Shonan Fujisawa)");
  assert.equal(result.address, "19-12 Minamifujisawa, 251-0055 藤澤市, 神奈川縣, 日本");
  assert.equal(result.locationApproximate, undefined);
});

test("Agoda bootstrap data supplies a hotel name when the page has no JSON-LD", () => {
  const result = extractStructuredLodgingMetadata(`
    <script>window.__data={"criteria":{"hotelName":"River inn ZihLi","hotelId":51949392}}</script>
  `);
  assert.equal(result.lodgingName, "River inn ZihLi");
  assert.equal(result.lodgingId, "51949392");
});
