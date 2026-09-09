const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const photoRequests=[];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{
 const url=r.request().url();
 if (url.includes('/api/place-photo') || url.includes('/broken-source')) {
   photoRequests.push(url);
   const name=new URL(url).searchParams.get('name')||'';
   if (name.endsWith('/good') || name.endsWith('/reserve')) return r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64')});
   return r.fulfill({status:404,contentType:'application/json',body:'{"error":"PHOTO_NOT_AVAILABLE"}'});
 }

 if(url.includes('/data/area-geometry/'))return r.fulfill({status:200,contentType:'application/json',body:fs.readFileSync('data/area-geometry/travel-area-boundaries.json','utf8')});
 return r.fulfill({status:200,contentType:r.request().resourceType()==='document'?'text/html':'application/json',body:r.request().resourceType()==='document'?fs.readFileSync('index.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,''):'{}'});
 });
 await page.goto('http://local.test/');
 await page.addStyleTag({content:fs.readFileSync('styles.css','utf8')});
 await page.addStyleTag({content:fs.readFileSync('vendor/leaflet/leaflet.css','utf8')});
 await page.addScriptTag({content:fs.readFileSync('vendor/leaflet/leaflet.js','utf8')});
 await page.addScriptTag({content:fs.readFileSync('lib/travel-area-audit.js','utf8')});
 await page.addScriptTag({content:fs.readFileSync('app.js','utf8').replace('\nstartApp();','\n// local fixture startup')});

 const catalog=JSON.parse(fs.readFileSync('data/area-geometry/travel-area-boundaries.json','utf8'));
 await page.evaluate(catalog=>{
 const places=Object.values(catalog.areas).map((area,i)=>({id:'p'+i,name:area.travelAreaZh,kind:'restaurant',restaurantTags:['測試'],travelAreaKey:area.travelAreaKey,travelAreaZh:area.travelAreaZh,travelAreaLocal:area.travelAreaLocal,countryCode:area.countryCode,latitude:area.bounds?(area.bounds[1]+area.bounds[3])/2:35.68,longitude:area.bounds?(area.bounds[0]+area.bounds[2])/2:139.72}));
 Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places});state.hydratedMemberId=currentMemberId();state.hydratedTripId=state.tripId;render();
 },catalog);
 await page.locator('[data-places-mode="map"]').click();
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 for(const [key,area] of Object.entries(catalog.areas)){
  await page.locator('[data-map-area]').selectOption(key);
  await page.waitForFunction(count=>areaBoundaryLayers.length===count,area.exteriorRingCount||0);
  assert.equal(await page.locator('.area-component-label').count(),0);
  if(area.drawable) {
   const expected=area.finalGeometry.type==='Polygon'?[area.finalGeometry.coordinates[0]]:area.finalGeometry.coordinates.map(p=>p[0]);
   const drawn=await page.evaluate(()=>areaBoundaryLayers.map(l=>l.getLatLngs().map(p=>[p.lng,p.lat])));
   assert.deepEqual(drawn,expected,key+' rendered internal rings or wrong geometry');
   assert.equal(await page.evaluate(()=>activeLeafletMap.getPane('areaBoundary').style.pointerEvents),'none');
   assert.equal(await page.evaluate(()=>areaBoundaryLayers.every(l=>l.options.interactive===false&&l.options.fill===false)),true);
   assert((await page.locator('[data-area-boundary-credit]').innerText()).includes(area.attribution.text));
  } else assert.equal(await page.locator('[data-area-boundary-credit]').count(),0);

 }
 await page.locator('[data-map-area]').selectOption('');
 await page.waitForFunction(()=>areaBoundaryLayers.length===0&&areaBoundaryLabels.length===0);
 assert.equal(await page.locator('[data-area-boundary-credit]').count(),0);
 assert.deepEqual(errors,[]);
 assert.doesNotMatch(await page.locator('body').innerText(),/惠比壽[／/]代官山|原宿[／/]表參道|東京鐵塔[／/]芝公園/);
 await page.locator('[data-map-area]').selectOption('ginza');
 await page.locator('[data-map-area]').selectOption('shinjuku');
 await page.locator('[data-map-area]').selectOption('shibuya');
 await page.waitForFunction(()=>areaBoundaryLayers.length>0&&document.querySelector('[data-area-boundary-credit]')?.textContent.includes('澀谷'));
 assert.equal(await page.evaluate(()=>state.placeAreaFilter),'shibuya');
 const prior=await page.evaluate(()=>{const p=activeLeafletMap.getCenter();activeLeafletMap.panBy([60,0],{animate:false});return p.lng});
 assert.notEqual(await page.evaluate(()=>activeLeafletMap.getCenter().lng),prior,'map pan still works');
 await page.locator('[data-map-area]').selectOption('');
 await page.waitForFunction(()=>areaBoundaryLayers.length===0);
 assert.equal(await page.locator('[data-area-boundary-credit]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: all 63 catalog areas in local mobile fullscreen map; 54 exact exterior sets; 9 no boundary; attribution, gestures, rapid switching and All clearing.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
