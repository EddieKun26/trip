import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import '../lib/travel-area-audit.js';
import AreaTags from '../lib/area-tags.js';
import PlanningGeography from '../lib/planning-geography.js';
import tripHandler from '../api/trip.mjs';
import { boot, trip, place, editorForm, bindFullEditor, edit, submitFull, json, source } from './helpers/phase-c-browser.mjs';

// Planning Geography UX refinement: 主要地區 → 地區標籤 dropdown cascade, no Canonical Area in normal
// UI, locality-only area-tag suggestions, and editable AI / content tags in `contentTags` with a
// read-only legacy `highlights` adapter.
const { getPlacePlanningGeography: geo } = PlanningGeography;
const catalog = JSON.parse(readFileSync(new URL('../data/area-geometry/travel-area-boundaries.json', import.meta.url), 'utf8'));
const GROUP_A = 'group:shibuya-harajuku-ebisu', GINZA = 'group:ginza-tsukiji-tokyo-station';
const component = (longText, type = 'sublocality_level_2') => ({ longText, types: [type] });
function rukuma(extra = {}) {
  // Coordinates inside the verified ebisu polygon; address locality is Ebisunishi / 恵比寿西.
  return place('ebisu', { id: 'synthetic-rukuma', name: 'Rukuma Tokyo', kind: 'restaurant', category: '燒肉店',
    latitude: 35.643, longitude: 139.709, areaTags: ['惠比壽西'], restaurantTags: ['燒肉'],
    highlights: ['內臟燒肉', '晚餐候選', '惠比壽一帶', 'Google Maps 匯入'],
    description: '惠比壽、代官山一帶的內臟燒肉候選', addressComponents: [component('Ebisunishi')],
    addressComponentsOriginal: [component('恵比寿西')], ...extra });
}
function fixtures() {
  return [
    rukuma(),
    place('harajuku', { id: 'synthetic-harajuku', name: 'Harajuku Walk', areaTags: ['神宮前'] }),
    place('yoyogi-park', { id: 'synthetic-yoyogi', name: 'Yoyogi Picnic', areaTags: ['代々木'] }),
    place('shinjuku', { id: 'synthetic-gyutan', name: 'Gyutan Lemon', kind: 'restaurant', areaTags: ['西新宿', '代々木'], restaurantTags: ['牛舌'] }),
    place('ginza', { id: 'synthetic-ginza', name: 'Ginza Museum', areaTags: ['銀座'] }),
    place('otsuka', { id: 'synthetic-aburu', name: 'Aburu', kind: 'restaurant', areaTags: ['北大塚'], restaurantTags: ['燒肉'],
      contentTags: ['燒肉', '必吃'], highlights: ['燒肉', '北大塚', '大塚站附近'] }),
    place('toyosu', { id: 'synthetic-toyosu', name: 'Toyosu Market', kind: 'shopping', areaTags: ['豐洲'] }),
    place('shinjuku', { id: 'synthetic-stay', name: 'Shinjuku Stay', kind: 'lodging', areaTags: ['大久保'], highlights: ['自訂地點', '地址已自行確認'] }),
  ];
}
const bootPlaces = (places = fixtures()) => boot(trip(places));
function dropdown(b, filter, prefix = 'places') {
  const match = b.app.innerHTML.match(new RegExp(`<select id="${prefix}-filter-${filter}" data-places-filter="${filter}">([\\s\\S]*?)</select>`));
  if (!match) return null;
  const options = [...match[1].matchAll(/<option value="([^"]*)"( selected)?>([^<]*)<\/option>/g)];
  return { values: options.map(o => o[1]), labels: options.map(o => o[3]), selected: options.find(o => o[2])?.[1] ?? null };
}
async function choose(b, filter, value) {
  const target = { value, dataset: { placesFilter: filter }, matches: selector => selector === '[data-places-filter]', closest: () => null };
  for (const listener of b.listeners.change) await listener({ target });
}
const visibleNames = b => [...b.app.innerHTML.matchAll(/<article class="place-row[\s\S]*?<strong>([^<]+)<\/strong>/g)].map(m => m[1]);
function cardOf(html, name) {
  const index = html.indexOf(`<strong>${name}</strong>`);
  assert.ok(index >= 0, `missing card ${name}`);
  return html.slice(html.lastIndexOf('<article', index), html.indexOf('</article>', index));
}
function sectionOf(html, name) {
  const marker = 'group-title">⌖ ', title = html.lastIndexOf(marker, html.indexOf(`<strong>${name}</strong>`));
  return html.slice(title + marker.length, html.indexOf('</h2>', title));
}
const tagChip = (type, text) => new RegExp(`data-place-tag-type="${type}"><span class="visually-hidden">[^<]*</span>${text}</span>`);
const persistenceOrLookup = request => request.options?.method === 'PUT' || /\/api\/places|\/api\/place-photo|geocode|googleapis/.test(request.url);
function contentEditor(form) {
  const editor = form.querySelector('[data-content-tag-editor]');
  const query = form.querySelector;
  form.querySelector = selector => Object.assign(query(selector), { focus() {} });
  return {
    remove: index => editor.fire('click', { target: { closest: wanted => wanted === '[data-remove-content-tag]' ? { dataset: { removeContentTag: String(index) } } : null } }),
    add: () => editor.fire('click', { target: { closest: wanted => wanted === '[data-add-content-tag]' ? { dataset: {} } : null } }),
    type: (index, value) => {
      if (form.placeEditorSession.nestedTag === 'content') {
        form.querySelector('[data-custom-content-tag]').value = value;
        form.fire('click', { target: { closest: selector => selector === '[data-confirm-nested-tag]' ? {} : null } });
      } else editor.fire('input', { target: { dataset: { contentTagIndex: String(index) }, value } });
    },
  };
}
async function roundTrip(b, stored) {
  const requestDone = b.run('saveSharedTrip()');
  await new Promise(resolve => setImmediate(resolve));
  const put = b.requests.find(request => request.options.method === 'PUT' && request.url === '/api/trip?id=b' && !request.replied);
  assert.ok(put, 'real persist path must produce Trip PUT');
  const oldFetch = globalThis.fetch, names = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const oldEnv = names.map(key => process.env[key]);
  process.env.KV_REST_API_URL = 'https://ux-refinement-redis.invalid'; process.env.KV_REST_API_TOKEN = 'synthetic';
  const token = 'ux-refinement-local-session', hash = createHash('sha256').update(token).digest('hex');
  const storage = new Map([['tokyo-family-trip:trip:b', JSON.stringify(stored)],
    [`tokyo-family-trip:session:${hash}`, JSON.stringify({ id: 'alice', nickname: 'alice' })]]);
  globalThis.fetch = async (url, options) => {
    const [op, key, value] = JSON.parse(options.body);
    if (op === 'SET') storage.set(key, value);
    return { ok: true, json: async () => ({ result: op === 'GET' ? storage.get(key) || null : 'OK' }) };
  };
  async function request(method, body) {
    let payload;
    const res = { code: 0, status(n) { this.code = n; return this; }, setHeader() {}, json(value) { payload = value; } };
    await tripHandler({ method, body, query: { id: 'b' }, headers: { cookie: `tokyo_trip_session=${token}` } }, res);
    assert.equal(res.code, 200); return payload;
  }
  try {
    const saved = await request('PUT', JSON.parse(put.options.body));
    await b.reply(put, saved); await requestDone;
    return await request('GET');
  } finally {
    globalThis.fetch = oldFetch;
    names.forEach((key, index) => oldEnv[index] === undefined ? delete process.env[key] : process.env[key] = oldEnv[index]);
  }
}

test('UX dropdowns: the list renders 地點類別, 主要地區, 地區標籤 and 餐廳類別 as labelled single-select dropdowns without chip filters', async () => {
  const b = await bootPlaces();
  const html = b.app.innerHTML;
  for (const [filter, label] of [['kind', '地點類別'], ['section', '主要地區'], ['areaTag', '地區標籤'], ['restaurantTag', '餐廳類別']]) {
    assert.match(html, new RegExp(`<label for="places-filter-${filter}">${label}</label><select id="places-filter-${filter}" data-places-filter="${filter}">`), filter);
  }
  assert.deepEqual(dropdown(b, 'kind').values, ['all', 'attraction', 'restaurant', 'lodging', 'shopping']);
  assert.equal(dropdown(b, 'kind').selected, 'all');
  for (const filter of ['section', 'areaTag', 'restaurantTag']) assert.deepEqual([dropdown(b, filter).values[0], dropdown(b, filter).labels[0]], ['', '全部'], filter);
  assert.doesNotMatch(html, /places-filter-chips|place-kind-tabs|data-place-kind|data-area-tag-filter|data-place-area-filter|data-restaurant-tag-filter|<select[^>]*multiple/);
});

test('UX dropdowns: one client state per filter drives the list and both map layouts through one change handler', async () => {
  assert.doesNotMatch(source, /placeAreaFilter|data-map-area|data-map-kind|data-place-kind|placesFilterChips|placeKindTabs|canonicalAreaChip/);
  assert.equal((source.match(/data-places-filter="\$\{filter\}"/g) || []).length, 1, 'one dropdown renderer');
  assert.match(source, /placesFilterDropdowns\(filters\)/);
  assert.match(source, /const placeFilters = placesFilterDropdowns\(filterModel/);
  const b = await bootPlaces();
  await choose(b, 'section', GROUP_A);
  assert.equal(b.state.placeSectionFilter, GROUP_A);
  b.run('state.placesMode = "map"; render({ filterOnly: true })');
  assert.equal(dropdown(b, 'section', 'map').selected, GROUP_A);
  b.run('mapFullscreen = true; render({ filterOnly: true })');
  assert.equal(dropdown(b, 'section', 'map-drawer').selected, GROUP_A);
  assert.doesNotMatch(b.app.innerHTML, /惠比壽（恵比寿）/, 'map sidebar shows 主要地區, never the Canonical Area');
  b.run('mapFullscreen = false; state.placesMode = "list"; render({ filterOnly: true })');
  assert.equal(dropdown(b, 'section').selected, GROUP_A);
});

test('主要地區 options use sectionKey identity and sectionLabel in list order, never grouped Canonical Areas', async () => {
  const b = await bootPlaces();
  const section = dropdown(b, 'section');
  const titles = [...b.app.innerHTML.matchAll(/group-title">⌖ ([^<]+)<\/h2>/g)].map(match => match[1]);
  assert.deepEqual(section.values.slice(1), [GROUP_A, 'area:shinjuku', GINZA, 'group:ikebukuro-otsuka', 'group:odaiba-toyosu']);
  assert.deepEqual(section.labels.slice(1), ['澀谷・原宿・惠比壽', '新宿', '銀座・築地・東京車站', '池袋・大塚', '台場・豐洲']);
  assert.deepEqual(section.labels.slice(1), titles, 'dropdown order is the list section order');
  for (const key of ['ebisu', 'harajuku', 'yoyogi-park', 'ginza', 'otsuka', 'toyosu']) assert.ok(!section.values.includes(key), key);
  assert.ok(!section.labels.some(label => /惠比壽（恵比寿）|^原宿$|^代官山$/.test(label)));
  for (const value of section.values.slice(1)) assert.match(value, /^(?:group|area):/);
});

test('Canonical Area still drives the 主要地區 section and list grouping is unchanged', async () => {
  const b = await bootPlaces();
  assert.equal(sectionOf(b.app.innerHTML, 'Rukuma Tokyo'), '澀谷・原宿・惠比壽');
  assert.equal(sectionOf(b.app.innerHTML, 'Gyutan Lemon'), '新宿');
  assert.equal(sectionOf(b.app.innerHTML, 'Shinjuku Stay'), '新宿');
  assert.equal((b.app.innerHTML.match(/class="place-group"/g) || []).length, 5);
  for (const probe of b.state.places) {
    b.context.probe = probe;
    assert.equal(b.run('planningSectionKey(probe)'), geo(probe).sectionKey);
  }
});

test('Rukuma final card: ⌖ locality, category and real content tags only; no Canonical Area, no source metadata', async () => {
  const b = await bootPlaces();
  const card = cardOf(b.app.innerHTML, 'Rukuma Tokyo');
  assert.equal(sectionOf(b.app.innerHTML, 'Rukuma Tokyo'), '澀谷・原宿・惠比壽');
  assert.deepEqual([...card.matchAll(/data-place-tag-type="(\w+)"><span class="visually-hidden">[^<]*<\/span>([^<]+)<\/span>/g)].map(m => `${m[1]}:${m[2]}`),
    ['area:惠比壽西', 'category:燒肉', 'content:內臟燒肉', 'content:晚餐候選', 'content:惠比壽一帶']);
  assert.doesNotMatch(card, /data-canonical-area-chip|canonical-area-chips|惠比壽（恵比寿）|旅遊分區|Google Maps 匯入/);
  const aburu = cardOf(b.app.innerHTML, 'Aburu');
  assert.match(aburu, tagChip('content', '必吃'));
  assert.doesNotMatch(aburu, /大塚站附近/, 'contentTags are authoritative over legacy highlights');
  assert.equal((aburu.match(/>燒肉<\/span>/g) || []).length, 1, 'identical text renders once');
  const stay = cardOf(b.app.innerHTML, 'Shinjuku Stay');
  assert.doesNotMatch(stay, /自訂地點|地址已自行確認|data-place-tag-type="content"/);
});

test('Place detail shows 主要地區 as its geography summary, typed tags, and never Canonical Area or source metadata', async () => {
  const b = await bootPlaces();
  b.run('openPlaceSheet(placeDetailKey(state.places[0]), { refreshDetails: false })');
  const html = b.sheet.innerHTML, start = html.indexOf('class="detail-area-tags"');
  const row = html.slice(start, html.indexOf('</section>', start));
  assert.match(row, tagChip('area', '惠比壽西')); assert.match(row, tagChip('category', '燒肉')); assert.match(row, tagChip('content', '晚餐候選'));
  assert.match(html, /<p class="detail-geography-summary">主要地區：澀谷・原宿・惠比壽<\/p>/);
  assert.doesNotMatch(html, /旅遊分區|惠比壽（恵比寿）|detail-legacy-area|Google Maps 匯入|class="highlight-list"|data-canonical-area-chip/);
  assert.equal(b.requests.filter(persistenceOrLookup).length, 0);
});

test('legacy highlights adapter keeps real content tags and drops only exact source metadata and geography display values', async () => {
  const b = await bootPlaces();
  const adapt = probe => { b.context.probe = probe; return json(b.run('placeContentTags(probe)')); };
  assert.deepEqual(adapt(rukuma()), ['內臟燒肉', '晚餐候選', '惠比壽一帶'], 'Google Maps 匯入 is source metadata; 惠比壽一帶 is not an exact Canonical value');
  assert.deepEqual(adapt(place('shinjuku', { highlights: ['自訂地點', '地址已自行確認', '午晚餐皆可'] })), ['午晚餐皆可']);
  assert.deepEqual(adapt(place('ginza', { sourcePlatform: 'Instagram', highlights: ['Instagram', '社群推薦', 'Google Maps 共用清單', '待確認旅遊分區', '銀座用餐'] })), ['銀座用餐']);
  assert.deepEqual(adapt(place('ebisu', { category: '牛排館', areaTags: ['惠比壽南'], restaurantTags: ['牛排'],
    highlights: ['牛排館', '惠比壽', ' 恵比寿 ', '惠比壽（恵比寿）', '澀谷・原宿・惠比壽', '惠比壽南', '牛排', '重點晚餐', '惠比壽一帶'] })), ['重點晚餐', '惠比壽一帶']);
  const ambiguous = PlanningGeography.mergeAreaFields(rukuma({ highlights: ['代官山', '惠比壽', '內臟燒肉'] }), PlanningGeography.ambiguousAreaFields(['ebisu', 'daikanyama']));
  assert.deepEqual(adapt(ambiguous), ['內臟燒肉'], 'ambiguous candidates exclude each candidate Canonical name exactly');
  assert.deepEqual(adapt(rukuma({ contentTags: ['親子', '雨天備案'] })), ['親子', '雨天備案'], 'contentTags win over legacy highlights');
  assert.deepEqual(adapt(rukuma({ contentTags: [] })), [], 'an explicitly cleared contentTags never falls back to highlights');
  assert.equal(Object.hasOwn(b.state.places[0], 'contentTags'), false, 'the adapter never writes contentTags');
});

test('Filter A: Group A 地區標籤 options come only from matched Places; the ginza group never shows Group A tags', async () => {
  const b = await bootPlaces();
  await choose(b, 'section', GROUP_A);
  assert.deepEqual(dropdown(b, 'areaTag').values, ['', '惠比壽西', '神宮前', '代々木']);
  for (const unrelated of ['銀座', '北大塚', '築地', '上野', '西新宿', '豐洲', '大久保']) assert.ok(!dropdown(b, 'areaTag').values.includes(unrelated), unrelated);
  assert.deepEqual(visibleNames(b), ['Rukuma Tokyo', 'Harajuku Walk', 'Yoyogi Picnic']);
  await choose(b, 'section', GINZA);
  assert.deepEqual(dropdown(b, 'areaTag').values, ['', '銀座']);
  assert.deepEqual(visibleNames(b), ['Ginza Museum']);
});

test('changing 主要地區 clears an incompatible 地區標籤 and preserves a compatible one', async () => {
  const b = await bootPlaces();
  await choose(b, 'section', GROUP_A); await choose(b, 'areaTag', '代々木');
  assert.deepEqual(visibleNames(b), ['Yoyogi Picnic']);
  await choose(b, 'section', 'area:shinjuku');
  assert.equal(b.state.areaTagFilter, '代々木'); assert.equal(dropdown(b, 'areaTag').selected, '代々木');
  assert.deepEqual(visibleNames(b), ['Gyutan Lemon']);
  await choose(b, 'section', GINZA);
  assert.equal(b.state.areaTagFilter, ''); assert.equal(dropdown(b, 'areaTag').selected, '');
  assert.deepEqual(visibleNames(b), ['Ginza Museum']);
});

test('地點類別 is an upstream condition for 主要地區 and 地區標籤 options', async () => {
  const b = await bootPlaces();
  await choose(b, 'kind', 'attraction');
  assert.deepEqual(dropdown(b, 'section').values, ['', GROUP_A, GINZA]);
  assert.deepEqual(dropdown(b, 'areaTag').values, ['', '神宮前', '代々木', '銀座']);
  await choose(b, 'section', GROUP_A); await choose(b, 'kind', 'restaurant');
  assert.equal(b.state.placeSectionFilter, GROUP_A);
  assert.deepEqual(dropdown(b, 'areaTag').values, ['', '惠比壽西']);
  await choose(b, 'kind', 'lodging');
  assert.equal(b.state.placeSectionFilter, '', 'a section with no lodging is reset, not kept as a hidden filter');
  assert.deepEqual(dropdown(b, 'areaTag').values, ['', '大久保']);
});

test('filter interactions perform zero persistence, geocode, Places detail, photo or resolver calls and never mutate Places', async () => {
  const b = await bootPlaces();
  const before = json(b.state.places), requests = b.requests.length;
  for (const [filter, value] of [['kind', 'restaurant'], ['section', GROUP_A], ['areaTag', '惠比壽西'], ['restaurantTag', '燒肉'],
    ['kind', 'attraction'], ['section', ''], ['kind', 'all'], ['areaTag', '銀座']]) await choose(b, filter, value);
  assert.equal(b.requests.length, requests);
  assert.equal(b.requests.filter(persistenceOrLookup).length, 0);
  assert.deepEqual(json(b.state.places), before);
  assert.equal(b.run('planningRegionResolutionAttempts.size'), 0);
});

test('餐廳類別 is visible only for 全部 and 餐廳, and a hidden category is cleared and never resurrected', async () => {
  const b = await bootPlaces();
  assert.deepEqual(dropdown(b, 'restaurantTag').values, ['', '燒肉', '牛舌']);
  await choose(b, 'kind', 'restaurant'); assert.ok(dropdown(b, 'restaurantTag'));
  await choose(b, 'restaurantTag', '燒肉'); assert.equal(dropdown(b, 'restaurantTag').selected, '燒肉');
  await choose(b, 'kind', 'attraction');
  assert.equal(dropdown(b, 'restaurantTag'), null); assert.equal(b.state.restaurantTagFilter, '');
  assert.deepEqual(visibleNames(b), ['Harajuku Walk', 'Yoyogi Picnic', 'Ginza Museum']);
  await choose(b, 'kind', 'restaurant');
  assert.equal(dropdown(b, 'restaurantTag').selected, '', 'switching back does not resurrect 燒肉');
  await choose(b, 'kind', 'all'); await choose(b, 'restaurantTag', '燒肉');
  await choose(b, 'kind', 'lodging');
  assert.equal(dropdown(b, 'restaurantTag'), null); assert.equal(b.state.restaurantTagFilter, '');
  assert.deepEqual(visibleNames(b), ['Shinjuku Stay']);
});

test('with 全部 a 餐廳類別 matches only restaurants carrying it, and a hidden category never filters', async () => {
  const b = await bootPlaces();
  await choose(b, 'restaurantTag', '燒肉');
  assert.deepEqual(visibleNames(b), ['Rukuma Tokyo', 'Aburu']);
  for (const index of [1, 2, 3, 4, 6, 7]) { b.context.index = index; assert.equal(b.run('matchesMapFilters(state.places[index])'), false, String(index)); }
  b.run('state.placeKind = "attraction"; state.restaurantTagFilter = "燒肉"; render({ filterOnly: true })');
  assert.equal(b.state.restaurantTagFilter, '');
  assert.deepEqual(visibleNames(b), ['Harajuku Walk', 'Yoyogi Picnic', 'Ginza Museum']);
  b.run('state.restaurantTagFilter = "燒肉"');
  assert.equal(b.run('matchesMapFilters(state.places[1])'), true, 'a hidden category cannot filter the map either');
});

test('Rukuma editor 地區標籤 suggests address locality only: never its containing Canonical Area, other Places or content tags', async () => {
  const b = await bootPlaces();
  assert.deepEqual(AreaTags.travelAreaHits(b.state.places[0], catalog).map(hit => hit.travelAreaKey), ['ebisu'], 'premise: inside the ebisu polygon');
  b.context.catalogData = catalog; b.run('areaGeometryCatalog = catalogData');
  const form = bindFullEditor(b), session = form.placeEditorSession;
  const options = form.querySelector('[data-area-tags-selected]').innerHTML;
  assert.match(options, /data-area-tag-toggle="惠比壽西" aria-pressed="true"/);
  assert.match(options, /data-area-tag-toggle="恵比寿西" aria-pressed="false"/, 'address locality stays a suggestion');
  for (const forbidden of ['惠比壽', '恵比寿', '惠比壽（恵比寿）', '澀谷・原宿・惠比壽', '內臟燒肉', '晚餐候選', '惠比壽一帶',
    '銀座', '北大塚', '豐洲', '神宮前', '代々木', '西新宿', '大久保']) {
    assert.doesNotMatch(options, new RegExp(`data-area-tag-toggle="${forbidden}"`), forbidden);
  }
  const input = form.querySelector('[data-area-tag-input]');
  input.value = '恵'; input.fire('input');
  assert.deepEqual(Array.from(session.areaTagOptions), ['恵比寿西']);
  input.value = '銀'; input.fire('input');
  assert.deepEqual(Array.from(session.areaTagOptions), []);
  input.value = '惠比壽南'; b.run('addAreaTagInput(form)');
  assert.deepEqual(Array.from(session.areaTags), ['惠比壽西', '惠比壽南']);
  assert.deepEqual(json(b.state.places[0].areaTags), ['惠比壽西'], 'nothing persists before Save');
  assert.doesNotMatch(source.slice(source.indexOf('function renderAreaTagDraft'), source.indexOf('function chooseAreaTag')), /areaGeometryCatalog|suggested\.trip|tripTags|旅程已使用/);
});

test('tag backfill proposes the address locality and never writes a Canonical Area for a Place inside its polygon', async () => {
  const b = await bootPlaces();
  b.context.catalogData = catalog; b.context.probes = [rukuma({ areaTags: [] }), place('ginza', { id: 'synthetic-empty-ginza', areaTags: [], latitude: 35.6672123, longitude: 139.7618203, addressComponents: [component('築地')] })];
  const manifest = json(b.run('buildTagBackfillManifest(probes, catalogData)'));
  assert.deepEqual(manifest.map(entry => entry.area), [{ status: 'auto-safe', proposed: ['恵比寿西'] }, { status: 'auto-safe', proposed: ['築地'] }]);
  assert.ok(!JSON.stringify(manifest).match(/惠比壽"|"恵比寿"|"銀座"|澀谷・原宿・惠比壽/));
});

test('Canonical Area editor stays a 旅遊分區 selector, regroups the Place and never writes areaTags, Planning Group or content tags', async () => {
  const b = await bootPlaces();
  const markupForm = editorForm(b.state.places[0]);
  b.sheet.querySelector = selector => selector === '#place-editor-form' ? markupForm : null;
  b.run('openPlaceEditSheet(state.places[0].name)');
  const sheet = b.sheet.innerHTML;
  assert.match(sheet, /<label for="place-editor-travel-area-key">旅遊分區<\/label>/);
  assert.match(sheet, /<option value="ebisu" selected>惠比壽（恵比寿）<\/option>/);
  assert.doesNotMatch(sheet.match(/name="travelAreaKey">([\s\S]*?)<\/select>/)[1], /value="group:|value="shibuya-harajuku-ebisu"/);
  assert.match(sheet, /AI \/ 內容標籤/);
  b.run('closeSheet()');
  const before = json(b.state.places[0]);
  for (const [key, label] of [['daikanyama', '澀谷・原宿・惠比壽'], ['shinjuku', '新宿']]) {
    const form = bindFullEditor(b); edit(form, 'travelAreaKey', key); await submitFull(b, form);
    const saved = json(b.state.places[0]);
    assert.equal(saved.travelAreaKey, key); assert.equal(saved.travelAreaManuallySet, true);
    assert.equal(geo(saved).sectionLabel, label); assert.equal(sectionOf(b.app.innerHTML, 'Rukuma Tokyo'), label);
    assert.deepEqual(saved.areaTags, before.areaTags); assert.deepEqual(saved.highlights, before.highlights);
    assert.equal(Object.hasOwn(saved, 'contentTags'), false);
    assert.ok(!Object.values(saved).includes('shibuya-harajuku-ebisu'));
  }
  assert.equal(b.requests.filter(persistenceOrLookup).length, 0, 'Canonical Area-only Save never geocodes');
});

test('AI / 內容標籤 editor prefills from the legacy adapter; add, remove and modify stay in the draft and nothing is written without Save', async () => {
  const b = await bootPlaces();
  const highlightsBefore = json(b.state.places[0].highlights);
  const form = bindFullEditor(b), session = form.placeEditorSession, tags = contentEditor(form);
  assert.deepEqual(Array.from(session.contentTags), ['內臟燒肉', '晚餐候選', '惠比壽一帶']);
  assert.equal(Object.hasOwn(b.state.places[0], 'contentTags'), false, 'opening the editor never creates contentTags');
  assert.equal((form.querySelector('[data-content-tag-list]').innerHTML.match(/data-content-tag-index=/g) || []).length, 3);
  tags.remove(1);
  assert.deepEqual(Array.from(session.contentTags), ['內臟燒肉', '惠比壽一帶']);
  tags.add(); tags.type(2, '必吃'); tags.type(0, '牛內臟燒肉');
  assert.deepEqual(Array.from(session.contentTags), ['牛內臟燒肉', '惠比壽一帶', '必吃']);
  assert.equal(form.querySelector('button[type="submit"]').formNoValidate, true, 'a content-only edit can save without address validation');
  assert.equal(Object.hasOwn(b.state.places[0], 'contentTags'), false);
  assert.deepEqual(json(b.state.places[0].highlights), highlightsBefore);
  b.run('closeSheet(); render({ filterOnly: true })');
  const card = cardOf(b.app.innerHTML, 'Rukuma Tokyo');
  assert.doesNotMatch(card, /必吃|牛內臟燒肉/, 'an unsaved draft never renders as a saved tag');
  assert.match(card, tagChip('content', '晚餐候選'));
  assert.equal(b.run('sharedSaveTimer'), 0, 'no save was scheduled');
  assert.equal(b.requests.filter(persistenceOrLookup).length, 0);
});

test('content-tag Save writes only contentTags, keeps highlights, areaTags, restaurantTags and geography, and survives PUT/GET reload', async () => {
  const stored = trip(fixtures());
  const b = await boot(stored);
  const before = json(b.state.places[0]);
  const form = bindFullEditor(b), tags = contentEditor(form);
  tags.remove(1); tags.add(); tags.type(2, '原宿一帶'); tags.add(); tags.type(3, 'Google Maps 匯入'); tags.add(); tags.type(4, '惠比壽（恵比寿）');
  await submitFull(b, form);
  const saved = json(b.state.places[0]);
  assert.deepEqual(saved.contentTags, ['內臟燒肉', '惠比壽一帶', '原宿一帶'], 'source metadata and Canonical display values are never stored');
  assert.deepEqual(saved.highlights, before.highlights, 'legacy highlights are neither rewritten nor removed');
  for (const key of new Set([...Object.keys(before), ...Object.keys(saved)])) if (key !== 'contentTags') assert.deepEqual(saved[key], before[key], key);
  assert.deepEqual(saved.areaTags, ['惠比壽西']); assert.deepEqual(saved.restaurantTags, ['燒肉']);
  assert.deepEqual(geo(saved), geo(before), 'geographic-looking content text never changes geography');
  assert.equal(b.requests.filter(persistenceOrLookup).length, 0, 'content-only Save never geocodes or refreshes details');
  const card = cardOf(b.app.innerHTML, 'Rukuma Tokyo');
  assert.match(card, tagChip('content', '原宿一帶')); assert.doesNotMatch(card, /晚餐候選/);
  const loaded = await roundTrip(b, stored);
  assert.deepEqual(loaded.places[0].contentTags, saved.contentTags);
  assert.deepEqual(loaded.places[0].highlights, before.highlights);
  const reload = await boot(loaded);
  assert.deepEqual(json(reload.state.places[0].contentTags), saved.contentTags);
  assert.deepEqual(json(reload.state.places[0].highlights), before.highlights);
  const reloadedCard = cardOf(reload.app.innerHTML, 'Rukuma Tokyo');
  assert.match(reloadedCard, tagChip('content', '原宿一帶')); assert.doesNotMatch(reloadedCard, /晚餐候選|Google Maps 匯入/);
  assert.equal(sectionOf(reload.app.innerHTML, 'Rukuma Tokyo'), '澀谷・原宿・惠比壽');
});

test('Phase C same-parent ambiguity matches its shared 主要地區 without treating a candidate as identity', async () => {
  const ambiguous = PlanningGeography.mergeAreaFields(rukuma(), PlanningGeography.ambiguousAreaFields(['ebisu', 'daikanyama']));
  const b = await bootPlaces([ambiguous, ...fixtures().slice(1)]);
  const values = dropdown(b, 'section').values;
  assert.ok(values.includes(GROUP_A));
  assert.ok(!values.some(value => value === 'ebisu' || value === 'daikanyama' || value.startsWith('candidates:')));
  await choose(b, 'section', GROUP_A);
  assert.ok(visibleNames(b).includes('Rukuma Tokyo'));
  assert.doesNotMatch(cardOf(b.app.innerHTML, 'Rukuma Tokyo'), /data-canonical-area-chip|惠比壽（恵比寿）|>代官山</);
  const saved = b.state.places[0];
  assert.equal(saved.travelAreaKey, ''); assert.equal(saved.travelAreaResolved, false);
  assert.equal(saved.travelAreaResolutionStatus, 'ambiguous'); assert.deepEqual(json(saved.travelAreaCandidateKeys), ['ebisu', 'daikanyama']);
});

test('Phase C cross-parent ambiguity keeps its runtime candidates section and never joins a wrong 主要地區', async () => {
  const cross = PlanningGeography.mergeAreaFields(rukuma({ id: 'synthetic-cross', name: 'Cross Parent' }), PlanningGeography.ambiguousAreaFields(['shinjuku', 'ebisu']));
  const key = geo(cross).sectionKey;
  assert.equal(key, 'candidates:ebisu|shinjuku');
  const b = await bootPlaces([cross, ...fixtures().slice(1)]);
  const section = dropdown(b, 'section');
  assert.equal(section.labels[section.values.indexOf(key)], geo(cross).sectionLabel);
  for (const other of [GROUP_A, 'area:shinjuku']) {
    await choose(b, 'section', other);
    assert.ok(!visibleNames(b).includes('Cross Parent'), other);
  }
  await choose(b, 'section', key);
  assert.deepEqual(visibleNames(b), ['Cross Parent']);
  assert.equal(b.state.places[0].travelAreaKey, ''); assert.deepEqual(json(b.state.places[0].travelAreaCandidateKeys), ['ebisu', 'shinjuku']);
});
