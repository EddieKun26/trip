import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import mig from '../lib/canonical-travel-migration.js';
import {gateContext,section,tick} from './helpers/canonical-gate.mjs';

test('H1 waiting hydration is silent and performs no reads, writes, scheduler or abort latch', async()=>{
  const {context:c,calls,registry}=gateContext({ready:false});
  assert.equal(c.canonicalAreaReadiness(),'HYDRATION_NOT_READY');
  const result=await c.scheduleCanonicalAreaMigration();
  assert.equal(result.outcome,'WAITING_HYDRATION'); assert.equal(result.schedulersReleased,false);
  assert.equal(registry().values().next().value.status,'waiting-hydration');
  assert.equal(calls.requests.length+calls.runs+calls.containment+calls.backfill+calls.toasts.length+calls.infos.length,0);
});

test('H2 actual hydration-ready transition explicitly retries at the same revision', async()=>{
  const {context:c,calls}=gateContext({ready:false,outcome:mig.MARKER_NOOP});
  Object.assign(c,{sharedSyncBusy:false,tripReadSequence:0,mapInteractionUntil:0,dateMeta:[],
    normalizedPlaceKind:p=>p.kind,withStoredTabelogLink:p=>p,ensureTravelAreaFields:p=>p,buildDateMeta:()=>[],
    syncFlightItineraryItems:()=>{},resetUndoBaseline:()=>{},restoreUiPreference:()=>{},persist:()=>{},
    window:{setTimeout:()=>{}},resolveStoredPlacePlanningRegions:()=>{},expireAppSession:()=>{},loadTrips:()=>{},
    readAppJson:async()=>({ok:true,status:200,payload:{id:mig.TRIP,revision:261,places:[]}})});
  c.state.sharedRevision=261;
  vm.runInContext(section('function applySharedTrip','/* The Place-writing schedulers')
    +section('async function loadSharedTrip','function guestOnlyMessage'),c);
  assert.equal((await c.scheduleCanonicalAreaMigration()).outcome,'WAITING_HYDRATION');
  assert.equal(await c.loadSharedTrip({hydrating:true,force:true}),'ready');
  await tick();
  assert.equal(c.state.sharedRevision,261); assert.equal(calls.runs,1);
  assert.equal(calls.containment,1);assert.equal(c.canonicalAreaReadiness(),'READY_EDITOR');
});

test('H3/H8 membership authorizes a ready editor without a hard-coded owner ID', async()=>{
  const {context:c,calls}=gateContext();
  assert.equal(c.canEdit(),true); assert.equal(c.canonicalAreaReadiness(),'READY_EDITOR');
  await c.scheduleCanonicalAreaMigration();assert.equal(calls.runs,1);
});

test('H4/H9 ready read-only membership has a silent, logged terminal and no write paths', async()=>{
  for(const guest of [true,false]){
    const {context:c,calls,registry}=gateContext({editor:false});c.state.isGuest=guest;
    assert.equal(c.canEdit(),false);assert.equal(c.canonicalAreaReadiness(),'READY_READ_ONLY');
    const result=await c.scheduleCanonicalAreaMigration();assert.equal(result.outcome,'read-only');
    assert.equal(registry().values().next().value.status,'read-only');
    assert.equal(calls.runs+calls.requests.length+calls.containment+calls.backfill,0);
    assert.equal(calls.toasts.length,0);assert.equal(calls.infos.length,1);
  }
});

test('H5/H6 waiting A ignores stale ready callback on B and runs once after returning ready',async()=>{
  const {context:c,calls,readyNow}=gateContext({ready:false});
  await c.scheduleCanonicalAreaMigration();readyNow('trip-b');c.tripContextVersion=2;
  assert.equal(await c.canonicalAreaHydrationReady(mig.TRIP,1),null);assert.equal(calls.runs,0);
  readyNow(mig.TRIP);c.tripContextVersion=3;
  await c.canonicalAreaHydrationReady(mig.TRIP,3);await c.canonicalAreaHydrationReady(mig.TRIP,3);
  assert.equal(calls.runs,1);
});

test('H7 ready with null, undefined or empty Trip never creates a registry key',async()=>{
  for(const id of [null,undefined,'',' ']){
    const {context:c,calls,registry}=gateContext();c.state.tripId=id;
    await c.canonicalAreaHydrationReady(id,1);await c.scheduleCanonicalAreaMigration();
    assert.equal(registry().size,0);assert.equal(calls.runs+calls.containment+calls.backfill,0);
  }
});

