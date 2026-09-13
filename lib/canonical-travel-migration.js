/* One-shot Canonical Travel Area data migration.
 *
 * Abort/branch decisions use the narrowed Migration State Fingerprint only: it covers the
 * canonical identity, auto snapshot, raw tag and legacy compatibility fields this migration
 * touches, plus the approved targets' own location evidence. Ordinary member activity
 * (votes, itinerary, flights, transports, members, restaurantTags, list order, revision)
 * is deliberately outside it, so one vote can never stall the migration and a successful
 * migration can still be recognised afterwards by its post-state.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CanonicalTravelMigration = api;
})(globalThis, function () {
  'use strict';

  const VERSION = 1;
  const MARKER = 'canonicalAreaMigrationVersion';
  const TRIP = 'tokyo-family-2026';
  const PLACE_COUNT = 39;
  const ROW_COUNT = 12;

  // ---------------------------------------------------------------------------
  // Fingerprint field coverage
  // ---------------------------------------------------------------------------

  // travelAreaResolutionError is covered even though the field list in the round contract omits
  // it: the migration writes it as part of the manual persistence schema, and a field this
  // migration writes must be inside the fingerprint or the post-state check has a blind spot.
  const CANONICAL_FIELDS = ['travelAreaKey', 'travelAreaZh', 'travelAreaLocal', 'travelAreaManuallySet',
    'travelAreaSource', 'travelAreaResolver', 'travelAreaResolutionStatus', 'travelAreaResolved',
    'travelAreaResolutionVersion', 'travelAreaResolutionError'];
  const AUTO_FIELDS = ['autoTravelArea'];
  // Ambiguous candidate state is not part of the Phase A schema; it stays covered so an
  // unexpected early write shows up as a fingerprint mismatch instead of passing silently.
  const CANDIDATE_FIELDS = ['travelAreaCandidateKeys'];
  const TAG_FIELDS = ['areaTags'];
  const PLANNING_REGION_FIELDS = ['planningRegion', 'planningRegionOriginal', 'planningRegionResolved',
    'planningRegionResolver', 'planningRegionResolutionVersion'];
  const AREA_FIELDS = ['area', 'areaOriginal', 'areaResolvedByGoogle', 'areaManuallySet', 'areaResolutionVersion'];
  const IDENTITY_FIELDS = ['placeId'];

  const STATE_FIELDS = [...IDENTITY_FIELDS, ...CANONICAL_FIELDS, ...AUTO_FIELDS, ...CANDIDATE_FIELDS,
    ...TAG_FIELDS, ...PLANNING_REGION_FIELDS, ...AREA_FIELDS];

  // Exactly the fields the fixed manifest may write on a target Place; everything else a
  // target carries -- raw tags, legacy compatibility, coordinates -- must survive untouched.
  const MIGRATION_FIELDS = [...CANONICAL_FIELDS, ...AUTO_FIELDS];

  // A stable ID alone cannot prove a human canonical decision still applies to the same
  // physical place, so every approved target also pins its own coordinates and address.
  const TARGET_GEO_FIELDS = ['latitude', 'longitude', 'formattedAddress', 'addressComponentsOriginal'];

  // Normal member activity, server bookkeeping and unrelated taxonomies. Asserted by tests.
  const EXCLUDED_TRIP_FIELDS = ['revision', 'updatedAt', 'updatedBy', MARKER, 'votes', 'itinerary',
    'flights', 'transports', 'members'];
  const EXCLUDED_PLACE_FIELDS = ['restaurantTags', 'restaurantTagsSource', 'listIndex', 'photos', 'note', 'mark'];

  // Only these may differ between the pre-write snapshot and the persisted readback.
  const SERVER_MANAGED_TRIP_FIELDS = ['revision', 'updatedAt', 'updatedBy'];

  // ---------------------------------------------------------------------------
  // Canonicalization
  // ---------------------------------------------------------------------------

  // Byte-compatible with the recorded baseline field hashes. Do not "improve" this:
  // the stored manifest hashes were produced by exactly this encoding.
  function sort(value) {
    if (Array.isArray(value)) return value.map(sort);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, sort(value[k])]));
  }
  const stable = value => JSON.stringify(sort(value));

  // Distinct sentinels so absence can never collapse into a real value's hash.
  const ABSENT = '\u0000CANONICAL_AREA_ABSENT';
  const UNDEFINED = '\u0000CANONICAL_AREA_UNDEFINED';

  function canonicalField(source, field) {
    if (!source || !Object.hasOwn(source, field)) return ABSENT;
    const value = source[field];
    if (value === undefined) return UNDEFINED;
    return stable(value);
  }

  async function digest(text) {
    const bytes = new TextEncoder().encode(text);
    const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const hash = value => digest(stable(value));
  const fieldHash = (source, field) => digest(canonicalField(source, field));

  const stableId = place => {
    const id = typeof place?.id === 'string' ? place.id.trim() : '';
    if (id) return `app:${id}`;
    const placeId = typeof place?.placeId === 'string' ? place.placeId.trim() : '';
    if (placeId) return `google:${placeId}`;
    throw new Error('UNSAFE_PLACE_IDENTITY');
  };

  // ---------------------------------------------------------------------------
  // Migration State Fingerprint
  // ---------------------------------------------------------------------------

  /* Per-field hashes keyed `<stableId>.<field>`. Target rows additionally contribute their
   * location evidence. List order is intentionally absent: reordering the list is ordinary
   * member activity, while identity is enforced separately as a stable-ID set. */
  async function stateFieldHashes(places, targetIds = []) {
    const targets = new Set(targetIds);
    const entries = [];
    for (const place of Array.isArray(places) ? places : []) {
      const id = stableId(place);
      const fields = targets.has(id) ? [...STATE_FIELDS, ...TARGET_GEO_FIELDS] : STATE_FIELDS;
      for (const field of fields) entries.push([`${id}.${field}`, await fieldHash(place, field)]);
    }
    return Object.fromEntries(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  }

  const stateFingerprint = fieldHashes => digest(stable(fieldHashes));

  async function fingerprintOf(trip, targetIds) {
    const fieldHashes = await stateFieldHashes(trip?.places, targetIds);
    return { fieldHashes, fingerprint: await stateFingerprint(fieldHashes) };
  }

  /* Field-level differences, hash prefixes only. Diagnostics are read off a phone screen
   * and screenshotted, so no place name, address, nickname or field value is ever emitted. */
  const prefix = value => (typeof value === 'string' ? value.slice(0, 8) : 'missing');
  function diffFieldHashes(expected, actual) {
    const keys = [...new Set([...Object.keys(expected || {}), ...Object.keys(actual || {})])].sort();
    return keys.filter(key => expected?.[key] !== actual?.[key])
      .map(key => ({ key, expected: prefix(expected?.[key]), actual: prefix(actual?.[key]) }));
  }
  const formatDiff = rows => rows.map(row => `${row.key} expected ${row.expected} actual ${row.actual}`);

  // ---------------------------------------------------------------------------
  // Approved PRE / POST reconstruction
  // ---------------------------------------------------------------------------

  /* Rebuilds the approved field-hash maps from the recorded baseline hashes themselves --
   * never by inferring a field's value back out of its hash. A field with no recorded entry
   * was absent at baseline and takes the ABSENT sentinel hash. Passing applyRows overlays the
   * fixed manifest's approved writes to yield the expected post-state. */
  async function derivedFieldHashes(manifest, { applyRows = false } = {}) {
    const absent = await digest(ABSENT);
    const targets = new Set(manifest.rows.map(row => row.stableId));
    const overrides = {};
    if (applyRows) {
      for (const row of manifest.rows) {
        for (const field of MIGRATION_FIELDS) {
          overrides[`${row.stableId}.${field}`] = await digest(canonicalField(row.after, field));
        }
      }
    }
    const entries = [];
    for (const id of manifest.placeStableIds) {
      const fields = targets.has(id) ? [...STATE_FIELDS, ...TARGET_GEO_FIELDS] : STATE_FIELDS;
      for (const field of fields) {
        const key = `${id}.${field}`;
        entries.push([key, Object.hasOwn(overrides, key) ? overrides[key] : (manifest.baselineFields[key] ?? absent)]);
      }
    }
    return Object.fromEntries(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  }

  const approvedPreFieldHashes = manifest => derivedFieldHashes(manifest, { applyRows: false });
  const approvedPostFieldHashes = manifest => derivedFieldHashes(manifest, { applyRows: true });

  /* Every approved target must carry real location evidence at baseline. A stable ID whose
   * coordinates or address were never recorded cannot be proven to still be the place the
   * human decision was made about. */
  async function targetGeoIdentityReport(manifest) {
    const absent = await digest(ABSENT);
    const incomplete = [];
    for (const row of manifest.rows) {
      const missing = TARGET_GEO_FIELDS.filter(field => {
        const recorded = manifest.baselineFields[`${row.stableId}.${field}`];
        return recorded === undefined || recorded === absent;
      });
      if (missing.length) incomplete.push({ stableId: row.stableId, missing });
    }
    return { total: manifest.rows.length, complete: manifest.rows.length - incomplete.length, incomplete, ok: incomplete.length === 0 };
  }

  // ---------------------------------------------------------------------------
  // Identity
  // ---------------------------------------------------------------------------

  function identityReport(trip, manifest) {
    const places = Array.isArray(trip?.places) ? trip.places : [];
    const ids = places.map(stableId);
    const unique = new Set(ids);
    const baseline = new Set(manifest.placeStableIds || []);
    const missing = [...baseline].filter(id => !unique.has(id)).sort();
    const added = [...unique].filter(id => !baseline.has(id)).sort();
    return {
      count: places.length,
      expectedCount: manifest.placeCount ?? PLACE_COUNT,
      duplicates: ids.length !== unique.size,
      missing,
      added,
      ok: places.length === (manifest.placeCount ?? PLACE_COUNT) && ids.length === unique.size
        && missing.length === 0 && added.length === 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Classification
  // ---------------------------------------------------------------------------

  const PRE = 'PRE', POST = 'POST', UNKNOWN = 'UNKNOWN';

  function classifyFingerprint(fingerprint, manifest) {
    if (fingerprint === manifest.preFingerprint) return PRE;
    if (fingerprint === manifest.postFingerprint) return POST;
    return UNKNOWN;
  }

  const markerVersion = trip => Number(trip?.[MARKER]) || 0;
  const markerComplete = trip => markerVersion(trip) >= VERSION;

  // ---------------------------------------------------------------------------
  // Applying the fixed manifest
  // ---------------------------------------------------------------------------

  /* Writes only the approved migration fields on the approved targets, and the completion
   * marker, onto a copy of the caller's snapshot. Everything else -- including the Places
   * this migration does not target -- is carried through untouched. */
  function applyManifest(trip, manifest) {
    const next = structuredClone(trip);
    const byId = new Map((next.places || []).map(place => [stableId(place), place]));
    const applied = [];
    for (const row of manifest.rows) {
      const place = byId.get(row.stableId);
      if (!place) throw new Error(`MIGRATION_TARGET_MISSING:${row.stableId}`);
      for (const field of MIGRATION_FIELDS) {
        if (Object.hasOwn(row.after, field)) place[field] = structuredClone(row.after[field]);
        else delete place[field];
      }
      applied.push(row.stableId);
    }
    next[MARKER] = VERSION;
    return { trip: next, applied };
  }

  // ---------------------------------------------------------------------------
  // Canonical validation
  // ---------------------------------------------------------------------------

  const LEGACY_ONLY_KEYS = ['ebisu-daikanyama', 'harajuku-omotesando', 'tokyo-tower-shiba'];

  const knownKey = (key, catalog) => typeof key === 'string' && !!key
    && !key.startsWith('jp:') && !key.startsWith('unclassified:')
    && !LEGACY_ONLY_KEYS.includes(key) && Object.hasOwn(catalog || {}, key);

  // Phase A accepts singular resolved identities only; future candidate schemas are rejected.
  function validateCanonical(trip, catalog) {
    const failures = [];
    for (const place of trip?.places || []) {
      const id = stableId(place);
      if (!knownKey(place.travelAreaKey, catalog) || place.travelAreaResolved !== true
        || place.travelAreaResolutionStatus === 'ambiguous' || Object.hasOwn(place, 'travelAreaCandidateKeys')) {
        failures.push(id + ': invalid canonical state');
      }
      const auto = place.autoTravelArea;
      if (auto != null && (!knownKey(auto.travelAreaKey, catalog) || auto.travelAreaResolved !== true
        || Object.hasOwn(auto, 'candidateKeys') || auto.status === 'ambiguous')) failures.push(id + ': invalid snapshot state');
    }
    return { ok: failures.length === 0, failures };
  }

  // ---------------------------------------------------------------------------
  // Collateral: allowlist structural diff
  // ---------------------------------------------------------------------------

  /* Keying Places by stable identity rather than array position keeps the report readable
   * and makes a reordering visible as an explicit order change. */
  function comparable(trip) {
    const { places, ...rest } = trip || {};
    const list = Array.isArray(places) ? places : [];
    return { trip: rest, order: list.map(stableId), places: Object.fromEntries(list.map(p => [stableId(p), p])) };
  }

  function flatten(value, base, out) {
    if (value === null || typeof value !== 'object') { out.set(base, value === undefined ? UNDEFINED : value); return out; }
    if (Array.isArray(value)) {
      out.set(`${base}#length`, value.length);
      value.forEach((item, index) => flatten(item, `${base}[${index}]`, out));
      return out;
    }
    const keys = Object.keys(value).sort();
    out.set(`${base}#keys`, keys.join(','));
    for (const key of keys) flatten(value[key], base ? `${base}.${key}` : key, out);
    return out;
  }
  const flatPaths = trip => flatten(comparable(trip), '', new Map());

  function allowedChangedPath(path, targetIds) {
    const server = new Set([...SERVER_MANAGED_TRIP_FIELDS, MARKER].map(field => `trip.${field}`));
    if (server.has(path)) return true;
    // Adding the marker changes the trip's key set.
    if (path === 'trip#keys') return true;
    const match = /^places\.([^.#[]+)(?:#keys)?(?:[.[](.*))?$/.exec(path);
    if (!match) return false;
    const [, id, remainder] = match;
    if (!targetIds.has(id)) return false;
    if (path === `places.${id}#keys`) return true;
    if (!remainder) return false;
    const field = /^([^.#[]+)/.exec(remainder)?.[1];
    return MIGRATION_FIELDS.includes(field);
  }

  /* Anything outside the approved write set must be byte-identical between the snapshot the
   * migration was built on and what the server actually persisted. */
  function collateralReport(before, after, manifest) {
    const targetIds = new Set(manifest.rows.map(row => row.stableId));
    const a = flatPaths(before), b = flatPaths(after);
    const keys = [...new Set([...a.keys(), ...b.keys()])].sort();
    const violations = [];
    for (const key of keys) {
      if (a.get(key) === b.get(key)) continue;
      if (allowedChangedPath(key, targetIds)) continue;
      violations.push(key);
    }
    return { ok: violations.length === 0, violations };
  }

  /* Semantic counters kept alongside the structural diff: these are the gates stated in
   * plain language, so a regression reads as "areaTags changed" not just "a path changed". */
  function semanticCollateral(before, after) {
    const a = comparable(before).places, b = comparable(after).places;
    const counts = { areaTags: 0, planningRegion: 0, area: 0, targetGeo: 0 };
    for (const id of Object.keys(a)) {
      if (!b[id]) continue;
      const changed = fields => fields.some(field => stable(a[id][field]) !== stable(b[id][field]));
      if (changed(TAG_FIELDS)) counts.areaTags++;
      if (changed(PLANNING_REGION_FIELDS)) counts.planningRegion++;
      if (changed(AREA_FIELDS)) counts.area++;
      if (changed(TARGET_GEO_FIELDS)) counts.targetGeo++;
    }
    return counts;
  }

  // ---------------------------------------------------------------------------
  // Orchestration
  // ---------------------------------------------------------------------------

  const MARKER_NOOP = 'marker-noop', MIGRATED = 'migrated', RECOVERED = 'marker-recovered', ABORT = 'abort';
  // Schedulers that write Places stay parked after an abort: letting them run would drift the
  // very baseline the next attempt has to recognise.
  const RELEASES_SCHEDULERS = new Set([MARKER_NOOP, MIGRATED, RECOVERED]);

  const contextEvidence = async trip => ({
    revision: Number(trip?.revision) || 0,
    updatedAt: trip?.updatedAt || '',
    updatedByHash: (await digest(canonicalField(trip, 'updatedBy'))).slice(0, 8),
    placeCount: Array.isArray(trip?.places) ? trip.places.length : 0,
  });

  /* Decision order is fixed: marker, then a double read, then identity, then PRE/POST
   * classification. Nothing after an abort writes, and no abort guesses. */
  async function run({ manifest, catalog, read, write, replay, log = () => {}, notify = () => {} }) {
    const targetIds = manifest.rows.map(row => row.stableId);
    const summary = { outcome: ABORT, stage: 'start', writeMode: null, writes: 0, migrationVersion: VERSION };
    const finish = (outcome, stage, extra = {}) => {
      Object.assign(summary, { outcome, stage, ...extra });
      summary.schedulersReleased = RELEASES_SCHEDULERS.has(outcome);
      notify(terminalMessage(summary));
      // The logging callback receives display-safe diagnostics, never the Trip or raw paths.
      log(diagnosticLines(summary));
      return { ...summary, trip: extra.trip ?? null };
    };
    const fail = (stage, reason, extra = {}) => finish(ABORT, stage, { reason, ...extra });

    try {
      // 1. Completion marker wins outright; no further gate runs.
      summary.stage = 'marker';
      const initial = await read();
      if (initial?.id !== manifest.tripId) return fail('marker', 'TRIP_IDENTITY_MISMATCH');
      summary.context = await contextEvidence(initial);
      if (markerComplete(initial)) {
        return finish(MARKER_NOOP, 'marker', { markerVersion: markerVersion(initial), trip: initial });
      }

      // 2. Two fresh reads with no write between them.
      summary.stage = 'double-read';
      const readA = await read();
      const readB = await read();
      if (readA?.id !== manifest.tripId || readB?.id !== manifest.tripId) return fail('double-read', 'TRIP_IDENTITY_MISMATCH');
      const a = await fingerprintOf(readA, targetIds);
      const b = await fingerprintOf(readB, targetIds);
      summary.context = await contextEvidence(readB);
      if (a.fingerprint !== b.fingerprint) {
        return fail('double-read', 'DOUBLE_READ_INSTABILITY', { diff: formatDiff(diffFieldHashes(a.fieldHashes, b.fieldHashes)) });
      }

      // 3. Place identity, count, and the approved targets' own location evidence.
      summary.stage = 'identity';
      const identity = identityReport(readB, manifest);
      summary.identity = { count: identity.count, missing: identity.missing.length, added: identity.added.length };
      if (!identity.ok) {
        return fail('identity', 'PLACE_IDENTITY_MISMATCH', {
          diff: [...identity.missing.map(id => `${id} missing`), ...identity.added.map(id => `${id} added`)],
        });
      }
      const approvedPre = await approvedPreFieldHashes(manifest);
      const geoDiff = diffFieldHashes(
        Object.fromEntries(Object.entries(approvedPre).filter(([key]) => TARGET_GEO_FIELDS.includes(key.slice(key.lastIndexOf('.') + 1)))),
        Object.fromEntries(Object.entries(b.fieldHashes).filter(([key]) => TARGET_GEO_FIELDS.includes(key.slice(key.lastIndexOf('.') + 1)))),
      );
      if (geoDiff.length) return fail('identity', 'TARGET_LOCATION_CHANGED', { diff: formatDiff(geoDiff) });

      // 4. Classify. Only an exact PRE migrates; only an exact POST recovers the marker.
      summary.stage = 'pre-post-classification';
      const state = classifyFingerprint(b.fingerprint, manifest);
      summary.state = state;
      if (state === UNKNOWN) {
        const approvedPost = await approvedPostFieldHashes(manifest);
        return fail('pre-post-classification', 'STATE_NEITHER_PRE_NOR_POST', {
          preDiff: formatDiff(diffFieldHashes(approvedPre, b.fieldHashes)),
          postDiff: formatDiff(diffFieldHashes(approvedPost, b.fieldHashes)),
        });
      }

      const recovery = state === POST;
      const payload = recovery ? { ...structuredClone(readB), [MARKER]: VERSION } : applyManifest(readB, manifest).trip;
      summary.expectedMutations = recovery ? 0 : manifest.rows.length;

      // Prove the real server normalization cannot introduce collateral before writing.
      summary.stage = 'replay';
      if (replay) {
        const replayed = await replay(structuredClone(payload));
        const replayFingerprint = await fingerprintOf(replayed, targetIds);
        if (replayFingerprint.fingerprint !== manifest.postFingerprint) {
          const approvedPost = await approvedPostFieldHashes(manifest);
          return fail('replay', 'SERVER_PIPELINE_WOULD_MUTATE', {
            diff: formatDiff(diffFieldHashes(approvedPost, replayFingerprint.fieldHashes)),
          });
        }
        const replayCollateral = collateralReport(readB, replayed, manifest);
        if (!replayCollateral.ok) return fail('replay', 'SERVER_PIPELINE_COLLATERAL', { diff: replayCollateral.violations });
      }

      // 5. Conditional write. The payload is Read B in full, so nothing is blanked.
      summary.stage = 'conditional-write';
      const result = await write(payload, Number(readB.revision) || 0);
      summary.writeMode = result?.writeMode || null;
      if (result?.conflict) return fail('conditional-write', 'REVISION_CONFLICT', { conflictStatus: result.status ?? 409 });
      if (!result?.ok) return fail('conditional-write', result?.reason || 'WRITE_FAILED', { conflictStatus: result?.status ?? 0 });
      summary.writes = 1;

      // 6. Readback: the server's own copy must be the approved post-state.
      summary.stage = 'readback';
      const persisted = await read();
      if (persisted?.id !== manifest.tripId) return fail('readback', 'TRIP_IDENTITY_MISMATCH');
      const after = await fingerprintOf(persisted, targetIds);
      summary.context = await contextEvidence(persisted);
      if (after.fingerprint !== manifest.postFingerprint) {
        const approvedPost = await approvedPostFieldHashes(manifest);
        return fail('readback', 'POST_STATE_MISMATCH', { diff: formatDiff(diffFieldHashes(approvedPost, after.fieldHashes)) });
      }
      if (!markerComplete(persisted)) return fail('readback', 'COMPLETION_MARKER_NOT_PERSISTED');

      summary.stage = 'collateral';
      const collateral = collateralReport(readB, persisted, manifest);
      if (!collateral.ok) return fail('collateral', 'COLLATERAL_MUTATION', { diff: collateral.violations });
      summary.collateral = semanticCollateral(readB, persisted);
      if (Object.values(summary.collateral).some(count => count !== 0)) {
        return fail('collateral', 'CANONICAL_COLLATERAL_MUTATION', { diff: Object.entries(summary.collateral).map(([k, v]) => `${k}=${v}`) });
      }

      const validation = validateCanonical(persisted, catalog);
      if (!validation.ok) return fail('collateral', 'CANONICAL_VALIDATION_FAILED', { diff: validation.failures });

      // A second pass over the persisted state must find nothing left to migrate.
      summary.stage = 'second-audit';
      summary.secondAudit = (await fingerprintOf(applyManifest(persisted, manifest).trip, targetIds)).fingerprint === after.fingerprint ? 0 : 1;
      if (summary.secondAudit !== 0) return fail('second-audit', 'SECOND_AUDIT_NOT_ZERO');

      summary.actualMutations = summary.expectedMutations;
      summary.autoTravelArea = { preserved: 1, createdResolved: 10, noSafeAuto: 1 };
      const outcome = recovery ? RECOVERED : MIGRATED;
      return finish(outcome, 'done', { trip: persisted });
    } catch (error) {
      return fail(summary.stage, 'MIGRATION_FAILED');
    }
  }

  const STAGES = new Set(['start','marker','double-read','identity','pre-post-classification','replay',
    'conditional-write','readback','collateral','second-audit','done','gate','permission','hydration']);
  const safeStage = stage => STAGES.has(stage) ? stage : 'gate';
  const safeMode = mode => ['atomic','cas-window'].includes(mode) ? mode : 'unconfirmed';
  function terminalMessage(summary) {
    if (summary.outcome === MIGRATED) return '地區資料 migration success（' + safeMode(summary.writeMode) + '）';
    if (summary.outcome === MARKER_NOOP) return '地區資料已完成，migration no-op';
    if (summary.outcome === RECOVERED) return '地區資料 marker recovery complete（' + safeMode(summary.writeMode) + '）';
    if (summary.outcome === 'read-only') return '目前帳號無 migration 寫入權限';
    return (summary.state === POST ? 'Marker recovery aborted' : 'Migration aborted') + '（' + safeStage(summary.stage) + '）';
  }
  function safeDiff(line) {
    const field = [...STATE_FIELDS, ...TARGET_GEO_FIELDS].join('|');
    const match = new RegExp('^(?:google|app):[a-zA-Z0-9_-]+\\.(?:' + field + ') expected (?:[a-f0-9]{8}|missing) actual (?:[a-f0-9]{8}|missing)$');
    if (typeof line === 'string' && match.test(line)) return line;
    // Structural paths can contain member IDs, names, dates or arbitrary object keys.
    // Retain only approved field names; never print a dynamic suffix or an error value.
    if (typeof line === 'string') {
      const top = /^(?:trip\.)?(votes|itinerary|members|flights|transports|title|startDate|endDate)(?:[.#\[]|$)/.exec(line);
      if (top) return 'trip.' + top[1] + ' changed';
      if (/^order\[\d+\]$/.test(line)) return 'places.order changed';
    }
    return 'redacted field difference';
  }
  function diagnosticLines(summary = {}) {
    const outcome = [MARKER_NOOP,MIGRATED,RECOVERED,ABORT,'read-only'].includes(summary.outcome) ? summary.outcome : ABORT;
    const lines = ['stage=' + safeStage(summary.stage), 'outcome=' + outcome];
    if ([PRE,POST,UNKNOWN].includes(summary.state)) lines.push('state=' + summary.state);
    if (summary.writeMode) lines.push('writeMode=' + safeMode(summary.writeMode));
    lines.push('writes=' + (Number.isSafeInteger(summary.writes) ? summary.writes : 0));
    lines.push('schedulers=' + (RELEASES_SCHEDULERS.has(outcome) && summary.schedulersReleased === true ? 'released' : 'suspended'));
    if (summary.context) {
      const { revision, updatedAt, updatedByHash, placeCount } = summary.context;
      lines.push('revision=' + (Number(revision) || 0), 'placeCount=' + (Number(placeCount) || 0));
      if (/^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/.test(updatedAt)) lines.push('updatedAt=' + updatedAt);
      if (/^[a-f0-9]{8}$/.test(updatedByHash)) lines.push('updatedByHash=' + updatedByHash);
    }
    for (const [label, rows] of [['diff',summary.diff],['preDiff',summary.preDiff],['postDiff',summary.postDiff]]) {
      for (const row of rows || []) lines.push(label + ': ' + safeDiff(row));
    }
    return lines;
  }

  return {
    VERSION, MARKER, TRIP, PLACE_COUNT, ROW_COUNT,
    MARKER_NOOP, MIGRATED, RECOVERED, ABORT, RELEASES_SCHEDULERS, LEGACY_ONLY_KEYS,
    CANONICAL_FIELDS, AUTO_FIELDS, CANDIDATE_FIELDS, TAG_FIELDS, PLANNING_REGION_FIELDS, AREA_FIELDS,
    IDENTITY_FIELDS, STATE_FIELDS, TARGET_GEO_FIELDS, MIGRATION_FIELDS,
    EXCLUDED_TRIP_FIELDS, EXCLUDED_PLACE_FIELDS, SERVER_MANAGED_TRIP_FIELDS,
    ABSENT, UNDEFINED, PRE, POST, UNKNOWN,
    sort, stable, canonicalField, digest, hash, fieldHash, stableId,
    stateFieldHashes, stateFingerprint, fingerprintOf,
    derivedFieldHashes, approvedPreFieldHashes, approvedPostFieldHashes, targetGeoIdentityReport,
    diffFieldHashes, formatDiff, prefix,
    identityReport, classifyFingerprint, markerVersion, markerComplete,
    applyManifest, knownKey, validateCanonical,
    comparable, flatPaths, allowedChangedPath, collateralReport, semanticCollateral,
    contextEvidence, run, diagnosticLines, terminalMessage,
  };
});
