import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const catalog=JSON.parse(readFileSync(new URL('../data/area-geometry/travel-area-boundaries.json',import.meta.url),'utf8'));
const values=vm.createContext({});vm.runInContext(section('function restaurantTagValues','function restaurantTagsFromCategory'),values);
test('legacy cuisine inference uses clear multilingual evidence, without mutating records',()=>{
 for(const [text,tag] of [['內臟燒肉','燒肉'],['ラーメン','拉麵'],['すき焼き','壽喜燒'],['とんかつ','炸豬排'],['焼鳥','燒鳥'],['海鮮丼','丼飯'],['sushi restaurant','壽司'],['牛排館','牛排']]){
  const p={kind:'restaurant',category:text};assert.deepEqual(Array.from(values.restaurantTagValues(p)),[tag]);assert.equal(p.restaurantTags,undefined);
 }
 assert.deepEqual(Array.from(values.restaurantTagValues({kind:'restaurant',name:'Aidaya',description:'好吃的人氣店'})),[]);
 assert.deepEqual(Array.from(values.restaurantTagValues({kind:'restaurant',description:'這不是燒肉店'})),[]);
 assert.deepEqual(Array.from(values.restaurantTagValues({kind:'shopping',category:'咖啡'})),[]);
});
test('manual arrays including removed and explicitly cleared tags always override inference and survive JSON',()=>{
 for(const tags of [[],['日式'],['壽喜燒','其他']]){
  const p=JSON.parse(JSON.stringify({kind:'restaurant',category:'內臟燒肉',name:'ラーメン',restaurantTags:tags,restaurantTagsSource:'manual'}));
  assert.deepEqual(Array.from(values.restaurantTagValues(p)),tags);
 }
 assert.match(source,/restaurantTagsSource: "manual"/);
});
function harness(){
 const layers=[], pending=[];let fetches=0;
 const map={};const node={html:'',remove(){this.html=''},insertAdjacentHTML(position,html){this.html+=html}};
 const c=vm.createContext({state:{tripId:'t',placeAreaFilter:'ginza',places:[{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'JP'}]},
  activeGoogleMap:map,activeLeafletMap:null,document:{querySelector:()=>node},escapeHtml:String,AbortSignal,getComputedStyle:()=>({getPropertyValue:()=>"#c8452d"}),
  fetch:()=>{fetches++;return new Promise(resolve=>pending.push(resolve));},
  google:{maps:{OverlayView:class{setMap(map){this.removed=map===null}},Polyline:class{constructor(options){this.options=options;this.removed=false;layers.push(this)}setMap(v){this.removed=v===null}}}}
 });vm.runInContext(section('let areaGeometryPromise','let lastMapViewport'),c);
 return {c,map,layers,pending,node,get fetches(){return fetches}};
}
test('final catalog verifies stable keys, source identity, country, and optional geometry',()=>{
 const h=harness(), c=h.c;
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'新宿',countryCode:'JP'}),null);
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'US'}),null);
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'unknown',countryCode:'JP'}),null);
 assert.equal(Object.keys(catalog.areas).length,63);
 for(const area of Object.values(catalog.areas)) {
  const result=c.areaGeometryForPlace(catalog,{travelAreaKey:area.travelAreaKey,travelAreaLocal:area.travelAreaLocal,countryCode:area.countryCode});
  assert.equal(Boolean(result),area.drawable);
  assert.equal(c.areaBoundaryRings(result).length,area.exteriorRingCount||0);
 }
});
test('boundary loads independently, caches once, clears on All and ignores stale responses',async()=>{
 const h=harness();const first=h.c.renderAreaBoundary(h.map,'google');assert.equal(h.layers.length,0);
 h.c.state.placeAreaFilter='';await h.c.renderAreaBoundary(h.map,'google');
 h.pending[0]({ok:true,json:async()=>catalog});await first;assert.equal(h.layers.length,0);
 h.c.state.placeAreaFilter='ginza';await h.c.renderAreaBoundary(h.map,'google');assert(h.layers.length>0);assert.equal(h.fetches,1);
 assert(h.layers.every(l=>l.options.clickable===false&&l.options.strokeOpacity===0.75&&l.options.strokeColor==="#c8452d"&&!l.options.icons));
 h.c.state.placeAreaFilter='missing';await h.c.renderAreaBoundary(h.map,'google');assert(h.layers.every(l=>l.removed));
 h.c.state.placeAreaFilter='';await h.c.renderAreaBoundary(h.map,'google');assert(h.layers.every(l=>l.removed));
});
test('failed geometry is graceful and does not retry every render',async()=>{
 const h=harness();const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:false});await task;
 await h.c.renderAreaBoundary(h.map,'google');assert.equal(h.fetches,1);assert.equal(h.layers.length,0);
});
test('Leaflet boundary is noninteractive and uses a pointer-transparent pane',()=>{
 const boundary=section('async function renderAreaBoundary','let lastMapViewport');
 assert.match(boundary,/pointerEvents = "none"/);assert.match(boundary,/interactive: false/);assert.match(boundary,/fill: false/);
});
test('fullscreen has one persistent arrow with dropdown and independent exit action',()=>{
 const map=section('function mapScreen','function syncMapDrawerHandle');
 assert.equal((map.match(/data-toggle-map-sidebar/g)||[]).length,1);
 assert.match(map,/data-map-area/);assert.match(map,/aria-expanded=/);assert.match(map,/aria-controls="map-drawer"/);
 assert.doesNotMatch(map,/aria-label="收合篩選列">×/);
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(css,/map-drawer-handle[^}]*top: 50%/);assert.match(css,/map-drawer-handle[^}]*width: 44px/);
});

