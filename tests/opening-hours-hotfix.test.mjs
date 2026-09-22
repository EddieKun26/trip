import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot, trip, place } from './helpers/phase-c-browser.mjs';

const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const record = { v: 1, status: 'known', placeId: 'google-ueno', periods: [
  { open: { day: 0, hour: 17, minute: 30 }, close: { day: 1, hour: 0, minute: 0 } },
], fetchedAt: '2026-09-20T00:00:00.000Z' };
const windows = { '9/20': [{ startMinute: 1050, endMinute: 1440 }],
  '9/21': [], '9/22': [{ startMinute: 0, endMinute: 1440 }], '9/23': [] };
const response = { status: 'known', regularOpeningPeriods: record, openingWindows: windows,
  windowCalendar: { startDate: '2026-09-20', endDate: '2026-09-23' } };
const requests = (b, action) => b.requests.filter(r => JSON.parse(r.options.body || '{}').action === action);

async function selected({ click = true, embedded = false, category = '景點', extra = {} } = {}) {
  const b = await boot(trip([place('ueno', { category, openingHours: '17:30–00:00', ...extra,
    ...(embedded ? { regularOpeningPeriods: record } : {}) })]));
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  b.run('setPlacePoolOpen(true)');
  if (click) b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  else b.run('placePoolSelectedKeys().add("app:synthetic-ueno")');
  return b;
}

test('current-selection barrier resolves an address-excluded Google candidate without a selection event', async () => {
  const b = await selected({ click: false, extra: { addressProvider: 'address_geocode', detailsLocked: true } });
  // Restore the committed constraint directly: neither click nor editor events start hydration.
  b.run('placePoolPlanningConstraints().set("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  const planning = b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'hydrateOpeningHours').length, 1);
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response); await planning;
  assert.equal(requests(b, 'plan').length, 0);
  assert.match(b.app.innerHTML, /營業時間不符合/);
});

for (const status of ['unavailable', 'transient_failure']) {
  test(`${status} is visibly nonblocking on both selected-candidate surfaces after exact resolution`, async () => {
    const b = await selected({ extra: { addressProvider: 'address_geocode', detailsLocked: true } });
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
    const payload = status === 'unavailable' ? { ...response, status, regularOpeningPeriods: { ...record, status, periods: [] }, openingWindows: null } : { error: 'PLACE_DETAILS_429' };
    await b.reply(requests(b, 'hydrateOpeningHours')[0], payload, status === 'unavailable' ? 200 : 502);
    const title = status === 'unavailable' ? /營業時間無法確認/ : /營業時間暫時無法確認/;
    for (const markup of [b.app.innerHTML, b.run('placePoolSelectedColumnMarkup(placePoolViewModel())')]) {
      assert.match(markup, title); assert.match(markup, /role="status"/); assert.doesNotMatch(markup, /營業時間不符合/);
    }
    assert.equal(b.run('placePoolHoursConflicts.size'), 0);
    assert.doesNotMatch(b.app.innerHTML, /data-pool-cta disabled/);
    const planning = b.run('requestPlacePoolPlan()');
    if (status === 'transient_failure') {
      assert.equal(requests(b, 'hydrateOpeningHours').length, 2, 'retry eligible');
      await b.reply(requests(b, 'hydrateOpeningHours')[1], payload, 502);
    } else assert.equal(requests(b, 'hydrateOpeningHours').length, 1, 'authoritative unavailable does not refetch');
    assert.equal(requests(b, 'plan').length, 1);
    await b.reply(requests(b, 'plan')[0], { error: 'TEST' }, 422); await planning;
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "preferred", preferredPeriods: ["morning"] }])');
    assert.doesNotMatch(b.run('placePoolSelectedColumnMarkup(placePoolViewModel())'), title);
    b.run('togglePlacePoolSelection("app:synthetic-ueno")');
    assert.doesNotMatch(b.app.innerHTML, /place-pool-hours-notice/);
  });
}

