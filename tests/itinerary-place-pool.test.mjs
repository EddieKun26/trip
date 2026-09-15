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
  const b = await boot({ ...trip(placeList), ...extra });
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
function cardBlock(html, key) {
  const marker = `data-pool-place="${key}"`;
  const start = html.lastIndexOf('<li class="place-pool-item', html.indexOf(marker));
  return html.slice(start, html.indexOf('</li>', start) + 5);
}
function drag(b, type, eventTarget, dataTransfer) {
  const event = { target: eventTarget, dataTransfer, prevented: false, preventDefault() { this.prevented = true; } };
  for (const fn of b.listeners[type] || []) fn(event);
  return event;
}

test('Place Pool lists Places absent from every itinerary day, including lodging, and excludes scheduled Places', async () => {
  const b = await itinerary({ itinerary: { '9/21': [{ id: 'place:9/21:淺草寺', name: '淺草寺', time: '10:00' }] } });
  assert.deepEqual(poolNames(b), ['上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
  const html = b.app.innerHTML;
  assert.match(html, /data-toggle-place-pool aria-expanded="false" aria-controls="place-pool-panel"/);
  assert.match(html, /<span>地點池<\/span><b>4<\/b>/);
  assert.match(html, /id="place-pool-panel" hidden/);
  assert.doesNotMatch(html, new RegExp(`data-pool-place="${keyOf('asakusa')}"`));
  assert.match(html, new RegExp(`data-pool-place="${keyOf('ginza')}"`));
});

test('主要地區 filter uses Planning Geography sections and cards never show Canonical Area', async () => {
  const b = await itinerary();
  const pool = json(b.run('getFilteredPlacePool()'));
  assert.ok(pool.sections.some(([key, label]) => key === 'group:ueno-asakusa-akihabara' && label === '上野・淺草・秋葉原'));
  b.state.placePool.section = 'group:ueno-asakusa-akihabara';
  assert.deepEqual(poolNames(b), ['淺草寺', '上野動物園']);
  b.run('setPlacePoolOpen(true)');
  const html = b.app.innerHTML;
  assert.match(html, /<small>景點 · 上野・淺草・秋葉原<\/small>/);
  assert.match(html, /place-tag-area">上野公園<\/span>/);
  const canonical = b.state.places[0];
  assert.doesNotMatch(html, new RegExp(`${canonical.travelAreaZh}（${canonical.travelAreaLocal}）`));
});

test('地點類型 filter keeps lodging available to the manual pool', async () => {
  const b = await itinerary();
  b.state.placePool.kind = 'restaurant';
  assert.deepEqual(poolNames(b), ['築地壽司']);
  b.state.placePool.kind = 'lodging';
  assert.deepEqual(poolNames(b), ['銀座飯店']);
});

test('最想去 filter counts a Place with at least one vote and never changes votes', async () => {
  const votes = { '上野動物園': ['alice'], '銀座飯店': ['alice', 'bob'], '築地壽司': [] };
  const b = await itinerary({ votes });
  b.state.placePool.favoriteOnly = true;
  assert.deepEqual(poolNames(b), ['上野動物園', '銀座飯店']);
  b.run('setPlacePoolOpen(true)');
  assert.match(b.app.innerHTML, /data-place-pool-favorite aria-pressed="true"/);
  assert.match(b.app.innerHTML, /★<\/span>2<span class="place-pool-sr"> 人最想去/);
  assert.deepEqual(json(b.state.votes), votes);
});

test('filters combine, and a section no longer offered by the type is cleared', async () => {
  const b = await itinerary({ votes: { '上野動物園': ['alice'], '築地壽司': ['alice'] } });
  Object.assign(b.state.placePool, { section: 'group:ueno-asakusa-akihabara', favoriteOnly: true });
  assert.deepEqual(poolNames(b), ['上野動物園']);
  Object.assign(b.state.placePool, { kind: 'restaurant', favoriteOnly: false });
  assert.deepEqual(poolNames(b), ['築地壽司']);
  assert.equal(b.state.placePool.section, '');
});

test('toggle, close and Escape drive the drawer with aria-expanded; filter clicks change view state only', async () => {
  const b = await itinerary();
  const requests = b.requests.length;
  await click(b, '[data-toggle-place-pool]');
  assert.equal(b.state.placePool.open, true);
  assert.match(b.app.innerHTML, /aria-expanded="true" aria-controls="place-pool-panel"/);
  assert.match(b.app.innerHTML, /id="place-pool-panel">/);
  await click(b, '[data-place-pool-favorite]');
  assert.equal(b.state.placePool.favoriteOnly, true);
  await click(b, '[data-close-place-pool]');
  assert.equal(b.state.placePool.open, false);
  await click(b, '[data-toggle-place-pool]');
  listener(b, 'keydown', 'placePool')({ key: 'Escape', preventDefault() {} });
  assert.equal(b.state.placePool.open, false);
  assert.equal(b.requests.length, requests);
});

// --- Selection-first interaction -------------------------------------------------------------

test('click/tap toggles Place Pool selection with aria-pressed and moves the card into the Selected section on top', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), ['上野動物園']);
  let html = b.app.innerHTML;
  assert.match(html, new RegExp(`data-pool-place="${keyOf('ueno')}" aria-pressed="true"`));
  assert.match(html, /已選 1 個/);
  const selectedListHtml = html.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(selectedListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}"`));
  // Clicking the card again unselects it and it returns to its original stable position.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), []);
  html = b.app.innerHTML;
  assert.match(html, new RegExp(`data-pool-place="${keyOf('ueno')}" aria-pressed="false"`));
  assert.doesNotMatch(html, /class="place-pool-selected"/);
  assert.deepEqual(poolNames(b), ['淺草寺', '上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
});

test('clicking the selectable card no longer opens the 加入某一天 sheet; only the secondary action does', async () => {
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

test('selected count uses currently valid entries, not the raw key Set size, when a selected Place leaves the pool from elsewhere', async () => {
  const b = await itinerary();
  b.run(`placePoolSelectedKeys().add("${keyOf('ueno')}"); placePoolSelectedKeys().add("${keyOf('tsukiji')}")`);
  assert.equal(b.run('placePoolSelectedKeys().size'), 2);
  b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`);
  assert.deepEqual(selectedNames(b), ['築地壽司']);
  assert.equal(b.run('placePoolSelectedKeys().size'), 1);
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

test('filters narrow only the unselected section: a selected Place stays visible with a 不在目前篩選 hint, and re-applies the filter once unselected', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // attraction
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') }); // restaurant
  b.state.placePool.kind = 'restaurant';
  b.run('render({ preserveScroll: true, filterOnly: true })');
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司']);
  const html = b.app.innerHTML;
  assert.match(cardBlock(html, keyOf('ueno')), /不在目前篩選/);
  assert.doesNotMatch(cardBlock(html, keyOf('tsukiji')), /不在目前篩選/);
  const otherListHtml = html.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(otherListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}"`));
  assert.doesNotMatch(otherListHtml, new RegExp(`data-pool-place="${keyOf('tsukiji')}"`));
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('ueno')}")`), false);
  assert.ok(!poolNames(b).includes('上野動物園'));
});

test('more than 6 selected Places collapse the Selected section behind a single toggle', async () => {
  const list = ['ginza', 'ebisu', 'daikanyama', 'shibuya', 'asakusa', 'shinjuku', 'otsuka']
    .map((key, index) => place(key, { name: `景點${index}` }));
  const b = await itinerary({}, list);
  for (const key of ['ginza', 'ebisu', 'daikanyama', 'shibuya', 'asakusa', 'shinjuku', 'otsuka']) {
    await click(b, '[data-pool-place]', { poolPlace: keyOf(key) });
  }
  assert.equal(b.run('placePoolSelectedEntries().length'), 7);
  let html = b.app.innerHTML;
  assert.match(html, /data-pool-selected-toggle aria-expanded="false" aria-controls="place-pool-selected-list">已選 7 個/);
  assert.doesNotMatch(html, /data-place-pool-selected-list/);
  await click(b, '[data-pool-selected-toggle]', {});
  html = b.app.innerHTML;
  assert.match(html, /data-pool-selected-toggle aria-expanded="true" aria-controls="place-pool-selected-list">已選 7 個/);
  assert.match(html, /data-place-pool-selected-list/);
});

test('desktop drag from the dedicated handle uses the shared add helper and 加入地點 contract; the Place leaves the pool and its stale selection is pruned', async () => {
  const b = await itinerary();
  b.context.window.matchMedia = () => ({ matches: true });
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('asakusa') });
  assert.match(b.app.innerHTML, new RegExp(`data-pool-drag="${keyOf('asakusa')}" draggable="true"`));
  const selectSurface = b.app.innerHTML.match(new RegExp(`<button class="place-pool-select"[^>]*data-pool-place="${keyOf('asakusa')}"[^>]*>`))[0];
  assert.doesNotMatch(selectSurface, /draggable/);
  spy(b);
  const dataTransfer = { setData() {}, effectAllowed: '', dropEffect: '' };
  const handle = { dataset: { poolDrag: keyOf('asakusa') }, classList: classes(), closest: (s) => (s === '.place-pool-card' ? { classList: classes() } : null) };
  drag(b, 'dragstart', { closest: (s) => (s === '[data-pool-drag]' ? handle : null) }, dataTransfer);
  assert.equal(drag(b, 'dragover', { closest: () => null }, dataTransfer).prevented, false);
  assert.equal(dataTransfer.dropEffect, 'none');
  const outside = { dataset: { poolDropDate: '12/31' }, classList: classes() };
  assert.equal(drag(b, 'dragover', { closest: () => outside }, dataTransfer).prevented, false);
  const day = { dataset: { poolDropDate: '9/21' }, classList: classes() };
  const over = drag(b, 'dragover', { closest: (s) => (s === '[data-pool-drop-date]' ? day : null) }, dataTransfer);
  assert.equal(over.prevented, true);
  assert.equal(dataTransfer.dropEffect, 'copy');
  drag(b, 'drop', { closest: (s) => (s === '[data-pool-drop-date]' ? day : null) }, dataTransfer);
  assert.deepEqual(json(b.run('poolCalls')), [['add', keyOf('asakusa'), '9/21'], ['insert', '9/21', ['淺草寺']]]);
  assert.equal(b.run('persistCalls'), 1);
  assert.equal(b.state.selectedDate, '9/21');
  assert.deepEqual(json(b.state.itinerary['9/21']), [{ name: '淺草寺', time: '11:00', id: 'place:9/21:淺草寺' }]);
  assert.ok(!poolNames(b).includes('淺草寺'));
  assert.doesNotMatch(b.app.innerHTML, new RegExp(`data-pool-place="${keyOf('asakusa')}"`));
  assert.match(b.app.innerHTML, /<strong>淺草寺<\/strong>/);
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('asakusa')}")`), false);
});

