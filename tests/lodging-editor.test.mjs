import { tagOptionsNode } from "./helpers/tag-options-node.mjs";
import AreaTags from "../lib/area-tags.js";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const functionSource = (name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
};
const helpers = section("function manualPlaceSeed", "async function compressPlacePhoto(file)");
const editorValueHelpers = section("function defaultPlaceCategory", "function openPlaceEditSheet");
const submit = section('if (event.target.id === "place-editor-form")', 'if (event.target.id === "shopping-item-form")');
const placeDetailKeyHelper = functionSource("placeDetailKey");
const good = { latitude: 35.7, longitude: 139.7, formattedAddress: "Google 標準地址 1-2-3", countryCode: "JP",
  travelAreaKey: "shinjuku", travelAreaZh: "新宿", travelAreaLocal: "新宿", travelAreaResolved: true,
  travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
const tick = () => new Promise((resolve) => setImmediate(resolve));

function harness({ existing = null, drafts = [], address = "", seed = {}, formName } = {}) {
  const timers = new Map();
  let time = 0, timerId = 0;
  const requests = [], toasts = [];
  const node = (value = "") => ({ value, disabled: false, hidden: false, textContent: "", placeholder: "", dataset: {}, attributes: {}, clickCount: 0, listeners: {},
    ...tagOptionsNode(),
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }, fire(type, event = {}) { let result; for (const fn of this.listeners[type] || []) result = fn(event); return result; }, click() { this.clickCount += 1; } });
  const form = node();
  form.id = "place-editor-form";
  form.isConnected = true;
  form.dataset = { originalPlaceName: existing?.name || "", originalAddress: existing?.formattedAddress || "" };
  form.elements = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin", "travelAreaZh", "travelAreaLocal", "kind", "category"].map((key) => [key, node()]));
  Object.assign(form.elements.name, { value: formName ?? (seed.name || existing?.name || "私人住宿") });
  form.elements.address.value = address;
  form.elements.kind.value = seed.kind || existing?.kind || "lodging";
  form.elements.category.value = seed.category || existing?.category || "私人住宿";
  form.elements.category.dataset.categoryKind = form.elements.kind.value;
  form.elements.referenceUrl.value = seed.referenceUrl ?? existing?.referenceUrl ?? "";
  for (const key of ["sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin"]) form.elements[key].value = seed[key] ?? existing?.[key] ?? "";
  const nodes = new Map();
  form.querySelector = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, node());
    return nodes.get(selector);
  };
  form.querySelectorAll = () => Object.values(form.elements);
  const context = vm.createContext({ AreaTags, escapeHtml: String, URL, console, pendingLodgingDrafts: drafts, pendingPlacePhoto: seed.customPhotoDataUrl || "", removePendingPlacePhoto: false,
    state: { tripId: "trip", destination: "東京", places: existing ? [existing] : [], votes: {}, itinerary: {}, transports: [] },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { at: time + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) { return new Promise((resolve) => requests.push({ url, body: JSON.parse(options.body), resolve })); },
    isGoogleMapsUrl: (value) => /maps/.test(value), isLodgingShareUrl: (value) => /https:\/\/.*(?:airbnb|booking|agoda|trip)\./.test(value),
    placeReferenceMeta: () => ({ platform: "Airbnb" }), validMapCoordinates: (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0),
    compressPlacePhotoDataUrl: async (data) => { if (data === "broken") throw Error("image"); return "data:image/jpeg;base64,compressed"; },
    renderPlacePhotoEditor() {}, kindLabel: (kind) => ({ attraction: "景點", restaurant: "餐廳", lodging: "住宿", shopping: "購物" }[kind] || "地點"), placeAreaFromAddress: () => "", currentMemberId: () => "member",
    canEdit: () => true, guestOnlyMessage() {}, showToast: (message) => toasts.push(message),
    crypto: { randomUUID: () => "id" }, persist() {}, render() {}, renamePlaceReferences() {},
    closeSheet() { form.isConnected = false; },
    normalizeGoogleMapsUrl: (url) => url || "",
    openPlaceSheet() {},
    areaGeometryCatalog: null, loadAreaGeometry: () => Promise.resolve(null),
    FormData: class { constructor(form) { this.tags = form.checkedTags || []; this.values = Object.fromEntries(Object.entries(form.elements).map(([key, node]) => [key, node.value])); } get(key) { return this.values[key]; } getAll(key) { return this.tags; } },
  });
  vm.runInContext(section("function restaurantTagValues", "function placesScreen") + section("const TRAVEL_AREA_RESOLUTION_VERSION", "function placeVoters") + section("function saveRestaurantTagsOnly", "function renamePlaceReferences") + helpers + editorValueHelpers + placeDetailKeyHelper + `\nasync function submitEditor(event) { ${submit} }`, context);
  const session = context.bindPlaceEditor(form, existing, seed);
  const input = (key, value) => { const target = form.elements[key]; target.name = key; target.value = value; form.fire("input", { target }); };
  return { context, form, session, requests, toasts, input,
    async advance(ms) { time += ms; for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); } await tick(); },
    reply(index, place = good) { requests[index].resolve({ ok: true, json: async () => ({ places: [place] }) }); },
    save() { return context.submitEditor({ target: form, preventDefault() {} }); },
  };
}

test("both lodging entries share seed; source URL selects its own pending draft without recognition", async () => {
  const draft = { referenceUrl: "https://www.airbnb.com/rooms/2", sourceLodgingName: "住宿二", sourcePlatform: "Airbnb", sourceListingId: "2", sourceImageDataUrl: "source", address: "大約新宿", locationPrecision: "approximate" };
  const h = harness({ drafts: [{ ...draft, referenceUrl: "https://www.airbnb.com/rooms/1", sourceLodgingName: "錯的" }, draft] });
  const direct = h.context.manualPlaceSeed(draft.referenceUrl);
  const recognized = h.context.lodgingDraftToEditorSeed(draft);
  for (const key of ["name", "address", "sourcePlatform", "sourceListingId", "referenceUrl", "customPhotoDataUrl"]) assert.equal(direct[key], recognized[key]);
  assert.equal(direct.address, "");
  h.form.elements.referenceUrl.value = draft.referenceUrl;
  await h.context.fillPlaceEditorFromUrl(h.form);
  assert.equal(h.requests.length, 0);
  assert.equal(h.form.elements.name.value, "住宿二");
  assert.equal(h.context.pendingPlacePhoto, "data:image/jpeg;base64,compressed");
  assert.match(source, /openPlaceEditSheet\("", lodgingDraftToEditorSeed\(draft\)\)/);
});

test("direct URL requests a draft; late metadata preserves edited name/address/photo", async () => {
  const h = harness();
  const url = "https://www.airbnb.com/rooms/22";
  h.input("referenceUrl", url);
  await h.advance(700);
  assert.equal(h.requests[0].url, "/api/social-place-import");
  assert.equal(h.requests[0].body.action, "lodging-draft");
  h.input("name", "我的名字"); h.input("address", "我的地址");
  h.session.dirty.add("photo"); h.context.pendingPlacePhoto = "my photo";
  h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: url, sourceLodgingName: "來源名", address: "來源地址", sourcePlatform: "Airbnb", sourceListingId: "22", sourceImageDataUrl: "source" } }) });
  await tick();
  assert.equal(h.form.elements.name.value, "我的名字"); assert.equal(h.form.elements.address.value, "我的地址");
  assert.equal(h.context.pendingPlacePhoto, "my photo");
  assert.equal(h.form.elements.sourceListingId.value, "22");
});

test("missing address or failed image keeps the other source metadata", async () => {
  const url = "https://www.booking.com/hotel/jp/stay.html";
  const h = harness({ drafts: [{ referenceUrl: url, sourceLodgingName: "Stay", sourcePlatform: "Booking.com", sourceListingId: "32", sourceImageDataUrl: "broken" }] });
  h.form.elements.referenceUrl.value = url;
  await h.context.fillPlaceEditorFromUrl(h.form);
  assert.equal(h.form.elements.name.value, "Stay"); assert.equal(h.form.elements.address.value, "");
  assert.equal(h.form.elements.sourcePlatform.value, "Booking.com"); assert.equal(h.form.elements.sourceListingId.value, "32");
  assert.equal(h.form.elements.referenceUrl.value, url);
  assert.match(h.form.querySelector("[data-place-photo-status]").textContent, /自行補照片/);
});

