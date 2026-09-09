import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import audit from '../lib/travel-area-audit.js';
import {resolveTravelArea} from '../lib/planning-region.mjs';
const load=name=>JSON.parse(readFileSync(new URL('../data/area-geometry/'+name,import.meta.url),'utf8'));
const catalog=load('travel-area-boundaries.json'), manifest=load('boundary-audit.json');
const original=load('mapping-audit.json');

test('63 audited records account for every baseline key and both added splits',()=>{
 assert.equal(Object.keys(catalog.areas).length,63);
 assert.deepEqual(catalog.baselineMapping.map(a=>a.travelAreaKey),original.areas.map(a=>a.travelAreaKey));
 assert.deepEqual(new Set(catalog.baselineMapping.flatMap(a=>a.finalKeys)),new Set(Object.keys(catalog.areas)));
 assert.deepEqual(catalog.summary,{google:0,official:10,osm:44,none:9});
 for(const [key,a] of Object.entries(catalog.areas)){
  assert.equal(a.travelAreaKey,key);
  for(const field of ['travelAreaZh','travelAreaLocal','userFacingAssessment','googleBoundary','alternativeAuthoritativeSource','osmEvidence','confidence','limitation','unionStatus','auditStatus'])assert(a[field],key+' missing '+field);
  assert.equal(typeof a.userFacingReasonable,'boolean');assert.equal(typeof a.compositeName,'boolean');
  assert.equal(a.drawable,Boolean(a.finalGeometry));assert.equal(a.drawable,a.geometryComponents.length>0);
  const {finalGeometry,...withoutGeometry}=a;assert.deepEqual(manifest.areas[key],withoutGeometry);
  assert.doesNotMatch(a.travelAreaZh,/惠比壽\/代官山|惠比壽／代官山|原宿[／/]表參道|東京鐵塔[／/]芝公園/);
  if(a.drawable){assert.equal(a.unionStatus,'verified');assert(a.attribution.url.startsWith('https://'));assert(a.exteriorRingCount>0);}
 }
 for(const key of ['nishishinjuku','kabukicho','ebisu-minami','ebisu-nishi','jinnan','udagawacho'])assert(!catalog.areas[key]);
});

test('raw geometry snapshot hashes and source identities match the reviewed manifest',()=>{
 for(const [name,hash] of Object.entries(catalog.sourceSnapshots))assert.equal(createHash('sha256').update(readFileSync(new URL('../data/area-geometry/'+name,import.meta.url))).digest('hex'),hash,name);
 for(const a of Object.values(catalog.areas))for(const c of a.geometryComponents){
  if(c.snapshot)assert.equal(c.sha256,catalog.sourceSnapshots[c.snapshot]);
  if(a.sourceType==='osm'){assert(c.osmId);assert.match(c.sourceUrl,/^https:\/\/www.openstreetmap.org\/(way|relation)\/\d+$/);assert.equal(a.attribution.license,'ODbL-1.0');}
  if(a.sourceType==='official'){assert(c.geoid);assert.equal(c.geoid,c.sourceProperties.GEOID);assert.equal(c.name,c.sourceProperties.NAME);assert.match(c.sourceUrl,/tigerweb.geo.census.gov/);}
 }
});

