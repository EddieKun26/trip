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

 if(url.includes('/data/area-geometry/'))return r.fulfill({status:200,contentType:'application/json',body:fs.readFileSync('data/area-geometry/tokyo-v1.json','utf8')});
 return r.fulfill({status:200,contentType:r.request().resourceType()==='document'?'text/html':'application/json',body:r.request().resourceType()==='document'?fs.readFileSync('index.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,''):'{}'});
 });
 await page.goto('http://local.test/');
 await page.addStyleTag({content:fs.readFileSync('styles.css','utf8')});
 await page.addStyleTag({content:fs.readFileSync('vendor/leaflet/leaflet.css','utf8')});
 await page.addScriptTag({content:fs.readFileSync('vendor/leaflet/leaflet.js','utf8')});
 await page.addScriptTag({content:fs.readFileSync('lib/travel-area-audit.js','utf8')});
 await page.addScriptTag({content:fs.readFileSync('app.js','utf8').replace('\nstartApp();','\n// local fixture startup')});

 const catalog=JSON.parse(fs.readFileSync('data/area-geometry/tokyo-v1.json','utf8'));
 await page.evaluate(catalog=>{
 const places=Object.values(catalog.areas).map((area,i)=>({id:'p'+i,name:area.travelAreaZh,kind:'restaurant',restaurantTags:['測試'],travelAreaKey:area.travelAreaKey,travelAreaZh:area.travelAreaZh,travelAreaLocal:area.travelAreaLocal,countryCode:'JP',latitude:35.68,longitude:139.72}));
 Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places});state.hydratedMemberId=currentMemberId();state.hydratedTripId=state.tripId;render();
 },catalog);
 await page.locator('[data-places-mode="map"]').click();
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 for(const [key,area] of Object.entries(catalog.areas)){
  await page.locator('[data-map-area]').selectOption(key);
  await page.waitForFunction(({count,label})=>areaBoundaryLayers.length===count && document.querySelector('.area-component-label')?.textContent===label,{count:area.features.length,label:area.travelAreaZh});
  assert.deepEqual(await page.evaluate(()=>areaBoundaryLayers.map(l=>l.toGeoJSON().features[0].properties.osmId)),area.features.map(f=>f.properties.osmId));
  assert.deepEqual(await page.locator('.area-component-label').allTextContents(),[area.travelAreaZh]);
  assert.equal(await page.locator('.area-component-label').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).pointerEvents==='none')),true);
  assert((await page.locator('[data-area-boundary-credit]').innerText()).includes('OpenStreetMap'));
 }
 await page.locator('[data-map-area]').selectOption('');
 await page.waitForFunction(()=>areaBoundaryLayers.length===0&&areaBoundaryLabels.length===0);
 assert.equal(await page.locator('[data-area-boundary-credit]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: all 13 areas exact independent source layers, user-facing labels only, noninteractive labels, shared fullscreen selection, All clears boundaries.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
