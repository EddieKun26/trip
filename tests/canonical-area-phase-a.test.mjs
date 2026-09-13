import test from 'node:test';
import assert from 'node:assert/strict';
import mig from '../lib/canonical-travel-migration.js';
import manifest from '../lib/canonical-travel-manifest.js';

/* The two Places that already carried an automatic snapshot at the approved baseline.
 * Values are canonical area metadata, not personal data; the expected hashes come from
 * the manifest recorded in this repo, so this asserts the canonicalization rule still
 * reproduces the baseline it will be compared against at runtime. */
const SNAPSHOT_FIXTURES = [
  {
    stableId: 'app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd',
    autoTravelArea: {
      travelAreaKey: 'fujisawa', travelAreaZh: '藤澤', travelAreaLocal: '藤沢',
      travelAreaResolved: true, travelAreaManuallySet: false, travelAreaSource: 'automatic',
      travelAreaResolver: 'JP_TRAVEL_AREA', travelAreaResolutionVersion: 5,
      travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
    },
  },
  {
    stableId: 'app:custom-place-91223779-84cb-4b13-9713-53991d03ee81',
    autoTravelArea: {
      travelAreaKey: 'shinjuku', travelAreaZh: '新宿', travelAreaLocal: '新宿',
      travelAreaResolved: true, travelAreaManuallySet: false, travelAreaSource: 'automatic',
      travelAreaResolver: 'JP_TRAVEL_AREA', travelAreaResolutionVersion: 5,
      travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
    },
  },
];

const AUTO_SNAPSHOT_FIELDS = ['travelAreaKey', 'travelAreaLocal', 'travelAreaManuallySet',
  'travelAreaResolutionError', 'travelAreaResolutionStatus', 'travelAreaResolutionVersion',
  'travelAreaResolved', 'travelAreaResolver', 'travelAreaSource', 'travelAreaZh'];

test('canonicalization reproduces the recorded baseline hash for every existing auto snapshot', async () => {
  for (const fixture of SNAPSHOT_FIXTURES) {
    const expected = manifest.baselineFields[`${fixture.stableId}.autoTravelArea`];
    assert.ok(expected, `baseline is missing ${fixture.stableId}.autoTravelArea`);
    const actual = await mig.fieldHash(fixture, 'autoTravelArea');
    // A mismatch means the canonicalization rule and the recorded baseline disagree.
    // Stop and investigate; never retune the rule to chase a stored hash.
    assert.equal(actual, expected, `canonicalization drifted for ${fixture.stableId}`);
  }
});

test('auto snapshot shape is deterministic: exactly ten fields, no clock or randomness', async () => {
  for (const fixture of SNAPSHOT_FIXTURES) {
    assert.deepEqual(Object.keys(fixture.autoTravelArea).sort(), AUTO_SNAPSHOT_FIELDS);
    for (const key of Object.keys(fixture.autoTravelArea)) {
      assert.doesNotMatch(key, /At$|time|stamp|date|random|nonce/i, `${key} looks non-deterministic`);
    }
    // Re-canonicalizing the same value must be byte-identical across calls.
    assert.equal(await mig.fieldHash(fixture, 'autoTravelArea'), await mig.fieldHash(fixture, 'autoTravelArea'));
    // Key insertion order must not change the hash.
    const reversed = Object.fromEntries(Object.entries(fixture.autoTravelArea).reverse());
    assert.equal(await mig.fieldHash({ autoTravelArea: reversed }, 'autoTravelArea'),
      await mig.fieldHash(fixture, 'autoTravelArea'));
  }
});

