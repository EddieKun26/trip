import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import tripHandler from '../api/trip.mjs';
import { openingHoursKey, overlayOpeningHours, readOpeningHoursSidecars, writeOpeningHoursSidecar } from '../lib/opening-hours-sidecar.mjs';
import { resolveStructuredOpeningPeriods, structuredHoursPlaceId } from '../lib/opening-hours.mjs';
import { boot, trip, place, json } from './helpers/phase-c-browser.mjs';

const periods = [{ open: { day: 0, hour: 10, minute: 0 }, close: { day: 0, hour: 18, minute: 0 } }];
const record = (id, status = 'known') => ({ v: 1, status, placeId: id, periods: status === 'known' ? periods : [], fetchedAt: '2026-09-20T00:00:00.000Z' });
const response = () => ({ statusCode: 200, payload: null, status(code) { this.statusCode = code; return this; }, setHeader() { return this; }, json(body) { this.payload = body; return this; } });

function server(placeValue, tripId = 'hours-sidecar') {
  const exactId = placeValue.placeId || (() => { try { const url = new URL(placeValue.sourceUrl); return url.searchParams.get('query_place_id') || url.searchParams.get('place_id') || ''; } catch { return ''; } })();
  const storedTrip = { ...trip([placeValue]), id: tripId, members: { alice: 'alice' } };
  const key = `tokyo-family-trip:trip:${tripId}`;
  const sessionKey = `tokyo-family-trip:session:${createHash('sha256').update('alice-token').digest('hex')}`;
  const store = new Map([[key, JSON.stringify(storedTrip)], [sessionKey, JSON.stringify({ id: 'alice', nickname: 'alice' })]]);
  const commands = [], google = [];
  process.env.KV_REST_API_URL = 'https://redis.test';
  process.env.KV_REST_API_TOKEN = 'test-token';
  process.env.GOOGLE_MAPS_API_KEY = 'test-key';
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('redis.test')) {
      const [verb, ...args] = JSON.parse(options.body); commands.push([verb, ...args]);
      let result = null;
      if (verb === 'GET') result = store.get(args[0]) ?? null;
      if (verb === 'MGET') result = args.map(key => store.get(key) ?? null);
      if (verb === 'SET') { store.set(args[0], args[1]); result = 'OK'; }
      return new Response(JSON.stringify({ result }), { status: 200 });
    }
    google.push({ url: String(url), mask: options.headers?.['X-Goog-FieldMask'] });
    return new Response(JSON.stringify({ id: exactId, regularOpeningHours: { periods } }), { status: 200 });
  };
  const run = async (action, extra = {}) => {
    const res = response();
    await tripHandler({ method: 'POST', url: `/api/trip?id=${tripId}`, query: { id: tripId }, headers: { cookie: 'tokyo_trip_session=alice-token' }, body: { action, ...extra } }, res);
    return res;
  };
  return { run, store, commands, google, key, storedTrip, exactId };
}