test('drag is inert where the pool is not docked; nothing is ever draggable on touch layouts', async () => {
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

for (const docked of [false, true]) {
  test(`${docked ? 'desktop secondary action (＋日期)' : 'mobile secondary action (⋯)'} opens the shared 加入某一天 sheet, independent of selection`, async () => {
    const b = await itinerary();
    b.context.window.matchMedia = () => ({ matches: docked });
    b.run('setPlacePoolOpen(true)');
    spy(b);
    await click(b, '[data-pool-add]', { poolAdd: keyOf('ueno') });
    const sheet = b.sheet.innerHTML;
    assert.match(sheet, /id="add-place-day-form" data-place-name="上野動物園" data-add-source="place-pool" data-place-key="app:synthetic-ueno"/);
    assert.match(sheet, /<h2>加入行程<\/h2>/);
    assert.match(sheet, /<option value="9\/20" selected>/);
    const form = { id: 'add-place-day-form', dataset: { placeName: '上野動物園', addSource: 'place-pool', placeKey: keyOf('ueno') }, values: { date: '9/22' } };
    await listener(b, 'submit', 'add-place-day-form')({ target: form, preventDefault() {} });
    assert.deepEqual(json(b.run('poolCalls')), [['add', keyOf('ueno'), '9/22'], ['insert', '9/22', ['上野動物園']]]);
    assert.equal(b.run('persistCalls'), 1);
    assert.equal(b.sheet.innerHTML, '');
    assert.equal(b.state.selectedDate, '9/22');
    assert.equal(b.state.placePool.open, true);
    assert.ok(!poolNames(b).includes('上野動物園'));
  });
}

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

test('same-name Places fail closed: neither is listed, selectable or addable, and invalid dates are refused', async () => {
  const list = [place('ueno', { name: '拉麵店', kind: 'restaurant' }), place('shibuya', { name: '拉麵店', kind: 'restaurant' }), place('asakusa', { name: '淺草寺' })];
  const b = await itinerary({}, list);
  spy(b);
  assert.deepEqual(poolNames(b), ['淺草寺']);
  assert.equal(b.run('getUnscheduledPlaces().ambiguousCount'), 2);
  b.run('setPlacePoolOpen(true)');
  assert.match(b.app.innerHTML, /2 個同名地點無法從地點池加入/);
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`)), { ok: false, reason: 'NOT_IN_POOL' });
  b.run(`openPlacePoolAddSheet("${keyOf('ueno')}")`);
  assert.doesNotMatch(b.sheet.innerHTML, /add-place-day-form/);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.equal(b.run('placePoolSelectedKeys().size'), 0);
  assert.doesNotMatch(b.app.innerHTML, /class="place-pool-selected"/);
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('asakusa')}", "12/31")`)), { ok: false, reason: 'INVALID_DATE' });
  assert.deepEqual(json(b.state.itinerary), {});
  assert.equal(b.run('persistCalls'), 0);
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
  assert.doesNotMatch(JSON.stringify(b.run('sharedTripPayload()')), /selectedKeys|placePoolSelection/i);
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

test('sticky CTA shows the correct Phase 1B.0 copy and performs zero mutation, persistence or network', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  spy(b);
  const requests = b.requests.length;
  assert.ok(b.app.innerHTML.includes('data-pool-cta disabled aria-disabled="true">AI 幫我規劃行程</button>'));
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') });
  await click(b, '[data-pool-place]', { poolPlace: keyOf('shibuya') });
  assert.ok(b.app.innerHTML.includes('data-pool-cta disabled aria-disabled="true">用已選 3 個地點規劃</button>'));
  assert.equal(b.requests.length, requests);
  assert.equal(b.run('persistCalls'), 0);
  assert.deepEqual(json(b.state.itinerary), {});
});

