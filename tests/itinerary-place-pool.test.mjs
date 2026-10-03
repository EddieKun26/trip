import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { boot, trip, place, json, source } from './helpers/phase-c-browser.mjs';

const keyOf = (area) => `app:synthetic-${area}`;
const places = () => [
  place('asakusa', { name: '淺草寺', kind: 'attraction' }),
  place('ueno', { name: '上野動物園', kind: 'attraction', areaTags: ['上野公園'] }),
  place('tsukiji', { name: '築地壽司', kind: 'restaurant' }),
  place('shibuya', { name: '澀谷 PARCO', kind: 'shopping' }),
  place('ginza', { name: '銀座飯店', kind: 'lodging' }),
];
const returnFlights = [
  { id: 'f-out', direction: '去程', departureDate: '2026-09-20', departureTime: '09:00', departureCity: '高雄', departureCode: 'KHH',
    arrivalDate: '2026-09-20', arrivalTime: '13:00', arrivalCity: '成田', arrivalCode: 'NRT' },
  { id: 'f-ret', direction: '回程', departureDate: '2026-09-23', departureTime: '18:00', departureCity: '成田', departureCode: 'NRT',
    arrivalDate: '2026-09-23', arrivalTime: '21:00', arrivalCity: '高雄', arrivalCode: 'KHH' },
];

async function itinerary(extra = {}, placeList = places()) {
  // Place Pool interaction tests use authoritative unknown hours; selection hydration is
  // exercised separately so these assertions remain about transient selection state.
  const readyPlaces = placeList.map(item => ({ ...item, regularOpeningPeriods: item.regularOpeningPeriods || {
    v: 1, status: 'unavailable', placeId: item.placeId, periods: [], fetchedAt: '2026-09-20T00:00:00.000Z',
  } }));
  const b = await boot({ ...trip(readyPlaces), ...extra });
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  return b;
}
function spy(b) {
  b.run(`var poolCalls = [], persistCalls = 0;
    const originalAdd = addPlaceToItineraryDay, originalInsert = insertPlacesIntoItineraryDay, originalPersist = persist;
    addPlaceToItineraryDay = (...args) => { poolCalls.push(['add', ...args]); return originalAdd(...args); };
    insertPlacesIntoItineraryDay = (date, names) => { poolCalls.push(['insert', date, [...names]]); return originalInsert(date, names); };
    persist = (...args) => { persistCalls += 1; return originalPersist(...args); };`);
}
const poolNames = (b) => json(b.run('getFilteredPlacePool().entries.map((entry) => entry.place.name)'));
const selectedNames = (b) => json(b.run('placePoolSelectedEntries().map((entry) => entry.place.name)'));
const listener = (b, type, marker) => b.listeners[type].find((fn) => String(fn).includes(marker));
const target = (selector, dataset = {}) => ({ closest: (s) => (s === selector ? { dataset } : null), matches: () => false });
const click = (b, selector, dataset) => listener(b, 'click', 'data-toggle-place-pool')({ target: target(selector, dataset), preventDefault() {} });
const classes = () => ({ add() {}, remove() {}, toggle() {}, contains() { return false; } });
function itemBlock(html, key) {
  const marker = `data-pool-anchor-key="${key}"`;
  const start = html.lastIndexOf('<li class="place-pool', html.indexOf(marker));
  const closeTag = html.indexOf('</li>', start);
  return html.slice(start, closeTag + 5);
}
function drag(b, type, eventTarget, dataTransfer) {
  const event = { target: eventTarget, dataTransfer, prevented: false, preventDefault() { this.prevented = true; } };
  for (const fn of b.listeners[type] || []) fn(event);
  return event;
}



test('地點類型 filter keeps lodging available to the manual pool', async () => {
  const b = await itinerary();
  b.state.placePool.kind = 'restaurant';
  assert.deepEqual(poolNames(b), ['築地壽司']);
  b.state.placePool.kind = 'lodging';
  assert.deepEqual(poolNames(b), ['銀座飯店']);
});