test("metadata for a previous URL or a closed editor cannot fill; wrong-source draft is rejected", async () => {
  const h = harness(); const firstUrl = "https://www.airbnb.com/rooms/1", secondUrl = "https://www.airbnb.com/rooms/2";
  h.form.elements.referenceUrl.value = firstUrl;
  const first = h.context.fillPlaceEditorFromUrl(h.form);
  h.input("referenceUrl", secondUrl); const second = h.context.fillPlaceEditorFromUrl(h.form);
  h.requests[1].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: secondUrl, sourceLodgingName: "第二筆" } }) });
  await second;
  h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: firstUrl, sourceLodgingName: "第一筆" } }) });
  await first; assert.equal(h.form.elements.name.value, "第二筆");
  const closed = harness(); closed.form.elements.referenceUrl.value = firstUrl;
  const late = closed.context.fillPlaceEditorFromUrl(closed.form); closed.form.isConnected = false;
  closed.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: firstUrl, sourceLodgingName: "晚到" } }) });
  await late; assert.equal(closed.form.elements.name.value, "私人住宿");
  const wrong = harness(); wrong.form.elements.referenceUrl.value = firstUrl;
  const wrongRequest = wrong.context.fillPlaceEditorFromUrl(wrong.form);
  wrong.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: secondUrl, sourceLodgingName: "錯來源" } }) });
  await wrongRequest; assert.equal(wrong.form.elements.name.value, "私人住宿");
});

test("late source-photo compression respects a user photo change", async () => {
  const url = "https://www.airbnb.com/rooms/3";
  const h = harness({ drafts: [{ referenceUrl: url, sourceLodgingName: "Stay", sourceImageDataUrl: "source" }] });
  let finishPhoto;
  h.context.compressPlacePhotoDataUrl = () => new Promise((resolve) => { finishPhoto = resolve; });
  h.form.elements.referenceUrl.value = url;
  const request = h.context.fillPlaceEditorFromUrl(h.form);
  h.session.dirty.add("photo"); h.context.pendingPlacePhoto = "user photo";
  finishPhoto("source photo"); await request;
  assert.equal(h.context.pendingPlacePhoto, "user photo");
});

test("address input debounces for 700ms; paste schedules and blur flushes once", async () => {
  const h = harness();
  h.input("address", "地址一"); await h.advance(699); assert.equal(h.requests.length, 0);
  h.input("address", "地址二"); await h.advance(699); assert.equal(h.requests.length, 0);
  await h.advance(1); assert.equal(h.requests.length, 1); assert.equal(h.requests[0].body.places[0].manualAddress, "地址二");
  h.reply(0); await tick();
  h.form.elements.address.fire("paste"); h.form.elements.address.value = "貼上地址";
  await h.advance(700); assert.equal(h.requests.length, 2);
  h.reply(1); await tick();
  h.input("address", "blur 地址"); h.form.elements.address.fire("blur");
  assert.equal(h.requests.length, 3); await h.advance(700); assert.equal(h.requests.length, 3);
});

test("IME composition never sends requests, including blur; compositionend schedules", async () => {
  const h = harness();
  h.form.elements.address.fire("compositionstart"); h.input("address", "新宿");
  h.form.elements.address.fire("blur"); await h.advance(1500); assert.equal(h.requests.length, 0);
  h.form.elements.address.fire("compositionend"); await h.advance(700); assert.equal(h.requests.length, 1);
});

test("address change invalidates immediately; stale and closed editor replies cannot fill", async () => {
  const h = harness(); h.input("address", "A"); const first = h.session.resolve();
  h.input("address", "B"); assert.equal(h.session.result, null); const second = h.session.resolve();
  h.reply(1, { ...good, formattedAddress: "B normalized" }); await second;
  h.reply(0, { ...good, formattedAddress: "A normalized" }); await first;
  assert.equal(h.session.result.formattedAddress, "B normalized");
  h.input("address", "C"); assert.equal(h.session.result, null); const third = h.session.resolve();
  h.form.isConnected = false; h.reply(2); await third; assert.equal(h.session.result, null);
});

test("save waits for current geocode, stores normalized address and photo, and does not request twice", async () => {
  const h = harness(); h.input("address", "使用者貼入的地址１２３");
  h.context.pendingPlacePhoto = "data:image/jpeg;base64,photo";
  h.session.resolve(); const saved = h.save(); assert.equal(h.context.state.places.length, 0);
  assert.equal(h.requests.length, 1); h.reply(0); await saved;
  const place = h.context.state.places[0];
  assert.equal(place.manualAddress, "使用者貼入的地址１２３"); assert.equal(place.formattedAddress, good.formattedAddress);
  assert.equal(place.customPhotoDataUrl, "data:image/jpeg;base64,photo");
  for (const key of Object.keys(good).filter((key) => key.startsWith("travelArea"))) assert.equal(place[key], good[key]);
  const again = harness({ existing: JSON.parse(JSON.stringify(place)), address: place.manualAddress });
  await again.save(); assert.equal(again.requests.length, 0);
});

test("save after editor close or address replacement cannot add a stale place; photo cap is explicit", async () => {
  const h = harness(); h.input("address", "地址 A"); const saved = h.save();
  h.input("address", "地址 B"); h.reply(0); await saved;
  assert.equal(h.context.state.places.length, 0);
  const closed = harness(); closed.input("address", "地址"); const closingSave = closed.save();
  closed.form.isConnected = false; closed.reply(0); await closingSave;
  assert.equal(closed.context.state.places.length, 0);
  const full = harness(); full.input("address", "地址");
  full.context.state.places = Array.from({ length: 12 }, (_, index) => ({ name: `地點${index}`, customPhotoDataUrl: "photo" }));
  full.context.pendingPlacePhoto = "source photo"; await full.save();
  assert.equal(full.context.state.places.length, 12); assert.match(full.toasts[0], /最多保存 12 張/);
  assert.equal(full.requests.length, 0);
});

test("geocode failure prevents creation; successful cached result is reused at save", async () => {
  const h = harness(); h.input("address", "錯誤地址"); const saved = h.save(); h.reply(0, { error: "ZERO_RESULTS" }); await saved;
  assert.equal(h.context.state.places.length, 0); assert.equal(h.session.saving, false);
  const retry = h.session.resolve(true); h.reply(1); await retry;
  await h.save(); assert.equal(h.requests.length, 2); assert.equal(h.context.state.places.length, 1);
});

test("Travel Area failure saves coordinates with failed status, never the previous area", async () => {
  const h = harness({ existing: { ...good, name: "既有住宿" } });
  h.input("address", "新地址"); const saved = h.save();
  h.reply(0, { ...good, travelAreaResolved: false, travelAreaKey: "", travelAreaZh: "", travelAreaLocal: "", travelAreaResolutionError: "TIMEOUT", travelAreaResolutionVersion: 0 });
  await saved;
  const place = h.context.state.places[0];
  assert.equal(place.latitude, good.latitude); assert.equal(place.travelAreaResolutionStatus, "failed");
  assert.equal(place.travelAreaResolutionError, "TIMEOUT"); assert.notEqual(place.travelAreaKey, good.travelAreaKey);
  assert.match(h.form.querySelector("[data-place-address-status]").textContent, /分區待辨識/);
});

test("manual override survives re-geocode until explicit restore-auto", async () => {
  const original = { ...good, name: "既有住宿", travelAreaKey: "my-area", travelAreaZh: "我的區", travelAreaLocal: "My area", travelAreaSource: "manual", travelAreaManuallySet: true };
  const h = harness({ existing: original }); h.input("address", "新地址");
  const save = h.save(); h.reply(0); await save;
  const place = h.context.state.places[0];
  assert.equal(place.travelAreaKey, "my-area"); assert.equal(place.autoTravelArea.travelAreaKey, "shinjuku");
  assert.equal(place.formattedAddress, good.formattedAddress);
  const restored = harness({ existing: place, address: place.manualAddress });
  restored.form.querySelector("[data-restore-auto-area]").fire("click"); await restored.save();
  assert.equal(restored.context.state.places[0].travelAreaKey, "shinjuku");
  assert.equal(restored.context.state.places[0].travelAreaManuallySet, false);
});

test("normal editor exposes one source input and collapsed override; API count stays bounded", () => {
  const editor = section("function openPlaceEditSheet", "function renamePlaceReferences");
  assert.match(editor, /<details class="place-area-advanced field full"><summary>進階：手動修正分區/);
  assert.doesNotMatch(editor, /type="hidden" name="referenceUrl"/);
  assert.equal(readdirSync(new URL("../api", import.meta.url)).filter((name) => name.endsWith(".mjs")).length <= 12, true);
});

