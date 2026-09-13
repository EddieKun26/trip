/* Decision-order and write-path behaviour for the one-shot Canonical Area migration.
 *
 * The approved fingerprints are pinned to the real 39-Place baseline, whose raw values are
 * not in this repo, so behaviour is exercised against a small self-built manifest that goes
 * through the very same canonicalization, gates and validation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import mig from '../lib/canonical-travel-migration.js';

const CATALOG = {
  shibuya: { travelAreaKey: 'shibuya' }, harajuku: { travelAreaKey: 'harajuku' },
  ebisu: { travelAreaKey: 'ebisu' }, daikanyama: { travelAreaKey: 'daikanyama' },
  shinjuku: { travelAreaKey: 'shinjuku' },
};

const automatic = key => ({
  travelAreaKey: key, travelAreaZh: key, travelAreaLocal: key, travelAreaResolved: true,
  travelAreaManuallySet: false, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
  travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
});
const manual = key => ({
  travelAreaKey: key, travelAreaZh: key, travelAreaLocal: key, travelAreaResolved: true,
  travelAreaManuallySet: true, travelAreaSource: 'manual', travelAreaResolver: 'MANUAL',
  travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
});

const place = (placeId, key, extra = {}) => ({
  placeId, name: `place-${placeId}`, kind: 'restaurant', countryCode: 'JP',
  latitude: 35.66, longitude: 139.7, formattedAddress: `addr-${placeId}`,
  addressComponentsOriginal: [{ longText: 'x', types: ['sublocality'] }],
  areaTags: ['raw-tag'], restaurantTags: [], ...automatic(key), ...extra,
});

function fixtureTrip() {
  return {
    id: 'tokyo-family-2026', title: 'Seven days', destination: 'Tokyo',
    startDate: '2026-09-20', endDate: '2026-09-26', inviteCode: 'ABC123',
    publicRead: false, ownerId: 'owner', revision: 261,
    updatedAt: '2026-09-12T00:00:00.000Z', updatedBy: 'owner',
    places: [place('T1', 'shibuya'), place('T2', 'shibuya', { autoTravelArea: automatic('shibuya') }),
      place('K1', 'shinjuku'), place('K2', 'ebisu')],
    votes: { alice: ['place-T1'] }, itinerary: { '2026-09-20': ['place-K1'] },
    flights: [], transports: [], members: { owner: 'Owner', alice: 'Alice' },
  };
}

const ROWS = [
  { reviewId: 'R01', stableId: 'google:T1', placeId: 'T1', fullName: 'place-T1',
    autoTravelAreaBeforeState: 'absent', autoTravelAreaAction: 'no-safe-auto',
    noSafeAutoReason: 'AMBIGUOUS_EBISU_DAIKANYAMA', after: manual('ebisu') },
  { reviewId: 'R02', stableId: 'google:T2', placeId: 'T2', fullName: 'place-T2',
    autoTravelAreaBeforeState: 'existing', autoTravelAreaAction: 'preserve',
    noSafeAutoReason: '', after: { ...manual('harajuku'), autoTravelArea: automatic('shibuya') } },
];

async function buildManifest(trip, rows) {
  const targets = new Set(rows.map(row => row.stableId));
  const baselineFields = {};
  for (const item of trip.places) {
    const id = mig.stableId(item);
    const fields = targets.has(id) ? [...mig.STATE_FIELDS, ...mig.TARGET_GEO_FIELDS] : mig.STATE_FIELDS;
    for (const field of fields) {
      if (Object.hasOwn(item, field)) baselineFields[`${id}.${field}`] = await mig.digest(mig.canonicalField(item, field));
    }
  }
  const draft = {
    version: 1, tripId: trip.id, revision: trip.revision, placeCount: trip.places.length,
    placeStableIds: trip.places.map(mig.stableId).sort(), baselineFields, rows,
  };
  draft.preFingerprint = await mig.stateFingerprint(await mig.approvedPreFieldHashes(draft));
  draft.postFingerprint = await mig.stateFingerprint(await mig.approvedPostFieldHashes(draft));
  return draft;
}

/* Stands in for the Trip endpoint: server-managed fields move on every accepted write, and a
 * write whose expected revision is stale is refused outright. */
