import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import tripHandler from "../api/trip.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";

globalThis.fetch = async (_url, options) => {
  const [command, key, value, ...flags] = JSON.parse(options.body);
  let result = null;
  if (command === "GET") result = store.get(key) ?? null;
  if (command === "SET") {
    if (flags.includes("NX") && store.has(key)) result = null;
    else {
      store.set(key, value);
      result = "OK";
    }
  }
  if (command === "INCR") {
    result = Number(store.get(key) || 0) + 1;
    store.set(key, String(result));
  }
  if (command === "DEL") {
    result = store.delete(key) ? 1 : 0;
  }
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("four-digit PIN restores one member across devices and protects writes", async () => {
  store.clear();
  store.set(
    "tokyo-family-trip:v1",
    JSON.stringify({ places: [], votes: {}, itinerary: {}, members: { "member-old": "弟弟" }, revision: 1 }),
  );

  const firstLogin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "1234" },
      headers: { "x-forwarded-for": "203.0.113.10" },
    },
    firstLogin,
  );
  assert.equal(firstLogin.statusCode, 200);
  assert.equal(firstLogin.payload.member.id, "member-old");
  assert.equal(firstLogin.payload.member.authVersion, 2);

  const secondLogin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "1234" },
      headers: { "x-forwarded-for": "203.0.113.11" },
    },
    secondLogin,
  );
  assert.equal(secondLogin.statusCode, 200);
  assert.equal(secondLogin.payload.member.id, "member-old");

  const wrongPin = responseMock();
  await memberHandler(
    {
      method: "POST",
      body: { nickname: "弟弟", pin: "9999" },
      headers: { "x-forwarded-for": "203.0.113.12" },
    },
    wrongPin,
  );
  assert.equal(wrongPin.statusCode, 401);
  assert.equal(wrongPin.payload.error, "INVALID_PIN");

  const cookie = firstLogin.headers["set-cookie"].split(";")[0];
  const authorizedWrite = responseMock();
  await tripHandler(
    {
      method: "PUT",
      headers: { cookie },
      body: { places: [], votes: {}, itinerary: {}, members: {} },
    },
    authorizedWrite,
  );
  assert.equal(authorizedWrite.statusCode, 200);
  assert.equal(authorizedWrite.payload.members["member-old"], "弟弟");
  assert.notEqual(authorizedWrite.payload.inviteCode, "TOKYO6");

  const privateLegacyRead = responseMock();
  await tripHandler({ method: "GET", headers: {}, url: "/api/trip?id=tokyo-family-2026" }, privateLegacyRead);
  assert.equal(privateLegacyRead.statusCode, 401);
  assert.equal(privateLegacyRead.payload.error, "TRIP_ACCESS_REQUIRED");
  assert.equal(store.has("tokyo-family-trip:invite:TOKYO6"), false);

  const guestWrite = responseMock();
  await tripHandler(
    { method: "PUT", headers: {}, body: { places: [], votes: {}, itinerary: {}, members: {} } },
    guestWrite,
  );
  assert.equal(guestWrite.statusCode, 401);
  assert.equal(guestWrite.payload.error, "AUTH_REQUIRED");
});

