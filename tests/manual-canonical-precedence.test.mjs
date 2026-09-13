import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import audit from '../lib/travel-area-audit.js';
import tripHandler from '../api/trip.mjs';
import { resolveTravelArea } from '../lib/planning-region.mjs';

const catalog=JSON.parse(readFileSync(new URL('../data/area-geometry/travel-area-boundaries.json',import.meta.url),'utf8'));
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function section(start,end) {
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a);
  return app.slice(a,b);
}
function hydrationContext() {
  const context=vm.createContext({TravelAreaAudit:audit,state:{},dateMeta:[],tripIsHydrated:()=>false,
    normalizedPlaceKind:p=>p.kind,withStoredTabelogLink:p=>p,buildDateMeta:()=>[],
    syncFlightItineraryItems:()=>{},resetUndoBaseline:()=>{},scheduleContainmentMigration:()=>{},scheduleTagBackfillMigration:()=>{}});
  vm.runInContext(section('const TRAVEL_AREA_RESOLUTION_VERSION','function placeVoters')
    +section('function applyPlanningRegionResolution','function planningRegionResolutionKey')
    +section('function applySharedTrip','// A whitelisted tag string'),context);
  return context;
}
const copy=value=>JSON.parse(JSON.stringify(value));
function manual(key='omotesando',zh='表參道',local='表参道') {
  return {id:`test-${key}`,placeId:`test-google-${key}`,name:'Synthetic precedence test',kind:'shopping',
    travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,travelAreaManuallySet:true,
    travelAreaSource:'manual',travelAreaResolver:'MANUAL',travelAreaResolved:true,travelAreaResolutionVersion:5,
    planningRegion:'原宿／表參道',planningRegionOriginal:'原宿／表参道',
    area:'raw area',areaOriginal:'raw local area',areaResolvedByGoogle:true,areaManuallySet:false,areaResolutionVersion:5,
    areaTags:['神宮前'],restaurantTags:[],countryCode:'JP',
    addressComponentsOriginal:[{longText:'原宿',types:['sublocality_level_2']}],
    photos:[{name:'synthetic-photo'}],notes:'unchanged'};
}
test('manual canonical wins over stale composite evidence by either existing manual condition',()=>{
  for(const flags of [{travelAreaManuallySet:true,travelAreaSource:'automatic'},
    {travelAreaManuallySet:false,travelAreaSource:'manual'},
    {travelAreaManuallySet:true,travelAreaSource:'manual'}]) {
    const place={...manual(),...flags},before=copy(place);
    assert.equal(audit.reclassify(place,catalog),place);
    assert.deepEqual(place,before);
    const context=hydrationContext();
    context.ensureTravelAreaFields(place);
    assert.deepEqual(place,before);
  }
});
test('manual reviewed identities ignore stale ward compatibility without any catalog alias',()=>{
  for(const [key,zh,local,ward] of [['nakameguro','中目黑','中目黒','目黑'],
    ['jiyugaoka','自由之丘','自由が丘','目黑'],['ichigaya','市谷','市ヶ谷','千代田']]) {
    const place={...manual(key,zh,local),planningRegion:ward};
    assert.equal(audit.reclassify(place,catalog),place);
    const context=hydrationContext(),before=copy(place);
    context.applyPlanningRegionResolution(place,{travelAreaKey:'shibuya',travelAreaZh:'澀谷',travelAreaLocal:'渋谷',
      travelAreaResolved:true,travelAreaResolutionVersion:5});
    assert.deepEqual(place,before);
  }
});
test('real Trip PUT -> GET -> hydration -> forced v5 apply preserves manual identity and legacy/raw fields',async()=>{
  const originalFetch=globalThis.fetch;
  const envNames=['KV_REST_API_URL','KV_REST_API_TOKEN'];
  const oldEnv=Object.fromEntries(envNames.map(key=>[key,process.env[key]]));
  process.env.KV_REST_API_URL='https://synthetic-redis.invalid';process.env.KV_REST_API_TOKEN='synthetic-not-a-real-secret';
  const place=manual(),trip={id:'synthetic-manual-trip',title:'Synthetic',destination:'東京',revision:1,
    publicRead:false,members:{member:'Tester'},places:[place],votes:{},itinerary:{},transports:[]};
  const session='synthetic-session',sessionHash=createHash('sha256').update(session).digest('hex');
  const storage=new Map([
    [`tokyo-family-trip:trip:${trip.id}`,JSON.stringify(trip)],
    [`tokyo-family-trip:session:${sessionHash}`,JSON.stringify({id:'member',nickname:'Tester'})]
  ]);
  let writes=0;
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://synthetic-redis.invalid');
    const [op,key,value]=JSON.parse(options.body);
    assert.ok(['GET','SET'].includes(op));
    if(op==='SET'){writes++;storage.set(key,value);}
    return {ok:true,json:async()=>({result:op==='GET'?storage.get(key)||null:'OK'})};
  };
  async function request(method,body) {
    let result;
    const response={statusCode:0,status(n){this.statusCode=n;return this;},setHeader(){return this;},json(payload){result=payload;}};
    await tripHandler({method,body,query:{id:trip.id},headers:{cookie:`tokyo_trip_session=${session}`}},response);
    assert.equal(response.statusCode,200);
    return result;
  }
  try {
    const saved=await request('PUT',copy(trip));
    assert.deepEqual(saved.places[0],place);
    const loaded=await request('GET');assert.equal(writes,1);
    const context=hydrationContext();context.applySharedTrip(copy(loaded));
    const hydrated=context.state.places[0];
    assert.deepEqual(copy(hydrated),place);
    context.applyPlanningRegionResolution(hydrated,{travelAreaKey:'harajuku',travelAreaZh:'原宿',travelAreaLocal:'原宿',travelAreaResolved:true,travelAreaResolutionVersion:5});
    assert.deepEqual(copy(hydrated),place);
    assert.equal(audit.reclassify(hydrated,catalog),hydrated);
  } finally {
    globalThis.fetch=originalFetch;
    for(const key of envNames)if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];
  }
});
test('ordinary automatic split/resolver behavior remains unchanged; R01 unresolved is not fabricated',()=>{
  const automatic={...manual(),travelAreaManuallySet:false,travelAreaSource:'automatic'};
  assert.equal(audit.reclassify(automatic,catalog).travelAreaKey,'harajuku');
  const result=resolveTravelArea({countryCode:'JP',originalAddressComponents:[
    {longText:'恵比寿西',types:['sublocality_level_2']},{longText:'渋谷区',types:['locality']} ]});
  assert.equal(result.travelAreaResolved,false);
  assert.equal(result.travelAreaKey,'');
  assert.equal(result.travelAreaResolutionError,'AMBIGUOUS_EBISU_DAIKANYAMA');
});
