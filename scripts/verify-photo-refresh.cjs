const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const photoRequests=[];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{
 const url=r.request().url();
 if(url.includes('/api/place-photo?placeId=')) {
   photoRequests.push(url);
   const id=new URL(url).searchParams.get('placeId');
   if(id==='ChIJoffline') return r.fulfill({status:502,contentType:'application/json',body:'{}'});
   if(id==='ChIJempty') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({placeId:id,photos:[]})});
   if(id==='ChIJwrong') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({placeId:'WRONG',photos:[]})});
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({placeId:id,photos:['good','reserve'].map(n=>({name:'places/'+id+'/photos/'+n,attribution:'Fresh author'}))})});
 }
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
 Object.assign(state,{tripId:'photo-test',places:[{id:'one',name:'舊照片店',kind:'restaurant',placeId:'ChIJold',photosLoaded:true,detailsLocked:true,formattedAddress:'原地址',restaurantTags:[],photos:['expired1','expired2','expired3'].map(n=>({name:'places/ChIJold/photos/'+n}))}]});
 openPlaceSheet('app:one');
 });
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll('.detail-gallery img')];return images.length===2&&images.every(i=>i.complete&&i.naturalWidth>0)});
 assert.equal(await page.locator('[data-gallery-placeholder]').count(),1);
 assert.equal(photoRequests.filter(u=>u.includes('placeId=')).length,1);
 assert.equal(await page.locator('.detail-gallery figcaption').first().innerText(),'Fresh author');
 assert.equal(await page.evaluate(()=>state.places[0].photos[0].name),'places/ChIJold/photos/expired1');
 assert.equal(await page.evaluate(()=>state.places[0].formattedAddress),'原地址');
 assert.deepEqual(await page.evaluate(()=>state.places[0].restaurantTags),[]);
 assert(!photoRequests.some(u=>u.includes('searchText')));
 for(const id of ['ChIJoffline','ChIJempty','ChIJwrong']) {
   await page.evaluate(id=>{state.places=[{id:'case',name:'Test',placeId:id,photosLoaded:true,detailsLocked:true,photos:[]}];openPlaceSheet('app:case')},id);
   await page.waitForResponse(r=>r.url().includes('placeId='+id));
   await page.waitForTimeout(100);
   assert.equal(await page.locator('[data-gallery-placeholder]').count(),3);
   assert.equal(photoRequests.filter(u=>u.includes('placeId='+id)).length,1);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: expired references recovered with fresh exact-ID photos despite photosLoaded/detailsLocked; one request; saved metadata unchanged; decoded images visible.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
