import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import handler from '../api/trip.mjs';
import { plannerTrip, key } from './fixtures/ai-planner-fixtures.mjs';
import { plannerTripDays } from '../lib/ai-trip-planner.mjs';
import { existingRef } from '../lib/ai-trip-planner-apply.mjs';

process.env.KV_REST_API_URL = 'https://apply-redis.invalid';
process.env.KV_REST_API_TOKEN = 'fixture';
const tripKey = 'tokyo-family-trip:trip:planner-fixture';
let store, writes, external, beforeCas;
globalThis.fetch = async (url, options) => {
  if (url !== process.env.KV_REST_API_URL) { external++; throw new Error('UNEXPECTED_EXTERNAL_CALL'); }
  const c = JSON.parse(options.body);
  let result;
  if (c[0] === 'GET') result = store.get(c[1]) ?? null;
  else if (c[0] === 'EVAL' && c[1] === 'return 1') result = 1;
  else if (c[0] === 'EVAL') {
    beforeCas?.(); beforeCas = null;
    const current = JSON.parse(store.get(c[3]));
    if (current.revision !== Number(c[4])) result = `CONFLICT:${current.revision}`;
    else { store.set(c[3], c[5]); writes++; result = 'OK'; }
  } else throw new Error(`Unexpected Redis command ${c[0]}`);
  return new Response(JSON.stringify({ result }));
};
function fixture() {
  const trip = plannerTrip({ startDate: '2026-09-20', itinerary: { '9/20': [{ id: 'old', name: '淺草寺', time: '09:00' }] }, flights: [] });
  store = new Map([[tripKey, JSON.stringify(trip)]]); writes = 0; external = 0; beforeCas = null;
  for (const id of ['alice', 'outsider']) store.set(`tokyo-family-trip:session:${createHash('sha256').update(id).digest('hex')}`, JSON.stringify({ id, nickname: id }));
  const body = { action: 'applyPlan', expectedRevision: trip.revision, days: plannerTripDays(trip).map(day => ({ dayKey: day.dayKey,
    items: (trip.itinerary[day.dayKey] || []).map((item, i) => ({ ref: existingRef(trip.revision, day.dayKey, i), startTime: item.time, durationMinutes: null })) })) };
  body.days[0].items.push({ ref: key('ueno-park'), startTime: '11:00', durationMinutes: 90 });
  return { trip, body };
}
async function call(body, token = 'alice', id = 'planner-fixture', method = 'POST') {
  const res = { status(n) { this.code = n; return this; }, setHeader() {}, json(body) { this.body = body; } };
  await handler({ method, query: { id }, headers: { cookie: token ? `tokyo_trip_session=${token}` : '' }, body }, res);
  return res;
}
const invalid = [
  ['missing revision', b => delete b.expectedRevision, 'INVALID_EXPECTED_REVISION'],
  ['stale revision', b => b.expectedRevision--, 'TRIP_STALE'],
  ['unknown existing', b => b.days[0].items[0].ref += 'x', 'UNKNOWN_EXISTING_ITEM_REF'],
  ['unknown saved', b => b.days[0].items[1].ref = 'app:nope', 'UNKNOWN_SAVED_PLACE_REF'],
  ['duplicate identity', b => b.days[0].items.push(b.days[0].items[1]), 'DUPLICATE_ITEM_REF'],
  ['missing existing', b => b.days[0].items.shift(), 'MISSING_EXISTING_ITEM'],
  ['invalid day', b => b.days[0].dayKey = '2/31', 'INVALID_DRAFT_DAYS'],
  ['duplicate day', b => b.days[1].dayKey = b.days[0].dayKey, 'INVALID_DRAFT_DAYS'],
  ['invalid time', b => b.days[0].items[1].startTime = '24:00', 'INVALID_START_TIME'],
  ['invalid duration', b => b.days[0].items[1].durationMinutes = 31, 'INVALID_DURATION'],
  ['missing AI duration', b => b.days[0].items[1].durationMinutes = null, 'INVALID_DURATION'],
  ['same start', b => b.days[0].items[1].startTime = '09:00', 'TIME_OVERLAP'],
  ['duration overlap', b => { b.days[0].items[0].durationMinutes = 180; }, 'TIME_OVERLAP'],
];
for (const [name, mutate, error] of invalid) test(`${name}: rejects, no partial writes, Trip bytes unchanged`, async () => {
  const { body } = fixture(); const before = store.get(tripKey); mutate(body);
  const result = await call(body);
  assert.equal(result.body.error, error); assert.equal(result.code, error === 'TRIP_STALE' ? 409 : 422);
  assert.equal(store.get(tripKey), before); assert.equal(writes, 0); assert.equal(external, 0);
});
for (const [name, token, id, status] of [['unauthenticated', '', 'planner-fixture', 401], ['nonmember', 'outsider', 'planner-fixture', 403], ['wrong trip', 'alice', 'missing', 404]]) {
  test(`${name}: rejects with zero writes`, async () => {
    const { body } = fixture(); const before = store.get(tripKey);
    assert.equal((await call(body, token, id)).code, status); assert.equal(writes, 0); assert.equal(store.get(tripKey), before);
  });
}
test('success: canonical metadata, unknown hours allowed, one write/revision, reload, no external calls', async () => {
  const { trip, body } = fixture();
  Object.assign(body.days[0].items[1], { name: 'FORGED', latitude: 0, longitude: 0, placeId: 'forged', openingHours: '24 hours' });
  const result = await call(body);
  assert.equal(result.code, 200); assert.equal(writes, 1); assert.equal(external, 0);
  assert.equal(result.body.revision, trip.revision + 1);
  assert.equal(result.body.itinerary['9/20'][1].name, '上野恩賜公園');
  assert.deepEqual(result.body.places, trip.places);
  assert.ok(!JSON.stringify(result.body).includes('FORGED'));
  assert.deepEqual((await call(null, 'alice', 'planner-fixture', 'GET')).body.itinerary, result.body.itinerary);
});
test('race at CAS fails closed', async () => {
  const { trip, body } = fixture();
  const changed = JSON.stringify({ ...trip, title: 'Another edit', revision: trip.revision + 1 });
  beforeCas = () => store.set(tripKey, changed);
  assert.equal((await call(body)).code, 409); assert.equal(writes, 0); assert.equal(store.get(tripKey), changed);
});
test('known hours reject forged metadata with readable canonical details and zero writes', async () => {
  const { trip, body } = fixture();
  const place = trip.places.find(p => p.id === 'fixture-ueno-park');
  place.regularOpeningPeriods = { v: 1, status: 'known', placeId: place.placeId, periods: [{ open: { day: 0, hour: 12, minute: 0 }, close: { day: 0, hour: 18, minute: 0 } }] };
  store.set(tripKey, JSON.stringify(trip)); const before = store.get(tripKey);
  const result = await call(body); assert.equal(result.body.error, 'OPENING_HOURS_CONFLICT');
  assert.equal(result.body.detail.name, place.name); assert.deepEqual(result.body.detail.openingWindows, ['12:00-18:00']);
  assert.equal(writes, 0); assert.equal(store.get(tripKey), before);
});