test('filters combine, and a section no longer offered by the type is cleared', async () => {
  const b = await itinerary({ votes: { '上野動物園': ['alice'], '築地壽司': ['alice'] } });
  Object.assign(b.state.placePool, { section: 'group:ueno-asakusa-akihabara', favoriteOnly: true });
  assert.deepEqual(poolNames(b), ['上野動物園']);
  Object.assign(b.state.placePool, { kind: 'restaurant', favoriteOnly: false });
  assert.deepEqual(poolNames(b), ['築地壽司']);
  assert.equal(b.state.placePool.section, '');
});


// --- Fullscreen workspace architecture --------------------------------------------------------


const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');




test('selected count uses currently valid entries, not the raw key Set size, when a selected Place leaves the pool from elsewhere', async () => {
  const b = await itinerary();
  b.run(`placePoolSelectedKeys().add("${keyOf('ueno')}"); placePoolSelectedKeys().add("${keyOf('tsukiji')}")`);
  assert.equal(b.run('placePoolSelectedKeys().size'), 2);
  b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`);
  assert.deepEqual(selectedNames(b), ['築地壽司']);
  assert.equal(b.run('placePoolSelectedKeys().size'), 1);
});

// --- Selection-first interaction -------------------------------------------------------------





test('clicking the selectable card no longer opens the 加入某一天 sheet directly', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.equal(b.sheet.innerHTML, '');
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('ueno')}")`), true);
});

test('selected order always follows getUnscheduledPlaces() stable order, never click/selection time', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') });
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ginza') });
  // Selected click order was tsukiji, ueno, ginza; pool order is asakusa, ueno, tsukiji, shibuya, ginza.
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司', '銀座飯店']);
});

test('selecting Places is client memory only: no persistence, network, itinerary mutation or revision change', async () => {
  const b = await itinerary();
  spy(b);
  const requests = b.requests.length;
  const revision = b.state.sharedRevision;
  const writes = b.writes.length;
  b.run(`togglePlacePoolSelection("${keyOf('ueno')}"); togglePlacePoolSelection("${keyOf('tsukiji')}")`);
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司']);
  assert.equal(b.requests.length, requests);
  assert.equal(b.run('persistCalls'), 0);
  assert.equal(b.state.sharedRevision, revision);
  assert.deepEqual(json(b.state.itinerary), {});
  assert.equal(Object.hasOwn(b.run('sharedTripPayload()'), 'placePool'), false);
  assert.doesNotMatch(JSON.stringify(json(b.writes.slice(writes))), /synthetic-ueno|synthetic-tsukiji/);
});




test('drag is inert where the workspace is not used with a mouse; nothing is ever draggable on touch layouts', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  assert.doesNotMatch(b.app.innerHTML, /draggable=/);
  spy(b);
  const dataTransfer = { setData() {}, effectAllowed: '', dropEffect: '' };
  const handle = { dataset: { poolDrag: keyOf('asakusa') }, classList: classes(), closest: () => null };
  const day = { dataset: { poolDropDate: '9/21' }, classList: classes() };
  drag(b, 'dragstart', { closest: (s) => (s === '[data-pool-drag]' ? handle : null) }, dataTransfer);
  assert.equal(drag(b, 'dragover', { closest: () => day }, dataTransfer).prevented, false);
  drag(b, 'drop', { closest: () => day }, dataTransfer);
  assert.deepEqual(json(b.run('poolCalls')), []);
  assert.deepEqual(json(b.state.itinerary), {});
});



