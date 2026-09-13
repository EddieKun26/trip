import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import PlanningGeography from '../lib/planning-geography.js';
import canonicalCatalog from '../lib/canonical-travel-catalog.js';
import AreaTags from '../lib/area-tags.js';
import audit from '../lib/travel-area-audit.js';
import migration from '../lib/canonical-travel-migration.js';
import manifest from '../lib/canonical-travel-manifest.js';
import tripHandler from '../api/trip.mjs';
import { resolveTravelArea } from '../lib/planning-region.mjs';
import { tagOptionsNode } from './helpers/tag-options-node.mjs';

const { catalog } = canonicalCatalog;
const { getPlacePlanningGeography: geo, formatCanonicalArea: format, groups } = PlanningGeography;
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const json = value => JSON.parse(JSON.stringify(value));
const A = 'shibuya-harajuku-ebisu', B = 'ginza-tsukiji-tokyo-station';
function place(key, extra = {}) {
  return { ...catalog[key], id: `synthetic-${key}`, placeId: `google-${key}`, name: `Place ${key}`,
    kind: 'attraction', category: '景點', mark: 'P', swatch: '#123456',
    travelAreaResolved: true, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
    travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
    formattedAddress: 'Synthetic address', latitude: 35.6428156, longitude: 139.6972423,
    areaTags: ['Raw locality'], restaurantTags: [], ...extra };
}

test('Phase B taxonomy uses only unique current catalog children and rejects missing, duplicate, cross-destination children', () => {
  assert.equal(PlanningGeography.validateTaxonomy(), true);
  assert.equal(groups.length, 6);
  for (const group of groups) for (const key of group.children) assert.ok(Object.hasOwn(catalog, key), key);
  for (const child of ['azabu-juban', 'akihabara', 'roppongi', 'katase-enoshima']) {
    assert.throws(() => PlanningGeography.validateTaxonomy(catalog, [{ ...groups[0], children: [child] }]), /INVALID_PLANNING_CHILD/);
  }
  assert.throws(() => PlanningGeography.validateTaxonomy(catalog, [{ ...groups[0], children: ['shibuya', 'shibuya'] }]), /INVALID_PLANNING_CHILD/);
  assert.throws(() => PlanningGeography.validateTaxonomy(catalog, [groups[0], groups[0]]), /INVALID_PLANNING_GROUP/);
});

const memberships = [
  ...['shibuya', 'harajuku', 'omotesando', 'ebisu', 'daikanyama', 'yoyogi-park'].map(key => [key, A]),
  ...['ginza', 'tsukiji', 'marunouchi-otemachi'].map(key => [key, B]),
  ['azabujuban', 'roppongi-akasaka-azabu'],
  ...['shinjuku', 'nakameguro', 'jiyugaoka', 'toshimaen', 'ichigaya', 'katase-enoshima'].map(key => [key, null]),
];
for (const [key, parent] of memberships) test(`Phase B taxonomy ${key} -> ${parent || 'standalone'}`, () => {
  const result = geo(place(key));
  assert.equal(result.planningGroupKey, parent);
  assert.equal(result.sectionKey, parent ? `group:${parent}` : `area:${key}`);
  assert.equal(result.sectionLabel, parent ? groups.find(g => g.key === parent).label : format(catalog[key]));
});

test('Phase B normalized resolved contract preserves exact coordinates and uses canonical destination', () => {
  const original = Object.freeze(place('shibuya', { destinationKey: 'wrong-legacy', latitude: -0, longitude: 139.70000000000002 }));
  assert.deepEqual(geo(original), {
    status: 'resolved', source: 'automatic', areaKeys: ['shibuya'], primaryAreaKey: 'shibuya',
    planningGroupKey: A, destinationKey: 'tokyo', latitude: -0, longitude: original.longitude,
    areaDisplayLabels: ['澀谷（渋谷）'], sectionKey: `group:${A}`, sectionLabel: '澀谷・原宿・惠比壽',
  });
  assert.equal(geo(place('katase-enoshima', { destinationKey: 'tokyo' })).destinationKey, 'katase-enoshima');
  assert.equal(geo(place('myeongdong')).destinationKey, null);
  for (const value of [undefined, null, '', '35.7', NaN, Infinity]) {
    const result = geo(place('shibuya', { latitude: value, longitude: value }));
    assert.equal(result.latitude, null); assert.equal(result.longitude, null);
  }
});