// Production trace (2026-09-22): direct ID matches canonical, addressExcluded=true,
// selected 9/24 exact 09:00, sidecar miss, no hydration/windows/warning. The trace
// proves the aggregate exclusion, not which individual address flag set it.
// Exercise each supported cause rather than pretending a private flag was observed.
for (const exclusion of [{ addressProvider: '自行確認地址' }, { manualLocation: true, detailsLocked: true },
  { coordinateLocation: true }, { category: 'premise' }]) {
  test(`production entry regression: hours-only resolution survives Detail exclusion ${Object.keys(exclusion).join('/')}`, async t => {
    const previousFetch = globalThis.fetch, previousEnv = { ...process.env };
    t.after(() => { globalThis.fetch = previousFetch; process.env = previousEnv; });
    const p = place('ueno', { ...exclusion, sourceUrl: 'https://www.google.com/maps/search/?api=1&query_place_id=google-ueno',
      openingHours: 'display-only', note: 'preserve', photosLoaded: true });
    const s = server(p, 'b');
    s.storedTrip.endDate = '2026-09-26';
    s.store.set(s.key, JSON.stringify(s.storedTrip));
    const beforeServer = s.store.get(s.key);
    const b = await boot(JSON.parse(beforeServer));
    b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
    const beforeClient = JSON.stringify(b.run('sharedTripPayload()'));
    const beforeUndo = b.run('JSON.stringify([undoSnapshot, undoExpectedRevision, undoBaseline])');
    assert.equal(b.run('isAddressDetailPlace(state.places[0])'), true);
    await b.run('ensurePlaceDetails(state.places[0])');
    assert.equal(b.requests.filter(r => r.url === '/api/places').length, 0, 'full Detail protection remains');
    b.run('togglePlacePoolSelection("app:synthetic-ueno")');
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/24", mode: "exact", exactTime: "09:00" }])');
    const requests = action => b.requests.filter(r => JSON.parse(r.options.body || '{}').action === action);
    assert.equal(requests('hydrateOpeningHours').length, 1, 'production exclusion must not suppress hours-only hydration');
    // Use the actual serialized API response, real exact parser, sidecar write/read,
    // and real calendar normalizer. Only Redis transport and Google transport are mocked.
    const redisFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => String(url).includes('redis.test') ? redisFetch(url, options)
      : (s.google.push({ mask: options.headers['X-Goog-FieldMask'] }), new Response(JSON.stringify({ id: p.placeId,
        regularOpeningHours: { periods: [{ open: { day: 4, hour: 17, minute: 30 }, close: { day: 5, hour: 0, minute: 0 } }] } })));
    const result = await s.run('hydrateOpeningHours', JSON.parse(requests('hydrateOpeningHours')[0].options.body));
    assert.equal(result.payload.status, 'known');
    assert.equal(result.payload.regularOpeningPeriods.placeId, p.placeId);
    assert.deepEqual(result.payload.openingWindows['9/24'], [{ startMinute: 1050, endMinute: 1440 }]);
    assert.equal(s.google[0].mask, 'id,regularOpeningHours');
    await b.reply(requests('hydrateOpeningHours')[0], JSON.parse(JSON.stringify(result.payload)));
    assert.equal(b.run('placePoolHoursConflicts.size'), 1);
    for (const markup of [b.app.innerHTML, b.run('placePoolSelectedColumnMarkup(placePoolViewModel())')]) {
      assert.match(markup, /營業時間不符合/); assert.match(markup, /09:00/);
    }
    assert.match(b.app.innerHTML, /有 1 個地點/); assert.match(b.app.innerHTML, /data-pool-cta disabled/);
    await b.run('requestPlacePoolPlan()'); assert.equal(requests('plan').length, 0);
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/24", mode: "exact", exactTime: "17:30" }])');
    assert.equal(b.run('placePoolHoursConflicts.size'), 0);
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/25", mode: "exact", exactTime: "17:30" }])');
    assert.equal(b.run('placePoolHoursConflicts.size'), 1, 'correct closed weekday');
    assert.equal(requests('hydrateOpeningHours').length, 1, 'date/time edits reuse normalized windows');
    await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
    assert.equal(s.google.length, 1, 'sidecar round-trip avoids Google');
    process.env.AI_PLANNER_MODEL = 'gpt-5.6-luna'; process.env.OPENAI_API_KEY = 'test-key';
    const outside = await s.run('plan', { expectedRevision: 1, selected: [{ ref: 'app:synthetic-ueno',
      dateOptions: [{ dayKey: '9/24', mode: 'exact', exactTime: '09:00' }] }] });
    assert.equal(outside.payload.reason, 'OPENING_HOURS_CONFLICT');
    assert.equal(s.google.length, 1, 'server preflight calls neither Google nor model');
    assert.equal(s.store.get(s.key), beforeServer, 'Trip including revision/itinerary unchanged');
    assert.equal(JSON.stringify(b.run('sharedTripPayload()')), beforeClient, 'hours do not leak into Trip serialization');
    assert.equal(b.run('JSON.stringify([undoSnapshot, undoExpectedRevision, undoBaseline])'), beforeUndo);
  });
}