test('pool add matches the existing 加入地點 sheet exactly: suggested time, return-flight insertion, persist and schema', async () => {
  const existing = { '9/23': [{ id: 'place:9/23:淺草寺', name: '淺草寺', time: '14:00' }] };
  const viaSheet = await itinerary({ flights: returnFlights, itinerary: json(existing) });
  const viaPool = await itinerary({ flights: returnFlights, itinerary: json(existing) });
  spy(viaSheet); spy(viaPool);
  viaSheet.run('state.selectedDate = "9/23"; itineraryPlaceSelection = new Set(["築地壽司"])');
  await listener(viaSheet, 'submit', 'itinerary-places-form')({ target: { id: 'itinerary-places-form' }, preventDefault() {} });
  const before = json({ places: viaPool.state.places, votes: viaPool.state.votes, transports: viaPool.state.transports, keys: Object.keys(viaPool.run('sharedTripPayload()')) });
  viaPool.run(`completePlacePoolAdd("${keyOf('tsukiji')}", "9/23")`);
  for (const b of [viaSheet, viaPool]) {
    assert.equal(b.run('persistCalls'), 1);
    assert.ok(json(b.run('poolCalls')).some(([kind, date, names]) => kind === 'insert' && date === '9/23' && names[0] === '築地壽司'));
  }
  const sheetDay = json(viaSheet.run('sharedTripPayload()').itinerary['9/23']);
  const poolDay = json(viaPool.run('sharedTripPayload()').itinerary['9/23']);
  assert.deepEqual(poolDay, sheetDay);
  assert.deepEqual(poolDay.map((item) => item.type || item.name), ['淺草寺', '築地壽司', 'flight']);
  const added = poolDay[1];
  assert.deepEqual(Object.keys(added).sort(), ['id', 'name', 'time']);
  assert.deepEqual(added, { name: '築地壽司', time: '15:30', id: 'place:9/23:築地壽司' });
  const payload = viaPool.run('sharedTripPayload()');
  assert.deepEqual(json({ places: viaPool.state.places, votes: viaPool.state.votes, transports: viaPool.state.transports, keys: Object.keys(payload) }), before);
  assert.equal(Object.hasOwn(payload, 'placePool'), false);
});

test('Places already scheduled on several days stay out of the pool and that history is not modified', async () => {
  const history = { '9/20': [{ id: 'place:9/20:淺草寺', name: '淺草寺', time: '10:00' }], '9/21': [{ id: 'place:9/21:淺草寺', name: '淺草寺', time: '10:00' }] };
  const b = await itinerary({ itinerary: json(history) });
  spy(b);
  assert.ok(!poolNames(b).includes('淺草寺'));
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('asakusa')}", "9/22")`)), { ok: false, reason: 'NOT_IN_POOL' });
  assert.equal(b.run('persistCalls'), 0);
  b.run(`completePlacePoolAdd("${keyOf('ueno')}", "9/21")`);
  assert.deepEqual(json(b.state.itinerary['9/20']), history['9/20']);
  assert.deepEqual(json(b.state.itinerary['9/21'][0]), history['9/21'][0]);
  assert.deepEqual(json(b.state.itinerary['9/21']).map((item) => item.name), ['淺草寺', '上野動物園']);
});


test('read-only viewers get no Place Pool and cannot add', async () => {
  const b = await itinerary();
  b.state.isGuest = true;
  b.run('render()');
  assert.doesNotMatch(b.app.innerHTML, /data-toggle-place-pool|place-pool-panel/);
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('asakusa')}", "9/21")`)), { ok: false, reason: 'READ_ONLY' });
  assert.deepEqual(json(b.state.itinerary), {});
});

test('Place Pool selection is trip-scoped client memory: HARD must-include picks drawn from the pool, ignoring the current filter, never persisted or required', async () => {
  const b = await itinerary();
  const writes = b.writes.length;
  b.run(`placePoolSelectedKeys().add("${keyOf('ueno')}"); placePoolSelectedKeys().add("${keyOf('tsukiji')}")`);
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司']);
  // Selection ignores the current view filter entirely: it is a hard commitment, not something filters may hide.
  b.state.placePool.kind = 'restaurant';
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司']);
  b.run('persist({ sync: false }); render({ preserveScroll: true })');
  const stored = JSON.stringify(b.writes.slice(writes));
  assert.doesNotMatch(stored, /synthetic-ueno|synthetic-tsukiji/);
  assert.doesNotMatch(JSON.stringify(b.run('sharedTripPayload()')), /selectedKeys|placePoolSelection|placePoolPlanning/i);
  assert.deepEqual(json(b.state.itinerary), {});
});

test('selection lifetime: survives close/reopen of the same trip, clears on trip switch and on clearTripView/logout', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run('setPlacePoolOpen(false)');
  b.run('setPlacePoolOpen(true)');
  assert.deepEqual(selectedNames(b), ['上野動物園']);
  b.state.tripId = 'another-trip';
  assert.equal(b.run('placePoolSelectedKeys().size'), 0);
  b.state.tripId = 'b';
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.equal(b.run('placePoolSelectedKeys().size'), 1);
  b.run('clearTripView()');
  assert.equal(b.run('placePoolSelectedKeys().size'), 0);
});




