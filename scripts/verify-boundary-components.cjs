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
 await page.addScriptTag({content:fs.readFileSync('app.js','utf8').replace('\nstartApp();','\n// local fixture startup')});
 await page.evaluate(()=>{
 const defs=[['ginza','銀座','銀座',35.67,139.76],['ebisu-daikanyama','惠比壽／代官山','恵比寿／代官山',35.647,139.707],['missing','沒有邊界','沒有邊界',35.6,139.7]];
 Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places:defs.flatMap(([key,zh,local,lat,lng],i)=>[0,1].map(j=>({id:'p'+i+j,name:zh+j,kind:'restaurant',category:i===0?'壽喜燒':j===0?'燒肉':'牛排',placeId:'ChIJ'+i+j,photos:[{name:'places/ChIJ'+i+j+'/photos/p'}],photosLoaded:true,formattedAddress:'原地址',sourceUrl:'https://www.google.com/maps/dir/?api=1&destination=wrong',countryCode:'JP',travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,latitude:lat+j*.001,longitude:lng,mark:'店'})))});state.hydratedMemberId=currentMemberId(); state.hydratedTripId=state.tripId;render();
 });




 await page.locator('[data-place-area-filter="ebisu-daikanyama"]').click();
 await page.locator('[data-places-mode="map"]').click();
 await page.waitForFunction(()=>areaBoundaryLayers.length===3&&areaBoundaryLabels.length===3);
 assert.deepEqual(await page.locator('.area-component-label').allTextContents(),['恵比寿','恵比寿西','代官山町']);
 assert.equal(await page.locator('.area-component-label').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).pointerEvents==='none')),true);
 assert((await page.locator('[data-area-boundary-credit]').innerText()).includes('3 個獨立町界'));
 assert.deepEqual(await page.evaluate(()=>areaBoundaryLayers.map(l=>l.toGeoJSON().features[0].properties.osmId)),[9521529,17008303,17022574]);
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 await page.waitForFunction(()=>areaBoundaryLabels.length===3);
 await page.locator('[data-map-area]').selectOption('ginza');
 await page.waitForFunction(()=>areaBoundaryLabels.length===1);
 assert.deepEqual(await page.locator('.area-component-label').allTextContents(),['銀座']);
 await page.locator('[data-map-area]').selectOption('');
 await page.waitForFunction(()=>areaBoundaryLayers.length===0&&areaBoundaryLabels.length===0);
 assert.equal(await page.locator('.area-component-label').count(),0);
 assert.equal(await page.locator('[data-area-boundary-credit]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: separate Ebisu/Ebisu-Nishi/Daikanyamacho layers and labels, noninteractive labels, fullscreen switch to single Ginza, All clears everything.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