test('sidecar uses a versioned hashed key and stores only the structured record', async () => {
  const id = 'ChIJ/unsafe?';
  assert.match(openingHoursKey(id), /^tokyo-family-trip:opening-hours:v1:[a-f0-9]{64}$/);
  const commands = [];
  await writeOpeningHoursSidecar(record(id), async cmd => { commands.push(cmd); return 'OK'; });
  assert.deepEqual(JSON.parse(commands[0][2]), record(id));
  assert.equal(commands[0][1].includes(id), false);
});

test('production write helper and batch resolver round-trip the same hashed identity', async () => {
  const id = 'ChIJ/round-trip?';
  const store = new Map();
  const commands = [];
  const redis = async ([verb, ...args]) => {
    commands.push([verb, ...args]);
    if (verb === 'SET') { store.set(args[0], args[1]); return 'OK'; }
    if (verb === 'MGET') return args.map(key => store.get(key) ?? null);
    throw new Error('unexpected command');
  };
  await writeOpeningHoursSidecar(record(id), redis);
  const found = await readOpeningHoursSidecars([{ placeId: id }], redis);
  assert.equal(commands[0][1], commands[1][1]);
  assert.deepEqual(resolveStructuredOpeningPeriods({ placeId: id }, found.get(id)), record(id));
  assert.equal(resolveStructuredOpeningPeriods({ placeId: 'different' }, found.get(id)), null);
});

test('legacy explicit Maps URL identity uses the same hydration, sidecar and Planner overlay path', async () => {
  const id = 'ChIJLegacyVirtu';
  const p = place('ueno', { placeId: '', sourceUrl: `https://www.google.com/maps/search/?api=1&query=Virtu&query_place_id=${id}` });
  assert.equal(structuredHoursPlaceId(p), id);
  const s = server(p), before = s.store.get(s.key);
  const hydrated = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(hydrated.statusCode, 200, JSON.stringify(hydrated.payload));
  assert.equal(hydrated.payload.status, 'known');
  assert.equal(hydrated.payload.regularOpeningPeriods.placeId, id);
  assert.deepEqual(hydrated.payload.openingWindows['9/20'], [{ startMinute: 600, endMinute: 1080 }]);
  assert.equal(s.google.length, 1);
  assert.equal(s.google[0].mask, 'id,regularOpeningHours');
  assert.equal(JSON.parse(s.store.get(openingHoursKey(id))).placeId, id);
  assert.equal(s.store.get(s.key), before);
  const sidecars = await readOpeningHoursSidecars([p], async ([verb, ...keys]) => {
    assert.equal(verb, 'MGET');
    return keys.map(key => s.store.get(key) ?? null);
  });
  assert.deepEqual(resolveStructuredOpeningPeriods(p, sidecars.get(id)), hydrated.payload.regularOpeningPeriods);
  assert.equal(overlayOpeningHours({ places: [p] }, sidecars).places[0].regularOpeningPeriods.status, 'known');
});

test('effective resolution prefers valid sidecar, falls back to valid embedded, rejects malformed and foreign IDs', () => {
  const p = { placeId: 'A', openingHours: '星期日: 10:00–18:00', regularOpeningPeriods: record('A') };
  assert.equal(resolveStructuredOpeningPeriods(p, record('A', 'unavailable')).status, 'unavailable');
  assert.deepEqual(resolveStructuredOpeningPeriods(p, { ...record('B') }), record('A'));
  assert.deepEqual(resolveStructuredOpeningPeriods(p, { ...record('A'), periods: [{ open: {} }] }), record('A'));
  assert.equal(resolveStructuredOpeningPeriods({ placeId: 'B', regularOpeningPeriods: record('A') }), null);
  assert.equal(resolveStructuredOpeningPeriods({ placeId: 'A', openingHours: '10:00–18:00' }), null);
  const overlaid = overlayOpeningHours({ places: [p] }, new Map([['A', record('A', 'unavailable')]]));
  assert.equal(overlaid.places[0].regularOpeningPeriods.status, 'unavailable');
  assert.equal(p.regularOpeningPeriods.status, 'known');
});