function fakeServer(trip, { writeMode = 'atomic' } = {}) {
  let stored = structuredClone(trip);
  const server = {
    writes: 0, reads: 0,
    // Two timings matter. onRead lands before the snapshot is taken, so that read observes the
    // change; onAfterRead lands once the snapshot is out, modelling a member write that
    // arrives between a read and the migration's own write.
    onRead: null, onAfterRead: null,
    peek: () => structuredClone(stored),
    externalEdit(mutate) { const next = structuredClone(stored); mutate(next); next.revision += 1; stored = next; },
    read: async () => {
      server.reads += 1;
      if (server.onRead) server.onRead(server.reads, stored);
      const snapshot = structuredClone(stored);
      if (server.onAfterRead) server.onAfterRead(server.reads, stored);
      return snapshot;
    },
    write: async (payload, expectedRevision) => {
      if ((Number(stored.revision) || 0) !== expectedRevision) return { ok: false, conflict: true, status: 409, writeMode };
      const next = structuredClone(payload);
      next.revision = (Number(stored.revision) || 0) + 1;
      next.updatedAt = '2026-09-13T00:00:00.000Z';
      next.updatedBy = 'tester';
      stored = next;
      server.writes += 1;
      return { ok: true, writeMode, trip: structuredClone(stored) };
    },
  };
  return server;
}

const runGate = (server, manifest, extra = {}) => mig.run({
  manifest, catalog: CATALOG, read: server.read, write: server.write, ...extra,
});

test('a present marker is an immediate no-op that releases the schedulers', async () => {
  const trip = fixtureTrip();
  trip[mig.MARKER] = mig.VERSION;
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(trip);
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.MARKER_NOOP);
  assert.equal(result.stage, 'marker');
  assert.equal(server.writes, 0);
  assert.equal(server.reads, 1, 'no gate may run after the marker');
  assert.ok(result.schedulersReleased);
});

test('PRE state migrates once, then releases the schedulers', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.MIGRATED, result.reason);
  assert.equal(result.state, mig.PRE);
  assert.equal(result.writeMode, 'atomic');
  assert.equal(server.writes, 1);
  assert.equal(result.expectedMutations, ROWS.length);
  assert.ok(result.schedulersReleased);
  const stored = server.peek();
  assert.equal(stored[mig.MARKER], mig.VERSION);
  assert.equal(stored.places.find(p => p.placeId === 'T1').travelAreaKey, 'ebisu');
  assert.equal(stored.places.find(p => p.placeId === 'T2').travelAreaKey, 'harajuku');
  // R01 keeps no automatic snapshot rather than resurrecting a legacy composite.
  assert.ok(!Object.hasOwn(stored.places.find(p => p.placeId === 'T1'), 'autoTravelArea'));
});

test('a second open after a successful migration is an immediate no-op', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  await runGate(server, manifest);
  const writesAfterFirst = server.writes;
  const second = await runGate(server, manifest);
  assert.equal(second.outcome, mig.MARKER_NOOP);
  assert.equal(server.writes, writesAfterFirst, 'no further write');
});

test('POST state with a missing marker recovers the marker only, never re-migrating', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const migrated = fakeServer(fixtureTrip());
  await runGate(migrated, manifest);
  const postState = migrated.peek();
  delete postState[mig.MARKER];
  const server = fakeServer(postState);
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.RECOVERED, result.reason);
  assert.equal(result.state, mig.POST);
  assert.equal(result.expectedMutations, 0, 'recovery must not re-apply the rows');
  assert.equal(server.writes, 1);
  assert.equal(server.peek()[mig.MARKER], mig.VERSION);
  assert.ok(result.schedulersReleased);
});

test('a state that is neither PRE nor POST aborts with both diffs and no write', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const drifted = fixtureTrip();
  drifted.places[0].travelAreaKey = 'daikanyama';
  const server = fakeServer(drifted);
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.ABORT);
  assert.equal(result.reason, 'STATE_NEITHER_PRE_NOR_POST');
  assert.equal(server.writes, 0);
  assert.ok(result.preDiff.some(line => line.startsWith('google:T1.travelAreaKey')));
  assert.ok(Array.isArray(result.postDiff) && result.postDiff.length > 0);
  assert.ok(!result.schedulersReleased, 'schedulers must stay parked after an abort');
  assert.equal(server.peek()[mig.MARKER], undefined);
});

