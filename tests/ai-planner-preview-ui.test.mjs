import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, trip, place, json } from './helpers/phase-c-browser.mjs';

const keyOf = (area) => `app:synthetic-${area}`;
const places = () => [
  place('asakusa', { name: '淺草寺', kind: 'attraction' }),
  place('ueno', { name: '上野動物園', kind: 'attraction' }),
  place('tsukiji', { name: '築地壽司', kind: 'restaurant' }),
  place('ginza', { name: '銀座飯店', kind: 'lodging' }),
];

async function workspace(extra = {}, placeList = places()) {
  // These Draft/Apply tests exercise Planner UI with authoritative unknown hours. The
  // selection hydration lifecycle has its own focused tests.
  const readyPlaces = placeList.map(item => ({ ...item, regularOpeningPeriods: item.regularOpeningPeriods || {
    v: 1, status: 'unavailable', placeId: item.placeId, periods: [], fetchedAt: '2026-09-20T00:00:00.000Z',
  } }));
  const b = await boot({ ...trip(readyPlaces), ...extra });
  b.state.selectedDate = '9/20';
  await b.run('setTab("itinerary")');
  b.run('setPlacePoolOpen(true)');
  b.run(`var persistCalls = 0; const originalPersist = persist; persist = (...args) => { persistCalls += 1; return originalPersist(...args); };`);
  return b;
}
const target = (selector, dataset = {}) => ({ closest: (s) => (s === selector ? { dataset } : null), matches: () => false });
const click = (b, selector, dataset) => b.listeners.click.find((fn) => String(fn).includes('data-toggle-place-pool'))({ target: target(selector, dataset), preventDefault() {} });
const planRequests = (b) => b.requests.filter((r) => r.url === '/api/trip?id=b' && r.options.method === 'POST');
const ctaMarkup = (b) => b.app.innerHTML.slice(b.app.innerHTML.indexOf('<div class="place-pool-cta">'), b.app.innerHTML.indexOf('</div>', b.app.innerHTML.indexOf('<div class="place-pool-cta">')));

function previewPayload(extra = {}) {
  return {
    preview: {
      tripId: 'b', revision: 1,
      days: [
        { dayKey: '9/20', weekday: '週日', items: [
          { source: 'existing', ref: 'existing:1:9/20:0', id: 'place:9/20:淺草寺', name: '淺草寺', time: '09:00', itemType: 'place', kind: 'attraction' },
          { source: 'required', ref: keyOf('ueno'), placeKey: keyOf('ueno'), name: '上野動物園', kind: 'attraction', area: '上野・淺草・秋葉原', favoriteVotes: 0, startTime: '10:30', durationMinutes: 120, exactTime: true, preferenceMiss: false },
        ] },
        { dayKey: '9/21', weekday: '週一', items: [
          { source: 'saved', ref: keyOf('tsukiji'), placeKey: keyOf('tsukiji'), name: '築地壽司', kind: 'restaurant', area: '銀座・築地・東京車站', favoriteVotes: 1, startTime: '12:00', durationMinutes: 60, exactTime: false, preferenceMiss: true, candidateRef: 'p002' },
        ] },
        { dayKey: '9/22', weekday: '週二', items: [] },
        { dayKey: '9/23', weekday: '週三', items: [] },
      ],
      summary: { requiredCount: 1, savedCount: 1, unscheduledSavedCount: 0, preferenceMissCount: 1 },
    },
    planning: { modelCalls: 1, repaired: false },
    ...extra,
  };
}

test('CTA: enabled with saved candidates at 0 selected, count copy when selected, disabled with helper when nothing is plannable', async () => {
  const b = await workspace();
  assert.match(ctaMarkup(b), /<button class="place-pool-cta-button" type="button" data-pool-cta>AI 幫我規劃行程<\/button>/);
  assert.match(ctaMarkup(b), /會先產生預覽，不會變更目前行程/);
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') });
  assert.match(ctaMarkup(b), /data-pool-cta>用已選 2 個地點規劃<\/button>/);

  const onlyLodging = await workspace({}, [place('ginza', { name: '銀座飯店', kind: 'lodging' })]);
  assert.match(ctaMarkup(onlyLodging), /data-pool-cta disabled aria-disabled="true">AI 幫我規劃行程<\/button>/);
  assert.match(ctaMarkup(onlyLodging), /目前沒有可規劃的地點/);
  const requests = onlyLodging.requests.length;
  onlyLodging.run('requestPlacePoolPlan()');
  assert.equal(onlyLodging.requests.length, requests);
});