test("members see only their own trips until they join with an invite code", async () => {
  store.clear();
  const login = async (nickname, pin, ip) => {
    const response = responseMock();
    await memberHandler({ method: "POST", body: { nickname, pin }, headers: { "x-forwarded-for": ip } }, response);
    assert.equal(response.statusCode, 200);
    return response.headers["set-cookie"].split(";")[0];
  };
  const request = async (cookie, body) => {
    const response = responseMock();
    await tripsHandler({ method: body ? "POST" : "GET", body, headers: { cookie } }, response);
    return response;
  };

  const mingCookie = await login("小明", "1111", "203.0.113.21");
  const meiCookie = await login("小美", "2222", "203.0.113.22");
  const tokyo = await request(mingCookie, { action: "create", destination: "東京", title: "小明東京旅行", startDate: "2026-09-20", endDate: "2026-09-26" });
  const seoul = await request(meiCookie, { action: "create", destination: "首爾", title: "小美首爾旅行", startDate: "2026-10-01", endDate: "2026-10-05" });
  assert.equal(tokyo.statusCode, 201);
  assert.equal(seoul.statusCode, 201);

  const mingBeforeJoin = await request(mingCookie);
  const meiBeforeJoin = await request(meiCookie);
  assert.deepEqual(mingBeforeJoin.payload.trips.map((trip) => trip.title), ["小明東京旅行"]);
  assert.deepEqual(meiBeforeJoin.payload.trips.map((trip) => trip.title), ["小美首爾旅行"]);

  const blockedPrivateTrip = responseMock();
  await tripHandler({ method: "GET", headers: { cookie: meiCookie }, url: `/api/trip?id=${tokyo.payload.trip.id}` }, blockedPrivateTrip);
  assert.equal(blockedPrivateTrip.statusCode, 403);

  const joined = await request(meiCookie, { action: "join", inviteCode: tokyo.payload.trip.inviteCode });
  assert.equal(joined.statusCode, 200);
  const meiAfterJoin = await request(meiCookie);
  assert.deepEqual(meiAfterJoin.payload.trips.map((trip) => trip.title), ["小美首爾旅行", "小明東京旅行"]);
  const joinedPrivateTrip = responseMock();
  await tripHandler({ method: "GET", headers: { cookie: meiCookie }, url: `/api/trip?id=${tokyo.payload.trip.id}` }, joinedPrivateTrip);
  assert.equal(joinedPrivateTrip.statusCode, 200);
  const mingAfterJoin = await request(mingCookie);
  assert.deepEqual(mingAfterJoin.payload.trips.map((trip) => trip.title), ["小明東京旅行"]);
});

test("self-created lodging fields survive a shared trip save and reload", async () => {
  store.clear();
  const login = responseMock();
  await memberHandler({
    method: "POST",
    body: { nickname: "住宿測試", pin: "3141" },
    headers: { "x-forwarded-for": "203.0.113.41" },
  }, login);
  const cookie = login.headers["set-cookie"].split(";")[0];
  const created = responseMock();
  await tripsHandler({
    method: "POST",
    headers: { cookie },
    body: { action: "create", destination: "藤澤", title: "住宿測試", startDate: "2026-09-23", endDate: "2026-09-25" },
  }, created);
  const place = {
    id: "custom-place-lodging-1",
    name: "江之島私人住宿",
    sourceLodgingName: "Private Enoshima Stay",
    manualAddress: "房東貼入地址：片瀨3-8-12",
    formattedAddress: "神奈川縣藤澤市片瀨3-8-12",
    travelAreaKey: "fujisawa", travelAreaZh: "藤澤", travelAreaLocal: "藤沢",
    travelAreaResolved: true, travelAreaSource: "automatic", travelAreaResolver: "JP_CITY_FALLBACK",
    travelAreaResolutionVersion: 5, travelAreaResolutionStatus: "resolved", travelAreaResolutionError: "",
    latitude: 35.3131,
    longitude: 139.4872,
    referenceUrl: "https://www.airbnb.com/rooms/123456",
    originalReferenceUrl: "https://www.airbnb.com/rooms/123456?share=original",
    sourceCanonicalUrl: "https://www.airbnb.com/rooms/123456",
    sourceReadStatus: "available",
    sourceImageUrl: "https://a0.muscache.com/im/pictures/stay.jpg",
    sourcePlatform: "Airbnb",
    sourceListingId: "123456",
    locationSource: "address_geocode",
    locationPrecision: "exact",
    customPhotoDataUrl: "data:image/jpeg;base64,QUJDRA==",
    photoOrigin: "lodging_source",
    placeId: "",
    kind: "lodging",
  };
  const saved = responseMock();
  await tripHandler({
    method: "PUT",
    url: `/api/trip?id=${created.payload.trip.id}`,
    headers: { cookie },
    body: { ...created.payload.trip, places: [place] },
  }, saved);
  assert.equal(saved.statusCode, 200);

  const reloaded = responseMock();
  await tripHandler({ method: "GET", url: `/api/trip?id=${created.payload.trip.id}`, headers: { cookie } }, reloaded);
  assert.deepEqual(reloaded.payload.places[0], place);
});

