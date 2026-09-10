import "../lib/travel-area-audit.js";
import AreaTags from "../lib/area-tags.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = JSON.parse(readFileSync(new URL("../data/area-geometry/travel-area-boundaries.json", import.meta.url), "utf8"));
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const json = (value) => JSON.parse(JSON.stringify(value));

// Real production coordinates (places-snapshot export) so containment is proven against the
// deployed boundary file, not against a hand-drawn fixture.
const chome = (name, level = "sublocality_level_2") => ({ longText: name, types: [level, "sublocality", "political"] });
const place = (name, lat, lng, town, tags = [], extra = {}) => ({
  name, latitude: lat, longitude: lng, countryCode: "JP", areaTags: tags,
  formattedAddress: `${town}, Tokyo`,
  addressComponentsOriginal: [chome(town)], addressComponents: [chome(town)], ...extra,
});
const HANAKAWADO = place("淺草牛光", 35.711483699999995, 139.7985892, "花川戸", ["花川戸"]);
const KAMINARIMON = place("PANGA Asakusa", 35.710169199999996, 139.79788349999998, "雷門", ["雷門"]);
const JINNAN = place("FREAK'S STORE Shibuya", 35.662956199999996, 139.7004055, "神南", ["神南"]);
const ASAKUSA = place("今半別館", 35.713138199999996, 139.7969276, "浅草", ["浅草"]);
const SHIBUYA = place("JOURNAL STANDARD", 35.6584466, 139.7021636, "渋谷", ["渋谷"]);
const JINGUMAE = place("BEAMS 原宿", 35.6711722, 139.7076413, "神宮前", ["神宮前"]);
const OKUBO = place("自由之家", 35.7005251, 139.7031715, "大久保", ["大久保"]);
const KAMIMEGURO = place("Ramen Jazzy Beats", 35.6428156, 139.6972423, "上目黒", ["上目黒"]);

test("A. verified containment outranks the 町名 address token", () => {
  assert.deepEqual(AreaTags.suggestions(HANAKAWADO, [], []).address, ["花川戸"], "without geometry the address fallback is the only source");
  assert.deepEqual(AreaTags.suggestions(HANAKAWADO, [], [], catalog).address, ["淺草"]);
  assert.deepEqual(AreaTags.suggestions(KAMINARIMON, [], [], catalog).address, ["淺草"]);
  assert.deepEqual(AreaTags.addressSuggestions(HANAKAWADO, catalog), ["淺草"]);
});

test("B. a second verified containment resolves to its canonical travel area", () => {
  assert.deepEqual(AreaTags.suggestions(JINNAN, [], []).address, ["神南"]);
  assert.deepEqual(AreaTags.suggestions(JINNAN, [], [], catalog).address, ["澀谷"]);
});

test("C. no verified polygon keeps the existing address fallback working", () => {
  // Same catalog, but these coordinates are inside no user-facing travel circle at all.
  for (const [subject, expected] of [[JINGUMAE, "神宮前"], [OKUBO, "大久保"], [KAMIMEGURO, "上目黒"]]) {
    assert.deepEqual(AreaTags.travelAreaHits(subject, catalog), [], `${expected} must not claim containment`);
    assert.deepEqual(AreaTags.suggestions(subject, [], [], catalog).address, [expected], `${expected} keeps its fallback suggestion`);
  }
  // A place with no coordinates at all still falls back.
  const noCoords = { ...HANAKAWADO, latitude: undefined, longitude: undefined };
  assert.deepEqual(AreaTags.suggestions(noCoords, [], [], catalog).address, ["花川戸"]);
});

test("D. no semantic guessing: an unverified point never becomes a coarser travel area", () => {
  for (const forbidden of ["原宿", "表參道", "表参道"]) {
    assert.doesNotMatch(JSON.stringify(AreaTags.suggestions(JINGUMAE, [], [], catalog).address), new RegExp(forbidden));
  }
  for (const forbidden of ["新大久保", "新宿"]) {
    assert.doesNotMatch(JSON.stringify(AreaTags.suggestions(OKUBO, [], [], catalog).address), new RegExp(forbidden));
  }
  // 原宿/表參道 are catalog travel areas with no verified geometry -- that is exactly why
  // 神宮前 cannot resolve to them, and the data must keep it that way.
  for (const key of ["harajuku", "omotesando"]) {
    assert.equal(catalog.areas[key].drawable, false, `${key} must stay undrawable until real geometry exists`);
  }
});

test("ward and municipality fallback boundaries are never suggested as a filter", () => {
  const contains = globalThis.TravelAreaAudit.contains;
  const meguro = catalog.areas.meguro;
  assert.equal(meguro.drawable, true);
  assert.ok(contains({ geometry: meguro.finalGeometry }, [KAMIMEGURO.longitude, KAMIMEGURO.latitude]),
    "this point really is inside the 目黑 ward polygon");
  assert.deepEqual(AreaTags.travelAreaHits(KAMIMEGURO, catalog), [], "but a ward boundary is not a user-facing travel area");
  // The catalog's own assessment is the discriminator; pin it so regenerated data cannot
  // silently widen suggestions to whole wards.
  assert.match(catalog.areas.asakusa.userFacingAssessment, /^Independent travel circle/);
  assert.match(catalog.areas.meguro.userFacingAssessment, /^Existing explicit municipality\/ward\/borough fallback/);
  const usable = Object.values(catalog.areas).filter((area) => area.drawable === true && area.finalGeometry
    && String(area.userFacingAssessment || "").startsWith("Independent travel circle"));
  assert.equal(usable.length, 14, "14 verified user-facing travel circles carry geometry today");
  for (const ward of ["chiyoda", "chuo", "minato", "taito", "toshima", "meguro", "koto"]) {
    assert.doesNotMatch(catalog.areas[ward].userFacingAssessment, /^Independent travel circle/);
  }
});

