import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const helpers = section("function manualPlaceSeed", "async function compressPlacePhoto(file)");
const editorValueHelpers = section("function defaultPlaceCategory", "function openPlaceEditSheet");
const submit = section('if (event.target.id === "place-editor-form")', 'if (event.target.id === "shopping-item-form")');
const good = { latitude: 35.7, longitude: 139.7, formattedAddress: "Google 標準地址 1-2-3", countryCode: "JP",
  travelAreaKey: "shinjuku", travelAreaZh: "新宿", travelAreaLocal: "新宿", travelAreaResolved: true,
  travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
const tick = () => new Promise((resolve) => setImmediate(resolve));

function harness({ existing = null, drafts = [], address = "", seed = {}, formName } = {}) {
  const timers = new Map();
  let time = 0, timerId = 0;
  const requests = [], toasts = [];
  const node = (value = "") => ({ value, disabled: false, hidden: false, textContent: "", placeholder: "", dataset: {}, clickCount: 0, listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; }, fire(type, event = {}) { return this.listeners[type]?.(event); }, click() { this.clickCount += 1; } });
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
  const context = vm.createContext({ URL, console, pendingLodgingDrafts: drafts, pendingPlacePhoto: seed.customPhotoDataUrl || "", removePendingPlacePhoto: false,
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
    FormData: class { constructor(form) { this.values = Object.fromEntries(Object.entries(form.elements).map(([key, node]) => [key, node.value])); } get(key) { return this.values[key]; } },
  });
  vm.runInContext(section("const TRAVEL_AREA_RESOLUTION_VERSION", "function placeVoters") + helpers + editorValueHelpers + `\nasync function submitEditor(event) { ${submit} }`, context);
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
  });
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