test('Phase B helper is pure and never guesses an identity from labels, legacy metadata or raw tags', () => {
  for (const key of ['', 'jp:原宿', 'harajuku-omotesando', 'constructor', 'unclassified:address']) {
    const input = place('harajuku', { travelAreaKey: key, planningRegion: '原宿', areaTags: ['原宿'] });
    const before = json(input);
    assert.equal(geo(input), null); assert.deepEqual(input, before);
    assert.throws(() => PlanningGeography.manualAreaFields(key), /INVALID_CANONICAL_KEY/);
  }
});

const labels = {
  shibuya: '澀谷（渋谷）', asakusa: '淺草（浅草）', ginza: '銀座', ueno: '上野', ebisu: '惠比壽（恵比寿）',
  daikanyama: '代官山', 'yoyogi-park': '代代木公園（代々木公園）', nakameguro: '中目黑（中目黒）',
  jiyugaoka: '自由之丘（自由が丘）', toshimaen: '豐島園（豊島園）', ichigaya: '市谷（市ヶ谷）',
  'katase-enoshima': '片瀨・江之島（片瀬・江ノ島）',
};
for (const [key, label] of Object.entries(labels)) test(`Phase B formatter ${key}: ${label}`, () => {
  assert.equal(format(catalog[key]), label);
  assert.deepEqual(geo(place(key)).areaDisplayLabels, [label]);
});
test('Phase B formatter equality uses only Unicode, trim and whitespace normalization', () => {
  assert.equal(format({ travelAreaZh: ' e\u0301  station ', travelAreaLocal: 'é\tstation' }), 'é station');
  assert.equal(format({ travelAreaZh: '自由之丘', travelAreaLocal: '自由が丘' }), '自由之丘（自由が丘）');
  assert.equal(format({ travelAreaZh: 'Tokyo', travelAreaLocal: 'tokyo' }), 'Tokyo（tokyo）');
});

// Reuse the existing DOM/network fixture without registering its tests. Execute the
// complete app (including startApp) with the new shipped library added to its globals.
const startup = readFileSync(new URL('./startup.test.mjs', import.meta.url), 'utf8');
const fixture = startup.slice(startup.indexOf('const member ='), startup.indexOf('\ntest('))
  .replace('vm.createContext({ AreaTags,', 'vm.createContext({ PlanningGeography, AreaTags,');
const browser = new Function('AreaTags', 'audit', 'migration', 'manifest', 'canonicalCatalog', 'PlanningGeography', 'source', 'assert', 'vm',
  `${fixture}; return browser;`)(AreaTags, audit, migration, manifest, canonicalCatalog, PlanningGeography, source, assert, vm);
function trip(places) {
  return { id: 'b', title: 'Phase B synthetic trip', destination: '東京', revision: 1,
    startDate: '2026-09-20', endDate: '2026-09-23', places, flights: [], itinerary: {}, votes: {},
    members: { alice: 'alice' }, ownerId: 'alice', transports: [] };
}
async function boot(payload) {
  const b = browser({ canonical: true, stored: { 'active-trip-v2:alice': '"b"', 'trip-ui-v1:alice:b': '{"mainTab":"places"}' } });
  await b.list(['b']); await b.ready('b', payload);
  assert.equal(b.state.hydrationStatus, 'ready');
  return b;
}

