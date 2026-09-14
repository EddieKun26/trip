import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import PlanningGeography from '../lib/planning-geography.js';
import { resolveTravelArea } from '../lib/planning-region.mjs';
import tripHandler from '../api/trip.mjs';
import placesHandler from '../api/places.mjs';
import { boot, trip, place, editorForm, bindFullEditor, edit, submitFull, json } from './helpers/phase-c-browser.mjs';

const { ambiguousAreaFields: ambiguous, normalizePlace: normalize, getPlacePlanningGeography: geo } = PlanningGeography;
const pair = ['ebisu', 'daikanyama'];
const component = (longText, type = 'sublocality_level_2') => ({ longText, types: [type] });
const evidence = [component('恵比寿'), component('代官山')];
function original(extra = {}) {
  return place('ebisu', {
    id: 'synthetic-r01', name: 'Rukuma Tokyo', source: 'synthetic-import',
    sourceUrl: 'https://www.google.com/maps/place/?q=place_id:google-ebisu',
    photos: [{ name: 'places/google-ebisu/photos/original' }], photosLoaded: true,
    addressComponentsOriginal: [component('Ebisunishi')], addressComponents: [component('恵比寿西')],
    manualAddress: 'Synthetic address', originalAddress: 'Original synthetic address', addressProvider: 'original-provider',
    area: 'Raw locality', areaOriginal: 'Ebisunishi', areaTags: ['Ebisunishi'], planningRegion: '惠比壽/代官山',
    sourceListingId: 'original-listing', sourceLodgingName: 'Original listing', sourcePlatform: 'synthetic',
    importMetadata: { original: 'evidence' }, lodgingMetadata: { precision: 'original' }, ...extra,
  });
}
const identity = value => Object.fromEntries(Object.entries(json(value)).filter(([key]) => !key.startsWith('travelArea') && key !== 'autoTravelArea'));
const asAmbiguous = (extra = {}) => PlanningGeography.mergeAreaFields(original(extra), ambiguous(pair));
const withAuto = () => original({ ...PlanningGeography.manualAreaFields('ebisu'), autoTravelArea: ambiguous(pair) });
function assertAmbiguous(value, keys = pair) {
  assert.equal(value.travelAreaKey, ''); assert.equal(value.travelAreaResolved, false);
  assert.equal(value.travelAreaResolutionStatus, 'ambiguous');
  assert.equal(value.travelAreaManuallySet, false); assert.equal(value.travelAreaSource, 'automatic');
  assert.deepEqual(json(value.travelAreaCandidateKeys), keys);
  assert.ok(!value.travelAreaResolutionError);
}
function noPlaceRequests(b) {
  assert.equal(b.requests.filter(r => /\/api\/places|geocode|photos|googleapis/.test(r.url)).length, 0);
}
function forbidEditorResolution(form) {
  let count = 0;
  form.placeEditorSession.resolve = () => { count++; throw new Error('Geography-only transition called address resolver'); };
  return () => assert.equal(count, 0);
}

test('Phase C candidate schema uses independent prefixed array and empty singular key', () => {
  const value = ambiguous(pair);
  assertAmbiguous(value);
  assert.deepEqual(Object.keys(value).sort(), ['travelAreaCandidateKeys', 'travelAreaKey', 'travelAreaLocal', 'travelAreaManuallySet',
    'travelAreaResolutionStatus', 'travelAreaResolutionVersion', 'travelAreaResolved', 'travelAreaResolver', 'travelAreaSource', 'travelAreaZh'].sort());
  assert.equal(PlanningGeography.canonicalArea(value.travelAreaKey), null);
});