test('batch sidecar read fails safe to legacy embedded data', async () => {
  const p = { placeId: 'A', regularOpeningPeriods: record('A') };
  const sidecars = await readOpeningHoursSidecars([p], async () => { throw new Error('network'); });
  assert.deepEqual(overlayOpeningHours({ places: [p] }, sidecars).places[0].regularOpeningPeriods, record('A'));
});

test('authorized exact hydration writes sidecar only, preserves Trip bytes and revision; known/unavailable avoid Google refetch', async () => {
  const p = place('ueno');
  const s = server(p);
  const before = s.store.get(s.key);
  const first = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(first.statusCode, 200, JSON.stringify(first.payload));
  assert.equal(first.payload.status, 'known');
  assert.equal(first.payload.regularOpeningPeriods.placeId, p.placeId);
  assert.deepEqual(first.payload.openingWindows['9/20'], [{ startMinute: 600, endMinute: 1080 }]);
  assert.deepEqual(first.payload.windowCalendar, { startDate: '2026-09-20', endDate: '2026-09-23' });
  assert.equal(s.google.length, 1);
  assert.equal(s.google[0].mask, 'id,regularOpeningHours');
  assert.deepEqual(JSON.parse(s.store.get(openingHoursKey(p.placeId))).periods, periods);
  assert.equal(s.store.get(s.key), before);
  assert.equal(s.commands.filter(cmd => cmd[0] === 'SET' && cmd[1] === s.key).length, 0);
  await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(s.google.length, 1);
  s.store.set(openingHoursKey(p.placeId), JSON.stringify(record(p.placeId, 'unavailable')));
  const unavailable = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(unavailable.payload.status, 'unavailable');
  assert.equal(s.google.length, 1);
});

test('embedded known/unavailable avoid exact Google; custom/no-placeId remains unknown', async () => {
  for (const status of ['known', 'unavailable']) {
    const p = place('ueno', { regularOpeningPeriods: record('google-ueno', status) });
    const s = server(p);
    const result = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
    assert.equal(result.payload.status, status);
    assert.equal(s.google.length, 0);
  }
  const p = place('ueno', { placeId: '' });
  const s = server(p);
  assert.equal((await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' })).payload.status, 'unknown');
  assert.equal(s.google.length, 0);
});

test('malformed or mismatched metadata hydrates current identity; valid embedded survives malformed sidecar', async () => {
  const p = place('ueno', { regularOpeningPeriods: record('old-google-id') });
  const s = server(p);
  s.store.set(openingHoursKey(p.placeId), JSON.stringify(record('different-google-id')));
  const result = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(result.payload.regularOpeningPeriods.placeId, p.placeId);
  assert.equal(s.google.length, 1);
  const embedded = server(place('ueno', { regularOpeningPeriods: record('google-ueno') }));
  embedded.store.set(openingHoursKey('google-ueno'), JSON.stringify({ ...record('google-ueno'), periods: [{ open: {} }] }));
  const fallback = await embedded.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(fallback.payload.status, 'known');
  assert.equal(embedded.google.length, 0);
});

test('network, timeout, quota and upstream failures remain unknown and retry-eligible', async () => {
  for (const failure of ['network', 'timeout', 'quota', 'upstream']) {
    const p = place('ueno'), s = server(p), normal = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (String(url).includes('redis.test')) return normal(url, options);
      if (failure === 'network') throw new Error('network');
      if (failure === 'timeout') throw new DOMException('timeout', 'AbortError');
      return new Response('{}', { status: failure === 'quota' ? 429 : 500 });
    };
    const first = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
    assert.ok(first.statusCode >= 500, failure);
    assert.equal(s.store.has(openingHoursKey(p.placeId)), false, failure);
    globalThis.fetch = normal;
    const retry = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
    assert.equal(retry.payload.status, 'known', failure);
  }
});

test('sidecar write failure never falls back to a Trip write or claims persistence', async () => {
  const p = place('ueno'), s = server(p), normal = globalThis.fetch, before = s.store.get(s.key);
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('redis.test') && JSON.parse(options.body)[0] === 'SET') return new Response('{}', { status: 503 });
    return normal(url, options);
  };
  const result = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(result.statusCode, 503);
  assert.equal(result.payload.error, 'OPENING_HOURS_STORE_UNAVAILABLE');
  assert.equal(s.store.get(s.key), before);
  assert.equal(s.store.has(openingHoursKey(p.placeId)), false);
});

