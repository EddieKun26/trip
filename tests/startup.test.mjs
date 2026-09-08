import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const member = (id = "alice") => ({ id, nickname: id, authVersion: 2 });
const activeKey = (id = "alice") => `active-trip-v2:${id}`;
const tabKey = (trip = "b", id = "alice") => `trip-ui-v1:${id}:${trip}`;
const trip = (id = "b", title = "測試旅程", revision = 1) => ({ id, title, destination: "大阪",
  startDate: "2026-09-20", endDate: "2026-09-23", places: [], flights: [], itinerary: {}, votes: {},
  members: { alice: "alice", bob: "bob" }, revision, ownerId: "alice" });
const tick = () => new Promise((resolve) => setImmediate(resolve));

// Execute the complete shipped script, including its actual startApp() call and DOM
// renderers. Only browser primitives/network/storage are fakes; no startup, auth,
// persistence, preference, trip, or shopping helper is replaced.
function browser({ profile = member(), stored = {}, href = "https://trip.test/" } = {}) {
  const storage = new Map(Object.entries({ "tokyo-clean-test-data-v4": "done",
    "tokyo-profile-v1": JSON.stringify(profile), ...stored }));
  const writes = [], requests = [], frames = [], listeners = {}, timers = new Map();
  let context, timerId = 0, now = 0;
  const node = () => ({ innerHTML: "", textContent: "", dataset: {}, style: {}, scrollTop: 0,
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, removeAttribute() {}, addEventListener() {}, focus() {}, remove() {},
    insertAdjacentHTML(_, html) { this.innerHTML += html; } });
  const canvas = () => ({ ...node(), getContext: () => ({ drawImage() {}, fillRect() {} }),
    toDataURL: () => "data:image/jpeg;base64,compressed" });
  const app = node(), sheet = node(), toast = node();
  let html = "";
  Object.defineProperty(app, "innerHTML", { get: () => html, set(value) {
    html = value;
    const state = vm.runInContext("state", context);
    frames.push({ html, id: state.tripId, memberId: state.profile?.id, title: state.tripTitle,
      tab: state.activeTab, status: state.hydrationStatus });
  } });
  const tabs = ["overview", "places", "itinerary", "shopping"].map((tab) => ({ ...node(), dataset: { tab } }));
  const location = new URL(href);
  const session = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem(key, value) { writes.push({ key, value }); storage.set(key, value); },
    removeItem(key) { writes.push({ key, removed: true }); storage.delete(key); },
  };
  const setTimeout = (fn, ms = 0) => { const id = ++timerId; timers.set(id, { fn, ms, at: now + ms }); return id; };
  context = vm.createContext({ console, URL, URLSearchParams, AbortController,
    FormData: class {
      constructor(form) { this.values = form.values || {}; }
      get(key) { return this.values[key] ?? null; }
      getAll(key) { return this.values[key] || []; }
    },
    FileReader: class { readAsDataURL() { this.result = "data:image/jpeg;base64,input"; this.onload(); } },
    Image: class { naturalWidth = 800; naturalHeight = 600; set src(value) { this.onload(); } },
    crypto: { randomUUID: () => "test-uuid" }, localStorage,
    sessionStorage: { getItem: (key) => session.get(key) ?? null, setItem: (key, value) => session.set(key, value), removeItem: (key) => session.delete(key) },
    navigator: { userAgent: "test", language: "zh-TW" },
    MutationObserver: class { observe() {} },
    document: { hidden: false, body: node(), documentElement: node(),
      querySelector: (selector) => ({ "#app": app, "#sheet-root": sheet, "#toast-root": toast }[selector] || null),
      querySelectorAll: (selector) => selector === ".tab" ? tabs : [],
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, createElement: (tag) => tag === "canvas" ? canvas() : node() },
    window: { location, history: { state: null, replaceState() {} }, innerWidth: 390,
      setTimeout, clearTimeout: (id) => timers.delete(id), setInterval() {}, addEventListener() {},
      requestAnimationFrame() {}, matchMedia: () => ({ matches: false }) },
    setTimeout, clearTimeout: (id) => timers.delete(id), requestAnimationFrame() {},
    fetch(url, options = {}) {
      if (options.method === "HEAD") return Promise.resolve({ ok: true, headers: { get: () => "test" } });
      return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject, replied: false }));
    },
  });
  vm.runInContext(source, context);
  return { context, storage, writes, requests, frames, app, sheet, toast, listeners,
    state: vm.runInContext("state", context), run: (code) => vm.runInContext(code, context),
    pending(url) { const request = requests.find((r) => r.url === url && !r.replied); assert.ok(request, `Missing request: ${url}`); return request; },
    async reply(request, payload, status = 200) {
      if (typeof request === "string") request = this.pending(request);
      request.replied = true;
      request.resolve({ status, ok: status >= 200 && status < 300, json: async () => payload });
      await tick();
    },
    async list(ids = ["a", "b"]) { await this.reply("/api/trips", { trips: ids.map((id) => ({ id })) }); },
    async ready(id = "b", payload = trip(id)) { await this.reply(requests.filter((r) => r.url === `/api/trip?id=${id}` && !r.replied).at(-1), payload); },
    realFrames() { return frames.filter((frame) => frame.status === "ready" && frame.id); },
    async timeoutRequests() {
      // Trigger the production network deadline without running unrelated scheduled
      // travel-area/background work or sleeping in the test process.
      now += 20000;
      for (const [id, timer] of [...timers]) if (timer.ms === 20000 && timer.at <= now) { timers.delete(id); timer.fn(); }
      await tick();
    },
  };
}