test('rapid A to B to C selection renders only C after shared geometry resolves',async()=>{
 const h=harness();
 for(const key of ['shinjuku','shibuya'])h.c.state.places.push({...catalog.areas[key]});
 const first=h.c.renderAreaBoundary(h.map,'google');
 h.c.state.placeAreaFilter='shinjuku';const second=h.c.renderAreaBoundary(h.map,'google');
 h.c.state.placeAreaFilter='shibuya';const third=h.c.renderAreaBoundary(h.map,'google');
 h.pending[0]({ok:true,json:async()=>catalog});await Promise.all([first,second,third]);
 assert.equal(h.fetches,1);assert.equal(h.layers.length,catalog.areas.shibuya.exteriorRingCount);
 const expected=h.c.areaBoundaryRings(catalog.areas.shibuya);
 assert.deepEqual(h.layers.map(l=>l.options.path.length),Array.from(expected,r=>r.length));
});

test('union exteriors replace components; internal borders and hole rings are never sent to map',async()=>{
 const h=harness();h.c.state.placeAreaFilter='shinjuku';h.c.state.places=[{...catalog.areas.shinjuku}];
 const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:true,json:async()=>catalog});await task;
 assert.equal(catalog.areas.shinjuku.geometryComponents.length,3);
 assert.equal(h.layers.length,1);
 assert(h.layers.every(l=>!Object.hasOwn(l.options,'componentId')));
 const outer=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole=[[1,1],[2,1],[2,2],[1,2],[1,1]],island=[[10,0],[11,0],[11,1],[10,0]];
 const rings=h.c.areaBoundaryRings({finalGeometry:{type:'MultiPolygon',coordinates:[[outer,hole],[island]]}});
 assert.deepEqual(Array.from(rings),[outer,island]);
 assert.deepEqual(Array.from(h.c.areaBoundaryRings({features:[{geometry:{type:'Polygon',coordinates:[outer]}}]})),[],'components cannot be rendered as a fallback');
 h.c.state.placeAreaFilter='';await h.c.renderAreaBoundary(h.map,'google');assert(h.layers.every(l=>l.removed));
});

test('missing, untrusted and malformed final geometry fail closed',async()=>{
 for(const finalGeometry of [null,{type:'Point',coordinates:[0,0]},{type:'MultiPolygon',coordinates:null},{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1]]]},{type:'Polygon',coordinates:[[[0,0],[Infinity,0],[1,1],[0,0]]]}]) {
  const h=harness(), data={areas:{ginza:{...catalog.areas.ginza,finalGeometry}}};
  const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:true,json:async()=>data});await task;assert.equal(h.layers.length,0);
 }
 const h=harness();const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:true,json:async()=>({areas:{ginza:{...catalog.areas.ginza,drawable:false}}})});await task;assert.equal(h.layers.length,0);
});

test('provider render error removes partial boundaries without rejecting map task',async()=>{
 const h=harness();h.c.state.placeAreaFilter='shiba-park';h.c.state.places=[{...catalog.areas['shiba-park']}];
 let count=0;const Original=h.c.google.maps.Polyline;
 h.c.google.maps.Polyline=class extends Original {constructor(o){if(++count===2)throw Error('renderer failure');super(o)}};
 const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:true,json:async()=>catalog});await assert.doesNotReject(task);
 assert.equal(h.layers.length,1);assert(h.layers.every(l=>l.removed));
});

test('trip/map changes during fetch prevent stale lines and stale fitBounds',async()=>{
 for(const change of [h=>h.c.state.tripId='other',h=>h.c.activeGoogleMap={}]) {
  const h=harness();let fits=0;h.map.fitBounds=()=>fits++;
  const task=h.c.renderAreaBoundary(h.map,'google');change(h);h.pending[0]({ok:true,json:async()=>catalog});await task;
  assert.equal(h.layers.length,0);assert.equal(fits,0);
 }
});

test('Google fits final exteriors plus saved markers and credits the selected source',async()=>{
 for(const key of ['shinjuku','boston']){
  const h=harness(),area=catalog.areas[key];
  const marker={...area,latitude:area.bounds[3]+0.01,longitude:area.bounds[2]+0.01};
  h.c.state.placeAreaFilter=key;h.c.state.places=[marker];
  h.c.google.maps.LatLngBounds=class{points=[];extend(p){this.points.push(p)}};
  const fits=[];h.map.fitBounds=(bounds,padding)=>fits.push({bounds,padding});
  const task=h.c.renderAreaBoundary(h.map,'google');h.pending[0]({ok:true,json:async()=>catalog});await task;
  assert.equal(fits.length,1);assert.equal(fits[0].padding,42);
  assert(fits[0].bounds.points.some(p=>p.lat===marker.latitude&&p.lng===marker.longitude));
  assert(h.node.html.includes(area.attribution.text));
  assert.equal(h.node.html.includes('OpenStreetMap'),area.sourceType==='osm');
  h.c.state.placeAreaFilter='';await h.c.renderAreaBoundary(h.map,'google');assert.equal(h.node.html,'');
 }
});