test("editor keeps category internal, derives only automatic defaults, and uses the one photo input", async () => {
  const h = harness({ seed: { kind: "lodging" }, formName: "" });
  assert.equal(h.context.placeEditorDisplayName(null, { kind: "lodging" }), "");
  assert.equal(h.context.defaultPlaceCategory("lodging"), "私人住宿");
  await h.save();
  assert.equal(h.context.state.places.length, 0);
  assert.equal(h.toasts.at(-1), "請輸入地點名稱");
  h.input("name", "我的新住宿");
  h.input("address", "完整住宿地址");
  const created = h.save(); h.reply(0); await created;
  assert.equal(h.context.state.places[0].name, "我的新住宿");
  assert.equal(h.context.state.places[0].category, "私人住宿");

  const automatic = harness({ seed: { kind: "lodging" } });
  automatic.input("kind", "attraction");
  assert.equal(automatic.form.elements.category.value, "景點");
  assert.equal(automatic.form.elements.name.placeholder, "輸入景點名稱");
  automatic.form.querySelector("[data-place-photo-upload-zone]").fire("click");
  assert.equal(automatic.form.querySelector("[data-place-photo-input]").clickCount, 1);

  const existing = { ...good, name: "既有古寺", kind: "attraction", category: "歷史古蹟", manualLocation: true,
    manualAddress: good.formattedAddress };
  const edited = harness({ existing, address: existing.manualAddress });
  edited.input("kind", "lodging");
  assert.equal(edited.form.elements.category.value, "歷史古蹟");
  await edited.save();
  assert.equal(edited.context.state.places[0].category, "歷史古蹟");
  assert.equal(edited.context.state.places[0].kind, "lodging");
});

test("both manual lodging entries expose the same blocked status without inventing source name or photo", async () => {
  const draft = { referenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123", sourcePlatform: "Booking.com",
    originalReferenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123", sourceReadStatus: "blocked", sourceListingId: "123" };
  const creator = harness({ drafts: [draft] });
  const seeds = [creator.context.manualPlaceSeed(draft.referenceUrl), creator.context.lodgingDraftToEditorSeed(draft)];
  for (const seed of seeds) {
    const h = harness({ seed, address: "東京都新宿区西新宿2-2-1" });
    assert.equal(h.session.sourceMetadata.sourceReadStatus, "blocked");
    assert.equal(h.form.elements.sourceLodgingName.value, "");
    assert.equal(h.context.pendingPlacePhoto, "");
    assert.equal(h.form.querySelector("[data-lodging-source-status]").textContent, creator.context.lodgingSourceStatusMessage(draft));
    assert.match(h.form.querySelector("[data-lodging-source-status]").textContent, /Booking.com 目前無法自動讀取.*名稱.*完整地址.*照片.*原始連結已保留/);
    h.input("name", "我的新宿住宿");
    const saved = h.save(); h.reply(0); await saved;
    assert.equal(h.context.state.places[0].name, "我的新宿住宿");
    assert.equal(h.context.state.places[0].sourceLodgingName, "");
    assert.equal(h.context.state.places[0].originalReferenceUrl, draft.referenceUrl);
    assert.equal(h.context.state.places[0].sourceReadStatus, "blocked");
  }
  const direct = harness(); direct.input("referenceUrl", draft.referenceUrl);
  const read = direct.context.fillPlaceEditorFromUrl(direct.form);
  direct.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: draft }) }); await read;
  assert.equal(direct.form.querySelector("[data-lodging-source-status]").textContent, creator.context.lodgingSourceStatusMessage(draft));
});

test("manual and source-card seeds preserve explicit user fields while untouched metadata can switch", async () => {
  const originalUrl = "https://www.booking.com/hotel/jp/original.html";
  const nextUrl = "https://www.booking.com/hotel/jp/next.html";
  const userDraft = { referenceUrl: originalUrl, sourcePlatform: "Booking.com", sourceReadStatus: "available",
    sourceLodgingName: "Original Source", userProvidedName: "我的新宿住宿", address: "我的完整地址",
    customPhotoDataUrl: "my photo", photoOrigin: "user_upload", touchedFields: ["address", "photo"] };
  const creator = harness({ drafts: [userDraft] });
  const seeds = [creator.context.manualPlaceSeed(originalUrl), creator.context.lodgingDraftToEditorSeed(userDraft)];
  for (const seed of seeds) {
    assert.deepEqual(Array.from(seed.touchedFields).sort(), ["address", "name", "photo"]);
    const h = harness({ seed, address: seed.address });
    h.input("referenceUrl", nextUrl);
    const request = h.context.fillPlaceEditorFromUrl(h.form);
    h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: nextUrl, sourcePlatform: "Booking.com",
      sourceReadStatus: "available", sourceLodgingName: "Next Source Hotel", address: "Next Source Address", sourceImageDataUrl: "next source photo" } }) });
    await request;
    assert.equal(h.form.elements.name.value, "我的新宿住宿");
    assert.equal(h.form.elements.address.value, "我的完整地址");
    assert.equal(h.context.pendingPlacePhoto, "my photo"); assert.equal(h.form.elements.photoOrigin.value, "user_upload");
    assert.equal(h.form.elements.sourceLodgingName.value, "Next Source Hotel");
  }

  const untouchedDraft = { referenceUrl: originalUrl, sourcePlatform: "Booking.com", sourceReadStatus: "available",
    sourceLodgingName: "Original Source", address: "Original Source Address", sourceImageDataUrl: "original source photo" };
  const untouchedCreator = harness({ drafts: [untouchedDraft] });
  const untouchedSeed = untouchedCreator.context.manualPlaceSeed(originalUrl);
  assert.deepEqual(Array.from(untouchedSeed.touchedFields), []);
  const untouched = harness({ seed: untouchedSeed, address: untouchedSeed.address });
  untouched.input("referenceUrl", nextUrl);
  const request = untouched.context.fillPlaceEditorFromUrl(untouched.form);
  untouched.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: nextUrl, sourcePlatform: "Booking.com",
    sourceReadStatus: "available", sourceLodgingName: "Next Source Hotel", address: "Next Source Address", sourceImageDataUrl: "next source photo" } }) });
  await request;
  assert.equal(untouched.form.elements.name.value, "Next Source Hotel");
  assert.equal(untouched.form.elements.address.value, "Next Source Address");
  assert.equal(untouched.context.pendingPlacePhoto, "data:image/jpeg;base64,compressed");
  assert.equal(untouched.form.elements.photoOrigin.value, "lodging_source");
});

test("clearing an existing source clears all provenance and its photo without resurrecting referenceUrl", async () => {
  const url = "https://www.booking.com/hotel/jp/stay.html";
  const existing = { ...good, name: "我確認的住宿", manualLocation: true, manualAddress: "完整地址", referenceUrl: url,
    originalReferenceUrl: url, sourceCanonicalUrl: url, sourcePlatform: "Booking.com", sourceListingId: "123",
    sourceLodgingName: "Source Stay", sourceReadStatus: "available", sourceImageUrl: "https://cf.bstatic.com/old.jpg",
    customPhotoDataUrl: "old source photo", photoOrigin: "lodging_source" };
  const h = harness({ existing, address: existing.manualAddress });
  h.input("referenceUrl", "");
  assert.equal(h.context.removePendingPlacePhoto, true);
  assert.equal(h.form.querySelector("[data-lodging-source-status]").textContent, "");
  await h.save();
  const saved = h.context.state.places[0];
  for (const key of ["referenceUrl", "originalReferenceUrl", "sourceCanonicalUrl", "sourcePlatform", "sourceListingId", "sourceLodgingName", "sourceImageUrl", "sourceReadStatus", "customPhotoDataUrl", "photoOrigin"]) assert.equal(saved[key], "", key);
  assert.equal(saved.name, existing.name); assert.equal(saved.manualAddress, existing.manualAddress);
});