test("reload executes the real startup: neutral loading, then correct trip and saved tab as first real frame", async () => {
  const b = browser({ stored: { [activeKey()]: JSON.stringify("b"), [tabKey()]: JSON.stringify({ mainTab: "places" }) } });
  assert.match(b.app.innerHTML, /正在載入你的旅程/);
  assert.equal(b.state.tripId, "");
  assert.equal(b.state.tripTitle, "");
  assert.equal(b.realFrames().length, 0);
  await b.list();
  assert.equal(b.realFrames().length, 0);
  await b.ready();
  assert.equal(b.realFrames()[0].title, "測試旅程");
  assert.equal(b.realFrames()[0].tab, "places");
  assert.ok(b.frames.every((f) => !f.html.includes("東京 7 日")));
  assert.equal(b.state.shoppingLoaded, false, "trip must render before shopping responds");
  assert.ok(b.pending("/api/shopping?tripId=b"));
});

test("persist and save APIs cannot write placeholder state before hydration, including after trip selection", async () => {
  const b = browser({ stored: { "active-trip-v1": "b", "trip-cache-v1:b": "existing-cache" } });
  b.run('persist(); saveSharedTrip(); saveShopping();');
  await b.list();
  b.run('persist(); saveSharedTrip(); saveShopping();');
  assert.equal(b.writes.length, 0);
  assert.ok(b.requests.every((r) => r.options.method !== "PUT"));
  await b.ready();
  assert.equal(b.storage.get("trip-cache-v1:b"), "existing-cache");
  assert.ok(b.writes.every((w) => !w.key.startsWith("trip-cache-v1:")));
  assert.equal(JSON.parse(b.storage.get(activeKey())), "b");
});

test("invalid last trip selects an authorized fallback and never reads its obsolete cache", async () => {
  const b = browser({ stored: { [activeKey()]: JSON.stringify("removed"), "trip-cache-v1:removed": JSON.stringify(trip("removed", "東京 7 日")) } });
  await b.list();
  await b.ready("a", trip("a", "正確的 fallback"));
  assert.equal(b.realFrames()[0].id, "a");
  assert.equal(JSON.parse(b.storage.get(activeKey())), "a");
  assert.ok(!b.requests.some((r) => r.url === "/api/trip?id=removed"));
});

for (const status of [403, 404]) {
  test(`trip ${status} falls back once per candidate without showing inaccessible content`, async () => {
    const b = browser({ stored: { [activeKey()]: JSON.stringify("b") } });
    await b.list();
    await b.reply("/api/trip?id=b", {}, status);
    assert.equal(b.realFrames().length, 0);
    await b.ready("a");
    assert.equal(b.realFrames()[0].id, "a");
    assert.deepEqual(b.state.trips.map((t) => t.id).join(), "a");
  });
}

test("all stale trip IDs and an empty list terminate in an empty state without a loading loop", async () => {
  for (const ids of [[], ["a", "b"]]) {
    const b = browser();
    await b.list(ids);
    for (const id of ids) await b.reply(`/api/trip?id=${id}`, {}, 404);
    assert.equal(b.state.hydrationStatus, "ready");
    assert.equal(b.state.tripId, "");
    assert.equal(b.realFrames().length, 0);
    assert.doesNotMatch(b.app.innerHTML, /正在載入你的旅程|東京 7 日/);
    assert.equal(b.requests.filter((r) => r.url === "/api/trips").length, 1);
  }
});

