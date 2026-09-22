import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import tripHandler from '../api/trip.mjs';
import { admitHoursTrace, hoursTraceHash, hoursTraceId, safeClientHours } from '../lib/planner-hours-trace.mjs';
import { openingHoursKey } from '../lib/opening-hours-sidecar.mjs';
import { exactPlaceDetails } from '../api/places.mjs';
import { boot, trip, place, json } from './helpers/phase-c-browser.mjs';

const traceId = 'a'.repeat(24);
const known = { v: 1, status: 'known', placeId: 'google-ueno', periods: [{ open: { day: 0, hour: 17, minute: 30 }, close: { day: 1, hour: 0, minute: 0 } }], fetchedAt: '2026-09-22T00:00:00Z' };
function harness(t) {
  const savedFetch = globalThis.fetch, savedLog = console.info;
  const oldEnv = { ...process.env };
  const canonical = { ...trip([place('ueno', { name: 'PRIVATE_NAME', notes: 'PRIVATE_NOTE' })]), id: 'trace-trip' };
  const store = new Map([['tokyo-family-trip:trip:trace-trip', JSON.stringify(canonical)],
    [`tokyo-family-trip:session:${createHash('sha256').update('test-trace-cookie').digest('hex')}`, JSON.stringify({ id: 'trace-member' })]]);
  canonical.members['trace-member'] = 'trace-member';
  store.set('tokyo-family-trip:trip:trace-trip', JSON.stringify(canonical));
  const logs = [], commands = [];
  console.info = (...values) => logs.push(values);
  process.env.KV_REST_API_URL = 'https://trace-redis.test'; process.env.KV_REST_API_TOKEN = 'fixture';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://trace-redis.test');
    const [verb, ...args] = JSON.parse(options.body); commands.push([verb, ...args]);
    assert.ok(['GET', 'MGET'].includes(verb), 'diagnostics cannot write or call an external API');
    return new Response(JSON.stringify({ result: verb === 'MGET' ? args.map(key => store.get(key) ?? null) : store.get(args[0]) ?? null }));
  };
  t.after(() => { globalThis.fetch = savedFetch; console.info = savedLog; process.env = oldEnv; });
  const run = async (body, authenticated = true, id = traceId) => {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.payload = value; } };
    await tripHandler({ method: 'POST', query: { id: 'trace-trip' }, headers: { 'x-planner-hours-trace': id, cookie: authenticated ? 'tokyo_trip_session=test-trace-cookie' : '' }, body }, res);
    return res;
  };
  return { run, logs, commands, store, canonical };
}

test('diagnostic sanitizer accepts only enumerated fields, booleans, hashes and date/time constraints', () => {
  const value = safeClientHours({ selected: 'PRIVATE', identityHash: 'raw-id', effectiveStatus: 'SECRET', name: 'PRIVATE',
    dateOptions: [{ dayKey: '9/20', mode: 'exact', exactTime: '09:00', notes: 'PRIVATE' }], response: { error: 'SECRET' } });
  assert.equal(value.selected, null); assert.equal(value.identityHash, null);
  assert.doesNotMatch(JSON.stringify(value), /PRIVATE|SECRET|raw-id/);
  assert.deepEqual(value.dateOptions, [{ dayKey: '9/20', mode: 'exact', exactTime: '09:00' }]);
  assert.doesNotThrow(() => safeClientHours(null));
  assert.equal(hoursTraceId({ headers: { 'x-planner-hours-trace': 'PRIVATE' } }), null);
});

