import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import socialPlaceImportHandler, {
  cleanRecognition,
  extractAddressHint,
  extractLodgingNameHint,
  lodgingCandidateMatch,
  lodgingDraft,
  lodgingListingId,
  lodgingUrlSlug,
  publicMetadataFromHtml,
  responseSchema,
  isLodgingShareUrl,
  safeSocialMediaUrl,
  safeImportMediaUrl,
  safeSocialUrl,
  sourceHidesPlaceName,
} from "../api/social-place-import.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
const openAiRequests = [];
const googleRequests = [];
let socialHtmlAvailable = true;
let googleRejectLocationBias = false;
let googleAddressFallbackOnly = false;
let googleRomanizedAddresses = false;
let googleInvalidAddressCoordinates = false;
let recognitionPlaceOverride = null;
let socialHtmlOverride = "";
let bookingBlocked = false;
let forceNearbyLodgings = false;

process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.GOOGLE_MAPS_API_KEY = "test-google-key";

globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.includes("booking.com")) {
    if (bookingBlocked) return new Response("challenge", { status: 202, headers: { "Content-Type": "text/html" } });
    return new Response(socialHtmlOverride || `<!doctype html><html><head>
      <meta property="og:title" content="Mitsui Garden Hotel Jingugaien Tokyo Premier" />
      <meta property="og:description" content="Hotel at 11-3 Kasumigaokamachi, Shinjuku City, Tokyo" />
    </head></html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (target.includes("cdninstagram.com")) {
    return new Response(new Uint8Array([255, 216, 255, 217]), {
      status: 200,
      headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
    });
  }
  if (target.includes("muscache.com")) {
    return new Response(new Uint8Array([255, 216, 255, 217]), {
      status: 200,
      headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
    });
  }
  if (target.includes("instagram.com") || target.includes("threads.com")) {
    if (!socialHtmlAvailable) return new Response("登入後才能查看", { status: 403, headers: { "Content-Type": "text/html" } });
    return new Response(socialHtmlOverride || `<!doctype html><html><head>
      <meta property="og:title" content="東京甜點推薦" />
      <meta property="og:description" content="新宿一定要去 Cafe Mugi，抹茶布丁很好吃。" />
    </head></html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (target.includes("api.openai.com/v1/responses")) {
    const body = JSON.parse(options.body);
    openAiRequests.push(body);
    return new Response(JSON.stringify({
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            sourceSummary: "貼文推薦新宿的 Cafe Mugi 抹茶甜點。",
            sourceLanguage: "繁體中文",
            needsMoreContext: false,
            places: Array.isArray(recognitionPlaceOverride) ? recognitionPlaceOverride : [recognitionPlaceOverride || {
              nameOriginal: "Cafe Mugi",
              nameZh: "Cafe Mugi",
              city: "東京",
              area: "新宿",
              country: "日本",
              category: "restaurant",
              address: "",
              nameHidden: false,
              searchClues: "抹茶布丁",
              searchQuery: "Cafe Mugi 新宿 東京",
              evidence: "貼文寫明新宿一定要去 Cafe Mugi。",
              sourceImageIndexes: [1],
              confidence: 0.93,
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (target.includes("places.googleapis.com/v1/places/")) {
    const requestUrl = new URL(target);
    const placeId = decodeURIComponent(requestUrl.pathname.split("/").at(-1));
    const shibuya = placeId === "place-mugi-second";
    return new Response(JSON.stringify({
      addressComponents: [
        { longText: shibuya ? "渋谷区" : "新宿区", types: ["locality"] },
        { longText: "東京都", types: ["administrative_area_level_1"] },
        { longText: "日本", shortText: "JP", types: ["country"] },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (target.includes("places.googleapis.com/v1/places:searchText")) {
    const requestBody = JSON.parse(options.body);
    googleRequests.push({ body: requestBody, headers: options.headers });
    const returnsNamedLodging = /Mitsui Garden Hotel|THE KUKUNA/i.test(requestBody.textQuery);
    if (googleRejectLocationBias && requestBody.locationBias) {
      return new Response(JSON.stringify({ error: { message: "locationBias.circle.radius must be at most 50000" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (googleAddressFallbackOnly) {
      const isAddressLookup = [
        "〒169-0072 東京都新宿区大久保1丁目16-19",
        "東京都, 東京, 〒169-0072 1-16-19, 日本",
        "东京 新宿区 大久保 1 丁目 16-19 -169-0072",
      ].includes(requestBody.textQuery);
      return new Response(JSON.stringify({
        places: isAddressLookup ? [{
          id: "address-okubo-1-16-19",
          displayName: { text: googleRomanizedAddresses ? "1-chōme-16-19 Ōkubo" : "東京都新宿区大久保1丁目16-19" },
          formattedAddress: googleRomanizedAddresses
            ? "1-chōme-16-19 Ōkubo, Shinjuku City, Tokyo 169-0072"
            : "〒169-0072 東京都新宿区大久保1丁目16-19",
          addressComponents: [{ longText: "大久保", types: ["sublocality_level_2"] }],
          primaryType: "street_address",
          types: ["street_address"],
          primaryTypeDisplayName: { text: "地址" },
          location: googleInvalidAddressCoordinates ? { latitude: null, longitude: null } : { latitude: 35.702741, longitude: 139.703741 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=35.702741%2C139.703741",
        }] : [{
          id: "wrong-nearby-lodging",
          displayName: { text: "附近名稱相似住宿" },
          formattedAddress: googleRomanizedAddresses
            ? "1-chōme-16-20 Ōkubo, Shinjuku City, Tokyo 169-0072"
            : "〒169-0072 東京都新宿区大久保1丁目16-20",
          addressComponents: [{ longText: "大久保", types: ["sublocality_level_2"] }],
          primaryType: "lodging",
          types: ["lodging"],
          location: { latitude: 35.7028, longitude: 139.7038 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=wrong",
        }, {
          id: "wrong-nearby-lodging-chome",
          displayName: { text: "另一間附近住宿" },
          formattedAddress: "〒169-0072 東京都新宿区大久保2丁目16-19",
          addressComponents: [{ longText: "大久保", types: ["sublocality_level_2"] }],
          primaryType: "lodging",
          types: ["lodging"],
          location: { latitude: 35.703, longitude: 139.704 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=wrong-chome",
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      places: [
        {
          id: "place-cafe-mugi",
          displayName: { text: "Cafe Mugi 新宿" },
          formattedAddress: "東京都新宿區西新宿 1-2-3",
          addressComponents: [
            { longText: "新宿區", types: ["locality"] },
            { longText: "東京都", types: ["administrative_area_level_1"] },
            { longText: "日本", shortText: "JP", types: ["country"] },
          ],
          primaryType: returnsNamedLodging || forceNearbyLodgings ? "lodging" : "cafe",
          types: [returnsNamedLodging || forceNearbyLodgings ? "lodging" : "cafe"],
          primaryTypeDisplayName: { text: returnsNamedLodging || forceNearbyLodgings ? "住宿" : "咖啡廳" },
          location: { latitude: 35.69, longitude: 139.70 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=Cafe+Mugi",
          regularOpeningHours: { weekdayDescriptions: ["星期一: 10:00-20:00"] },
          nationalPhoneNumber: "03-1234-5678",
          rating: 4.6,
          userRatingCount: 280,
          photos: [{ name: "places/place-cafe-mugi/photos/one", authorAttributions: [{ displayName: "Google 使用者" }] }],
        },
        {
          id: "place-mugi-second",
          displayName: { text: "Mugi Cafe" },
          formattedAddress: "東京都澀谷區 4-5-6",
          addressComponents: [
            { longText: "澀谷區", types: ["locality"] },
            { longText: "東京都", types: ["administrative_area_level_1"] },
            { longText: "日本", shortText: "JP", types: ["country"] },
          ],
          primaryTypeDisplayName: { text: "咖啡廳" },
          primaryType: forceNearbyLodgings ? "hotel" : "cafe",
          types: [forceNearbyLodgings ? "hotel" : "cafe"],
          location: { latitude: 35.66, longitude: 139.70 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=Mugi+Cafe",
          rating: 4.2,
          userRatingCount: 90,
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (target.includes("nominatim.openstreetmap.org/search")) {
    return new Response(JSON.stringify([{
      place_id: 16900721619,
      lat: "35.7008698",
      lon: "139.7030542",
      display_name: "1丁目16-19, 大久保, 新宿区, 東京都, 169-0072, 日本",
      address: { neighbourhood: "大久保", postcode: "169-0072", house_number: "1丁目16-19" },
    }]), { status: 200, headers: { "Content-Type": "application/json" } });
  }

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
  if (command === "EXPIRE") result = 1;
  return new Response(JSON.stringify({ result }), { status: 200, headers: { "Content-Type": "application/json" } });
};

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

async function loginAndCreateTrip() {
  const login = responseMock();
  await memberHandler({ method: "POST", body: { nickname: "阿璋", pin: "1111" }, headers: { "x-forwarded-for": "203.0.113.81" } }, login);
  assert.equal(login.statusCode, 200);
  const cookie = login.headers["set-cookie"].split(";")[0];
  const create = responseMock();
  await tripsHandler({
    method: "POST",
    body: { action: "create", destination: "東京", title: "東京旅行", startDate: "2026-09-20", endDate: "2026-09-26" },
    headers: { cookie },
  }, create);
  assert.equal(create.statusCode, 201);
  return { cookie, trip: create.payload.trip };
}

async function recognize({ cookie = "", tripId = "", sourceUrl = "https://www.instagram.com/reel/ABC123/", sharedText = "", imageDataUrl = "", requestedKind = "auto", action = "", query = "", excludePlaceIds = [] } = {}) {
  const response = responseMock();
  await socialPlaceImportHandler({
    method: "POST",
    body: { tripId, sourceUrl, sharedText, imageDataUrl, requestedKind, action, query, excludePlaceIds },
    headers: cookie ? { cookie } : {},
  }, response);
  return response;
}

test("social metadata parser reads Open Graph content without accepting arbitrary hosts", () => {
  assert.equal(safeSocialUrl("https://www.instagram.com/reel/ABC123/")?.hostname, "www.instagram.com");
  assert.equal(safeSocialUrl("https://www.instagram.com/reel/Db0DU2OykW0/?igsh=example")?.pathname, "/reel/Db0DU2OykW0/");
  assert.equal(safeSocialUrl("http://127.0.0.1/private"), null);
  assert.equal(safeSocialUrl("https://example.com/place"), null);
  assert.equal(safeSocialUrl("https://www.agoda.com/example-hotel/hotel/tokyo-jp.html")?.hostname, "www.agoda.com");
  assert.equal(safeSocialUrl("https://www.booking.com/hotel/jp/example.html")?.hostname, "www.booking.com");
  assert.equal(safeSocialUrl("https://www.airbnb.com/rooms/123")?.hostname, "www.airbnb.com");
  assert.equal(safeSocialUrl("https://tw.trip.com/hotels/w/detail/?hotelid=56737637")?.hostname, "tw.trip.com");
  assert.equal(isLodgingShareUrl(safeSocialUrl("https://abnb.me/example")), true);
  assert.equal(safeSocialMediaUrl("https://scontent.cdninstagram.com/photo.jpg")?.hostname, "scontent.cdninstagram.com");
  assert.equal(safeSocialMediaUrl("https://example.com/photo.jpg"), null);
  assert.deepEqual(publicMetadataFromHtml('<meta content="A &amp; B" property="og:title"><meta name="description" content="推薦餐廳"><meta property="og:image" content="https://scontent.cdninstagram.com/photo.jpg?x=1">'), {
    title: "A & B",
    description: "推薦餐廳",
    imageUrl: "https://scontent.cdninstagram.com/photo.jpg?x=1",
    imageUrls: ["https://scontent.cdninstagram.com/photo.jpg?x=1"],
    videoUrl: "",
  });
});

test("Booking structured metadata exposes its full postal address to lodging recognition", () => {
  const metadata = publicMetadataFromHtml(`<!doctype html><html><head>
    <meta property="og:title" content="50 平方 - 2 浴室 2 卫生间 - 新宿 1 站地 - 大久保 - Ikeman St - 歌舞伎町 - Liberty Stay" />
    <meta property="og:description" content="東京公寓住宿" />
    <script type="application/json">{"location":{"latitude":35.703991,"longitude":139.7051782,"formattedAddress":"東京都, 東京, 〒169-0072 1-16-19, 日本"}}</script>
  </head></html>`);

  assert.equal(metadata.address, "東京都, 東京, 〒169-0072 1-16-19, 日本");
  assert.equal(metadata.lodgingName, "Liberty Stay");
});

test("social metadata parser collects only main-post carousel images and excludes avatars", () => {
  const metadata = publicMetadataFromHtml(`<!doctype html><html><head>
    <meta property="og:image" content="https://scontent.cdninstagram.com/v/t51.82787-15/cover.jpg?one=1" />
  </head><body>
    <img alt="Lin's profile picture" width="36" height="36" src="https://scontent.cdninstagram.com/v/t51.82787-19/avatar.jpg" />
    <img alt="Video cover" src="https://scontent.cdninstagram.com/v/t51.82787-15/cover.jpg?two=2" />
    <img alt="Carousel photo" src="https://scontent.cdninstagram.com/v/t51.82787-15/ginza-brazil.jpg" />
    <img alt="Carousel photo" src="https://scontent.cdninstagram.com/v/t51.82787-15/restaurant-two.jpg" />
    <img alt="Unrelated asset" src="https://scontent.cdninstagram.com/static/icon.png" />
  </body></html>`);

  assert.deepEqual(metadata.imageUrls, [
    "https://scontent.cdninstagram.com/v/t51.82787-15/cover.jpg?one=1",
    "https://scontent.cdninstagram.com/v/t51.82787-15/ginza-brazil.jpg",
    "https://scontent.cdninstagram.com/v/t51.82787-15/restaurant-two.jpg",
  ]);
});

test("lodging metadata keeps only allowlisted source images and listing identities", () => {
  const airbnbUrl = "https://www.airbnb.com.tw/rooms/864737495568855964";
  const metadata = publicMetadataFromHtml(`<!doctype html><html><head>
    <script type="application/ld+json">{
      "@type":"Product",
      "name":"海景、風景如畫的露臺、溫泉、烤肉",
      "image":"https://a0.muscache.com/im/pictures/listing.jpg"
    }</script>
    <script type="application/ld+json">{
      "@type":"VacationRental",
      "latitude":35.03297,
      "longitude":139.07494,
      "address":{"addressLocality":"熱海市"}
    }</script>
    <meta property="og:image" content="https://example.com/not-allowed.jpg" />
  </head></html>`, airbnbUrl);
  assert.equal(metadata.lodgingName, "海景、風景如畫的露臺、溫泉、烤肉");
  assert.deepEqual(metadata.imageUrls, ["https://a0.muscache.com/im/pictures/listing.jpg"]);
  assert.equal(metadata.locationApproximate, true);
  assert.equal(safeImportMediaUrl("https://a0.muscache.com/im/pictures/listing.jpg")?.hostname, "a0.muscache.com");
  assert.equal(safeImportMediaUrl("https://example.com/not-allowed.jpg"), null);
  assert.equal(lodgingListingId(airbnbUrl), "864737495568855964");
  assert.equal(lodgingListingId("https://tw.trip.com/hotels/w/detail/?hotelid=56737637"), "56737637");
});

test("lodging draft separates source evidence from Google candidate matching", () => {
  const draft = lodgingDraft({
    metadata: {
      lodgingName: "湘南藤澤微笑飯店(Smile Hotel Shonan Fujisawa)",
      address: "19-12 Minamifujisawa, 251-0055 藤澤市",
      finalUrl: "https://tw.trip.com/hotels/w/detail/?hotelid=56737637",
    },
    platform: "Trip.com",
    sourceImageEntry: { url: "https://ak-d.tripcdn.com/example.jpg", dataUrl: "data:image/jpeg;base64,AA==" },
  });
  assert.equal(draft.sourcePlatform, "Trip.com");
  assert.equal(draft.sourceListingId, "56737637");
  assert.equal(draft.locationPrecision, "exact");
  assert.equal(draft.sourceImageDataUrl, "data:image/jpeg;base64,AA==");
});

test("lodging candidate scoring rejects a conflicting Agoda branch and unrelated nearby hotels", () => {
  const mention = {
    name: "河堤漫旅自立館",
    nameZh: "河堤漫旅自立館",
    nameOriginal: "River inn ZihLi",
    city: "高雄市",
    area: "三民區",
    address: "",
  };
  const wrongBranch = lodgingCandidateMatch(mention, {
    displayName: { text: "河堤漫旅 站前館" },
    formattedAddress: "高雄市三民區建國二路",
  });
  const correctBranch = lodgingCandidateMatch(mention, {
    displayName: { text: "河堤漫旅 自立館" },
    formattedAddress: "高雄市三民區自立一路",
  });
  const unrelated = lodgingCandidateMatch(mention, {
    displayName: { text: "高雄站前商務飯店" },
    formattedAddress: "高雄市三民區",
  });
  assert.equal(wrongBranch.branchConflict, true);
  assert.equal(wrongBranch.eligibleForRecommendation, false);
  assert.equal(correctBranch.eligibleForRecommendation, true);
  assert.equal(unrelated.eligibleForRecommendation, false);
});

test("Trip.com bilingual names are not wrapped in duplicate parentheses", () => {
  const result = cleanRecognition({
    sourceSummary: "Trip.com 住宿頁",
    sourceLanguage: "繁體中文",
    needsMoreContext: false,
    places: [{
      nameOriginal: "湘南藤澤微笑飯店(Smile Hotel Shonan Fujisawa)",
      nameZh: "湘南藤澤微笑飯店",
      city: "藤澤市",
      area: "",
      country: "日本",
      category: "lodging",
      address: "19-12 Minamifujisawa, 251-0055 藤澤市",
      nameHidden: false,
      searchClues: "",
      searchQuery: "Smile Hotel Shonan Fujisawa",
      evidence: "Hotel JSON-LD",
      sourceImageIndexes: [],
      confidence: 0.99,
    }],
  }, { requestedKind: "lodging" });
  assert.equal(result.places[0].name, "湘南藤澤微笑飯店(Smile Hotel Shonan Fujisawa)");
  assert.doesNotMatch(result.places[0].name, /（湘南藤澤微笑飯店\(/u);
});

test("social address helpers retain explicit lodging addresses and detect hidden profile names", () => {
  const caption = "地址:山梨縣南都留郡富士河口湖町淺川\n🔗飯店名稱及訂房連結在個人檔案置頂連結 [03✨]";
  assert.equal(extractAddressHint(caption), "山梨縣南都留郡富士河口湖町淺川");
  assert.equal(
    extractAddressHint("50平方大久保公寓\n〒169-0072 東京都新宿区大久保1-16-19\n距離新大久保站很近"),
    "〒169-0072 東京都新宿区大久保1-16-19",
  );
  assert.equal(sourceHidesPlaceName(caption), true);
});

test("an exact source postal address overrides a similar lodging address returned by AI", () => {
  const result = cleanRecognition({
    sourceSummary: "Booking.com 住宿頁",
    sourceLanguage: "繁體中文",
    needsMoreContext: false,
    places: [{
      nameOriginal: "50平方大久保公寓",
      nameZh: "50平方大久保公寓",
      city: "東京",
      area: "大久保",
      country: "日本",
      category: "lodging",
      address: "〒169-0072 東京都新宿区大久保1-16-20",
      nameHidden: false,
      searchClues: "公寓",
      searchQuery: "50平方大久保公寓",
      evidence: "網頁搜尋找到相似住宿",
      sourceImageIndexes: [],
      confidence: 0.8,
    }],
  }, {
    addressHint: "〒169-0072 東京都新宿区大久保1-16-19",
    requestedKind: "lodging",
  });

  assert.equal(result.places[0].address, "〒169-0072 東京都新宿区大久保1-16-19");
});

test("a descriptor-heavy Booking name from AI is reduced to its official property suffix", () => {
  const longDescription = "70 平方 - 大久保 - 新宿 1 站地 - Ikeman St - 歌舞伎町 - 2 浴室 2 衛生間 - ".repeat(3);
  const result = cleanRecognition({
    sourceSummary: "Booking.com 住宿頁",
    sourceLanguage: "繁體中文",
    needsMoreContext: false,
    places: [{
      nameOriginal: `${longDescription}Liberty Stay`,
      nameZh: "70 平方 - 大久保 - 新宿 1 站地 - Ikeman St - 歌舞伎町公寓",
      city: "東京",
      area: "大久保",
      country: "日本",
      category: "lodging",
      address: "〒169-0072 東京都新宿区大久保1-16-19",
      nameHidden: false,
      searchClues: "公寓型住宿",
      searchQuery: "70 平方 大久保 新宿 1 站地 Ikeman St 歌舞伎町公寓",
      evidence: "Booking.com 住宿頁",
      sourceImageIndexes: [],
      confidence: 0.9,
    }],
  }, {
    requestedKind: "lodging",
  });

  assert.equal(result.places[0].nameOriginal, "Liberty Stay");
  assert.equal(result.places[0].nameZh, "");
  assert.equal(result.places[0].name, "Liberty Stay");
  assert.match(result.places[0].searchQuery, /^Liberty Stay /);
  assert.doesNotMatch(result.places[0].searchQuery, /70\s*平方/);
});

test("social recognition cleanup removes duplicate aliases and keeps structured place meaning", () => {
  const result = cleanRecognition({
    sourceSummary: "推薦新宿咖啡廳",
    sourceLanguage: "中文",
    needsMoreContext: false,
    places: [
      { nameOriginal: "Cafe Mugi", nameZh: "Cafe Mugi", city: "東京", area: "新宿", country: "日本", category: "restaurant", searchQuery: "Cafe Mugi 新宿", evidence: "內文提及", sourceImageIndexes: [1, 1, 22, 2], confidence: 0.9 },
      { nameOriginal: "Cafe Mugi", nameZh: "Cafe Mugi", city: "東京", area: "新宿", country: "日本", category: "restaurant", searchQuery: "Cafe Mugi 新宿", evidence: "重複", confidence: 0.8 },
    ],
  });
  assert.equal(result.places.length, 1);
  assert.equal(result.places[0].name, "Cafe Mugi");
  assert.equal(result.places[0].category, "restaurant");
  assert.deepEqual(result.places[0].sourceImageIndexes, [1, 2]);
  assert.equal(responseSchema.properties.places.items.properties.sourceImageIndexes.maxItems, 4);
});

test("an explicit address remains searchable when AI cannot identify the hidden lodging name", () => {
  const result = cleanRecognition({
    sourceSummary: "貼文提供住宿地址，但名稱在個人頁面的置頂連結。",
    sourceLanguage: "繁體中文",
    needsMoreContext: true,
    places: [],
  }, {
    addressHint: "山梨縣南都留郡富士河口湖町淺川",
    nameHiddenHint: true,
    requestedKind: "lodging",
    sourceText: "飯店名稱在個人檔案，地址位於富士河口湖町淺川。",
  });

  assert.equal(result.places.length, 1);
  assert.equal(result.places[0].name, "地址附近住宿");
  assert.equal(result.places[0].category, "lodging");
  assert.equal(result.places[0].address, "山梨縣南都留郡富士河口湖町淺川");
  assert.equal(result.places[0].nameHidden, true);
});

test("social recognition keeps up to twenty distinct places from one post", () => {
  const places = Array.from({ length: 24 }, (_, index) => ({
    nameOriginal: `Store ${index + 1}`,
    nameZh: `店家 ${index + 1}`,
    city: "東京",
    area: "",
    country: "日本",
    category: "shopping",
    address: "",
    nameHidden: false,
    searchClues: "",
    searchQuery: `Store ${index + 1} Tokyo`,
    evidence: "貼文列出的店家",
    confidence: 0.9,
  }));
  const result = cleanRecognition({
    sourceSummary: "東京店家清單",
    sourceLanguage: "zh-TW",
    needsMoreContext: false,
    places,
  });

  assert.equal(responseSchema.properties.places.maxItems, 20);
  assert.equal(result.places.length, 20);
  assert.equal(result.places[19].nameOriginal, "Store 20");
});

test("social place import requires membership and returns Google candidates for confirmation", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  socialHtmlAvailable = true;
  googleRejectLocationBias = false;
  recognitionPlaceOverride = null;
  socialHtmlOverride = "";
  const { cookie, trip } = await loginAndCreateTrip();

  const anonymous = await recognize({ tripId: trip.id });
  assert.equal(anonymous.statusCode, 401);
  assert.equal(openAiRequests.length, 0);

  const response = await recognize({
    cookie,
    tripId: trip.id,
    imageDataUrl: "data:image/jpeg;base64,QUJDRA==",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.source.platform, "Instagram");
  assert.equal(response.payload.groups.length, 1);
  assert.equal(response.payload.groups[0].candidates.length, 2);
  assert.equal(response.payload.groups[0].candidates[0].name, "Cafe Mugi 新宿");
  assert.equal(response.payload.groups[0].candidates[0].kind, "restaurant");
  assert.equal(response.payload.groups[0].candidates[0].rating, 4.6);
  assert.equal(response.payload.groups[0].candidates[0].referenceUrl, "https://www.instagram.com/reel/ABC123/");
  assert.equal(response.payload.groups[0].candidates[0].sourceEvidence, "貼文寫明新宿一定要去 Cafe Mugi。");
  assert.deepEqual(response.payload.groups[0].candidates[0].sourceImageIndexes, [1]);
  assert.equal(response.payload.groups[0].candidates[0].travelAreaKey, "shinjuku");
  assert.equal(response.payload.groups[0].candidates[0].travelAreaZh, "新宿");
  assert.equal(response.payload.groups[0].candidates[0].travelAreaLocal, "新宿");
  assert.equal(response.payload.groups[0].candidates[0].travelAreaResolutionVersion, 5);
  assert.equal(response.payload.groups[0].candidates[0].countryCode, "JP");
  assert.match(response.payload.source.originalText, /新宿一定要去 Cafe Mugi/);
  assert.equal(response.payload.groups[0].candidates[0].sourceUrl.includes("google.com/maps"), true);

  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].model, "gpt-5.6-luna");
  assert.equal(openAiRequests[0].text.format.type, "json_schema");
  assert.equal(openAiRequests[0].text.format.strict, true);
  assert.equal(openAiRequests[0].store, false);
  assert.equal(openAiRequests[0].input[1].content[1].detail, "original");
  assert.match(openAiRequests[0].input[0].content, /未受信任的參考資料/);
  assert.equal(googleRequests.length, 1);
  assert.equal(googleRequests[0].body.maxResultCount, 3);
  assert.equal(googleRequests[0].body.regionCode, "JP");
  assert.equal(googleRequests[0].headers["X-Goog-Api-Key"], "test-google-key");
});

test("Agoda Booking.com and Airbnb links are accepted as lodging sources and keep the original link", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  recognitionPlaceOverride = {
    nameOriginal: "Mitsui Garden Hotel Jingugaien Tokyo Premier",
    nameZh: "三井花園飯店神宮外苑之杜普米爾",
    city: "東京",
    area: "新宿",
    country: "日本",
    category: "lodging",
    address: "11-3 Kasumigaokamachi, Shinjuku City, Tokyo",
    nameHidden: false,
    searchClues: "hotel",
    searchQuery: "Mitsui Garden Hotel Jingugaien Tokyo Premier",
    evidence: "Booking.com 頁面標題與地址",
    sourceImageIndexes: [],
    confidence: 0.97,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const bookingUrl = "https://www.booking.com/hotel/jp/mitsui-garden-jingugaien-tokyo-premier.html";

  const response = await recognize({ cookie, tripId: trip.id, sourceUrl: bookingUrl });
  googleAddressFallbackOnly = false;
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.source.platform, "Booking.com");
  assert.equal(response.payload.groups[0].extracted.category, "lodging");
  assert.equal(response.payload.groups[0].candidates[0].kind, "lodging");
  assert.equal(response.payload.groups[0].candidates[0].referenceUrl, bookingUrl);
  assert.deepEqual(openAiRequests[0].tools, [{ type: "web_search" }]);
  assert.match(openAiRequests[0].input[1].content[0].text, /"requestedKind":"lodging"/);
  recognitionPlaceOverride = null;
});

test("lodging imports keep a self-create draft when restaurant results are excluded", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  socialHtmlOverride = "<!doctype html><html><head><title>Private stay</title></head></html>";
  recognitionPlaceOverride = {
    nameOriginal: "Private stay without a map listing",
    nameZh: "私人住宿",
    city: "東京",
    area: "",
    country: "日本",
    category: "lodging",
    address: "",
    nameHidden: false,
    searchClues: "private stay",
    searchQuery: "Private stay without a map listing Tokyo",
    evidence: "住宿頁名稱",
    sourceImageIndexes: [],
    confidence: 0.7,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "https://www.booking.com/hotel/jp/private-stay.html",
  });
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.groups[0].candidates.length, 0);
  assert.equal(response.payload.lodgingDraft.sourceLodgingName, "Private stay without a map listing");
  assert.equal(response.payload.lodgingDraft.referenceUrl, "https://www.booking.com/hotel/jp/private-stay.html");
  assert.equal(googleRequests.length, 1);
});

test("a blocked Booking page returns an empty self-create draft without searching nearby hotels", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  bookingBlocked = true;
  const { cookie, trip } = await loginAndCreateTrip();
  const bookingUrl = "https://www.booking.com/hotel/jp/private-apartment.html?app_hotel_id=9589860";
  const response = await recognize({ cookie, tripId: trip.id, sourceUrl: bookingUrl });
  bookingBlocked = false;

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload.groups, []);
  assert.equal(response.payload.lodgingDraft.sourcePlatform, "Booking.com");
  assert.equal(response.payload.lodgingDraft.referenceUrl, bookingUrl);
  assert.equal(response.payload.lodgingDraft.sourceListingId, "9589860");
  assert.equal(response.payload.lodgingDraft.requiresName, true);
  assert.equal(response.payload.lodgingDraft.requiresAddress, true);
  assert.equal(openAiRequests.length, 0);
  assert.equal(googleRequests.length, 0);
});

test("nearby lodging with an unrelated name is returned unselected and not recommended", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  forceNearbyLodgings = true;
  socialHtmlOverride = "<!doctype html><html><head><title>Private stay</title></head></html>";
  recognitionPlaceOverride = {
    nameOriginal: "Private stay without a map listing",
    nameZh: "私人住宿",
    city: "東京",
    area: "新宿",
    country: "日本",
    category: "lodging",
    address: "",
    nameHidden: false,
    searchClues: "",
    searchQuery: "Private stay without a map listing Tokyo",
    evidence: "住宿頁名稱",
    sourceImageIndexes: [],
    confidence: 0.8,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "https://www.airbnb.com/rooms/123456",
  });
  forceNearbyLodgings = false;
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.ok(response.payload.groups[0].candidates.length >= 1);
  assert.equal(response.payload.groups[0].candidates.some((candidate) => candidate.recommended), false);
  assert.ok(response.payload.lodgingDraft);
});

test("a Booking apartment uses its exact postal address and rejects a nearby lodging", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleAddressFallbackOnly = true;
  recognitionPlaceOverride = {
    nameOriginal: "50平方-大久保-新宿1站地-Ikeman ST-歌舞伎町-2浴室2衛生間",
    nameZh: "50平方大久保公寓",
    city: "東京",
    area: "大久保",
    country: "日本",
    category: "lodging",
    address: "〒169-0072 東京都新宿区大久保1丁目16-19",
    nameHidden: false,
    searchClues: "公寓型住宿、新大久保站附近",
    searchQuery: "50平方 大久保 新宿 Ikeman ST",
    evidence: "Booking.com 住宿頁提供名稱與地址",
    sourceImageIndexes: [],
    confidence: 0.9,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const bookingUrl = "https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html";

  const response = await recognize({ cookie, tripId: trip.id, sourceUrl: bookingUrl });
  googleAddressFallbackOnly = false;
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.equal(googleRequests.length, 2);
  assert.equal(googleRequests[1].body.textQuery, "〒169-0072 東京都新宿区大久保1丁目16-19");
  assert.equal(response.payload.groups[0].candidates.length, 1);
  const candidate = response.payload.groups[0].candidates[0];
  assert.equal(candidate.coordinateFallback, true);
  assert.equal(candidate.kind, "lodging");
  assert.equal(candidate.category, "住宿座標");
  assert.equal(candidate.name, "50平方大久保公寓(50平方-大久保-新宿1站地-Ikeman ST-歌舞伎町-2浴室2衛生間)");
  assert.equal(candidate.formattedAddress, "〒169-0072 東京都新宿区大久保1丁目16-19");
  assert.equal(candidate.latitude, 35.702741);
  assert.equal(candidate.longitude, 139.703741);
  assert.match(candidate.sourceUrl, /query=35\.702741%2C139\.703741/);
  assert.equal(candidate.referenceUrl, bookingUrl);
  assert.equal(candidate.photosLoaded, true);
  assert.match(candidate.description, /沒有獨立商家頁/);
});

test("a multi-line host message keeps its labelled address, lodging name, and URL slug clues", () => {
  const hostMessage = [
    "1、公寓名称：自由之家",
    "",
    "2、公寓地址：东京 新宿区 大久保 1 丁目 16-19 -169-0072",
    "",
    "3、地图链接：https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8",
    "",
    "4、公寓电话：81-90-3180-9800",
  ].join("\n");
  assert.equal(extractAddressHint(hostMessage), "东京 新宿区 大久保 1 丁目 16-19 -169-0072");
  assert.equal(extractLodgingNameHint(hostMessage), "自由之家");
  assert.equal(extractLodgingNameHint("飯店名稱：東橫INN新宿"), "東橫INN新宿");
  assert.equal(extractLodgingNameHint("這是一般貼文，沒有名稱標籤"), "");
  assert.equal(
    lodgingUrlSlug("https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html?aid=1"),
    "50 ping fang da jiu bao xin su 1 zhan di ikeman st ge wu ji ting 2 yu shi 2 wei",
  );
  assert.equal(lodgingUrlSlug("https://www.instagram.com/reel/ABC123/"), "");
});

test("a blocked Booking page with pasted host details still yields a correctly named coordinate candidate", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleAddressFallbackOnly = true;
  googleRomanizedAddresses = true;
  socialHtmlOverride = "<!doctype html><html><head><title></title></head><body>challenge</body></html>";
  recognitionPlaceOverride = [];
  const { cookie, trip } = await loginAndCreateTrip();
  const bookingUrl = "https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html";
  const hostMessage = [
    "1、公寓名称：自由之家",
    "2、公寓地址：东京 新宿区 大久保 1 丁目 16-19 -169-0072",
    "4、公寓电话：81-90-3180-9800",
  ].join("\n");

  const response = await recognize({ cookie, tripId: trip.id, sourceUrl: bookingUrl, sharedText: hostMessage });
  googleAddressFallbackOnly = false;
  googleRomanizedAddresses = false;
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  const aiReference = openAiRequests[0].input[1].content[0].text;
  assert.match(aiReference, /"publicPageUnavailable":true/);
  assert.match(aiReference, /"publicLodgingName":"自由之家"/);
  assert.match(aiReference, /"lodgingUrlSlug":"50 ping fang da jiu bao xin su 1 zhan di ikeman st ge wu ji ting 2 yu shi 2 wei"/);
  assert.equal(response.payload.groups.length, 1);
  const candidates = response.payload.groups[0].candidates;
  assert.equal(candidates.length, 1, "romanized nearby lodgings with other house numbers must be rejected");
  const candidate = candidates[0];
  assert.equal(candidate.name, "自由之家");
  assert.equal(candidate.kind, "lodging");
  assert.equal(candidate.coordinateFallback, true);
  assert.equal(candidate.latitude, 35.702741);
  assert.equal(candidate.longitude, 139.703741);
  assert.equal(candidate.referenceUrl, bookingUrl);
});

test("a Booking page structured address creates a coordinate candidate when OpenAI omits the address", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleAddressFallbackOnly = true;
  socialHtmlOverride = `<!doctype html><html><head>
    <meta property="og:title" content="50 平方 - 2 浴室 2 卫生间 - 新宿 1 站地 - 大久保 - Ikeman St - 歌舞伎町 - Liberty Stay" />
    <meta property="og:description" content="東京大久保的公寓住宿" />
    <script type="application/json">{"location":{"latitude":35.703991,"longitude":139.7051782,"formattedAddress":"東京都, 東京, 〒169-0072 1-16-19, 日本"}}</script>
  </head></html>`;
  recognitionPlaceOverride = {
    nameOriginal: "50 平方 - 2 浴室 2 卫生间 - 新宿 1 站地 - 大久保 - Ikeman St - 歌舞伎町 - Liberty Stay",
    nameZh: "自由之家",
    city: "東京",
    area: "大久保",
    country: "日本",
    category: "lodging",
    address: "",
    nameHidden: false,
    searchClues: "公寓型住宿",
    searchQuery: "50平方大久保公寓 Liberty Stay",
    evidence: "Booking.com 住宿頁",
    sourceImageIndexes: [],
    confidence: 0.9,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const bookingUrl = "https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html";

  const response = await recognize({ cookie, tripId: trip.id, sourceUrl: bookingUrl });
  googleAddressFallbackOnly = false;
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.equal(googleRequests[1].body.textQuery, "東京都, 東京, 〒169-0072 1-16-19, 日本");
  assert.equal(response.payload.groups[0].candidates[0].coordinateFallback, true);
  assert.equal(response.payload.groups[0].candidates[0].name, "自由之家(Liberty Stay)");
  assert.equal(response.payload.groups[0].candidates[0].formattedAddress, "〒169-0072 東京都新宿区大久保1丁目16-19");
  assert.match(openAiRequests[0].input[1].content[0].text, /publicAddress/);
  assert.match(openAiRequests[0].input[1].content[0].text, /publicLodgingName/);
});

test("a Booking coordinate candidate keeps Liberty Stay when public title metadata is unavailable", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleAddressFallbackOnly = true;
  socialHtmlOverride = `<!doctype html><html><head>
    <script type="application/json">{"location":{"formattedAddress":"東京都, 東京, 〒169-0072 1-16-19, 日本"}}</script>
  </head></html>`;
  recognitionPlaceOverride = {
    nameOriginal: `${"70 平方 - 大久保 - 新宿 1 站地 - Ikeman St - 歌舞伎町 - 2 浴室 2 衛生間 - ".repeat(3)}Liberty Stay`,
    nameZh: "70 平方 - 大久保 - 新宿 1 站地 - Ikeman St - 歌舞伎町公寓",
    city: "東京",
    area: "大久保",
    country: "日本",
    category: "lodging",
    address: "",
    nameHidden: false,
    searchClues: "公寓型住宿",
    searchQuery: "70 平方 大久保 新宿公寓",
    evidence: "Booking.com 住宿頁",
    sourceImageIndexes: [],
    confidence: 0.9,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao.html",
  });
  googleAddressFallbackOnly = false;
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.groups[0].extracted.name, "Liberty Stay");
  assert.equal(response.payload.groups[0].candidates[0].name, "Liberty Stay");
  assert.match(googleRequests[0].body.textQuery, /^Liberty Stay /);
});

test("a null Google address location never becomes 0,0 and falls back to a real address coordinate", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleAddressFallbackOnly = true;
  googleInvalidAddressCoordinates = true;
  socialHtmlOverride = `<!doctype html><html><head>
    <meta property="og:title" content="50 平方 - 2 浴室 2 卫生间 - 大久保 - Liberty Stay" />
    <script type="application/json">{"location":{"formattedAddress":"東京都新宿区大久保 〒169-0072 1-16-19"}}</script>
  </head></html>`;
  recognitionPlaceOverride = {
    nameOriginal: "50 平方 - 2 浴室 2 卫生间 - 大久保 - Liberty Stay",
    nameZh: "自由之家",
    city: "東京",
    area: "大久保",
    country: "日本",
    category: "lodging",
    address: "",
    nameHidden: false,
    searchClues: "公寓型住宿",
    searchQuery: "Liberty Stay 大久保",
    evidence: "Booking.com 住宿頁",
    sourceImageIndexes: [],
    confidence: 0.9,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "https://www.booking.com/hotel/jp/liberty-stay.html",
  });
  googleAddressFallbackOnly = false;
  googleInvalidAddressCoordinates = false;
  socialHtmlOverride = "";
  recognitionPlaceOverride = null;

  assert.equal(response.statusCode, 200);
  const candidate = response.payload.groups[0].candidates[0];
  assert.equal(candidate.latitude, 35.7008698);
  assert.equal(candidate.longitude, 139.7030542);
  assert.notEqual(candidate.sourceUrl, "https://www.google.com/maps/search/?api=1&query=0.000000%2C0.000000");
  assert.equal(candidate.addressProvider, "OpenStreetMap");
});

test("one ambiguous place can be rematched without rerunning the social AI recognition", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  const { cookie, trip } = await loginAndCreateTrip();

  const response = await recognize({
    cookie,
    tripId: trip.id,
    action: "rematch",
    query: "Mugi Cafe 澀谷",
    requestedKind: "restaurant",
    excludePlaceIds: ["place-cafe-mugi"],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.candidates.length, 1);
  assert.equal(response.payload.candidates[0].placeId, "place-mugi-second");
  assert.equal(openAiRequests.length, 0);
  assert.equal(googleRequests.length, 1);
  assert.equal(googleRequests[0].body.maxResultCount, 10);
  assert.match(googleRequests[0].body.textQuery, /Mugi Cafe 澀谷/);
});

test("public social carousel images beyond the old HTML cutoff are fetched into one visual-recognition request", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  socialHtmlAvailable = true;
  recognitionPlaceOverride = null;
  socialHtmlOverride = `<!doctype html><html><head>
    <meta property="og:title" content="東京餐廳推薦" />
    <meta property="og:description" content="店家資訊請看圖片" />
    <meta property="og:image" content="https://scontent.cdninstagram.com/thread-cover.jpg" />
  </head><body>${"x".repeat(550000)}
    <img alt="Eddie's profile picture" width="36" height="36" src="https://scontent.cdninstagram.com/v/t51.82787-19/avatar.jpg" />
    <img alt="Carousel photo" src="https://scontent.cdninstagram.com/v/t51.82787-15/ginza-brazil.jpg" />
    <img alt="Carousel photo" src="https://scontent.cdninstagram.com/v/t51.82787-15/restaurant-two.jpg" />
  </body></html>`;
  const { cookie, trip } = await loginAndCreateTrip();

  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "https://www.threads.com/share/BARaD4Oi12/",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(openAiRequests.length, 1);
  const imageInputs = openAiRequests[0].input[1].content.filter((entry) => entry.type === "input_image");
  assert.equal(imageInputs.length, 3);
  assert.equal(imageInputs.every((entry) => entry.image_url === "data:image/jpeg;base64,/9j/2Q=="), true);
  assert.equal(imageInputs.every((entry) => entry.detail === "high"), true);
  assert.match(openAiRequests[0].input[1].content[0].text, /所有附件影像/);
  assert.match(openAiRequests[0].input[1].content[0].text, /編號為 1 到 3/);
  assert.equal(response.payload.source.imageUrls.length, 3);
  assert.match(response.payload.source.originalText, /店家資訊請看圖片/);
  socialHtmlOverride = "";
});

test("login-gated social posts request a screenshot before spending AI tokens", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  socialHtmlAvailable = false;
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({ cookie, tripId: trip.id });
  assert.equal(response.statusCode, 422);
  assert.equal(response.payload.error, "SOURCE_CONTENT_REQUIRED");
  assert.equal(openAiRequests.length, 0);
  assert.equal(googleRequests.length, 0);
  socialHtmlAvailable = true;
});

test("social screenshot works without a link and labels its source clearly", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  recognitionPlaceOverride = null;
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({
    cookie,
    tripId: trip.id,
    sourceUrl: "",
    imageDataUrl: "data:image/jpeg;base64,QUJDRA==",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.source.platform, "社群截圖");
  assert.equal(openAiRequests[0].input[1].content[1].detail, "original");
});

test("ambiguous places use a valid 50 km bias and retry without it after Google rejects the bias", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  googleRejectLocationBias = true;
  recognitionPlaceOverride = {
    nameOriginal: "天橋立",
    nameZh: "天橋立",
    city: "",
    area: "",
    country: "",
    category: "attraction",
    searchQuery: "天橋立 京都 日本",
    evidence: "影片介紹天橋立纜車與景觀。",
    confidence: 0.95,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const tripKey = `tokyo-family-trip:trip:${trip.id}`;
  const persistedTrip = JSON.parse(store.get(tripKey));
  persistedTrip.places = [{ name: "東京車站", latitude: 35.6812, longitude: 139.7671 }];
  store.set(tripKey, JSON.stringify(persistedTrip));

  const response = await recognize({ cookie, tripId: trip.id });
  assert.equal(response.statusCode, 200);
  assert.equal(googleRequests.length, 2);
  assert.equal(googleRequests[0].body.locationBias.circle.radius, 50000);
  assert.equal(googleRequests[1].body.locationBias, undefined);
  googleRejectLocationBias = false;
  recognitionPlaceOverride = null;
});

test("hidden lodging names use an explicit address, conditional web search, and expanded Google candidates", async () => {
  store.clear();
  openAiRequests.length = 0;
  googleRequests.length = 0;
  socialHtmlAvailable = true;
  socialHtmlOverride = `<!doctype html><html><head>
    <meta property="og:title" content="河口湖富士山住宿" />
    <meta property="og:description" content="地址:山梨縣南都留郡富士河口湖町淺川 🔗飯店名稱及訂房連結在個人檔案置頂連結 [03✨]。大部分房型有陽台，可泡湯面對富士山，河口湖車站約五分鐘並有接駁。" />
  </head></html>`;
  recognitionPlaceOverride = {
    nameOriginal: "THE KUKUNA",
    nameZh: "風之露台 KUKUNA",
    city: "富士河口湖町",
    area: "淺川",
    country: "日本",
    category: "lodging",
    address: "山梨県南都留郡富士河口湖町浅川70",
    nameHidden: true,
    searchClues: "河口湖、富士山正面景觀、溫泉露天風呂、車站約五分鐘",
    searchQuery: "THE KUKUNA Fujikawaguchiko",
    evidence: "貼文明列淺川地址、富士山景觀、泡湯與接駁線索。",
    confidence: 0.84,
  };
  const { cookie, trip } = await loginAndCreateTrip();
  const response = await recognize({ cookie, tripId: trip.id, requestedKind: "lodging" });

  assert.equal(response.statusCode, 200);
  assert.equal(openAiRequests.length, 1);
  assert.equal(openAiRequests[0].tools[0].type, "web_search");
  assert.match(openAiRequests[0].input[1].content[0].text, /山梨縣南都留郡富士河口湖町淺川/);
  assert.equal(googleRequests[0].body.maxResultCount, 5);
  assert.match(googleRequests[0].body.textQuery, /THE KUKUNA/);
  assert.equal(response.payload.groups[0].candidates[0].kind, "lodging");

  socialHtmlOverride = "";
  recognitionPlaceOverride = null;
});