test("owners can remove members, stale clients cannot restore access, and ownership transfers on leave", async () => {
  store.clear();
  const login = async (nickname, pin, ip) => {
    const response = responseMock();
    await memberHandler({ method: "POST", body: { nickname, pin }, headers: { "x-forwarded-for": ip } }, response);
    assert.equal(response.statusCode, 200);
    return { member: response.payload.member, cookie: response.headers["set-cookie"].split(";")[0] };
  };
  const tripsRequest = async (cookie, body) => {
    const response = responseMock();
    await tripsHandler({ method: body ? "POST" : "GET", body, headers: { cookie } }, response);
    return response;
  };

  const owner = await login("哥哥", "1111", "203.0.113.31");
  const companion = await login("妹妹", "2222", "203.0.113.32");
  const created = await tripsRequest(owner.cookie, { action: "create", destination: "東京", title: "家庭東京旅行", startDate: "2026-09-20", endDate: "2026-09-26" });
  const { id: tripId, inviteCode } = created.payload.trip;
  await tripsRequest(companion.cookie, { action: "join", inviteCode });

  const companionCannotRemoveOwner = await tripsRequest(companion.cookie, { action: "removeMember", tripId, memberId: owner.member.id });
  assert.equal(companionCannotRemoveOwner.statusCode, 403);
  assert.equal(companionCannotRemoveOwner.payload.error, "OWNER_REQUIRED");

  const removed = await tripsRequest(owner.cookie, { action: "removeMember", tripId, memberId: companion.member.id });
  assert.equal(removed.statusCode, 200);
  const companionTrips = await tripsRequest(companion.cookie);
  assert.deepEqual(companionTrips.payload.trips, []);

  const staleWrite = responseMock();
  await tripHandler({
    method: "PUT",
    url: `/api/trip?id=${tripId}`,
    headers: { cookie: owner.cookie },
    body: { places: [], votes: {}, itinerary: {}, members: { [companion.member.id]: companion.member.nickname } },
  }, staleWrite);
  assert.equal(staleWrite.statusCode, 200);
  assert.equal(staleWrite.payload.members[companion.member.id], undefined);

  await tripsRequest(companion.cookie, { action: "join", inviteCode });
  const ownerLeft = await tripsRequest(owner.cookie, { action: "leave", tripId });
  assert.equal(ownerLeft.statusCode, 200);
  assert.equal(ownerLeft.payload.ownerId, companion.member.id);
  const companionRead = responseMock();
  await tripHandler({ method: "GET", url: `/api/trip?id=${tripId}`, headers: { cookie: companion.cookie } }, companionRead);
  assert.equal(companionRead.statusCode, 200);
  assert.equal(companionRead.payload.ownerId, companion.member.id);
  assert.equal(companionRead.payload.members[owner.member.id], undefined);

  const lastMemberLeft = await tripsRequest(companion.cookie, { action: "leave", tripId });
  assert.equal(lastMemberLeft.statusCode, 200);
  assert.equal(lastMemberLeft.payload.deleted, true);
  const deletedTrip = responseMock();
  await tripHandler({ method: "GET", url: `/api/trip?id=${tripId}`, headers: { cookie: companion.cookie } }, deletedTrip);
  assert.equal(deletedTrip.statusCode, 404);
  const expiredInvite = await tripsRequest(owner.cookie, { action: "join", inviteCode });
  assert.equal(expiredInvite.statusCode, 404);
  assert.equal(expiredInvite.payload.error, "INVITE_NOT_FOUND");
});