const invalidCandidates = [
  ['missing', undefined], ['non-array', 'ebisu,daikanyama'], ['empty', []], ['one key', ['ebisu']],
  ['unknown', ['ebisu', 'unknown']], ['duplicate', ['ebisu', 'daikanyama', 'ebisu']],
  ['composite', ['ebisu', 'ebisu-daikanyama']], ['jp prefix', ['ebisu', 'jp:原宿']],
  ['planning group', ['ebisu', 'shibuya-harajuku-ebisu']], ['raw locality', ['ebisu', 'Ebisunishi']],
  ['illegal type', ['ebisu', null]], ['sparse array', Array(2)],
];
for (const [name, keys] of invalidCandidates) test(`Phase C invalid candidates rejected: ${name}`, () => {
  const invalid = { ...ambiguous(pair), travelAreaCandidateKeys: keys }, before = json(invalid);
  assert.throws(() => normalize(invalid), /INVALID_CANONICAL/);
  assert.deepEqual(json(invalid), before);
});

test('Phase C split-brain and invalid flags are rejected without choosing a primary', () => {
  for (const patch of [{ travelAreaKey: 'ebisu' }, { travelAreaResolved: true }, { travelAreaResolutionStatus: 'resolved' },
    { travelAreaManuallySet: true }, { travelAreaSource: 'manual' }, { travelAreaResolutionVersion: 0 },
    { travelAreaResolutionError: 'failed' }, { travelAreaZh: '惠比壽' }]) {
    assert.throws(() => geo({ ...ambiguous(pair), ...patch }), /INVALID_CANONICAL/);
  }
});

test('Phase C deterministic candidates and resolver output ignore evidence and locale order', () => {
  for (const components of [evidence, [...evidence].reverse(), [...evidence, ...evidence]]) {
    const result = resolveTravelArea({ countryCode: 'JP', originalAddressComponents: components });
    assertAmbiguous(result);
    assert.deepEqual(result, resolveTravelArea({ countryCode: 'JP', localizedAddressComponents: [...components].reverse() }));
  }
  assert.deepEqual(normalize({ ...ambiguous(pair), travelAreaCandidateKeys: [...pair].reverse() }).travelAreaCandidateKeys, pair);
  assert.deepEqual(PlanningGeography.candidateKeys(['ueno', 'ginza', 'shinjuku']), ['ginza', 'shinjuku', 'ueno']);
});

test('Phase C normalized same-parent ambiguity has two areas and no primary', () => {
  const p = asAmbiguous(), before = json(p);
  assert.deepEqual(geo(p), { status: 'ambiguous', source: 'automatic', areaKeys: pair, primaryAreaKey: null,
    planningGroupKey: 'shibuya-harajuku-ebisu', destinationKey: 'tokyo', latitude: p.latitude, longitude: p.longitude,
    areaDisplayLabels: ['惠比壽（恵比寿）', '代官山'], sectionKey: 'group:shibuya-harajuku-ebisu', sectionLabel: '澀谷・原宿・惠比壽' });
  assert.deepEqual(p, before);
});