test('Phase B split-brain actual Places sections, card chips and canonical filters ignore legacy and raw locality', async () => {
  const harajuku = place('harajuku', { planningRegion: '澀谷', areaTags: ['神宮前'], travelAreaZh: '錯誤舊名稱' });
  const nakameguro = place('nakameguro', { planningRegion: '目黑', areaTags: ['上目黒'] });
  const b = await boot(trip([harajuku, place('shibuya'), nakameguro]));
  const html = b.app.innerHTML;
  assert.equal((html.match(/class="place-group"/g) || []).length, 2);
  assert.match(html, /group-title">⌖ 澀谷・原宿・惠比壽/);
  assert.match(html, /group-title">⌖ 中目黑（中目黒）/);
  assert.match(html, /data-canonical-area-chip>原宿</);
  assert.match(html, /data-canonical-area-chip>中目黑（中目黒）</);
  assert.doesNotMatch(html, /錯誤舊名稱|data-canonical-area-chip>澀谷・原宿・惠比壽/);
  b.run('state.placeAreaFilter = "shibuya"; render()');
  assert.doesNotMatch(b.app.innerHTML, /<strong>Place harajuku</);
  assert.match(b.app.innerHTML, /<strong>Place shibuya</);
  b.run('state.placeAreaFilter = "harajuku"; render()');
  assert.match(b.app.innerHTML, /<strong>Place harajuku</);
  assert.doesNotMatch(b.app.innerHTML, /<strong>Place shibuya</);
  assert.equal(b.run('matchesMapFilters(state.places[0])'), true);
  assert.equal(b.run('matchesMapFilters(state.places[1])'), false);
  b.run('state.placeAreaFilter = ""; state.areaTagFilter = "上目黒"; render()');
  assert.match(b.app.innerHTML, /<strong>Place nakameguro</);
  assert.doesNotMatch(b.app.innerHTML, /<strong>Place harajuku</);
  assert.deepEqual(json(b.state.places[0].areaTags), ['神宮前']);
  assert.equal(b.state.places[0].planningRegion, '澀谷');
});

test('Phase B all grouped and standalone Places headings use their normalized section namespace', async () => {
  const b = await boot(trip(memberships.map(([key]) => place(key))));
  const expected = new Set(memberships.map(([key]) => geo(place(key)).sectionKey));
  assert.equal((b.app.innerHTML.match(/class="place-group"/g) || []).length, expected.size);
  for (const [key] of memberships) {
    b.context.probe = place(key);
    assert.equal(b.run('planningSectionKey(probe)'), geo(place(key)).sectionKey);
  }
  assert.doesNotMatch(b.app.innerHTML, /新宿・大久保/);
});

test('Phase B R01 manual ebisu and R04 manual harajuku normalize to Group A without creating automatic evidence', () => {
  for (const key of ['ebisu', 'harajuku']) for (const flags of [
    { travelAreaManuallySet: true, travelAreaSource: 'automatic' },
    { travelAreaManuallySet: false, travelAreaSource: 'manual' },
  ]) {
    const input = place(key, flags), before = json(input);
    const result = geo(input);
    assert.equal(result.source, 'manual'); assert.equal(result.primaryAreaKey, key);
    assert.equal(result.planningGroupKey, A); assert.deepEqual(input, before);
    assert.equal(Object.hasOwn(input, 'autoTravelArea'), false);
  }
});

function editorForm(existing) {
  const node = (value = '') => ({ value, dataset: {}, disabled: false, hidden: false, listeners: {}, ...tagOptionsNode(),
    setAttribute() {}, removeAttribute() {}, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    fire(type, event) { for (const fn of this.listeners[type] || []) fn(event); } });
  const form = node();
  Object.assign(form, { id: 'place-editor-form', isConnected: true, dataset: { originalPlaceName: existing.name, originalAddress: existing.formattedAddress } });
  form.elements = Object.fromEntries(['name', 'address', 'sourceUrl', 'referenceUrl', 'sourcePlatform', 'sourceLodgingName', 'sourceListingId',
    'photoOrigin', 'travelAreaKey', 'kind', 'category'].map(key => [key, node(key === 'address' ? existing.formattedAddress : existing[key] || '')]));
  const nodes = new Map();
  form.querySelector = selector => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  form.querySelectorAll = () => Object.values(form.elements);
  return form;
}

test('Phase B editor current value is catalog key and options never contain guessed or group keys', async () => {
  const b = await boot(trip([place('harajuku', { planningRegion: '澀谷', areaTags: ['神宮前'] })]));
  const form = editorForm(b.state.places[0]);
  b.sheet.querySelector = selector => selector === '#place-editor-form' ? form : null;
  b.context.form = form;
  b.run('openPlaceEditSheet(state.places[0].name)');
  assert.match(b.sheet.innerHTML, /name="travelAreaKey"/);
  assert.match(b.sheet.innerHTML, /value="harajuku" selected>原宿</);
  assert.doesNotMatch(b.sheet.innerHTML, /name="travelAreaZh"|name="travelAreaLocal"|value="jp:原宿"/);
  const options = b.sheet.innerHTML.match(/name="travelAreaKey">([\s\S]*?)<\/select>/)[1];
  for (const [, key] of options.matchAll(/value="([^"]+)"/g)) assert.ok(Object.hasOwn(catalog, key), key);
});

test('Phase B editor Save -> regroup -> actual Trip PUT/GET -> hydration -> cold reload preserves manual identity and exact coordinates', async () => {
  const original = place('shinjuku', { planningRegion: '澀谷', areaTags: ['神宮前'], autoTravelArea: { ...PlanningGeography.manualAreaFields('ebisu'), travelAreaSource: 'automatic', travelAreaManuallySet: false, travelAreaResolver: 'JP_TRAVEL_AREA' } });
  const b = await boot(trip([original, place('shibuya')]));
  const form = editorForm(b.state.places[0]); b.context.form = form;
  b.run('bindPlaceEditor(form, state.places[0], {})');
  form.elements.travelAreaKey.value = 'harajuku';
  form.elements.travelAreaKey.name = 'travelAreaKey';
  form.fire('input', { target: form.elements.travelAreaKey });
  for (const submit of b.listeners.submit) await submit({ target: form, preventDefault() {} });
  const saved = b.state.places[0];
  for (const [key, value] of Object.entries(PlanningGeography.manualAreaFields('harajuku'))) assert.equal(saved[key], value, key);
  assert.equal(saved.latitude, original.latitude); assert.equal(saved.longitude, original.longitude);
  assert.deepEqual(json(saved.autoTravelArea), original.autoTravelArea);
  assert.deepEqual(json(saved.areaTags), original.areaTags);
  assert.equal(saved.planningRegion, original.planningRegion);
  assert.equal((b.app.innerHTML.match(/class="place-group"/g) || []).length, 1);
  assert.match(b.app.innerHTML, /data-canonical-area-chip>原宿</);
  assert.ok(!b.requests.some(request => request.url === '/api/places' && JSON.parse(request.options.body).places?.some(p => p.manualAddress)), 'canonical-only Save must not geocode');
  const requestDone = b.run('saveSharedTrip()');
  await new Promise(resolve => setImmediate(resolve));
  const put = b.requests.find(request => request.options.method === 'PUT' && request.url === '/api/trip?id=b');
  assert.ok(put, 'real persist path must produce Trip PUT');
  const oldFetch = globalThis.fetch, names = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const oldEnv = names.map(key => process.env[key]);
  process.env.KV_REST_API_URL = 'https://phase-b-redis.invalid'; process.env.KV_REST_API_TOKEN = 'synthetic';
  const token = 'phase-b-local-session', hash = createHash('sha256').update(token).digest('hex');
  const storage = new Map([
    ['tokyo-family-trip:trip:b', JSON.stringify(trip([original, place('shibuya')]))],
    [`tokyo-family-trip:session:${hash}`, JSON.stringify({ id: 'alice', nickname: 'alice' })],
  ]);
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://phase-b-redis.invalid');
    const [op, key, value] = JSON.parse(options.body); assert.ok(['GET', 'SET'].includes(op));
    if (op === 'SET') { writes++; storage.set(key, value); }
    return { ok: true, json: async () => ({ result: op === 'GET' ? storage.get(key) || null : 'OK' }) };
  };
  async function request(method, body) {
    let payload;
    const res = { code: 0, status(n) { this.code = n; return this; }, setHeader() {}, json(value) { payload = value; } };
    await tripHandler({ method, body, query: { id: 'b' }, headers: { cookie: `tokyo_trip_session=${token}` } }, res);
    assert.equal(res.code, 200); return payload;
  }
  try {
    const stored = await request('PUT', JSON.parse(put.options.body));
    await b.reply(put, stored); await requestDone;
    const loaded = await request('GET'); assert.equal(writes, 1);
    const reload = await boot(loaded);
    const final = reload.state.places[0];
    assert.equal(geo(final).primaryAreaKey, 'harajuku'); assert.equal(geo(final).source, 'manual');
    assert.equal(geo(final).sectionKey, `group:${A}`);
    reload.context.target = final;
    reload.run('applyPlanningRegionResolution(target, { travelAreaResolved: true, travelAreaKey: "shibuya", travelAreaZh: "澀谷", travelAreaLocal: "渋谷", travelAreaResolutionVersion: 5 })');
    assert.equal(final.travelAreaKey, 'harajuku');
    assert.equal(final.latitude, original.latitude); assert.equal(final.longitude, original.longitude);
    assert.deepEqual(json(final.autoTravelArea), original.autoTravelArea);
    assert.match(reload.app.innerHTML, /data-canonical-area-chip>原宿</);
  } finally {
    globalThis.fetch = oldFetch;
    names.forEach((key, index) => oldEnv[index] === undefined ? delete process.env[key] : process.env[key] = oldEnv[index]);
  }
});

test('Phase B canonical-only Save rejects label keys and preserves an absent R01 automatic snapshot', async () => {
  const b = await boot(trip([place('ebisu', PlanningGeography.manualAreaFields('ebisu'))]));
  const form = editorForm(b.state.places[0]); b.context.form = form;
  b.run('bindPlaceEditor(form, state.places[0], {})');
  form.placeEditorSession.dirty.add('travelAreaKey');
  form.elements.travelAreaKey.value = 'jp:原宿';
  b.run('saveCanonicalAreaOnly(form)'); assert.equal(b.state.places[0].travelAreaKey, 'ebisu');
  form.elements.travelAreaKey.value = 'harajuku';
  b.run('saveCanonicalAreaOnly(form)');
  assert.equal(b.state.places[0].travelAreaKey, 'harajuku');
  assert.equal(Object.hasOwn(b.state.places[0], 'autoTravelArea'), false);
});

test('Phase B unique resolved candidate survives real candidate draft finalization, import, chip and section', async () => {
  const resolved = resolveTravelArea({ countryCode: 'JP', originalAddressComponents: [{ longText: '銀座', types: ['sublocality_level_2'] }] });
  assert.equal(resolved.travelAreaKey, 'ginza'); assert.equal(resolved.travelAreaResolved, true);
  const b = await boot(trip([]));
  b.context.candidate = place('ginza', { ...resolved, canImport: true, selected: true, kind: 'restaurant', category: '拉麵店', restaurantTags: ['拉麵'], areaTags: ['Raw evidence'] });
  b.run('pendingPlaceImports = [candidate]; candidateDraft(importCandidateIdentity(candidate), candidate).name = "Edited candidate"');
  for (const listener of b.listeners.submit) await listener({ target: { id: 'import-places-form', values: { placeKind: 'auto' } }, preventDefault() {} });
  assert.equal(b.state.places.length, 1);
  const imported = b.state.places[0];
  assert.equal(imported.name, 'Edited candidate'); assert.equal(geo(imported).primaryAreaKey, 'ginza');
  assert.equal(geo(imported).planningGroupKey, B);
  assert.deepEqual(json(imported.areaTags), ['Raw evidence']); assert.deepEqual(json(imported.restaurantTags), ['拉麵']);
  assert.match(b.app.innerHTML, /data-canonical-area-chip>銀座</);
  assert.match(b.app.innerHTML, /group-title">⌖ 銀座・築地・東京車站/);
});

test('Phase B unsafe candidate resolution stays unresolved with no new persisted ambiguity schema', () => {
  const result = resolveTravelArea({ countryCode: 'JP', originalAddressComponents: [
    { longText: '恵比寿西', types: ['sublocality_level_2'] }, { longText: '渋谷区', types: ['locality'] },
  ] });
  assert.equal(result.travelAreaResolved, false); assert.equal(result.travelAreaKey, '');
  assert.equal(result.travelAreaResolutionError, 'AMBIGUOUS_EBISU_DAIKANYAMA');
  assert.equal(geo(result), null);
  assert.equal(Object.hasOwn(result, 'travelAreaCandidateKeys'), false);
});

function bindFullEditor(b) {
  const existing = b.state.places[0], form = editorForm(existing);
  // Match the actual select: noncatalog records have the empty preserve-only option.
  form.elements.travelAreaKey.value = geo(existing)?.primaryAreaKey || '';
  b.context.FormData = class {
    constructor(target) { this.target = target; }
    get(key) { return this.target.elements?.[key]?.value ?? this.target.values?.[key] ?? null; }
    getAll() { return []; }
  };
  b.context.form = form;
  b.run('bindPlaceEditor(form, state.places[0], {})');
  return form;
}
function edit(form, key, value) {
  Object.assign(form.elements[key], { name: key, value });
  form.fire('input', { target: form.elements[key] });
}
async function submitFull(b, form, resolved) {
  const pending = Promise.all(b.listeners.submit.map(submit => submit({ target: form, preventDefault() {} })));
  const request = b.requests.find(r => r.url === '/api/places' && !r.replied);
  if (request) await b.reply(request, { places: [resolved || place('shinjuku')] });
  await pending;
}
const canonicalFields = value => Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith('travelArea')));