test('authenticated client snapshot correlates canonical identity/sidecar without logging raw data or writing Trip', async t => {
  const h = harness(t); h.store.set(openingHoursKey(known.placeId), JSON.stringify(known));
  const before = JSON.stringify([...h.store]);
  const res = await h.run({ action: 'plannerHoursTrace', candidates: [{ ref: 'app:synthetic-ueno', client: {
    identityHash: hoursTraceHash(known.placeId), dateOptions: [{ dayKey: '9/20', mode: 'exact', exactTime: '09:00' }],
    name: 'PRIVATE_NAME', notes: 'PRIVATE_NOTE', clientConflict: false, hasOpeningWindows: false } }], ui: { selectedCount: 1, ctaDisabled: false } });
  assert.equal(res.statusCode, 200);
  const event = JSON.parse(h.logs.find(row => row[0] === 'planner-hours-trace')[1]);
  assert.equal(event.traceId, traceId);
  assert.equal(event.candidates[0].server.sidecarRead, 'known');
  assert.equal(event.candidates[0].server.identityHash, event.candidates[0].client.identityHash);
  assert.equal(event.candidates[0].server.days[0].weekday, 0);
  assert.deepEqual(event.candidates[0].server.days[0].windows, [{ startMinute: 1050, endMinute: 1440 }]);
  assert.doesNotMatch(JSON.stringify(h.logs), /PRIVATE_NAME|PRIVATE_NOTE|google-ueno|synthetic-ueno|trace-trip|test-trace-cookie/);
  assert.equal(JSON.stringify([...h.store]), before);
});

test('diagnostics require membership and valid trace shape; request size and candidate count are bounded', async t => {
  const h = harness(t);
  assert.equal((await h.run({ action: 'plannerHoursTrace', candidates: [] }, false)).statusCode, 401);
  assert.equal((await h.run({ action: 'plannerHoursTrace', candidates: [] }, true, 'invalid')).statusCode, 400);
  assert.equal((await h.run({ action: 'plannerHoursTrace', candidates: Array(21).fill({}) })).statusCode, 400);
  assert.equal((await h.run({ action: 'plannerHoursTrace', candidates: [], junk: 'x'.repeat(60001) })).statusCode, 400);
  assert.equal(h.logs.length, 0);
});

test('diagnostic admission is bounded per member and expires without persistent state', () => {
  for (let i = 0; i < 40; i++) assert.equal(admitHoursTrace('limit-fixture', 100), true);
  assert.equal(admitHoursTrace('limit-fixture', 101), false);
  assert.equal(admitHoursTrace('limit-fixture', 600102), true);
});

test('server Plan trace correlates normalized exact constraints and preflight without changing model/write boundaries', async t => {
  const h = harness(t); h.store.set(openingHoursKey(known.placeId), JSON.stringify(known));
  process.env.AI_PLANNER_MODEL = 'gpt-5.6-luna'; process.env.AI_PLANNER_REASONING_EFFORT = 'high'; process.env.OPENAI_API_KEY = 'fixture';
  const before = JSON.stringify([...h.store]);
  const result = await h.run({ action: 'plan', expectedRevision: 1,
    selected: [{ ref: 'app:synthetic-ueno', dateOptions: [{ dayKey: '9/20', mode: 'exact', exactTime: '09:00' }] }] });
  assert.equal(result.statusCode, 422);
  const events = h.logs.filter(row => row[0] === 'planner-hours-trace').map(row => JSON.parse(row[1]));
  const preflight = events.find(event => event.stage === 'plan_preflight');
  assert.equal(preflight.traceId, traceId); assert.equal(preflight.openingHoursConflict, true);
  assert.equal(preflight.selected[0].hasOpeningWindows, true);
  assert.equal(preflight.selected[0].dateOptions[0].exactTime, '09:00');
  assert.equal(events.find(event => event.stage === 'plan_result').modelCalls, 0);
  assert.equal(JSON.stringify([...h.store]), before);
});

