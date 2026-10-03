import test from 'node:test';
import assert from 'node:assert/strict';
import {boot,trip,place,json} from './helpers/phase-c-browser.mjs';
import {planningSnapshot,importPlanText} from '../lib/external-planner.mjs';

const unknown=p=>({...p,detailsLocked:true,regularOpeningPeriods:{v:1,status:'unavailable',placeId:p.placeId,periods:[]}});
const places=()=>[unknown(place('ueno',{name:'上野博物館'})),unknown(place('harajuku',{name:'原宿商店',kind:'shopping'})),unknown(place('shinjuku',{name:'新宿餐廳',kind:'restaurant',restaurantTags:['拉麵']}))];
const reqs=(b,action)=>b.requests.filter(r=>JSON.parse(r.options.body||'{}').action===action);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(){const data=trip(places()),b=await boot(data);b.run('setTab("itinerary");setPlacePoolOpen(true)');return {b,data};}
async function exchange(b,data){
  b.run('togglePlacePoolSelection("app:synthetic-ueno")');const pending=b.run('v3CreateExchange()');await tick();
  const request=reqs(b,'planningSnapshot').at(-1);assert.ok(request);
  const result=planningSnapshot(data,JSON.parse(request.options.body));await b.reply(request,{snapshot:result.snapshot,document:result.document});await pending;return result;
}
async function draft(b,data,{suggestion=true}={}){
  const result=await exchange(b,data),s=result.snapshot,ref=s.candidates.find(c=>c.required).ref.toUpperCase();
  const text=`規劃格式：PLAN-TEXT-V1\n規劃識別：${s.planningId}\n【2026-09-20】\n10:00｜60 分鐘｜上野【${ref}】`+(suggestion?'\n14:00｜90 分鐘｜想加入的地點【新地點】':'');
  b.context.pasted=text;b.run('v3UI.text=pasted');const pending=b.run('v3ImportText()');await b.reply(reqs(b,'importPlanText').at(-1),importPlanText(data,{snapshot:s,text}));await pending;return b.run('placePoolPlanner.draft');
}

test('focused workspace groups by canonical area and shares stable Place identity',async()=>{
  const {b}=await setup();b.run('setTab("places")');assert.match(b.app.innerHTML,/data-v3-area="ueno"/);assert.match(b.app.innerHTML,/新宿餐廳/);
  const before=json(b.state.places);b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');assert.equal(b.run('v3UI.workspace.key'),'app:synthetic-ueno');
  assert.match(b.sheet.innerHTML,/v3-place-workspace/);assert.match(b.sheet.innerHTML,/data-v3-panel="schedule"/);assert.doesNotMatch(b.sheet.innerHTML,/data-v3-schedule>/);assert.match(b.sheet.innerHTML,/data-edit-place/);assert.match(b.sheet.innerHTML,/data-request-delete-place/);
  b.run('v3UI.workspace.time="13:15";openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');assert.equal(b.run('v3UI.workspace.time'),'13:15');
  b.run('closeSheet();setTab("map")');assert.match(b.app.innerHTML,/v3-map-sheet is-partial/);assert.match(b.app.innerHTML,/data-toggle-live-location/);assert.match(b.app.innerHTML,/data-v3-filter="nearby"/);
  b.context.window.matchMedia=()=>({matches:true});b.run('render({filterOnly:true})');assert.match(b.app.innerHTML,/v3-map-layout/);assert.doesNotMatch(b.app.innerHTML,/v3-timeline-column|v3-library/);
  assert.deepEqual(json(b.state.places),before);
});