test('Phase B legacy manual values survive actual note and ordinary name Save without canonical selection', async () => {
  for (const key of ['jp:原宿', 'my-area', 'harajuku-omotesando']) {
    const original = place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: key,
      travelAreaZh: '既有手動值', travelAreaLocal: 'Existing manual' });
    const b = await boot(trip([original]));
    for (const submit of b.listeners.submit) await submit({ target: { id: 'place-note-form', dataset: { placeName: original.name }, values: { note: 'Updated note' } }, preventDefault() {} });
    assert.equal(b.state.places[0].note, 'Updated note');
    assert.deepEqual(canonicalFields(json(b.state.places[0])), canonicalFields(original));
    const form = bindFullEditor(b);
    edit(form, 'name', 'Updated name');
    await submitFull(b, form);
    assert.equal(b.state.places[0].name, 'Updated name');
    assert.deepEqual(canonicalFields(json(b.state.places[0])), canonicalFields(original));
  }
});

test('Phase B legacy manual display is preserve-only and never an editor option or free-text area input', async () => {
  const b = await boot(trip([place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: 'jp:原宿' })]));
  const form = bindFullEditor(b);
  b.sheet.querySelector = selector => selector === '#place-editor-form' ? form : null;
  b.run('openPlaceEditSheet(state.places[0].name)');
  const options = b.sheet.innerHTML.match(/name="travelAreaKey">([\s\S]*?)<\/select>/)[1];
  assert.doesNotMatch(options, /jp:原宿|my-area|harajuku-omotesando/);
  for (const [, key] of options.matchAll(/value="([^"]+)"/g)) assert.ok(Object.hasOwn(catalog, key), key);
  assert.doesNotMatch(b.sheet.innerHTML, /<(?:input|textarea)[^>]+name="travelArea/);
});