test('legacy area split on authenticated read and save preserves Google identity and unresolved records', async () => {
  store.clear();
  const login=responseMock();
  await memberHandler({method:'POST',body:{nickname:'Audit',pin:'3842'},headers:{'x-forwarded-for':'203.0.113.51'}},login);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const created=responseMock();
  await tripsHandler({method:'POST',headers:{cookie},body:{action:'create',destination:'東京',title:'Audit',startDate:'2026-09-20',endDate:'2026-09-26'}},created);
  const trip=created.payload.trip, key='tokyo-family-trip:trip:'+trip.id;
  const legacy={id:'legacy',travelAreaKey:'ebisu-daikanyama',travelAreaZh:'惠比壽／代官山',travelAreaLocal:'恵比寿／代官山',placeId:'ChIJ_exact',formattedAddress:'東京都渋谷区猿楽町16-15',photos:[{name:'places/ChIJ_exact/photos/one'}],restaurantTags:[],restaurantTagsSource:'manual'};
  const unknown={...legacy,id:'unknown',formattedAddress:'東京都渋谷区恵比寿西2丁目'};
  const harajuku={...legacy,id:'harajuku',travelAreaKey:'harajuku-omotesando',travelAreaZh:'原宿／表參道',travelAreaLocal:'原宿／表参道',formattedAddress:'',travelAreaEvidence:{local:'原宿'}};
  const tower={...legacy,id:'tower',travelAreaKey:'tokyo-tower-shiba',travelAreaZh:'東京鐵塔／芝公園',travelAreaLocal:'東京タワー／芝公園',formattedAddress:'東京都港区芝公園4丁目2-8'};
  const raw=JSON.stringify({...JSON.parse(store.get(key)),places:[legacy,unknown,harajuku,tower]});store.set(key,raw);
  const read=responseMock();
  await tripHandler({method:'GET',url:'/api/trip?id='+trip.id,headers:{cookie}},read);
  assert.equal(read.statusCode,200);assert.equal(store.get(key),raw,'GET does not persist a migration');
  assert.equal(read.payload.places[0].travelAreaKey,'daikanyama');
  for(const field of ['placeId','formattedAddress','photos','restaurantTags','restaurantTagsSource'])assert.deepEqual(read.payload.places[0][field],legacy[field]);
  assert.deepEqual(read.payload.places[1],unknown);
  assert.equal(read.payload.places[2].travelAreaKey,'harajuku');assert.equal(read.payload.places[3].travelAreaKey,'tokyo-tower');
  for(const field of ['placeId','formattedAddress','photos','restaurantTags','restaurantTagsSource']){assert.deepEqual(read.payload.places[2][field],harajuku[field]);assert.deepEqual(read.payload.places[3][field],tower[field]);}
  const saved=responseMock();await tripHandler({method:'PUT',url:'/api/trip?id='+trip.id,headers:{cookie},body:read.payload},saved);
  assert.equal(saved.statusCode,200);
  const again=responseMock();await tripHandler({method:'GET',url:'/api/trip?id='+trip.id,headers:{cookie}},again);
  assert.deepEqual(again.payload.places,saved.payload.places);
  assert.equal(again.payload.places[0].travelAreaKey,'daikanyama');
  assert.deepEqual(again.payload.places[1],unknown);
});


test("authenticated trip API stores and reloads optional areaTags without changing Place identity", async () => {
 store.clear();
 const original={id:"area-label-place",name:"Saved Place",placeId:"ChIJExact",address:"原地址",formattedAddress:"東京都",latitude:35.7,longitude:139.7,photos:[{name:"places/ChIJExact/photos/exact"}],restaurantTags:["日式"],areaTags:["原宿","表參道"]};
 store.set("tokyo-family-trip:v1",JSON.stringify({places:[original],votes:{},itinerary:{},members:{"area-label-member":"Tag tester"},revision:1}));
 const login=responseMock();
 await memberHandler({method:"POST",body:{nickname:"Tag tester",pin:"4826"},headers:{"x-forwarded-for":"203.0.113.50"}},login);
 assert.equal(login.statusCode,200);
 const cookie=login.headers["set-cookie"].split(";")[0];
 const request=async(method,places)=>{
  const response=responseMock();
  await tripHandler({method,headers:{cookie},body:{places},url:"/api/trip?id=tokyo-family-2026"},response);
  assert.equal(response.statusCode,200);return response.payload;
 };
 const put=await request("PUT",[{...original,areaTags:[" 原宿 ","表參道","原宿","自訂區"]},{id:"old",name:"No tags"}]);
 assert.deepEqual(put.places[0],{...original,areaTags:["原宿","表參道","自訂區"]});
 assert.equal(Object.hasOwn(put.places[1],"areaTags"),false);
 assert.deepEqual((await request("GET")).places,put.places);
 const {areaTags,...olderClient}=put.places[0];
 await request("PUT",[olderClient]);
 assert.deepEqual((await request("GET")).places[0].areaTags,["原宿","表參道","自訂區"]);
 await request("PUT",[{...olderClient,areaTags:[]}]);
 assert.deepEqual((await request("GET")).places[0],{...original,areaTags:[]});
});