test("401 at list, trip, or shopping clears private state and opens login", async () => {
  for (const stage of ["list", "trip", "shopping"]) {
    const b = browser();
    if (stage !== "list") await b.list(["b"]);
    if (stage === "shopping") await b.ready();
    await b.reply(stage === "list" ? "/api/trips" : stage === "trip" ? "/api/trip?id=b" : "/api/shopping?tripId=b", {}, 401);
    assert.equal(b.state.profile, null);
    assert.equal(b.state.tripId, "");
    assert.equal(b.state.shopping.items.length, 0);
    assert.equal(b.state.hydrationStatus, "ready");
    assert.match(b.sheet.innerHTML, /profile-form/);
    assert.doesNotMatch(b.app.innerHTML, /東京 7 日/);
  }
});

test("slow network reaches a bounded error with retry; a timed-out response cannot revive startup", async () => {
  for (const stage of ["list", "trip"]) {
    const b = browser();
    if (stage === "trip") await b.list(["b"]);
    const pending = b.pending(stage === "list" ? "/api/trips" : "/api/trip?id=b");
    assert.match(b.app.innerHTML, /正在載入你的旅程/);
    await b.timeoutRequests();
    assert.equal(b.state.hydrationStatus, "error");
    assert.match(b.app.innerHTML, /data-retry-startup/);
    assert.equal(b.realFrames().length, 0);
    await b.reply(pending, stage === "list" ? { trips: [{ id: "b" }] } : trip());
    assert.equal(b.state.hydrationStatus, "error");
    b.run("startApp()");
    await b.list(["b"]);
    await b.ready();
    assert.equal(b.state.hydrationStatus, "ready");
  }
});

test("HTTP failures and invalid trip payloads show retry rather than a fake trip", async () => {
  for (const stage of ["list403", "list500", "trip500", "wrongId", "badPlaces"]) {
    const b = browser();
    if (stage.startsWith("list")) await b.reply("/api/trips", {}, stage === "list403" ? 403 : 500);
    else {
      await b.list(["b"]);
      await b.reply("/api/trip?id=b", stage === "wrongId" ? trip("wrong") : { ...trip(), places: null }, stage === "trip500" ? 500 : 200);
    }
    assert.equal(b.state.hydrationStatus, "error", stage);
    assert.equal(b.realFrames().length, 0, stage);
    assert.ok(b.writes.every((w) => !w.key.startsWith("trip-cache")));
  }
});

test("tab allowlist and corrupt member/trip preferences fall back safely", async () => {
  for (const value of ['{broken', 'null', '[]', '"shopping"', '{"mainTab":"removed"}', '{"mainTab":{}}']) {
    const b = browser({ stored: { [activeKey()]: '{broken', [tabKey("a")]: value } });
    await b.list(["a"]);
    await b.ready("a");
    assert.equal(b.realFrames()[0].tab, "overview", value);
  }
  for (const tab of ["overview", "places", "itinerary", "shopping"]) {
    const b = browser({ stored: { [tabKey()]: JSON.stringify({ mainTab: tab }) } });
    await b.list(["b"]); await b.ready();
    assert.equal(b.realFrames()[0].tab, tab);
    await b.run('setTab("places")');
    assert.equal(JSON.parse(b.storage.get(tabKey())).mainTab, "places");
  }
});

test("a legacy active trip hint migrates only for the member present at boot", async () => {
  const b = browser({ stored: { "active-trip-v1": "b" } });
  await b.list(); await b.ready();
  assert.equal(b.state.tripId, "b");
  b.state.profile = member("bob");
  b.run("loadTrips()");
  await b.list(); await b.ready("a");
  assert.equal(b.state.tripId, "a");
  assert.equal(JSON.parse(b.storage.get(activeKey("bob"))), "a");
  assert.equal(JSON.parse(b.storage.get(activeKey("alice"))), "b");
});