test('diagnostic snapshot distinguishes unavailable, miss and read error without hydration', async t => {
  const h = harness(t);
  const body = { action: 'plannerHoursTrace', candidates: [{ ref: 'app:synthetic-ueno', client: {} }] };
  await h.run(body);
  h.store.set(openingHoursKey(known.placeId), JSON.stringify({ ...known, status: 'unavailable', periods: [] }));
  await h.run(body);
  const fetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (JSON.parse(options.body)[0] === 'MGET') throw new Error('read unavailable');
    return fetch(url, options);
  };
  await h.run(body);
  const outcomes = h.logs.filter(row => row[0] === 'planner-hours-trace').map(row => JSON.parse(row[1]).candidates[0].server.sidecarRead);
  assert.deepEqual(outcomes, ['miss', 'unavailable', 'error']);
});

test('exact-details observer reports shape only and cannot change exact hours semantics', async t => {
  const saved = globalThis.fetch; t.after(() => { globalThis.fetch = saved; });
  let mask;
  globalThis.fetch = async (_, options) => { mask = options.headers['X-Goog-FieldMask']; return new Response(JSON.stringify({ id: known.placeId,
    regularOpeningHours: { periods: known.periods }, displayName: { text: 'PRIVATE' } })); };
  const observations = [];
  const result = await exactPlaceDetails({ apiKey: 'fixture', placeId: known.placeId, hoursOnly: true, observeHours: value => observations.push(value) });
  assert.equal(mask, 'id,regularOpeningHours'); assert.equal(result.regularOpeningPeriods.status, 'known');
  assert.deepEqual(observations, [{ exactSucceeded: true, identityMatches: true, hasRegularOpeningHours: true, hasPeriods: true, periodCount: 1 }]);
  const ignored = await exactPlaceDetails({ apiKey: 'fixture', placeId: known.placeId, hoursOnly: true, observeHours() { throw new Error('observer'); } });
  assert.equal(ignored.regularOpeningPeriods.status, 'known');
});

test('real shipped client emits a correlated snapshot without changing selection/constraints or Trip payload', async () => {
  const b = await boot(trip([place('ueno')]));
  b.context.crypto = webcrypto; b.context.TextEncoder = TextEncoder;
  b.state.selectedDate = '9/20'; await b.run('setTab("itinerary")'); b.run('setPlacePoolOpen(true)');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  const hydration = b.requests.find(row => JSON.parse(row.options.body || '{}').action === 'hydrateOpeningHours');
  await b.reply(hydration, { regularOpeningPeriods: known, openingWindows: { '9/20': [{ startMinute: 1050, endMinute: 1440 }] },
    windowCalendar: { startDate: '2026-09-20', endDate: '2026-09-23' } });
  const before = JSON.stringify(b.run('sharedTripPayload()'));
  const pending = b.run('sendPlannerHoursTrace()');
  for (let i = 0; i < 20 && !b.requests.some(row => JSON.parse(row.options.body || '{}').action === 'plannerHoursTrace'); i++) await new Promise(resolve => setTimeout(resolve, 1));
  const request = b.requests.find(row => JSON.parse(row.options.body || '{}').action === 'plannerHoursTrace');
  assert.ok(request);
  assert.equal(request.options.headers['x-planner-hours-trace'], hydration.options.headers['x-planner-hours-trace']);
  const body = JSON.parse(request.options.body);
  assert.equal(body.candidates[0].client.identityHash, hoursTraceHash(known.placeId));
  assert.equal(body.candidates[0].client.clientConflict, true);
  assert.equal(body.candidates[0].client.response.accepted, true);
  assert.deepEqual(body.candidates[0].client.dateOptions[0].exactTime, '09:00');
  assert.equal(body.candidates[0].client.mainMounted, false, 'DOM mount evidence is measured, not inferred from state');
  assert.doesNotMatch(request.options.body, /google-ueno|Place ueno|regularOpeningPeriods/);
  await b.reply(request, { ok: true }); await pending;
  assert.equal(JSON.stringify(b.run('sharedTripPayload()')), before);
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  const count = b.requests.length; await b.run('sendPlannerHoursTrace()'); assert.equal(b.requests.length, count, 'unchanged snapshot dedupes');
});
