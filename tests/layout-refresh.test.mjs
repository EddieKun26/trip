import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot,trip,place,json } from './helpers/phase-c-browser.mjs';

const saved=()=>['ueno','harajuku','shinjuku'].map((area,index)=>({...place(area,{name:['上野博物館','原宿商店','新宿餐廳'][index],kind:index===2?'restaurant':'attraction'}),detailsLocked:true,regularOpeningPeriods:{v:1,status:'unavailable',placeId:'google-'+area,periods:[]}}));
const press=(b,dataset)=>{b.context.layoutEvent={target:{closest:()=>({dataset})}};return b.run('v3HandleClick(layoutEvent)');};
const change=(b,dataset,value)=>{b.context.layoutEvent={target:{dataset,value}};return b.run('v3HandleChange(layoutEvent)');};

test('each desktop tab renders its own page and initializes a map only on Map',async()=>{
  const b=await boot(trip(saved()));b.context.window.matchMedia=()=>({matches:true});b.context.window.requestAnimationFrame=fn=>fn();
  b.run('globalThis.mapStarts=0;initializeInteractiveMap=()=>{globalThis.mapStarts++;}');
  b.run('setTab("places")');assert.match(b.app.innerHTML,/v3-library/);assert.doesNotMatch(b.app.innerHTML,/data-map-host|class="timeline/);assert.equal(b.context.mapStarts,0);
  b.run('setTab("itinerary")');assert.match(b.app.innerHTML,/每日行程/);assert.doesNotMatch(b.app.innerHTML,/data-map-host|v3-library/);assert.equal(b.context.mapStarts,0);
  b.run('setTab("map")');assert.match(b.app.innerHTML,/data-map-host/);assert.doesNotMatch(b.app.innerHTML,/v3-library|v3-timeline-column/);assert.equal(b.context.mapStarts,1);
});

test('all five destinations and primary add actions are directly available',async()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.deepEqual([...html.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]),['overview','map','itinerary','places','shopping']);
  const b=await boot(trip(saved()));b.run('setTab("places")');
  assert.ok(b.app.innerHTML.indexOf('data-add-place')<b.app.innerHTML.indexOf('data-v3-library-search'));
  assert.ok(b.app.innerHTML.indexOf('data-v3-library-area')<b.app.innerHTML.indexOf('<details'));
  assert.match(b.app.innerHTML,/data-v3-external/);
  b.run('setTab("shopping");state.shoppingLoaded=true;render()');assert.ok(b.app.innerHTML.indexOf('data-add-shopping-item')>=0);assert.ok(b.app.innerHTML.indexOf('data-add-shopping-item')<b.app.innerHTML.indexOf('shopping-summary'));
});

test('search updates just the results, combines with canonical area, and never saves data',async()=>{
  const b=await boot(trip(saved()));b.run('setTab("places")');const before=json(b.state.places),writes=b.requests.length,frame=b.app.innerHTML;
  const results={innerHTML:''};b.context.document.querySelector=selector=>selector==='[data-v3-library-results]'?results:null;
  const input={value:'原宿',matches:selector=>selector==='[data-v3-library-search]'};b.context.document.activeElement=input;
  for(const listener of b.listeners.input)await listener({target:input});
  assert.match(results.innerHTML,/原宿商店/);assert.doesNotMatch(results.innerHTML,/上野博物館|新宿餐廳/);assert.equal(b.app.innerHTML,frame);assert.equal(b.context.document.activeElement,input);
  change(b,{v3LibraryArea:''},'ueno');assert.equal(b.run('v3LibraryVisible().length'),0);
  b.run('v3LibrarySearch("")');assert.match(results.innerHTML,/上野博物館/);assert.doesNotMatch(results.innerHTML,/原宿商店/);
  press(b,{v3ClearLibrary:''});assert.equal(b.run('v3LibraryVisible().length'),3);assert.equal(b.run('v3UI.libraryArea'),'');
  assert.deepEqual(json(b.state.places),before);assert.equal(b.requests.length,writes);
  b.run('state.tripId="other";resetPlacePoolPlanner()');assert.equal(b.run('v3UI.libraryQuery'), '');assert.equal(b.run('v3UI.libraryArea'),'');
});