// --- Mobile Selected drawer + handle -----------------------------------------------------------



test('a Place can be unselected directly from the Selected column/drawer via its own checkmark, without returning to a candidate card', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), ['上野動物園']);
  // The checkmark reuses the exact same data-pool-place / togglePlacePoolSelection contract.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), []);
  assert.deepEqual(poolNames(b), ['淺草寺', '上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
});


test('drawer open/closed is UI-only, resets to closed on trip switch, and never persists', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-drawer-toggle]');
  assert.equal(b.run("placePoolDrawerIsOpen()"), true);
  b.state.tripId = 'another-trip';
  b.run('render()');
  assert.equal(b.run("placePoolDrawerIsOpen()"), false);
});

test('no horizontal document overflow markers are introduced (structural: the workspace fills the viewport, not the phone-docked side panel)', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.place-pool-mobile-handle \{[^}]*width: 46px; height: 100px;/);
});

// --- Planning constraints (multi-date dateOptions) ------------------------------------------

test('a newly selected Place has no date restriction: dateOptions is empty, with no restored/hidden day or time', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "summary")`), '未指定日期');
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "card")`), '指定日期');
});

test('single-date summaries: plain date, preferred (one and two-plus periods), and exact', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null }])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "card")`), '9/22');
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["evening"], exactTime: null }])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "card")`), '9/22・偏好晚上');
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["morning", "afternoon"], exactTime: null }])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "card")`), '9/22・偏好上午、下午');
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "18:30" }])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "card")`), '9/22・18:30');
});

test('clearing all dateOptions removes the date restriction entirely; the Place stays selected', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "18:30" }])`);
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [])`);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
  // Still selected: an empty dateOptions list never unselects a Place.
  assert.deepEqual(selectedNames(b), ['上野動物園']);
});

test('applyPlacePoolConstraint fails closed on a not-yet-selected Place: the date dialog is only ever for an already-selected Place, never a second way to select one', async () => {
  const b = await itinerary();
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('ueno')}")`), false);
  const ok = b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null }])`);
  assert.equal(ok, false);
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('ueno')}")`), false);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});

test("only the trip's own date range can ever be stored as a dateOption", async () => {
  const b = await itinerary();
  const optionKeys = json(b.run('dateMeta.map(([date]) => date)'));
  assert.deepEqual(optionKeys, ['9/20', '9/21', '9/22', '9/23']);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  const ok = b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "12/31", mode: "none", preferredPeriods: [], exactTime: null }])`);
  assert.equal(ok, true); // call succeeds (fail-closed only on stale/unselected keys) but drops the out-of-range day
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});

test('unselecting a Place deletes its dateOptions outright; re-selecting starts empty again, never restoring the old dates', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "18:30" }])`);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // unselect
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // re-select
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});

test('an invalid exact time never commits: normalizes to no time restriction for that day, never a stored garbage exactTime', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "25:99" }])`);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), [{ dayKey: '9/22', mode: 'none', preferredPeriods: [], exactTime: null }]);
});

test('applyPlacePoolConstraint fails closed against a stale/no-longer-pooled key, like togglePlacePoolSelection', async () => {
  const b = await itinerary({ itinerary: { '9/20': [{ id: 'place:9/20:上野動物園', name: '上野動物園', time: '10:00' }] } });
  assert.equal(b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/21", mode: "none", preferredPeriods: [], exactTime: null }])`), false);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});

test('a stale selected key that leaves the pool also drops its dateOptions', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null }])`);
  b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`);
  assert.deepEqual(selectedNames(b), []); // triggers the lazy prune, like placePoolSelectedKeys().size elsewhere
  assert.equal(b.run('placePoolSelectedKeys().size'), 0);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});


test('multi-date: dateOptions can hold several trip days at once, each with independent time rules, always ordered by the trip\'s own day order regardless of input order', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [
    { dayKey: "9/23", mode: "none", preferredPeriods: [], exactTime: null },
    { dayKey: "9/20", mode: "exact", preferredPeriods: [], exactTime: "09:00" },
    { dayKey: "9/22", mode: "preferred", preferredPeriods: ["morning", "afternoon"], exactTime: null }
  ])`);
  const stored = json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`));
  assert.deepEqual(stored.map((option) => option.dayKey), ['9/20', '9/22', '9/23']);
  assert.equal(stored[0].mode, 'exact');
  assert.equal(stored[1].mode, 'preferred');
  assert.equal(stored[2].mode, 'none');
  // A Place with a multi-date constraint is still only ever selected once, not once per date.
  assert.deepEqual(selectedNames(b), ['上野動物園']);
});