test("clearing or switching a source preserves the user's own photo, name and address", async () => {
  const url = "https://www.booking.com/hotel/jp/old.html", next = "https://www.booking.com/hotel/jp/new.html";
  const existing = { ...good, name: "我的住宿", manualLocation: true, manualAddress: "我的地址", referenceUrl: url,
    sourcePlatform: "Booking.com", sourceListingId: "123", customPhotoDataUrl: "user photo", photoOrigin: "user_upload" };
  for (const reference of ["", next]) {
    const h = harness({ existing, address: existing.manualAddress }); h.input("referenceUrl", reference);
    if (reference) {
      const request = h.context.fillPlaceEditorFromUrl(h.form);
      h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: next, sourcePlatform: "Booking.com",
        sourceLodgingName: "New Source Stay", address: "New Source Address", sourceImageDataUrl: "new source photo", sourceListingId: "456" } }) });
      await request;
    }
    await h.save(); const saved = h.context.state.places[0];
    assert.equal(saved.name, existing.name); assert.equal(saved.manualAddress, existing.manualAddress);
    assert.equal(saved.customPhotoDataUrl, "user photo"); assert.equal(saved.photoOrigin, "user_upload");
    assert.equal(saved.referenceUrl, reference); assert.equal(saved.sourceListingId, reference ? "456" : "");
  }
});

test("clearing a newly read source removes untouched source fields but keeps user edits", async () => {
  const url = "https://www.booking.com/hotel/jp/stay.html";
  const draft = { referenceUrl: url, sourcePlatform: "Booking.com", sourceLodgingName: "Source Stay", address: "Source Address", sourceImageDataUrl: "source photo" };
  for (const touched of [false, true]) {
    const h = harness({ drafts: [draft] }); h.input("referenceUrl", url); await h.context.fillPlaceEditorFromUrl(h.form);
    if (touched) { h.input("name", "My Stay"); h.input("address", "My Address"); h.session.dirty.add("photo"); h.context.pendingPlacePhoto = "my photo"; h.form.elements.photoOrigin.value = "user_upload"; }
    h.input("referenceUrl", ""); await h.advance(700);
    assert.equal(h.form.elements.name.value, touched ? "My Stay" : "");
    assert.equal(h.form.elements.address.value, touched ? "My Address" : "");
    assert.equal(h.context.pendingPlacePhoto, touched ? "my photo" : "");
    assert.equal(h.form.elements.sourcePlatform.value, "");
    assert.equal(h.session.sourceMetadata.sourceReadStatus, "");
  }
});

test("URL A to B to A rejects the earlier source photo compression even when URL matches again", async () => {
  const a = "https://www.booking.com/hotel/jp/a.html", b = "https://www.booking.com/hotel/jp/b.html";
  const seed = { referenceUrl: a, customPhotoDataUrl: "raw", photoOrigin: "lodging_source", lodgingDraft: { referenceUrl: a } };
  const h = harness(); let finish;
  h.context.compressPlacePhotoDataUrl = () => new Promise((resolve) => { finish = resolve; });
  h.form.elements.referenceUrl.value = a; h.form.elements.photoOrigin.value = "lodging_source";
  const session = h.context.bindPlaceEditor(h.form, null, seed);
  h.input("referenceUrl", b); h.input("referenceUrl", a); finish("old A photo"); await tick();
  assert.equal(h.context.pendingPlacePhoto, ""); assert.equal(session.sourceMetadata.sourceReadStatus, "unknown");
});

test("v3 automatic cache is invalidated, including underneath a current manual override", async () => {
  for (const manual of [false, true]) {
    const oldAuto = { ...good, travelAreaResolutionVersion: 3 };
    const existing = { ...oldAuto, name: "既有住宿", manualLocation: true, manualAddress: "完整地址",
      ...(manual ? { travelAreaKey: "my-area", travelAreaZh: "我的區", travelAreaLocal: "My area", travelAreaSource: "manual",
        travelAreaManuallySet: true, travelAreaResolutionVersion: 5, autoTravelArea: oldAuto } : {}) };
    const h = harness({ existing, address: existing.manualAddress });
    assert.equal(h.session.result, null); await h.advance(700); assert.equal(h.requests.length, 1);
    h.reply(0); await tick(); await h.save();
    const saved = h.context.state.places[0];
    assert.equal(saved.travelAreaResolutionVersion, 5);
    assert.equal(saved.travelAreaKey, manual ? "my-area" : good.travelAreaKey);
    assert.equal(saved.travelAreaManuallySet, manual);
    assert.equal(saved.autoTravelArea.travelAreaResolutionVersion, 5);
  }
});

test("source whitelist merges into lodging candidates without changing Google identity or selection", async () => {
  const h = harness(); h.context.importAlreadyExists = () => false;
  vm.runInContext(section("function socialGroupsToImports", "async function recognizeSocialPlace"), h.context);
  const google = { placeId: "google-123", name: "Google Stay", formattedAddress: "Google Address", latitude: 35.7, longitude: 139.7,
    sourceUrl: "https://maps.google.com/?cid=123", photos: [{ name: "places/google-123/photos/1" }], kind: "lodging", recommended: true };
  const draft = { referenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123", originalReferenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123",
    sourceCanonicalUrl: "https://www.booking.com/hotel/jp/stay.html?app_hotel_id=123", sourcePlatform: "Booking.com", sourceListingId: "123",
    sourceLodgingName: "Booking Stay", sourceReadStatus: "available", sourceImageUrl: "https://cf.bstatic.com/stay.jpg", sourceImageDataUrl: "source photo",
    placeId: "wrong", name: "wrong", formattedAddress: "wrong", latitude: 1, longitude: 2, photos: [{ name: "wrong" }], sourceUrl: "wrong" };
  const result = h.context.socialGroupsToImports({ lodgingDraft: draft, groups: [{ id: "stay", extracted: { category: "lodging" }, candidates: [google, { ...google, placeId: "other", recommended: false }] }] });
  const candidate = result.imports[0];
  for (const key of ["placeId", "name", "formattedAddress", "latitude", "longitude", "sourceUrl", "photos"]) assert.deepEqual(candidate[key], google[key]);
  for (const key of ["referenceUrl", "originalReferenceUrl", "sourceCanonicalUrl", "sourcePlatform", "sourceListingId", "sourceLodgingName", "sourceReadStatus", "sourceImageUrl"]) assert.equal(candidate[key], draft[key]);
  assert.equal(candidate.customPhotoDataUrl, draft.sourceImageDataUrl); assert.equal(candidate.photoOrigin, "lodging_source");
  assert.deepEqual(Array.from(result.imports, (p) => p.selected), [true, false]);
  assert.equal(h.context.state.places.length, 0);
  let saves = 0;
  Object.assign(h.context, { pendingPlaceImports: result.imports,
    submittablePlaceImports: (places) => places.filter((p) => p.selected),
    withStoredTabelogLink: (place) => place, persist: () => { saves += 1; },
    FormData: class { get() { return "auto"; } },
    candidateDraftStore: new Map(), endImportSession: () => {},
    CANDIDATE_DRAFT_IDENTITY_FIELDS: ["placeId", "latitude", "longitude", "photos", "sourceUrl", "formattedAddress",
      "rating", "ratingCount", "phone", "openingHours", "description", "addressComponents",
      "addressComponentsOriginal", "countryCode", "addressProvider", "locationApproximate", "coordinateFallback", "coordinateLocation"],
  });
  vm.runInContext(functionSource("importCandidateIdentity"), h.context);
  vm.runInContext(functionSource("finalizeCandidateForBatchAdd"), h.context);
  vm.runInContext(`async function submitImport(event) { ${section('if (event.target.id === "import-places-form")', 'if (event.target.id === "add-area-form")')} }`, h.context);
  await h.context.submitImport({ target: { id: "import-places-form" }, preventDefault() {} });
  assert.equal(saves, 1); assert.equal(h.context.state.places.length, 1);
  const saved = h.context.state.places[0];
  assert.equal(saved.placeId, google.placeId); assert.equal(saved.formattedAddress, google.formattedAddress);
  assert.equal(saved.originalReferenceUrl, draft.originalReferenceUrl); assert.equal(saved.sourceLodgingName, draft.sourceLodgingName);
  assert.equal(saved.sourceReadStatus, "available"); assert.equal(saved.customPhotoDataUrl, "source photo");
  assert.equal(saved.candidateGroupId, undefined); assert.equal(saved.sourceOriginalImages, undefined);
});