test('successful exact response lacking periods writes unavailable; transient quota and store failures never write unavailable', async () => {
  const p = place('ueno');
  const s = server(p);
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('redis.test')) {
      const [verb, ...args] = JSON.parse(options.body); s.commands.push([verb, ...args]);
      const result = verb === 'GET' ? s.store.get(args[0]) ?? null : verb === 'MGET' ? args.map(key => s.store.get(key) ?? null) : verb === 'SET' ? (s.store.set(args[0], args[1]), 'OK') : null;
      return new Response(JSON.stringify({ result }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: p.placeId }), { status: 200 });
  };
  const result = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(result.payload.status, 'unavailable');
  assert.equal(JSON.parse(s.store.get(openingHoursKey(p.placeId))).status, 'unavailable');
  s.store.delete(openingHoursKey(p.placeId));
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('redis.test')) {
      const [verb, ...args] = JSON.parse(options.body);
      const result = verb === 'GET' ? s.store.get(args[0]) ?? null : verb === 'MGET' ? args.map(key => s.store.get(key) ?? null) : null;
      return new Response(JSON.stringify({ result }), { status: 200 });
    }
    return new Response('{}', { status: 429 });
  };
  const failed = await s.run('hydrateOpeningHours', { ref: 'app:synthetic-ueno' });
  assert.equal(failed.statusCode, 502);
  assert.equal(s.store.has(openingHoursKey(p.placeId)), false);
});

test('server Planner preflight reads sidecar known hours, makes zero Google calls and zero Trip writes', async () => {
  const p = place('ueno');
  const s = server(p);
  process.env.AI_PLANNER_MODEL = 'gpt-5.6-luna';
  process.env.OPENAI_API_KEY = 'test-key';
  s.store.set(openingHoursKey(p.placeId), JSON.stringify(record(p.placeId)));
  const before = s.store.get(s.key);
  const result = await s.run('plan', { expectedRevision: 1, selected: [{ ref: 'app:synthetic-ueno', dateOptions: [
    { dayKey: '9/20', mode: 'exact', exactTime: '07:00' },
  ] }] });
  assert.equal(result.statusCode, 422, JSON.stringify(result.payload));
  assert.equal(result.payload.reason, 'OPENING_HOURS_CONFLICT');
  assert.equal(s.google.length, 0);
  assert.equal(s.store.get(s.key), before);
  assert.equal(s.commands.filter(c => c[0] === 'SET' && c[1] === s.key).length, 0);
});

test('selection hydrates in session without Trip/Undo writes and blocks Planner until settled', async () => {
  const b = await boot(trip([place('ueno')]));
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  b.run('setPlacePoolOpen(true)');
  const revision = b.state.sharedRevision;
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  const hydrate = b.requests.find(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.ok(hydrate);
  assert.match(b.app.innerHTML, /正在確認營業時間/);
  const pending = b.run('requestPlacePoolPlan()');
  assert.equal(b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'plan').length, 0);
  await b.reply(hydrate, { status: 'known', regularOpeningPeriods: record('google-ueno') });
  await Promise.resolve();
  assert.deepEqual(json(b.state.places[0].regularOpeningPeriods), record('google-ueno'));
  assert.equal(b.state.sharedRevision, revision);
  assert.equal(b.requests.filter(r => r.options.method === 'PUT' && r.url.startsWith('/api/trip')).length, 0);
  assert.equal('regularOpeningPeriods' in b.run('sharedTripPayload().places[0]'), false);
  const plan = b.requests.find(r => JSON.parse(r.options.body || '{}').action === 'plan');
  assert.ok(plan);
  await b.reply(plan, { error: 'TEST' }, 422);
  await pending;
});