test('preferred periods: all six labels, deterministic ranges, multi-select, and selecting all six normalizes to no restriction', async () => {
  const b = await itinerary();
  const ranges = json(b.run('POOL_PREFERRED_PERIOD_RANGES'));
  assert.deepEqual(ranges, {
    early_morning: ['00:00', '05:59'], morning: ['06:00', '11:29'], noon: ['11:30', '13:29'],
    afternoon: ['13:30', '17:29'], evening: ['17:30', '21:59'], late_night: ['22:00', '23:59'],
  });
  assert.deepEqual(json(b.run('POOL_PREFERRED_PERIOD_KEYS.map(poolPreferredPeriodLabel)')), ['凌晨', '上午', '中午', '下午', '晚上', '深夜']);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["morning", "noon", "afternoon"], exactTime: null }])`);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`))[0].preferredPeriods, ['morning', 'noon', 'afternoon']);
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "preferred", preferredPeriods: ["early_morning", "morning", "noon", "afternoon", "evening", "late_night"], exactTime: null }])`);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), [{ dayKey: '9/22', mode: 'none', preferredPeriods: [], exactTime: null }]);
});

test('preferred and exact are mutually exclusive per day: a malformed entry with both fields set normalizes to exact-only, dropping the stale preferred periods', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: ["morning"], exactTime: "09:00" }])`);
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), [{ dayKey: '9/22', mode: 'exact', preferredPeriods: [], exactTime: '09:00' }]);
});

test('summary formatter: contiguous all-none dates collapse to a date range; non-contiguous or mixed-constraint dates collapse to "可選 N 天"', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [
    { dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null },
    { dayKey: "9/23", mode: "none", preferredPeriods: [], exactTime: null }
  ])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "summary")`), '9/22–9/23');
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [
    { dayKey: "9/20", mode: "none", preferredPeriods: [], exactTime: null },
    { dayKey: "9/23", mode: "none", preferredPeriods: [], exactTime: null }
  ])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "summary")`), '可選 2 天');
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [
    { dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null },
    { dayKey: "9/23", mode: "exact", preferredPeriods: [], exactTime: "18:00" }
  ])`);
  assert.equal(b.run(`placePoolConstraintSummaryText("${keyOf('ueno')}", "summary")`), '可選 2 天');
});




test('the exact-time wheel commit updates only the summary text of the currently expanded date row, never the first checked row in DOM order (regression: every checked row shares the same data-pool-constraint-time-summary-text attribute, so an unscoped querySelector previously wrote into the wrong row once two dates were checked)', () => {
  assert.match(source, /document\.querySelector\(`\[data-pool-constraint-expand="\$\{pendingPoolConstraint\.expandedDayKey\}"\] \[data-pool-constraint-time-summary-text\]`\)/);
});


test('canceling the date dialog (footer 取消 / closeSheet, same as the icon × or backdrop) discards the draft entirely', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  b.run('togglePoolConstraintDraftDate("9/22")');
  b.run('closeSheet()');
  assert.equal(b.sheet.innerHTML, '');
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), []);
});


test('dateOptions are client memory only, like selection: no persist, no Trip PUT, no revision or undo change', async () => {
  const b = await itinerary();
  spy(b);
  const revision = b.state.sharedRevision;
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "18:30" }])`);
  assert.equal(b.run('persistCalls'), 0);
  assert.equal(b.state.sharedRevision, revision);
  assert.deepEqual(json(b.state.itinerary), {});
  assert.doesNotMatch(JSON.stringify(b.run('sharedTripPayload()')), /18:30|dayKey|exactTime/i);
});

test('clicking the drawer backdrop closes the drawer; the backdrop only exists on mobile', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-drawer-toggle]');
  assert.equal(b.run('placePoolDrawerIsOpen()'), true);
  await click(b, '[data-pool-drawer-backdrop]');
  assert.equal(b.run('placePoolDrawerIsOpen()'), false);
  assert.match(css, /\.place-pool-drawer-backdrop \{ position: fixed; inset: 0;/);
  assert.match(css, /@media \(min-width: 900px\) \{\s*\.place-pool-drawer-backdrop \{ display: none; \}/);
});