test('unresolved areas remain searchable and filterable without guessing their identity',async()=>{
  const unknown={...saved()[0],travelAreaKey:'',travelAreaResolved:false};const b=await boot(trip([unknown]));
  const before=b.state.places[0].travelAreaKey;change(b,{v3LibraryArea:''},'needs-confirmation');assert.equal(b.run('v3LibraryVisible().length'),1);assert.equal(b.state.places[0].travelAreaKey,before);
});

test('information opens with visible vote/navigation/contact; scheduling needs one action and retains drafts',async()=>{
  const b=await boot(trip(saved()));const before=json(b.state.itinerary),requests=b.requests.length;
  b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false})');
  assert.match(b.sheet.innerHTML,/data-vote=/);assert.match(b.sheet.innerHTML,/data-open-maps=/);assert.match(b.sheet.innerHTML,/place-contact-grid/);assert.doesNotMatch(b.sheet.innerHTML,/地點補充資訊|data-v3-time/);
  b.run('v3UI.workspace.note="未儲存的註記"');press(b,{v3Panel:'schedule'});
  assert.match(b.sheet.innerHTML,/data-v3-schedule-date/);assert.match(b.sheet.innerHTML,/data-v3-schedule>/);assert.equal((b.sheet.innerHTML.match(/data-v3-time/g)||[]).length,1);
  change(b,{v3Time:''},'14:15');change(b,{v3Duration:''},90);change(b,{v3ScheduleDate:''},'9/21');
  press(b,{v3Panel:'info'});assert.match(b.sheet.innerHTML,/未儲存的註記/);press(b,{v3Panel:'schedule'});assert.match(b.sheet.innerHTML,/value="14:15"/);assert.match(b.sheet.innerHTML,/value="90"/);assert.equal(b.run('v3UI.workspace.date'),'9/21');
  b.run('closeSheet()');assert.deepEqual(json(b.state.itinerary),before);assert.equal(b.requests.length,requests);
});

test('itinerary time editing goes directly to schedule and whole-visit hours remain blocking',async()=>{
  const data=trip(saved());data.itinerary={'9/20':[{id:'item-ueno',name:'上野博物館',time:'11:30',durationMinutes:60}]};
  const b=await boot(data);b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false,panel:"schedule"})');assert.match(b.sheet.innerHTML,/data-v3-schedule>/);assert.doesNotMatch(b.sheet.innerHTML,/data-v3-save-constraints/);
  let disabled=false;const hours={textContent:'',classList:{toggle(){}}};b.sheet.querySelector=selector=>selector==='[data-v3-hours]'?hours:selector==='[data-v3-schedule]'?{set disabled(value){disabled=value}}:null;
  b.run('plannerHoursWindows=()=>({"9/20":[{startMinute:600,endMinute:720}]});v3RefreshHours()');assert.equal(disabled,true);assert.match(hours.textContent,/營業時間不符合/);
  change(b,{v3Time:''},'11:00');assert.equal(disabled,false);
});

test('AI conditions stay expanded during edits and guests cannot expose scheduling controls',async()=>{
  const b=await boot(trip(saved()));b.run('openPlaceSheet("app:synthetic-ueno",{refreshDetails:false,panel:"schedule"})');
  b.context.allowed={target:{dataset:{v3Allowed:'9/20'},checked:true}};b.run('v3HandleChange(allowed)');change(b,{v3Mode:''},'exact');
  assert.match(b.sheet.innerHTML,/<details class="v3-ai-conditions" open>/);assert.equal(b.run('v3UI.workspace.options[0].mode'),'exact');
  b.run('canEdit=()=>false;v3RenderPlace()');press(b,{v3Panel:'schedule'});assert.doesNotMatch(b.sheet.innerHTML,/data-v3-schedule>|data-v3-time|data-v3-select|data-vote=/);
});

test('keyboard focus cycle excludes controls inside closed AI conditions',async()=>{
  const b=await boot(trip(saved()));let focused='';
  const visible={focus:()=>focused='visible',getClientRects:()=>[{}]},hidden={focus:()=>focused='hidden',getClientRects:()=>[]};
  b.sheet.querySelector=()=>({querySelectorAll:()=>[visible,hidden]});b.context.document.activeElement=visible;
  b.context.key={key:'Tab',shiftKey:false,preventDefault(){}};b.run('v3HandleKey(key)');assert.equal(focused,'visible');
});
