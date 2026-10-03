import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import W from '../lib/trip-workspace.js';
import G from '../lib/planning-geography.js';
import C from '../lib/canonical-travel-catalog.js';

test('native marker clusters retain original coordinates across zoom and pixel ratios; selected point is a singleton',()=>{
  const places=[{id:'a',latitude:35.7,longitude:139.7},{id:'b',latitude:35.70001,longitude:139.70001},{id:'c',latitude:35.9,longitude:139.9}];
  const original=JSON.stringify(places);
  for(const dpr of [1,1.5,2,3])for(const zoom of [1,8,12,15,16,22]){
    const groups=W.clusters(places,zoom,'app:a');assert.equal(groups.reduce((n,g)=>n+g.members.length,0),3);
    assert.equal(groups.find(g=>g.place.id==='a').members.length,1);
    for(const g of groups)assert.ok(places.includes(g.place),`${zoom}/${dpr}`);
    if(zoom>=16)assert.equal(groups.length,3);
  }
  assert.equal(JSON.stringify(places),original);assert.equal(W.valid({latitude:0,longitude:0}),false);
  assert.equal(W.valid({latitude:null,longitude:139}),false);
});

test('Mercator coordinate geometry, distance and calendar selection are deterministic',()=>{
  assert.deepEqual(W.worldPoint({latitude:0,longitude:0},0),{x:128,y:128});
  assert.equal(W.distanceKm({latitude:35,longitude:139},{latitude:35,longitude:139}),0);
  assert.equal(W.todayKey('2026-09-20',[['9/20'],['9/21']],new Date(2026,8,21)),'9/21');
  assert.equal(W.todayKey('2026-09-20',[['9/20'],['9/21']],new Date(2027,8,21)),'9/20');
});

test('broad canonical Yoyogi labels, fail-closed new Google writes and unchanged legacy preservation',()=>{
  const p={id:'a',placeId:'google-a',...G.manualAreaFields('yoyogi')};assert.equal(p.travelAreaZh,'代代木');assert.equal(G.isImportAreaReady(p),true);
  for(const mutate of [p=>delete p.travelAreaKey,p=>p.travelAreaZh='假名稱',p=>p.travelAreaResolved=false]){const bad=structuredClone(p);mutate(bad);assert.throws(()=>G.assertPlaceAreaWrite(bad),/INVALID_CANONICAL_AREA_REQUIRED/);}
  const legacy={id:'a',placeId:'google-a',travelAreaResolved:false};assert.deepEqual(G.assertPlaceAreaWrite(legacy,legacy),legacy);
  assert.throws(()=>G.assertPlaceAreaWrite({...legacy,travelAreaZh:'changed'},legacy),/INVALID_CANONICAL/);
  assert.throws(()=>G.assertPlaceAreaWrite({sourceUrl:'legacy'},null,true),/INVALID_CANONICAL_AREA_REQUIRED/);
  assert.equal(W.groups([p],C.catalog)[0].label,'代代木');assert.equal(W.category({name:'Sushi Hotel',kind:'attraction'}),'景點');
});

test('AA text palette, 44px targets, mobile/desktop/safe-area and reduced-motion rules ship',()=>{
  const css=readFileSync(new URL('../workspace-v3.css',import.meta.url),'utf8');
  const lum=hex=>hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
  for(const [a,b] of [['292823','F7F3EA'],['625C53','FFFDF8'],['FFFDF8','A44330'],['23645D','E4EFEB'],['A12B32','FFFDF8']]){const [x,y]=[lum(a),lum(b)].sort((a,b)=>b-a);assert.ok((x+.05)/(y+.05)>=4.5);}
  for(const pattern of [/min-height:44px/,/safe-area-inset-bottom/,/min-width:1180px/,/prefers-reduced-motion/,/font-size:16px/,/focus-visible/])assert.match(css,pattern);
});
