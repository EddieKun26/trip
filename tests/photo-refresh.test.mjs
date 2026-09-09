import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/place-photo.mjs';
const response=()=>({headers:{},status(n){this.code=n;return this},setHeader(k,v){this.headers[k]=v;return this},json(v){this.body=v},end(){}});
test('photo refresh reads only exact ID photos, rejects mismatches and never searches',async(t)=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GOOGLE_MAPS_API_KEY;
 t.after(()=>{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=oldKey});
 process.env.GOOGLE_MAPS_API_KEY='test';
 const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return Response.json({id:'ChIJexact',photos:[{name:'places/ChIJexact/photos/new',authorAttributions:[{displayName:'Author'}]},{name:'places/WRONG/photos/bad'}]})};
 let r=response();await handler({method:'GET',query:{placeId:'ChIJexact'}},r);
 assert.equal(r.code,200);assert.deepEqual(r.body.photos,[{name:'places/ChIJexact/photos/new',attribution:'Author'}]);assert.equal(r.headers['Cache-Control'],'no-store');
 assert.equal(calls[0].url,'https://places.googleapis.com/v1/places/ChIJexact');assert.equal(calls[0].options.headers['X-Goog-FieldMask'],'id,photos');
 globalThis.fetch=async()=>Response.json({id:'WRONG',photos:[]});r=response();await handler({method:'GET',query:{placeId:'ChIJexact'}},r);assert.equal(r.code,409);
 globalThis.fetch=async()=>{throw new Error('offline')};r=response();await handler({method:'GET',query:{placeId:'ChIJexact'}},r);assert.equal(r.code,502);
 r=response();await handler({method:'GET',query:{placeId:'../bad'}},r);assert.equal(r.code,400);
});
test('media redirect stays uncached and unavailable media returns an error',async(t)=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GOOGLE_MAPS_API_KEY;
 t.after(()=>{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=oldKey});process.env.GOOGLE_MAPS_API_KEY='test';
 globalThis.fetch=async()=>Response.json({photoUri:'https://example.test/photo'});
 let r=response();await handler({method:'GET',query:{name:'places/ChIJexact/photos/new'}},r);assert.equal(r.code,302);assert.equal(r.headers['Cache-Control'],'no-store');
 globalThis.fetch=async()=>new Response('',{status:404});r=response();await handler({method:'GET',query:{name:'places/ChIJexact/photos/expired'}},r);assert.equal(r.code,404);
});