test('snapshot double-submit blocked, deep frozen, preview/import read-only and copied text survives parse errors',async()=>{
  const {b,data}=await setup(),before=json(b.state.itinerary);b.run('togglePlacePoolSelection("app:synthetic-ueno")');
  const pending=b.run('v3CreateExchange()');b.run('v3CreateExchange()');assert.equal(reqs(b,'planningSnapshot').length,1);
  const result=planningSnapshot(data,JSON.parse(reqs(b,'planningSnapshot')[0].options.body));await b.reply(reqs(b,'planningSnapshot')[0],result);await pending;
  assert.equal(b.run('Object.isFrozen(v3UI.exchange.snapshot.candidates[0])'),true);
  b.run('v3UI.text="bad edited text"');const importing=b.run('v3ImportText()');b.run('v3ImportText()');assert.equal(reqs(b,'importPlanText').length,1);
  await b.reply(reqs(b,'importPlanText')[0],{error:'PLAN_TEXT_INVALID',detail:{message:'請修正',errors:[{line:4,message:'時間格式錯誤'}]}},422);await importing;
  assert.equal(b.run('v3UI.text'),'bad edited text');assert.match(b.app.innerHTML,/第 4 行/);assert.deepEqual(json(b.state.itinerary),before);assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);
});

test('closing or switching trip invalidates snapshot responses, including pending hours work',async()=>{
  const {b,data}=await setup();const pending=b.run('v3CreateExchange()');const request=reqs(b,'planningSnapshot')[0];
  b.run('setPlacePoolOpen(false)');await b.reply(request,planningSnapshot(data,{expectedRevision:1,selected:[]}));await pending;assert.equal(b.run('v3UI.exchange'),null);
  b.run('setPlacePoolOpen(true)');const late=b.run('v3CreateExchange()');const r=reqs(b,'planningSnapshot').at(-1);b.run('state.tripId="another";resetPlacePoolPlanner()');
  await b.reply(r,planningSnapshot(data,{expectedRevision:1,selected:[]}));await late;assert.equal(b.run('v3UI.exchange'),null);assert.equal(b.run('v3UI.exchangeBusy'),false);
});

test('unresolved suggestion blocks Apply, explicit existing-Place binding preserves date/time/duration/order and writes no Place',async()=>{
  const {b,data}=await setup();await draft(b,data);const before=json(b.state.itinerary),item=json(b.run('placePoolPlanner.draft.days[0].items[1]'));
  await b.run('applyPlannerDraft()');assert.equal(reqs(b,'applyPlan').length,0);assert.match(b.app.innerHTML,/確認所有新地點/);
  b.context.suggestion=item;b.context.match=places()[1];b.run('v3UI.resolve={ref:suggestion.ref,name:suggestion.name,candidates:[match]};v3ResolveMarkup()');
  const binding=b.run('v3BindSuggestion(0)');await tick();const check=reqs(b,'validatePlan').at(-1);assert.ok(check);await b.reply(check,{valid:true});await binding;
  const bound=json(b.run('placePoolPlanner.draft.days[0].items[1]'));assert.equal(bound.unresolved,false);assert.equal(bound.ref,'app:synthetic-harajuku');assert.equal(bound.startTime,item.startTime);assert.equal(bound.durationMinutes,item.durationMinutes);
  assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);assert.deepEqual(json(b.state.itinerary),before);
});