test('an unstable double read aborts before any gate that could write', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  // Read 1 is the marker check, 2 is Read A, 3 is Read B.
  server.onRead = count => { if (count === 3) server.externalEdit(t => { t.places[2].areaTags = ['changed']; }); };
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.ABORT);
  assert.equal(result.reason, 'DOUBLE_READ_INSTABILITY');
  assert.equal(result.stage, 'double-read');
  assert.equal(server.writes, 0);
  assert.ok(result.diff.some(line => line.startsWith('google:K1.areaTags')));
  assert.ok(!result.schedulersReleased);
});

test('an added or removed Place aborts at the identity gate', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const short = fixtureTrip();
  short.places = short.places.slice(0, 3);
  const removed = await runGate(fakeServer(short), manifest);
  assert.equal(removed.reason, 'PLACE_IDENTITY_MISMATCH');
  assert.equal(removed.stage, 'identity');
  assert.ok(removed.diff.some(line => line.includes('missing')));

  const extra = fixtureTrip();
  extra.places.push(place('NEW', 'shinjuku'));
  const added = await runGate(fakeServer(extra), manifest);
  assert.equal(added.reason, 'PLACE_IDENTITY_MISMATCH');
  assert.ok(added.diff.some(line => line.includes('google:NEW added')));
});

test('a target whose coordinates or address moved aborts at the identity gate', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  for (const mutate of [t => { t.places[0].latitude = 35.7; }, t => { t.places[0].formattedAddress = 'moved'; }]) {
    const drifted = fixtureTrip();
    mutate(drifted);
    const result = await runGate(fakeServer(drifted), manifest);
    assert.equal(result.reason, 'TARGET_LOCATION_CHANGED', 'a moved target must not inherit the old decision');
    assert.equal(result.stage, 'identity');
  }
});

test('votes, itinerary and restaurantTags moving does not stop the migration', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const busy = fixtureTrip();
  busy.votes = { alice: ['place-K1'], bob: ['place-T2'] };
  busy.itinerary = { '2026-09-21': ['place-T1'] };
  busy.places[2].restaurantTags = ['ramen'];
  busy.revision = 999;
  busy.updatedBy = 'alice';
  const server = fakeServer(busy);
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.MIGRATED, result.reason);
  assert.equal(result.state, mig.PRE, 'ordinary member activity must not change the classification');
  assert.equal(server.writes, 1);
  const stored = server.peek();
  assert.deepEqual(stored.votes, busy.votes);
  assert.deepEqual(stored.itinerary, busy.itinerary);
  assert.deepEqual(stored.places.find(p => p.placeId === 'K1').restaurantTags, ['ramen']);
});

test('a member write between Read B and the migration write is refused, leaving no marker', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  // Read 3 is Read B; the vote lands once that snapshot is already out.
  server.onAfterRead = count => { if (count === 3) server.externalEdit(t => { t.votes.bob = ['place-T1']; }); };
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.ABORT);
  assert.equal(result.reason, 'REVISION_CONFLICT');
  assert.equal(result.stage, 'conditional-write');
  assert.equal(server.writes, 0, 'a refused conditional write must leave nothing behind');
  assert.equal(server.peek()[mig.MARKER], undefined);
  assert.ok(!result.schedulersReleased);
  // The member's vote is still there, untouched by the refused attempt.
  assert.deepEqual(server.peek().votes.bob, ['place-T1']);
  // A later open starts the decision again and succeeds.
  server.onAfterRead = null;
  const retry = await runGate(server, manifest);
  assert.equal(retry.outcome, mig.MIGRATED, retry.reason);
});

test('the reported write mode follows the transport and is never called atomic when it is not', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  for (const writeMode of ['atomic', 'cas-window']) {
    const server = fakeServer(fixtureTrip(), { writeMode });
    const messages = [];
    const result = await mig.run({
      manifest, catalog: CATALOG, read: server.read, write: server.write,
      notify: message => messages.push(message),
    });
    assert.equal(result.outcome, mig.MIGRATED, result.reason);
    assert.equal(result.writeMode, writeMode);
    assert.ok(messages.some(message => message.includes(writeMode)), 'the visible message must name the path');
    assert.ok(mig.diagnosticLines(result).includes(`writeMode=${writeMode}`));
  }
});