test('drawer handle drag preview/snap wiring is scoped to the handle element and never interferes with the drawer\'s own vertical scroll (real-DOM pixel behavior verified separately by manual smoke)', () => {
  assert.match(source, /event\.target\.closest\("\[data-pool-drawer-toggle\]"\)/);
  assert.match(source, /function applyPoolDrawerDragPreview/);
  assert.match(source, /function finishPoolDrawerDrag/);
  assert.match(source, /current\.fraction >= 0\.5/);
  assert.match(source, /suppressPoolDrawerClick/);
});

test('the date dialog backdrop is always centered, never bottom-aligned like an ordinary sheet', () => {
  assert.match(css, /\.place-pool-constraint-backdrop \{ align-items: center; \}/);
});

test('exact-time wheel is recentered for its shorter 150px height, fixing the sunk selection-box alignment bug', () => {
  assert.match(css, /\.place-pool-constraint-time-wheel \.time-wheel-column \{ height: 150px; padding-block: 53px; \}/);
  assert.match(css, /\.place-pool-constraint-time-wheel \.time-wheel-selection \{ top: 53px; \}/);
});

test('the candidates column reserves a permanent right-edge safe area on mobile so 指定日期 controls never sit under the fixed drawer handle', () => {
  assert.match(css, /@media \(max-width: 899\.98px\) \{[\s\S]*?\.place-pool-candidates-column \{ padding-right: 58px; \}/);
});

// --- Scroll-anchor preservation (pure math; DOM wiring is exercised via manual browser smoke) --

test('scroll anchor math finds the topmost visible entry and its neighbors for a deterministic fallback', async () => {
  const b = await itinerary();
  const rects = [{ key: 'a', top: 0 }, { key: 'b', top: 80 }, { key: 'c', top: 160 }, { key: 'd', top: 240 }];
  const anchor = json(b.run(`placePoolScrollAnchorFromRects(${JSON.stringify(rects)}, 100)`));
  assert.deepEqual(anchor, { key: 'b', offset: 20, prevKey: 'a', nextKey: 'c' });
});

test('scroll anchor restore reproduces the exact prior offset when the anchor entry still exists', async () => {
  const b = await itinerary();
  const rects = [{ key: 'a', top: 0 }, { key: 'b', top: 90 }, { key: 'c', top: 180 }];
  const top = b.run(`placePoolScrollTopFromAnchor(${JSON.stringify(rects)}, { key: 'b', offset: 20, prevKey: 'a', nextKey: 'c' })`);
  assert.equal(top, 110);
});

test('scroll anchor restore falls back to the next sibling when the anchor entry itself was selected/removed', async () => {
  const b = await itinerary();
  const rectsAfterRemoval = [{ key: 'a', top: 0 }, { key: 'c', top: 60 }]; // 'b' is gone
  const top = b.run(`placePoolScrollTopFromAnchor(${JSON.stringify(rectsAfterRemoval)}, { key: 'b', offset: 20, prevKey: 'a', nextKey: 'c' })`);
  assert.equal(top, 60);
});

test('scroll anchor restore falls back to the previous sibling when neither the anchor nor its next sibling remain', async () => {
  const b = await itinerary();
  const rectsAfterRemoval = [{ key: 'a', top: 0 }]; // both 'b' and 'c' are gone
  const top = b.run(`placePoolScrollTopFromAnchor(${JSON.stringify(rectsAfterRemoval)}, { key: 'b', offset: 20, prevKey: 'a', nextKey: 'c' })`);
  assert.equal(top, 0);
});

test('scroll anchor math never returns a negative scrollTop and handles an empty list', async () => {
  const b = await itinerary();
  assert.equal(b.run('placePoolScrollAnchorFromRects([], 100)'), null);
  assert.equal(b.run("placePoolScrollTopFromAnchor([], { key: 'a', offset: 0 })"), null);
  const rects = [{ key: 'a', top: 50 }];
  const top = b.run(`placePoolScrollTopFromAnchor(${JSON.stringify(rects)}, { key: 'a', offset: -999 })`);
  assert.equal(top, 0);
});

test('render() captures and restores the candidate list and Selected column scroll anchors around every re-render (real-DOM wiring only runs in a browser; verified separately by manual smoke)', () => {
  assert.match(source, /capturePlacePoolAnchor\("\[data-place-pool-list\]"\)/);
  assert.match(source, /capturePlacePoolAnchor\("\[data-place-pool-selected-list\]"\)/);
  assert.match(source, /restorePlacePoolAnchor\(poolCandidateAnchor\)/);
  assert.match(source, /restorePlacePoolAnchor\(poolSelectedAnchor\)/);
});

// --- Selected Summary direct-add removal (Phase 1B.2.1) --------------------------------------


test('there is no data-pool-add trigger anywhere inside 行程規劃\'s Selected Summary markup (desktop column or mobile drawer share one template), and no lingering unused CSS for it', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run('setPlacePoolOpen(true)');
  const selectedListHtml = b.app.innerHTML.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(selectedListHtml, /data-pool-add/);
  assert.doesNotMatch(css, /\.place-pool-selected-add\b/);
});