test('absence, undefined and falsy values all canonicalize to distinct stable hashes', async () => {
  const cases = {
    absent: {},
    undefined: { travelAreaManuallySet: undefined },
    false: { travelAreaManuallySet: false },
    true: { travelAreaManuallySet: true },
    null: { travelAreaManuallySet: null },
    emptyString: { travelAreaManuallySet: '' },
    zero: { travelAreaManuallySet: 0 },
    emptyObject: { travelAreaManuallySet: {} },
    emptyArray: { travelAreaManuallySet: [] },
  };
  const hashes = new Map();
  for (const [label, source] of Object.entries(cases)) {
    const value = await mig.fieldHash(source, 'travelAreaManuallySet');
    for (const [other, seen] of hashes) assert.notEqual(value, seen, `${label} collides with ${other}`);
    hashes.set(label, value);
    assert.equal(await mig.fieldHash(source, 'travelAreaManuallySet'), value, `${label} is unstable`);
  }
  assert.equal(mig.canonicalField({}, 'travelAreaManuallySet'), mig.ABSENT);
  assert.equal(mig.canonicalField({ travelAreaManuallySet: undefined }, 'travelAreaManuallySet'), mig.UNDEFINED);
});

test('an absent field and a field explicitly set to the absent sentinel string stay distinct', async () => {
  // Guards against a caller smuggling the sentinel in as real data.
  const absent = await mig.fieldHash({}, 'areaTags');
  const spoofed = await mig.fieldHash({ areaTags: mig.ABSENT }, 'areaTags');
  assert.notEqual(absent, spoofed);
});

test('fingerprint field coverage matches the approved contract and excludes member activity', () => {
  for (const field of ['travelAreaKey', 'travelAreaZh', 'travelAreaLocal', 'travelAreaManuallySet',
    'travelAreaSource', 'travelAreaResolver', 'travelAreaResolutionStatus', 'travelAreaResolved',
    'travelAreaResolutionVersion', 'autoTravelArea', 'travelAreaCandidateKeys', 'areaTags',
    'planningRegion', 'planningRegionOriginal', 'planningRegionResolved', 'planningRegionResolver',
    'planningRegionResolutionVersion', 'area', 'areaOriginal', 'areaResolvedByGoogle',
    'areaManuallySet', 'areaResolutionVersion', 'placeId']) {
    assert.ok(mig.STATE_FIELDS.includes(field), `${field} must be covered`);
  }
  assert.deepEqual(mig.TARGET_GEO_FIELDS, ['latitude', 'longitude', 'formattedAddress', 'addressComponentsOriginal']);
  for (const field of [...mig.EXCLUDED_TRIP_FIELDS, ...mig.EXCLUDED_PLACE_FIELDS]) {
    assert.ok(!mig.STATE_FIELDS.includes(field), `${field} must stay outside the fingerprint`);
  }
  assert.equal(mig.STATE_FIELDS.length, new Set(mig.STATE_FIELDS).size, 'duplicate covered field');
});

test('diagnostics report field identity and hash prefixes only, never values', () => {
  const expected = { 'google:ChIJtest.travelAreaKey': 'a'.repeat(64) };
  const actual = { 'google:ChIJtest.travelAreaKey': 'b'.repeat(64) };
  const rows = mig.diffFieldHashes(expected, actual);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { key: 'google:ChIJtest.travelAreaKey', expected: 'aaaaaaaa', actual: 'bbbbbbbb' });
  const text = mig.formatDiff(rows).join('\n');
  assert.equal(text, 'google:ChIJtest.travelAreaKey expected aaaaaaaa actual bbbbbbbb');
  assert.ok(!text.includes('a'.repeat(9)), 'full hash must not be emitted');
});

test('a missing field on one side is reported without throwing', () => {
  const rows = mig.diffFieldHashes({ 'app:x.areaTags': 'c'.repeat(64) }, {});
  assert.deepEqual(rows, [{ key: 'app:x.areaTags', expected: 'cccccccc', actual: 'missing' }]);
});

// ---------------------------------------------------------------------------
// Approved PRE / POST
// ---------------------------------------------------------------------------

const R01 = 'google:ChIJUxeDv0OLGGAR8sIBBOBmuDs';
const R04 = 'google:ChIJuW1uWLmMGGAR9vxc5gsmk5A';