test('existing itinerary entry points keep their behavior', async () => {
  const b = await itinerary({ itinerary: { '9/20': [{ id: 'place:9/20:淺草寺', name: '淺草寺', time: '10:00' }] } });
  const html = b.app.innerHTML;
  for (const marker of ['data-open-itinerary-places', 'data-date="9/20" data-pool-drop-date="9/20"', 'data-edit-time="淺草寺"', 'data-drag-key="place:9/20:淺草寺"', 'data-open-place="淺草寺"', 'data-share-trip']) {
    assert.ok(html.includes(marker), marker);
  }
  b.run('openAddPlaceDateSheet("上野動物園")');
  assert.match(b.sheet.innerHTML, /<h2>加入某一天<\/h2>/);
  assert.doesNotMatch(b.sheet.innerHTML, /data-add-source/);
  await listener(b, 'submit', 'add-place-day-form')({ target: { id: 'add-place-day-form', dataset: { placeName: '上野動物園' }, values: { date: '9/22' } }, preventDefault() {} });
  assert.deepEqual(json(b.state.itinerary['9/22']), [{ name: '上野動物園', time: '11:00', id: 'place:9/22:上野動物園' }]);
  b.run('openItineraryPlacesSheet({ reset: true })');
  assert.match(b.sheet.innerHTML, /id="itinerary-places-form"[\s\S]*加入勾選地點/);
  // The default 加入某一天 path moved the selected day to 9/22; 淺草寺 is already on 9/20.
  assert.equal(b.state.selectedDate, '9/22');
  b.run('state.selectedDate = "9/20"; itineraryPlaceSelection = new Set(["淺草寺"])');
  const before = json(b.state.itinerary);
  await listener(b, 'submit', 'itinerary-places-form')({ target: { id: 'itinerary-places-form' }, preventDefault() {} });
  assert.deepEqual(json(b.state.itinerary), before);
});