test('new suggestion must confirm area before canonical insertion; canonical response then binds and revalidates',async()=>{
  const {b,data}=await setup();await draft(b,data);b.context.candidate=unknown({...place('yoyogi'),id:undefined,placeId:'google-new',name:'New Google result',travelAreaKey:'',travelAreaZh:'',travelAreaLocal:'',travelAreaResolved:false});
  b.run('v3UI.resolve={ref:placePoolPlanner.draft.days[0].items[1].ref,name:"Suggestion",candidates:[candidate]};v3ResolveMarkup()');
  assert.match(b.sheet.innerHTML,/確認大區/);await b.run('v3BindSuggestion(0)');assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);
  b.run('Object.assign(candidate,PlanningGeography.manualAreaFields("yoyogi"))');
  const binding=b.run('v3BindSuggestion(0)');b.run('v3BindSuggestion(0)');const puts=b.requests.filter(r=>r.options.method==='PUT');assert.equal(puts.length,1);
  const body=JSON.parse(puts[0].options.body);assert.deepEqual(body.itinerary,data.itinerary);assert.equal(body.requireAtomic,true);assert.equal(body.places.at(-1).travelAreaKey,'yoyogi');
  await b.reply(puts[0],{...data,places:body.places,revision:2});await tick();const check=reqs(b,'validatePlan').at(-1);assert.ok(check);assert.equal(JSON.parse(check.options.body).expectedRevision,2);
  await b.reply(check,{error:'OPENING_HOURS_CONFLICT',detail:{name:'New Google result',startTime:'14:00',openingWindows:['17:00-22:00']}},422);await binding;
  assert.equal(b.run('placePoolPlanner.draft.days[0].items[1].name'),'New Google result');assert.match(b.app.innerHTML,/營業時間不符合/);assert.deepEqual(json(b.state.itinerary),data.itinerary);
});

test('normal shared workspace schedule uses atomic Apply and retains unsaved values on server conflict',async()=>{
  const {b}=await setup();b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false});v3UI.workspace.time="18:00";v3UI.workspace.duration=90');
  const pending=b.run('v3SaveSchedule()');b.run('v3SaveSchedule()');assert.equal(reqs(b,'applyPlan').length,1);const request=reqs(b,'applyPlan')[0];
  assert.equal(JSON.parse(request.options.body).days[0].items[0].durationMinutes,90);
  await b.reply(request,{error:'TRIP_STALE'},409);await pending;assert.equal(b.run('v3UI.workspace.time'),'18:00');assert.match(b.sheet.innerHTML,/行程已更新/);assert.deepEqual(json(b.state.itinerary),{});
});