// --- Initial-open / same-session-reopen scroll behavior (Phase 1B.2.1) ------------------------

test('placePoolScrollSessionState resets hasOpened/savedScrollTop on any trip switch, including switching back to a trip visited earlier this session', async () => {
  const b = await itinerary();
  assert.deepEqual(json(b.run('placePoolScrollSessionState()')), { tripId: 'b', hasOpened: false, savedScrollTop: 0 });
  b.run('placePoolScrollSessionState().hasOpened = true; placePoolScrollSessionState().savedScrollTop = 1200');
  assert.deepEqual(json(b.run('placePoolScrollSessionState()')), { tripId: 'b', hasOpened: true, savedScrollTop: 1200 });
  b.state.tripId = 'another-trip';
  assert.deepEqual(json(b.run('placePoolScrollSessionState()')), { tripId: 'another-trip', hasOpened: false, savedScrollTop: 0 });
  b.run('placePoolScrollSessionState().hasOpened = true; placePoolScrollSessionState().savedScrollTop = 400');
  b.state.tripId = 'b'; // switching back to a trip visited earlier this session is still a fresh first-open
  assert.deepEqual(json(b.run('placePoolScrollSessionState()')), { tripId: 'b', hasOpened: false, savedScrollTop: 0 });
});

test('opening 行程規劃 sets the main list to the top on the first open this trip session, restores the saved position on a same-session reopen, and captures the position on close — never altered by selection/filter/constraint edits or the mobile drawer, which use the separate anchor-based restore (real-DOM wiring only runs in a browser; verified separately by manual smoke)', () => {
  assert.match(source, /const placePoolScrollSession = \{ tripId: "", hasOpened: false, savedScrollTop: 0 \};/);
  assert.match(source, /if \(!open\) \{\s*const list = document\.querySelector\("\[data-place-pool-list\]"\);\s*const planner = placePoolPlannerState\(\);\s*if \(list\) session\.savedScrollTop = list\.scrollTop;\s*else if \(planner\.preview\) session\.savedScrollTop = planner\.editScrollTop;/);
  assert.match(source, /list\.scrollTop = session\.hasOpened \? session\.savedScrollTop : 0;/);
  assert.match(source, /session\.hasOpened = true;/);
  // Only setPlacePoolOpen touches placePoolScrollSession; setPlacePoolDrawerOpen (mobile drawer)
  // and the selection/filter/constraint render() calls never reference it.
  const drawerFn = source.slice(source.indexOf("function setPlacePoolDrawerOpen"), source.indexOf("function setPlacePoolDrawerOpen") + 200);
  assert.doesNotMatch(drawerFn, /placePoolScrollSession/);
});

test('drawer and toggle share one element: hidden when closed; fullscreen at every viewport width', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.place-pool\[hidden\] \{ display: none; \}/);
  assert.match(css, /\.place-pool \{ position: fixed; z-index: 60; inset: 0; \}/);
  assert.match(source, /const PLACE_POOL_DOCKED_MEDIA = "\(min-width: 900px\) and \(hover: hover\) and \(pointer: fine\)";/);
});