const old=(key,extra={})=>({id:'saved',travelAreaKey:key,travelAreaZh:'legacy',travelAreaLocal:'legacy',name:'原宿 東京鐵塔 代官山店',placeId:'ChIJ_P0_exact',googleMapsUrl:'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ_P0_exact',photos:[{name:'places/ChIJ_P0_exact/photos/exact'}],address:'',latitude:null,longitude:null,countryCode:'JP',restaurantTags:[],...extra});
const areaFields=new Set(['travelAreaKey','travelAreaZh','travelAreaLocal','planningRegion','planningRegionOriginal','travelAreaAuditVersion','travelAreaAuditBasis','travelAreaAuditPrevious']);
test('all three legacy pairs split only on saved evidence and preserve every non-area field',()=>{
 const cases=[
  ['ebisu-daikanyama',{formattedAddress:'東京都渋谷区恵比寿南1-2-3'},'ebisu'],
  ['ebisu-daikanyama',{formattedAddress:'東京都渋谷区猿楽町16-15'},'daikanyama'],
  ['harajuku-omotesando',{travelAreaEvidence:{local:'原宿'}},'harajuku'],
  ['harajuku-omotesando',{addressComponentsOriginal:[{longText:'表参道',types:['route']},{longText:'表参道',types:['neighborhood']}]},'omotesando'],
  ['tokyo-tower-shiba',{formattedAddress:'東京都港区芝公園4丁目2-8'},'tokyo-tower'],
  ['tokyo-tower-shiba',{travelAreaEvidence:{travelAreaLocal:'芝公園'}},'shiba-park'],
  ['tokyo-tower-shiba',{latitude:35.6539456,longitude:139.74753406148807},'shiba-park'],
 ];
 for(const [key,evidence,target] of cases){
  const before=old(key,evidence),original=structuredClone(before),after=audit.reclassify(before,catalog);
  assert.equal(after.travelAreaKey,target,JSON.stringify(evidence));assert.deepEqual(before,original);
  for(const field of Object.keys(before))if(!areaFields.has(field))assert.deepEqual(after[field],before[field],field);
  assert.equal(audit.reclassify(after,catalog),after);assert.equal(after.travelAreaAuditPrevious.key,key);
 }
});

test('ambiguous town, name-only, conflicting evidence, foreign and boundary points retain exact records',()=>{
 const boundary=catalog.areas['shiba-park'].finalGeometry.coordinates[0][0][0];
 for(const key of Object.keys(audit.splits))for(const extra of [{},{countryCode:'US',travelAreaEvidence:{local:'原宿'}},{latitude:null,longitude:null},{latitude:0,longitude:0}]){
  const p=old(key,extra);assert.equal(audit.reclassify(p,catalog),p);
 }
 for(const p of [old('harajuku-omotesando',{formattedAddress:'東京都渋谷区神宮前5-1-1'}),old('tokyo-tower-shiba',{formattedAddress:'東京都港区芝公園4丁目'}),old('tokyo-tower-shiba',{latitude:boundary[1],longitude:boundary[0]}),old('harajuku-omotesando',{travelAreaEvidence:{local:'原宿',area:'表參道'}})])assert.equal(audit.reclassify(p,catalog),p);
});

test('verified containment honors holes and requires final geometry instead of raw components',()=>{
 const outer=[[139.7,35.6],[139.71,35.6],[139.71,35.61],[139.7,35.61],[139.7,35.6]];
 const hole=[[139.703,35.603],[139.707,35.603],[139.707,35.607],[139.703,35.607],[139.703,35.603]];
 const geometry={type:'Polygon',coordinates:[outer,hole]};
 const p=old('tokyo-tower-shiba',{latitude:35.605,longitude:139.705});
 assert.equal(audit.reclassify(p,{areas:{'shiba-park':{drawable:true,finalGeometry:geometry}}}),p);
 assert.equal(audit.reclassify(p,{areas:{'shiba-park':{features:[{geometry:{type:'Polygon',coordinates:[outer]}}]}}}),p);
});

test('new resolver exposes six independent areas without exposing internal components',()=>{
 for(const [text,key] of [['恵比寿','ebisu'],['代官山','daikanyama'],['原宿','harajuku'],['表参道','omotesando'],['東京タワー','tokyo-tower'],['芝公園','shiba-park'],['西新宿','shinjuku'],['歌舞伎町','shinjuku'],['神南','shibuya']]){
  const area=resolveTravelArea({countryCode:'JP',originalAddressComponents:[{longText:text,types:['neighborhood']}]});
  assert.equal(area.travelAreaKey,key);assert.equal(area.travelAreaZh,catalog.areas[key].travelAreaZh);
 }
});

test('unresolved legacy remains recoverable but UI never offers a combined label or Google retry',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const c=vm.createContext({TravelAreaAudit:audit});
 vm.runInContext(source.slice(source.indexOf('const TRAVEL_AREA_RESOLUTION_VERSION'),source.indexOf('function placeVoters')),c);
 for(const key of Object.keys(audit.splits)){
  const p=old(key);const before=structuredClone(p);
  assert.equal(c.travelAreaDisplayName(p),'地區待確認');assert.equal(c.travelAreaChineseName(p),'地區待確認');
  assert.equal(c.isTravelAreaResolutionCurrent(p),true);assert.deepEqual(p,before);
 }
});
