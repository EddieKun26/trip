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



 await page.locator('[data-place-kind="restaurant"]').click();
 await page.locator('[data-place-area-filter="ginza"]').click();
 await page.locator('[data-restaurant-tag-filter="壽喜燒"]').click();
 await page.locator('[data-places-mode="map"]').click();
 assert.equal(await page.evaluate(()=>state.placeKind),'restaurant');
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 assert.equal(await page.locator('#map-drawer [data-map-kind]').count(),0);
 assert.equal(await page.locator('#map-drawer [aria-label="類別"]').count(),1);
 assert.equal(await page.locator('#map-drawer [data-restaurant-tag-filter="燒肉"]').count(),0);
 assert.equal(await page.locator('#map-drawer [data-restaurant-tag-filter="壽喜燒"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-map-area]').selectOption('ebisu-daikanyama');
 assert.equal(await page.locator('#map-drawer [data-restaurant-tag-filter="壽喜燒"]').count(),0);
 assert.equal(await page.evaluate(()=>state.restaurantTagFilter),'');
 await page.locator('#map-drawer [data-restaurant-tag-filter="燒肉"]').click();
 assert.equal(await page.evaluate(()=>state.placeKind),'restaurant');
 assert.deepEqual(await page.evaluate(()=>filteredMapPlaces().map(p=>p.name)),['惠比壽／代官山0']);
 await page.locator('[data-map-preference]').selectOption('none');
 await page.locator('.map-fullscreen-floating-actions [data-toggle-map-fullscreen]').click();
 await page.locator('[data-places-mode="list"]').click();
 assert.equal(await page.evaluate(()=>state.mapPreference),'none');
 assert.equal(await page.locator('[data-place-kind="restaurant"]').getAttribute('class'),'active');
 assert.equal(await page.locator('[data-restaurant-tag-filter="燒肉"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.place-row').count(),1);
 await page.locator('[data-places-mode="map"]').click();
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 assert.equal(await page.locator('[data-map-preference]').inputValue(),'none');
 assert.equal(await page.locator('[data-map-area]').inputValue(),'ebisu-daikanyama');
 assert.equal(await page.evaluate(()=>state.restaurantTagFilter),'燒肉');
 assert.deepEqual(errors,[]);
 console.log('PASS: one kind control; shared restaurant/area/tag/preference; scoped tag reset; List/Map/fullscreen round trip at 393x852.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
