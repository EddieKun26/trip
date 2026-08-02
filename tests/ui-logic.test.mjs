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
  const filteredMapPlaces = new Function("state", "projectPlaces", "matchesMapFilters", `${section}; return filteredMapPlaces;`)(state, (places) => places, () => true);
  assert.deepEqual(filteredMapPlaces().map(({ name, dayOrder }) => [name, dayOrder]), [["早上景點", 1], ["下午景點", 2]]);
});

test("itinerary uses custom solid drag behavior instead of native translucent dragging", () => {
  assert.doesNotMatch(appSource, /draggable="true"/);
  assert.match(appSource, /row\.animate\(/);
  assert.match(appSource, /data-swipe-item/);
});