for (const mutation of ['time', 'duration', 'day']) test(`protected flight ${mutation} mutation rejects without writing`, async () => {
  const { trip, body } = fixture();
  trip.flights = [{id:'flight',departureTime:'08:00'}];
  trip.itinerary['9/20'][0] = {type:'flight',flightId:'flight',time:'08:00'};
  body.days[0].items[0].startTime = '08:00';
  if (mutation === 'time') body.days[0].items[0].startTime = '10:00';
  if (mutation === 'duration') body.days[0].items[0].durationMinutes = 90;
  if (mutation === 'day') body.days[1].items.push(body.days[0].items.shift());
  store.set(tripKey,JSON.stringify(trip)); const before=store.get(tripKey);
  assert.equal((await call(body)).body.error,'PROTECTED_ITEM_MUTATION');
  assert.equal(store.get(tripKey),before); assert.equal(writes,0); assert.equal(external,0);
});
test('more than five manual stops, many additions and changed original still one write and one revision', async()=>{
  const {trip,body}=fixture();
  body.days[0].items=[body.days[0].items[0]];
  body.days[0].items[0].startTime='07:00';
  for(const [i,slug] of ['ueno-park','tnm','skytree','tsukiji','ginza-mitsukoshi','meiji'].entries())
    body.days[0].items.push({ref:key(slug),startTime:`${String(9+i).padStart(2,'0')}:00`,durationMinutes:30});
  body.days[0].items.reverse();
  const result=await call(body); assert.equal(result.code,200);assert.equal(writes,1);assert.equal(result.body.revision,trip.revision+1);
  assert.deepEqual(result.body.itinerary['9/20'].map(i=>i.time),body.days[0].items.map(i=>i.startTime));
  assert.deepEqual((await call(null,'alice','planner-fixture','GET')).body.itinerary,result.body.itinerary);assert.equal(external,0);
});
test('legacy item without durable ID uses revision scoped reference without migration or guessed duration',async()=>{
  const {trip,body}=fixture();delete trip.itinerary['9/20'][0].id;store.set(tripKey,JSON.stringify(trip));
  const result=await call(body);assert.equal(result.code,200);
  assert.equal(result.body.itinerary['9/20'][0].id,undefined);assert.equal(result.body.itinerary['9/20'][0].durationMinutes,undefined);
});
test('human date/time override uses canonical days, never original AI exact/preferred or daily capacity rules',async()=>{
  const {body}=fixture();const item=body.days[0].items.pop();item.startTime='17:00';body.days[1].items.push(item);
  body.selected=[{ref:item.ref,dateOptions:[{dayKey:'9/20',mode:'exact',exactTime:'11:00'}]}];
  const result=await call(body);assert.equal(result.code,200);assert.equal(result.body.itinerary['9/21'][0].time,'17:00');
});
test('Apply fails closed when Redis scripting is unavailable, without fallback SET',async()=>{
  const {body}=fixture();const before=store.get(tripKey),originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>JSON.parse(options.body)[0]==='EVAL'?new Response(JSON.stringify({error:'ERR EVAL unavailable'})):originalFetch(url,options);
  try{
    const fresh=(await import('../api/trip.mjs?apply-without-scripting')).default;
    const res={status(n){this.code=n;return this},setHeader(){},json(body){this.body=body}};
    await fresh({method:'POST',query:{id:'planner-fixture'},headers:{cookie:'tokyo_trip_session=alice'},body},res);
    assert.equal(res.code,503);assert.equal(res.body.error,'ATOMIC_WRITE_UNAVAILABLE');assert.equal(writes,0);assert.equal(store.get(tripKey),before);
  }finally{globalThis.fetch=originalFetch}
});

test('one Apply is restored by one atomic revision-bound Undo; stale Undo cannot overwrite', async () => {
  const { trip, body } = fixture();
  const applied = await call(body);
  assert.equal(applied.code, 200);
  const undo = { ...trip, expectedRevision: applied.body.revision, requireAtomic: true };
  const restored = await call(undo, 'alice', 'planner-fixture', 'PUT');
  assert.equal(restored.code, 200);
  assert.deepEqual(restored.body.itinerary, trip.itinerary);
  assert.equal(restored.body.revision, trip.revision + 2);
  assert.equal(writes, 2);
  const before = store.get(tripKey);
  assert.equal((await call(undo, 'alice', 'planner-fixture', 'PUT')).code, 409);
  assert.equal(store.get(tripKey), before); assert.equal(writes, 2); assert.equal(external, 0);
});
