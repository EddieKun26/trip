import test from 'node:test';
import assert from 'node:assert/strict';
import { planningSnapshot, parsePlanText, importPlanText } from '../lib/external-planner.mjs';
import { reconstructPlan } from '../lib/ai-trip-planner-apply.mjs';
import { plannerTrip, key, withHours, weeklyPeriods } from './fixtures/ai-planner-fixtures.mjs';

const make = (trip=plannerTrip(),selected=[{ref:key('sensoji'),dateOptions:[]}]) => ({trip,...planningSnapshot(trip,{expectedRevision:trip.revision,selected})});
const text = (s,lines,day=s.days[0].isoDate) => `規劃格式：PLAN-TEXT-V1\n規劃識別：${s.planningId}\n【${day}】\n${lines}`;
const required = s => s.candidates.find(c=>c.required).ref.toUpperCase();
const rejects=(fn,code)=>assert.throws(fn,e=>e.code===code,code);

test('snapshot refs and hash survive place/selection order, canonical facts only; changes stale old text',()=>{
  const selected=[{ref:key('sensoji'),dateOptions:[]},{ref:key('gyoen'),dateOptions:[]}],a=make(plannerTrip(),selected);
  const b=make({...a.trip,places:[...a.trip.places].reverse()},[...selected].reverse());
  assert.deepEqual(a.snapshot,b.snapshot);
  const changed={...a.trip,places:a.trip.places.map(p=>({...p,name:p.name+' changed'}))};
  rejects(()=>importPlanText(changed,{snapshot:a.snapshot,text:''}),'PLANNING_SNAPSHOT_STALE');
  rejects(()=>importPlanText({...a.trip,revision:99},{snapshot:a.snapshot,text:''}),'TRIP_STALE');
  assert.match(a.document,/一定要安排/);assert.match(a.document,/可以安排，也可以不安排/);
  assert.doesNotMatch(a.document,/google-fixture|app:fixture|Synthetic fixture address/);
});

test('raw and one fenced document parse; edited display name never changes canonical identity',()=>{
  const {trip,snapshot}=make(); const raw=text(snapshot,`10:00｜90 分鐘｜任意改寫名稱【${required(snapshot)}】`);
  const fenced=parsePlanText('```text\n'+raw+'\n```',snapshot);assert.equal(fenced.days[0].items[0].line,5);fenced.days[0].items[0].line=4;assert.deepEqual(parsePlanText(raw,snapshot),fenced);
  const before=JSON.stringify(trip),{preview}=importPlanText(trip,{snapshot,text:raw});
  assert.equal(preview.days[0].items[0].name,'淺草寺');assert.equal(preview.days[0].items[0].ref,key('sensoji'));
  assert.equal(JSON.stringify(trip),before);assert.equal(preview.summary.savedCount,0);
});

for(const [label,mutate] of [
  ['wrong id',s=>s.replace(/PLN-[A-Z0-9]+/,'PLN-WRONG')],['bad time',s=>s.replace('10:00','25:00')],
  ['bad duration',s=>s.replace('90 分鐘','31 分鐘')],['invented ref',s=>s.replace(/【P\d+】/,'【P999】')],
  ['missing required',s=>s.split('\n').slice(0,3).join('\n')],['duplicate ref',s=>s+'\n'+s.split('\n').at(-1)],
  ['outside trip',s=>s.replace(/【2026-\d\d-\d\d】/,'【2030-01-01】')],['extra prose',s=>s+'\nHere is your plan'],
  ['bad delimiters',s=>s.replaceAll('｜','|')],['two fences',s=>'```\n'+s+'\n```\n```\n'+s+'\n```'],
]) test(`parser rejects ${label}, supplies line diagnostics`,()=>{
  const {snapshot}=make(),raw=text(snapshot,`10:00｜90 分鐘｜名稱【${required(snapshot)}】`);
  assert.throws(()=>parsePlanText(mutate(raw),snapshot),e=>e.code==='PLAN_TEXT_INVALID'&&Boolean(e.detail.errors?.length||e.detail.message));
});

