import assert from "node:assert/strict";
import test from "node:test";

import memberHandler from "../api/member.mjs";
import socialPlaceImportHandler, {
  cleanRecognition,
  extractAddressHint,
  publicMetadataFromHtml,
  responseSchema,
  safeSocialMediaUrl,
  safeSocialUrl,
  sourceHidesPlaceName,
} from "../api/social-place-import.mjs";
import tripsHandler from "../api/trips.mjs";

const store = new Map();
const openAiRequests = [];
const googleRequests = [];
let socialHtmlAvailable = true;
let googleRejectLocationBias = false;
let recognitionPlaceOverride = null;
let socialHtmlOverride = "";

process.env.KV_REST_API_URL = "https://redis.test";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.GOOGLE_MAPS_API_KEY = "test-google-key";

globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.includes("cdninstagram.com")) {
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
            places: [recognitionPlaceOverride || {
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
              confidence: 0.93,
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (target.includes("places.googleapis.com/v1/places:searchText")) {
    const requestBody = JSON.parse(options.body);
    googleRequests.push({ body: requestBody, headers: options.headers });
    if (googleRejectLocationBias && requestBody.locationBias) {
      return new Response(JSON.stringify({ error: { message: "locationBias.circle.radius must be at most 50000" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      places: [
        {
          id: "place-cafe-mugi",
          displayName: { text: "Cafe Mugi 新宿" },
          formattedAddress: "東京都新宿區西新宿 1-2-3",
          addressComponents: [{ longText: "新宿區", types: ["sublocality_level_1"] }],
          primaryTypeDisplayName: { text: "咖啡廳" },
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
          addressComponents: [{ longText: "澀谷區", types: ["sublocality_level_1"] }],
          primaryTypeDisplayName: { text: "咖啡廳" },
          location: { latitude: 35.66, longitude: 139.70 },
          googleMapsUri: "https://www.google.com/maps/search/?api=1&query=Mugi+Cafe",
          rating: 4.2,
          userRatingCount: 90,
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
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

async function recognize({ cookie = "", tripId = "", sourceUrl = "https://www.instagram.com/reel/ABC123/", sharedText = "", imageDataUrl = "", requestedKind = "auto" } = {}) {
  const response = responseMock();
  await socialPlaceImportHandler({
    method: "POST",
    body: { tripId, sourceUrl, sharedText, imageDataUrl, requestedKind },
    headers: cookie ? { cookie } : {},
  }, response);
  return response;
}

test("social metadata parser reads Open Graph content without accepting arbitrary hosts", () => {
  assert.equal(safeSocialUrl("https://www.instagram.com/reel/ABC123/")?.hostname, "www.instagram.com");
  assert.equal(safeSocialUrl("https://www.instagram.com/reel/Db0DU2OykW0/?igsh=example")?.pathname, "/reel/Db0DU2OykW0/");
  assert.equal(safeSocialUrl("http://127.0.0.1/private"), null);
  assert.equal(safeSocialUrl("https://example.com/place"), null);
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

test("social address helpers retain explicit lodging addresses and detect hidden profile names", () => {
  const caption = "地址:山梨縣南都留郡富士河口湖町淺川\n🔗飯店名稱及訂房連結在個人檔案置頂連結 [03✨]";
  assert.equal(extractAddressHint(caption), "山梨縣南都留郡富士河口湖町淺川");
  assert.equal(sourceHidesPlaceName(caption), true);
});

test("social recognition cleanup removes duplicate aliases and keeps structured place meaning", () => {
  const result = cleanRecognition({
    sourceSummary: "推薦新宿咖啡廳",
    sourceLanguage: "中文",
    needsMoreContext: false,
    places: [
      { nameOriginal: "Cafe Mugi", nameZh: "Cafe Mugi", city: "東京", area: "新宿", country: "日本", category: "restaurant", searchQuery: "Cafe Mugi 新宿", evidence: "內文提及", confidence: 0.9 },
      { nameOriginal: "Cafe Mugi", nameZh: "Cafe Mugi", city: "東京", area: "新宿", country: "日本", category: "restaurant", searchQuery: "Cafe Mugi 新宿", evidence: "重複", confidence: 0.8 },
    ],
  });
  assert.equal(result.places.length, 1);
  assert.equal(result.places[0].name, "Cafe Mugi");
  assert.equal(result.places[0].category, "restaurant");
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