test("recognition compresses the source photo before attaching it to pending Google candidates", async () => {
  const h = harness(); h.context.importAlreadyExists = () => false;
  vm.runInContext(section("function socialGroupsToImports", "function updateImportConfirmState"), h.context);
  const url = "https://www.booking.com/hotel/jp/stay.html";
  const recognition = h.context.recognizeSocialPlace(url, "", "", 0, "lodging");
  h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: url, sourceImageDataUrl: "large source photo" },
    groups: [{ extracted: { category: "lodging" }, candidates: [{ name: "Google Stay", sourceUrl: "maps", placeId: "id", kind: "lodging", recommended: true }] }] }) });
  const result = await recognition;
  assert.equal(result.imports[0].customPhotoDataUrl, "data:image/jpeg;base64,compressed");
  assert.equal(result.imports[0].placeId, "id");
  assert.equal(result.imports[0].sourceImageDataUrl, undefined);
});

test("save flushes a pending source debounce instead of silently saving unread metadata", async () => {
  const h = harness({ address: "完整地址" });
  const url = "https://www.booking.com/hotel/jp/stay.html";
  h.input("referenceUrl", url); await h.save();
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].body.action, "lodging-draft");
  assert.equal(h.context.state.places.length, 0);
  h.requests[0].resolve({ ok: true, json: async () => ({ lodgingDraft: { referenceUrl: url, sourcePlatform: "Booking.com", sourceReadStatus: "blocked" } }) });
  await tick();
  const save = h.save(); h.reply(1); await save;
  assert.equal(h.context.state.places[0].sourceReadStatus, "blocked");
  assert.equal(h.context.state.places[0].sourceLodgingName, "");
});

test("lodging rematch keeps source provenance and photos while accepting only the new Google identity", async () => {
  const h = harness();
  const old = { candidateGroupId: "stay", kind: "lodging", candidateCategory: "lodging", placeId: "old-google", name: "Old Google Stay",
    referenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123", originalReferenceUrl: "https://www.booking.com/Share-stay?app_hotel_id=123",
    sourceCanonicalUrl: "", sourceListingId: "123", sourcePlatform: "Booking.com", sourceLodgingName: "Source Stay", sourceReadStatus: "available",
    customPhotoDataUrl: "source photo", photoOrigin: "lodging_source" };
  const status = { dataset: {} }, button = {}, root = { querySelector(selector) { return selector === "#import-rematch-query" ? { value: "New Google Stay" } : selector === "[data-run-import-rematch]" ? button : status; } };
  Object.assign(h.context, { pendingPlaceImports: [old], sheetRoot: { querySelector: () => root }, importAlreadyExists: () => false,
    candidateDraft() {}, importCandidateIdentity: p => p.placeId,
    closeImportRematchSheet() {}, renderImportPreview() {}, updateImportConfirmState() {} });
  vm.runInContext(section("async function rematchImportCandidateGroup", "function closeImportCandidatePreview"), h.context);
  const rematch = h.context.rematchImportCandidateGroup("stay");
  assert.deepEqual(Array.from(h.requests[0].body.excludePlaceIds), ["old-google"]);
  h.requests[0].resolve({ ok: true, json: async () => ({ candidates: [{ name: "New Google Stay", placeId: "new-google", sourceUrl: "new maps",
    formattedAddress: "New Google Address", latitude: 35.8, longitude: 139.8, photos: [{ name: "places/new-google/photos/1" }], kind: "lodging", recommended: true }] }) });
  await rematch;
  const candidate = h.context.pendingPlaceImports[0];
  assert.equal(candidate.placeId, "new-google"); assert.equal(candidate.formattedAddress, "New Google Address");
  assert.equal(candidate.photos[0].name, "places/new-google/photos/1");
  assert.equal(candidate.originalReferenceUrl, old.originalReferenceUrl); assert.equal(candidate.sourceLodgingName, "Source Stay");
  assert.equal(candidate.sourceListingId, "123"); assert.equal(candidate.sourceReadStatus, "available");
  assert.equal(candidate.customPhotoDataUrl, "source photo"); assert.equal(candidate.selected, true);
});


test("Ticket A1 approximate card has one primary message and shares editor semantics", () => {
  const h = harness();
  h.context.escapeHtml = String;
  const markup = source.slice(source.indexOf("function lodgingDraftsMarkup"), source.indexOf("function lodgingDraftsMarkup") + source.slice(source.indexOf("function lodgingDraftsMarkup")).indexOf('\nfunction ', 1));
  vm.runInContext(markup, h.context);
  h.context.pendingLodgingDrafts = [{ sourcePlatform: "Airbnb", locationPrecision: "approximate", address: "大約新宿", sourceReadStatus: "success", referenceUrl: "https://airbnb.com/rooms/1" }];
  const html = h.context.lodgingDraftsMarkup();
  assert.equal((html.match(/data-lodging-primary-message/g) || []).length, 1);
  assert.equal((html.match(/尚未取得/g) || []).length, 1);
  assert.match(html, /大約位置，不是入住地址/);
  assert.doesNotMatch(html, /已帶入來源資料|建立前必須補上/);
  assert.equal(h.context.lodgingSourceStatusMessage(h.context.pendingLodgingDrafts[0], "完整地址 1-2-3"), "");
  for (const sourceReadStatus of ["blocked", "unavailable"]) assert.match(h.context.lodgingSourceStatusMessage({ sourceReadStatus, locationPrecision: "approximate", sourcePlatform: "Booking" }), /無法自動讀取/);
  assert.match(h.context.lodgingSourceStatusMessage({ locationPrecision: "exact", referenceUrl: "https://booking.com" }), /已帶入可取得/);
});

test("Ticket A1 entering an address switches approximate notice to geocode status", async () => {
  const h = harness({ seed: { referenceUrl: "https://airbnb.com/rooms/1", lodgingDraft: { referenceUrl: "https://airbnb.com/rooms/1", sourcePlatform: "Airbnb", locationPrecision: "approximate" } } });
  const status = h.form.querySelector("[data-lodging-source-status]");
  assert.match(status.textContent, /尚未取得完整入住地址/);
  h.input("address", "完整地址 1-2-3");
  assert.equal(status.textContent, "");
  await h.advance(700);
  assert.match(h.form.querySelector("[data-place-address-status]").textContent, /定位|解析/);
  h.reply(0); await tick();
  assert.match(h.form.querySelector("[data-place-address-status]").textContent, /地址已定位/);
  assert.equal(status.textContent, "");
  h.input("address", "");
  assert.match(status.textContent, /尚未取得完整入住地址/);
  assert.equal(h.session.sourceMetadata.locationPrecision, "approximate");
});

function photoConfirmation(h) {
  let overlay;
  const focus = (item) => () => { h.context.document.activeElement = item; };
  const trigger = { closest: () => h.form }; trigger.focus = focus(trigger);
  const upload = h.form.querySelector("[data-place-photo-upload-zone]"); upload.focus = focus(upload);
  h.context.document = { createElement() {
    const buttons = {};
    overlay = { dataset: {}, listeners: {},
      querySelector(selector) { if (!buttons[selector]) { buttons[selector] = {}; buttons[selector].focus = focus(buttons[selector]); } return buttons[selector]; },
      addEventListener(type, fn) { this.listeners[type] = fn; }, remove() { this.removed = true; },
    }; return overlay;
  } };
  h.context.sheetRoot = { querySelector: () => overlay && !overlay.removed ? overlay : null, append(node) { assert.equal(node, overlay); } };
  h.context.openPlacePhotoRemovalConfirmation(trigger);
  return { overlay, trigger, click(selector) { overlay.listeners.click({ target: { closest: (value) => value === selector }, stopPropagation() {} }); } };
}

for (const photoOrigin of ["lodging_source", "user_upload"]) test(`Ticket A2 ${photoOrigin}: cancel preserves session; confirm only changes pending photo`, async () => {
  const h = harness({ seed: { customPhotoDataUrl: "photo", photoOrigin, referenceUrl: "https://airbnb.com/rooms/1", sourceLodgingName: "來源住宿" } });
  let persists = 0; h.context.persist = () => { persists++; };
  const metadata = JSON.stringify(h.session.sourceMetadata);
  const dirty = [...h.session.dirty];
  const first = photoConfirmation(h);
  assert.match(first.overlay.innerHTML, /confirm-sheet.*role="alertdialog"/);
  assert.equal(h.context.pendingPlacePhoto, "photo");
  assert.equal(h.form.placeEditorSession, h.session);
  assert.equal(h.form.inert, true);
  first.click("[data-cancel-photo-removal]");
  assert.equal(h.context.pendingPlacePhoto, "photo");
  assert.deepEqual([...h.session.dirty], dirty);
  assert.equal(JSON.stringify(h.session.sourceMetadata), metadata);
  assert.equal(h.form.elements.photoOrigin.value, photoOrigin);
  assert.equal(h.context.document.activeElement, first.trigger);
  const second = photoConfirmation(h);
  second.click("[data-confirm-photo-removal]");
  assert.equal(h.context.pendingPlacePhoto, "");
  assert.equal(h.context.removePendingPlacePhoto, true);
  assert.ok(h.session.dirty.has("photo"));
  assert.equal(h.form.elements.photoOrigin.value, "");
  assert.equal(h.form.elements.referenceUrl.value, "https://airbnb.com/rooms/1");
  assert.equal(h.form.elements.sourceLodgingName.value, "來源住宿");
  assert.equal(JSON.stringify(h.session.sourceMetadata), metadata);
  assert.equal(persists, 0);
  assert.equal(h.form.placeEditorSession, h.session);
  assert.equal(h.form.isConnected, true);
});