test('Phase B legacy manual changed with name through general Save persists only selected catalog metadata', async () => {
  const b = await boot(trip([place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: 'jp:原宿' })]));
  const form = bindFullEditor(b);
  edit(form, 'name', 'Catalog corrected'); edit(form, 'travelAreaKey', 'ebisu');
  await submitFull(b, form);
  assert.equal(b.state.places[0].name, 'Catalog corrected');
  for (const [key, value] of Object.entries(PlanningGeography.manualAreaFields('ebisu'))) assert.equal(b.state.places[0][key], value, key);
  assert.match(b.app.innerHTML, /data-canonical-area-chip>惠比壽（恵比寿）</);
});

test('Phase B general Save rejects explicit empty, guessed, arbitrary and unknown area selection before geocoding', async () => {
  for (const key of ['', 'jp:原宿', 'my-area', 'unknown', 'group:shibuya-harajuku-ebisu']) {
    const b = await boot(trip([place('harajuku')]));
    const before = json(b.state.places[0]), form = bindFullEditor(b);
    edit(form, 'name', 'Must not save'); edit(form, 'travelAreaKey', key);
    await submitFull(b, form);
    assert.deepEqual(json(b.state.places[0]), before, key || 'explicit empty selection');
    assert.ok(!b.requests.some(r => r.url === '/api/places'), 'invalid selection must not geocode');
  }
});

