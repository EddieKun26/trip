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

async function draftWorkspace() {
 const b=await workspace({itinerary:{'9/20':[{id:'place:9/20:淺草寺',name:'淺草寺',time:'09:00'}]}});
 b.run('placePoolPlannerState();placePoolPlanner.snapshot=placePoolPlannerSnapshot();v3UI.exchange={snapshot:{tripId:"b",baseRevision:1,contextHash:"fixture",planningId:"PLN-TEST"},document:"Fixture instructions"};v3UI.text="Fixture text";');
 const pending=b.run('v3ImportText()');await b.reply(planRequests(b)[0],previewPayload());await pending;return b;
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