test('rapid reselection and duplicate Place representations share one in-flight request', async () => {
  const b = await boot(trip([place('ueno'), place('asakusa', { placeId: 'google-ueno' })]));
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('togglePlacePoolSelection("app:synthetic-asakusa")');
  const requests = () => b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.equal(requests().length, 1);
  await b.reply(requests()[0], { status: 'known', regularOpeningPeriods: record('google-ueno') });
  assert.equal(b.state.places[0].regularOpeningPeriods.status, 'known');
  assert.equal(b.state.places[1].regularOpeningPeriods.status, 'known');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  assert.equal(requests().length, 1);
});

test('Detail-open and Planner selection share an hours-only request for the same Google identity', async () => {
  const b = await boot(trip([place('ueno', { photosLoaded: true })]));
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  const detail = b.run('ensurePlaceDetails(state.places[0])');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  const requests = b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.equal(requests.length, 1);
  await b.reply(requests[0], { status: 'known', regularOpeningPeriods: record('google-ueno') });
  await detail;
  assert.equal(b.state.places[0].regularOpeningPeriods.status, 'known');
  assert.equal(b.requests.filter(r => r.url === '/api/places').length, 0);
});

test('client skips no-placeId and matching authoritative embedded records, but requests malformed or foreign records', async () => {
  const list = [place('ueno', { placeId: '', openingHours: '每日 10:00–18:00' }),
    place('asakusa', { regularOpeningPeriods: record('google-asakusa') }),
    place('tsukiji', { regularOpeningPeriods: record('google-tsukiji', 'unavailable') }),
    place('ginza', { regularOpeningPeriods: { ...record('google-ginza'), periods: [{ open: {} }] } }),
    place('shibuya', { regularOpeningPeriods: record('old-id') })];
  const b = await boot(trip(list));
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  for (const key of ['ueno', 'asakusa', 'tsukiji', 'ginza', 'shibuya']) b.run(`togglePlacePoolSelection("app:synthetic-${key}")`);
  const requests = b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.deepEqual(requests.map(r => JSON.parse(r.options.body).ref), ['app:synthetic-ginza', 'app:synthetic-shibuya']);
  assert.equal(list[0].openingHours, '每日 10:00–18:00');
  for (const r of requests) await b.reply(r, { error: 'TEST' }, 502);
});

test('five selected Google Places run at most three concurrent hours requests', async () => {
  const keys = ['ueno', 'asakusa', 'tsukiji', 'ginza', 'shibuya'];
  const b = await boot(trip(keys.map(key => place(key))));
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  for (const key of keys) b.run(`togglePlacePoolSelection("app:synthetic-${key}")`);
  const requests = () => b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.equal(requests().length, 3);
  await b.reply(requests()[0], { status: 'known', regularOpeningPeriods: record('google-ueno') });
  assert.equal(requests().length, 4);
  await b.reply(requests()[1], { status: 'known', regularOpeningPeriods: record('google-asakusa') });
  assert.equal(requests().length, 5);
  for (const request of requests().filter(r => !r.replied)) await b.reply(request, { error: 'PLACE_DETAILS_429' }, 502);
  assert.equal(b.run('plannerHoursActive'), 0);
});

test('transient hydration failure settles, warns, allows Planner and remains retry-eligible', async () => {
  const b = await boot(trip([place('ueno')]));
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  const requests = () => b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  const pending = b.run('requestPlacePoolPlan()');
  await b.reply(requests()[0], { error: 'PLACE_DETAILS_429' }, 502);
  assert.match(b.app.innerHTML, /部分地點的營業時間暫時無法確認/);
  assert.equal(b.state.places[0].regularOpeningPeriods, undefined);
  const plan = b.requests.find(r => JSON.parse(r.options.body || '{}').action === 'plan');
  assert.ok(plan);
  await b.reply(plan, { error: 'TEST' }, 422); await pending;
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  assert.equal(requests().length, 2);
  await b.reply(requests()[1], { status: 'unavailable', regularOpeningPeriods: record('google-ueno', 'unavailable') });
});