async function executionFixture(){
  const before={id:mig.TRIP,revision:261,places:[{placeId:'P1',travelAreaKey:'shibuya',travelAreaZh:'澀谷',travelAreaLocal:'渋谷',
    travelAreaResolved:true,travelAreaResolutionStatus:'resolved',areaTags:['raw'],latitude:35.66,longitude:139.7,
    formattedAddress:'synthetic',addressComponentsOriginal:[]}]};
  const after={travelAreaKey:'ebisu',travelAreaZh:'惠比壽',travelAreaLocal:'恵比寿',travelAreaResolved:true,
    travelAreaResolutionStatus:'resolved',travelAreaManuallySet:true,travelAreaSource:'manual',travelAreaResolver:'MANUAL',
    travelAreaResolutionVersion:5,travelAreaResolutionError:''};
  const manifest={tripId:mig.TRIP,placeCount:1,placeStableIds:['google:P1'],rows:[{stableId:'google:P1',after}],
    baselineFields:await mig.stateFieldHashes(before.places,['google:P1'])};
  manifest.preFingerprint=await mig.stateFingerprint(await mig.approvedPreFieldHashes(manifest));
  manifest.postFingerprint=await mig.stateFingerprint(await mig.approvedPostFieldHashes(manifest));
  return {before,manifest};
}

test('S1 concurrent same-key callers share one Promise, one A/B pair and one conditional write',async()=>{
  const {before,manifest}=await executionFixture();let stored=structuredClone(before),gets=0,puts=0,unblock,readA;
  const barrier=new Promise(r=>unblock=r);
  const reachedReadA=new Promise(r=>readA=r);
  const {context:c,calls,registry}=gateContext({execute:options=>mig.run(options),transport:async(url,options)=>{
    if(options.method==='PUT'){
      puts++;const {expectedRevision,...payload}=JSON.parse(options.body);assert.equal(expectedRevision,stored.revision);
      stored={...payload,revision:262};return {ok:true,payload:{...stored,writeMode:'atomic'}};
    }
    gets++;if(gets===2){readA();await barrier;}return {ok:true,payload:structuredClone(stored)};
  }});
  c.CanonicalTravelManifest=manifest;c.CanonicalTravelCatalog={catalog:{shibuya:{},ebisu:{}}};
  const first=c.scheduleCanonicalAreaMigration();await reachedReadA;assert.equal(gets,2);
  const second=c.scheduleCanonicalAreaMigration();assert.equal(first,second);
  assert.equal(registry().values().next().value.status,'in-progress');assert.equal(calls.containment+calls.backfill,0);
  unblock();const [a,b]=await Promise.all([first,second]);assert.equal(a,b);assert.equal(a.outcome,mig.MIGRATED);
  assert.equal(gets,4);assert.equal(puts,1);assert.equal(calls.runs,1);assert.equal(calls.toasts.length,0);
});

test('S2/S3 ABORT survives switch away/back and both schedulers remain suspended',async()=>{
  const {context:c,calls,readyNow}=gateContext({outcome:mig.ABORT});
  const first=await c.scheduleCanonicalAreaMigration();readyNow('trip-b');await c.scheduleCanonicalAreaMigration();
  const count=calls.containment;readyNow(mig.TRIP);assert.equal(await c.scheduleCanonicalAreaMigration(),first);
  assert.equal(calls.runs,1);assert.equal(calls.containment,count);assert.equal(calls.backfill,count);
});

test('S4 fresh page creates a fresh registry and permits retry after prior ABORT',async()=>{
  const a=gateContext({outcome:mig.ABORT});await a.context.scheduleCanonicalAreaMigration();
  const b=gateContext();await b.context.scheduleCanonicalAreaMigration();assert.equal(b.calls.runs,1);
  assert.notEqual(a.registry(),b.registry());
});

test('S5 success survives switch away/back without duplicate migration',async()=>{
  const {context:c,calls,readyNow}=gateContext();const first=await c.scheduleCanonicalAreaMigration();
  readyNow('trip-b');await c.scheduleCanonicalAreaMigration();readyNow(mig.TRIP);
  assert.equal(await c.scheduleCanonicalAreaMigration(),first);assert.equal(calls.runs,1);
});

