import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import AreaTags from '../lib/area-tags.js';
import audit from '../lib/travel-area-audit.js';
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const section = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));
const json = value => JSON.parse(JSON.stringify(value));

test('optional, empty, single, multiple and custom labels; Unicode/case dedupe preserves first display text', () => {
  for (const input of [undefined, null, '原宿', [], [null, 3, {}, ' ', '\u3000']]) assert.deepEqual(AreaTags.normalize(input), []);
  assert.deepEqual(AreaTags.values({}), []);
  assert.deepEqual(AreaTags.normalize([' 原宿 ', '', '表參道', '原宿', 'Ｃａｆé', 'cafe\u0301', 'My Custom Area']), ['原宿', '表參道', 'Ｃａｆé', 'My Custom Area']);
  assert.deepEqual(AreaTags.values({areaTags:['原宿']}), ['原宿']);
  assert.equal(AreaTags.cleanPlace({id:'old'}).areaTags, undefined);
});

test('structured suggestions use saved geographic components; no semantic alias or landmark/name inference', () => {
  for (const local of ['神宮前', '恵比寿西', '恵比寿南', '外神田', '青海', '芝公園']) {
    const place = {name:'原宿 秋葉原 台場 東京鐵塔', travelAreaZh:'原宿', areaTags:['Manual'], addressComponents:[{longText:local+'2丁目', types:['sublocality_level_2']}]};
    const before = json(place);
    assert.deepEqual(AreaTags.addressSuggestions(place), [local]);
    assert.deepEqual(place, before);
  }
  assert.deepEqual(AreaTags.addressSuggestions({addressComponents:[
    {long_name:'銀座４丁目',types:['neighborhood']}, {longText:'中央区',types:['locality']},
    {longText:'東京都',types:['administrative_area_level_1']}, {longText:'道路',types:['route']},
    {longText:'2丁目',types:['sublocality_level_3']}, null, {types:'locality'},
  ],formattedAddress:'台東区蔵前2丁目'}), ['銀座','中央区']);
  assert.deepEqual(AreaTags.addressSuggestions({name:'原宿', travelAreaZh:'原宿', latitude:35.7, longitude:139.7}), []);
});

test('conservative formatted-address fallback strips explicit numeric chome only when structured evidence is absent', () => {
  for (const [address, result] of [['藏前2丁目','藏前'],['東京都中央区銀座４丁目1-2','銀座'],['東京都渋谷区恵比寿西2丁目','恵比寿西'],['京都府京都市下京区東塩小路町1丁目','東塩小路町']]) {
    assert.deepEqual(AreaTags.addressSuggestions({formattedAddress:address}), [result]);
  }
  for (const address of ['東京都', '原宿店', '青海1-2-3', '銀座ビル', '', '2丁目']) assert.deepEqual(AreaTags.addressSuggestions({formattedAddress:address}), []);
});

test('trip suggestions are immediately available, scoped to actual labels, exclude selected Unicode variants and never persist', () => {
  const place={areaTags:['原宿'],formattedAddress:'藏前2丁目'};
  const places=[place,{areaTags:['表參道','ＣＡＦＥ']},{areaTags:['cafe']},{travelAreaZh:'銀座'}];
  const before=json(places);
  assert.deepEqual(AreaTags.suggestions(place,places), {trip:['表參道','ＣＡＦＥ'], address:['藏前']});
  assert.deepEqual(AreaTags.suggestions(place,places,['原宿','cafe','藏前']), {trip:['表參道'],address:[]});
  assert.deepEqual(places,before);
  assert.deepEqual(AreaTags.tripTags([{travelAreaZh:'銀座'}]),[]);
});