test('address-only/custom identities remain naturally unknown, with no Google request or hours notice', async () => {
  for (const placeId of ['', 'manual-address-fixture', 'coordinate-fixture', 'bad/id']) {
    const b = await selected({ extra: { placeId, sourceUrl: '', addressProvider: 'manual', manualLocation: true, detailsLocked: true } });
    b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
    assert.equal(requests(b, 'hydrateOpeningHours').length, 0);
    assert.equal(b.run('placePoolHoursConflicts.size'), 0);
    assert.doesNotMatch(b.app.innerHTML, /place-pool-hours-notice|營業時間不符合/);
  }
});

test('released bypass: already selected legacy Place must hydrate before Planner submission', async () => {
  const b = await selected({ click: false });
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  const planning = b.run('requestPlacePoolPlan()');
  const hydrate = b.requests.find(r => JSON.parse(r.options.body || '{}').action === 'hydrateOpeningHours');
  assert.ok(hydrate, 'Planner start must resolve the currently selected candidate');
  await b.reply(hydrate, response);
  await planning;
  assert.equal(b.requests.filter(r => JSON.parse(r.options.body || '{}').action === 'plan').length, 0);
  assert.match(b.app.innerHTML, /營業時間不符合/);
});

test('candidate addition hydrates immediately, then shows a persistent conflict and blocks Planner', async () => {
  const b = await selected();
  assert.equal(requests(b, 'hydrateOpeningHours').length, 1);
  assert.match(b.app.innerHTML, /正在確認營業時間/);
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response);
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  assert.match(b.app.innerHTML, /營業時間不符合/);
  assert.match(b.app.innerHTML, /你指定：09:00/);
  assert.match(b.app.innerHTML, /有 1 個地點/);
  assert.match(b.app.innerHTML, /data-pool-cta disabled/);
  assert.match(b.run('placePoolCardMarkup(placePoolSelectedEntries()[0], { docked: false, selected: true })'), /營業時間不符合/);
  assert.match(b.run('placePoolSelectedCompactCardMarkup(placePoolSelectedEntries()[0])'), /營業時間不符合/);
  b.run('state.places.reverse(); refreshPlacePoolHoursConflicts(); render({ preserveScroll: true, filterOnly: true })');
  assert.equal(b.run('placePoolHoursConflicts.has("app:synthetic-ueno")'), true);
  assert.match(b.app.innerHTML, /營業時間不符合/);
  await b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'plan').length, 0);
});

test('warning CSS remains visible in both real Planner card branches', () => {
  const rule = styles.match(/^\.place-pool-hours-warning\s*\{[^}]+\}/m)?.[0] || '';
  assert.match(rule, /padding:/);
  assert.match(rule, /color:/);
  assert.doesNotMatch(rule, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|height\s*:\s*0/);
  assert.match(styles, /\.place-pool-selected-item \.place-pool-hours-warning/);
});

test('unavailable, naturally unknown and incomplete constraints never fabricate a hard conflict', async () => {
  const unavailable = await selected();
  await unavailable.reply(requests(unavailable, 'hydrateOpeningHours')[0], {
    status: 'unavailable', regularOpeningPeriods: { ...record, status: 'unavailable', periods: [] },
    openingWindows: null, windowCalendar: response.windowCalendar,
  });
  unavailable.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  assert.equal(unavailable.run('placePoolHoursConflicts.size'), 0);

  const custom = await boot(trip([place('ueno', { placeId: '', sourceUrl: '', openingHours: '17:30–00:00' })]));
  custom.state.selectedDate = '9/20'; await custom.run('setTab("itinerary")'); custom.run('setPlacePoolOpen(true)');
  custom.run('togglePlacePoolSelection("app:synthetic-ueno")');
  custom.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  assert.equal(requests(custom, 'hydrateOpeningHours').length, 0);
  assert.equal(custom.run('placePoolHoursConflicts.size'), 0);

  const known = await selected();
  await known.reply(requests(known, 'hydrateOpeningHours')[0], response);
  known.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "preferred", preferredPeriods: ["morning"] }])');
  assert.equal(known.run('placePoolHoursConflicts.size'), 0);
  known.run('applyPlacePoolConstraint("app:synthetic-ueno", [])');
  assert.equal(known.run('placePoolHoursConflicts.size'), 0);
});