test('no AI, network or API surface is added by the Place Pool', async () => {
  const b = await itinerary();
  const requests = b.requests.length;
  b.context.window.matchMedia = () => ({ matches: true });
  b.run('setPlacePoolOpen(true)');
  b.run(`completePlacePoolAdd("${keyOf('asakusa')}", "9/21"); openPlacePoolAddSheet("${keyOf('ueno')}"); closeSheet()`);
  assert.equal(b.requests.length, requests);
  const pool = source.slice(source.indexOf('function insertPlacesIntoItineraryDay'), source.indexOf('function openReorderSheet'));
  const dragCode = source.slice(source.indexOf('let placePoolDrag = null'), source.indexOf('document.addEventListener("dragend", endPlacePoolDrag)'));
  assert.ok(pool.length > 1000 && dragCode.length > 500);
  for (const code of [pool, dragCode]) {
    assert.doesNotMatch(code, /openai|anthropic|gemini|fetch\(|\/api\/|localStorage|sessionStorage|expectedRevision/i);
  }
  const apiFiles = readdirSync(new URL('../api/', import.meta.url)).filter((name) => name.endsWith('.mjs'));
  assert.equal(apiFiles.length, 12);
});

test('drawer and sheet share one element: hidden when closed, bottom sheet by default, docked beside the phone on desktop', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.place-pool\[hidden\] \{ display: none; \}/);
  assert.match(css, /\.place-pool-panel \{[^}]*border-radius: 26px 26px 0 0;/);
  assert.match(css, /@media \(min-width: 900px\) and \(hover: hover\) and \(pointer: fine\) \{\s*body\.place-pool-docked \.stage \{ padding-right: 408px; \}/);
  assert.match(source, /const PLACE_POOL_DOCKED_MEDIA = "\(min-width: 900px\) and \(hover: hover\) and \(pointer: fine\)";/);
});