test('API cleanTrip and JSON reload preserve manual values, explicit clearing and all non-tag data', () => {
  const server=readFileSync(new URL('../api/trip.mjs',import.meta.url),'utf8');
  const fn=server.slice(server.indexOf('function cleanTrip'),server.indexOf('export default async function'));
  const clean=new Function('areaAudit','areaCatalog','areaTags', `${fn}; return cleanTrip;`)(audit,{},AreaTags);
  const place={id:'a', name:'Place', placeId:'ChIJExact',address:'原地址',formattedAddress:'東京都',addressComponents:[],latitude:35.7,longitude:139.7,photos:[{name:'exact'}],restaurantTags:['日式'],lodging:{ref:1},shopping:{ref:2},itinerary:{ref:3},areaTags:[' 原宿 ','表參道']};
  const saved=json(clean({places:[place]}, {title:'Trip'}, {id:'me'}));
  assert.deepEqual(saved.places[0], {...place,areaTags:['原宿','表參道']});
  const clear=json(clean({places:[{...saved.places[0],areaTags:[]}]},saved,{id:'me'}));
  assert.deepEqual(clear.places[0].areaTags,[]);
  const old={id:'old',name:'No tags'};
  assert.deepEqual(clean({places:[old]},saved,{id:'me'}).places,[old]);
  const {areaTags, ...olderClient}=saved.places[0];
  assert.deepEqual(clean({places:[olderClient]},saved,{id:'me'}).places[0].areaTags,['原宿','表參道']);
  assert.equal(AreaTags.cleanPlace({name:'Place'},[place]).areaTags,undefined,'never recover by name');
  assert.equal(AreaTags.cleanPlace({id:'a'},[place,place]).areaTags,undefined,'ambiguous identities are not guessed');
});

test('real legacy reclassification and resolver field updates preserve manual tags including empty and unresolved', () => {
  const c=vm.createContext({TravelAreaAudit:audit});
  vm.runInContext(section('const TRAVEL_AREA_RESOLUTION_VERSION','function placeVoters')+section('function applyPlanningRegionResolution','function planningRegionResolutionKey'),c);
  for (const tags of [[],['自訂周邊','表參道']]) {
    for (const extra of [{}, {travelAreaKey:'harajuku-omotesando',travelAreaZh:'原宿／表參道',travelAreaLocal:'原宿／表参道'}, {travelAreaKey:'ebisu-daikanyama',formattedAddress:'東京都渋谷区恵比寿南1-2-3',countryCode:'JP'}]) {
      const place={name:'saved', areaTags:tags,...extra};
      const classified=audit.reclassify(place);
      c.ensureTravelAreaFields(classified);
      assert.deepEqual(classified.areaTags,tags);
      classified.travelAreaKey='unclassified:changed';
      c.ensureTravelAreaFields(classified);
      assert.deepEqual(classified.areaTags,tags);
      c.applyPlanningRegionResolution(classified,{travelAreaResolved:true,travelAreaResolutionVersion:5,travelAreaKey:'ginza',travelAreaZh:'銀座',travelAreaLocal:'銀座'});
      assert.deepEqual(classified.areaTags,tags);
      c.applyPlanningRegionResolution(classified,{travelAreaResolved:false,error:'unresolved'});
      assert.deepEqual(classified.areaTags,tags);
    }
  }
});