test('exact-time and date edits immediately clear and recreate conflicts using the same windows', async () => {
  const b = await selected();
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response);
  const apply = (dayKey, mode, exactTime) => b.run(`applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "${dayKey}", mode: "${mode}", exactTime: ${exactTime ? `"${exactTime}"` : 'null'} }])`);
  apply('9/20', 'exact', '09:00');
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  apply('9/20', 'exact', '17:30');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  apply('9/20', 'exact', '17:45');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  apply('9/20', 'exact', '23:45');
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  apply('9/21', 'exact', '18:00');
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  apply('9/22', 'exact', '18:00');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  apply('9/20', 'preferred');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [])');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  assert.equal(requests(b, 'hydrateOpeningHours').length, 1);
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
});

test('exact start feasibility uses the existing 30-minute minimum, including split and overnight windows', async () => {
  const b = await selected({ click: false });
  const fits = (day, time) => b.run(`plannerHoursOptionFits(${JSON.stringify(windows)}, { dayKey: "${day}", mode: "exact", exactTime: "${time}" })`);
  assert.equal(fits('9/20', '09:00'), false);
  assert.equal(fits('9/20', '23:45'), false);
  assert.equal(fits('9/20', '23:30'), true);
  assert.equal(fits('9/21', '12:00'), false);
  assert.equal(fits('9/22', '00:00'), true);
  const split = { '9/20': [{ startMinute: 600, endMinute: 720 }, { startMinute: 810, endMinute: 1080 }] };
  assert.equal(b.run(`plannerHoursOptionFits(${JSON.stringify(split)}, { dayKey: "9/20", mode: "exact", exactTime: "12:15" })`), false);
  const overnight = { '9/21': [{ startMinute: 0, endMinute: 120 }] };
  assert.equal(b.run(`plannerHoursOptionFits(${JSON.stringify(overnight)}, { dayKey: "9/21", mode: "exact", exactTime: "01:30" })`), true);
  assert.equal(b.run(`plannerHoursOptionFits(${JSON.stringify(overnight)}, { dayKey: "9/21", mode: "exact", exactTime: "01:45" })`), false);
});

test('failed hydration leaves unknown hours and permits Planner; bar category and display text create no constraint', async () => {
  const b = await selected({ category: 'bar' });
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  await b.reply(requests(b, 'hydrateOpeningHours')[0], { error: 'UPSTREAM' }, 502);
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  const pending = b.run('requestPlacePoolPlan()');
  const retry = requests(b, 'hydrateOpeningHours')[1];
  assert.ok(retry, 'transient failure remains retry eligible');
  await b.reply(retry, { error: 'UPSTREAM' }, 502);
  const plan = requests(b, 'plan')[0];
  assert.ok(plan);
  await b.reply(plan, { error: 'TEST' }, 422);
  await pending;
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
});

test('exact-time editor flags an invalid draft immediately and clears when corrected', async () => {
  const b = await selected();
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response);
  b.run('openPlacePoolConstraintSheet("app:synthetic-ueno")');
  b.run('togglePoolConstraintDraftDate("9/20")');
  b.run('togglePoolConstraintExpandedDay("9/20")');
  b.run('setPoolConstraintDraftMode("exact")');
  assert.equal(b.run('sheetRoot.innerHTML.includes("營業時間不符合")'), true);
  b.run('pendingPoolConstraint.timeWheel = { hour: "17", minute: "30" }; setPoolConstraintDraftMode("exact")');
  assert.equal(b.run('sheetRoot.innerHTML.includes("營業時間不符合")'), false);
  b.run('pendingPoolConstraint.timeWheel = { hour: "23", minute: "45" }; setPoolConstraintDraftMode("exact")');
  assert.equal(b.run('sheetRoot.innerHTML.includes("營業時間不符合")'), true);
});

