import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const catalog=JSON.parse(readFileSync(new URL('../data/area-geometry/tokyo-v1.json',import.meta.url),'utf8'));
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
 const map={};const node={remove(){},insertAdjacentHTML(){}};
 const c=vm.createContext({state:{tripId:'t',placeAreaFilter:'ginza',places:[{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'JP'}]},
  activeGoogleMap:map,activeLeafletMap:null,document:{querySelector:()=>node},escapeHtml:String,AbortSignal,getComputedStyle:()=>({getPropertyValue:()=>"#c8452d"}),
  fetch:()=>{fetches++;return new Promise(resolve=>pending.push(resolve));},
  google:{maps:{Polyline:class{constructor(options){this.options=options;this.removed=false;layers.push(this)}setMap(v){this.removed=v===null}}}}
 });vm.runInContext(section('let areaGeometryPromise','let lastMapViewport'),c);
 return {c,map,layers,pending,get fetches(){return fetches}};
}
test('reviewed OSM mapping uses IDs, local names, country, and keeps compound components separate',()=>{
 const h=harness();const c=h.c;
 const composite=c.areaGeometryForPlace(catalog,{travelAreaKey:'ebisu-daikanyama',travelAreaLocal:'恵比寿／代官山',countryCode:'JP'});
 assert.deepEqual(composite.features.map(f=>f.properties.osmId),[9521529,17008303,17022574]);
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'新宿',countryCode:'JP'}),null);
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'US'}),null);
 assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'unknown',countryCode:'JP'}),null);
 assert.equal(Object.keys(catalog.areas).length,12);
 for(const area of Object.values(catalog.areas))for(const f of area.features){
  assert.match(f.properties.sourceUrl,/^https:\/\/www.openstreetmap.org\/relation\/\d+$/);
  assert.equal(f.properties.sourceTags.admin_level,'9');
  assert.equal(f.geometry.type,'MultiPolygon');
  for(const polygon of f.geometry.coordinates)for(const ring of polygon){assert(ring.length>4);assert.deepEqual(ring[0],ring.at(-1));for(const [lng,lat] of ring)assert(lng>139.55&&lng<139.9&&lat>35.55&&lat<35.85)}
 }
});
test('boundary loads independently, caches once, clears on All and ignores stale responses',async()=>{
 const h=harness();const first=h.c.renderAreaBoundary(h.map,'google');assert.equal(h.layers.length,0);
 h.c.state.placeAreaFilter='';await h.c.renderAreaBoundary(h.map,'google');
 h.pending[0]({ok:true,json:async()=>catalog});await first;assert.equal(h.layers.length,0);
 h.c.state.placeAreaFilter='ginza';await h.c.renderAreaBoundary(h.map,'google');assert(h.layers.length>0);assert.equal(h.fetches,1);
 assert(h.layers.every(l=>l.options.clickable===false&&l.options.strokeOpacity===0&&l.options.icons.length));
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

test('rapid A to B selection renders only B when the shared geometry request resolves',async()=>{
 const h=harness();
 h.c.state.places.push({travelAreaKey:'ebisu-daikanyama',travelAreaLocal:'恵比寿／代官山',countryCode:'JP'});
 const first=h.c.renderAreaBoundary(h.map,'google');
 h.c.state.placeAreaFilter='ebisu-daikanyama';
 const second=h.c.renderAreaBoundary(h.map,'google');
 h.pending[0]({ok:true,json:async()=>catalog});await Promise.all([first,second]);
 assert.equal(h.fetches,1);assert.equal(h.layers.length,3);
 const expected=catalog.areas['ebisu-daikanyama'].features.flatMap(f=>f.geometry.coordinates.flatMap(p=>p));
 assert.deepEqual(h.layers.map(l=>l.options.path.length),expected.map(r=>r.length));
});
