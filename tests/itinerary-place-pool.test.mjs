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

test('Place Pool lists Places absent from every itinerary day, including lodging, and excludes scheduled Places', async () => {
  const b = await itinerary({ itinerary: { '9/21': [{ id: 'place:9/21:淺草寺', name: '淺草寺', time: '10:00' }] } });
  assert.deepEqual(poolNames(b), ['上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
  const html = b.app.innerHTML;
  assert.match(html, /data-toggle-place-pool aria-expanded="false" aria-controls="place-pool-panel"/);
  assert.match(html, /<span>行程規劃<\/span><b>4<\/b>/);
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

test('toggle, close and Escape drive the fullscreen workspace with aria-expanded; filter clicks change view state only', async () => {
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

// --- Fullscreen workspace architecture --------------------------------------------------------

test('the entry point and workspace title read 行程規劃, not the old 地點池 copy', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  const html = b.app.innerHTML;
  assert.doesNotMatch(html, /地點池/);
  assert.match(html, /<h2 id="place-pool-title">行程規劃<\/h2>/);
  assert.match(html, /aria-label="關閉行程規劃"/);
});

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('desktop: a static two-column layout — Selected column left, candidates column right', () => {
  assert.match(css, /\.place-pool-selected-column \{ position: static; transform: none; flex: 0 0 320px;/);
  assert.match(css, /\.place-pool-layout \{ flex-direction: row;/);
  assert.match(css, /\.place-pool-mobile-handle \{ display: none; \}/);
});

test('mobile: the main workspace shows only filters + candidates; Selected becomes a right-side drawer', () => {
  assert.match(css, /\.place-pool-selected-column \{ position: fixed; z-index: 5; top: 0; right: 0; bottom: 0;/);
  assert.match(css, /transform: translateX\(100%\); transition: transform 0\.25s ease;/);
  assert.match(css, /\.place-pool-workspace\.is-drawer-open \.place-pool-selected-column \{ transform: translateX\(0\); \}/);
});

test('the old docked side-panel and bottom-sheet layouts no longer apply to the workspace', () => {
  // id="place-pool-panel" itself is intentionally kept (aria-controls wiring); only the old
  // docked/bottom-sheet CSS classes and the dimmed backdrop element are gone.
  assert.doesNotMatch(source, /body\.place-pool-docked/);
  assert.doesNotMatch(source, /place-pool-backdrop/);
  assert.doesNotMatch(source, /class="place-pool-panel/);
  assert.doesNotMatch(css, /place-pool-docked|place-pool-backdrop|\.place-pool-panel\b/);
  assert.match(css, /\.place-pool \{ position: fixed; z-index: 60; inset: 0; \}/);
  assert.match(css, /\.place-pool-workspace \{[^}]*height: 100dvh;/);
});

test('selected count uses currently valid entries, not the raw key Set size, when a selected Place leaves the pool from elsewhere', async () => {
  const b = await itinerary();
  b.run(`placePoolSelectedKeys().add("${keyOf('ueno')}"); placePoolSelectedKeys().add("${keyOf('tsukiji')}")`);
  assert.equal(b.run('placePoolSelectedKeys().size'), 2);
  b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`);
  assert.deepEqual(selectedNames(b), ['築地壽司']);
  assert.equal(b.run('placePoolSelectedKeys().size'), 1);
});

// --- Selection-first interaction -------------------------------------------------------------

test('click/tap toggles Place Pool selection with aria-pressed, and the Place never leaves the main list', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), ['上野動物園']);
  let html = b.app.innerHTML;
  // The main list still carries every Place in the same stable order; selection only changes
  // aria-pressed and reveals the 指定日期 control, never removes/reorders the card.
  const mainListHtml = html.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(mainListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}" aria-pressed="true"`));
  assert.match(mainListHtml, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
  assert.match(html, /已選 1 個/);
  const selectedListHtml = html.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(selectedListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}"`));
  assert.match(selectedListHtml, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
  assert.doesNotMatch(selectedListHtml, /place-tag-area|place-pool-favorite/);
  // Clicking the card again unselects it; it stays in the main list, just without the date control.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), []);
  html = b.app.innerHTML;
  assert.match(html, /place-pool-selected-empty/);
  const mainListAfter = html.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(mainListAfter, new RegExp(`data-pool-place="${keyOf('ueno')}" aria-pressed="false"`));
  assert.doesNotMatch(mainListAfter, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
  assert.deepEqual(poolNames(b), ['淺草寺', '上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
});

test('all Places selected: the main list still shows every one of them, never an empty state', async () => {
  const b = await itinerary();
  for (const key of ['asakusa', 'ueno', 'tsukiji', 'shibuya', 'ginza']) {
    await click(b, '[data-pool-place]', { poolPlace: keyOf(key) });
  }
  assert.equal(b.run('placePoolSelectedEntries().length'), 5);
  b.run('setPlacePoolOpen(true)');
  const html = b.app.innerHTML;
  assert.doesNotMatch(html, /place-pool-empty/);
  const mainListHtml = html.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  for (const key of ['asakusa', 'ueno', 'tsukiji', 'shibuya', 'ginza']) {
    assert.match(mainListHtml, new RegExp(`data-pool-place="${keyOf(key)}" aria-pressed="true"`));
  }
});

test('empty-state copy distinguishes "nothing matches the filter" from "nothing left to plan at all", and never claims the old copy', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  b.state.placePool.kind = 'lodging';
  b.state.placePool.favoriteOnly = true; // 銀座飯店 has no votes, so this filter combination matches nothing.
  b.run('render({ preserveScroll: true, filterOnly: true })');
  assert.match(b.app.innerHTML, /place-pool-empty">目前篩選條件下沒有地點/);
});

test('when every Place is already scheduled, the main list shows "目前沒有可規劃的地點", never the old copy', async () => {
  const scheduled = ['淺草寺', '上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']
    .map((name, index) => ({ id: `place:9/20:${name}`, name, time: `${10 + index}:00` }));
  const b = await itinerary({ itinerary: { '9/20': scheduled } });
  b.run('setPlacePoolOpen(true)');
  assert.match(b.app.innerHTML, /place-pool-empty">目前沒有可規劃的地點/);
  assert.doesNotMatch(b.app.innerHTML, /所有收藏地點都已排入行程|沒有符合篩選的待選地點/);
});

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

test('filters narrow only the main list; the Selected Summary stays fully visible regardless of the current filter', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // attraction
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') }); // restaurant
  b.state.placePool.kind = 'restaurant';
  b.run('render({ preserveScroll: true, filterOnly: true })');
  assert.deepEqual(selectedNames(b), ['上野動物園', '築地壽司']);
  const html = b.app.innerHTML;
  const selectedListHtml = html.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(selectedListHtml, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
  assert.match(selectedListHtml, new RegExp(`data-pool-constraint="${keyOf('tsukiji')}"`));
  // 上野動物園 is an attraction: the restaurant filter hides it from the main list exactly like any
  // unselected attraction, but 築地壽司 (a restaurant, still selected) stays visible there too.
  const mainListHtml = html.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(mainListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}"`));
  assert.match(mainListHtml, new RegExp(`data-pool-place="${keyOf('tsukiji')}" aria-pressed="true"`));
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') });
  assert.equal(b.run(`placePoolSelectedKeys().has("${keyOf('tsukiji')}")`), false);
});

test('the Selected column never auto-collapses, even past 6 or 7 selected Places; it scrolls independently instead', async () => {
  const list = ['ginza', 'ebisu', 'daikanyama', 'shibuya', 'asakusa', 'shinjuku', 'otsuka']
    .map((key, index) => place(key, { name: `景點${index}` }));
  const b = await itinerary({}, list);
  for (const key of ['ginza', 'ebisu', 'daikanyama', 'shibuya', 'asakusa', 'shinjuku', 'otsuka']) {
    await click(b, '[data-pool-place]', { poolPlace: keyOf(key) });
  }
  assert.equal(b.run('placePoolSelectedEntries().length'), 7);
  const html = b.app.innerHTML;
  assert.match(html, /已選 7 個/);
  assert.doesNotMatch(html, /data-pool-selected-toggle/);
  const selectedListHtml = html.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  for (const key of ['ginza', 'ebisu', 'daikanyama', 'shibuya', 'asakusa', 'shinjuku', 'otsuka']) {
    assert.match(selectedListHtml, new RegExp(`data-pool-constraint="${keyOf(key)}"`));
  }
});

test('desktop drag from the dedicated handle uses the shared add helper and 加入地點 contract; the Place leaves the pool and any stale selection/constraint is pruned', async () => {
  const b = await itinerary();
  b.context.window.matchMedia = () => ({ matches: true });
  b.run('setPlacePoolOpen(true)');
  // Drag lives on candidate cards only (Selected already has its own constraint-sheet add path);
  // select a *different* Place so the pruning half of this test still has something to check.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.match(b.app.innerHTML, new RegExp(`data-pool-drag="${keyOf('asakusa')}" draggable="true"`));
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

test('unselected cards never expose a date control; a selected card does, defaulting to 指定日期', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  assert.doesNotMatch(b.app.innerHTML, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.match(b.app.innerHTML, new RegExp(`data-pool-constraint="${keyOf('ueno')}" aria-haspopup="dialog">指定日期`));
});

test('the Selected row exposes no manual direct-add action (removed: it duplicated 指定日期); the underlying 直接加入行程 helper chain still works for any other caller', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  spy(b);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  const selectedListHtml = b.app.innerHTML.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(selectedListHtml, /data-pool-add|place-pool-selected-add|＋/);
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  assert.doesNotMatch(b.sheet.innerHTML, /data-pool-add|直接加入行程/);
  b.run('closeSheet()');
  b.run(`openPlacePoolAddSheet("${keyOf('ueno')}")`);
  const addSheet = b.sheet.innerHTML;
  assert.match(addSheet, /id="add-place-day-form" data-place-name="上野動物園" data-add-source="place-pool" data-place-key="app:synthetic-ueno"/);
  assert.match(addSheet, /<h2>加入行程<\/h2>/);
  const form = { id: 'add-place-day-form', dataset: { placeName: '上野動物園', addSource: 'place-pool', placeKey: keyOf('ueno') }, values: { date: '9/22' } };
  await listener(b, 'submit', 'add-place-day-form')({ target: form, preventDefault() {} });
  assert.deepEqual(json(b.run('poolCalls')), [['add', keyOf('ueno'), '9/22'], ['insert', '9/22', ['上野動物園']]]);
  assert.equal(b.run('persistCalls'), 1);
  assert.equal(b.sheet.innerHTML, '');
  assert.equal(b.state.selectedDate, '9/22');
  assert.equal(b.state.placePool.open, true);
  assert.ok(!poolNames(b).includes('上野動物園'));
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

test('same-name Places fail closed: neither is listed, selectable, addable or constraint-editable, and invalid dates are refused', async () => {
  const list = [place('ueno', { name: '拉麵店', kind: 'restaurant' }), place('shibuya', { name: '拉麵店', kind: 'restaurant' }), place('asakusa', { name: '淺草寺' })];
  const b = await itinerary({}, list);
  spy(b);
  assert.deepEqual(poolNames(b), ['淺草寺']);
  assert.equal(b.run('getUnscheduledPlaces().ambiguousCount'), 2);
  b.run('setPlacePoolOpen(true)');
  assert.match(b.app.innerHTML, /2 個同名地點無法在行程規劃中選取/);
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('ueno')}", "9/21")`)), { ok: false, reason: 'NOT_IN_POOL' });
  b.run(`openPlacePoolAddSheet("${keyOf('ueno')}")`);
  assert.doesNotMatch(b.sheet.innerHTML, /add-place-day-form/);
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  assert.doesNotMatch(b.sheet.innerHTML, /place-pool-constraint-dialog/);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.equal(b.run('placePoolSelectedKeys().size'), 0);
  assert.match(b.app.innerHTML, /place-pool-selected-empty/);
  assert.deepEqual(json(b.run(`addPlaceToItineraryDay("${keyOf('asakusa')}", "12/31")`)), { ok: false, reason: 'INVALID_DATE' });
  assert.equal(b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/21", mode: "none", preferredPeriods: [], exactTime: null }])`), false);
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

test('sticky CTA shows the correct Phase 1B.1 copy and performs zero mutation, persistence or network', async () => {
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

// --- Mobile Selected drawer + handle -----------------------------------------------------------

test('the mobile Selected drawer handle is fixed at the right-center of the viewport and always visible, including at 0 selected', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  let html = b.app.innerHTML;
  assert.match(html, /data-pool-drawer-toggle aria-expanded="false" aria-controls="place-pool-selected-column" aria-label="已選地點，0 個"/);
  assert.match(html, /place-pool-mobile-handle-label">已選<\/span>/);
  assert.match(html, /place-pool-mobile-handle-count">0</);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  html = b.app.innerHTML;
  assert.match(html, /aria-label="已選地點，1 個"/);
  assert.match(html, /place-pool-mobile-handle-count">1</);
});

test('the drawer opens from the right, the handle follows its left edge, and the chevron flips direction', async () => {
  const b = await itinerary();
  b.run('setPlacePoolOpen(true)');
  assert.doesNotMatch(b.app.innerHTML, /is-drawer-open/);
  assert.match(b.app.innerHTML, /place-pool-mobile-handle-chevron" aria-hidden="true">‹/);
  await click(b, '[data-pool-drawer-toggle]');
  assert.equal(b.run("placePoolDrawerIsOpen()"), true);
  let html = b.app.innerHTML;
  assert.match(html, /place-pool-workspace is-drawer-open/);
  assert.match(html, /data-pool-drawer-toggle aria-expanded="true"/);
  assert.match(html, /place-pool-mobile-handle-chevron" aria-hidden="true">›/);
  await click(b, '[data-pool-drawer-toggle]');
  assert.equal(b.run("placePoolDrawerIsOpen()"), false);
  html = b.app.innerHTML;
  assert.doesNotMatch(html, /is-drawer-open/);
  assert.match(html, /place-pool-mobile-handle-chevron" aria-hidden="true">‹/);
});

test('a Place can be unselected directly from the Selected column/drawer via its own checkmark, without returning to a candidate card', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), ['上野動物園']);
  // The checkmark reuses the exact same data-pool-place / togglePlacePoolSelection contract.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  assert.deepEqual(selectedNames(b), []);
  assert.deepEqual(poolNames(b), ['淺草寺', '上野動物園', '築地壽司', '澀谷 PARCO', '銀座飯店']);
});

test('drawer rows show name + date summary only, never tags, geography, a restaurant category, or a manual-add action', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run('setPlacePoolOpen(true)');
  const html = b.app.innerHTML;
  const row = itemBlock(html, keyOf('ueno'));
  assert.match(row, /place-pool-selected-check/);
  assert.match(row, /上野動物園/);
  assert.match(row, /未指定日期/);
  assert.doesNotMatch(row, /data-pool-add|place-pool-selected-add|＋/);
  assert.doesNotMatch(row, /place-tag-area|highlight-tag|place-pool-favorite|景點 ·/);
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

test('the same summary formatter is used by the main-list card, the desktop Selected column, and the mobile drawer', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "exact", preferredPeriods: [], exactTime: "18:30" }])`);
  b.context.window.matchMedia = () => ({ matches: true }); // docked/desktop
  b.run('setPlacePoolOpen(true)');
  const desktopHtml = b.app.innerHTML;
  const mainListHtml = desktopHtml.match(/<ul class="place-pool-list" data-place-pool-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  const mainRow = itemBlock(mainListHtml, keyOf('ueno'));
  assert.match(mainRow, new RegExp(`data-pool-place="${keyOf('ueno')}" aria-pressed="true"`));
  assert.match(mainRow, new RegExp(`data-pool-constraint="${keyOf('ueno')}" aria-haspopup="dialog"`));
  assert.match(mainRow, /9\/22・18:30/);
  const selectedListHtml = desktopHtml.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(selectedListHtml, /9\/22・18:30/);
  b.context.window.matchMedia = () => ({ matches: false }); // mobile drawer
  b.run('render({ preserveScroll: true })');
  const mobileSelectedHtml = b.app.innerHTML.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.match(mobileSelectedHtml, /9\/22・18:30/);
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

test('the date dialog is a centered modal titled 指定日期, showing the place name, every trip day unchecked by default, and never the old 規劃限制 copy', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  const sheet = b.sheet.innerHTML;
  assert.match(sheet, /place-pool-constraint-backdrop/);
  assert.match(sheet, /place-pool-constraint-dialog/);
  assert.match(sheet, /<h2>指定日期<\/h2>/);
  assert.match(sheet, /section-kicker">上野動物園/);
  assert.doesNotMatch(sheet, /規劃限制/);
  assert.match(sheet, /未勾選日期時，將交由 AI 自由安排/);
  for (const date of ['9/20', '9/21', '9/22', '9/23']) {
    assert.match(sheet, new RegExp(`data-pool-constraint-date="${date.replace('/', '\\/')}"`));
  }
  assert.doesNotMatch(sheet, /checked/); // dateOptions=[] -> nothing pre-checked, no restored/hidden day
  assert.doesNotMatch(sheet, /直接加入行程|data-pool-add/);
  assert.match(sheet, /<button class="secondary-button" type="button" data-pool-constraint-cancel>取消<\/button>/);
  assert.match(sheet, /<button class="primary-button" type="button" data-pool-constraint-confirm>確定<\/button>/);
});

test('checking a date reveals its 不指定時間 time-summary row; clicking it expands the mode/period/time editor', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  b.run('togglePoolConstraintDraftDate("9/22")');
  let sheet = b.sheet.innerHTML;
  assert.match(sheet, /data-pool-constraint-date="9\/22" checked/);
  assert.match(sheet, /data-pool-constraint-expand="9\/22"[\s\S]*?不指定時間/);
  assert.doesNotMatch(sheet, /place-pool-constraint-time-editor/);
  b.run('togglePoolConstraintExpandedDay("9/22")');
  sheet = b.sheet.innerHTML;
  assert.match(sheet, /place-pool-constraint-time-editor/);
  assert.match(sheet, /data-pool-constraint-mode="none" aria-pressed="true"/);
  assert.match(sheet, /data-pool-constraint-mode="preferred" aria-pressed="false"/);
  assert.match(sheet, /data-pool-constraint-mode="exact" aria-pressed="false"/);
});

test('unchecking a date removes it from the draft entirely, including any time rule it carried', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  b.run('togglePoolConstraintDraftDate("9/22"); togglePoolConstraintExpandedDay("9/22"); setPoolConstraintDraftMode("exact")');
  assert.equal(b.run('pendingPoolConstraint.dates.has("9/22")'), true);
  b.run('togglePoolConstraintDraftDate("9/22")');
  assert.equal(b.run('pendingPoolConstraint.dates.has("9/22")'), false);
  assert.equal(b.run('pendingPoolConstraint.expandedDayKey'), null);
});

test('the exact-time wheel commit updates only the summary text of the currently expanded date row, never the first checked row in DOM order (regression: every checked row shares the same data-pool-constraint-time-summary-text attribute, so an unscoped querySelector previously wrote into the wrong row once two dates were checked)', () => {
  assert.match(source, /document\.querySelector\(`\[data-pool-constraint-expand="\$\{pendingPoolConstraint\.expandedDayKey\}"\] \[data-pool-constraint-time-summary-text\]`\)/);
});

test('confirming the date dialog commits the draft dateOptions with zero network/persist', async () => {
  const b = await itinerary();
  spy(b);
  const requests = b.requests.length;
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  b.run('togglePoolConstraintDraftDate("9/22"); togglePoolConstraintExpandedDay("9/22"); setPoolConstraintDraftMode("exact")');
  b.run('pendingPoolConstraint.timeWheel = { hour: "18", minute: "30" }; pendingPoolConstraint.dates.get("9/22").exactTime = "18:30"');
  b.run('confirmPlacePoolConstraint()');
  assert.equal(b.sheet.innerHTML, '');
  assert.deepEqual(json(b.run(`placePoolConstraintFor("${keyOf('ueno')}")`)), [{ dayKey: '9/22', mode: 'exact', preferredPeriods: [], exactTime: '18:30' }]);
  assert.equal(b.requests.length, requests);
  assert.equal(b.run('persistCalls'), 0);
  assert.deepEqual(json(b.state.itinerary), {});
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

test('Escape cancels the date dialog and discards the draft, like backdrop/×/取消', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  b.run('togglePoolConstraintDraftDate("9/22")');
  listener(b, 'keydown', 'pendingPoolConstraint')({ key: 'Escape', preventDefault() {} });
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

test('the desktop Selected column exposes no manual direct-add action, only the unselect checkmark and the 指定日期 row', async () => {
  const b = await itinerary();
  b.context.window.matchMedia = () => ({ matches: true }); // docked/desktop
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run('setPlacePoolOpen(true)');
  const selectedListHtml = b.app.innerHTML.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(selectedListHtml, /data-pool-add|place-pool-selected-add|＋/);
  assert.match(selectedListHtml, new RegExp(`data-pool-place="${keyOf('ueno')}"`));
  assert.match(selectedListHtml, new RegExp(`data-pool-constraint="${keyOf('ueno')}"`));
});

test('there is no data-pool-add trigger anywhere inside 行程規劃\'s Selected Summary markup (desktop column or mobile drawer share one template), and no lingering unused CSS for it', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run('setPlacePoolOpen(true)');
  const selectedListHtml = b.app.innerHTML.match(/data-place-pool-selected-list>([\s\S]*?)<\/ul>/)?.[1] || '';
  assert.doesNotMatch(selectedListHtml, /data-pool-add/);
  assert.doesNotMatch(css, /\.place-pool-selected-add\b/);
});

test('unselecting from the Selected Summary still works, and the 指定日期 summary is still clickable, after removing the direct-add action', async () => {
  const b = await itinerary();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint("${keyOf('ueno')}", [{ dayKey: "9/22", mode: "none", preferredPeriods: [], exactTime: null }])`);
  b.run('setPlacePoolOpen(true)');
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // unselect via the Selected row's own checkmark
  assert.deepEqual(selectedNames(b), []);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') }); // re-select
  b.run(`openPlacePoolConstraintSheet("${keyOf('ueno')}")`);
  assert.match(b.sheet.innerHTML, /<h2>指定日期<\/h2>/);
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
  assert.match(source, /if \(!open\) \{\s*const list = document\.querySelector\("\[data-place-pool-list\]"\);\s*if \(list\) session\.savedScrollTop = list\.scrollTop;/);
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