test('Phase B area-only actual Save preserves every noncanonical field including identity, media and auto snapshot', async () => {
  const b = await boot(trip([place('shinjuku', {
    sourceUrl: 'https://www.google.com/maps/place/?q=place_id:synthetic', referenceUrl: 'https://example.invalid/reference',
    photos: [{ name: 'places/google-shinjuku/photos/original' }], photoOrigin: 'user_upload', customPhotoDataUrl: 'data:image/jpeg;base64,c3ludGhldGlj',
    sourcePlatform: 'synthetic', sourceListingId: 'original-listing', addressComponentsOriginal: [{ longText: 'Synthetic address' }],
    autoTravelArea: { ...PlanningGeography.manualAreaFields('shinjuku'), travelAreaSource: 'automatic', travelAreaManuallySet: false },
  })]));
  const before = json(b.state.places[0]), form = bindFullEditor(b);
  edit(form, 'travelAreaKey', 'harajuku');
  await submitFull(b, form);
  const after = json(b.state.places[0]), allowed = new Set(Object.keys(PlanningGeography.manualAreaFields('harajuku')));
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!allowed.has(key)) assert.deepEqual(after[key], before[key], key);
  }
  assert.equal(after.travelAreaKey, 'harajuku');
  assert.ok(!b.requests.some(r => r.url === '/api/places'));
});