test('legal exact time proceeds after hydration; an added candidate during the barrier is rechecked', async () => {
  const b = await boot(trip([place('ueno'), place('asakusa')]));
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  b.run('setPlacePoolOpen(true)');
  b.run('placePoolSelectedKeys().add("app:synthetic-ueno")');
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "18:00" }])');
  const planning = b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'hydrateOpeningHours').length, 1);
  b.run('togglePlacePoolSelection("app:synthetic-asakusa")');
  b.run('applyPlacePoolConstraint("app:synthetic-asakusa", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  assert.equal(requests(b, 'hydrateOpeningHours').length, 2);
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response);
  const asakusaRecord = { ...record, placeId: 'google-asakusa' };
  await b.reply(requests(b, 'hydrateOpeningHours')[1], { ...response, regularOpeningPeriods: asakusaRecord });
  await planning;
  assert.equal(requests(b, 'plan').length, 0);
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  b.run('applyPlacePoolConstraint("app:synthetic-asakusa", [{ dayKey: "9/20", mode: "exact", exactTime: "18:30" }])');
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  const legal = b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'plan').length, 1);
  await b.reply(requests(b, 'plan')[0], { error: 'TEST' }, 422);
  await legal;
});

test('ordinary Trip synchronization preserves active session hours without writing them into Trip', async () => {
  const b = await selected();
  await b.reply(requests(b, 'hydrateOpeningHours')[0], response);
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  assert.equal(b.run('Object.hasOwn(sharedTripPayload().places[0], "regularOpeningPeriods")'), false);
  b.run('applySharedTrip({ ...sharedTripPayload(), revision: 2 })');
  b.run('refreshPlacePoolHoursConflicts()');
  assert.equal(b.state.places[0].regularOpeningPeriods.status, 'known');
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  assert.equal(b.run('Object.hasOwn(sharedTripPayload().places[0], "regularOpeningPeriods")'), false);
});

test('windows normalized for a stale Trip calendar are not trusted by the active candidate', async () => {
  const b = await selected();
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  await b.reply(requests(b, 'hydrateOpeningHours')[0], { ...response,
    windowCalendar: { startDate: '2026-09-19', endDate: '2026-09-22' } });
  assert.equal(b.run('placePoolHoursConflicts.size'), 0);
  const planning = b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'hydrateOpeningHours').length, 2);
  await b.reply(requests(b, 'hydrateOpeningHours')[1], response);
  await planning;
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  assert.equal(requests(b, 'plan').length, 0);
});

test('released no-warning bug: legacy Maps URL identity hydrates and renders its known conflict', async () => {
  const legacyPlaceId = 'ChIJLegacyVirtu';
  const legacyRecord = { ...record, placeId: legacyPlaceId };
  const b = await boot(trip([place('ueno', {
    placeId: '',
    category: 'bar',
    openingHours: '17:30–00:00',
    sourceUrl: `https://www.google.com/maps/search/?api=1&query=Virtu&query_place_id=${legacyPlaceId}`,
  })]));
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  b.run('setPlacePoolOpen(true)');
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  b.run('applyPlacePoolConstraint("app:synthetic-ueno", [{ dayKey: "9/20", mode: "exact", exactTime: "09:00" }])');
  const hydrate = requests(b, 'hydrateOpeningHours')[0];
  assert.ok(hydrate, 'legacy explicit Maps place identity must start hydration');
  await b.reply(hydrate, { ...response, regularOpeningPeriods: legacyRecord });
  assert.equal(b.run('placePoolHoursConflicts.size'), 1);
  assert.match(b.app.innerHTML, /營業時間不符合/);
  assert.match(b.app.innerHTML, /有 1 個地點/);
  assert.match(b.app.innerHTML, /data-pool-cta disabled/);
  await b.run('requestPlacePoolPlan()');
  assert.equal(requests(b, 'plan').length, 0);
});