test('collateral outside the approved write set fails the run and admits the write landed', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  const honest = server.write;
  server.write = async (payload, expectedRevision) => {
    const result = await honest(payload, expectedRevision);
    if (result.ok) server.externalEdit(t => { t.votes.mallory = ['place-K2']; });
    return result;
  };
  const result = await runGate(server, manifest);
  assert.equal(result.outcome, mig.ABORT);
  assert.ok(['COLLATERAL_MUTATION', 'POST_STATE_MISMATCH'].includes(result.reason), result.reason);
  assert.equal(result.writes, 1);
  assert.ok(mig.diagnosticLines(result).includes('writes=1'));
});

test('a server pipeline that would touch raw tags is caught before the write', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  const result = await runGate(server, manifest, {
    replay: async trip => ({ ...trip, places: trip.places.map(p => ({ ...p, areaTags: ['rewritten'] })) }),
  });
  assert.equal(result.outcome, mig.ABORT);
  assert.equal(result.stage, 'replay');
  assert.ok(['SERVER_PIPELINE_WOULD_MUTATE', 'SERVER_PIPELINE_COLLATERAL'].includes(result.reason), result.reason);
  assert.equal(server.writes, 0, 'nothing may be written once the replay proof fails');
});

test('a faithful replay leaves the post-state fingerprint untouched', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  let replays = 0;
  const result = await runGate(server, manifest, {
    replay: async trip => { replays += 1; return structuredClone(trip); },
  });
  assert.equal(result.outcome, mig.MIGRATED, result.reason);
  assert.ok(replays > 0, 'the replay proof must actually run');
});

test('re-applying the manifest to the migrated state changes nothing', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  const result = await runGate(server, manifest);
  assert.equal(result.secondAudit, 0);
  const again = mig.applyManifest(server.peek(), manifest).trip;
  const targets = manifest.rows.map(row => row.stableId);
  assert.equal((await mig.fingerprintOf(again, targets)).fingerprint, manifest.postFingerprint);
});

test('canonical validation rejects empty, unknown, jp-prefixed and legacy composite keys', () => {
  assert.ok(mig.validateCanonical(fixtureTrip(), CATALOG).ok);
  for (const [label, key] of [['empty', ''], ['unknown', 'nowhere'], ['jp', 'jp:13113'],
    ['legacy', 'ebisu-daikanyama'], ['unclassified', 'unclassified:x']]) {
    const broken = fixtureTrip();
    broken.places[0].travelAreaKey = key;
    assert.ok(!mig.validateCanonical(broken, CATALOG).ok, `${label} key must be rejected`);
  }
  const snapshot = fixtureTrip();
  snapshot.places[0].autoTravelArea = { ...automatic('shibuya'), travelAreaKey: 'harajuku-omotesando' };
  assert.ok(!mig.validateCanonical(snapshot, CATALOG).ok, 'a legacy composite snapshot must be rejected');
});

test('Phase A rejects premature persisted candidate state and ambiguous snapshots', () => {
  for (const mutate of [p=>p.travelAreaCandidateKeys=['ebisu','daikanyama'],p=>p.travelAreaResolutionStatus='ambiguous',
    p=>p.autoTravelArea={status:'ambiguous',candidateKeys:['ebisu','daikanyama']}]) {
    const trip=fixtureTrip();mutate(trip.places[0]);assert.equal(mig.validateCanonical(trip,CATALOG).ok,false);
  }
});

test('Phase A never persists candidate state', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const server = fakeServer(fixtureTrip());
  await runGate(server, manifest);
  for (const item of server.peek().places) {
    assert.equal(item.travelAreaCandidateKeys, undefined);
    assert.notEqual(item.travelAreaResolutionStatus, 'ambiguous');
    assert.ok(item.travelAreaKey, 'every Place keeps a non-empty key at Phase A completion');
  }
});