test('Phase B four approved Shinjuku results ignore Nishi-Shinjuku, Okubo and Yoyogi raw evidence', async () => {
  const b = await boot(trip(['牛たんの檸檬', '自由之家', 'HERE ! tokyo', 'Udon Shin'].map((name, index) =>
    place('shinjuku', { id: `synthetic-shinjuku-${index}`, name, planningRegion: ['西新宿', '大久保', '大久保', '代々木'][index], areaTags: ['代々木'] }))));
  assert.equal((b.app.innerHTML.match(/class="place-group"/g) || []).length, 1);
  assert.match(b.app.innerHTML, /group-title">⌖ 新宿</);
  assert.doesNotMatch(b.app.innerHTML, /group-title">⌖ (?:西新宿|大久保|代々木|新宿・大久保)/);
  assert.equal((b.app.innerHTML.match(/data-canonical-area-chip>新宿</g) || []).length, 4);
});

test('Phase B every declared group child normalizes to its actual parent without synthesizing catalog identities', () => {
  const expected = [
    ['shibuya', 'harajuku', 'omotesando', 'ebisu', 'daikanyama', 'yoyogi-park'],
    ['ginza', 'tsukiji', 'marunouchi-otemachi'], ['ueno', 'asakusa'],
    ['azabujuban', 'tokyo-tower', 'shiba-park'], ['ikebukuro', 'otsuka'], ['toyosu'],
  ];
  assert.deepEqual(groups.map(group => [...group.children]), expected);
  for (const group of groups) for (const key of group.children) {
    const result = geo(place(key));
    assert.equal(result.planningGroupKey, group.key); assert.equal(result.sectionLabel, group.label);
    assert.equal(result.sectionKey, `group:${group.key}`); assert.deepEqual(result.areaKeys, [key]);
  }
});