test("G. canonical dedupe: an area already tagged never suggests itself again", () => {
  const tagged = { ...HANAKAWADO, areaTags: ["淺草"] };
  assert.deepEqual(AreaTags.suggestions(tagged, [tagged], ["淺草"], catalog).address, []);
  // and the trip's own spelling of the same catalog identity wins over the other form
  assert.deepEqual(AreaTags.suggestions(HANAKAWADO, [ASAKUSA], [], catalog).address, ["浅草"],
    "浅草 and 淺草 are the same catalog area; the persisted spelling keeps one filter identity");
  assert.deepEqual(AreaTags.suggestions(JINNAN, [SHIBUYA], [], catalog).address, ["渋谷"]);
});

test("H. the Booking formatted-address parser is untouched when nothing is contained", () => {
  const booking = "Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072";
  const subject = { name: "自由之家", formattedAddress: booking, manualAddress: booking, areaTags: [] };
  assert.deepEqual(AreaTags.addressSuggestions(subject), ["Okubo"]);
  assert.deepEqual(AreaTags.addressSuggestions(subject, catalog), ["Okubo"], "no coordinates -> unchanged fallback");
  const located = { ...subject, countryCode: "JP", latitude: OKUBO.latitude, longitude: OKUBO.longitude };
  assert.deepEqual(AreaTags.addressSuggestions(located, catalog), ["Okubo"], "coordinates outside every travel circle -> unchanged fallback");
});

test("F+I. migration is whitelist + per-place containment, all-or-nothing, and never invents places", () => {
  const trip = [json(ASAKUSA), json(HANAKAWADO), json(KAMINARIMON), json(SHIBUYA), json(JINNAN), json(JINGUMAE), json(OKUBO)];
  const before = json(trip);
  const { changes, blocked } = AreaTags.containmentMigration(trip, catalog);
  assert.deepEqual(blocked, []);
  assert.deepEqual(changes.map((c) => [c.place.name, c.tag, c.label, c.travelAreaKey]), [
    ["淺草牛光", "花川戸", "浅草", "asakusa"],
    ["PANGA Asakusa", "雷門", "浅草", "asakusa"],
    ["FREAK'S STORE Shibuya", "神南", "渋谷", "shibuya"],
  ]);
  assert.deepEqual(trip, before, "computing the manifest must not mutate anything");
  // Only whitelisted, containment-proven places appear; the ambiguous ones are absent.
  for (const name of ["今半別館", "JOURNAL STANDARD", "BEAMS 原宿", "自由之家"]) {
    assert.equal(changes.some((c) => c.place.name === name), false, `${name} must not be migrated`);
  }

  // Same tag strings, coordinates that prove nothing -> no migration at all.
  const impostors = [
    { ...json(HANAKAWADO), name: "wrong-coords", latitude: 35.6584466, longitude: 139.7021636 },
    { ...json(JINNAN), name: "no-coords", latitude: undefined, longitude: undefined },
  ];
  const strict = AreaTags.containmentMigration(impostors, catalog);
  assert.deepEqual(strict.changes, []);
  assert.deepEqual(strict.blocked.map((b) => b.reason), ["containment-failed", "containment-failed"]);
  // Without geometry nothing can be proved, so nothing is proposed.
  assert.deepEqual(AreaTags.containmentMigration(trip, null).changes, []);
});

test("E+I. other and manual areaTags survive migration; the applier is all-or-nothing", () => {
  const multi = { ...json(HANAKAWADO), areaTags: ["花川戸", "我的自訂區", "淺草"] };
  const { changes, blocked } = AreaTags.containmentMigration([multi], catalog);
  assert.deepEqual(blocked, []);
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0].after, ["淺草", "我的自訂區"], "manual tag kept; replacement deduped against the existing canonical tag");
  assert.equal(multi.areaTags.length, 3, "the manifest never writes to the place itself");

  // The shipped applier refuses partial writes and only runs for editable trips.
  const runner = appSource.slice(appSource.indexOf("function scheduleContainmentMigration"), appSource.indexOf("async function saveSharedTrip"));
  assert.match(runner, /if \(blocked\.length \|\| !changes\.length\) return;/);
  assert.match(runner, /containmentMigrationDone === state\.tripId \|\| !canEdit\(\)/);
  assert.match(runner, /tripId !== state\.tripId/);
  assert.match(runner, /AreaTags\.containmentMigration\(state\.places, catalog\)/);
  // Suggestions must never write to persisted tags on their own.
  const draft = appSource.slice(appSource.indexOf("function renderAreaTagDraft"), appSource.indexOf("function renderAreaTagAutocomplete"));
  assert.match(draft, /AreaTags\.suggestions\(source, state\.places, session\.areaTags, areaGeometryCatalog\)/);
  assert.doesNotMatch(draft, /\.areaTags\s*=|persist\(/);
});