test('manifest carries the approved fixed set and no superseded whole-trip hash', () => {
  assert.equal(manifest.rows.length, mig.ROW_COUNT);
  assert.equal(manifest.placeCount, mig.PLACE_COUNT);
  assert.equal(manifest.placeStableIds.length, mig.PLACE_COUNT);
  assert.equal(new Set(manifest.placeStableIds).size, mig.PLACE_COUNT);
  assert.equal(new Set(manifest.rows.map(r => r.stableId)).size, mig.ROW_COUNT);
  for (const row of manifest.rows) {
    assert.ok(manifest.placeStableIds.includes(row.stableId), `${row.stableId} is not in the baseline set`);
  }
  // Whole-trip hashes covered votes and itinerary, so ordinary activity invalidated them.
  assert.equal(manifest.baselineHash, undefined);
  assert.equal(manifest.afterContentHash, undefined);
});

test('derived PRE and POST reproduce the locked fingerprints exactly', async () => {
  assert.equal(manifest.preFingerprint, '1310fa0cb5086a07cbb7836022272f9113addfb1405f0f279bcdb1959616825f');
  assert.equal(manifest.postFingerprint, 'dd2d0b930e7ed42da9a2c7389f44abe1c0de018b0af6c15ac2c35a949eeb6893');
  const pre = await mig.approvedPreFieldHashes(manifest);
  const post = await mig.approvedPostFieldHashes(manifest);
  // If these drift, the baseline and the canonicalization rule disagree. Stop; do not retune.
  assert.equal(await mig.stateFingerprint(pre), manifest.preFingerprint);
  assert.equal(await mig.stateFingerprint(post), manifest.postFingerprint);
  assert.notEqual(manifest.preFingerprint, manifest.postFingerprint);
  // 39 covered places, plus location evidence for the 12 approved targets.
  const expected = mig.PLACE_COUNT * mig.STATE_FIELDS.length + mig.ROW_COUNT * mig.TARGET_GEO_FIELDS.length;
  assert.equal(Object.keys(pre).length, expected);
  assert.equal(Object.keys(post).length, expected);
});

test('every approved target has recorded location evidence', async () => {
  const report = await mig.targetGeoIdentityReport(manifest);
  assert.deepEqual(report.incomplete, []);
  assert.equal(report.complete, mig.ROW_COUNT);
  assert.ok(report.ok);
});

test('PRE to POST changes are confined to the approved targets and their migration fields', async () => {
  const pre = await mig.approvedPreFieldHashes(manifest);
  const post = await mig.approvedPostFieldHashes(manifest);
  const targets = new Set(manifest.rows.map(r => r.stableId));
  const changed = mig.diffFieldHashes(pre, post);
  assert.ok(changed.length > 0);
  for (const { key } of changed) {
    const id = key.slice(0, key.lastIndexOf('.'));
    const field = key.slice(key.lastIndexOf('.') + 1);
    assert.ok(targets.has(id), `${id} is not an approved target`);
    assert.ok(mig.MIGRATION_FIELDS.includes(field), `${field} is not a migration field`);
  }
  assert.equal(new Set(changed.map(r => r.key.slice(0, r.key.lastIndexOf('.')))).size, mig.ROW_COUNT);
  // Raw tags and legacy compatibility must be identical on both sides.
  for (const id of manifest.placeStableIds) {
    for (const field of [...mig.TAG_FIELDS, ...mig.PLANNING_REGION_FIELDS, ...mig.AREA_FIELDS, ...mig.IDENTITY_FIELDS]) {
      assert.equal(post[`${id}.${field}`], pre[`${id}.${field}`], `${id}.${field} must not change`);
    }
  }
  // Target location evidence must be identical too.
  for (const row of manifest.rows) {
    for (const field of mig.TARGET_GEO_FIELDS) {
      assert.equal(post[`${row.stableId}.${field}`], pre[`${row.stableId}.${field}`]);
    }
  }
});

test('distinct canonical keys go from 19 to 20', async () => {
  const pre = await mig.approvedPreFieldHashes(manifest);
  const post = await mig.approvedPostFieldHashes(manifest);
  const distinct = map => new Set(manifest.placeStableIds.map(id => map[`${id}.travelAreaKey`])).size;
  assert.equal(distinct(pre), 19);
  assert.equal(distinct(post), 20);
});

