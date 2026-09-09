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


 await page.locator('[data-restaurant-tag-filter="壽喜燒"]').click();
 await page.locator('[data-place-area-filter="ebisu-daikanyama"]').click();
 assert.equal(await page.locator('[data-restaurant-tag-filter="壽喜燒"]').count(),0);
 assert.equal(await page.locator('[data-restaurant-tag-filter=""]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[aria-label="類別"]').count(),1);
 await page.locator('[data-places-mode="map"]').click();await page.waitForFunction(()=>areaBoundaryLayers.length>0);
 assert.equal(await page.evaluate(()=>areaBoundaryLayers[0].getLayers()[0].options.color),'#c8452d');
 assert(!await page.evaluate(()=>areaBoundaryLayers[0].getLayers()[0].options.dashArray));
 await page.locator('.map-operation-actions [data-toggle-map-fullscreen]').click();
 await page.waitForTimeout(300);
 const handle=page.locator('.map-drawer-handle');
 const opened=await handle.boundingBox(),panel=await page.locator('#map-drawer').boundingBox();
 assert(Math.abs(opened.x-(panel.x+panel.width))<1);assert(opened.width>=44);
 assert.equal(await handle.locator('span').evaluate(e=>e.getBoundingClientRect().width),22);
 await handle.click();await page.waitForTimeout(300);assert((await handle.boundingBox()).x<2);
 await handle.click();await page.waitForTimeout(300);assert(Math.abs((await handle.boundingBox()).x-opened.x)<1);
 await page.locator('.map-fullscreen-floating-actions [data-toggle-map-fullscreen]').click();
 await page.locator('[data-places-mode="list"]').click();
 await page.evaluate(()=>{state.profile={id:'tester',nickname:'Test'};state.trips=[{id:'test'}];state.isGuest=false;state.hydratedMemberId=currentMemberId();render()});
 await page.evaluate(()=>{
   const p=state.places.find(p=>p.id==='p10');
   p.customPhotoDataUrl='http://local.test/broken-source';
   p.photos=['bad','good','reserve','last-bad'].map(n=>({name:'places/ChIJ10/photos/'+n}));
   p.photos.push({name:'places/WRONG/photos/good'});
 });
 await page.locator('[data-open-place="app:p10"]').first().click();
 await page.waitForFunction(()=>{
   const images=[...document.querySelectorAll('.detail-gallery img')];
   return images.length===2 && images.every(i=>i.complete&&i.naturalWidth>0);
 });
 assert.equal(await page.locator('[data-gallery-placeholder]').count(),1);
 assert.equal(await page.locator('.detail-gallery img[data-gallery-pending]').count(),0);
 assert.equal(await page.locator('.detail-gallery img').evaluateAll(images=>images.every(i=>getComputedStyle(i).visibility==='visible'&&i.naturalWidth>0)),true);
 assert.equal(await page.locator('.detail-restaurant-tags').innerText(),'類別\n燒肉');
 assert.equal(await page.locator('[data-edit-place-tags]').count(),0);
 const imageLink=page.locator('.gallery-place-link').first();
 assert((await imageLink.getAttribute('href')).includes('query_place_id=ChIJ10'));
 assert(!photoRequests.some(u=>u.includes('WRONG')||u.includes('/dir/')));
 const before=await page.evaluate(()=>JSON.stringify(state.places.find(p=>p.id==='p10')));
 await page.locator('.place-detail-edit-button').click();
 assert.equal(await page.locator('[data-restaurant-tag-editor] legend').innerText(),'類別');
 assert.equal(await page.locator('[name="restaurantTags"]').count(),3);
 assert.equal(await page.locator('[name="restaurantTags"][value="拉麵"]').count(),0);
 assert.equal(await page.locator('[data-save-restaurant-tags]').count(),0);
 await page.locator('.restaurant-tag-options label').filter({hasText:'燒肉'}).click();
 await page.locator('.restaurant-tag-options label').filter({hasText:'牛排'}).click();
 await page.locator('[data-add-restaurant-tag]').click();
 await page.locator('[data-custom-restaurant-tag]').fill('  海鮮自助餐  ');
 await page.locator('[data-confirm-restaurant-tag]').click();
 await page.locator('[data-add-restaurant-tag]').click();
 await page.locator('[data-custom-restaurant-tag]').fill('海鮮自助餐');
 await page.locator('[data-confirm-restaurant-tag]').click();
 assert.equal(await page.locator('[name="restaurantTags"][value="海鮮自助餐"]').count(),1);
 await page.locator('#place-editor-form button[type="submit"]').click();
 let saved=await page.evaluate(()=>state.places.find(p=>p.id==='p10'));
 assert.deepEqual(saved.restaurantTags,['牛排','海鮮自助餐']);
 const original=JSON.parse(before);for(const key of Object.keys(original))assert.deepEqual(saved[key],original[key]);
 await page.evaluate(()=>{state.places=JSON.parse(JSON.stringify(state.places));render()});
 assert.equal(await page.locator('[data-restaurant-tag-filter="海鮮自助餐"]').count(),1);
 await page.locator('[data-open-place="app:p10"]').first().click();
 assert((await page.locator('.detail-restaurant-tags').innerText()).includes('海鮮自助餐'));
 await page.locator('.place-detail-edit-button').click();
 while(await page.locator('[name="restaurantTags"]:checked').count()) await page.locator('.restaurant-tag-options label:has(input:checked)').first().click();
 await page.locator('#place-editor-form button[type="submit"]').click();
 assert.deepEqual(await page.evaluate(()=>restaurantTagValues(JSON.parse(JSON.stringify(state.places.find(p=>p.id==='p10'))))),[]);
 assert.equal(await page.locator('[data-restaurant-tag-filter="海鮮自助餐"]').count(),0);
 await page.locator('[data-open-place="app:p10"]').first().click();await page.locator('.place-detail-edit-button').click();
 assert.equal(await page.locator('[name="restaurantTags"][value="海鮮自助餐"]').count(),0);
 assert.equal(await page.evaluate(()=>state.places.find(p=>p.id==='p10').placeId),'ChIJ10');
 await page.evaluate(()=>{
   const p=state.places.find(p=>p.id==='p11');
   p.photos=['bad1','bad2','bad3','bad4'].map(n=>({name:'places/ChIJ11/photos/'+n}));
   openPlaceSheet('app:p11');
 });
 await page.waitForFunction(()=>document.querySelectorAll('[data-gallery-placeholder]').length===3);
 assert.equal(await page.locator('.detail-gallery img').count(),0);
 await page.evaluate(()=>{
   const p=state.places.find(p=>p.id==='p00');p.photos=[{name:'places/ChIJ00/photos/good'}];
   openPlaceSheet('app:p00');
 });
 await page.waitForFunction(()=>document.querySelector('.detail-gallery img')?.naturalWidth>0);
 assert.equal(await page.locator('.detail-gallery img').count(),1);
 assert.equal(await page.locator('[data-gallery-placeholder]').count(),2);
 await page.evaluate(()=>{closeSheet();render()});
 const chip=page.locator('[data-place-area-filter]').first();
 assert((await chip.boundingBox()).height>=44);
 assert.equal(await chip.evaluate(el=>getComputedStyle(el).fontSize),'12px');
 assert.equal(await chip.evaluate(el=>getComputedStyle(el,'::before').top),'6px');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>393),false);
 assert.deepEqual(errors,[]);

 console.log(JSON.stringify({handleExpandedX:opened.x,panelRight:panel.x+panel.width,touchWidth:opened.width,visualWidth:22,collapsedLeft:true,boundaryColor:'#c8452d',areaScopedTags:true,editorEntry:true,multiSelectAndClear:true,identityPreserved:true,exactPhotoLink:true,partialPhotoFailure:true,allPhotoFailure:true,customTags:true,secondaryTouchHeight:44,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