test("member switching ignores late authorized lists and late trips from the previous member", async () => {
  for (const stage of ["list", "trip"]) {
    const b = browser({ stored: { [activeKey()]: JSON.stringify("b"), [activeKey("bob")]: JSON.stringify("a"), [tabKey("a", "bob")]: '{"mainTab":"itinerary"}' } });
    if (stage === "trip") await b.list();
    const stale = b.pending(stage === "list" ? "/api/trips" : "/api/trip?id=b");
    b.state.profile = member("bob");
    b.run("loadTrips()");
    const freshList = b.requests.filter((r) => r.url === "/api/trips").at(-1);
    await b.reply(freshList, { trips: [{ id: "a" }] });
    await b.ready("a", trip("a", "Bob 的旅程"));
    await b.reply(stale, stage === "list" ? { trips: [{ id: "b" }] } : trip("b", "Alice 的旅程", 99));
    assert.equal(b.state.tripId, "a");
    assert.equal(b.state.tripTitle, "Bob 的旅程");
    assert.equal(b.state.activeTab, "itinerary");
    assert.ok(b.realFrames().every((f) => f.memberId === "bob"));
  }
});

test("trip A to B to A rejects old trip and shopping responses even when IDs match again", async () => {
  const b = browser();
  await b.list(); await b.ready("a");
  const oldShopping = b.pending("/api/shopping?tripId=a");
  b.run("loadSharedTrip({ force: true })");
  const oldTrip = b.pending("/api/trip?id=a");
  b.run('switchTrip("b")'); await b.ready("b");
  b.run('switchTrip("a")'); await b.ready("a", trip("a", "最新 A", 3));
  const freshShopping = b.requests.filter((r) => r.url === "/api/shopping?tripId=a").at(-1);
  await b.reply(freshShopping, { items: [], revision: 3 });
  await b.reply(oldShopping, { items: [{ id: "old", name: "不應顯示" }], revision: 99 });
  await b.reply(oldTrip, trip("a", "舊 A", 99));
  assert.equal(b.state.tripTitle, "最新 A");
  assert.equal(b.state.sharedRevision, 3);
  assert.equal(b.state.shopping.items.length, 0);
  assert.equal(b.state.shopping.revision, 3);
});

test("invite and share-target outrank saved shopping tab and do not consume an invite prematurely", async () => {
  const saved = { [tabKey()]: '{"mainTab":"shopping"}' };
  const invite = browser({ stored: saved, href: "https://trip.test/?invite=ABC123" });
  await invite.list(["b"]); await invite.ready();
  assert.equal(invite.realFrames()[0].tab, "overview");
  assert.match(invite.sheet.innerHTML, /join-trip-form/);
  assert.equal(invite.storage.get(tabKey()), saved[tabKey()]);
  const share = browser({ stored: saved, href: "https://trip.test/share-target?share_text=https%3A%2F%2Fwww.booking.com%2FShare-test" });
  await share.list(["b"]); await share.ready();
  assert.equal(share.realFrames()[0].tab, "places");
  assert.match(share.sheet.innerHTML, /import-places-form/);
  assert.equal(share.run("pendingShareTargetText"), "");
});

test("shopping has separate loading, error, retry and empty states without blocking other tabs", async () => {
  const b = browser({ stored: { [tabKey()]: '{"mainTab":"shopping"}' } });
  await b.list(["b"]); await b.ready();
  assert.match(b.app.innerHTML, /正在載入你的私人清單/);
  await b.reply("/api/shopping?tripId=b", {}, 403);
  assert.match(b.app.innerHTML, /data-retry-shopping/);
  assert.equal(b.state.hydrationStatus, "ready");
  await b.run('setTab("places")');
  assert.match(b.app.innerHTML, /收藏地點/);
  b.run("loadShopping({ force: true })");
  await b.reply("/api/shopping?tripId=b", { items: [], revision: 1 });
  await b.run('setTab("shopping")');
  assert.match(b.app.innerHTML, /還沒有採買項目/);
});

test("shopping timeout exits loading, and a previous member's same-trip response cannot leak", async () => {
  const b = browser(); await b.list(["b"]); await b.ready();
  const old = b.pending("/api/shopping?tripId=b");
  b.state.profile = member("bob"); b.run("loadTrips()");
  assert.equal(b.state.shopping.items.length, 0);
  await b.list(["b"]); await b.ready();
  await b.reply(old, { items: [{ id: "private", name: "Alice 私人資料" }], revision: 99 });
  assert.equal(b.state.shopping.items.length, 0);
  await b.timeoutRequests();
  assert.equal(b.state.shoppingLoadStatus, "error");
  b.run('setTab("shopping")');
  await b.reply(b.requests.filter((r) => r.url === "/api/shopping?tripId=b" && !r.replied).at(-1), { items: [], revision: 1 });
  assert.doesNotMatch(b.app.innerHTML, /Alice 私人資料/);
});

