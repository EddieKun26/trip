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
  const b = await boot({ ...trip(placeList), ...extra });
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
          { source: 'existing', id: 'place:9/20:淺草寺', name: '淺草寺', time: '09:00', itemType: 'place', kind: 'attraction' },
          { source: 'required', placeKey: keyOf('ueno'), name: '上野動物園', kind: 'attraction', area: '上野・淺草・秋葉原', favoriteVotes: 0, startTime: '10:30', durationMinutes: 120, exactTime: true, preferenceMiss: false },
        ] },
        { dayKey: '9/21', weekday: '週一', items: [
          { source: 'saved', placeKey: keyOf('tsukiji'), name: '築地壽司', kind: 'restaurant', area: '銀座・築地・東京車站', favoriteVotes: 1, startTime: '12:00', durationMinutes: 60, exactTime: false, preferenceMiss: true, candidateRef: 'p002' },
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

test('Preview renders read-only days in Trip order with existing/required/saved distinctions, markers and no Accept', async () => {
  const b = await workspace({ itinerary: { '9/20': [{ id: 'place:9/20:淺草寺', name: '淺草寺', time: '09:00' }] } });
  const itineraryBefore = json(b.state.itinerary);
  const revisionBefore = b.state.sharedRevision;
  await click(b, '[data-pool-place]', { poolPlace: keyOf('ueno') });
  const pending = click(b, '[data-pool-cta]');
  await b.reply(planRequests(b)[0], previewPayload());
  await pending;
  const html = b.app.innerHTML;
  assert.match(html, /<h2 id="place-pool-title">AI 行程預覽<\/h2>/);
  assert.match(html, /role="note">這是預覽，不會變更目前行程。<\/p>/);
  const dayOrder = ['9/20', '9/21', '9/22', '9/23'].map((day) => html.indexOf(`<h3>${day} `));
  assert.ok(dayOrder.every((index, i) => index > 0 && (i === 0 || index > dayOrder[i - 1])), JSON.stringify(dayOrder));
  assert.match(html, /is-existing">\s*<span class="place-pool-preview-time">09:00<\/span>[\s\S]*?<strong>淺草寺<\/strong><small><span class="place-pool-preview-badge is-existing">🔒 既有行程<\/span>/);
  assert.match(html, /is-required">\s*<span class="place-pool-preview-time">10:30<\/span>[\s\S]*?<strong>上野動物園<\/strong><small><span class="place-pool-preview-badge is-required">我指定想去<\/span>景點 · 上野・淺草・秋葉原 · 120 分鐘/);
  assert.match(html, /is-saved">\s*<span class="place-pool-preview-time">12:00<\/span>[\s\S]*?<strong>築地壽司<\/strong><small><span class="place-pool-preview-badge is-saved">已在我的清單<\/span>/);
  assert.match(html, /place-pool-preview-note is-exact">指定時間</);
  assert.match(html, /place-pool-preview-note is-warning">偏好時段未完全符合</);
  assert.match(html, /這天沒有安排/);
  assert.match(html, /data-pool-preview-back>返回調整<\/button>/);
  assert.match(html, /data-pool-preview-regenerate>重新規劃<\/button>/);
  for (const forbidden of ['套用', '接受', '儲存到行程', 'AI推薦', 'AI 推薦', 'candidateRef', 'p002', 'HARD', 'constraint', 'data-pool-cta>', 'data-pool-drawer-toggle']) {
    assert.ok(!html.includes(forbidden), forbidden);
  }
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
  assert.match(b.app.innerHTML, /data-pool-preview-regenerate disabled aria-disabled="true" aria-busy="true">正在重新規劃…<\/button>/);
  assert.match(b.app.innerHTML, /data-pool-preview-back disabled>返回調整/);
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
    [409, { error: 'TRIP_STALE', revision: 2 }, '行程內容已更新，請重新整理後再規劃。'],
    [429, { error: 'DAILY_PLANNER_LIMIT' }, '今天的 AI 規劃次數已達上限，請明天再試。'],
    [422, { error: 'PLANNER_CONSTRAINTS_INFEASIBLE', reason: 'CAPACITY_EXCEEDED', placeKeys: [keyOf('ueno')] }, '「上野動物園」指定的日期已排滿'],
    [422, { error: 'PLANNER_CONSTRAINTS_INFEASIBLE', reason: 'EXACT_TIME_CONFLICT', placeKeys: [keyOf('ueno')] }, '「上野動物園」的指定時間互相衝突'],
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
    assert.ok(b.toast.innerHTML.includes(copy), `${payload.error}: ${b.toast.innerHTML}`);
    assert.ok(!b.toast.innerHTML.includes(payload.error), payload.error);
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