test('auto snapshot accounting is preserve 1, create 10, no-safe-auto 1', async () => {
  const absent = await mig.digest(mig.ABSENT);
  const pre = await mig.approvedPreFieldHashes(manifest);
  const post = await mig.approvedPostFieldHashes(manifest);
  let preserved = 0, created = 0, noSafeAuto = 0;
  for (const row of manifest.rows) {
    const before = pre[`${row.stableId}.autoTravelArea`];
    const after = post[`${row.stableId}.autoTravelArea`];
    if (after === absent) noSafeAuto++;
    else if (after === before) preserved++;
    else created++;
  }
  assert.deepEqual({ preserved, created, noSafeAuto }, { preserved: 1, created: 10, noSafeAuto: 1 });
  // R01 keeps no automatic snapshot in Phase A rather than resurrecting a legacy composite.
  assert.equal(post[`${R01}.autoTravelArea`], absent);
});

test('every row documents the full approved before and after state', () => {
  for (const row of manifest.rows) {
    assert.ok(row.stableId && row.after && row.beforeHashes);
    assert.ok(['preserve','create','no-safe-auto'].includes(row.autoTravelAreaAction));
    assert.ok(['absent','existing'].includes(row.autoTravelAreaBeforeState));
    assert.deepEqual(Object.keys(row).sort(), ['after','autoTravelAreaAction','autoTravelAreaBeforeState','beforeHashes','placeId','stableId']);
    for (const hash of Object.values(row.beforeHashes)) assert.match(hash, /^[a-f0-9]{64}$/);
  }
});

test('recorded before-state reproduces the baseline hashes for every covered field', async () => {
  const pre = await mig.approvedPreFieldHashes(manifest);
  for (const row of manifest.rows) for (const field of [...mig.STATE_FIELDS,...mig.TARGET_GEO_FIELDS]) {
    assert.equal(row.beforeHashes[field], pre[row.stableId + '.' + field]);
  }
});

test('raw tags and legacy compatibility are declared unchanged on every row', async () => {
  const pre=await mig.approvedPreFieldHashes(manifest), post=await mig.approvedPostFieldHashes(manifest);
  for (const row of manifest.rows) for (const field of [...mig.TAG_FIELDS,...mig.AREA_FIELDS,...mig.PLANNING_REGION_FIELDS]) {
    assert.equal(post[row.stableId+'.'+field],pre[row.stableId+'.'+field]);
    assert.equal(Object.hasOwn(row.after,field),false);
  }
});

test('each row writes only migration fields and nothing else', () => {
  for (const row of manifest.rows) for (const field of Object.keys(row.after)) assert.ok(mig.MIGRATION_FIELDS.includes(field));
});

test('R01 and R04 land on manual singular identities, never a legacy composite', () => {
  const row = id => manifest.rows.find(r => r.stableId === id);
  for (const [id, key] of [[R01, 'ebisu'], [R04, 'harajuku']]) {
    const after = row(id).after;
    assert.equal(after.travelAreaKey, key);
    assert.equal(after.travelAreaManuallySet, true);
    assert.equal(after.travelAreaSource, 'manual');
    assert.equal(after.travelAreaResolver, 'MANUAL');
    assert.equal(after.travelAreaResolutionStatus, 'resolved');
    assert.equal(after.travelAreaResolved, true);
    assert.equal(after.travelAreaResolutionVersion, 5);
    assert.equal(after.travelAreaResolutionError, '');
  }
  for (const r of manifest.rows) {
    assert.ok(!['ebisu-daikanyama', 'harajuku-omotesando'].includes(r.after.travelAreaKey));
    assert.ok(!String(r.after.travelAreaKey).startsWith('jp:'));
    assert.ok(r.after.travelAreaKey, 'canonical key must be non-empty');
    assert.equal(r.after.travelAreaCandidateKeys, undefined, 'Phase A must not persist candidate state');
  }
});