test("Ticket A2 late source image cannot revive confirmed removal", async () => {
  const h = harness({ seed: { customPhotoDataUrl: "photo" }, drafts: [{ referenceUrl: "https://airbnb.com/rooms/1", sourceImageDataUrl: "source", sourceLodgingName: "來源住宿" }] });
  let resolvePhoto;
  h.context.compressPlacePhotoDataUrl = () => new Promise(resolve => { resolvePhoto = resolve; });
  h.form.elements.referenceUrl.value = "https://airbnb.com/rooms/1";
  const request = h.context.fillPlaceEditorFromUrl(h.form);
  const dialog = photoConfirmation(h);
  dialog.click("[data-confirm-photo-removal]");
  resolvePhoto("late photo"); await request;
  assert.equal(h.context.pendingPlacePhoto, "");
  assert.equal(h.form.elements.photoOrigin.value, "");
  assert.ok(h.session.dirty.has("photo"));
});


test("Ticket A1 failed strict geocode owns status after address entry", async () => {
  const h = harness({ seed: { referenceUrl: "https://airbnb.com/rooms/1", lodgingDraft: { referenceUrl: "https://airbnb.com/rooms/1", locationPrecision: "approximate" } } });
  h.input("address", "未能定位的完整地址 1-2-3");
  await h.advance(700);
  h.requests[0].resolve({ ok: true, json: async () => ({ places: [] }) }); await tick();
  assert.equal(h.form.querySelector("[data-lodging-source-status]").textContent, "");
  assert.match(h.form.querySelector("[data-place-address-status]").textContent, /無法|失敗/);
  assert.equal(h.session.result, null);
});

test("Ticket A2 keyboard cancel restores focus without mutating pending state", () => {
  const h = harness({ seed: { customPhotoDataUrl: "photo", photoOrigin: "lodging_source" } });
  const dialog = photoConfirmation(h);
  let prevented = 0;
  dialog.overlay.listeners.keydown({ key: "Tab", preventDefault() { prevented++; }, stopPropagation() {} });
  assert.equal(h.context.document.activeElement, dialog.overlay.querySelector("[data-confirm-photo-removal]"));
  dialog.overlay.listeners.keydown({ key: "Escape", preventDefault() { prevented++; }, stopPropagation() {} });
  assert.equal(prevented, 2);
  assert.equal(h.context.document.activeElement, dialog.trigger);
  assert.equal(h.context.pendingPlacePhoto, "photo");
  assert.equal(h.session.dirty.has("photo"), false);
  assert.equal(h.form.elements.photoOrigin.value, "lodging_source");
});

test("Ticket A2 cached source compression cannot revive confirmed removal", async () => {
  const h = harness();
  let resolvePhoto;
  h.context.compressPlacePhotoDataUrl = () => new Promise(resolve => { resolvePhoto = resolve; });
  h.form.elements.referenceUrl.value = "https://airbnb.com/rooms/1";
  h.context.pendingPlacePhoto = "original source";
  const seed = { referenceUrl: h.form.elements.referenceUrl.value, customPhotoDataUrl: "source", lodgingDraft: { referenceUrl: h.form.elements.referenceUrl.value } };
  const session = h.context.bindPlaceEditor(h.form, null, seed);
  const dialog = photoConfirmation(h);
  dialog.click("[data-confirm-photo-removal]");
  resolvePhoto("late cached photo"); await tick();
  assert.equal(h.context.pendingPlacePhoto, "");
  assert.equal(h.form.placeEditorSession, session);
  assert.ok(session.dirty.has("photo"));
});


test("restaurant editor saves multiple tags, preserves custom values and explicit clearing", async () => {
  const existing = { name: "餐廳", kind: "restaurant", category: "餐廳", restaurantTags: ["燒肉", "日式"], formattedAddress: "地址" };
  const h = harness({ existing, address: "地址" });
  h.form.checkedTags = ["壽喜燒", "日式"];
  const saving = h.save();
  h.reply(0);
  await saving;
  assert.deepEqual(Array.from(h.context.state.places[0].restaurantTags), ["壽喜燒", "日式"]);
  const cleared = harness({ existing: h.context.state.places[0], address: "地址" });
  cleared.form.checkedTags = [];
  const savingClear = cleared.save();
  if (cleared.requests.length) cleared.reply(0);
  await savingClear;
  assert.deepEqual(Array.from(cleared.context.state.places[0].restaurantTags), []);
});


test("editing only restaurant tags preserves exact Google identity, address and photos without a request", async () => {
 const existing = { name: "Google餐廳", kind: "restaurant", category: "燒肉", placeId: "ChIJExact", photos: [{ name: "places/ChIJExact/photos/p" }], formattedAddress: "原地址", sourceUrl: "https://www.google.com/maps/?cid=123", latitude: 35.6, longitude: 139.7 };
 const before = JSON.parse(JSON.stringify(existing));
 const h = harness({ existing, address: "" });
 h.form.checkedTags = ["牛排", "日式"];
 h.session.dirty.add("restaurantTags");
 await h.save();
 assert.equal(h.requests.length, 0);
 const saved = h.context.state.places[0];
 assert.deepEqual(Array.from(saved.restaurantTags), ["牛排", "日式"]);
 assert.equal(saved.restaurantTagsSource, "manual");
 for (const key of Object.keys(before)) assert.deepEqual(saved[key], before[key]);
 const clear = harness({ existing: saved, address: "" });
 clear.form.checkedTags = []; clear.session.dirty.add("restaurantTags");
 await clear.save();
 assert.equal(clear.requests.length, 0);
 assert.deepEqual(Array.from(clear.context.restaurantTagValues(JSON.parse(JSON.stringify(saved)))), []);
});


test("area tag chips edit only the draft, allow removal/clear, and save without geocoding or identity changes", async () => {
 const existing={id:"original",name:"原 Place",kind:"attraction",placeId:"ChIJExact",formattedAddress:"",address:"original",addressComponents:[{longText:"神宮前",types:["neighborhood"]}],latitude:35.7,longitude:139.7,photos:[{name:"exact"}],googleMapsUrl:"https://maps.google.com/exact",restaurantTags:["custom"],lodging:{x:1},shopping:{x:2},travelAreaKey:"unclassified:original",areaTags:["手動區"]};
 const before=structuredClone(existing);
 const h=harness({existing,address:""});
 h.context.state.places.push({name:"other",areaTags:["表參道"]});
 h.context.renderAreaTagDraft(h.form);
 const dropdown=h.form.querySelector("[data-area-tags-suggestions]");
 assert.equal(dropdown.hidden,true);assert.equal(dropdown.innerHTML,"");
 const tagInput=h.form.querySelector("[data-area-tag-input]");tagInput.fire("focus");
 assert.match(h.form.querySelector("[data-area-tags-selected]").innerHTML,/神宮前/);assert.equal(dropdown.hidden,true);assert.doesNotMatch(dropdown.innerHTML,/表參道/);
 tagInput.value="表";tagInput.fire("input");
 assert.match(dropdown.innerHTML,/表參道/);assert.doesNotMatch(dropdown.innerHTML,/神宮前/);
 assert.deepEqual(existing,before,"opening and suggestions cannot persist");
 const click=(data)=>h.form.querySelector("[data-area-tag-editor]").fire("click",{target:{closest:()=>({dataset:data,hasAttribute:()=>false})}});
 click({areaTagChoose:"表參道"});click({areaTagChoose:"表參道"});
 assert.deepEqual(Array.from(h.session.areaTags),["手動區","表參道"]);
 assert.deepEqual(existing,before);
 assert.equal(h.form.querySelector('button[type="submit"]').formNoValidate,true,"optional tags save even with an old missing address");
 await h.save();
 assert.equal(h.requests.length,0);
 assert.deepEqual(JSON.parse(JSON.stringify(existing)),{...before,areaTags:["手動區","表參道"]});
 const cleared=harness({existing,address:""});
 for(const tag of existing.areaTags) cleared.form.querySelector("[data-area-tag-editor]").fire("click",{target:{closest:()=>({dataset:{areaTagToggle:tag},hasAttribute:()=>false})}});
 assert.deepEqual(Array.from(cleared.session.areaTags),[]);
 await cleared.save();
 assert.deepEqual(JSON.parse(JSON.stringify(existing)),{...before,areaTags:[]});
 assert.equal(cleared.requests.length,0);
});