test('diagnostics never leak names, addresses, nicknames or tag values', async () => {
  const manifest = await buildManifest(fixtureTrip(), ROWS);
  const drifted = fixtureTrip();
  drifted.places[0].areaTags = ['secret-tag'];
  const result = await runGate(fakeServer(drifted), manifest);
  assert.equal(result.outcome, mig.ABORT);
  const text = mig.diagnosticLines(result).join('\n');
  for (const secret of ['secret-tag', 'place-T1', 'addr-T1', 'Alice', 'Owner', 'raw-tag', 'ABC123']) {
    assert.ok(!text.includes(secret), `diagnostics leaked ${secret}`);
  }
  assert.ok(text.includes('google:T1.areaTags'), 'the offending field must still be identifiable');
});

// ---------------------------------------------------------------------------
// The real Trip endpoint
// ---------------------------------------------------------------------------

const SESSION = 'synthetic-session';

/* Drives the actual PUT/GET handler against in-memory storage. `scripting` decides whether
 * the stand-in provider accepts EVAL, so both the atomic and the narrowed-window paths run
 * against the same handler. The module is imported per case because the handler caches its
 * capability probe for the life of the instance. */
async function endpoint({ trip, scripting, instance = String(scripting), beforeCompare }) {
  const key = `tokyo-family-trip:trip:${trip.id}`;
  const store = new Map([
    [key, JSON.stringify(trip)],
    [`tokyo-family-trip:session:${createHash('sha256').update(SESSION).digest('hex')}`,
      JSON.stringify({ id: 'owner', nickname: 'Owner' })],
  ]);
  const calls = [];
  const scripts = [];
  let tripReads = 0;
  const originalFetch = globalThis.fetch;
  const env = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const previous = Object.fromEntries(env.map(name => [name, process.env[name]]));
  process.env.KV_REST_API_URL = 'https://synthetic-redis.invalid';
  process.env.KV_REST_API_TOKEN = 'synthetic-not-a-real-secret';
  globalThis.fetch = async (url, options) => {
    const command = JSON.parse(options.body);
    const [operation] = command;
    calls.push(operation);
    if (operation === 'GET') {
      if (command[1] === key && ++tripReads === 2 && !scripting) beforeCompare?.(store, key);
      return { ok: true, json: async () => ({ result: store.get(command[1]) || null }) };
    }
    if (operation === 'SET') { store.set(command[1], command[2]); return { ok: true, json: async () => ({ result: 'OK' }) }; }
    if (operation === 'EVAL') {
      scripts.push(command[1]);
      if (!scripting) return { ok: true, json: async () => ({ error: 'ERR unknown command' }) };
      if (command[1] === 'return 1') return { ok: true, json: async () => ({ result: 1 }) };
      const [, , , target, expected, payload] = command;
      beforeCompare?.(store, target);
      const raw = store.get(target);
      if (!raw) return { ok: true, json: async () => ({ result: 'MISSING' }) };
      const revision = Number(JSON.parse(raw).revision) || 0;
      if (revision !== Number(expected)) return { ok: true, json: async () => ({ result: `CONFLICT:${revision}` }) };
      store.set(target, payload);
      return { ok: true, json: async () => ({ result: 'OK' }) };
    }
    throw new Error(`UNEXPECTED_COMMAND_${operation}`);
  };
  const { default: handler } = await import(`../api/trip.mjs?instance=${instance}`);
  const request = async (method, body) => {
    let payload, status = 0;
    const response = {
      status(code) { status = code; return this; },
      setHeader() { return this; },
      json(value) { payload = value; },
    };
    await handler({ method, body, query: { id: trip.id }, headers: { cookie: `tokyo_trip_session=${SESSION}` } }, response);
    return { status, body: payload };
  };
  const restore = () => {
    globalThis.fetch = originalFetch;
    for (const name of env) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  };
  return { request, calls, scripts, restore, stored: () => JSON.parse(store.get(key)) };
}

const endpointTrip = () => ({ ...fixtureTrip(), id: 'synthetic-endpoint-trip', members: { owner: 'Owner' } });

test('a PUT without expectedRevision keeps the existing unconditional behaviour', async () => {
  const api = await endpoint({ trip: endpointTrip(), scripting: true });
  try {
    const saved = await api.request('PUT', endpointTrip());
    assert.equal(saved.status, 200);
    assert.equal(saved.body.revision, 262, 'the server still owns the revision');
    assert.equal(saved.body.writeMode, undefined, 'no write mode is claimed for an ordinary save');
    // No scripting is used when the caller did not ask for a conditional write.
    assert.ok(!api.calls.includes('EVAL'));
    assert.ok(api.calls.includes('SET'));
  } finally { api.restore(); }
});