const change=(b,dataset,value,checked)=>{b.context.v3Event={target:{dataset,value,checked}};return b.run('v3HandleChange(v3Event)');};
const press=(b,dataset)=>{b.context.v3Event={target:{closest:()=>({dataset})}};return b.run('v3HandleClick(v3Event)');};
test('V3 selection keeps every library row, constraints are local, unselect clears them',async()=>{
 const {b}=await setup(),before=json(b.state.places),requests=b.requests.length;
 press(b,{v3Select:'app:synthetic-ueno'});assert.equal(b.run('placePoolSelectedKeys().size'),1);
 assert.match(b.app.innerHTML,/data-v3-select="app:synthetic-ueno" aria-pressed="true"/);
 assert.equal((b.app.innerHTML.match(/data-v3-place-key=/g)||[]).length,3);
 b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
 change(b,{v3Allowed:'9/20'},'',true);change(b,{v3Mode:''},'exact');change(b,{v3Time:''},'11:15');change(b,{v3Duration:''},90);
 b.run('v3SaveConstraints()');
 assert.deepEqual(json(b.run('placePoolConstraintFor("app:synthetic-ueno")')),[{dayKey:'9/20',mode:'exact',preferredPeriods:[],exactTime:'11:15'}]);
 assert.equal(b.run('v3UI.durations.get("app:synthetic-ueno")'),90);
 b.run('closeSheet()');press(b,{v3Select:'app:synthetic-ueno'});
 assert.equal(b.run('placePoolSelectedKeys().size'),0);assert.deepEqual(json(b.run('placePoolConstraintFor("app:synthetic-ueno")')),[]);
 assert.deepEqual(json(b.state.places),before);assert.equal(b.requests.length,requests);
});
test('V3 multi-date editor expands one day; uncheck discards its rule; close cancels unsaved edits',async()=>{
 const {b}=await setup();b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
 change(b,{v3Allowed:'9/20'},'',true);change(b,{v3Mode:''},'preferred');change(b,{v3Period:''},'afternoon');
 change(b,{v3Allowed:'9/21'},'',true);change(b,{v3Mode:''},'exact');change(b,{v3Time:''},'14:00');
 assert.equal((b.sheet.innerHTML.match(/class="v3-time-fields"/g)||[]).length,1);
 assert.equal(b.run('v3UI.workspace.options.length'),2);
 change(b,{v3Allowed:'9/21'},'',false);assert.equal(b.run('v3UI.workspace.options.length'),1);
 b.run('closeSheet();openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
 assert.deepEqual(json(b.run('v3UI.workspace.options')),[]);assert.equal(b.run('placePoolSelectedKeys().size'),0);
 assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);
});
test('V3 same-name ambiguous identities and scheduled entries cannot become planner commitments',async()=>{
 const data=trip([unknown(place('ueno',{name:'Same'})),unknown(place('harajuku',{name:'Same'})),unknown(place('shinjuku',{name:'Done'}))]);data.itinerary={'9/20':[{name:'Done',time:'09:00'}]};
 const b=await boot(data);b.run('togglePlacePoolSelection("app:synthetic-ueno");togglePlacePoolSelection("app:synthetic-shinjuku")');
 assert.equal(b.run('placePoolSelectedEntries().length'),0);assert.equal(b.run('applyPlacePoolConstraint("app:synthetic-ueno",[{dayKey:"9/20",mode:"none"}])'),false);
 assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);
});
test('V3 known windows validate the whole visit, unknown/transient hours remain nonblocking',async()=>{
 const {b}=await setup();b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
 assert.equal(b.run('v3Hours(state.places[0],"9/20","10:00",60).blocked'),false);
 b.run('plannerHoursWindows=()=>({"9/20":[{startMinute:600,endMinute:720}]})');
 assert.equal(b.run('v3Hours(state.places[0],"9/20","11:30",60).blocked'),true);
 assert.equal(b.run('v3Hours(state.places[0],"9/20","11:00",60).blocked'),false);
 b.run('plannerHoursWindows=()=>null;plannerHoursFailures.add("google-ueno")');
 assert.equal(b.run('v3Hours(state.places[0],"9/20","10:00",60).blocked'),false);
});
test('V3 map filters and today context are local; exact co-located pins expose a chooser',async()=>{
 const {b}=await setup(),before=b.requests.length;
 b.run('setPlacePoolOpen(false);setTab("map")');press(b,{v3Filter:'restaurant'});
 assert.deepEqual(json(b.run('v3MapPlaces().map(p=>p.name)')),['新宿餐廳']);
 press(b,{v3Filter:'today'});assert.equal(b.state.selectedDate,'9/20');assert.deepEqual(json(b.run('v3MapPlaces()')),[]);
 b.run('v3CoLocated(state.places)');assert.match(b.sheet.innerHTML,/同一位置的地點/);assert.equal((b.sheet.innerHTML.match(/data-v3-focus=/g)||[]).length,3);
 assert.equal(b.requests.length,before);
});
test('V3 keyboard trap cycles in both directions and Escape closes without persistence',async()=>{
 const {b}=await setup();let focused='';const first={focus:()=>focused='first'},last={focus:()=>focused='last'};
 b.sheet.querySelector=()=>({querySelectorAll:()=>[first,last]});b.context.document.activeElement=last;
 b.context.keyEvent={key:'Tab',preventDefault(){},shiftKey:false};assert.equal(b.run('v3HandleKey(keyEvent)'),true);assert.equal(focused,'first');
 b.context.document.activeElement=first;b.context.keyEvent.shiftKey=true;b.run('v3HandleKey(keyEvent)');assert.equal(focused,'last');
 b.sheet.querySelector=()=>null;b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
 b.sheet.querySelector=()=>({querySelectorAll:()=>[]});b.context.keyEvent={key:'Escape',preventDefault(){}};b.run('v3HandleKey(keyEvent)');
 assert.equal(b.sheet.innerHTML,'');assert.equal(b.requests.filter(r=>r.options.method==='PUT').length,0);
});