test('required allowed dates/exact time/duration and structured whole-visit hours enforced',()=>{
  const trip=plannerTrip();trip.places=trip.places.map(p=>p.id==='fixture-sensoji'?withHours(p,weeklyPeriods('09:00','12:00')):p);
  const {snapshot}=make(trip,[{ref:key('sensoji'),dateOptions:[{dayKey:'9/23',mode:'exact',exactTime:'10:00'}],durationMinutes:90}]);
  for(const [time,duration,day] of [['11:00',90,'2026-09-23'],['10:00',90,'2026-09-22'],['10:00',60,'2026-09-23']])
    rejects(()=>importPlanText(trip,{snapshot,text:text(snapshot,`${time}｜${duration} 分鐘｜A【${required(snapshot)}】`,day)}),'PLAN_TEXT_CONFLICT');
  assert.match(planningSnapshot(trip,{expectedRevision:7,selected:[{ref:key('sensoji'),durationMinutes:90,dateOptions:[]}]}).document,/停留時間：90 分鐘/);
  rejects(()=>make(trip,[{ref:key('sensoji'),dateOptions:[{dayKey:'9/23',mode:'exact',exactTime:'11:30'}],durationMinutes:90}]),'PLANNER_CONSTRAINTS_INFEASIBLE');
});

test('unknown suggestions receive independent ephemeral refs; Apply rejects them with no canonical mutation',()=>{
  const {trip,snapshot}=make(),raw=text(snapshot,`10:00｜60 分鐘｜A【${required(snapshot)}】\n14:00｜90 分鐘｜新建議【新地點】`);
  const before=JSON.stringify(trip),a=importPlanText(trip,{snapshot,text:raw}).preview,b=importPlanText(trip,{snapshot,text:raw}).preview;
  const item=a.days[0].items[1];assert.equal(item.unresolved,true);assert.match(item.ref,/^unresolved:/);
  assert.notEqual(item.ref,b.days[0].items[1].ref);assert.equal(item.name,'新建議');assert.equal(item.kind,'unknown');
  const days=a.days.map(d=>({dayKey:d.dayKey,items:d.items.map(i=>({ref:i.ref,startTime:i.startTime||i.time,durationMinutes:i.durationMinutes??null}))}));
  rejects(()=>reconstructPlan(trip,{expectedRevision:trip.revision,days}),'UNKNOWN_SAVED_PLACE_REF');assert.equal(JSON.stringify(trip),before);
});

test('existing items/flights survive importing editable text; no source identity accepted from names',()=>{
  const base=plannerTrip(),trip={...base,itinerary:{'9/22':[{id:'old',name:'上野恩賜公園',time:'08:00',durationMinutes:60}]}},r=make(trip);
  const preview=importPlanText(trip,{snapshot:r.snapshot,text:text(r.snapshot,`10:00｜90 分鐘｜not authoritative【${required(r.snapshot)}】`)}).preview;
  assert.equal(preview.days[0].items[0].ref,'existing:7:9/22:0');assert.equal(preview.days[0].items[0].durationMinutes,60);
  const days=preview.days.map(d=>({dayKey:d.dayKey,items:d.items.map(i=>({ref:i.ref,startTime:i.startTime||i.time,durationMinutes:i.durationMinutes??null}))}));
  const updated=reconstructPlan(trip,{expectedRevision:7,days});assert.deepEqual(updated.itinerary['9/22'][0],trip.itinerary['9/22'][0]);
});

test('malformed snapshot/request fail with domain errors, optional may be omitted',()=>{
  const trip=plannerTrip();for(const selected of [null,{},[null],[{}]])rejects(()=>planningSnapshot(trip,{expectedRevision:7,selected}),'INVALID_PLANNER_REQUEST');
  const {snapshot}=make(trip,[]);assert.equal(importPlanText(trip,{snapshot,text:text(snapshot,'')}).preview.summary.savedCount,0);
});