test('planning request sends only revision + selected refs/dateOptions, shows loading and blocks a second request', async () => {
  const b = await workspace();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint(${JSON.stringify(keyOf('ueno'))}, [{ dayKey: '9/21', mode: 'exact', exactTime: '18:30' }, { dayKey: '9/20', mode: 'preferred', preferredPeriods: ['morning'] }])`);
  const pending = click(b, '[data-pool-cta]');
  assert.equal(planRequests(b).length, 1);
  const body = JSON.parse(planRequests(b)[0].options.body);
  assert.deepEqual(body, { action: 'plan', expectedRevision: 1, selected: [{ ref: keyOf('ueno'), dateOptions: [
    { dayKey: '9/20', mode: 'preferred', preferredPeriods: ['morning'], exactTime: null },
    { dayKey: '9/21', mode: 'exact', preferredPeriods: [], exactTime: '18:30' },
  ] }] });
  assert.ok(!('places' in body) && !('itinerary' in body));
  assert.match(ctaMarkup(b), /data-pool-cta disabled aria-disabled="true" aria-busy="true">正在規劃行程…<\/button>/);
  b.run('requestPlacePoolPlan()');
  await click(b, '[data-pool-cta]');
  assert.equal(planRequests(b).length, 1);
  await b.reply(planRequests(b)[0], previewPayload());
  await pending;
  assert.equal(b.run('placePoolPlanner.status'), 'preview');
});

test('Preview becomes editable Draft without persisting; original and AI badges and Apply hierarchy', async () => {
  const b = await workspace({ itinerary: { '9/20': [{ id: 'place:9/20:淺草寺', name: '淺草寺', time: '09:00' }] } });
  const itineraryBefore = json(b.state.itinerary);
  const revisionBefore = b.state.sharedRevision;
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  const pending = click(b, '[data-pool-cta]');
  await b.reply(planRequests(b)[0], previewPayload());
  await pending;
  const html = b.app.innerHTML;
  assert.match(html, /<h2 id="place-pool-title">AI 行程預覽<\/h2>/);
  assert.match(html, /修改只保留在此草稿/);
  const dayOrder = ['9/20', '9/21', '9/22', '9/23'].map((day) => html.indexOf(`<h3>${day} `));
  assert.ok(dayOrder.every((index, i) => index > 0 && (i === 0 || index > dayOrder[i - 1])), JSON.stringify(dayOrder));
  assert.match(html, /原有行程/);
  assert.match(html, /AI 規劃/);
  assert.match(html, /停留 120 分鐘/);
  assert.match(html, /data-draft-time/);
  assert.match(html, /data-pool-apply>套用此行程/);
  assert.match(html, /data-pool-preview-back>修改規劃條件/);
  assert.ok(!html.includes('🔒 既有行程'));
  assert.deepEqual(json(b.state.itinerary), itineraryBefore);
  assert.equal(b.state.sharedRevision, revisionBefore);
  assert.equal(b.run('persistCalls'), 0);
  assert.equal(b.requests.filter((r) => r.options.method === 'PUT').length, 0);
});

test('返回調整 keeps selection and dateOptions; 重新規劃 replays the Preview snapshot, not later selection changes', async () => {
  const b = await workspace();
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  b.run(`applyPlacePoolConstraint(${JSON.stringify(keyOf('ueno'))}, [{ dayKey: '9/22', mode: 'none' }])`);
  const pending = click(b, '[data-pool-cta]');
  const firstBody = planRequests(b)[0].options.body;
  // A selection change while the request is in flight never leaks into this Preview's snapshot.
  await click(b, '[data-pool-place]', { poolPlace: keyOf('tsukiji') });
  await b.reply(planRequests(b)[0], previewPayload());
  await pending;
  const regenerate = click(b, '[data-pool-preview-regenerate]');
  assert.equal(planRequests(b).length, 2);
  assert.equal(planRequests(b)[1].options.body, firstBody);
  assert.match(b.app.innerHTML, /data-pool-preview-regenerate disabled>正在重新規劃…<\/button>/);
  assert.match(b.app.innerHTML, /data-pool-preview-back disabled>修改規劃條件/);
  await b.reply(planRequests(b)[1], previewPayload());
  await regenerate;
  assert.equal(b.run('placePoolPlanner.status'), 'preview');
  await click(b, '[data-pool-preview-back]');
  assert.equal(b.run('placePoolPlanner.preview'), null);
  assert.match(b.app.innerHTML, /<h2 id="place-pool-title">行程規劃<\/h2>/);
  assert.deepEqual(json(b.run('placePoolSelectedEntries().map((entry) => entry.key)')), [keyOf('ueno'), keyOf('tsukiji')]);
  assert.deepEqual(json(b.run(`placePoolConstraintFor(${JSON.stringify(keyOf('ueno'))})`)), [{ dayKey: '9/22', mode: 'none', preferredPeriods: [], exactTime: null }]);
  assert.match(b.app.innerHTML, /data-pool-cta>用已選 2 個地點規劃<\/button>/);
  assert.equal(b.run('persistCalls'), 0);
});

test('errors show natural Chinese copy without codes, keep the workspace usable, and never auto-retry a stale Trip', async () => {
  const cases = [
    [409, { error: 'TRIP_STALE', revision: 2 }, '行程已在其他地方被修改，請重新載入或重新規劃。'],
    [429, { error: 'DAILY_PLANNER_LIMIT' }, '今天的 AI 規劃次數已達上限，請明天再試。'],
    [422, { error: 'PLANNER_CONSTRAINTS_INFEASIBLE', reason: 'CAPACITY_EXCEEDED', placeKeys: [keyOf('ueno')] }, '「上野動物園」指定的日期已排滿'],
    [422, { error: 'PLANNER_CONSTRAINTS_INFEASIBLE', reason: 'EXACT_TIME_CONFLICT', placeKeys: [keyOf('ueno')] }, '「上野動物園」的指定時間互相衝突'],
    [422, { error: 'PLANNER_CONSTRAINTS_INFEASIBLE', reason: 'OPENING_HOURS_CONFLICT', placeKeys: [keyOf('ueno')] }, '「上野動物園」在目前選擇的日期或指定時間沒有可用的營業時段，請調整日期或時間條件後再規劃。'],
    [422, { error: 'PLANNER_LODGING_SELECTED', placeKeys: [keyOf('ginza')] }, '住宿「銀座飯店」不會由 AI 排入行程'],
    [422, { error: 'PLANNER_INVALID_OUTPUT' }, 'AI 這次沒有排出符合條件的行程，請再試一次。'],
    [422, { error: 'NO_PLANNING_CANDIDATES' }, '目前沒有可規劃的地點'],
    [503, { error: 'PLANNER_MODEL_NOT_CONFIGURED' }, 'AI 行程規劃尚未啟用'],
    [503, { error: 'PLANNER_QUOTA_NOT_CONFIGURED' }, 'AI 行程規劃尚未啟用'],
    [502, { error: 'OPENAI_500_SERVER_ERROR' }, 'AI 規劃暫時無法完成，請稍後再試。'],
    [429, { error: 'OPENAI_429_RATE_LIMIT_EXCEEDED' }, 'AI 服務目前忙碌，請稍後再試。'],
  ];
  for (const [status, payload, copy] of cases) {
    const b = await workspace();
    await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
    await click(b, '[data-pool-place]', { poolPlace: keyOf('ginza') });
    const pending = click(b, '[data-pool-cta]');
    await b.reply(planRequests(b)[0], payload, status);
    await pending;
    assert.ok(b.app.innerHTML.includes(copy), `${payload.error}: ${b.app.innerHTML}`);
    assert.ok(!b.app.innerHTML.includes(payload.error), payload.error);
    // An opening-hours conflict must never read as the daily-capacity ("已排滿") message.
    if (payload.reason === 'OPENING_HOURS_CONFLICT') assert.ok(!b.app.innerHTML.includes('已排滿') && !b.app.innerHTML.includes('每天最多'), b.app.innerHTML);
    assert.equal(b.run('placePoolPlanner.status'), 'idle');
    assert.equal(planRequests(b).length, 1);
    assert.match(b.app.innerHTML, /data-pool-cta>用已選 2 個地點規劃<\/button>/);
  }
});

test('trip switch or closing the workspace discards a Preview, and a late response for another Trip is ignored', async () => {
  const b = await workspace();
  let pending = click(b, '[data-pool-cta]');
  await b.reply(planRequests(b)[0], previewPayload());
  await pending;
  assert.equal(b.run('placePoolPlanner.status'), 'preview');
  b.run('setPlacePoolOpen(false)');
  assert.equal(b.run('placePoolPlanner.preview'), null);
  b.run('setPlacePoolOpen(true)');
  assert.match(b.app.innerHTML, /<h2 id="place-pool-title">行程規劃<\/h2>/);

  pending = click(b, '[data-pool-cta]');
  b.run('state.tripId = "a"');
  assert.equal(b.run('placePoolPlannerState().status'), 'idle');
  b.run('state.tripId = "b"');
  await b.reply(planRequests(b)[1], previewPayload());
  await pending;
  assert.equal(b.run('placePoolPlannerState().preview'), null);

  b.run('clearTripView()');
  assert.equal(b.run('placePoolPlanner.status'), 'idle');
});

test('a pending shared save blocks planning so the request revision is never behind local edits', async () => {
  const b = await workspace();
  b.run('sharedSaveTimer = 99');
  const requests = planRequests(b).length;
  await click(b, '[data-pool-cta]');
  assert.equal(planRequests(b).length, requests);
  assert.ok(b.toast.innerHTML.includes('行程正在同步，請稍候再規劃。'));
  b.run('sharedSaveTimer = 0');
});

async function draftWorkspace() {
  const b = await workspace({ itinerary: { '9/20': [{ id: 'place:9/20:淺草寺', name: '淺草寺', time: '09:00' }] } });
  const pending = click(b, '[data-pool-cta]');
  await b.reply(planRequests(b)[0], previewPayload()); await pending;
  b.context.window.confirm = () => false;
  return b;
}

test('Draft time/duration/reorder are memory-only, dirty; passive render is not dirty; no guessed existing duration', async () => {
  const b = await draftWorkspace(), requests = b.requests.length, writes = b.writes.length;
  const before = json(b.state.itinerary);
  b.run('render({preserveScroll:true,filterOnly:true})');
  assert.equal(b.run('placePoolPlanner.draftDirty'), false);
  assert.equal(b.run('placePoolPlanner.draft.days[0].items[0].durationMinutes'), undefined);
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0", "startTime", "08:30")'), true);
  assert.equal(b.run('editPlannerDraft("app:synthetic-ueno", "durationMinutes", "90")'), true);
  assert.match(b.app.innerHTML, /停留 90 分鐘/);
  assert.equal(b.run('reorderPlannerDraft("app:synthetic-ueno", "existing:1:9/20:0")'), true);
  assert.equal(b.run('placePoolPlanner.draft.days[0].items[0].startTime'), '10:30', 'drag never invents time');
  assert.equal(b.run('placePoolPlanner.draftDirty'), true);
  assert.deepEqual(json(b.state.itinerary), before);
  assert.equal(b.requests.length, requests); assert.equal(b.writes.length, writes); assert.equal(b.run('persistCalls'), 0);
});

test('dirty Replan and Modify Conditions confirm; cancel preserves edits; confirmed Replan reuses original request', async () => {
  const b = await draftWorkspace();
  b.run('editPlannerDraft("app:synthetic-ueno", "durationMinutes", "90")');
  const before = json(b.run('placePoolPlanner.draft'));

  await click(b, '[data-pool-preview-back]'); await click(b, '[data-pool-preview-regenerate]');
  assert.match(b.sheet.innerHTML, /手動修改的內容會被捨棄/); assert.match(b.sheet.innerHTML, /保留草稿/);
  assert.deepEqual(json(b.run('placePoolPlanner.draft')), before); assert.equal(planRequests(b).length, 1);
  const pending = click(b, '[data-pool-confirm-discard]');
  assert.equal(planRequests(b)[1].options.body, planRequests(b)[0].options.body);
  assert.equal(b.run('placePoolPlanner.draft'), null);
  await b.reply(planRequests(b)[1], previewPayload()); await pending;
  assert.equal(b.run('placePoolPlanner.draftDirty'), false);
});

test('Apply posts only safe intent, prevents double submit, consumes canonical response, closes and gives one revision-bound Undo', async () => {
  const b = await draftWorkspace();
  b.run('editPlannerDraft("app:synthetic-ueno", "durationMinutes", "90")');
  const before = json(b.state.itinerary);
  const pending = click(b, '[data-pool-apply]');
  assert.match(b.app.innerHTML, /data-pool-apply disabled aria-busy="true">正在套用/);
  await click(b, '[data-pool-apply]');
  const reqs = planRequests(b); assert.equal(reqs.length, 2);
  const body = JSON.parse(reqs[1].options.body);
  assert.equal(body.action, 'applyPlan'); assert.equal(body.expectedRevision, 1);
  assert.ok(body.days.flatMap(d => d.items).every(i => Object.keys(i).sort().join(',') === 'durationMinutes,ref,startTime'));
  const canonical = { ...trip(places()), revision: 2, itinerary: { '9/20': [...before['9/20'], { id: 'server-created', name: '上野動物園', time: '10:30', durationMinutes: 90 }] } };
  await b.reply(reqs[1], canonical); await pending;
  assert.equal(b.run('placePoolPlanner.draft'), null); assert.equal(b.run('placePoolPlanner.draftDirty'), false);
  assert.equal(b.state.placePool.open, false); assert.equal(b.state.sharedRevision, 2);
  assert.equal(b.state.itinerary['9/20'][1].id, 'server-created'); assert.match(b.toast.innerHTML, /已套用行程/);
  const undo = b.run('restoreLastAction()');
  const puts = b.requests.filter(r => r.options.method === 'PUT'); assert.equal(puts.length, 1);
  const undoBody = JSON.parse(puts[0].options.body);
  assert.equal(undoBody.expectedRevision, 2); assert.equal(undoBody.requireAtomic, true); assert.deepEqual(undoBody.itinerary, before);
  await b.reply(puts[0], { ...canonical, revision: 3, itinerary: before }); await undo;
  assert.deepEqual(json(b.state.itinerary), before); assert.equal(b.run('undoSnapshot'), null);
});

for (const code of ['OPENING_HOURS_CONFLICT', 'TIME_OVERLAP', 'INVALID_DURATION', 'TRIP_STALE']) test(`Apply ${code} keeps manual Draft and shows persistent card`, async () => {
  const b = await draftWorkspace();
  b.run('editPlannerDraft("app:synthetic-ueno", "durationMinutes", "90")');
  const before = json(b.run('placePoolPlanner.draft'));
  const pending = click(b, '[data-pool-apply]');
  await b.reply(planRequests(b)[1], { error: code, detail: { name: '上野動物園', dayKey: '9/20', startTime: '07:00', openingWindows: ['10:00–18:00'] } }, code === 'TRIP_STALE' ? 409 : 422); await pending;
  assert.deepEqual(json(b.run('placePoolPlanner.draft')), before);
  assert.equal(b.run('placePoolPlanner.draftDirty'), true);
  assert.match(b.app.innerHTML, /planner-error-card/); assert.match(b.app.innerHTML, /role="alert"/);
  b.run('render({preserveScroll:true,filterOnly:true})');
  assert.match(b.app.innerHTML, /planner-error-card/);
  if (code === 'OPENING_HOURS_CONFLICT') {
    assert.match(b.app.innerHTML, /營業時間不符合/); assert.match(b.app.innerHTML, /你指定：07:00/); assert.match(b.app.innerHTML, /當日營業：10:00–18:00/);
  }
  b.run('editPlannerDraft("app:synthetic-ueno", "durationMinutes", "105")');
  assert.equal(b.run('placePoolPlanner.error'), null);
});

test('flight time and duration stay protected; same-day ordering matches normal flight drag rules', async () => {
  const b = await draftWorkspace();
  b.run('placePoolPlanner.draft.days[0].items[0].itemType = "flight"; placePoolPlanner.draft.days[0].items[0].protected = true; render({filterOnly:true})');
  assert.match(b.app.innerHTML, /固定項目/);
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0", "startTime", "10:00")'), false);
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0", "durationMinutes", "90")'), false);
  assert.equal(b.run('reorderPlannerDraft("existing:1:9/20:0", "app:synthetic-ueno")'), true);
});

test('cross-day move preserves time/duration and changes only Draft arrays; fixed flight cannot move days', async()=>{
  const b=await draftWorkspace(),before=json(b.state.itinerary),count=b.requests.length;
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0","dayKey","9/22")'),true);
  assert.equal(b.run('placePoolPlanner.draft.days[2].items[0].time'),'09:00');
  assert.equal(b.run('placePoolPlanner.draft.days[2].items[0].durationMinutes'),undefined);
  assert.equal(b.run('editPlannerDraft("app:synthetic-ueno","dayKey","9/23")'),true);
  assert.equal(b.run('placePoolPlanner.draft.days[3].items[0].durationMinutes'),120);
  assert.equal(b.run('placePoolPlanner.draft.days[3].items[0].startTime'),'10:30');
  assert.equal(b.run('editPlannerDraft("app:synthetic-ueno","dayKey","2/31")'),false);
  b.run('placePoolPlanner.draft.days[2].items[0].itemType="flight"');
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0","dayKey","9/20")'),false);
  assert.deepEqual(json(b.state.itinerary),before);assert.equal(b.requests.length,count);assert.equal(b.run('persistCalls'),0);
});
test('confirming unchanged existing time does not dirty the draft; confirmed modify conditions discards only draft',async()=>{
  const b=await draftWorkspace();
  assert.equal(b.run('editPlannerDraft("existing:1:9/20:0","startTime","09:00")'),false);
  assert.equal(b.run('placePoolPlanner.draftDirty'),false);
  b.run('editPlannerDraft("existing:1:9/20:0","startTime","09:15")');
  await click(b,'[data-pool-preview-back]'); await click(b,'[data-pool-confirm-discard]');
  assert.equal(b.run('placePoolPlanner.draft'),null);assert.equal(b.state.itinerary['9/20'][0].time,'09:00');
});