test("custom area tags use Enter/add/save, trim and dedupe; cancelling never changes the Place", async () => {
 const existing={name:"old",kind:"shopping",areaTags:[]};
 const h=harness({existing,address:""});
 const input=h.form.querySelector("[data-area-tag-input]");
 input.value="  ＣＡＦＥ  ";let prevented=false;
 input.fire("keydown",{key:"Enter",isComposing:false,preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.deepEqual(Array.from(h.session.areaTags),["ＣＡＦＥ"]);
 input.value="cafe";h.context.addAreaTagInput(h.form);
 assert.deepEqual(Array.from(h.session.areaTags),["ＣＡＦＥ"]);
 assert.deepEqual(existing.areaTags,[]);
 h.context.closeSheet();assert.deepEqual(existing.areaTags,[]);
 const saved=harness({existing,address:""});
 saved.form.querySelector("[data-area-tag-input]").value="  自訂旅遊周邊 ";
 await saved.save();assert.deepEqual(Array.from(existing.areaTags),["自訂旅遊周邊"]);
 assert.equal(saved.requests.length,0);
});

test("general save preserves manual tags while legacy area changes and never copies an untouched suggestion", async () => {
 for(const tags of [undefined,[],["手動周邊","原宿"]]) {
  const existing={name:"Place",kind:"attraction",formattedAddress:"舊地址",...(tags===undefined?{}:{areaTags:tags}),addressComponents:[{longText:"外神田",types:["neighborhood"]}]};
  const h=harness({existing,address:"新地址"});
  const saving=h.save();h.reply(0);await saving;
  const result=h.context.state.places[0];
  assert.deepEqual(result.areaTags,tags);
  assert.equal(result.travelAreaKey,"shinjuku");
 }
 const h=harness({address:"新地址"});
 h.form.querySelector("[data-area-tag-input]").value="原宿";
 h.context.addAreaTagInput(h.form);
 const saving=h.save();h.reply(0);await saving;
 assert.deepEqual(Array.from(h.context.state.places[0].areaTags),["原宿"]);
});

test("editing area and restaurant tags together saves both without changing any other field", async () => {
 const existing={name:"Exact",kind:"restaurant",placeId:"ChIJExact",photos:[{name:"exact"}],restaurantTags:["日式"],areaTags:["原宿"]};
 const before=structuredClone(existing);const h=harness({existing,address:""});
 h.form.checkedTags=["牛排"];h.session.dirty.add("restaurantTags");
 h.form.querySelector("[data-area-tag-input]").value="表參道";
 await h.save();
 assert.deepEqual(JSON.parse(JSON.stringify(existing)),{...before,restaurantTags:["牛排"],restaurantTagsSource:"manual",areaTags:["原宿","表參道"]});
 assert.equal(h.requests.length,0);
});


test("pending custom input bypasses address validation only for an otherwise unchanged saved Place", () => {
 const h=harness({existing:{name:"Old",kind:"attraction"},address:""});
 const input=h.form.querySelector("[data-area-tag-input]");input.value="自訂區";
 h.form.fire("input",{target:input});
 assert.equal(h.form.querySelector('button[type="submit"]').formNoValidate,true);
 h.input("name","Changed");
 assert.equal(h.form.querySelector('button[type="submit"]').formNoValidate,false);
});


test("area tag autocomplete requires input for trip tags, excludes selected, and closes on blur/Escape without changing data", () => {
 const existing={name:"Test",kind:"attraction",areaTags:["銀座"],addressComponents:[{longText:"芝",types:["neighborhood"]}]};
 const before=structuredClone(existing);const h=harness({existing,address:""});
 h.context.state.places.push({name:"Other",areaTags:["銀座","銀座周邊","西新宿","CAFÉ"]});
 const input=h.form.querySelector("[data-area-tag-input]");const popup=h.form.querySelector("[data-area-tags-suggestions]");
 assert.equal(popup.hidden,true);assert.equal(input.attributes["aria-expanded"],"false");
 input.fire("focus");assert.match(h.form.querySelector("[data-area-tags-selected]").innerHTML,/芝/);assert.equal(popup.hidden,true);assert.doesNotMatch(popup.innerHTML,/銀座|西新宿/);
 input.value="銀";input.fire("input");
 assert.deepEqual(Array.from(h.session.areaTagOptions),["銀座周邊"]);
 assert.doesNotMatch(popup.innerHTML,/data-area-tag-choose="銀座"/);
 input.value="cafe\u0301";input.fire("input");assert.deepEqual(Array.from(h.session.areaTagOptions),["CAFÉ"]);
 input.value="";input.fire("input");assert.deepEqual(Array.from(h.session.areaTagOptions),[]);
 input.fire("blur");assert.equal(popup.hidden,true);assert.equal(popup.innerHTML,"");
 input.fire("focus");input.fire("keydown",{key:"Escape"});assert.equal(popup.hidden,true);
 assert.deepEqual(existing,before);assert.equal(h.session.dirty.has("areaTags"),false);
});

test("autocomplete supports touch selection and keyboard navigation without native input hacks or saving before confirmation", () => {
 const existing={name:"Test",kind:"attraction",areaTags:[]};const before=structuredClone(existing);const h=harness({existing,address:""});
 h.context.state.places.push({name:"Other",areaTags:["銀座","銀座周邊"]});
 const input=h.form.querySelector("[data-area-tag-input]");const editor=h.form.querySelector("[data-area-tag-editor]");
 input.value="銀";input.fire("input");let prevented=0;
 input.fire("keydown",{key:"ArrowUp",preventDefault(){prevented++;}});
 assert.equal(input.attributes["aria-activedescendant"],"area-tag-option-1");
 input.fire("keydown",{key:"ArrowDown",preventDefault(){prevented++;}});
 assert.equal(input.attributes["aria-activedescendant"],"area-tag-option-0");
 input.fire("keydown",{key:"Enter",isComposing:true,preventDefault(){throw Error("IME interrupted");}});
 assert.deepEqual(Array.from(h.session.areaTags),[]);
 input.fire("keydown",{key:"Enter",preventDefault(){prevented++;}});
 assert.deepEqual(Array.from(h.session.areaTags),["銀座"]);assert.equal(input.value,"");
 assert.deepEqual(existing,before);assert.equal(prevented,3);
 input.value="周";input.fire("input");
 editor.fire("pointerdown",{target:{closest:()=>({})},preventDefault(){prevented++;}});
 editor.fire("click",{target:{closest:()=>({dataset:{areaTagChoose:"銀座周邊"},hasAttribute:()=>false})}});
 assert.deepEqual(Array.from(h.session.areaTags),["銀座","銀座周邊"]);assert.equal(prevented,4);
 assert.equal(h.form.querySelector("[data-area-tags-suggestions]").hidden,true);
 assert.deepEqual(existing,before);
});

test("empty options hide; custom chips stay available after toggle; controls remain stable", () => {
 const h=harness({existing:{name:"Test",kind:"attraction",areaTags:[]},address:"原地址"});
 const selected=h.form.querySelector("[data-area-tags-selected]");const input=h.form.querySelector("[data-area-tag-input]");
 const popup=h.form.querySelector("[data-area-tags-suggestions]");const address=h.form.elements.address;
 assert.equal(selected.innerHTML,"");input.value="銀座";h.context.addAreaTagInput(h.form);
 assert.match(selected.innerHTML,/data-area-tag-toggle="銀座"/);
 h.form.querySelector("[data-area-tag-editor]").fire("click",{target:{closest:()=>({dataset:{areaTagToggle:"銀座"},hasAttribute:()=>false})}});
 assert.match(selected.innerHTML,/aria-pressed="false"/);assert.equal(input,h.form.querySelector("[data-area-tag-input]"));
 assert.equal(popup,h.form.querySelector("[data-area-tags-suggestions]"));assert.equal(address,h.form.elements.address);assert.equal(address.value,"原地址");
 const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
 assert.match(css,/\[data-area-tags-selected\]\[hidden\] \{ display: none;/);
 assert.match(css,/\.restaurant-tag-options label,\s*\.area-tag-chips button \{[^}]*min-height: 44px/);
 assert.match(css,/\.area-tag-chips \{[^}]*flex-wrap: wrap/);
 assert.match(css,/\.area-tag-autocomplete \{ position: relative;/);
 assert.match(css,/\[data-area-tags-suggestions\] \{ position: absolute;[^}]*top: calc\(100% \+ 4px\)/);
 assert.match(css,/\[data-area-tags-suggestions\]\[hidden\] \{ display: none;/);
 const html=h.context.areaTagEditor();
 assert.ok(html.indexOf('data-area-tags-selected')<html.indexOf('data-area-tag-input'));
 assert.ok(html.indexOf('data-area-tag-input')<html.indexOf('data-area-tags-suggestions'));
});


test("HERE Tokyo structured and Booking formatted suggestions appear in the unified options before focus and never auto-save", async () => {
 const raw="Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072";
 const c=(longText)=>({longText,types:["sublocality_level_2"]});
 for(const existing of [
  {name:"HERE ! tokyo",areaTags:[],countryCode:"JP",formattedAddress:"3-chōme-10-1 Ōkubo, Shinjuku City, Tokyo 169-0072",addressComponents:[{longText:"3-chōme",types:["sublocality_level_3"]},c("Ōkubo"),{longText:"Shinjuku City",types:["locality"]}],addressComponentsOriginal:[c("大久保")]},
  {name:"自由之家",areaTags:[],formattedAddress:raw},
 ]) {
  const before=structuredClone(existing);const h=harness({existing,address:existing.formattedAddress});
  const relevant=h.form.querySelector("[data-area-tags-selected]");const popup=h.form.querySelector("[data-area-tags-suggestions]");
  const expected=existing.name==="自由之家"?"Okubo":"大久保";
  assert.match(relevant.innerHTML,new RegExp('data-area-tag-toggle="'+expected+'"'));
  assert.doesNotMatch(relevant.innerHTML,/chōme|Chome|Shinjuku|Tokyo|169/);
  assert.equal(popup.hidden,true);assert.deepEqual(existing,before);assert.deepEqual(Array.from(h.session.areaTags),[]);
  h.form.querySelector("[data-area-tag-editor]").fire("click",{target:{closest:()=>({dataset:{areaTagToggle:expected},hasAttribute:()=>false})}});
  assert.deepEqual(existing,before);assert.match(relevant.innerHTML,/aria-pressed="true"/);
  await h.save();assert.equal(h.requests.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(existing)),{...before,areaTags:[expected]});
 }
 const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
 assert.doesNotMatch(css,/\.area-tag-address-suggestions/);
 const h=harness({existing:{name:"Test"},address:""});const html=h.context.areaTagEditor();
 assert.doesNotMatch(html,/data-area-tag-address-suggestions/);
 assert.ok(html.indexOf("data-area-tags-selected")<html.indexOf("data-area-tag-input"));
});

test("editor reuses the trip's exact localized display label and matches romanized queries without duplicate selections", () => {
 const c=longText=>({longText,types:["sublocality_level_2"]});
 const existing={name:"HERE",areaTags:[],countryCode:"JP",addressComponents:[c("Ōkubo")],addressComponentsOriginal:[c("大久保")]};
 const h=harness({existing,address:""});h.context.state.places.push({name:"Tagged",areaTags:["大久保"]});
 h.context.renderAreaTagDraft(h.form);assert.match(h.form.querySelector("[data-area-tags-selected]").innerHTML,/大久保/);
 const input=h.form.querySelector("[data-area-tag-input]");input.value="Okubo";input.fire("input");
 assert.deepEqual(Array.from(h.session.areaTagOptions),["大久保"]);
 h.context.addAreaTagInput(h.form);assert.deepEqual(Array.from(h.session.areaTags),["大久保"]);
 input.value="Ōkubo";input.fire("input");assert.deepEqual(Array.from(h.session.areaTagOptions),[]);
 h.context.addAreaTagInput(h.form);assert.deepEqual(Array.from(h.session.areaTags),["大久保"]);
 assert.deepEqual(existing.areaTags,[]);
});

test("real Booking address-suggestion integration: a typed/pasted or async-recognized address reaches the suggestion row through the actual editor pipeline, survives Travel Area resolving to Shinjuku, and the saved place still offers it on reopen", async () => {
 const bookingAddress="Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072";
 const forbidden=/Room 202|\bChome\b|Shinjuku-ku|T[oō]kyo-to|169-0072/i;
 const suggestionRow=(h)=>h.form.querySelector("[data-area-tags-selected]");

 // A real user typing/pasting the full address (native "input" events, no direct value set)
 // must reach the suggestion row without ever opening/focusing the trip-tag autocomplete.
 const typed=harness({});
 typed.input("address",bookingAddress);
 assert.match(suggestionRow(typed).innerHTML,/data-area-tag-toggle="Okubo"/);
 assert.doesNotMatch(suggestionRow(typed).innerHTML,forbidden);

 // A Booking share-link recognition draft fills the address via a direct DOM value assignment
 // (fillPlaceEditorFromUrl), which fires no "input" event at all -- this is the path that was
 // silently stale before this round's fix.
 const draftUrl="https://www.booking.com/hotel/jp/jiyuu-no-ie.html";
 const imported=harness({drafts:[{referenceUrl:draftUrl,sourceLodgingName:"自由之家",sourcePlatform:"Booking.com",address:bookingAddress}]});
 imported.form.elements.referenceUrl.value=draftUrl;
 await imported.context.fillPlaceEditorFromUrl(imported.form);
 assert.equal(imported.form.elements.address.value,bookingAddress);
 assert.match(suggestionRow(imported).innerHTML,/data-area-tag-toggle="Okubo"/);
 assert.doesNotMatch(suggestionRow(imported).innerHTML,forbidden);

 // Travel Area resolving to 新宿 (a different, coarser domain concept) must never suppress the
 // finer Okubo areaTags candidate once the geocode confirms the same real Google address.
 await typed.advance(700);
 assert.equal(typed.requests.length,1);
 const okuboGeocode={latitude:35.7008698,longitude:139.7030542,countryCode:"JP",
  formattedAddress:"1-chōme-16-19 Ōkubo, Shinjuku City, Tokyo 169-0072",
  addressComponents:[{longText:"1 Chome",types:["sublocality_level_2","sublocality","political"]},{longText:"Ōkubo",types:["sublocality_level_1","sublocality","political"]},{longText:"Shinjuku City",types:["locality","political"]}],
  addressComponentsOriginal:[{longText:"1丁目",types:["sublocality_level_2","sublocality","political"]},{longText:"大久保",types:["sublocality_level_1","sublocality","political"]},{longText:"新宿区",types:["locality","political"]}],
  travelAreaKey:"shinjuku",travelAreaZh:"新宿",travelAreaLocal:"新宿",travelAreaResolved:true,travelAreaSource:"automatic",travelAreaResolver:"JP_NAMED_AREA",travelAreaResolutionVersion:5};
 typed.reply(0,okuboGeocode);
 await tick();await tick();
 assert.match(suggestionRow(typed).innerHTML,/data-area-tag-toggle="Okubo"/);
 assert.doesNotMatch(suggestionRow(typed).innerHTML,forbidden);

 // Save, then reopen the persisted place: the suggestion must keep working from real saved
 // evidence (manualAddress/formattedAddress/addressComponents), not from in-progress resolver state.
 await typed.save();
 assert.equal(typed.context.state.places.length,1);
 const persisted=typed.context.state.places[0];
 assert.equal(persisted.manualAddress,bookingAddress);
 assert.equal(persisted.formattedAddress,okuboGeocode.formattedAddress);
 const reopened=harness({existing:persisted});
 assert.match(suggestionRow(reopened).innerHTML,/data-area-tag-toggle="(Okubo|Ōkubo|大久保)"/);
 assert.doesNotMatch(suggestionRow(reopened).innerHTML,forbidden);
});
