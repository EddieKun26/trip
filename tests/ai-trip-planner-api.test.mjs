import test from 'node:test';
import {readdirSync} from 'node:fs';
import G from '../lib/planning-geography.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import handler from '../api/trip.mjs';
import { plannerTrip, key } from './fixtures/ai-planner-fixtures.mjs';
import { plannerTripDays } from '../lib/ai-trip-planner.mjs';
import { existingRef } from '../lib/ai-trip-planner-apply.mjs';
import { openingHoursKey } from '../lib/opening-hours-sidecar.mjs';

process.env.KV_REST_API_URL = 'https://apply-redis.invalid';
process.env.KV_REST_API_TOKEN = 'fixture';
const tripKey = 'tokyo-family-trip:trip:planner-fixture';
let store, writes, external, beforeCas, commands;
globalThis.fetch = async (url, options) => {
  if (url !== process.env.KV_REST_API_URL) { external++; throw new Error('UNEXPECTED_EXTERNAL_CALL'); }
  const c = JSON.parse(options.body); commands.push(c);
  let result;
  if (c[0] === 'GET') result = store.get(c[1]) ?? null;
  else if (c[0] === 'MGET') result = c.slice(1).map(key => store.get(key) ?? null);
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
  store = new Map([[tripKey, JSON.stringify(trip)]]); writes = 0; external = 0; beforeCas = null; commands = [];
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
const snapshotBody = revision=>({action:'planningSnapshot',expectedRevision:revision,selected:[{ref:key('ueno-park'),dateOptions:[]}]});
const assertReadOnly=before=>{assert.equal(store.get(tripKey),before);assert.equal(writes,0);assert.equal(external,0);assert.ok(!commands.some(c=>['INCR','EXPIRE','SET'].includes(c[0])||JSON.stringify(c).includes('ai-planner:')));};

test('existing route count remains exactly twelve',()=>assert.equal(readdirSync(new URL('../api',import.meta.url)).filter(f=>f.endsWith('.mjs')).length,12));
for(const action of ['plan','planningSnapshot','importPlanText','validatePlan'])for(const [token,status] of [['',401],['outsider',403]])test(`${action}: membership before metadata/model/quota work`,async()=>{
  fixture();const before=store.get(tripKey);assert.equal((await call({action},token)).code,status);assertReadOnly(before);
});
test('retired built-in plan returns 410 regardless of old model configuration, no quota/model calls',async()=>{
  fixture();Object.assign(process.env,{AI_PLANNER_MODEL:'old',AI_PLANNER_DAILY_LIMIT:'bad',OPENAI_API_KEY:'fixture'});
  const before=store.get(tripKey),r=await call({action:'plan'});assert.equal(r.code,410);assert.equal(r.body.error,'BUILT_IN_PLANNER_REMOVED');assertReadOnly(before);
});
test('authenticated snapshot/import/validation read only; Apply uses canonical facts and atomic CAS once',async()=>{
  const {trip}=fixture(),before=store.get(tripKey);
  const r=await call(snapshotBody(trip.revision));assert.equal(r.code,200,JSON.stringify(r.body));
  const s=r.body.snapshot,ref=s.candidates.find(c=>c.key===key('ueno-park')).ref.toUpperCase();
  const text=`規劃格式：PLAN-TEXT-V1\n規劃識別：${s.planningId}\n【2026-09-20】\n11:00｜90 分鐘｜假的名稱【${ref}】`;
  const imported=await call({action:'importPlanText',snapshot:s,text});assert.equal(imported.code,200,JSON.stringify(imported.body));
  const days=imported.body.preview.days.map(d=>({dayKey:d.dayKey,items:d.items.map(i=>({ref:i.ref,startTime:i.startTime||i.time,durationMinutes:i.durationMinutes??null}))}));
  assert.equal((await call({action:'validatePlan',expectedRevision:trip.revision,days})).code,200);assertReadOnly(before);
  const applied=await call({action:'applyPlan',expectedRevision:trip.revision,days});assert.equal(applied.code,200);assert.equal(writes,1);assert.equal(applied.body.revision,trip.revision+1);assert.equal(external,0);
  assert.equal(applied.body.itinerary['9/20'][1].name,'上野恩賜公園');
});
test('stale/malformed requests and unresolved Apply return errors with unchanged trip',async()=>{
  const {trip,body}=fixture(),before=store.get(tripKey);
  assert.equal((await call(snapshotBody(trip.revision-1))).code,409);
  assert.equal((await call({...snapshotBody(trip.revision),selected:[null]})).code,400);
  body.days[0].items[1].ref='unresolved:opaque';assert.equal((await call(body)).body.error,'UNKNOWN_SAVED_PLACE_REF');assertReadOnly(before);
});
test('PUT blocks new unresolved direct and trusted legacy URL identities; preserves an existing unresolved area unchanged',async()=>{
  const {trip}=fixture();const old={...trip.places[0],travelAreaKey:'',travelAreaZh:'',travelAreaLocal:'',travelAreaResolved:false,travelAreaResolutionStatus:'unresolved'};
  trip.places[0]=old;store.set(tripKey,JSON.stringify(trip));const before=store.get(tripKey);
  for(const p of [{...old,id:'new',placeId:'google-new'},{...old,id:'url',placeId:'',sourceUrl:'https://www.google.com/maps/?query_place_id=google-new'}]){
    const r=await call({...trip,places:[...trip.places,p],expectedRevision:7,requireAtomic:true},'alice',trip.id,'PUT');
    assert.equal(r.body.error,'INVALID_CANONICAL_AREA_REQUIRED');assertReadOnly(before);
  }
  const saved=await call({...trip,title:'Changed title',expectedRevision:7,requireAtomic:true},'alice',trip.id,'PUT');assert.equal(saved.code,200,JSON.stringify(saved.body));assert.equal(writes,1);
});
test('PUT accepts explicitly confirmed broad area through the normal ingestion boundary',async()=>{
  const {trip}=fixture();const candidate={...trip.places[0],id:'new-yoyogi',placeId:'google-yoyogi',name:'New place',...G.manualAreaFields('yoyogi')};
  const r=await call({...trip,places:[...trip.places,candidate],expectedRevision:7,requireAtomic:true},'alice',trip.id,'PUT');assert.equal(r.code,200,JSON.stringify(r.body));assert.equal(r.body.places.at(-1).travelAreaKey,'yoyogi');assert.equal(writes,1);
});