test('native Google and Leaflet adapters keep exact coordinates and marker hit anchors through zoom and resize',async()=>{
 const {b}=await setup();const records=[],maps=[],observers=[];let resizes=0;
 b.context.ResizeObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){}};
 class MapMock{constructor(host,options){this.zoom=options?.zoom||12;this.handlers={};maps.push(this)}getZoom(){return this.zoom}setZoom(z){this.zoom=z}setCenter(){}fitBounds(){}addListener(k,f){this.handlers[k]=f}on(k,f){this.handlers[k]=f;return this}setView(c,z){this.zoom=z;return this}remove(){}invalidateSize(){resizes++}}
 class MarkerMock{constructor(options){this.options=options;this.handlers={};records.push(this)}addListener(k,f){this.handlers[k]=f}setMap(){}on(k,f){this.handlers[k]=f;return this}addTo(){return this}remove(){}}
 const google={maps:{Map:MapMock,Marker:MarkerMock,SymbolPath:{CIRCLE:'circle'},LatLngBounds:class{extend(){}},Polyline:class{},event:{trigger(){resizes++}}}};
 b.context.google=google;b.context.window.google=google;b.context.host={innerHTML:''};
 b.run('state.mapView="planning";v3UI.filter="saved";v3GoogleMap(host,[{...state.places[0],latitude:35.7,longitude:139.7},{...state.places[1],latitude:35.70001,longitude:139.70001}])');
 assert.equal(records.length,1);assert.deepEqual(json(records[0].options.position),{lat:35.7,lng:139.7});
 maps[0].zoom=18;maps[0].handlers.zoom_changed();assert.equal(records.length,3);
 assert.deepEqual(json(records[2].options.position),{lat:35.70001,lng:139.70001});assert.equal(records[2].options.icon.scale,22);
 observers.at(-1).fn();assert.equal(resizes,1);assert.deepEqual(json(records[2].options.position),{lat:35.70001,lng:139.70001});
 const leaflet={map:()=>new MapMock(),tileLayer:()=>({addTo(){}}),divIcon:o=>o,marker:(position,options)=>new MarkerMock({position,...options}),polyline:()=>({addTo(){}})};
 b.context.L=leaflet;b.context.window.L=leaflet;records.length=0;
 b.run('v3LeafletMap(host,[{...state.places[0],latitude:35.7,longitude:139.7}])');
 assert.deepEqual(json(records[0].options.position),[35.7,139.7]);assert.deepEqual(json(records[0].options.icon.iconAnchor),[22,22]);assert.deepEqual(json(records[0].options.icon.iconSize),[44,44]);
 observers.at(-1).fn();assert.equal(resizes,2);
});

test('URL-only Google candidate must confirm a canonical area before import is enabled',async()=>{
 const {b}=await setup();b.context.candidate={name:'URL candidate',placeId:'',sourceUrl:'https://www.google.com/maps/?query_place_id=google-url-new',canImport:true,recognition:'complete',selected:true};
 assert.equal(b.run('importCanBeAdded(candidate)'),false);
 b.run('Object.assign(candidate,PlanningGeography.manualAreaFields("ueno"));candidateDraftStore.clear()');
 assert.equal(b.run('importCanBeAdded(candidate)'),true);
});

test('timeline map action navigates to the real map with stable identity and does not open an edit sheet',async()=>{
 const {b}=await setup();b.run('setPlacePoolOpen(false);state.itinerary={"9/20":[{name:"上野博物館",time:"10:00",durationMinutes:60}]};render()');
 assert.match(b.app.innerHTML,/data-v3-show-map="app:synthetic-ueno"/);
 press(b,{v3ShowMap:'app:synthetic-ueno'});assert.equal(b.state.activeTab,'map');assert.equal(b.state.selectedMapPlaceKey,'app:synthetic-ueno');
 assert.equal(b.sheet.innerHTML,'');assert.equal(b.run('lastMapViewport.zoom'),16);assert.match(b.app.innerHTML,/v3-map-screen/);
});