test('List and Map share multi-tag membership, trip-only options, All and stale selection clearing', () => {
  const c=vm.createContext({AreaTags,state:{placeKind:'all',mapCategory:'all',mapPreference:'all'},placeVoters:()=>[],escapeHtml:String});
  vm.runInContext(section('function restaurantTagValues','function placesScreen')+section('function matchesMapFilters','function spreadOverlappingPins'),c);
  const places=[{name:'both',areaTags:['原宿','表參道']},{name:'empty',areaTags:[]},{name:'old',travelAreaKey:'ginza',travelAreaZh:'銀座'},{name:'custom',areaTags:['ＭＹ Place']}];
  for (const tag of ['原宿','表參道','my place','']) {
    c.state.areaTagFilter=tag;
    const model=c.placesFilterModel(places,c.state);
    assert.deepEqual(Array.from(model.areaTags),['原宿','表參道','ＭＹ Place']);
    assert.deepEqual(Array.from(model.visible,p=>p.name),places.filter(c.matchesMapFilters).map(p=>p.name));
    assert.equal(model.visible.length,tag ? 1 : 4);
  }
  c.state.areaTagFilter='absent';c.placesFilterModel(places,c.state);assert.equal(c.state.areaTagFilter,'');
  const html=c.placesFilterChips(c.placesFilterModel(places,c.state),{area:false,cuisine:false});
  assert.match(html,/地區標籤/);assert.match(html,/data-area-tag-filter="原宿"/);assert.doesNotMatch(html,/data-place-area-filter/);
  assert.match(source,/const drawerTags = placesFilterChips\(filterModel, \{ area: false/);
});

test('detail omits empty tags, escapes custom display and retains separate legacy/address sections', () => {
  const c=vm.createContext({AreaTags,escapeHtml:s=>s.replaceAll('<','&lt;')});
  vm.runInContext(section('function areaTagDetail','function areaTagEditor'),c);
  assert.equal(c.areaTagDetail({}),'');assert.equal(c.areaTagDetail({areaTags:[]}),'');
  assert.match(c.areaTagDetail({areaTags:['<custom>','表參道']}),/&lt;custom>/);
  const detail=section('function openPlaceSheet','async function ensurePlaceDetails');
  assert.match(detail,/areaTagDetail\(place\)/);assert.match(detail,/travelAreaDisplayName\(place\)/);assert.match(detail,/escapeHtml\(place.formattedAddress\)/);
});

test('tag selection does not invoke the boundary loader or draw geometry; legacy boundary selection is still the sole key', async () => {
  let fetches=0,draws=0;
  const c=vm.createContext({state:{tripId:'test',placeAreaFilter:'',areaTagFilter:'原宿'},activeGoogleMap:{},activeLeafletMap:null,
    document:{querySelector:()=>null},fetch:()=>{fetches++;throw Error('unexpected')},google:{maps:{Polyline:class {constructor(){draws++;}}}}});
  vm.runInContext(section('let areaGeometryPromise','let lastMapViewport'),c);
  await c.renderAreaBoundary(c.activeGoogleMap,'google');
  c.state.areaTagFilter='表參道';await c.renderAreaBoundary(c.activeGoogleMap,'google');
  c.state.areaTagFilter='';await c.renderAreaBoundary(c.activeGoogleMap,'google');
  assert.equal(fetches,0);assert.equal(draws,0);
  assert.doesNotMatch(section('let areaGeometryPromise','let lastMapViewport'),/areaTagFilter|AreaTags/);
  const branch=section('} else if (listFilter.dataset.areaTagFilter','} else {\n      state.restaurantTagFilter');
  assert.match(branch,/state.areaTagFilter = listFilter.dataset.areaTagFilter/);
  assert.doesNotMatch(branch,/placeAreaFilter\s*=|fetch|Boundary|resolve/);
});


test('tag-only map redraw skips coordinate and legacy resolver lookups while normal map initialization retains them', async () => {
 let coordinates=0,airports=0,draws=0;
 const c=vm.createContext({mapRenderToken:0,document:{querySelector:()=>({}),body:{contains:()=>true}},
  ensureMapCoordinates:async()=>{coordinates++;return false;},ensureDayAirportCoordinates:async()=>{airports++;return false;},
  filteredMapPlaces:()=>[],getGoogleMapsBrowserKey:async()=>"",renderLeafletInteractiveMap:()=>{draws++;}});
 vm.runInContext(source.slice(source.indexOf('async function initializeInteractiveMap'),source.indexOf('\nfunction ',source.indexOf('async function initializeInteractiveMap'))),c);
 await c.initializeInteractiveMap({filterOnly:true});
 assert.equal(coordinates,0);assert.equal(airports,0);assert.equal(draws,1);
 await c.initializeInteractiveMap();
 assert.equal(coordinates,1);assert.equal(airports,1);assert.equal(draws,2);
});