test('Phase C cross-parent section is deterministic and never persists a fake group', async () => {
  const p = PlanningGeography.mergeAreaFields(original(), ambiguous(['shinjuku', 'ginza']));
  assert.equal(geo(p).planningGroupKey, null); assert.equal(geo(p).sectionKey, 'candidates:ginza|shinjuku');
  assert.equal(geo(p).sectionLabel, '銀座 / 新宿');
  const b = await boot(trip([p]));
  assert.equal((b.app.innerHTML.match(/class="place-group"/g) || []).length, 1);
  assert.equal((b.app.innerHTML.match(/<strong>Rukuma Tokyo<\/strong>/g) || []).length, 1);
  assert.match(b.app.innerHTML, /group-title">⌖ 銀座 \/ 新宿/);
  assert.equal(Object.hasOwn(b.state.places[0], 'planningGroupKey'), false);
});

test('Phase C valid ambiguous is terminal in current upgrade and needs-resolution consumers', async () => {
  const b = await boot(trip([asAmbiguous()]));
  assert.equal(b.run('isTravelAreaResolutionCurrent(state.places[0])'), true);
  assert.equal(b.run('hasUsableTravelArea(state.places[0])'), false);
  assert.equal(b.run('shouldUpgradePlanningRegionResolution(state.places[0])'), false);
  assert.equal(b.run('needsPlanningRegionResolution(state.places[0])'), false);
  noPlaceRequests(b);
});

test('Phase C repeated hydration and cold reload preserve empty key candidates and every identity field', async () => {
  const p = asAmbiguous(), b = await boot(trip([p]));
  const before = json(b.state.places[0]);
  for (let i = 0; i < 5; i++) b.run('ensureTravelAreaFields(state.places[0]); applySharedTrip({ ...reversibleTripSnapshot(), id: state.tripId })');
  assertAmbiguous(b.state.places[0]); assert.deepEqual(json(b.state.places[0]), before);
  const cold = await boot(json(trip(b.state.places)));
  assert.deepEqual(json(cold.state.places[0]), before); noPlaceRequests(b); noPlaceRequests(cold);
});

test('Phase C automatic scheduler never retries terminal ambiguity even with empty key', async () => {
  const b = await boot(trip([asAmbiguous()]));
  const before = json(b.state.places[0]);
  for (let i = 0; i < 5; i++) assert.equal(await b.run('resolveStoredPlacePlanningRegions()'), false);
  assert.deepEqual(json(b.state.places[0]), before);
  assert.equal(b.run('planningRegionResolutionAttempts.size'), 0); noPlaceRequests(b);
});

test('Phase C invalid hydration fails closed before fallback without mutating Place', async () => {
  const b = await boot(trip([]));
  b.context.invalid = { ...asAmbiguous(), travelAreaCandidateKeys: ['ebisu'] };
  const before = json(b.context.invalid);
  assert.throws(() => b.run('ensureTravelAreaFields(invalid)'), /INVALID_CANONICAL/);
  assert.deepEqual(json(b.context.invalid), before); noPlaceRequests(b);
});

test('Phase C same-parent renders one card in its shared 大地區 and that section filter matches without a candidate identity', async () => {
  const b = await boot(trip([asAmbiguous()]));
  for (const key of ['', 'group:shibuya-harajuku-ebisu']) {
    b.context.filterKey = key; b.run('state.placeSectionFilter = filterKey; render()');
    assert.equal(b.state.placeSectionFilter, key);
    assert.equal((b.app.innerHTML.match(/<strong>Rukuma Tokyo<\/strong>/g) || []).length, 1);
    assert.match(b.app.innerHTML, /group-title">⌖ 澀谷・原宿・惠比壽/);
    assert.doesNotMatch(b.app.innerHTML, /data-canonical-area-chip|惠比壽（恵比寿）<\/span>|代官山<\/span>/);
    assert.equal(b.run('matchesMapFilters(state.places[0])'), true);
  }
  for (const key of pair) {
    b.context.filterKey = key; b.run('state.placeSectionFilter = filterKey; render()');
    assert.equal(b.state.placeSectionFilter, '', 'a candidate key is never a 大地區 identity');
  }
  b.context.other = place('ginza'); b.run('state.places.push(other); state.placeSectionFilter = "group:ginza-tsukiji-tokyo-station"; render()');
  assert.equal(b.run('matchesMapFilters(state.places[0])'), false);
  assert.doesNotMatch(b.app.innerHTML, /<strong>Rukuma Tokyo<\/strong>/);
});

test('Phase C geography classification and repeated apply preserve identity and ignore stale failures', async () => {
  const b = await boot(trip([original()]));
  const before = identity(b.state.places[0]);
  b.context.result = { ...ambiguous(pair), placeId: 'wrong', latitude: 1, longitude: 2, formattedAddress: 'wrong',
    addressComponentsOriginal: [], photos: [], source: 'wrong' };
  for (let i = 0; i < 4; i++) b.run('applyPlanningRegionResolution(state.places[0], result); ensureTravelAreaFields(state.places[0])');
  assertAmbiguous(b.state.places[0]); assert.deepEqual(identity(b.state.places[0]), before);
  const complete = json(b.state.places[0]);
  b.run('applyPlanningRegionResolution(state.places[0], {error:"STALE_ERROR"})');
  assert.deepEqual(json(b.state.places[0]), complete); noPlaceRequests(b);
});

test('Phase C R01 manual active preserves auto ambiguity under automatic classification', async () => {
  const b = await boot(trip([original(PlanningGeography.manualAreaFields('ebisu'))]));
  const before = json(b.state.places[0]); b.context.result = ambiguous(pair);
  b.run('applyPlanningRegionResolution(state.places[0], result)');
  assert.deepEqual({ ...json(b.state.places[0]), autoTravelArea: undefined }, { ...before, autoTravelArea: undefined });
  assertAmbiguous(b.state.places[0].autoTravelArea);
  assert.equal(geo(b.state.places[0]).primaryAreaKey, 'ebisu'); noPlaceRequests(b);
});

test('Phase C manual resolve uses singular selection clears active candidates and retains automatic ambiguity', async () => {
  const b = await boot(trip([asAmbiguous()])), before = identity(b.state.places[0]);
  const form = bindFullEditor(b), noResolve = forbidEditorResolution(form);
  edit(form, 'travelAreaKey', 'daikanyama'); await submitFull(b, form);
  const saved = b.state.places[0];
  for (const [key, value] of Object.entries(PlanningGeography.manualAreaFields('daikanyama'))) assert.equal(saved[key], value, key);
  assert.equal(Object.hasOwn(saved, 'travelAreaCandidateKeys'), false);
  assertAmbiguous(saved.autoTravelArea); assert.deepEqual(identity(saved), before);
  assert.equal((b.app.innerHTML.match(/data-canonical-area-chip/g) || []).length, 0);
  noResolve(); noPlaceRequests(b);
});

test('Phase C Restore Automatic is one persisted transition with zero resolver geocode detail and photo calls', async () => {
  const b = await boot(trip([withAuto()])), before = identity(b.state.places[0]);
  const form = bindFullEditor(b), noResolve = forbidEditorResolution(form);
  b.run('var phaseCPersist = persist; var phaseCSaves = []; persist = (...args) => { phaseCSaves.push(JSON.parse(JSON.stringify(state.places[0]))); return phaseCPersist(...args); }');
  form.querySelector('[data-restore-auto-area]').fire('click');
  assert.equal(b.state.places[0].travelAreaManuallySet, true, 'button only previews, Save commits');
  await submitFull(b, form);
  assertAmbiguous(b.state.places[0]); assert.deepEqual(identity(b.state.places[0]), before);
  assert.equal(b.run('phaseCSaves.length'), 1); assertAmbiguous(b.run('phaseCSaves[0]'));
  assert.equal((b.app.innerHTML.match(/data-canonical-area-chip/g) || []).length, 0);
  assert.equal(geo(b.state.places[0]).sectionKey, 'group:shibuya-harajuku-ebisu');
  noResolve(); noPlaceRequests(b);
});

test('Phase C unchanged ambiguous Save preserves all identity without address resolution', async () => {
  const b = await boot(trip([asAmbiguous()])), before = identity(b.state.places[0]);
  const form = bindFullEditor(b), noResolve = forbidEditorResolution(form);
  await submitFull(b, form);
  assertAmbiguous(b.state.places[0]); assert.deepEqual(identity(b.state.places[0]), before);
  noResolve(); noPlaceRequests(b);
});

test('Phase C resolved and ambiguous automatic snapshots keep existing prefixed deterministic shape', () => {
  const resolved = { ...PlanningGeography.manualAreaFields('ginza'), travelAreaSource: 'automatic', travelAreaManuallySet: false, travelAreaResolver: 'JP_TRAVEL_AREA' };
  for (const input of [resolved, ambiguous(pair)]) {
    const snapshot = PlanningGeography.automaticSnapshot(input);
    assert.deepEqual(snapshot, input); assert.deepEqual(PlanningGeography.restoreAutomaticFields(snapshot), { ...input, autoTravelArea: input });
    assert.ok(Object.keys(snapshot).every(key => key.startsWith('travelArea')));
  }
  const p = ambiguous(pair), snapshot = PlanningGeography.automaticSnapshot(p);
  snapshot.travelAreaCandidateKeys.reverse(); assert.deepEqual(p.travelAreaCandidateKeys, pair);
});

test('Phase C invalid automatic snapshots cannot clear manual state or trigger lookup', async () => {
  const b = await boot(trip([original(PlanningGeography.manualAreaFields('ebisu'))]));
  const form = bindFullEditor(b), before = json(b.state.places[0]), noResolve = forbidEditorResolution(form);
  form.querySelector('[data-restore-auto-area]').fire('click');
  assert.equal(form.placeEditorSession.restoreAuto, false);
  assert.deepEqual(json(b.state.places[0]), before);
  for (const value of [undefined, {}, [], { ...ambiguous(pair), travelAreaCandidateKeys: ['ebisu'] },
    { ...ambiguous(pair), travelAreaKey: 'ebisu' }, { ...PlanningGeography.manualAreaFields('ebisu') }]) {
    assert.throws(() => PlanningGeography.restoreAutomaticFields(value), /INVALID_/);
  }
  noResolve(); noPlaceRequests(b);
});

test('Phase C Restore resolved snapshot clears ambiguity and preserves Place identity', async () => {
  const auto = { ...PlanningGeography.manualAreaFields('ginza'), travelAreaSource: 'automatic', travelAreaManuallySet: false };
  const b = await boot(trip([asAmbiguous({ autoTravelArea: auto })])), before = identity(b.state.places[0]);
  const form = bindFullEditor(b), noResolve = forbidEditorResolution(form);
  form.querySelector('[data-restore-auto-area]').fire('click'); await submitFull(b, form);
  assert.equal(b.state.places[0].travelAreaKey, 'ginza'); assert.equal(b.state.places[0].travelAreaManuallySet, false);
  assert.equal(Object.hasOwn(b.state.places[0], 'travelAreaCandidateKeys'), false);
  assert.deepEqual(identity(b.state.places[0]), before); noResolve(); noPlaceRequests(b);
});

function response() {
  return { code: 0, payload: null, status(code) { this.code = code; return this; }, setHeader() {}, json(payload) { this.payload = payload; } };
}
async function localRedis(initial, action) {
  const oldFetch = globalThis.fetch, names = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const oldEnv = names.map(key => process.env[key]), token = 'phase-c-synthetic-session';
  const storage = new Map([['tokyo-family-trip:trip:b', JSON.stringify(initial)],
    [`tokyo-family-trip:session:${createHash('sha256').update(token).digest('hex')}`, JSON.stringify({ id: 'alice', nickname: 'alice' })]]);
  const writes = [];
  process.env.KV_REST_API_URL = 'https://phase-c-redis.invalid'; process.env.KV_REST_API_TOKEN = 'synthetic';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://phase-c-redis.invalid');
    const [op, key, value] = JSON.parse(options.body); assert.ok(['GET', 'SET'].includes(op));
    if (op === 'SET') { writes.push(JSON.parse(value)); storage.set(key, value); }
    return { ok: true, json: async () => ({ result: op === 'GET' ? storage.get(key) || null : 'OK' }) };
  };
  async function request(method, body, authenticated = true) {
    const res = response();
    await tripHandler({ method, body, query: { id: 'b' }, headers: authenticated ? { cookie: `tokyo_trip_session=${token}` } : {} }, res);
    return res;
  }
  try { await action({ request, storage, writes }); }
  finally { globalThis.fetch = oldFetch; names.forEach((key, i) => oldEnv[i] === undefined ? delete process.env[key] : process.env[key] = oldEnv[i]); }
}

test('Phase C real persist PUT GET hydration cold reload retains ambiguity and identity', async () => {
  const input = trip([asAmbiguous(), withAuto()]); input.places[1].id = 'synthetic-manual'; input.places[1].name = 'Manual fixture';
  const b = await boot(input), before = json(b.state.places);
  b.run('persist()'); const pending = b.run('saveSharedTrip()');
  await new Promise(resolve => setImmediate(resolve));
  const put = b.requests.find(r => r.options.method === 'PUT' && r.url === '/api/trip?id=b'); assert.ok(put);
  await localRedis(input, async ({ request, writes }) => {
    const saved = await request('PUT', JSON.parse(put.options.body)); assert.equal(saved.code, 200);
    await b.reply(put, saved.payload); await pending;
    const loaded = await request('GET'); assert.equal(loaded.code, 200); assert.equal(writes.length, 1);
    const cold = await boot(json(loaded.payload));
    assert.deepEqual(json(cold.state.places), before);
    assertAmbiguous(cold.state.places[0]); assertAmbiguous(cold.state.places[1].autoTravelArea);
    assert.equal(cold.run('needsPlanningRegionResolution(state.places[0])'), false); noPlaceRequests(cold);
  });
  noPlaceRequests(b);
});

test('Phase C Trip PUT rejects invalid active or snapshot candidates with zero writes', async () => {
  await localRedis(trip([]), async ({ request, writes }) => {
    for (const [name, keys] of invalidCandidates) {
      for (const nested of [false, true]) {
        const invalid = { ...ambiguous(pair), travelAreaCandidateKeys: keys };
        const p = nested ? original({ ...PlanningGeography.manualAreaFields('ebisu'), autoTravelArea: invalid }) : { ...original(), ...invalid };
        const result = await request('PUT', trip([p]));
        assert.equal(result.code, 400, `${name} nested=${nested}`); assert.match(result.payload.error, /INVALID_CANONICAL/);
      }
    }
    assert.equal(writes.length, 0);
  });
});

test('Phase C public and member GET preserve ambiguity and reject corrupt stored candidates without writes', async () => {
  await localRedis({ ...trip([asAmbiguous()]), publicRead: true }, async ({ request, storage, writes }) => {
    for (const authenticated of [true, false]) {
      const result = await request('GET', undefined, authenticated); assert.equal(result.code, 200); assertAmbiguous(result.payload.places[0]);
    }
    storage.set('tokyo-family-trip:trip:b', JSON.stringify(trip([{ ...asAmbiguous(), travelAreaKey: 'ebisu' }])));
    assert.equal((await request('GET')).code, 400); assert.equal(writes.length, 0);
  });
});

test('Phase C Places stored exact evidence returns ambiguity with zero external lookup', async () => {
  const oldFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('No external lookup allowed'); };
  try {
    for (const fields of [{ addressComponents: evidence }, { addressComponentsOriginal: evidence }]) {
      const p = original(), res = response();
      await placesHandler({ method: 'POST', body: { places: [{ ...p, addressComponents: [], addressComponentsOriginal: [], ...fields, resolveTravelArea: true, countryCode: 'JP' }] } }, res);
      assert.equal(res.code, 200); const result = res.payload.places[0]; assertAmbiguous(result);
      for (const key of ['placeId', 'latitude', 'longitude', 'formattedAddress']) assert.equal(result[key], p[key], key);
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = oldFetch; }
});

for (const [name, components, expected] of [['unique', [component('銀座')], 'resolved'], ['ambiguous', evidence, 'ambiguous']]) {
  test(`Phase C new Candidate ${name} survives draft finalization import and identity protection`, async () => {
    const result = resolveTravelArea({ countryCode: 'JP', originalAddressComponents: components });
    const candidate = PlanningGeography.mergeAreaFields(original(), { ...result, ...(expected === 'ambiguous' ? { autoTravelArea: PlanningGeography.automaticSnapshot(result) } : {}) });
    const b = await boot(trip([])); b.context.candidate = { ...candidate, canImport: true, selected: true, recognition: 'complete' };
    b.run('pendingPlaceImports = [candidate]; candidateDraft(importCandidateIdentity(candidate), candidate)');
    for (const submit of b.listeners.submit) await submit({ target: { id: 'import-places-form', values: { placeKind: 'auto' } }, preventDefault() {} });
    assert.equal(b.state.places.length, 1); assert.equal(geo(b.state.places[0]).status, expected);
    for (const key of ['id', 'placeId', 'latitude', 'longitude', 'formattedAddress', 'addressComponentsOriginal', 'photos', 'source', 'sourceUrl', 'sourceListingId', 'importMetadata']) {
      assert.deepEqual(json(b.state.places[0][key]), json(candidate[key]), key);
    }
    assert.deepEqual(json(b.state.places[0].areaTags), ['Ebisunishi']);
    if (expected === 'ambiguous') assertAmbiguous(b.state.places[0]);
    else assert.equal(b.state.places[0].travelAreaKey, 'ginza');
    noPlaceRequests(b);
  });
}

test('Phase C no reliable candidate and raw Ebisunishi never manufacture ambiguity', () => {
  for (const components of [[], [component('Unknown')], [component('Ebisunishi')], [component('恵比寿西'), component('渋谷区', 'locality')]]) {
    const result = resolveTravelArea({ countryCode: 'JP', originalAddressComponents: components });
    assert.equal(result.travelAreaResolved, false); assert.equal(result.travelAreaKey, '');
    assert.equal(Object.hasOwn(result, 'travelAreaCandidateKeys'), false); assert.notEqual(result.travelAreaResolutionStatus, 'ambiguous');
  }
});

test('Phase C raw areaTags and planningRegion never become candidate storage or fallback keys', async () => {
  const p = asAmbiguous(), b = await boot(trip([p]));
  for (let i = 0; i < 3; i++) b.run('ensureTravelAreaFields(state.places[0]); render()');
  assert.deepEqual(json(b.state.places[0].areaTags), ['Ebisunishi']);
  assert.equal(b.state.places[0].planningRegion, p.planningRegion); assertAmbiguous(b.state.places[0]);
  assert.equal(b.run('travelAreaGroupKey(state.places[0])'), 'group:shibuya-harajuku-ebisu');
});

test('Phase C mixed-section retry button only retries failed Place and leaves ambiguity untouched', async () => {
  const failed = place('harajuku', { travelAreaResolved: false, travelAreaResolutionVersion: 0, travelAreaResolutionStatus: 'failed' });
  const b = await boot(trip([asAmbiguous(), failed])), before = json(b.state.places[0]);
  const button = { dataset: { retryTravelArea: 'group:shibuya-harajuku-ebisu' } };
  const event = { target: { matches: () => false, closest: selector => selector === '[data-retry-travel-area]' ? button : null }, preventDefault() {} };
  const pending = Promise.all(b.listeners.click.map(fn => fn(event)));
  const request = b.requests.find(r => r.url === '/api/places'); assert.ok(request);
  assert.deepEqual(JSON.parse(request.options.body).places.map(p => p.placeId), [failed.placeId]);
  await b.reply(request, { places: [place('harajuku')] }); await pending;
  assert.deepEqual(json(b.state.places[0]), before);
  assert.equal(b.run('needsPlanningRegionResolution(state.places[0])'), false);
});

test('Phase C stale in-flight response cannot replace restored ambiguity or identity', async () => {
  const b = await boot(trip([original({ planningRegion: '', travelAreaResolved: false, travelAreaResolutionVersion: 0 })]));
  const pending = b.run('resolveStoredPlacePlanningRegions()');
  const request = b.requests.find(r => r.url === '/api/places'); assert.ok(request);
  b.context.restored = ambiguous(pair);
  b.run('Object.assign(state.places[0], PlanningGeography.mergeAreaFields(state.places[0], restored))');
  const before = json(b.state.places[0]);
  await b.reply(request, { places: [place('ginza', { latitude: 1, longitude: 2, formattedAddress: 'wrong', placeId: 'wrong' })] });
  await pending;
  assert.deepEqual(json(b.state.places[0]), before); assertAmbiguous(b.state.places[0]);
});

test('Phase C candidate editor manual selection then Restore Automatic survives batch add', async () => {
  const b = await boot(trip([]));
  b.context.candidate = { ...asAmbiguous(), canImport: true, selected: true, recognition: 'complete' };
  b.run('pendingPlaceImports = [candidate]; candidateDraft(importCandidateIdentity(candidate), candidate)');
  const before = identity(b.context.candidate);
  for (const restore of [false, true]) {
    const seed = b.run('candidateDraftEditorSeed(importCandidateIdentity(candidate), candidateDraft(importCandidateIdentity(candidate), candidate))');
    const form = editorForm(seed);
    form.dataset.editorMode = 'candidate-draft'; form.dataset.candidateIdentity = b.run('importCandidateIdentity(candidate)');
    form.dataset.originalPlaceName = ''; b.context.form = form; b.context.seed = seed;
    b.context.FormData = class { constructor(f) { this.f = f; } get(key) { return this.f.elements?.[key]?.value ?? this.f.values?.[key] ?? null; } getAll() { return []; } };
    b.run('bindPlaceEditor(form, null, seed)'); const noResolve = forbidEditorResolution(form);
    if (restore) form.querySelector('[data-restore-auto-area]').fire('click'); else edit(form, 'travelAreaKey', 'daikanyama');
    await submitFull(b, form); noResolve();
    const draft = b.run('candidateDraft(importCandidateIdentity(candidate), candidate)');
    if (restore) assertAmbiguous(draft);
    else { assert.equal(draft.travelAreaKey, 'daikanyama'); assert.equal(draft.travelAreaManuallySet, true); assertAmbiguous(draft.autoTravelArea); }
    assert.equal(b.state.places.length, 0);
  }
  for (const submit of b.listeners.submit) await submit({ target: { id: 'import-places-form', values: { placeKind: 'auto' } }, preventDefault() {} });
  assertAmbiguous(b.state.places[0]);
  for (const key of ['placeId', 'latitude', 'longitude', 'formattedAddress', 'photos', 'sourceUrl', 'addressComponentsOriginal']) {
    assert.deepEqual(json(b.state.places[0][key]), before[key], key);
  }
  noPlaceRequests(b);
});

test('Phase C import enrichment clears stale singular fallback and stale candidates across results', async () => {
  const b = await boot(trip([]));
  for (const result of [ambiguous(pair), place('ginza')]) {
    b.context.entry = { ...asAmbiguous(), canImport: true, recognition: 'partial' };
    const pending = b.run('enrichPlaceImportsFromApi([entry])');
    const request = b.requests.find(r => r.url === '/api/places' && !r.replied); assert.ok(request);
    await b.reply(request, { places: [{ ...original(), ...result, requestUrl: b.context.entry.sourceUrl }] });
    const [enriched] = await pending;
    if (result.travelAreaResolutionStatus === 'ambiguous') { assertAmbiguous(enriched); assertAmbiguous(enriched.autoTravelArea); }
    else { assert.equal(enriched.travelAreaKey, 'ginza'); assert.equal(enriched.travelAreaResolutionStatus, 'resolved'); assert.equal(Object.hasOwn(enriched, 'travelAreaCandidateKeys'), false); }
  }
});

test('Phase C resolver application and editor snapshot reject resolved split-brain input before mutation', async () => {
  const b = await boot(trip([original()])), before = json(b.state.places[0]);
  b.context.invalid = { ...ambiguous(pair), travelAreaResolutionStatus: 'resolved' };
  assert.throws(() => b.run('applyPlanningRegionResolution(state.places[0], invalid)'), /INVALID_CANONICAL/);
  assert.throws(() => b.run('editorAutoTravelArea(invalid)'), /INVALID_CANONICAL/);
  assert.deepEqual(json(b.state.places[0]), before); noPlaceRequests(b);
});
