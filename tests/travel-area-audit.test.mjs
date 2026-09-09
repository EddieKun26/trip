import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import audit from '../lib/travel-area-audit.js';
import {resolveTravelArea} from '../lib/planning-region.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/area-geometry/tokyo-v1.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../data/area-geometry/mapping-audit.json',import.meta.url)));
const expected={ginza:[4859036],ebisu:[9521529,9616318],daikanyama:[17022574,17022575],shibuya:[17022659,17022738,17022739,17022582,17022583],asakusa:[9046136,16400401,18158548],shinjuku:[17081654,17081666,17081657],otsuka:[18687916,18687920],ikebukuro:[4869702,18672896,18672902,3047806],toyosu:[3789147],'marunouchi-otemachi':[3544394,3545196],tsukiji:[16170475],azabujuban:[3562067],ueno:[18158684,18158889]};
test('fixed audit: 13 core mappings, 61 finite catalog entries, no internal town filters',()=>{
 assert.equal(manifest.areas.length,61);assert.deepEqual(Object.keys(catalog.areas),Object.keys(expected));
 const ids=[];
 for(const [key,list] of Object.entries(expected)){
   const area=catalog.areas[key];assert.equal(area.travelAreaKey,key);
   assert.deepEqual(area.features.map(f=>f.properties.osmId),list);ids.push(...list);
   assert.equal(area.localNames[0],area.travelAreaLocal);
   for(const f of area.features){assert.match(f.properties.sourceUrl,/openstreetmap.org\/relation\/\d+$/);assert(f.properties.semanticEvidence.length);assert.equal(f.properties.sourceTags.admin_level,'9');}
 }
 assert.equal(new Set(ids).size,ids.length);
 for(const entry of manifest.areas){assert(entry.travelAreaKey&&entry.travelAreaZh&&entry.travelAreaLocal);assert(Array.isArray(entry.geometryComponents));assert.doesNotMatch(entry.travelAreaZh,/惠比壽西|西新宿|歌舞伎町|丁目/);}
 assert.equal(catalog.license,'ODbL-1.0');
});
test('no included component has interior vertices in another included component',()=>{
 const all=Object.values(catalog.areas).flatMap(a=>a.features);
 for(const a of all)for(const b of all){if(a===b)continue;for(const polygon of a.geometry.coordinates)for(const point of polygon[0]) assert.equal(audit.contains(b,point),false,`${a.properties.name} overlaps ${b.properties.name}`);}
});
const original={travelAreaKey:'ebisu-daikanyama',travelAreaZh:'惠比壽／代官山',travelAreaLocal:'恵比寿／代官山',placeId:'ChIJoriginal',name:'店名不准作證據',photos:[{name:'places/ChIJoriginal/photos/exact'}],restaurantTags:[],latitude:null,longitude:null};
test('split uses evidence then address then verified containment; preserves P0 and explicit clear',()=>{
 const cases=[{travelAreaEvidence:{local:'代官山'},formattedAddress:'恵比寿4-1',key:'daikanyama'},
 {formattedAddress:'東京都渋谷区恵比寿南1-2-3',key:'ebisu'},
 {formattedAddress:'東京都渋谷区猿楽町16-15',key:'daikanyama'},
 {formattedAddress:'',latitude:35.649,longitude:139.699,key:'daikanyama'},
 {formattedAddress:'',latitude:35.643,longitude:139.709,key:'ebisu'}];
 for(const {key,...fields} of cases){const p={...structuredClone(original),...fields};const before=structuredClone(p);const after=audit.reclassify(p,catalog);assert.equal(after.travelAreaKey,key);assert.deepEqual(p,before);for(const field of ['placeId','name','photos','restaurantTags','formattedAddress','latitude','longitude'])assert.deepEqual(after[field],p[field]);assert.equal(audit.reclassify(after,catalog),after);assert.equal(after.travelAreaAuditPrevious.key,'ebisu-daikanyama');}
});
test('ambiguous Ebisu-Nishi, conflicting evidence and name-only records remain unchanged',()=>{
 for(const fields of [{formattedAddress:'渋谷区恵比寿西2-21-1'},{name:'代官山店'}, {travelAreaEvidence:{local:'代官山',area:'惠比壽'}},{latitude:null,longitude:null}]){const p={...original,...fields};assert.equal(audit.reclassify(p,catalog),p);}
});
test('new resolver keeps user-facing groups and rejects ambiguous combined split',()=>{
 const resolve=text=>resolveTravelArea({countryCode:'JP',originalAddressComponents:[{longText:text,types:['sublocality_level_2']},{longText:'日本',shortText:'JP',types:['country']}]});
 for(const [text,key] of [['恵比寿','ebisu'],['恵比寿南','ebisu'],['猿楽町','daikanyama'],['代官山町','daikanyama'],['西新宿','shinjuku'],['歌舞伎町','shinjuku'],['上野公園','ueno'],['宇田川町','shibuya'],['道玄坂','shibuya'],['南池袋','ikebukuro']])assert.equal(resolve(text).travelAreaKey,key);
 assert.equal(resolve('恵比寿西').travelAreaResolved,false);
});
