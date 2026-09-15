/* The gate that decides when the Place-writing schedulers may run.
 *
 * Runs the real app.js source for the gate against stubs, so the ordering contract is checked
 * against shipped code rather than a restatement of it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import mig from '../lib/canonical-travel-migration.js';

import {source, section, gateContext, tick as settle} from './helpers/canonical-gate.mjs';

test('a successful migration releases both schedulers exactly once', async () => {
  const { context, calls } = gateContext({ outcome: mig.MIGRATED, trip: { id: mig.TRIP, places: [] } });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 1);
  assert.equal(calls.containment, 1);
  assert.equal(calls.backfill, 1);
  // Fresh server state is taken up and redrawn after a migration.
  assert.equal(calls.applied, 1);
  assert.equal(calls.renders, 1);
});

test('a marker no-op releases both schedulers without re-applying trip state', async () => {
  const { context, calls } = gateContext({ outcome: mig.MARKER_NOOP, trip: { id: mig.TRIP, places: [] } });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.containment, 1);
  assert.equal(calls.backfill, 1);
  assert.equal(calls.applied, 0, 'nothing changed, so nothing needs re-applying');
});

test('a marker-only recovery releases both schedulers', async () => {
  const { context, calls } = gateContext({ outcome: mig.RECOVERED, trip: { id: mig.TRIP, places: [] } });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.containment, 1);
  assert.equal(calls.backfill, 1);
});

test('an abort leaves both schedulers parked for the rest of the session', async () => {
  const { context, calls } = gateContext({ outcome: mig.ABORT });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 1);
  assert.equal(calls.containment, 0, 'containment must not write after an abort');
  assert.equal(calls.backfill, 0, 'tag backfill must not write after an abort');
  // Re-entering the same trip must not quietly release them either.
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 1, 'the gate is one-shot per trip');
  assert.equal(calls.containment, 0);
  assert.equal(calls.backfill, 0);
});

test('the gate runs once per trip and re-releases on later hydrations', async () => {
  const { context, calls } = gateContext({ outcome: mig.MIGRATED, trip: { id: mig.TRIP, places: [] } });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 1);
  const containmentAfterFirst = calls.containment;
  // A later hydration of the same trip must not re-run the migration, but the schedulers
  // are already released so their own one-shot guards decide from here.
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 1, 'the migration must not run twice for one trip');
  assert.ok(calls.containment > containmentAfterFirst, 'released schedulers stay reachable');
});

test('a local apply failure after a successful migration shows one human-readable toast, no engineering copy', async () => {
  const { context, calls } = gateContext({ outcome: mig.MIGRATED, trip: { id: mig.TRIP, places: [] } });
  context.applySharedTrip = () => { throw new Error('boom'); };
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.toasts.length, 1);
  assert.equal(calls.toasts[0], '地點資料更新未完成，請重新整理後再試。');
  for (const jargon of ['migrat', 'backfill', 'marker', 'PRE_VERIFIED', 'POST_VERIFIED', 'fingerprint', 'gate'])
    assert.ok(!calls.toasts[0].toLowerCase().includes(jargon.toLowerCase()));
  assert.equal(calls.warnings.length, 1);
  assert.equal(calls.containment, 0, 'schedulers must stay parked after a local apply failure');
  assert.equal(calls.backfill, 0);
});

test('another trip is released immediately without running the migration', async () => {
  const { context, calls } = gateContext({ tripId: 'some-other-trip' });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 0, 'this migration belongs to one trip only');
  assert.equal(calls.containment, 1);
  assert.equal(calls.backfill, 1);
});

test('a read-only session never runs the migration', async () => {
  const { context, calls } = gateContext({ editor: false });
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 0, 'a guest must not trigger a data migration');
});

test('a missing helper module leaves the app working and the schedulers suspended', async () => {
  const { context, calls } = gateContext({});
  context.CanonicalTravelMigration = undefined;
  context.scheduleCanonicalAreaMigration();
  await settle();
  assert.equal(calls.runs, 0);
  assert.equal(calls.containment, 0);
  assert.equal(calls.backfill, 0);
  assert.equal(calls.toasts.length, 0, 'a missing helper is a silent, console-only terminal');
});

test('hydration calls the gate, not the schedulers directly', () => {
  // The gate is the only path to the Place-writing schedulers.
  assert.match(section('function applySharedTrip', 'const canonicalAreaSessions'), /scheduleCanonicalAreaMigration\(\);/);
  const hydration = section('function applySharedTrip', '/* The Place-writing schedulers');
  assert.doesNotMatch(hydration, /scheduleContainmentMigration\(\)|scheduleTagBackfillMigration\(\)/);
  // And they are still wired, from inside the release step.
  assert.match(section('function releaseCanonicalAreaSchedulers', 'function scheduleCanonicalAreaMigration'),
    /scheduleContainmentMigration\(\);\r?\n\s*scheduleTagBackfillMigration\(\);/);
});