test('a matching expectedRevision writes atomically when scripting is available', async () => {
  const api = await endpoint({ trip: endpointTrip(), scripting: true });
  try {
    const saved = await api.request('PUT', { ...endpointTrip(), expectedRevision: 261 });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.writeMode, 'atomic');
    assert.equal(api.stored().revision, 262);
    // The precondition is a request field only; it must never be persisted.
    assert.equal(api.stored().expectedRevision, undefined);
    assert.equal(saved.body.expectedRevision, undefined);
  } finally { api.restore(); }
});

test('a matching expectedRevision falls back to a narrowed window without scripting', async () => {
  const api = await endpoint({ trip: endpointTrip(), scripting: false });
  try {
    const saved = await api.request('PUT', { ...endpointTrip(), expectedRevision: 261 });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.writeMode, 'cas-window', 'the weaker guarantee must be named, not hidden');
    assert.equal(api.stored().revision, 262);
  } finally { api.restore(); }
});

test('a stale expectedRevision is refused with 409 and writes nothing', async () => {
  for (const scripting of [true, false]) {
    const api = await endpoint({ trip: endpointTrip(), scripting });
    try {
      const refused = await api.request('PUT', { ...endpointTrip(), expectedRevision: 260 });
      assert.equal(refused.status, 409);
      assert.equal(refused.body.error, 'REVISION_CONFLICT');
      assert.equal(refused.body.revision, 261);
      assert.equal(api.stored().revision, 261, 'storage must be untouched');
      assert.ok(!api.calls.includes('SET'), 'a refused conditional write must not store anything');
    } finally { api.restore(); }
  }
});

test('the migration marker is accepted once and never rolled back', async () => {
  const api = await endpoint({ trip: endpointTrip(), scripting: true });
  try {
    const first = await api.request('PUT', { ...endpointTrip(), [mig.MARKER]: mig.VERSION, expectedRevision: 261 });
    assert.equal(first.status, 200);
    assert.equal(api.stored()[mig.MARKER], mig.VERSION, 'the first marker write must land');

    // An ordinary save that knows nothing about the marker must not drop it.
    const plain = await api.request('PUT', endpointTrip());
    assert.equal(plain.status, 200);
    assert.equal(api.stored()[mig.MARKER], mig.VERSION);

    // A stale client must not be able to roll the completed migration back.
    await api.request('PUT', { ...endpointTrip(), [mig.MARKER]: 0 });
    assert.equal(api.stored()[mig.MARKER], mig.VERSION);
    await api.request('PUT', { ...endpointTrip(), [mig.MARKER]: -5 });
    assert.equal(api.stored()[mig.MARKER], mig.VERSION);
  } finally { api.restore(); }
});

test('a trip that never migrated gains no marker field', async () => {
  const api = await endpoint({ trip: endpointTrip(), scripting: true });
  try {
    await api.request('PUT', endpointTrip());
    assert.ok(!Object.hasOwn(api.stored(), mig.MARKER));
  } finally { api.restore(); }
});

test('the capability probe is read-only, runs before any write, and is cached', async () => {
  // A fresh instance, so the probe genuinely runs rather than reusing a cached answer.
  const api = await endpoint({ trip: endpointTrip(), scripting: true, instance: 'probe-case' });
  try {
    await api.request('PUT', { ...endpointTrip(), expectedRevision: 261 });
    assert.equal(api.scripts[0], 'return 1', 'the probe must not read or write Trip data');
    assert.equal(api.calls.indexOf('EVAL') < api.calls.indexOf('SET') || !api.calls.includes('SET'), true);
    assert.equal(api.stored().revision, 262);

    // A second conditional write on the same instance reuses the cached capability.
    const before = api.scripts.filter(script => script === 'return 1').length;
    await api.request('PUT', { ...endpointTrip(), expectedRevision: 262 });
    assert.equal(api.scripts.filter(script => script === 'return 1').length, before, 'the probe must be cached');
    assert.equal(api.stored().revision, 263);
  } finally { api.restore(); }
});