test('in-progress A stays bound to A when the active Trip switches to B',async()=>{
  const {before,manifest}=await executionFixture();let stored=before,continueRead;
  const wait=new Promise(r=>continueRead=r);const urls=[];
  const {context:c,calls,readyNow}=gateContext({execute:options=>mig.run(options),transport:async(url,options)=>{
    urls.push(url);if(!options.method){await wait;return {ok:true,payload:structuredClone(stored)};}
    const {expectedRevision,...payload}=JSON.parse(options.body);stored={...payload,revision:expectedRevision+1};
    return {ok:true,payload:{...stored,writeMode:'atomic'}};
  }});
  c.CanonicalTravelManifest=manifest;c.CanonicalTravelCatalog={catalog:{shibuya:{},ebisu:{}}};
  const a=c.scheduleCanonicalAreaMigration();await tick();readyNow('trip-b');continueRead();
  const result=await a;assert.equal(result.outcome,mig.MIGRATED);
  assert.ok(urls.every(url=>url==='/api/trip?id='+mig.TRIP));assert.equal(c.state.tripId,'trip-b');
  assert.equal(calls.applied+calls.containment+calls.backfill+calls.toasts.length,0);
});

test('S8/S9 null, undefined, unknown status and exceptions fail closed with a silent, console-only ABORT',async()=>{
  for(const execute of [async()=>null,async()=>undefined,async()=>({outcome:'unexpected',schedulersReleased:true}),
    async()=>{throw Error('secret-cookie-value');},async()=>({outcome:mig.MIGRATED})]){
    const {context:c,calls}=gateContext({execute});const result=await c.scheduleCanonicalAreaMigration();
    assert.equal(result.outcome,mig.ABORT);assert.equal(calls.containment+calls.backfill,0);
    assert.equal(calls.warnings.length,1);assert.equal(calls.toasts.length,0);
    assert.ok(!JSON.stringify(calls).includes('secret-cookie-value'));
  }
});

test('every FIRST OPEN terminal is console-only and never shows a user-facing toast',async()=>{
  for(const value of [{outcome:mig.MIGRATED,writeMode:'atomic'},{outcome:mig.MIGRATED,writeMode:'cas-window'},
    {outcome:mig.MARKER_NOOP},{outcome:mig.RECOVERED},{outcome:mig.ABORT},{outcome:mig.ABORT,state:mig.POST}]){
    const {context:c,calls}=gateContext({execute:async()=>({...value,stage:'readback',schedulersReleased:mig.RELEASES_SCHEDULERS.has(value.outcome)})});
    await c.scheduleCanonicalAreaMigration();assert.equal(calls.toasts.length,0);assert.equal(calls.infos.length+calls.warnings.length,1);
  }
});

test('scheduler release allowlist suspends every nonterminal, read-only, abort and malformed result',()=>{
  const {context:c,calls}=gateContext();
  const suspended=['WAITING_HYDRATION','in-progress','read-only','abort','RECOVERY_ABORTED','UNKNOWN','unexpected'];
  for(const outcome of suspended)c.releaseCanonicalAreaSchedulers(mig.TRIP,{outcome,schedulersReleased:true});
  for(const result of [null,undefined,{},true,{outcome:mig.MIGRATED,schedulersReleased:false}])
    c.releaseCanonicalAreaSchedulers(mig.TRIP,result);
  assert.equal(calls.containment+calls.backfill,0);
  for(const outcome of [mig.MIGRATED,mig.RECOVERED,mig.MARKER_NOOP])
    c.releaseCanonicalAreaSchedulers(mig.TRIP,{outcome,schedulersReleased:true});
  assert.equal(calls.containment,3);assert.equal(calls.backfill,3);
});

test('read-only terminal remains accurate when the optional migration helper is unavailable',async()=>{
  const {context:c,calls}=gateContext({editor:false});c.CanonicalTravelMigration=undefined;
  const result=await c.scheduleCanonicalAreaMigration();
  assert.equal(result.outcome,'read-only');assert.equal(calls.toasts.length,0);
  assert.match(calls.infos[0],/outcome=read-only/);assert.match(calls.infos[0],/schedulers=suspended/);
  assert.equal(calls.runs+calls.containment+calls.backfill,0);
});

test('RECOVERY_ABORTED stays silent to the user but latched and logged after switching away and back',async()=>{
  const {context:c,calls,readyNow,registry}=gateContext({execute:async()=>({outcome:mig.ABORT,state:mig.POST,
    stage:'conditional-write',schedulersReleased:false})});
  const first=await c.scheduleCanonicalAreaMigration();
  assert.equal(calls.toasts.length,0);assert.match(calls.warnings[0],/state=POST/);
  readyNow('trip-b');await c.scheduleCanonicalAreaMigration();const releases=calls.containment;
  readyNow(mig.TRIP);assert.equal(await c.scheduleCanonicalAreaMigration(),first);
  assert.equal(registry().get(mig.TRIP+':'+mig.VERSION).status,'aborted');
  assert.equal(calls.runs,1);assert.equal(calls.containment,releases);assert.equal(calls.backfill,releases);
});