test("late shopping PUT returns no old payload to callers after a member switch", async () => {
  const b = browser(); await b.list(["b"]); await b.ready();
  const saving = b.run("saveShopping()");
  const old = b.requests.find((r) => r.options.method === "PUT");
  assert.ok(old);
  b.state.profile = member("bob"); b.run("loadTrips()");
  await b.list(["b"]); await b.ready();
  await b.reply(old, { items: [{ id: "private" }], revision: 99 });
  assert.equal(await saving, null);
  assert.equal(b.state.shopping.revision, 0);
});

test("missing or corrupt profile renders login/empty state with no trip or shopping requests", () => {
  for (const profile of [null, "corrupt"]) {
    const b = browser({ profile, stored: profile === "corrupt" ? { "tokyo-profile-v1": "{broken" } : {} });
    assert.equal(b.requests.length, 0);
    assert.equal(b.state.tripId, "");
    assert.match(b.sheet.innerHTML, /profile-form/);
    assert.doesNotMatch(b.app.innerHTML, /東京 7 日|正在載入你的旅程/);
  }
});

test("late shopping research cannot open old details or save into the newly selected trip", async () => {
  const b = browser(); await b.list(); await b.ready("a");
  await b.reply("/api/shopping?tripId=a", { items: [{ id: "private", name: "Alice 商品" }], revision: 1 });
  const researching = b.run('researchShoppingItem("private")');
  const old = b.pending("/api/shopping-research");
  b.run('switchTrip("b")'); await b.ready();
  await b.reply(old, { annotation: { summary: "舊商品資料", productImages: [] } });
  await researching;
  assert.equal(b.state.shopping.items.length, 0);
  assert.equal(b.sheet.innerHTML, "");
  assert.ok(b.requests.every((r) => r.options.method !== "PUT"));
});

test("shopping screenshot submit cannot append items after a trip boundary during image preparation", async () => {
  const b = browser(); await b.list(); await b.ready("a");
  b.run('pendingShoppingImports = [{ id: "entry", dataUrl: "data:image/jpeg;base64,input", details: { name: "舊會員商品", categoryId: "daily" } }]');
  const target = { id: "shopping-import-form", dataset: {}, isConnected: true, querySelectorAll: () => [] };
  const submitting = b.listeners.submit[0]({ target, preventDefault() {} });
  b.run('switchTrip("b")');
  await submitting;
  await b.ready();
  assert.equal(b.state.shopping.items.length, 0);
  assert.equal(Object.keys(b.state.shopping.photos).length, 0);
  assert.ok(b.requests.every((r) => r.options.method !== "PUT"));
});

test("late manual shopping photo cannot replace the new member's pending photo", async () => {
  const b = browser(); await b.list(["b"]); await b.ready();
  const form = { dataset: {}, isConnected: true, querySelector: () => null };
  b.context.photoInput = { closest: () => form, files: [{ type: "image/jpeg", name: "private.jpg" }] };
  const preparing = b.run("handleManualShoppingPhotoFile(photoInput)");
  b.state.profile = member("bob"); b.run('loadTrips(); pendingManualShoppingPhoto = "new-member-photo"');
  await preparing;
  assert.equal(b.run("pendingManualShoppingPhoto"), "new-member-photo");
  assert.equal(b.state.shopping.items.length, 0);
});

test("login submit and retry click use the same hydration boundary before restoring the new member's tab", async () => {
  const b = browser({ profile: null, stored: { [activeKey("bob")]: '"b"', [tabKey("b", "bob")]: '{"mainTab":"places"}' } });
  const target = { id: "profile-form", values: { nickname: "bob", pin: "1234" }, querySelector: () => ({}) };
  const submitting = b.listeners.submit[0]({ target, preventDefault() {} });
  await b.reply("/api/member", { member: member("bob") });
  assert.match(b.app.innerHTML, /正在載入你的旅程/);
  assert.equal(b.realFrames().length, 0);
  await b.reply("/api/trips", {}, 503);
  await submitting;
  const retry = b.listeners.click[0]({ target: { closest: (s) => s === "[data-retry-startup]" ? {} : null } });
  await b.list(["b"]); await b.ready(); await retry;
  assert.equal(b.realFrames()[0].memberId, "bob");
  assert.equal(b.realFrames()[0].tab, "places");
  assert.ok(b.writes.every((w) => !w.key.startsWith("trip-cache-v1:")));
});