// Handoff gate: preserve Fresh Read B order through the actual full Trip PUT/GET.
for (const scripting of [true, false]) {
  test('migration preserves non-sorted Place order through actual PUT and GET (' + (scripting ? 'atomic' : 'cas-window') + ')', async () => {
    const trip = endpointTrip();
    trip.places = [trip.places[2], trip.places[0], trip.places[3], trip.places[1]];
    const expectedOrder = ['K1', 'T1', 'K2', 'T2'];
    const api = await endpoint({ trip, scripting, instance: 'handoff-order-' + scripting });
    try {
      const initial = await api.request('GET');
      assert.equal(initial.status, 200);
      const manifest = await buildManifest(initial.body, ROWS);
      let reads = 0, freshReadB, outgoing;
      const result = await mig.run({
        manifest, catalog: CATALOG,
        read: async () => {
          const response = await api.request('GET');
          assert.equal(response.status, 200);
          if (++reads === 3) freshReadB = structuredClone(response.body);
          return response.body;
        },
        write: async (payload, expectedRevision) => {
          outgoing = structuredClone(payload);
          const response = await api.request('PUT', { ...payload, expectedRevision });
          return { ok: response.status === 200, writeMode: response.body.writeMode };
        },
      });
      assert.equal(result.outcome, mig.MIGRATED, result.reason);
      assert.equal(result.secondAudit, 0);
      const readback = await api.request('GET');
      for (const snapshot of [freshReadB, outgoing, api.stored(), readback.body, result.trip]) {
        assert.deepEqual(snapshot.places.map(p => p.placeId), expectedOrder);
        expectedOrder.forEach((id, index) => assert.equal(snapshot.places[index].placeId, id));
      }
      assert.equal(outgoing[mig.MARKER], mig.VERSION);
      assert.equal(readback.body[mig.MARKER], mig.VERSION);
      assert.deepEqual(mig.collateralReport(freshReadB, readback.body, manifest), { ok: true, violations: [] });
    } finally { api.restore(); }
  });
}

test('structural collateral detects Place reorder while state fingerprint ignores daily sorting', async () => {
  const before = fixtureTrip();
  before.places = [before.places[2], before.places[0], before.places[3], before.places[1]];
  const manifest = await buildManifest(before, ROWS);
  const after = mig.applyManifest(before, manifest).trip;
  const reordered = structuredClone(after);
  [reordered.places[0], reordered.places[1]] = [reordered.places[1], reordered.places[0]];
  const targets = ROWS.map(row => row.stableId);
  assert.equal((await mig.fingerprintOf(after, targets)).fingerprint,
    (await mig.fingerprintOf(reordered, targets)).fingerprint);
  assert.equal(mig.collateralReport(before, after, manifest).ok, true);
  const report = mig.collateralReport(before, reordered, manifest);
  assert.equal(report.ok, false);
  assert.ok(report.violations.includes('order[0]'));
  assert.ok(report.violations.includes('order[1]'));
});

test('ABORT diagnostics hash updatedBy and hide all private values including structural member paths', async () => {
  const secrets=['member-secret','nickname-secret','place-secret','fullname-secret','address-secret','formatted-secret','tag-secret','auth-secret','cookie-secret','pin-secret','token-secret','updatedby-secret'];
  const before=fixtureTrip();Object.assign(before,{updatedBy:secrets[0],members:{[secrets[0]]:secrets[1]}});
  before.updatedBy=secrets[11];
  Object.assign(before.places[0],{name:secrets[2],fullName:secrets[3],address:secrets[4],formattedAddress:secrets[5],areaTags:[secrets[6]],auth:secrets[7],cookie:secrets[8],PIN:secrets[9],token:secrets[10]});
  const manifest=await buildManifest(before,ROWS);
  const drifted=structuredClone(before);drifted.places[0].travelAreaKey='changed';
  const aborted=await runGate(fakeServer(drifted),manifest);
  assert.equal(aborted.outcome,mig.ABORT);
  const context=await mig.contextEvidence(before);
  assert.equal(context.updatedBy,undefined);assert.match(context.updatedByHash,/^[a-f0-9]{8}$/);
  assert.equal(context.updatedByHash,(await mig.fieldHash(before,'updatedBy')).slice(0,8));
  const text=mig.diagnosticLines({...aborted,context,diff:['trip.members.'+secrets[0],'trip.itinerary.'+secrets[2],...aborted.preDiff]}).join('\n');
  for(const secret of secrets)assert.ok(!text.includes(secret));
  assert.ok(text.includes('updatedByHash='+context.updatedByHash));assert.ok(text.includes('google:T1.travelAreaKey'));
  const failed=await mig.run({manifest,catalog:CATALOG,read:async()=>{throw Error(secrets.join(' '));},write:async()=>{throw Error('unexpected');}});
  const exceptionText=mig.diagnosticLines(failed).join('\n');for(const secret of secrets)assert.ok(!exceptionText.includes(secret));
  assert.equal(before.updatedBy,secrets[11],'logging must not rewrite Trip data');
});

test('diagnostic callbacks receive only approved output on success and structural ABORT',async()=>{
  const before=fixtureTrip(), manifest=await buildManifest(before,ROWS);
  for(const corrupt of [false,true]){
    const server=fakeServer(before), logs=[], messages=[];
    if(corrupt)server.onRead=(count,stored)=>{if(count===4)stored.members['private-member-id']='private-nickname';};
    const result=await runGate(server,manifest,{log:lines=>logs.push(lines),notify:message=>messages.push(message)});
    assert.equal(result.outcome,corrupt?mig.ABORT:mig.MIGRATED);
    const text=JSON.stringify({logs,messages});
    for(const raw of ['private-member-id','private-nickname','place-T1','addr-T1','raw-tag','Alice','Owner'])
      assert.ok(!text.includes(raw));
    assert.equal(logs.length,1);assert.ok(Array.isArray(logs[0]));assert.equal(messages.length,1);
  }
});

for(const recovery of [false,true]){
  test((recovery?'recovery':'migration')+' marker write failure aborts visibly without releasing schedulers',async()=>{
    const before=fixtureTrip(), manifest=await buildManifest(before,ROWS);
    const current=recovery?mig.applyManifest(before,manifest).trip:before;delete current[mig.MARKER];
    const unchanged=structuredClone(current), messages=[];
    const result=await mig.run({manifest,catalog:CATALOG,read:async()=>structuredClone(current),
      write:async()=>({ok:false,reason:'WRITE_FAILED',writeMode:'cas-window'}),notify:message=>messages.push(message)});
    assert.equal(result.outcome,mig.ABORT);assert.equal(result.state,recovery?mig.POST:mig.PRE);
    assert.equal(result.writes,0);assert.equal(result.schedulersReleased,false);
    assert.deepEqual(current,unchanged);assert.equal(current[mig.MARKER],undefined);
    assert.match(messages[0],recovery?/Marker recovery aborted/:/Migration aborted/);
  });
}

test('POST recovery with an unpersisted marker aborts after readback and admits its write',async()=>{
  const before=fixtureTrip(), manifest=await buildManifest(before,ROWS), current=mig.applyManifest(before,manifest).trip;
  delete current[mig.MARKER];
  const result=await mig.run({manifest,catalog:CATALOG,read:async()=>structuredClone(current),
    write:async()=>({ok:true,writeMode:'atomic'})});
  assert.equal(result.outcome,mig.ABORT);assert.equal(result.state,mig.POST);
  assert.equal(result.reason,'COMPLETION_MARKER_NOT_PERSISTED');assert.equal(result.writes,1);
  assert.equal(result.schedulersReleased,false);assert.match(mig.terminalMessage(result),/Marker recovery aborted/);
});

for(const scripting of [true,false]){
  test('actual conditional compare rejects a late member write ('+(scripting?'atomic':'cas-window')+')',async()=>{
    const api=await endpoint({trip:endpointTrip(),scripting,instance:'late-conflict-'+scripting,
      beforeCompare:(store,key)=>{const fresh=JSON.parse(store.get(key));fresh.revision++;fresh.votes.late=['K1'];store.set(key,JSON.stringify(fresh));}});
    try{
      const response=await api.request('PUT',{...endpointTrip(),expectedRevision:261,[mig.MARKER]:mig.VERSION});
      assert.equal(response.status,409);assert.equal(response.body.writeMode,scripting?'atomic':'cas-window');
      assert.equal(api.stored()[mig.MARKER],undefined);assert.deepEqual(api.stored().votes.late,['K1']);
      assert.equal(api.calls.filter(op=>op==='SET').length,0);
    }finally{api.restore();}
  });
}
