const fallbackPlaces = [
  {
    name: "銀座八芳",
    fullName: "Seafood Buffet Dining Ginza Happo",
    category: "自助餐餐廳",
    area: "銀座",
    areaOriginal: "銀座",
    sourceUrl: "https://maps.app.goo.gl/7FqMqBjB1ijqiLiu7?g_st=il",
    swatch: "#7e5c47",
    mark: "八",
    latitude: 35.6672123,
    longitude: 139.7618203,
    openLocationCode: "8Q7XMQ86+VP",
  },
  {
    name: "銀座金魚美術館",
    fullName: "ART AQUARIUM MUSEUM 銀座金魚美術館",
    category: "藝術博物館",
    area: "銀座",
    areaOriginal: "銀座",
    sourceUrl: "https://maps.app.goo.gl/5Yy3bqLLxRTvQgQE8?g_st=il",
    swatch: "#b34735",
    mark: "魚",
    latitude: 35.6708125,
    longitude: 139.7660625,
    openLocationCode: "8Q7XMQC8+8C",
  },
  {
    name: "Rukuma Tokyo",
    fullName: "Rukuma Tokyo",
    category: "內臟燒肉餐廳",
    area: "惠比壽／代官山",
    areaOriginal: "恵比寿／代官山",
    sourceUrl: "https://maps.app.goo.gl/xYymfmHyxhMMpfoH7?g_st=il",
    swatch: "#526d54",
    mark: "R",
    latitude: 35.6500625,
    longitude: 139.7079375,
    openLocationCode: "8Q7XMP25+25",
  },
  {
    name: "Peter Luger 東京",
    fullName: "Peter Luger 牛排館 東京",
    category: "牛排館",
    area: "惠比壽／代官山",
    areaOriginal: "恵比寿／代官山",
    sourceUrl: "https://maps.app.goo.gl/Y9M5UG8qCav99iLC9?g_st=il",
    swatch: "#865045",
    mark: "P",
    latitude: 35.6438125,
    longitude: 139.7139375,
    openLocationCode: "8Q7XJPV7+GH",
  },
  {
    name: "牛たんの檸檬",
    fullName: "Gyu Tongue Lemon Shinjuku",
    category: "日式牛舌餐廳",
    area: "西新宿",
    areaOriginal: "西新宿",
    sourceUrl: "https://maps.app.goo.gl/KqviBAv6oTAKRL87A?g_st=il",
    swatch: "#a87545",
    mark: "牛",
    latitude: 35.6961875,
    longitude: 139.6979375,
    openLocationCode: "8Q7XMMWX+F5",
  },
  {
    name: "燒肉 Aburu。",
    fullName: "燒肉 Aburu。大塚店",
    category: "日式燒肉餐廳",
    area: "大塚",
    areaOriginal: "大塚",
    sourceUrl: "https://maps.app.goo.gl/nettdiCwZwVDaUYh8?g_st=il",
    swatch: "#7d3d2d",
    mark: "炙",
    latitude: 35.7331252,
    longitude: 139.7272977,
    openLocationCode: "8Q7XPPMG+7W",
  },
];

const knownTabelogRestaurantUrls = {
  "銀座八芳": "https://tabelog.com/tokyo/A1301/A130103/13292459/",
  "Rukuma Tokyo": "https://tabelog.com/tokyo/A1303/A130302/13132685/",
  "Peter Luger 東京": "https://tabelog.com/tokyo/A1303/A130302/13258435/",
  "牛たんの檸檬": "https://tabelog.com/tokyo/A1304/A130401/13264721/",
  "燒肉 Aburu。": "https://tabelog.com/tokyo/A1323/A132302/13136915/",
};

const placeDetails = {
  "銀座八芳": {
    addedByName: "璋",
    openingHours: "每日 11:30–22:00（最晚入店 20:00）",
    phone: "03-6264-6825",
    description: "位在銀座的海鮮自助餐候選。適合排在銀座逛街日的晚餐，先和家人確認食量、預算與是否需要預約。",
    highlights: ["海鮮自助餐", "銀座用餐", "適合多人"],
    galleryLabels: ["海鮮餐檯", "用餐空間", "店面位置"],
  },
  "銀座金魚美術館": {
    addedByName: "璋",
    openingHours: "每日 10:00–19:00（最晚入場 18:00）",
    phone: "03-3528-6721",
    description: "銀座三越內的室內藝術展覽，以金魚缸、燈光與裝置構成沉浸式空間。下雨天也容易安排，並能和銀座購物排在同一段行程。",
    highlights: ["室內景點", "光影裝置", "銀座三越"],
    galleryLabels: ["光影展區", "金魚裝置", "展場入口"],
  },
  "Rukuma Tokyo": {
    addedByName: "璋",
    openingHours: "週一至週六 17:00–23:00；週日休息",
    phone: "03-3464-8929",
    description: "惠比壽、代官山一帶的內臟燒肉候選。適合喜歡燒肉與特色部位的成員，安排前可先確認同行者的飲食接受度。",
    highlights: ["內臟燒肉", "惠比壽一帶", "晚餐候選"],
    galleryLabels: ["燒肉料理", "桌席氛圍", "店面外觀"],
  },
  "Peter Luger 東京": {
    addedByName: "璋",
    openingHours: "每日 11:00–15:00、17:00–23:00",
    phone: "03-6277-4336",
    description: "惠比壽的牛排館候選，適合當作旅程中的一頓重點晚餐。建議和同區景點一起排，並預留較完整的用餐時間。",
    highlights: ["牛排館", "重點晚餐", "惠比壽"],
    galleryLabels: ["招牌牛排", "餐廳空間", "建築外觀"],
  },
  "牛たんの檸檬": {
    addedByName: "璋",
    openingHours: "每日 11:30–15:00、17:00–23:00",
    phone: "03-6279-3997",
    description: "西新宿的日式牛舌餐廳候選，可接在新宿購物或散步之後。菜色方向明確，適合拿來做午餐或晚餐的共同票選。",
    highlights: ["日式牛舌", "西新宿", "午晚餐皆可"],
    galleryLabels: ["牛舌定食", "店內座位", "街邊入口"],
  },
  "燒肉 Aburu。": {
    addedByName: "璋",
    openingHours: "每日 11:30–14:30、17:00–23:00",
    phone: "03-3918-9929",
    description: "大塚站附近的日式燒肉候選。和銀座、新宿相比位置較北，是否排入行程可以搭配地圖距離與當天動線一起決定。",
    highlights: ["日式燒肉", "大塚站附近", "需搭配動線"],
    galleryLabels: ["燒肉拼盤", "用餐座位", "大塚店外觀"],
  },
};

const defaultVotes = {};

const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

function buildDateMeta(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return [];
  const dates = [];
  for (const current = new Date(start); current <= end && dates.length < 61; current.setDate(current.getDate() + 1)) {
    dates.push([`${current.getMonth() + 1}/${current.getDate()}`, weekdayNames[current.getDay()]]);
  }
  return dates;
}

let dateMeta = buildDateMeta("2026-09-20", "2026-09-26");

const cleanupMigrationKey = "tokyo-clean-test-data-v4";
if (!localStorage.getItem(cleanupMigrationKey)) {
  const previousProfile = JSON.parse(localStorage.getItem("tokyo-profile-v1") || "null");
  if (previousProfile?.nickname === "測試") localStorage.removeItem("tokyo-profile-v1");
  localStorage.setItem("tokyo-votes-v2", "{}");
  localStorage.setItem("tokyo-itinerary", "{}");
  const previousCustomPlaces = JSON.parse(localStorage.getItem("tokyo-custom-places") || "[]");
  localStorage.setItem(
    "tokyo-custom-places",
    JSON.stringify(previousCustomPlaces.map((place) => ({ ...place, addedByName: "璋" }))),
  );
  localStorage.setItem(cleanupMigrationKey, "done");
}

const savedCustomPlaces = JSON.parse(localStorage.getItem("tokyo-custom-places") || "[]");
const rawSavedProfile = JSON.parse(localStorage.getItem("tokyo-profile-v1") || "null");
const savedProfile = rawSavedProfile?.authVersion === 2
  ? {
      ...rawSavedProfile,
      id:
        rawSavedProfile.id && rawSavedProfile.id !== "me"
          ? rawSavedProfile.id
          : `member-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    }
  : null;
const savedDeletedPlaces = JSON.parse(localStorage.getItem("tokyo-deleted-places-v1") || "[]");
const savedAccessMode = sessionStorage.getItem("tokyo-access-mode-v1");
const sharedInviteCode = String(new URLSearchParams(window.location.search).get("invite") || "")
  .trim()
  .toUpperCase()
  .slice(0, 6);
const shareTargetSessionKey = "pending-place-share-target-v1";
const incomingShareTargetText = shareTargetTextFromUrl(window.location.href);
if (incomingShareTargetText) sessionStorage.setItem(shareTargetSessionKey, incomingShareTargetText);
let pendingShareTargetText = incomingShareTargetText || sessionStorage.getItem(shareTargetSessionKey) || "";
if (isShareTargetPath(window.location.pathname)) {
  window.history.replaceState(window.history.state, "", "/");
}

const defaultShoppingCategories = [
  { id: "souvenir", name: "伴手禮", builtIn: true },
  { id: "appliance", name: "家電", builtIn: true },
  { id: "daily", name: "日常", builtIn: true },
  { id: "medicine", name: "藥品", builtIn: true },
  { id: "skincare", name: "保養品", builtIn: true },
];

function emptyShoppingState() {
  return {
    scope: "private",
    categories: defaultShoppingCategories.map((category) => ({ ...category })),
    tags: [],
    items: [],
    photos: {},
    revision: 0,
    updatedAt: "",
  };
}

const state = {
  tripId: localStorage.getItem("active-trip-v1") || "",
  trips: [],
  tripTitle: "東京 7 日",
  destination: "東京",
  startDate: "2026-09-20",
  endDate: "2026-09-26",
  inviteCode: "",
  ownerId: "",
  pendingInviteCode: sharedInviteCode,
  flights: [
    { id: "flight-khh-nrt", direction: "去程", departureDate: "2026-09-20", departureTime: "09:55", departureCity: "高雄", departureCode: "KHH", arrivalDate: "2026-09-20", arrivalTime: "14:45", arrivalCity: "成田", arrivalCode: "NRT", travelers: "尚未註記" },
    { id: "flight-nrt-khh", direction: "回程", departureDate: "2026-09-26", departureTime: "17:50", departureCity: "成田", departureCode: "NRT", arrivalDate: "2026-09-26", arrivalTime: "21:00", arrivalCity: "高雄", arrivalCode: "KHH", travelers: "尚未註記" },
  ],
  activeTab: "overview",
  placesMode: "list",
  placeKind: "all",
  selectedArea: "",
  selectedMapPlace: "",
  mapView: "planning",
  mapDate: "all",
  mapCategory: "all",
  mapPreference: "all",
  selectedDate: "9/22",
  itineraryPlaceKind: "all",
  places: [
    ...fallbackPlaces
      .filter((place) => !savedDeletedPlaces.includes(place.name))
      .map((place) => ({ ...place, ...placeDetails[place.name], kind: normalizedPlaceKind(place) })),
    ...savedCustomPlaces.map((place) => ({
      description: "這是家人新增的收藏地點，詳細介紹可以稍後再補上。",
      highlights: ["自訂收藏"],
      galleryLabels: ["地點照片", "環境照片", "附近街景"],
      openingHours: "待 Google Maps 同步",
      phone: "待 Google Maps 同步",
      addedByName: "璋",
      ...place,
      kind: normalizedPlaceKind(place),
    })),
  ],
  deletedPlaces: savedDeletedPlaces,
  profile: savedProfile,
  isGuest: savedAccessMode === "guest" && !savedProfile && !sharedInviteCode,
  members: savedProfile ? { [savedProfile.id]: savedProfile.nickname } : {},
  sharedRevision: 0,
  votes: JSON.parse(
    localStorage.getItem("tokyo-votes-v2") || JSON.stringify(defaultVotes),
  ),
  itinerary: JSON.parse(localStorage.getItem("tokyo-itinerary") || "{}"),
  transports: [],
  shopping: emptyShoppingState(),
  shoppingLoaded: false,
  shoppingFilter: "all",
  shoppingStatus: "all",
  shoppingRecipientFilter: "all",
};

state.places = state.places.map((place) => ensureTravelAreaFields(withStoredTabelogLink(place, state.destination)));

const app = document.querySelector("#app");
const sheetRoot = document.querySelector("#sheet-root");
const toastRoot = document.querySelector("#toast-root");
let pendingPlaceImports = [];
let pendingLodgingDrafts = [];
let pendingPlaceImportScreenshot = "";
let pendingPlaceImportNotice = "";
let pendingPlacePhoto = "";
let removePendingPlacePhoto = false;
let sharedSaveTimer = 0;
let sharedSyncBusy = false;
let mapRenderToken = 0;
let activeLeafletMap = null;
let activeGoogleMap = null;
let activeGoogleLocationMarker = null;
let activeGoogleAccuracyCircle = null;
let activeLeafletLocationMarker = null;
let activeLeafletAccuracyCircle = null;
let liveLocationWatchId = null;
let liveLocationEnabled = false;
let liveLocationPosition = null;
let liveLocationError = "";
let liveLocationHasCentered = false;
let googleMapsLoader = null;
let mapInteractionUntil = 0;
let mapCoordinatesLoading = false;
let airportCoordinatesLoading = false;
let planningRegionResolutionBusy = false;
const planningRegionResolutionAttempts = new Set();
const planningRegionResolutionInFlight = new Set();
let mapFullscreen = false;
let mapSidebarOpen = true;
let pendingTimePicker = null;
let pendingFlightTicketFile = null;
let flightTicketPreviewUrl = "";
let flightTicketRecognitionToken = 0;
let flightOcrLoader = null;
let shoppingRecognitionToken = 0;
let pendingShoppingImports = [];
const SHOPPING_IMPORT_MAX_FILES = 12;
let shoppingSaveBusy = false;
let shoppingSavePending = false;
let shoppingUndoSnapshot = null;
let shoppingSelectionMode = false;
let shoppingSelectedIds = new Set();
let pendingShoppingBatchDeleteIds = [];
let pendingManualShoppingPhoto = "";
let removeManualShoppingPhoto = false;
let undoSnapshot = null;
let undoBaseline = "";
let offerUndoWithNextToast = false;

const airportCoordinateCache = {
  KHH: { latitude: 22.5771, longitude: 120.3500 },
  NRT: { latitude: 35.7720, longitude: 140.3929 },
  HND: { latitude: 35.5494, longitude: 139.7798 },
  TPE: { latitude: 25.0797, longitude: 121.2342 },
  TSA: { latitude: 25.0697, longitude: 121.5527 },
  KIX: { latitude: 34.4320, longitude: 135.2304 },
  ITM: { latitude: 34.7855, longitude: 135.4382 },
  FUK: { latitude: 33.5859, longitude: 130.4507 },
  CTS: { latitude: 42.7752, longitude: 141.6923 },
  OKA: { latitude: 26.1958, longitude: 127.6459 },
  ICN: { latitude: 37.4602, longitude: 126.4407 },
  GMP: { latitude: 37.5583, longitude: 126.7906 },
};
try {
  Object.assign(airportCoordinateCache, JSON.parse(localStorage.getItem("airport-coordinate-cache-v1") || "{}"));
} catch {
  localStorage.removeItem("airport-coordinate-cache-v1");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function canEdit() {
  return Boolean(state.profile) && !state.isGuest && Boolean(state.tripId) && state.trips.some((trip) => trip.id === state.tripId);
}

function canManageShopping() {
  return Boolean(state.profile) && !state.isGuest && Boolean(state.tripId) && state.trips.some((trip) => trip.id === state.tripId);
}

function undoButtonMarkup(className = "page-undo-button") {
  if (!canEdit()) return "";
  return `<button class="${className}" type="button" data-undo-last aria-label="復原上一個動作" ${undoSnapshot ? "" : "disabled"}>↶</button>`;
}

function syncUndoButtons() {
  document.querySelectorAll("[data-undo-last]").forEach((button) => {
    button.disabled = !undoSnapshot || !canEdit();
  });
}

function decorateEditableSheetUndo() {
  const sheet = sheetRoot.querySelector(".modal-sheet");
  if (!sheet || sheet.hasAttribute("data-shopping-sheet") || !canEdit() || sheet.querySelector("[data-sheet-undo]")) return;
  const editable = sheet.matches("form") || sheet.querySelector("form, [data-confirm-time], [data-move-item]");
  if (!editable) return;
  const button = document.createElement("button");
  button.className = "sheet-undo-button";
  button.type = "button";
  button.dataset.undoLast = "";
  button.dataset.sheetUndo = "";
  button.setAttribute("aria-label", "復原上一個動作");
  button.textContent = "↶";
  button.disabled = !undoSnapshot;
  sheet.append(button);
}

function currentMemberId() {
  return state.profile?.id || "";
}

function isTripOwner() {
  return Boolean(state.ownerId && state.ownerId === currentMemberId());
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function reversibleTripSnapshot() {
  return {
    flights: cloneValue(state.flights || []),
    places: cloneValue(state.places || []),
    deletedPlaces: cloneValue(state.deletedPlaces || []),
    votes: cloneValue(state.votes || {}),
    itinerary: cloneValue(state.itinerary || {}),
    transports: cloneValue(state.transports || []),
  };
}

function resetUndoBaseline({ clear = false } = {}) {
  undoBaseline = JSON.stringify(reversibleTripSnapshot());
  if (clear) {
    undoSnapshot = null;
    offerUndoWithNextToast = false;
  }
}

function restoreLastAction() {
  if (!undoSnapshot || !canEdit()) return false;
  const snapshot = cloneValue(undoSnapshot);
  state.flights = snapshot.flights || [];
  state.places = snapshot.places || [];
  state.deletedPlaces = snapshot.deletedPlaces || [];
  state.votes = snapshot.votes || {};
  state.itinerary = snapshot.itinerary || {};
  state.transports = snapshot.transports || [];
  undoSnapshot = null;
  offerUndoWithNextToast = false;
  ensureItineraryItemIds();
  reconcileTransportSegments();
  resetUndoBaseline();
  persist({ recordUndo: false });
  closeSheet();
  render({ preserveScroll: true });
  showToast("已復原上一個動作", { allowUndo: false });
  return true;
}

function persist({ sync = true, recordUndo = sync, resetUndo = false } = {}) {
  const nextSnapshot = reversibleTripSnapshot();
  const nextBaseline = JSON.stringify(nextSnapshot);
  if (resetUndo) {
    undoSnapshot = null;
    offerUndoWithNextToast = false;
  } else if (recordUndo && canEdit() && undoBaseline && nextBaseline !== undoBaseline) {
    undoSnapshot = JSON.parse(undoBaseline);
    offerUndoWithNextToast = true;
  }
  undoBaseline = nextBaseline;
  if (state.profile) {
    localStorage.setItem("tokyo-profile-v1", JSON.stringify(state.profile));
  }
  if (state.tripId) {
    localStorage.setItem("active-trip-v1", state.tripId);
    localStorage.setItem(`trip-cache-v1:${state.tripId}`, JSON.stringify(sharedTripPayload()));
  }
  if (sync && canEdit()) {
    window.clearTimeout(sharedSaveTimer);
    sharedSaveTimer = window.setTimeout(() => {
      sharedSaveTimer = 0;
      saveSharedTrip();
    }, 120);
  }
  syncUndoButtons();
}

const sheetUndoObserver = new MutationObserver(decorateEditableSheetUndo);
sheetUndoObserver.observe(sheetRoot, { childList: true, subtree: true });

function members() {
  const palette = ["coral", "teal", "ochre"];
  const records = Object.entries(state.members || {}).map(([id, name], index) => ({
    id,
    name,
    tone: palette[index % palette.length],
  }));
  if (state.profile && !records.some((member) => member.id === state.profile.id)) {
    records.push({ id: state.profile.id, name: state.profile.nickname, tone: "coral" });
  }
  return records;
}

function memberName(id) {
  return members().find((member) => member.id === id)?.name || "旅伴";
}

function placeCreatorName(place) {
  return place.addedByName || memberName(place.addedBy);
}

const openingWeekdays = ["一", "二", "三", "四", "五", "六", "日"];

function parseOpeningHours(value = "") {
  const raw = String(value || "待 Google Maps 同步").trim().replaceAll("星期", "週");
  const expanded = new Map();
  const daily = raw.match(/^每日\s*(.+)$/);
  if (daily) openingWeekdays.forEach((day) => expanded.set(day, daily[1]));
  raw.split(/[；;\n]+/).map((item) => item.trim()).filter(Boolean).forEach((segment) => {
    const range = segment.match(/^週([一二三四五六日])至週([一二三四五六日])[:：]?\s*(.+)$/);
    if (range) {
      const start = openingWeekdays.indexOf(range[1]);
      const end = openingWeekdays.indexOf(range[2]);
      for (let index = start; index <= end; index += 1) expanded.set(openingWeekdays[index], range[3]);
      return;
    }
    const single = segment.match(/^週([一二三四五六日])[:：]?\s*(.+)$/);
    if (single) expanded.set(single[1], single[2]);
  });
  return { raw, expanded };
}

function openingHoursLine(day, hours) {
  const match = String(hours).trim().match(/^(.*?)([（(][^）)]*最晚[^）)]*[）)])$/);
  const main = match ? match[1].trim() : String(hours).trim();
  const lastEntry = match ? `<small class="last-entry-time">${escapeHtml(match[2])}</small>` : "";
  return `<span class="hours-line"><b>週${day}</b><span>${escapeHtml(main || "未提供")}${lastEntry}</span></span>`;
}

function formatOpeningHours(value = "") {
  const { raw, expanded } = parseOpeningHours(value);
  if (raw.startsWith("待 ")) return escapeHtml(raw);
  if (expanded.size) return openingWeekdays.filter((day) => expanded.has(day)).map((day) => openingHoursLine(day, expanded.get(day))).join("");
  return escapeHtml(raw).replace(/([（(][^）)]*最晚[^）)]*[）)])/g, '<br><span class="last-entry-time">$1</span>');
}

function formatOpeningHoursForDay(value = "", weekday = "") {
  const { raw, expanded } = parseOpeningHours(value);
  if (raw.startsWith("待 ")) return escapeHtml(raw);
  const day = String(weekday).replace("星期", "週").replace("週", "");
  if (openingWeekdays.includes(day) && expanded.size) {
    return openingHoursLine(day, expanded.get(day) || "休息／未提供");
  }
  return escapeHtml(raw).replace(/([（(][^）)]*最晚[^）)]*[）)])/g, '<br><span class="last-entry-time">$1</span>');
}

const TRAVEL_AREA_RESOLUTION_VERSION = 5;

function travelAreaKeyFromNames(countryCode, zh, local) {
  const token = String(local || zh || "").normalize("NFKD").replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "-").replace(/^-+|-+$/g, "").toLocaleLowerCase("en");
  return `${String(countryCode || "xx").toLocaleLowerCase("en")}:${token || "unclassified"}`;
}

function ensureTravelAreaFields(place) {
  if (!place) return place;
  if (place.travelAreaKey && place.travelAreaZh && place.travelAreaLocal) return place;
  const zh = String(place.planningRegion || place.area || "").trim();
  const local = String(place.planningRegionOriginal || place.areaOriginal || zh).trim();
  if (zh && local) {
    place.travelAreaKey = travelAreaKeyFromNames(place.countryCode, zh, local);
    place.travelAreaZh = zh;
    place.travelAreaLocal = local;
    place.travelAreaSource = place.travelAreaManuallySet === true || place.areaManuallySet === true ? "manual" : "legacy-fallback";
    place.travelAreaResolutionStatus = "retry-required";
  } else {
    place.travelAreaKey = `unclassified:${place.placeId || place.id || place.name || "place"}`;
    place.travelAreaZh = "未分類";
    place.travelAreaLocal = "待確認";
    place.travelAreaSource = "unresolved";
    place.travelAreaResolutionStatus = "retry-required";
  }
  return place;
}

function hasUsableTravelArea(place) {
  ensureTravelAreaFields(place);
  return Boolean(place?.travelAreaKey && place?.travelAreaZh && place?.travelAreaLocal);
}

function isTravelAreaResolutionCurrent(place) {
  ensureTravelAreaFields(place);
  if (place?.travelAreaSource === "manual" || place?.travelAreaManuallySet === true) return hasUsableTravelArea(place);
  return Boolean(place?.travelAreaResolved === true && Number(place?.travelAreaResolutionVersion) >= TRAVEL_AREA_RESOLUTION_VERSION && hasUsableTravelArea(place));
}

function travelAreaDisplayName(place) {
  ensureTravelAreaFields(place);
  return `${String(place.travelAreaZh).trim()}（${String(place.travelAreaLocal).trim()}）`;
}

function travelAreaChineseName(place, fallback = "未分類") {
  ensureTravelAreaFields(place);
  return String(place?.travelAreaZh || fallback).trim();
}

function travelAreaGroupKey(place) {
  ensureTravelAreaFields(place);
  return String(place.travelAreaKey);
}

function placeVoters(name) {
  return state.votes[name] || [];
}

function voterSummary(name) {
  const voters = placeVoters(name);
  if (!voters.length) return "還沒有人標記";
  return voters.map(memberName).join("、");
}

function toggleMyVote(name) {
  if (!canEdit()) return false;
  const memberId = currentMemberId();
  const voters = new Set(placeVoters(name));
  if (voters.has(memberId)) voters.delete(memberId);
  else voters.add(memberId);
  state.votes[name] = [...voters];
  persist();
  return voters.has(memberId);
}

function avatarMarkup(memberId, compact = false) {
  const member = members().find((item) => item.id === memberId);
  if (!member) return "";
  return `<span class="member-avatar ${member.tone} ${compact ? "compact" : ""}" title="${escapeHtml(member.name)}">${escapeHtml(member.name.slice(0, 1))}</span>`;
}

function placeAssignments(name) {
  return dateMeta.flatMap(([date], dayIndex) => {
    const itemIndex = (state.itinerary[date] || []).findIndex((item) => item.name === name);
    return itemIndex < 0 ? [] : [{ date, day: dayIndex + 1, order: itemIndex + 1 }];
  });
}

function placeScheduleLabel(name) {
  const assignments = placeAssignments(name);
  if (!assignments.length) return "尚未安排";
  const labels = assignments.map((item) => `第 ${item.day} 天 · ${item.date}`);
  return labels.length > 2 ? `${labels.slice(0, 2).join("、")} 等 ${labels.length} 天` : labels.join("、");
}

function compactTripDate(isoDate = "") {
  const match = String(isoDate).match(/^\d{4}-(\d{2})-(\d{2})$/);
  return match ? `${Number(match[1])}/${Number(match[2])}` : "";
}

const flightAirportCatalog = [
  { city: "高雄", aliases: ["高雄市", "Kaohsiung"], code: "KHH", name: "高雄國際機場（小港）" },
  { city: "台北", aliases: ["臺北", "台北市", "臺北市", "桃園", "桃園市", "Taipei", "Taoyuan"], code: "TPE", name: "桃園國際機場" },
  { city: "台北", aliases: ["臺北", "台北市", "臺北市", "Taipei"], code: "TSA", name: "台北松山機場" },
  { city: "台中", aliases: ["臺中", "台中市", "臺中市", "Taichung"], code: "RMQ", name: "台中國際機場" },
  { city: "東京", aliases: ["成田", "成田市", "Tokyo", "Narita"], code: "NRT", name: "成田國際機場" },
  { city: "東京", aliases: ["羽田", "Tokyo", "Haneda"], code: "HND", name: "羽田機場" },
  { city: "大阪", aliases: ["Osaka", "關西", "関西"], code: "KIX", name: "關西國際機場" },
  { city: "大阪", aliases: ["Osaka", "伊丹"], code: "ITM", name: "大阪國際機場（伊丹）" },
  { city: "大阪", aliases: ["Osaka", "神戶", "神戸", "Kobe"], code: "UKB", name: "神戶機場" },
  { city: "名古屋", aliases: ["Nagoya"], code: "NGO", name: "中部國際機場" },
  { city: "福岡", aliases: ["Fukuoka"], code: "FUK", name: "福岡機場" },
  { city: "札幌", aliases: ["Sapporo", "新千歲", "新千歳"], code: "CTS", name: "新千歲機場" },
  { city: "沖繩", aliases: ["沖縄", "Okinawa", "那霸", "那覇", "Naha"], code: "OKA", name: "那霸機場" },
  { city: "首爾", aliases: ["首爾市", "Seoul", "仁川", "Incheon"], code: "ICN", name: "仁川國際機場" },
  { city: "首爾", aliases: ["首爾市", "Seoul", "金浦", "Gimpo"], code: "GMP", name: "金浦國際機場" },
  { city: "釜山", aliases: ["Busan"], code: "PUS", name: "金海國際機場" },
  { city: "濟州", aliases: ["济州", "Jeju"], code: "CJU", name: "濟州國際機場" },
  { city: "香港", aliases: ["Hong Kong"], code: "HKG", name: "香港國際機場" },
  { city: "澳門", aliases: ["澳门", "Macau"], code: "MFM", name: "澳門國際機場" },
  { city: "新加坡", aliases: ["Singapore"], code: "SIN", name: "樟宜機場" },
  { city: "曼谷", aliases: ["Bangkok", "素萬那普"], code: "BKK", name: "蘇凡納布機場" },
  { city: "曼谷", aliases: ["Bangkok", "廊曼"], code: "DMK", name: "廊曼國際機場" },
  { city: "杜拜", aliases: ["Dubai", "迪拜"], code: "DXB", name: "杜拜國際機場" },
  { city: "阿布達比", aliases: ["Abu Dhabi", "阿布扎比"], code: "AUH", name: "扎耶德國際機場" },
  { city: "杜哈", aliases: ["Doha", "多哈"], code: "DOH", name: "哈馬德國際機場" },
  { city: "伊斯坦堡", aliases: ["Istanbul", "伊斯坦布爾"], code: "IST", name: "伊斯坦堡機場" },
  { city: "倫敦", aliases: ["London"], code: "LHR", name: "希斯洛機場" },
  { city: "倫敦", aliases: ["London", "Gatwick"], code: "LGW", name: "蓋威克機場" },
  { city: "巴黎", aliases: ["Paris"], code: "CDG", name: "戴高樂機場" },
  { city: "阿姆斯特丹", aliases: ["Amsterdam"], code: "AMS", name: "史基浦機場" },
  { city: "法蘭克福", aliases: ["Frankfurt"], code: "FRA", name: "法蘭克福機場" },
  { city: "慕尼黑", aliases: ["Munich"], code: "MUC", name: "慕尼黑機場" },
  { city: "蘇黎世", aliases: ["Zurich", "Zürich"], code: "ZRH", name: "蘇黎世機場" },
  { city: "赫爾辛基", aliases: ["Helsinki"], code: "HEL", name: "赫爾辛基機場" },
  { city: "羅馬", aliases: ["Rome"], code: "FCO", name: "羅馬菲烏米奇諾機場" },
  { city: "洛杉磯", aliases: ["Los Angeles"], code: "LAX", name: "洛杉磯國際機場" },
  { city: "舊金山", aliases: ["San Francisco"], code: "SFO", name: "舊金山國際機場" },
  { city: "紐約", aliases: ["New York"], code: "JFK", name: "甘迺迪國際機場" },
  { city: "溫哥華", aliases: ["Vancouver"], code: "YVR", name: "溫哥華國際機場" },
  { city: "多倫多", aliases: ["Toronto"], code: "YYZ", name: "多倫多皮爾遜國際機場" },
];

const flightCitySuggestions = [...new Set(flightAirportCatalog.flatMap((airport) => [airport.city, ...airport.aliases]))];

function normalizeFlightCity(value = "") {
  return String(value).normalize("NFKC").trim().toLocaleLowerCase();
}

function airportsForCity(city = "") {
  const target = normalizeFlightCity(city);
  if (!target) return [];
  return flightAirportCatalog.filter((airport) =>
    [airport.city, ...airport.aliases].some((label) => normalizeFlightCity(label) === target),
  );
}

function airportOptionsMarkup(city = "", currentCode = "") {
  const airports = airportsForCity(city);
  const code = String(currentCode || "").trim().toUpperCase();
  if (!airports.length) {
    return code
      ? `<option value="${escapeHtml(code)}" selected>${escapeHtml(code)}｜目前機場</option>`
      : `<option value="" selected>請先選擇城市</option>`;
  }
  const validCode = airports.some((airport) => airport.code === code) ? code : "";
  const selectedCode = validCode || (airports.length === 1 ? airports[0].code : "");
  const prompt = airports.length > 1
    ? `<option value="" ${selectedCode ? "" : "selected"}>請選擇機場</option>`
    : "";
  return prompt + airports.map((airport) =>
    `<option value="${airport.code}" ${airport.code === selectedCode ? "selected" : ""}>${airport.code}｜${escapeHtml(airport.name)}</option>`,
  ).join("");
}

function refreshFlightAirportField(form, side) {
  const cityInput = form?.elements?.[`${side}City`];
  const airportSelect = form?.elements?.[`${side}Code`];
  if (!cityInput || !airportSelect) return;
  airportSelect.innerHTML = airportOptionsMarkup(cityInput.value, airportSelect.value);
}

function updateFlightFormMode(form) {
  if (!form) return;
  const isRoundTrip = form.elements.direction?.value === "來回" && !form.dataset.flightId;
  const outboundHeading = form.querySelector("[data-flight-outbound-heading]");
  if (outboundHeading) outboundHeading.hidden = !isRoundTrip;
  const returnFields = form.querySelector("[data-flight-return-fields]");
  if (returnFields) {
    returnFields.hidden = !isRoundTrip;
    returnFields.querySelectorAll("input, select, button").forEach((control) => {
      control.disabled = !isRoundTrip;
      if (control.matches("input, select") && !control.closest("[data-flight-connection]")) control.required = isRoundTrip;
    });
  }
  const routeLabel = form.querySelector("[data-flight-return-route]");
  if (routeLabel) {
    const departureCity = String(form.elements.departureCity?.value || "").trim() || "出發地";
    const arrivalCity = String(form.elements.arrivalCity?.value || "").trim() || "目的地";
    routeLabel.textContent = `${arrivalCity} → ${departureCity}`;
  }
  form.classList.toggle("round-trip-mode", isRoundTrip);
}

function flightConnectionFieldMarkup({ id, direction, segment = {}, index = 1 }) {
  const prefix = `flight-connection-${id}`;
  return `
    <section class="flight-connection-segment" data-flight-connection data-flight-direction="${direction}">
      <div class="flight-connection-heading"><span>航段 ${index + 1}</span><strong>轉機後續航班</strong><button type="button" data-remove-flight-connection aria-label="移除航段 ${index + 1}">移除</button></div>
      <div class="flight-form-grid"><div class="field"><label for="${prefix}-departure-city">出發城市</label><input id="${prefix}-departure-city" name="${prefix}-departureCity" list="flight-city-options" data-flight-segment-field="departureCity" data-flight-city-side="${prefix}-departure" autocomplete="off" required value="${escapeHtml(segment.departureCity || "")}" placeholder="轉機城市" /></div><div class="field compact-field"><label>機場</label><select data-flight-segment-field="departureCode" name="${prefix}-departureCode" required>${airportOptionsMarkup(segment.departureCity, segment.departureCode)}</select></div></div>
      <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "出發日期", name: `${prefix}-departureDate`, type: "date", value: segment.departureDate || state.startDate })}${flightDateTimeInputMarkup({ label: "出發時間", name: `${prefix}-departureTime`, type: "time", value: segment.departureTime || "12:00" })}</div>
      <div class="flight-form-grid"><div class="field"><label for="${prefix}-arrival-city">抵達城市</label><input id="${prefix}-arrival-city" name="${prefix}-arrivalCity" list="flight-city-options" data-flight-segment-field="arrivalCity" data-flight-city-side="${prefix}-arrival" autocomplete="off" required value="${escapeHtml(segment.arrivalCity || "")}" placeholder="最終目的地" /></div><div class="field compact-field"><label>機場</label><select data-flight-segment-field="arrivalCode" name="${prefix}-arrivalCode" required>${airportOptionsMarkup(segment.arrivalCity, segment.arrivalCode)}</select></div></div>
      <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "抵達日期", name: `${prefix}-arrivalDate`, type: "date", value: segment.arrivalDate || segment.departureDate || state.startDate })}${flightDateTimeInputMarkup({ label: "抵達時間", name: `${prefix}-arrivalTime`, type: "time", value: segment.arrivalTime || "16:00" })}</div>
    </section>`;
}

function flightSegmentFromConnection(section) {
  const value = (field) => String(section.querySelector(`[data-flight-segment-field="${field}"]`)?.value || "").trim();
  const namedValue = (suffix) => String(section.querySelector(`[name$="-${suffix}"]`)?.value || "").trim();
  return {
    departureCity: value("departureCity"),
    departureCode: value("departureCode").toUpperCase(),
    departureDate: namedValue("departureDate"),
    departureTime: namedValue("departureTime"),
    arrivalCity: value("arrivalCity"),
    arrivalCode: value("arrivalCode").toUpperCase(),
    arrivalDate: namedValue("arrivalDate"),
    arrivalTime: namedValue("arrivalTime"),
  };
}

function addFlightConnection(form, direction) {
  const list = form?.querySelector(`[data-flight-connection-list="${direction}"]`);
  if (!form || !list || list.children.length >= 5) return showToast("單一方向最多可加入 6 個航段");
  const previous = list.lastElementChild
    ? flightSegmentFromConnection(list.lastElementChild)
    : direction === "return"
      ? {
          arrivalCity: String(form.elements.returnArrivalCity?.value || ""),
          arrivalCode: String(form.elements.returnArrivalCode?.value || ""),
          arrivalDate: String(form.elements.returnArrivalDate?.value || state.endDate),
        }
      : {
          arrivalCity: String(form.elements.arrivalCity?.value || ""),
          arrivalCode: String(form.elements.arrivalCode?.value || ""),
          arrivalDate: String(form.elements.arrivalDate?.value || state.startDate),
        };
  const id = `${direction}-${crypto.randomUUID?.() || Date.now()}`;
  list.insertAdjacentHTML("beforeend", flightConnectionFieldMarkup({
    id,
    direction,
    index: list.children.length + 1,
    segment: {
      departureCity: previous.arrivalCity,
      departureCode: previous.arrivalCode,
      departureDate: previous.arrivalDate,
      arrivalDate: previous.arrivalDate,
    },
  }));
  list.lastElementChild?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
}

function flightDateTimeDisplayValue(type, value = "") {
  if (type === "time") return String(value || "").trim() || "選擇時間";
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : "選擇日期";
}

function flightDateTimeInputMarkup({ label, name, type, value, required = true }) {
  const id = `flight-${name}`;
  return `<div class="field">
    <label for="${id}">${escapeHtml(label)}</label>
    <div class="flight-native-control">
      <input id="${id}" name="${name}" type="${type}" ${required ? "required" : ""} value="${escapeHtml(value)}" data-flight-native-control />
      <span data-flight-native-display aria-hidden="true">${escapeHtml(flightDateTimeDisplayValue(type, value))}</span>
    </div>
  </div>`;
}

function syncFlightDateTimeDisplay(input) {
  if (!input?.matches?.("[data-flight-native-control]")) return;
  const display = input.parentElement?.querySelector("[data-flight-native-display]");
  if (display) display.textContent = flightDateTimeDisplayValue(input.type, input.value);
}

function isoFlightDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const flightMonthNumbers = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

function parseFlightTicketDates(text = "") {
  const normalized = String(text).normalize("NFKC").toUpperCase().replace(/[‐‑–—]/g, "-");
  const found = [];
  const collect = (pattern, mapper) => {
    for (const match of normalized.matchAll(pattern)) {
      const value = mapper(match);
      if (value) found.push({ index: match.index || 0, value });
    }
  };
  collect(/\b(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/g, (match) => isoFlightDate(match[1], match[2], match[3]));
  collect(/\b(20\d{2})年(\d{1,2})月(\d{1,2})日?/g, (match) => isoFlightDate(match[1], match[2], match[3]));
  collect(/\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(20\d{2})\b/g, (match) => isoFlightDate(match[3], flightMonthNumbers[match[2]], match[1]));
  collect(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{1,2}),?\s+(20\d{2})\b/g, (match) => isoFlightDate(match[3], flightMonthNumbers[match[1]], match[2]));
  return found
    .sort((a, b) => a.index - b.index)
    .filter((item, index, values) => index === 0 || item.index !== values[index - 1].index || item.value !== values[index - 1].value)
    .map((item) => item.value);
}

function parseFlightTicketTimes(text = "") {
  const normalized = String(text).normalize("NFKC").toUpperCase();
  const found = [];
  for (const match of normalized.matchAll(/\b([01]?\d|2[0-3])[:：]([0-5]\d)\b/g)) {
    found.push({ index: match.index || 0, value: `${String(match[1]).padStart(2, "0")}:${match[2]}` });
  }
  for (const match of normalized.matchAll(/(?:DEPARTURE|DEPART|ARRIVAL|ARRIVE|BOARDING|出發|抵達|起飛)\s*[:：]?\s*([01]\d|2[0-3])\s*([0-5]\d)\b/g)) {
    found.push({ index: match.index || 0, value: `${match[1]}:${match[2]}` });
  }
  return found
    .sort((a, b) => a.index - b.index)
    .filter((item, index, values) => index === 0 || item.index !== values[index - 1].index || item.value !== values[index - 1].value)
    .map((item) => item.value);
}

function flightDatesInTripWindow(dates, startDate = "", endDate = "") {
  if (!startDate || !endDate) return dates;
  const start = new Date(`${startDate}T00:00:00`).getTime() - 2 * 86400000;
  const end = new Date(`${endDate}T23:59:59`).getTime() + 2 * 86400000;
  const relevant = dates.filter((date) => {
    const time = new Date(`${date}T00:00:00`).getTime();
    return Number.isFinite(time) && time >= start && time <= end;
  });
  return relevant.length ? relevant : dates;
}

function parseFlightTicketText(text = "", { startDate = "", endDate = "" } = {}) {
  const normalized = String(text).normalize("NFKC").toUpperCase();
  const knownCodes = new Set(flightAirportCatalog.map((airport) => airport.code));
  const airportCodes = [...normalized.matchAll(/\b[A-Z]{3}\b/g)]
    .map((match) => match[0])
    .filter((code) => knownCodes.has(code))
    .filter((code, index, values) => index === 0 || code !== values[index - 1]);
  const departureCode = airportCodes[0] || "";
  const arrivalCode = airportCodes.find((code) => code !== departureCode) || "";
  const arrivalIndex = airportCodes.indexOf(arrivalCode);
  const isRoundTrip = Boolean(
    departureCode && arrivalCode && airportCodes.slice(arrivalIndex + 1).includes(departureCode),
  );
  const dates = flightDatesInTripWindow(parseFlightTicketDates(normalized), startDate, endDate);
  const times = parseFlightTicketTimes(normalized);
  const departureAirport = flightAirportCatalog.find((airport) => airport.code === departureCode);
  const arrivalAirport = flightAirportCatalog.find((airport) => airport.code === arrivalCode);
  const fields = {
    departureCity: departureAirport?.city || "",
    departureCode,
    arrivalCity: arrivalAirport?.city || "",
    arrivalCode,
    departureDate: dates[0] || "",
    arrivalDate: isRoundTrip && dates.length < 4 ? dates[0] || "" : dates[1] || dates[0] || "",
    departureTime: times[0] || "",
    arrivalTime: times[1] || "",
    returnDepartureDate: isRoundTrip ? (dates.length >= 4 ? dates[2] : dates[1]) || "" : "",
    returnArrivalDate: isRoundTrip ? (dates.length >= 4 ? dates[3] : dates[1]) || dates[0] || "" : "",
    returnDepartureTime: isRoundTrip ? times[2] || "" : "",
    returnArrivalTime: isRoundTrip ? times[3] || "" : "",
  };
  return {
    isRoundTrip,
    fields,
    detectedCount: Object.values(fields).filter(Boolean).length,
  };
}

function loadFlightOcrLibrary() {
  if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
  if (flightOcrLoader) return flightOcrLoader;
  flightOcrLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => window.Tesseract?.createWorker ? resolve(window.Tesseract) : reject(new Error("OCR_LOAD_FAILED"));
    script.onerror = () => reject(new Error("OCR_LOAD_FAILED"));
    document.head.append(script);
  }).catch((error) => {
    flightOcrLoader = null;
    throw error;
  });
  return flightOcrLoader;
}

function setFlightTicketStatus(form, message, { progress = 0, tone = "" } = {}) {
  const status = form?.querySelector("[data-flight-ticket-status]");
  const progressBar = form?.querySelector("[data-flight-ticket-progress]");
  const card = form?.querySelector("[data-flight-ticket-card]");
  if (status) status.textContent = message;
  if (progressBar) progressBar.style.setProperty("--ticket-progress", `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%`);
  if (card) card.dataset.ticketTone = tone;
}

function applyFlightTicketData(form, parsed) {
  const setValue = (name, value) => {
    const input = form.elements[name];
    if (!input || !value) return false;
    input.value = value;
    syncFlightDateTimeDisplay(input);
    return true;
  };
  if (parsed.isRoundTrip && !form.dataset.flightId && [...form.elements.direction.options].some((option) => option.value === "來回")) {
    form.elements.direction.value = "來回";
    updateFlightFormMode(form);
  }
  setValue("departureCity", parsed.fields.departureCity);
  refreshFlightAirportField(form, "departure");
  setValue("departureCode", parsed.fields.departureCode);
  setValue("arrivalCity", parsed.fields.arrivalCity);
  refreshFlightAirportField(form, "arrival");
  setValue("arrivalCode", parsed.fields.arrivalCode);
  ["departureDate", "departureTime", "arrivalDate", "arrivalTime", "returnDepartureDate", "returnDepartureTime", "returnArrivalDate", "returnArrivalTime"]
    .forEach((name) => setValue(name, parsed.fields[name]));
  updateFlightFormMode(form);
  return parsed.detectedCount;
}

async function recognizeFlightTicket(form, file = pendingFlightTicketFile) {
  if (!form || !file || form.dataset.ticketBusy === "true") return;
  form.dataset.ticketBusy = "true";
  const token = ++flightTicketRecognitionToken;
  const retryButton = form.querySelector("[data-recognize-flight-ticket]");
  if (retryButton) retryButton.disabled = true;
  let worker;
  try {
    setFlightTicketStatus(form, "正在準備圖片辨識…", { progress: 0.05 });
    const Tesseract = await loadFlightOcrLibrary();
    worker = await Tesseract.createWorker("eng", 1, {
      logger: (message) => {
        if (!form.isConnected || token !== flightTicketRecognitionToken) return;
        const label = message.status === "recognizing text" ? "正在讀取機票內容…" : "正在準備辨識工具…";
        setFlightTicketStatus(form, label, { progress: Number(message.progress) || 0.08 });
      },
    });
    const result = await worker.recognize(file);
    if (!form.isConnected || token !== flightTicketRecognitionToken) return;
    const parsed = parseFlightTicketText(result.data.text, { startDate: state.startDate, endDate: state.endDate });
    const count = applyFlightTicketData(form, parsed);
    if (!count) {
      setFlightTicketStatus(form, "未找到可帶入的航班資料，請換一張較清楚的圖片。", { progress: 1, tone: "error" });
      return;
    }
    setFlightTicketStatus(form, `已帶入 ${count} 項資料，請確認後再儲存。`, { progress: 1, tone: "success" });
  } catch {
    if (form.isConnected && token === flightTicketRecognitionToken) {
      setFlightTicketStatus(form, "圖片辨識失敗，請確認網路後重新辨識。", { progress: 0, tone: "error" });
    }
  } finally {
    await worker?.terminate?.().catch(() => {});
    if (form.isConnected && token === flightTicketRecognitionToken) {
      form.dataset.ticketBusy = "false";
      if (retryButton) retryButton.disabled = false;
    }
  }
}

async function handleFlightTicketFile(input) {
  const form = input?.closest("#flight-form");
  const file = input?.files?.[0];
  if (!form || !file) return;
  if (!file.type.startsWith("image/")) return showToast("請選擇照片格式的機票圖片");
  if (file.size > 15 * 1024 * 1024) return showToast("圖片請小於 15 MB");
  flightTicketRecognitionToken += 1;
  form.dataset.ticketBusy = "false";
  pendingFlightTicketFile = file;
  if (flightTicketPreviewUrl) URL.revokeObjectURL(flightTicketPreviewUrl);
  flightTicketPreviewUrl = URL.createObjectURL(file);
  const preview = form.querySelector("[data-flight-ticket-preview]");
  const image = form.querySelector("[data-flight-ticket-image]");
  const fileName = form.querySelector("[data-flight-ticket-name]");
  const retryButton = form.querySelector("[data-recognize-flight-ticket]");
  if (preview) preview.hidden = false;
  if (image) image.src = flightTicketPreviewUrl;
  if (fileName) fileName.textContent = file.name;
  if (retryButton) retryButton.hidden = false;
  await recognizeFlightTicket(form, file);
}

function flightItineraryDate(flight) {
  if (flight?.journeyId || Number(flight?.segmentCount) > 1) {
    const segmentDate = compactTripDate(flight.departureDate);
    if (dateMeta.some(([date]) => date === segmentDate)) return segmentDate;
  }
  if (flight.direction === "去程") return dateMeta[0]?.[0] || compactTripDate(flight.departureDate);
  if (flight.direction === "回程") return dateMeta.at(-1)?.[0] || compactTripDate(flight.departureDate);
  const departureDate = compactTripDate(flight.departureDate);
  return dateMeta.some(([date]) => date === departureDate) ? departureDate : dateMeta[0]?.[0] || departureDate;
}

function itineraryItemKey(item) {
  return item?.id || (item?.type === "flight" ? `flight:${item.flightId}` : `place:${item?.name || ""}`);
}

function ensureItineraryItemIds() {
  Object.entries(state.itinerary || {}).forEach(([date, items]) => {
    (items || []).forEach((item) => {
      if (item.id) return;
      item.id = item.type === "flight"
        ? `flight:${item.flightId}`
        : `place:${date}:${String(item.name || "行程項目").normalize("NFKC")}`;
    });
  });
}

const transportModes = {
  walk: { label: "步行", icon: "🚶", color: "#777975", dash: "2 9", travelMode: "walking" },
  subway: { label: "地鐵", icon: "🚇", color: "#78558b", dash: "", travelMode: "transit" },
  train: { label: "火車", icon: "🚆", color: "#78558b", dash: "", travelMode: "transit" },
  bus: { label: "公車", icon: "🚌", color: "#3f7193", dash: "10 8", travelMode: "transit" },
  taxi: { label: "計程車", icon: "🚕", color: "#bf7b2b", dash: "", travelMode: "driving" },
  drive: { label: "開車", icon: "🚗", color: "#bf7b2b", dash: "", travelMode: "driving" },
  ferry: { label: "渡輪", icon: "⛴", color: "#40777a", dash: "10 8", travelMode: "transit" },
  other: { label: "其他", icon: "↗", color: "#777975", dash: "6 7", travelMode: "" },
};

function transportModeMeta(mode = "walk") {
  return transportModes[mode] || transportModes.other;
}

function itineraryAdjacentPairs(date) {
  const items = state.itinerary[date] || [];
  return items.slice(0, -1).map((item, index) => ({ from: item, to: items[index + 1] }));
}

function findItineraryItemById(date, id) {
  return (state.itinerary[date] || []).find((item) => itineraryItemKey(item) === id);
}

function reconcileTransportSegments(date = "") {
  ensureItineraryItemIds();
  const dates = date ? [date] : Object.keys(state.itinerary || {});
  const adjacency = new Set(
    dates.flatMap((candidateDate) => itineraryAdjacentPairs(candidateDate)
      .map(({ from, to }) => `${candidateDate}\u0000${itineraryItemKey(from)}\u0000${itineraryItemKey(to)}`)),
  );
  (state.transports || []).forEach((transport) => {
    if (date && transport.date !== date) return;
    transport.needsReview = !adjacency.has(`${transport.date}\u0000${transport.fromItemId}\u0000${transport.toItemId}`);
  });
}

function transportForPair(date, fromItemId, toItemId) {
  return (state.transports || []).find((transport) =>
    transport.date === date &&
    transport.fromItemId === fromItemId &&
    transport.toItemId === toItemId &&
    !transport.needsReview,
  );
}

function transportEndpointQuery(transport, role) {
  const itemId = role === "from" ? transport.fromItemId : transport.toItemId;
  const station = role === "from" ? transport.departureStation : transport.arrivalStation;
  if (station) return station;
  const item = findItineraryItemById(transport.date, itemId);
  if (item?.type === "flight") {
    const flight = state.flights.find((candidate) => candidate.id === item.flightId);
    const city = role === "from" ? flight?.arrivalCity : flight?.departureCity;
    const code = role === "from" ? flight?.arrivalCode : flight?.departureCode;
    return `${city || ""} ${code || ""} airport`.trim();
  }
  const place = state.places.find((candidate) => candidate.name === item?.name);
  if (Number.isFinite(place?.latitude) && Number.isFinite(place?.longitude)) {
    return `${place.latitude},${place.longitude}`;
  }
  return item?.name || (role === "from" ? transport.fromLabel : transport.toLabel) || "";
}

function transportDirectionsUrl(transport) {
  const origin = transportEndpointQuery(transport, "from");
  const destination = transportEndpointQuery(transport, "to");
  if (!origin || !destination) return "";
  const params = new URLSearchParams({ api: "1", origin, destination });
  const travelMode = transportModeMeta(transport.mode).travelMode;
  if (travelMode) params.set("travelmode", travelMode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function itineraryItemLabel(item) {
  if (item?.type !== "flight") return item?.name || "行程項目";
  const flight = state.flights.find((candidate) => candidate.id === item.flightId);
  return flight ? `${flight.direction || "航班"} · ${flight.departureCity} → ${flight.arrivalCity}` : "航班";
}

function itineraryItemTime(item) {
  if (item?.type !== "flight") return /^\d{2}:\d{2}$/.test(item?.time || "") ? item.time : "99:99";
  const flight = state.flights.find((candidate) => candidate.id === item.flightId);
  const time = flight?.departureTime || item.time || "";
  return /^\d{2}:\d{2}$/.test(time) ? time : "99:99";
}

function clockMinutes(value = "") {
  const match = String(value).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function minutesClock(value) {
  if (!Number.isInteger(value) || value < 0 || value >= 24 * 60) return "";
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function itineraryBoundaryTime(item, role) {
  if (item?.type !== "flight") return clockMinutes(item?.time) === null ? "" : item.time;
  const flight = state.flights.find((candidate) => candidate.id === item.flightId);
  const value = role === "from" ? flight?.arrivalTime : flight?.departureTime;
  return clockMinutes(value) === null ? "" : value;
}

function itineraryEndpointCoordinates(item, role) {
  if (!item) return null;
  if (item.type === "flight") {
    const flight = state.flights.find((candidate) => candidate.id === item.flightId);
    const code = role === "from" ? flight?.arrivalCode : flight?.departureCode;
    return airportCoordinateCache[String(code || "").toUpperCase()] || null;
  }
  const place = state.places.find((candidate) => candidate.name === item.name);
  return Number.isFinite(place?.latitude) && Number.isFinite(place?.longitude)
    ? { latitude: place.latitude, longitude: place.longitude }
    : null;
}

function distanceKilometers(first, second) {
  if (!first || !second) return null;
  const radians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const latitudeA = radians(first.latitude);
  const latitudeB = radians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function estimatedWalkingMinutes(pair) {
  const distance = distanceKilometers(
    itineraryEndpointCoordinates(pair?.from, "from"),
    itineraryEndpointCoordinates(pair?.to, "to"),
  );
  if (!Number.isFinite(distance)) return "";
  const minutes = (distance * 1.22 * 60) / 4.8;
  return Math.max(3, Math.min(1440, Math.round(minutes / 5) * 5));
}

function transportTimeWindow(pair) {
  const startLabel = itineraryBoundaryTime(pair?.from, "from");
  const endLabel = itineraryBoundaryTime(pair?.to, "to");
  const start = clockMinutes(startLabel);
  const end = clockMinutes(endLabel);
  return { start, end, startLabel, endLabel, invalid: start !== null && end !== null && end < start };
}

function transportTimingError(pair, { journeyType = "regular", departureTime = "", arrivalTime = "", durationMinutes = "" } = {}) {
  const window = transportTimeWindow(pair);
  if (window.invalid) return "前後行程時間順序不正確，請先調整行程時間";

  const scheduled = journeyType === "scheduled";
  const departure = scheduled ? clockMinutes(departureTime) : null;
  const arrival = scheduled ? clockMinutes(arrivalTime) : null;
  const durationValue = Number(durationMinutes);
  const duration = Number.isFinite(durationValue) && durationValue > 0 ? Math.round(durationValue) : null;

  if (departure !== null && arrival !== null && arrival <= departure) {
    return "抵達時間必須晚於出發時間";
  }
  if (window.start !== null && ((departure !== null && departure < window.start) || (arrival !== null && arrival < window.start))) {
    return `這段交通不能早於前一個行程的 ${window.startLabel}`;
  }
  if (window.end !== null && ((departure !== null && departure > window.end) || (arrival !== null && arrival > window.end))) {
    return `這段交通不能晚於下一個行程的 ${window.endLabel}`;
  }
  if (duration !== null && window.start !== null && window.end !== null && duration > window.end - window.start) {
    return `所需時間不能超過前後行程間的 ${window.end - window.start} 分鐘`;
  }
  if (duration !== null && departure !== null && window.end !== null && departure + duration > window.end) {
    return `依照出發時間，必須在 ${window.endLabel} 前抵達下一個行程`;
  }
  if (duration !== null && arrival !== null && window.start !== null && arrival - duration < window.start) {
    return `依照抵達時間，不能早於 ${window.startLabel} 離開前一個行程`;
  }
  if (duration !== null && departure !== null && arrival !== null && duration > arrival - departure) {
    return `所需時間不能超過出發至抵達間的 ${arrival - departure} 分鐘`;
  }
  return "";
}

function transportWindowLabel(pair) {
  const window = transportTimeWindow(pair);
  if (window.invalid) return "前後行程的時間順序需要先調整";
  if (window.startLabel && window.endLabel) return `可安排時間：${window.startLabel}–${window.endLabel}`;
  if (window.startLabel) return `最早可從 ${window.startLabel} 出發`;
  if (window.endLabel) return `最晚須在 ${window.endLabel} 前抵達`;
  return "前後行程尚未設定時間，可自由安排";
}

function updateTransportFormValidation(form) {
  if (!form) return "";
  const data = new FormData(form);
  const pairs = itineraryAdjacentPairs(form.dataset.transportDate);
  const pair = pairs[Number(data.get("pairIndex"))];
  const journeyType = String(data.get("journeyType") || "regular");
  const departureTime = String(data.get("departureTime") || "");
  const arrivalTime = String(data.get("arrivalTime") || "");
  const error = pair ? transportTimingError(pair, {
    journeyType,
    departureTime,
    arrivalTime,
    durationMinutes: data.get("durationMinutes"),
  }) : "請先選擇相鄰的兩個行程";
  const window = transportTimeWindow(pair);
  const departure = clockMinutes(departureTime);
  const arrival = clockMinutes(arrivalTime);
  const departureInput = form.elements.departureTime;
  const arrivalInput = form.elements.arrivalTime;

  if (departureInput && arrivalInput) {
    const departureMax = [window.end, arrival === null ? null : arrival - 1].filter((value) => value !== null);
    const arrivalMin = [window.start, departure === null ? null : departure + 1].filter((value) => value !== null);
    departureInput.min = minutesClock(window.start);
    departureInput.max = minutesClock(departureMax.length ? Math.min(...departureMax) : null);
    arrivalInput.min = minutesClock(arrivalMin.length ? Math.max(...arrivalMin) : null);
    arrivalInput.max = minutesClock(window.end);
  }

  const hint = form.querySelector("[data-transport-time-window]");
  if (hint) hint.textContent = transportWindowLabel(pair);
  const message = form.querySelector("[data-transport-validation]");
  if (message) {
    message.textContent = error;
    message.hidden = !error;
  }
  const saveButton = form.querySelector("[data-transport-save]");
  if (saveButton) saveButton.disabled = Boolean(error);
  form.classList.toggle("has-transport-error", Boolean(error));
  return error;
}

function sortItineraryByTime(date) {
  state.itinerary[date] = (state.itinerary[date] || [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => itineraryItemTime(a.item).localeCompare(itineraryItemTime(b.item)) || a.index - b.index)
    .map(({ item }) => item);
  reconcileTransportSegments(date);
}

function syncFlightItineraryItems() {
  const flights = new Map(state.flights.map((flight) => [flight.id, flight]));
  const seen = new Set();
  Object.keys(state.itinerary).forEach((date) => {
    state.itinerary[date] = (state.itinerary[date] || []).filter((item) => {
      if (item?.type !== "flight") return true;
      const flight = flights.get(item.flightId);
      if (!flight || seen.has(item.flightId) || flightItineraryDate(flight) !== date) return false;
      item.time = flight.departureTime || item.time || "--:--";
      seen.add(item.flightId);
      return true;
    });
  });
  const additions = new Map();
  state.flights.forEach((flight) => {
    if (seen.has(flight.id)) return;
    const date = flightItineraryDate(flight);
    if (!date) return;
    const item = { type: "flight", flightId: flight.id, time: flight.departureTime || "--:--" };
    additions.set(date, [...(additions.get(date) || []), { flight, item }]);
  });
  additions.forEach((entries, date) => {
    const first = entries.filter(({ flight }) => flight.direction === "去程").map(({ item }) => item);
    const last = entries.filter(({ flight }) => flight.direction !== "去程").map(({ item }) => item);
    state.itinerary[date] = [...first, ...(state.itinerary[date] || []), ...last];
  });
  ensureItineraryItemIds();
  reconcileTransportSegments();
}

function deletePlace(name) {
  if (!canEdit()) return false;
  const place = state.places.find((item) => item.name === name);
  if (!place) return false;
  state.places = state.places.filter((item) => item.name !== name);
  if (!place.isCustom && !state.deletedPlaces.includes(name)) state.deletedPlaces.push(name);
  delete state.votes[name];
  Object.keys(state.itinerary).forEach((date) => {
    state.itinerary[date] = (state.itinerary[date] || []).filter((item) => item.type === "flight" || item.name !== name);
  });
  reconcileTransportSegments();
  if (!state.places.some((item) => travelAreaGroupKey(item) === state.selectedArea)) state.selectedArea = "";
  if (state.selectedMapPlace === name) state.selectedMapPlace = "";
  persist();
  return true;
}

function deleteItineraryItem(date, name) {
  if (!canEdit()) return false;
  const items = state.itinerary[date] || [];
  const nextItems = items.filter((item) => item.type === "flight" || item.name !== name);
  if (nextItems.length === items.length) return false;
  state.itinerary[date] = nextItems;
  reconcileTransportSegments(date);
  persist();
  return true;
}

function moveItineraryItem(date, key, direction) {
  if (!canEdit()) return false;
  const items = state.itinerary[date] || [];
  const index = items.findIndex((item) => itineraryItemKey(item) === key);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return false;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  reconcileTransportSegments(date);
  persist();
  return true;
}

function showToast(message, { allowUndo = offerUndoWithNextToast } = {}) {
  const showUndo = Boolean(allowUndo && undoSnapshot && canEdit());
  offerUndoWithNextToast = false;
  toastRoot.innerHTML = `<div class="toast"><span>${escapeHtml(message)}</span>${showUndo ? `<button type="button" data-undo-last>復原</button>` : ""}</div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastRoot.innerHTML = "";
  }, showUndo ? 5200 : 2200);
}

function sharedTripPayload() {
  ensureItineraryItemIds();
  reconcileTransportSegments();
  return {
    title: state.tripTitle,
    destination: state.destination,
    startDate: state.startDate,
    endDate: state.endDate,
    flights: state.flights,
    places: state.places,
    votes: state.votes,
    itinerary: state.itinerary,
    transports: state.transports,
    members: state.members,
  };
}

function applySharedTrip(payload) {
  if (!payload || !Array.isArray(payload.places)) return false;
  state.tripId = payload.id || state.tripId;
  state.tripTitle = payload.title || "未命名旅程";
  state.destination = payload.destination || "未設定目的地";
  state.startDate = payload.startDate || state.startDate;
  state.endDate = payload.endDate || state.endDate;
  state.inviteCode = payload.inviteCode || "";
  state.ownerId = payload.ownerId || "";
  state.flights = Array.isArray(payload.flights) ? payload.flights : [];
  state.places = payload.places.map((place) => ensureTravelAreaFields(withStoredTabelogLink(
    { ...place, kind: normalizedPlaceKind(place) },
    state.destination,
  )));
  state.votes = payload.votes && typeof payload.votes === "object" ? payload.votes : {};
  state.itinerary = payload.itinerary && typeof payload.itinerary === "object" ? payload.itinerary : {};
  state.transports = Array.isArray(payload.transports) ? payload.transports : [];
  state.members = payload.members && typeof payload.members === "object" ? payload.members : {};
  if (state.profile) state.members[state.profile.id] = state.profile.nickname;
  state.sharedRevision = Number(payload.revision) || state.sharedRevision;
  dateMeta = buildDateMeta(state.startDate, state.endDate);
  syncFlightItineraryItems();
  if (!dateMeta.some(([date]) => date === state.selectedDate)) state.selectedDate = dateMeta[0]?.[0] || "";
  resetUndoBaseline({ clear: true });
  return true;
}

async function saveSharedTrip() {
  if (!canEdit() || sharedSyncBusy) return;
  sharedSyncBusy = true;
  try {
    state.members[currentMemberId()] = state.profile.nickname;
    const response = await fetch(`/api/trip?id=${encodeURIComponent(state.tripId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sharedTripPayload()),
    });
    if (response.status === 401) {
      state.profile = null;
      localStorage.removeItem("tokyo-profile-v1");
      sessionStorage.removeItem("tokyo-access-mode-v1");
      render({ preserveScroll: true });
      openProfileSheet(true);
      return showToast("登入已過期，請重新輸入暱稱與 PIN");
    }
    if (!response.ok) throw new Error("SAVE_FAILED");
    const payload = await response.json();
    state.sharedRevision = Number(payload.revision) || state.sharedRevision;
  } catch {
    showToast("共用資料暫時無法同步，稍後會再試");
  } finally {
    sharedSyncBusy = false;
  }
}

async function authenticateMember(nickname, pin) {
  const response = await fetch("/api/member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "LOGIN_FAILED");
  return payload.member;
}

function shoppingPayload() {
  return {
    scope: "private",
    categories: state.shopping.categories,
    tags: state.shopping.tags,
    items: state.shopping.items,
    photos: state.shopping.photos,
  };
}

function applyPrivateShopping(payload) {
  if (!payload || !Array.isArray(payload.items)) return false;
  state.shopping = {
    scope: "private",
    categories: Array.isArray(payload.categories) && payload.categories.length
      ? payload.categories
      : defaultShoppingCategories.map((category) => ({ ...category })),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    items: payload.items,
    photos: payload.photos && typeof payload.photos === "object" ? payload.photos : {},
    revision: Number(payload.revision) || 0,
    updatedAt: payload.updatedAt || "",
  };
  state.shoppingLoaded = true;
  shoppingUndoSnapshot = null;
  shoppingSelectionMode = false;
  shoppingSelectedIds.clear();
  return true;
}

async function loadShopping({ quiet = false, force = false } = {}) {
  if (!canManageShopping()) return;
  const tripId = state.tripId;
  try {
    const response = await fetch(`/api/shopping?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" });
    if (response.status === 401) return;
    if (!response.ok) throw new Error("SHOPPING_LOAD_FAILED");
    const payload = await response.json();
    if (state.tripId !== tripId) return;
    if (!force && state.shoppingLoaded && Number(payload.revision) <= Number(state.shopping.revision)) return;
    applyPrivateShopping(payload);
    if (state.activeTab === "shopping") render({ preserveScroll: true });
  } catch {
    if (!quiet) showToast("私人採買清單暫時無法載入");
  }
}

async function saveShopping() {
  if (!canManageShopping()) return;
  if (shoppingSaveBusy) {
    shoppingSavePending = true;
    return;
  }
  shoppingSaveBusy = true;
  const tripId = state.tripId;
  try {
    const response = await fetch(`/api/shopping?tripId=${encodeURIComponent(tripId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shoppingPayload()),
    });
    if (!response.ok) throw new Error("SHOPPING_SAVE_FAILED");
    const payload = await response.json();
    if (state.tripId === tripId) {
      state.shopping.revision = Number(payload.revision) || state.shopping.revision;
      state.shopping.updatedAt = payload.updatedAt || state.shopping.updatedAt;
    }
    return payload;
  } catch {
    showToast("私人採買清單暫時無法儲存，請稍後重試");
    return null;
  } finally {
    shoppingSaveBusy = false;
    if (shoppingSavePending) {
      shoppingSavePending = false;
      saveShopping();
    }
  }
}

async function loadTrips({ selectNewest = false } = {}) {
  if (!state.profile) return;
  const response = await fetch("/api/trips", { cache: "no-store" });
  if (response.status === 401) {
    state.profile = null;
    state.trips = [];
    state.tripId = "";
    localStorage.removeItem("tokyo-profile-v1");
    render();
    openProfileSheet(true);
    return;
  }
  if (!response.ok) throw new Error("TRIPS_LOAD_FAILED");
  state.trips = (await response.json()).trips || [];
  const preferred = selectNewest ? state.trips.at(-1)?.id : localStorage.getItem("active-trip-v1");
  const nextId = state.trips.some((trip) => trip.id === preferred) ? preferred : state.trips[0]?.id || "";
  state.tripId = nextId;
  state.sharedRevision = 0;
  if (nextId) {
    await loadSharedTrip({ quiet: true, force: true });
    state.shoppingLoaded = false;
    state.shopping = emptyShoppingState();
    await loadShopping({ quiet: true, force: true });
  }
  else render();
}

async function switchTrip(tripId) {
  if (!state.trips.some((trip) => trip.id === tripId)) return;
  if (sharedSaveTimer) {
    window.clearTimeout(sharedSaveTimer);
    sharedSaveTimer = 0;
    await saveSharedTrip();
  }
  state.tripId = tripId;
  state.sharedRevision = 0;
  state.placeKind = "all";
  state.mapCategory = "all";
  state.mapView = "planning";
  state.mapDate = "all";
  state.shoppingLoaded = false;
  state.shopping = emptyShoppingState();
  state.shoppingFilter = "all";
  state.shoppingRecipientFilter = "all";
  shoppingUndoSnapshot = null;
  shoppingSelectionMode = false;
  shoppingSelectedIds.clear();
  localStorage.setItem("active-trip-v1", tripId);
  closeSheet();
  await loadSharedTrip({ force: true });
  await loadShopping({ quiet: true, force: true });
  maybeOpenShareTargetImport();
}

async function mutateTrips(payload) {
  const response = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "TRIP_ACTION_FAILED");
  return result.trip || result;
}

function clearSharedInviteFromUrl() {
  state.pendingInviteCode = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function tripShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("invite", state.inviteCode);
  return url.toString();
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

async function shareCurrentTrip() {
  if (!state.tripId || !state.inviteCode) return showToast("邀請碼仍在讀取，請稍後再試");
  const url = tripShareUrl();
  const copyPromise = copyText(url);
  if (navigator.share) {
    try {
      await navigator.share({
        title: state.tripTitle,
        text: `加入「${state.tripTitle}」一起規劃旅行`,
        url,
      });
      await copyPromise;
      return showToast("邀請連結已複製並分享");
    } catch (error) {
      const copied = await copyPromise;
      if (error?.name !== "AbortError") return showToast(copied ? "邀請連結已複製" : "暫時無法分享連結");
    }
  }
  const copied = await copyPromise;
  return showToast(copied ? "邀請連結已複製" : "暫時無法複製連結");
}

async function loadSharedTrip({ quiet = false, force = false } = {}) {
  if (sharedSyncBusy) return;
  try {
    if (!state.tripId) return;
    const response = await fetch(`/api/trip?id=${encodeURIComponent(state.tripId)}`, { cache: "no-store" });
    if (response.status === 403) {
      localStorage.removeItem("active-trip-v1");
      state.tripId = "";
      await loadTrips();
      return showToast("你已不在這趟旅程中");
    }
    if (!response.ok) throw new Error("LOAD_FAILED");
    const payload = await response.json();
    if (!force && (Number(payload.revision) || 0) <= state.sharedRevision) return;
    if (!force && state.activeTab === "places" && state.placesMode === "map" && Date.now() < mapInteractionUntil) return;
    if (applySharedTrip(payload)) {
      persist({ sync: false, resetUndo: true });
      render({ preserveScroll: true });
      window.setTimeout(resolveStoredPlacePlanningRegions, 0);
    }
  } catch {
    if (!quiet) showToast("目前顯示離線資料");
  }
}

function guestOnlyMessage() {
  showToast("訪客只能閱覽；登入暱稱後即可參與規劃");
}

async function setTab(tab) {
  if (tab !== "shopping") {
    shoppingSelectionMode = false;
    shoppingSelectedIds.clear();
  }
  state.activeTab = tab;
  syncTabBarState();
  render();
  if (tab === "shopping" && canManageShopping() && !state.shoppingLoaded) {
    await loadShopping({ force: true });
  }
}

function syncTabBarState() {
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.tab === state.activeTab;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function tripDateLabel(date) {
  if (!date) return "日期未設定";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? `${parsed.getMonth() + 1}/${parsed.getDate()}` : date;
}

function shareButtonMarkup() {
  return `<button class="share-button" type="button" data-share-trip aria-label="分享這趟旅程"><span aria-hidden="true">↗</span><b>分享</b></button>`;
}

function emptyTripsScreen() {
  return `
    <section class="screen empty-trips-screen">
      <header class="title-row">
        <div><h1>我的旅程</h1><p class="meta">建立自己的旅行，或加入旅伴的行程</p></div>
        <button class="profile-button" type="button" data-edit-profile>${avatarMarkup(currentMemberId())}<span><small>目前身分</small><strong>${escapeHtml(state.profile?.nickname || "旅伴")}</strong></span></button>
      </header>
      <div class="empty-trip-card"><span>＋</span><h2>開始你的第一趟旅程</h2><p>建立一趟全新旅程，或輸入旅伴分享給你的邀請碼。</p><button class="primary-button" type="button" data-create-trip>建立空白旅程</button><div class="empty-choice"><i></i><b>或</b><i></i></div><form id="empty-join-trip-form" class="empty-invite-form"><label for="empty-trip-invite">旅程邀請碼</label><div><input id="empty-trip-invite" name="inviteCode" maxlength="6" minlength="6" required autocomplete="off" autocapitalize="characters" value="${escapeHtml(state.pendingInviteCode)}" placeholder="輸入 6 位邀請碼" /><button class="secondary-button" type="submit">加入旅程</button></div></form></div>
    </section>`;
}

function emptyGuestScreen() {
  return `
    <section class="screen empty-trips-screen">
      <header class="title-row">
        <div><h1>旅行規劃</h1><p class="meta">目前沒有可供訪客閱覽的旅程</p></div>
        <button class="profile-button" type="button" data-edit-profile><span class="member-avatar guest">訪</span><span><small>目前身分</small><strong>訪客</strong></span></button>
      </header>
      <div class="empty-trip-card"><span>旅</span><h2>登入後開始規劃</h2><p>使用自己的暱稱與 PIN 登入，即可建立空白旅程，或用邀請碼加入旅伴的旅程。</p><button class="primary-button" type="button" data-edit-profile>登入／建立身分</button></div>
    </section>`;
}

function flightDirectionLabel(flight) {
  const segmentCount = Math.max(1, Number(flight?.segmentCount) || 1);
  const segmentIndex = Math.max(0, Number(flight?.segmentIndex) || 0);
  return segmentCount > 1 ? `${flight.direction || "航班"} ${segmentIndex + 1}/${segmentCount}` : flight.direction || tripDateLabel(flight.departureDate);
}

function flightLayoverLabel(flight) {
  if (!flight?.journeyId || !(Number(flight.segmentIndex) > 0)) return "";
  const previous = state.flights.find((candidate) => candidate.journeyId === flight.journeyId && Number(candidate.segmentIndex) === Number(flight.segmentIndex) - 1);
  if (!previous) return "";
  const previousArrival = new Date(`${previous.arrivalDate}T${previous.arrivalTime || "00:00"}`).getTime();
  const departure = new Date(`${flight.departureDate}T${flight.departureTime || "00:00"}`).getTime();
  const minutes = Math.round((departure - previousArrival) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return `${flight.departureCity || previous.arrivalCity}轉機`;
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} 小時${minutes % 60 ? ` ${minutes % 60} 分` : ""}` : `${minutes} 分`;
  return `${flight.departureCity || previous.arrivalCity}轉機 ${duration}`;
}

function flightMarkup(flight) {
  const layover = flightLayoverLabel(flight);
  return `
    <button class="flight-leg editable-flight" type="button" ${canEdit() ? `data-edit-flight="${escapeHtml(flight.id)}"` : "data-guest-action"}>
      <span class="flight-direction-badge">${escapeHtml(flightDirectionLabel(flight))}</span>
      <div class="airport departure-airport"><strong>${escapeHtml(flight.departureCity || "出發地")}</strong><span>${escapeHtml(flight.departureCode || "---")} · ${escapeHtml(flight.departureTime || "--:--")}</span></div>
      <div class="flight-arrow" aria-hidden="true"><span class="plane">✈</span></div>
      <div class="airport arrival-airport"><strong>${escapeHtml(flight.arrivalCity || "抵達地")}</strong><span>${escapeHtml(flight.arrivalCode || "---")} · ${escapeHtml(flight.arrivalTime || "--:--")}</span></div>
      <span class="flight-travelers">${layover ? `<b>${escapeHtml(layover)}</b><i>·</i>` : ""}${escapeHtml(flight.travelers || "尚未註記乘客")}</span>
    </button>`;
}

function overviewTripStatus() {
  const day = 24 * 60 * 60 * 1000;
  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const start = new Date(`${state.startDate}T00:00:00`).getTime();
  const end = new Date(`${state.endDate}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { eyebrow: "旅程規劃中", title: "日期尚未完整設定" };
  if (todayAtMidnight < start) return { eyebrow: "距離出發", title: `${Math.ceil((start - todayAtMidnight) / day)} 天` };
  if (todayAtMidnight <= end) return { eyebrow: "旅程進行中", title: `第 ${Math.floor((todayAtMidnight - start) / day) + 1} 天` };
  return { eyebrow: "旅程已結束", title: "回憶整理中" };
}

function overviewPlanningSummary() {
  const scheduledItems = dateMeta.flatMap(([date]) => state.itinerary[date] || []);
  const scheduledPlaces = scheduledItems.filter((item) => item.type !== "flight");
  const scheduledNames = new Set(scheduledPlaces.map((item) => item.name));
  const plannedDays = dateMeta.filter(([date]) => (state.itinerary[date] || []).some((item) => item.type !== "flight")).length;
  const itineraryDays = dateMeta.filter(([date]) => (state.itinerary[date] || []).length > 0).length;
  const favoritePlaces = state.places.filter((place) => placeVoters(place.name).length > 0);
  const unplannedFavorites = favoritePlaces.filter((place) => !scheduledNames.has(place.name));
  const lodgingCount = state.places.filter((place) => place.kind === "lodging").length;
  const pairs = dateMeta.flatMap(([date]) => itineraryAdjacentPairs(date).map((pair) => ({ date, ...pair })));
  const missingTransport = pairs.filter(({ date, from, to }) => !transportForPair(date, itineraryItemKey(from), itineraryItemKey(to))).length;
  const flightProgress = Math.min(1, state.flights.length / 2);
  const lodgingProgress = lodgingCount > 0 ? 1 : 0;
  const itineraryProgress = dateMeta.length ? itineraryDays / dateMeta.length : 0;
  const transportProgress = pairs.length ? (pairs.length - missingTransport) / pairs.length : 0;
  const readiness = Math.round((flightProgress * 20) + (lodgingProgress * 20) + (itineraryProgress * 40) + (transportProgress * 20));
  const actions = [];
  if (!state.flights.length) actions.push({ icon: "✈", title: "加入航班資料", detail: "讓去回程自動出現在每日行程", action: "flight" });
  if (!lodgingCount) actions.push({ icon: "◇", title: "住宿尚未決定", detail: "加入住宿後可直接比較景點距離", action: "lodging" });
  if (!scheduledPlaces.length) actions.push({ icon: "□", title: "開始安排每日行程", detail: "從收藏地點挑選第一天行程", action: "itinerary" });
  if (unplannedFavorites.length) actions.push({ icon: "★", title: `${unplannedFavorites.length} 個推薦地點尚未安排`, detail: "優先處理旅伴已投票的地點", action: "favorites" });
  if (missingTransport) actions.push({ icon: "↗", title: `${missingTransport} 段交通尚未設定`, detail: "補齊相鄰景點之間的移動方式", action: "itinerary" });
  if (!actions.length) actions.push({ icon: "✓", title: "主要規劃已完成", detail: "可再確認營業時間與訂票狀態", action: "itinerary" });
  return {
    scheduledPlaces,
    plannedDays,
    favoritePlaces,
    lodgingCount,
    missingTransport,
    readiness,
    actions: actions.slice(0, 3),
  };
}

function overviewScreen() {
  const status = overviewTripStatus();
  const summary = overviewPlanningSummary();
  const actionCards = summary.actions.map((item) => `
    <button class="overview-action-card" type="button" data-overview-action="${item.action}">
      <span>${item.icon}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><b>›</b>
    </button>`).join("");

  return `
    <section class="screen overview-screen">
      ${state.isGuest ? `<div class="guest-banner"><span><strong>訪客模式</strong>僅供閱覽</span><button type="button" data-edit-profile>登入參與規劃</button></div>` : ""}
      <header class="title-row">
        <div>
          <button class="trip-title-button" type="button" ${state.isGuest ? "disabled" : "data-open-trips"}><h1>${escapeHtml(state.tripTitle)}</h1><span>${state.isGuest ? "" : "⌄"}</span></button>
          <p class="subtitle">${escapeHtml(tripDateLabel(state.startDate))}–${escapeHtml(tripDateLabel(state.endDate))} · ${escapeHtml(state.destination)}</p>
        </div>
        <div class="header-actions">
          ${undoButtonMarkup("overview-undo-button")}
          ${state.isGuest ? "" : shareButtonMarkup()}
          <button class="profile-button" type="button" data-edit-profile aria-label="查看旅程成員與帳戶">
            ${state.isGuest ? `<span class="member-avatar guest">訪</span>` : avatarMarkup(currentMemberId())}
            <span><small>${state.isGuest ? "目前身分" : `旅程成員 · ${members().length} 人`}</small><strong>${escapeHtml(state.isGuest ? "訪客" : state.profile?.nickname || "設定暱稱")}</strong></span>
          </button>
        </div>
      </header>

      <section class="overview-status-card">
        <div><small>${escapeHtml(status.eyebrow)}</small><strong>${escapeHtml(status.title)}</strong><span>${escapeHtml(state.destination)} · ${dateMeta.length} 天</span></div>
        <div class="overview-readiness"><strong>${summary.readiness}<small>%</small></strong><span>規劃完成度</span></div>
        <div class="overview-progress" aria-label="行程規劃完成度 ${summary.readiness}%"><i style="width:${summary.readiness}%"></i></div>
      </section>

      <section class="flight-section overview-flight-section">
        <div class="section-row"><h2>✈ 航班</h2>${canEdit() ? `<button class="icon-button" type="button" data-add-flight aria-label="新增航班">＋</button>` : ""}</div>
        <div class="flight-card">${state.flights.length ? state.flights.map(flightMarkup).join("") : `<div class="flight-empty"><span>尚未加入航班</span>${canEdit() ? `<button type="button" data-add-flight>＋ 新增第一個航班</button>` : ""}</div>`}</div>
      </section>

      <div class="overview-metrics" aria-label="規劃摘要">
        <button type="button" data-overview-action="favorites"><strong>${state.places.length}</strong><span>收藏地點</span></button>
        <button type="button" data-overview-action="itinerary"><strong>${summary.scheduledPlaces.length}</strong><span>已排行程</span></button>
        <button type="button" data-overview-action="itinerary"><strong>${summary.plannedDays}/${dateMeta.length}</strong><span>完成天數</span></button>
        <button type="button" data-overview-action="favorites"><strong>${summary.favoritePlaces.length}</strong><span>成員推薦</span></button>
      </div>

      <section class="overview-next-section">
        <div class="section-row"><div><p class="section-kicker">共同決策</p><h2>接下來處理</h2></div></div>
        <div class="overview-action-list">${actionCards}</div>
      </section>
    </section>`;
}

function placesScreen() {
  if (state.placesMode === "map") return mapScreen();

  const visiblePlaces = state.places.filter((place) => state.placeKind === "all" || place.kind === state.placeKind);
  const travelAreaKeys = [...new Set(visiblePlaces.map(travelAreaGroupKey))];
  const groups = travelAreaKeys
    .map((regionKey) => {
      const rows = visiblePlaces
        .filter((place) => travelAreaGroupKey(place) === regionKey)
        .map((place) => {
          const voters = placeVoters(place.name);
          const active = voters.includes(currentMemberId());
          return `
            <div class="swipe-row ${canEdit() ? "" : "readonly"}">
              ${canEdit() ? `<button class="swipe-delete" type="button" data-request-delete-place="${escapeHtml(place.name)}" aria-label="刪除${escapeHtml(place.name)}">刪除</button>` : ""}
              <article class="place-row swipe-surface" ${canEdit() ? `data-swipe-item="place:${escapeHtml(place.name)}"` : ""}>
                <button class="place-thumb" style="--swatch:${place.swatch}" type="button" data-open-place="${escapeHtml(place.name)}">${escapeHtml(place.mark)}</button>
                <button class="place-copy place-copy-button" type="button" data-open-place="${escapeHtml(place.name)}">
                  <strong>${escapeHtml(place.name)}</strong>
                  <span>${escapeHtml(place.category)} · ${escapeHtml(placeCreatorName(place))}新增</span>
                  <span class="vote-names">${escapeHtml(voterSummary(place.name))}</span>
                </button>
                <button class="reaction-button ${active ? "active" : ""}" type="button" ${canEdit() ? `data-vote="${escapeHtml(place.name)}"` : "data-guest-action"} aria-label="${canEdit() ? (active ? "取消我的最想去" : "標記我最想去") : "訪客無法投票"}">
                  <span aria-hidden="true">${active ? "★" : "☆"}</span>
                  <b>${voters.length}</b>
                </button>
              </article>
            </div>`;
        })
        .join("");
      const representative = visiblePlaces.find((place) => travelAreaGroupKey(place) === regionKey);
      const areaLabel = travelAreaDisplayName(representative);
      const retryAction = canEdit() && visiblePlaces.some((place) => travelAreaGroupKey(place) === regionKey && !isTravelAreaResolutionCurrent(place))
        ? `<button class="travel-area-retry" type="button" data-retry-travel-area="${escapeHtml(regionKey)}">重新辨識</button>`
        : "";
      return `
        <section class="place-group">
          <div class="group-title-row"><h2 class="group-title">⌖ ${escapeHtml(areaLabel)}</h2>${retryAction}</div>
          <div class="place-list">${rows}</div>
        </section>`;
    })
    .join("");

  return `
    <section class="screen">
      <header class="title-row">
        <div><h1>收藏地點</h1><p class="meta">${visiblePlaces.length} 個${state.placeKind === "all" ? "地點" : kindLabel(state.placeKind)}</p></div>
        ${canEdit() ? undoButtonMarkup() : `<span class="readonly-badge">訪客唯讀</span>`}
      </header>
      ${placesSegment("list")}
      ${placeKindTabs()}
      ${groups || `<div class="empty-state"><div><b>還沒有收藏地點</b><span>新增第一個想一起討論的景點。</span></div></div>`}
      ${canEdit() ? `<div class="list-footer"><button class="primary-button" type="button" data-add-place>＋　新增地點</button></div>` : ""}
    </section>`;
}

function kindLabel(kind) {
  return { attraction: "景點", restaurant: "餐廳", lodging: "住宿", shopping: "購物" }[kind] || "地點";
}

function inferPlaceKind(category = "") {
  const value = String(category);
  if (/住宿|飯店|酒店|旅館|Hotel|Hostel|Inn/i.test(value)) return "lodging";
  if (/餐廳|料理|燒肉|牛排|咖啡|酒吧|Restaurant|Cafe|Bar/i.test(value)) return "restaurant";
  if (/購物|百貨|商場|服飾|衣料|鞋|靴|選物|精品|藥妝|商店|店鋪|market|mall|shop|shopping|store|boutique|clothing|shoe/i.test(value)) return "shopping";
  return "attraction";
}

function normalizedPlaceKind(place = {}) {
  const inferred = inferPlaceKind(place.category);
  if (["restaurant", "lodging", "shopping"].includes(place.kind)) return place.kind;
  return inferred;
}

function isWithinJapanCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return [
    [24, 30.9, 122.8, 131.5],
    [30.8, 34.2, 129.2, 132.2],
    [32.5, 35.9, 131.5, 136.9],
    [34, 38.2, 135, 141.7],
    [37, 41.7, 139, 142.3],
    [41.2, 45.8, 139.3, 146],
    [20, 28.6, 136, 154],
  ].some(([minLat, maxLat, minLng, maxLng]) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);
}

function japaneseDestination(value) {
  return /日本|Japan|東京|大阪|京都|北海道|沖繩|沖縄|福岡|名古屋|神戶|神戸|奈良|橫濱|横浜|札幌|仙台|廣島|広島|金澤|金沢|長野|富士|箱根|九州|四國|四国/i.test(String(value || ""));
}

function isJapaneseRestaurant(place = {}, destination = "") {
  if (normalizedPlaceKind(place) !== "restaurant") return false;
  const locationText = `${place.formattedAddress || ""} ${place.country || ""}`;
  if (/日本|Japan|〒\s*\d{3}[-‐‑‒–—−ー－]\d{4}/i.test(locationText)) return true;
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const hasCoordinates = Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && (Math.abs(latitude) > 0.000001 || Math.abs(longitude) > 0.000001);
  if (hasCoordinates) return isWithinJapanCoordinates(latitude, longitude);
  return japaneseDestination(destination);
}

function safeTabelogUrl(value) {
  try {
    const url = new URL(String(value || ""));
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "tabelog.com" || host.endsWith(".tabelog.com")) ? url.toString() : "";
  } catch {
    return "";
  }
}

function tabelogRestaurantUrl(place = {}, destination = "") {
  if (!isJapaneseRestaurant(place, destination)) return "";
  const terms = [...new Set([place.fullName || place.name, place.areaOriginal || place.area]
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
  if (!terms.length) return "";
  const params = new URLSearchParams({ vs: "1", sa: "", sk: terms.join(" ") });
  return `https://tabelog.com/rstLst/?${params.toString()}`;
}

function withStoredTabelogLink(place = {}, destination = "") {
  const knownUrl = safeTabelogUrl(knownTabelogRestaurantUrls[place.name]);
  if (knownUrl) return knownUrl === place.tabelogUrl ? place : { ...place, tabelogUrl: knownUrl };
  const storedUrl = safeTabelogUrl(place.tabelogUrl);
  if (storedUrl) return storedUrl === place.tabelogUrl ? place : { ...place, tabelogUrl: storedUrl };
  const tabelogUrl = tabelogRestaurantUrl(place, destination);
  return tabelogUrl ? { ...place, tabelogUrl } : place;
}

function tabelogRestaurantId(value) {
  const url = safeTabelogUrl(value);
  return url.match(/\/(\d{8})(?:\/|$)/)?.[1] || "";
}

function tabelogMultilingualWebUrl(value) {
  const safeUrl = safeTabelogUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  if (!/^\/(?:tw)(?:\/|$)/i.test(url.pathname)) url.pathname = `/tw${url.pathname}`;
  return url.toString();
}

function tabelogAppLink(value) {
  const webUrl = tabelogMultilingualWebUrl(value);
  if (!webUrl) return "";
  const restaurantId = tabelogRestaurantId(webUrl);
  const deepLink = restaurantId
    ? `tabelog-tourists://rstdtl/${restaurantId}/top/`
    : "tabelog-tourists://rstlst/";
  const params = new URLSearchParams({
    af_dp: deepLink,
    c: restaurantId ? "rstdtl_top_fv_appbtn_tw" : "header_appbtn_tw",
    deep_link_value: deepLink,
    pid: "tabelog_tourists",
    af_ios_url: webUrl,
    af_android_url: webUrl,
    af_web_dp: webUrl,
  });
  return `https://tabelog-tourists.onelink.me/3eEh?${params.toString()}`;
}

function placeKindTabs() {
  return `
    <div class="place-kind-tabs" aria-label="地點分類">
      ${[["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"], ["shopping", "購物"]].map(([value, label]) => `<button type="button" class="${state.placeKind === value ? "active" : ""}" data-place-kind="${value}">${label}</button>`).join("")}
    </div>`;
}

function placesSegment(active) {
  return `
    <div class="segment" aria-label="地點顯示方式">
      <button type="button" class="${active === "list" ? "active" : ""}" data-places-mode="list">清單</button>
      <button type="button" class="${active === "map" ? "active" : ""}" data-places-mode="map">地圖</button>
    </div>`;
}

function projectPlaces(places) {
  const located = places.filter(
    (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
  );
  if (!located.length) return [];

  const latitudes = located.map((place) => place.latitude);
  const longitudes = located.map((place) => place.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 0.01);
  const longitudeRange = Math.max(maxLongitude - minLongitude, 0.01);

  return located.map((place) => ({
    ...place,
    x: 12 + ((place.longitude - minLongitude) / longitudeRange) * 76,
    y: 12 + ((maxLatitude - place.latitude) / latitudeRange) * 68,
  }));
}

function placeMapStatus(place) {
  if (place.kind === "lodging") return "lodging";
  if (placeAssignments(place.name).length) return "scheduled";
  if (placeVoters(place.name).length >= 2) return "favorite";
  return "candidate";
}

function matchesMapFilters(place) {
  if (state.placeKind !== "all" && place.kind !== state.placeKind) return false;
  if (state.mapCategory !== "all" && place.category !== state.mapCategory) return false;
  const voters = placeVoters(place.name);
  if (state.mapPreference === "group" && voters.length < 2) return false;
  if (state.mapPreference === "mine" && !voters.includes(currentMemberId())) return false;
  if (state.mapPreference === "none" && voters.length > 0) return false;
  return true;
}

function spreadOverlappingPins(places) {
  return places.map((place) => {
    const peers = places.filter(
      (candidate) => Math.abs(candidate.x - place.x) < 8 && Math.abs(candidate.y - place.y) < 8,
    );
    if (peers.length < 2) return { ...place, displayX: place.x, displayY: place.y };
    const peerIndex = peers.findIndex((candidate) => candidate.name === place.name);
    const offsetIndex = peerIndex - (peers.length - 1) / 2;
    return {
      ...place,
      displayX: Math.max(8, Math.min(92, place.x + offsetIndex * 7)),
      displayY: Math.max(9, Math.min(84, place.y + offsetIndex * 4)),
    };
  });
}

function flightAirportInfos(flight) {
  if (!flight) return [];
  return [
    { role: "departure", code: String(flight.departureCode || "").trim().toUpperCase(), city: String(flight.departureCity || "").trim() },
    { role: "arrival", code: String(flight.arrivalCode || "").trim().toUpperCase(), city: String(flight.arrivalCity || "").trim() },
  ]
    .filter((airport) => airport.code || airport.city)
    .map((airport) => ({ ...airport, coordinates: airportCoordinateCache[airport.code] }));
}

function airportMapNodes(item) {
  const flight = state.flights.find((candidate) => candidate.id === item.flightId);
  return flightAirportInfos(flight).filter((airport) => airport.coordinates).map((airport) => {
    const label = airport.city
      ? /機場|airport/i.test(airport.city) ? airport.city : `${airport.city}機場`
      : `${airport.code} 機場`;
    return {
      name: `${label}${airport.code ? `（${airport.code}）` : ""}`,
      fullName: label,
      category: "機場",
      kind: "airport",
      mark: "✈",
      airportCode: airport.code,
      airportRole: airport.role,
      flightId: item.flightId,
      itineraryItemId: itineraryItemKey(item),
      isAirport: true,
      latitude: airport.coordinates.latitude,
      longitude: airport.coordinates.longitude,
      sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${airport.city} ${airport.code} airport`)}`,
    };
  });
}

function filteredMapPlaces() {
  ensureItineraryItemIds();
  const allProjectedPlaces = projectPlaces(state.places);
  if (state.mapView !== "day") return allProjectedPlaces.filter(matchesMapFilters);
  const placesByName = new Map(allProjectedPlaces.map((place) => [place.name, place]));
  const dates = state.mapDate === "all" ? dateMeta.map(([date]) => date) : [state.mapDate];
  return dates.flatMap((date, dayIndex) =>
    (state.itinerary[date] || [])
      .flatMap((item) => item.type === "flight"
        ? airportMapNodes(item).map((place) => ({ item, place }))
        : [{ item, place: placesByName.get(item.name) }])
      .filter(({ place }) => place && (place.isAirport || matchesMapFilters(place)))
      .map(({ item, place }, index) => ({
        ...place,
        itineraryItemId: itineraryItemKey(item),
        dayOrder: index + 1,
        routeDate: date,
        routeColor: routeColorForDate(date, dayIndex),
      }))
  );
}

const dayRouteColors = ["#c8452d", "#3f7193", "#7b5a91", "#4f835f", "#bf7b2b", "#9b4d66", "#567f83"];

function routeColorForDate(date, fallbackIndex = 0) {
  const index = dateMeta.findIndex(([candidate]) => candidate === date);
  return dayRouteColors[(index >= 0 ? index : fallbackIndex) % dayRouteColors.length];
}

function mapRouteGroups(places) {
  const groups = new Map();
  places.forEach((place) => {
    const key = place.routeDate || state.mapDate;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(place);
  });
  return [...groups.entries()].map(([date, routePlaces]) => ({
    date,
    color: routePlaces[0]?.routeColor || routeColorForDate(date),
    places: routePlaces,
  }));
}

function mapRouteSegments(places) {
  return mapRouteGroups(places).flatMap((group) =>
    group.places.slice(0, -1).map((place, index) => {
      const nextPlace = group.places[index + 1];
      const isFlight =
        Boolean(place.isAirport && nextPlace.isAirport) &&
        place.flightId === nextPlace.flightId &&
        place.airportRole === "departure" &&
        nextPlace.airportRole === "arrival";
      return {
        color: group.color,
        places: [place, nextPlace],
        isFlight,
        transport: isFlight ? null : transportForPair(group.date, place.itineraryItemId, nextPlace.itineraryItemId),
      };
    }),
  );
}

function mapSegmentStyle(segment) {
  if (segment.isFlight) return { color: "#c8452d", dash: "10 9", opacity: 1 };
  if (segment.transport) {
    const mode = transportModeMeta(segment.transport.mode);
    return { color: mode.color, dash: mode.dash, opacity: 0.9 };
  }
  return { color: segment.color, dash: "", opacity: 0.68 };
}

function mapSegmentIconMarkup(segment) {
  if (!segment.transport) return "";
  const mode = transportModeMeta(segment.transport.mode);
  const label = segment.transport.line || segment.transport.serviceNumber || mode.label;
  return `<button class="transport-map-icon" type="button" data-open-transport-route="${escapeHtml(segment.transport.id)}" title="${escapeHtml(label)}">${mode.icon}</button>`;
}

function googleSegmentIcons(segment, style) {
  if (!style.dash) return undefined;
  const isDot = segment.transport?.mode === "walk";
  return [{
    icon: {
      path: isDot ? google.maps.SymbolPath.CIRCLE : "M 0,-1 0,1",
      fillColor: style.color,
      fillOpacity: isDot ? 1 : 0,
      strokeColor: style.color,
      strokeOpacity: 1,
      strokeWeight: isDot ? 1 : 3,
      scale: isDot ? 2 : 3,
    },
    offset: "0",
    repeat: isDot ? "12px" : "16px",
  }];
}

function offsetOverlappingMapPins(places) {
  if (state.mapView === "day") return places.map((place) => ({ ...place, pinOffsetX: 0, pinOffsetY: 0 }));
  return places.map((place) => {
    const peers = places.filter((candidate) =>
      Math.abs((candidate.x ?? 0) - (place.x ?? 0)) < 7 &&
      Math.abs((candidate.y ?? 0) - (place.y ?? 0)) < 7,
    );
    if (peers.length < 2) return { ...place, pinOffsetX: 0, pinOffsetY: 0 };
    const peerIndex = peers.findIndex((candidate) =>
      candidate.name === place.name && candidate.routeDate === place.routeDate,
    );
    const offsetIndex = peerIndex - (peers.length - 1) / 2;
    return {
      ...place,
      pinOffsetX: offsetIndex * 29,
      pinOffsetY: Math.abs(offsetIndex) % 2 ? -7 : 0,
    };
  });
}

function mapScreen() {
  const projectedPlaces = filteredMapPlaces();
  const kindPlaces = state.places.filter((place) => state.placeKind === "all" || place.kind === state.placeKind);
  const unlocatedCount = kindPlaces.length - projectPlaces(kindPlaces).length;
  const kindDefinitions = [["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"], ["shopping", "購物"]];
  const kindOptions = kindDefinitions
    .map(([value, label]) => `<option value="${value}" ${state.placeKind === value ? "selected" : ""}>${label}</option>`)
    .join("");
  const dateOptions = state.mapView === "planning"
    ? `<option>規劃地圖不套用日期</option>`
    : [
        `<option value="all" ${state.mapDate === "all" ? "selected" : ""}>所有日期</option>`,
        ...dateMeta.map(
          ([date, weekday]) => `<option value="${date}" ${state.mapDate === date ? "selected" : ""}>${date} ${weekday}</option>`,
        ),
      ].join("");
  const dayLegend = state.mapDate === "all"
    ? mapRouteGroups(projectedPlaces).map(({ date, color }) => `<span><i style="background:${color}"></i>${escapeHtml(date)}</span>`).join("") || `<span>尚無已排路線</span>`
    : `<span class="day-route-legend"><i style="background:${routeColorForDate(state.mapDate)}"></i>數字為時間順序，連線表示下一站</span>`;
  const flightLegend = state.mapView === "day" && projectedPlaces.some((place) => place.isAirport)
    ? `<span class="flight-route-legend"><i></i>紅色虛線為航班</span>`
    : "";
  const mapTitle = state.mapView === "planning"
    ? "規劃地圖"
    : state.mapDate === "all" ? "所有日期路線" : `${state.mapDate} 當日地圖`;
  const mapPurposeTabs = `
    <div class="map-purpose-tabs" aria-label="地圖用途">
      <button class="${state.mapView === "planning" ? "active" : ""}" type="button" data-map-view="planning"><strong>規劃地圖</strong><span>全部候選</span></button>
      <button class="${state.mapView === "day" ? "active" : ""}" type="button" data-map-view="day"><strong>當日地圖</strong><span>拜訪順序</span></button>
    </div>`;
  const mapFilters = `
    <div class="map-filters" aria-label="地圖篩選">
      <label class="${state.mapView === "planning" ? "map-date-disabled" : ""}"><span>日期</span><select data-map-date ${state.mapView === "planning" ? "disabled" : ""}>${dateOptions}</select></label>
      <label><span>類型</span><select data-map-kind>${kindOptions}</select></label>
      <label><span>想去程度</span><select data-map-preference>
        <option value="all" ${state.mapPreference === "all" ? "selected" : ""}>全部</option>
        <option value="group" ${state.mapPreference === "group" ? "selected" : ""}>2 人以上</option>
        <option value="mine" ${state.mapPreference === "mine" ? "selected" : ""}>我已標記</option>
        <option value="none" ${state.mapPreference === "none" ? "selected" : ""}>尚未推薦</option>
      </select></label>
    </div>`;
  const mapLegend = `
    <div class="map-legend" aria-label="圖釘狀態">
      ${state.mapView === "day" ? `${dayLegend}${flightLegend}` : `<span><i class="candidate"></i>候選</span><span><i class="favorite"></i>2+ 推薦</span><span><i class="scheduled"></i>已排行程</span><span><i class="lodging"></i>住宿</span>`}
      ${state.mapView === "planning" ? `
        <button class="map-live-location-toggle ${liveLocationEnabled ? "active" : ""} ${liveLocationEnabled && !liveLocationPosition ? "locating" : ""}" type="button" role="switch" aria-checked="${liveLocationEnabled}" data-toggle-live-location>
          <span class="map-live-location-icon" aria-hidden="true">⌖</span>
          <b data-live-location-label>${liveLocationLabel()}</b>
        </button>` : ""}
    </div>`;
  const fullscreenIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/></svg>`;
  const filterIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M7 12h10M10 18h4"/></svg>`;
  const fullscreenButton = `<button class="map-fullscreen-button" type="button" data-toggle-map-fullscreen aria-pressed="${mapFullscreen}" aria-label="${mapFullscreen ? "離開全螢幕地圖" : "開啟全螢幕地圖"}">${fullscreenIcon}<span>${mapFullscreen ? "離開全圖" : "全螢幕"}</span></button>`;
  const sidebarKindButtons = kindDefinitions.map(([value, label]) => {
    const count = value === "all" ? state.places.length : state.places.filter((place) => place.kind === value).length;
    return `<button type="button" class="${state.placeKind === value ? "active" : ""}" data-place-kind="${value}"><span>${label}</span><b>${count}</b></button>`;
  }).join("");
  const sidebarPlaces = projectedPlaces.length
    ? projectedPlaces.map((place) => `
        <button class="map-sidebar-place ${state.selectedMapPlace === place.name ? "active" : ""}" type="button" data-focus-map-place="${escapeHtml(place.name)}">
          <i style="--place-swatch:${escapeHtml(place.swatch || mapPinColor(placeMapStatus(place)))}">${escapeHtml(place.mark || place.name.slice(0, 1))}</i>
          <span><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(travelAreaChineseName(place))} · ${escapeHtml(kindLabel(place.kind))}</small></span>
        </button>`).join("")
    : `<div class="map-sidebar-empty">目前沒有符合篩選的地點</div>`;
  const selectedPreviewPlace = projectedPlaces.find((place) => place.name === state.selectedMapPlace);
  const mapCanvas = `
    <div class="map-canvas" data-map-host>
      <div id="interactive-map" class="google-map" aria-label="互動地圖，可用單指拖曳與雙指縮放"><div class="map-loading">載入互動地圖…</div></div>
      <div class="map-gesture-note">單指拖曳 · 雙指縮放</div>
      ${unlocatedCount ? `<div class="map-coordinate-note">${unlocatedCount} 個地點待取得座標</div>` : ""}
      ${!projectedPlaces.length ? `<div class="map-empty"><strong>沒有符合條件的地點</strong><span>${state.mapView === "day" ? "選取的日期尚未安排，或目前篩選太嚴格。" : "調整類型或想去程度後再看看。"}</span></div>` : ""}
      <div class="map-place-preview-dock" data-map-preview-dock ${selectedPreviewPlace ? "" : "hidden"}>${selectedPreviewPlace ? mapPlacePreviewMarkup(selectedPreviewPlace) : ""}</div>
    </div>`;

  if (mapFullscreen) {
    return `
      <section class="screen map-screen is-fullscreen ${mapSidebarOpen ? "sidebar-open" : "sidebar-closed"}">
        <aside class="map-fullscreen-sidebar" aria-label="地圖功能與地點篩選">
          <div class="map-sidebar-heading"><div><p class="section-kicker">全圖瀏覽</p><h2>${mapTitle}</h2><span>顯示 ${projectedPlaces.length} 個地點</span></div><button class="icon-button" type="button" data-toggle-map-sidebar aria-label="收合篩選列">×</button></div>
          ${mapPurposeTabs}
          <div class="map-sidebar-section"><h3>地點類別</h3><div class="map-sidebar-kind-list">${sidebarKindButtons}</div></div>
          ${mapFilters}
          ${mapLegend}
          <div class="map-sidebar-section map-sidebar-results"><div class="map-sidebar-result-title"><h3>地點</h3><span>${projectedPlaces.length} 筆</span></div>${sidebarPlaces}</div>
        </aside>
        <div class="map-fullscreen-stage">
          <div class="map-fullscreen-floating-actions">
            <button class="map-floating-button map-sidebar-toggle" type="button" data-toggle-map-sidebar aria-label="${mapSidebarOpen ? "收合地圖篩選" : "開啟地圖篩選"}">${filterIcon}<span>篩選</span></button>
            ${fullscreenButton}
          </div>
          ${mapCanvas}
        </div>
      </section>`;
  }

  return `
    <section class="screen map-screen">
      <header class="title-row map-toolbar">
        <div><h1>${mapTitle}</h1><p class="meta">顯示 ${projectedPlaces.length} 個地點</p></div>
        <div class="map-toolbar-actions">${undoButtonMarkup()}${fullscreenButton}</div>
      </header>
      <div style="margin-top:14px">${placesSegment("map")}</div>
      ${mapPurposeTabs}
      ${mapFilters}
      ${mapLegend}
      ${mapCanvas}
    </section>`;
}

function mapPinColor(status) {
  return {
    favorite: "#78558b",
    scheduled: "#3f7193",
    lodging: "#50805e",
    candidate: "#777975",
  }[status] || "#777975";
}

function liveLocationLabel() {
  if (!liveLocationEnabled) return "顯示位置";
  if (liveLocationError && !liveLocationPosition) return "定位失敗";
  if (!liveLocationPosition) return "定位中…";
  const accuracy = Math.max(1, Math.round(liveLocationPosition.accuracy || 0));
  return accuracy >= 1000 ? `位置 ±${(accuracy / 1000).toFixed(1)}km` : `位置 ±${accuracy}m`;
}

function updateLiveLocationControl() {
  const control = document.querySelector("[data-toggle-live-location]");
  if (!control) return;
  control.classList.toggle("active", liveLocationEnabled);
  control.classList.toggle("locating", liveLocationEnabled && !liveLocationPosition && !liveLocationError);
  control.classList.toggle("location-error", Boolean(liveLocationError));
  control.setAttribute("aria-checked", String(liveLocationEnabled));
  control.setAttribute("title", liveLocationEnabled ? "停止顯示即時位置" : "在規劃地圖顯示我的即時位置");
  const label = control.querySelector("[data-live-location-label]");
  if (label) label.textContent = liveLocationLabel();
}

function clearLiveLocationLayers() {
  activeGoogleLocationMarker?.setMap(null);
  activeGoogleAccuracyCircle?.setMap(null);
  activeGoogleLocationMarker = null;
  activeGoogleAccuracyCircle = null;
  activeLeafletLocationMarker?.remove?.();
  activeLeafletAccuracyCircle?.remove?.();
  activeLeafletLocationMarker = null;
  activeLeafletAccuracyCircle = null;
}

function syncLiveLocationLayers({ center = false } = {}) {
  if (!liveLocationEnabled || !liveLocationPosition) return;
  const { latitude, longitude, accuracy } = liveLocationPosition;
  const googlePosition = { lat: latitude, lng: longitude };
  if (activeGoogleMap && window.google?.maps) {
    if (!activeGoogleAccuracyCircle) {
      activeGoogleAccuracyCircle = new google.maps.Circle({
        map: activeGoogleMap,
        center: googlePosition,
        radius: accuracy,
        clickable: false,
        fillColor: "#1473e6",
        fillOpacity: 0.12,
        strokeColor: "#1473e6",
        strokeOpacity: 0.38,
        strokeWeight: 1,
        zIndex: 900,
      });
    } else {
      activeGoogleAccuracyCircle.setCenter(googlePosition);
      activeGoogleAccuracyCircle.setRadius(accuracy);
    }
    if (!activeGoogleLocationMarker) {
      activeGoogleLocationMarker = new google.maps.Marker({
        map: activeGoogleMap,
        position: googlePosition,
        title: "我的即時位置",
        zIndex: 1000,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#1473e6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      activeGoogleLocationMarker.setPosition(googlePosition);
    }
    if (center) {
      activeGoogleMap.panTo(googlePosition);
      if ((activeGoogleMap.getZoom() || 0) < 15) activeGoogleMap.setZoom(15);
      liveLocationHasCentered = true;
    }
    return;
  }
  if (activeLeafletMap && window.L) {
    const leafletPosition = [latitude, longitude];
    if (!activeLeafletAccuracyCircle) {
      activeLeafletAccuracyCircle = L.circle(leafletPosition, {
        radius: accuracy,
        color: "#1473e6",
        weight: 1,
        opacity: 0.42,
        fillColor: "#1473e6",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(activeLeafletMap);
    } else {
      activeLeafletAccuracyCircle.setLatLng(leafletPosition).setRadius(accuracy);
    }
    if (!activeLeafletLocationMarker) {
      activeLeafletLocationMarker = L.circleMarker(leafletPosition, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#1473e6",
        fillOpacity: 1,
        interactive: false,
      }).addTo(activeLeafletMap);
    } else {
      activeLeafletLocationMarker.setLatLng(leafletPosition);
    }
    if (center) {
      activeLeafletMap.setView(leafletPosition, Math.max(activeLeafletMap.getZoom() || 0, 15));
      liveLocationHasCentered = true;
    }
  }
}

function stopLiveLocation({ notify = false } = {}) {
  if (liveLocationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(liveLocationWatchId);
  }
  liveLocationWatchId = null;
  liveLocationEnabled = false;
  liveLocationPosition = null;
  liveLocationError = "";
  liveLocationHasCentered = false;
  clearLiveLocationLayers();
  updateLiveLocationControl();
  if (notify) showToast("已停止顯示即時位置");
}

function handleLiveLocationError(error) {
  const message = error?.code === 1
    ? "請允許瀏覽器使用定位後再試一次"
    : error?.code === 2
      ? "目前無法取得位置，請確認定位服務已開啟"
      : "定位逾時，仍會繼續嘗試更新";
  const shouldNotify = liveLocationError !== message;
  liveLocationError = message;
  if (error?.code === 1) {
    stopLiveLocation();
  } else {
    updateLiveLocationControl();
  }
  if (shouldNotify) showToast(message);
}

function startLiveLocation() {
  if (state.mapView !== "planning") return;
  if (!window.isSecureContext || !navigator.geolocation) {
    return showToast("此瀏覽器無法使用即時定位");
  }
  liveLocationEnabled = true;
  liveLocationPosition = null;
  liveLocationError = "";
  liveLocationHasCentered = false;
  updateLiveLocationControl();
  liveLocationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      if (!liveLocationEnabled) return;
      liveLocationPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.max(1, position.coords.accuracy || 1),
      };
      liveLocationError = "";
      syncLiveLocationLayers({ center: !liveLocationHasCentered });
      updateLiveLocationControl();
    },
    handleLiveLocationError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
  );
}

function markerHtml(place) {
  const isDayRoute = state.mapView === "day";
  const color = isDayRoute ? place.routeColor || mapPinColor("scheduled") : mapPinColor(placeMapStatus(place));
  const routeLabel = isDayRoute ? `${escapeHtml(place.routeDate || "當日")}第 ${place.dayOrder} 站，` : "";
  const badge = place.isAirport ? escapeHtml(place.airportCode || "機場") : `★ ${placeVoters(place.name).length}`;
  const recommendationLabel = place.isAirport ? "" : `，${placeVoters(place.name).length} 人推薦`;
  return `<button class="google-place-pin ${isDayRoute ? "day-route-pin" : ""} ${place.isAirport ? "airport-pin" : ""} ${state.selectedMapPlace === place.name ? "selected" : ""}" type="button" data-map-place-marker="${escapeHtml(place.name)}" style="--pin-color:${color}" aria-label="${routeLabel}${escapeHtml(place.name)}${recommendationLabel}"><span>${escapeHtml(place.mark)}</span><b>${badge}</b>${isDayRoute ? `<em>${place.dayOrder}</em>` : ""}</button>`;
}

function mapPlacePreviewMarkup(place) {
  if (!place || place.isAirport) return "";
  const photo = place.customPhotoDataUrl
    ? `<img src="${escapeHtml(place.customPhotoDataUrl)}" alt="${escapeHtml(place.name)}自行加入的照片" loading="eager" />`
    : place.photos?.[0]?.name
      ? `<img src="/api/place-photo?name=${encodeURIComponent(place.photos[0].name)}" alt="${escapeHtml(place.name)}照片" loading="eager" />`
      : `<span style="--preview-swatch:${escapeHtml(place.swatch || mapPinColor(placeMapStatus(place)))}">${escapeHtml(place.mark || place.name.slice(0, 1))}</span>`;
  const voters = placeVoters(place.name).length;
  const rating = Number(place.rating) > 0 ? `★ ${Number(place.rating).toFixed(1)}` : voters ? `★ ${voters} 人推薦` : "尚未有人推薦";
  return `
    <article class="map-place-preview-card" aria-label="${escapeHtml(place.name)}地點預覽">
      <button class="map-place-preview-main" type="button" data-open-map-place-detail="${escapeHtml(place.name)}">
        <span class="map-place-preview-photo">${photo}</span>
        <span class="map-place-preview-copy"><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(rating)} · ${escapeHtml(kindLabel(place.kind))}</small><em>${escapeHtml(travelAreaChineseName(place))}</em></span>
        <b aria-hidden="true">›</b>
      </button>
      <button class="map-place-preview-close" type="button" data-close-map-preview aria-label="關閉地點預覽">×</button>
    </article>`;
}

function focusActiveMapOnPlace(place) {
  if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return;
  if (activeGoogleMap && window.google?.maps) {
    activeGoogleMap.panTo({ lat: place.latitude, lng: place.longitude });
    if ((activeGoogleMap.getZoom() || 0) < 15) activeGoogleMap.setZoom(15);
  } else if (activeLeafletMap) {
    activeLeafletMap.setView([place.latitude, place.longitude], Math.max(activeLeafletMap.getZoom() || 0, 15), { animate: true });
  }
}

function updateMapPlacePreview(place) {
  state.selectedMapPlace = place?.name || "";
  const dock = document.querySelector("[data-map-preview-dock]");
  if (dock) {
    dock.hidden = !place || place.isAirport;
    dock.innerHTML = place && !place.isAirport ? mapPlacePreviewMarkup(place) : "";
  }
  document.querySelectorAll("[data-map-place-marker]").forEach((marker) => marker.classList.toggle("selected", marker.dataset.mapPlaceMarker === state.selectedMapPlace));
  document.querySelectorAll("[data-focus-map-place]").forEach((button) => button.classList.toggle("active", button.dataset.focusMapPlace === state.selectedMapPlace));
  if (place) focusActiveMapOnPlace(place);
}

function selectMapPlace(place) {
  updateMapPlacePreview(place);
  if (!place || place.isAirport || place.photosLoaded) return;
  ensurePlaceDetails(place).then(() => {
    if (state.selectedMapPlace === place.name) updateMapPlacePreview(place);
  });
}

function openMapNode(place) {
  if (place.isAirport) return openGoogleMaps(place.sourceUrl);
  return selectMapPlace(place);
}

async function getGoogleMapsBrowserKey() {
  try {
    const response = await fetch("/api/maps-browser-config");
    if (!response.ok) return "";
    const payload = await response.json();
    return String(payload.key || "");
  } catch {
    return "";
  }
}

function loadGoogleMapsScript(key) {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsLoader) return googleMapsLoader;
  googleMapsLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  return googleMapsLoader;
}

function renderGoogleInteractiveMap(host, places) {
  clearLiveLocationLayers();
  activeLeafletMap?.remove();
  activeLeafletMap = null;
  host.innerHTML = "";
  const center = places.length
    ? {
        lat: places.reduce((sum, place) => sum + place.latitude, 0) / places.length,
        lng: places.reduce((sum, place) => sum + place.longitude, 0) / places.length,
      }
    : { lat: 35.6762, lng: 139.6503 };
  const map = new google.maps.Map(host, {
    center,
    zoom: places.length === 1 ? 14 : 11,
    gestureHandling: "greedy",
    mapTypeId: "roadmap",
    mapTypeControl: true,
    fullscreenControl: false,
    streetViewControl: false,
  });
  activeGoogleMap = map;
  map.addListener("click", () => updateMapPlacePreview(null));
  map.addListener("dragstart", () => { mapInteractionUntil = Date.now() + 5000; });
  map.addListener("zoom_changed", () => { mapInteractionUntil = Date.now() + 3000; });
  const bounds = new google.maps.LatLngBounds();
  if (state.mapView === "day") {
    mapRouteSegments(places).forEach((segment) => {
      const style = mapSegmentStyle(segment);
      new google.maps.Polyline({
        map,
        path: segment.places.map((place) => ({ lat: place.latitude, lng: place.longitude })),
        geodesic: true,
        strokeColor: style.color,
        strokeOpacity: style.dash ? 0 : style.opacity,
        strokeWeight: 4,
        icons: googleSegmentIcons(segment, style),
      });
      if (segment.transport) {
        const [from, to] = segment.places;
        const marker = new google.maps.Marker({
          map,
          position: { lat: (from.latitude + to.latitude) / 2, lng: (from.longitude + to.longitude) / 2 },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: "#fffaf2", fillOpacity: 1, strokeColor: style.color, strokeWeight: 2 },
          label: { text: transportModeMeta(segment.transport.mode).icon, fontSize: "14px" },
          title: `${transportModeMeta(segment.transport.mode).label} · 開啟 Google Maps 路線`,
        });
        marker.addListener("click", () => {
          const url = transportDirectionsUrl(segment.transport);
          if (url) openGoogleMaps(url);
        });
      }
    });
  }
  class TripPlaceOverlay extends google.maps.OverlayView {
    constructor(place) {
      super();
      this.place = place;
      this.position = new google.maps.LatLng(place.latitude, place.longitude);
    }

    onAdd() {
      this.element = document.createElement("div");
      this.element.className = "google-html-marker";
      this.element.innerHTML = markerHtml(this.place);
      this.element.querySelector("button")?.addEventListener("click", (event) => {
        event.stopPropagation();
        openMapNode(this.place);
      });
      this.getPanes().overlayMouseTarget.appendChild(this.element);
    }

    draw() {
      const point = this.getProjection().fromLatLngToDivPixel(this.position);
      if (!point || !this.element) return;
      this.element.style.left = `${point.x + (this.place.pinOffsetX || 0)}px`;
      this.element.style.top = `${point.y + (this.place.pinOffsetY || 0)}px`;
    }

    onRemove() {
      this.element?.remove();
      this.element = null;
    }
  }

  offsetOverlappingMapPins(places).forEach((place) => {
    const position = { lat: place.latitude, lng: place.longitude };
    bounds.extend(position);
    new TripPlaceOverlay(place).setMap(map);
  });
  if (places.length > 1) map.fitBounds(bounds, 42);
  const selectedPlace = places.find((place) => place.name === state.selectedMapPlace);
  if (selectedPlace) window.setTimeout(() => focusActiveMapOnPlace(selectedPlace), 0);
  syncLiveLocationLayers({ center: liveLocationEnabled });
}

function renderLeafletInteractiveMap(host, places) {
  if (!window.L) throw new Error("LEAFLET_NOT_AVAILABLE");
  clearLiveLocationLayers();
  activeGoogleMap = null;
  activeLeafletMap?.remove();
  host.innerHTML = "";
  activeLeafletMap = L.map(host, {
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: true,
    tap: true,
    zoomControl: true,
  });
  activeLeafletMap.on("movestart zoomstart", () => { mapInteractionUntil = Date.now() + 5000; });
  activeLeafletMap.on("moveend zoomend", () => { mapInteractionUntil = Date.now() + 1800; });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(activeLeafletMap);
  const bounds = [];
  if (state.mapView === "day") {
    mapRouteSegments(places).forEach((segment) => {
      const style = mapSegmentStyle(segment);
      L.polyline(segment.places.map((place) => [place.latitude, place.longitude]), {
        color: style.color,
        opacity: style.opacity,
        weight: 4,
        dashArray: style.dash || undefined,
      }).addTo(activeLeafletMap);
      if (segment.transport) {
        const [from, to] = segment.places;
        const midpoint = [(from.latitude + to.latitude) / 2, (from.longitude + to.longitude) / 2];
        L.marker(midpoint, {
          icon: L.divIcon({ className: "transport-div-icon", html: mapSegmentIconMarkup(segment), iconSize: [34, 34], iconAnchor: [17, 17] }),
          title: `${transportModeMeta(segment.transport.mode).label} · 開啟 Google Maps 路線`,
        }).addTo(activeLeafletMap);
      }
    });
  }
  offsetOverlappingMapPins(places).forEach((place) => {
    const point = [place.latitude, place.longitude];
    bounds.push(point);
    const icon = L.divIcon({
      className: "trip-div-icon",
      html: markerHtml(place),
      iconSize: [54, 36],
      iconAnchor: [27 - (place.pinOffsetX || 0), 36 - (place.pinOffsetY || 0)],
    });
    L.marker(point, { icon, title: place.name, bubblingMouseEvents: false })
      .addTo(activeLeafletMap)
      .on("click", () => openMapNode(place));
  });
  if (bounds.length > 1) activeLeafletMap.fitBounds(bounds, { padding: [42, 42] });
  else activeLeafletMap.setView(bounds[0] || [35.6762, 139.6503], bounds.length ? 14 : 11);
  activeLeafletMap.on("click", () => updateMapPlacePreview(null));
  const selectedPlace = places.find((place) => place.name === state.selectedMapPlace);
  if (selectedPlace) window.setTimeout(() => focusActiveMapOnPlace(selectedPlace), 0);
  syncLiveLocationLayers({ center: liveLocationEnabled });
}

async function ensureMapCoordinates() {
  const missing = state.places.filter((place) =>
    place.sourceUrl && (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)),
  );
  if (!missing.length || mapCoordinatesLoading) return false;
  mapCoordinatesLoading = true;
  let updated = false;
  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ places: missing.map((place) => ({
        sourceUrl: place.sourceUrl,
        hintName: place.name,
        destination: state.destination,
        countryCode: place.countryCode || "",
      })) }),
    });
    if (!response.ok) return false;
    const resolvedPlaces = (await response.json()).places || [];
    missing.forEach((place, index) => {
      const resolved = resolvedPlaces[index];
      if (!resolved || resolved.error || !Number.isFinite(resolved.latitude) || !Number.isFinite(resolved.longitude)) return;
      place.latitude = resolved.latitude;
      place.longitude = resolved.longitude;
      place.area = resolved.area || place.area;
      place.areaOriginal = resolved.areaOriginal || place.areaOriginal || place.area;
      place.areaResolvedByGoogle = resolved.areaResolvedByGoogle === true || place.areaResolvedByGoogle === true;
      applyPlanningRegionResolution(place, resolved);
      updated = true;
    });
    if (updated) persist({ recordUndo: false });
    return updated;
  } catch {
    return false;
  } finally {
    mapCoordinatesLoading = false;
  }
}

function applyPlanningRegionResolution(place, resolved) {
  if (!place || !resolved) return false;
  ensureTravelAreaFields(place);
  if (resolved.countryCode) place.countryCode = resolved.countryCode;
  if (Array.isArray(resolved.addressComponents)) place.addressComponents = resolved.addressComponents;
  if (Array.isArray(resolved.addressComponentsOriginal)) place.addressComponentsOriginal = resolved.addressComponentsOriginal;
  if (resolved.administrativeAreas) place.administrativeAreas = resolved.administrativeAreas;
  if (place.travelAreaSource === "manual" || place.travelAreaManuallySet === true) return true;
  if (resolved.travelAreaResolved !== true || !resolved.travelAreaKey || !resolved.travelAreaZh || !resolved.travelAreaLocal
    || Number(resolved.travelAreaResolutionVersion) < TRAVEL_AREA_RESOLUTION_VERSION) {
    place.travelAreaResolved = false;
    place.travelAreaResolutionStatus = "failed";
    place.travelAreaResolutionError = resolved.travelAreaResolutionError || resolved.error || "TRAVEL_AREA_NOT_RESOLVED";
    return false;
  }
  place.travelAreaKey = resolved.travelAreaKey;
  place.travelAreaZh = resolved.travelAreaZh;
  place.travelAreaLocal = resolved.travelAreaLocal;
  place.travelAreaResolved = true;
  place.travelAreaSource = "automatic";
  place.travelAreaResolver = resolved.travelAreaResolver || "";
  place.travelAreaResolutionVersion = Number(resolved.travelAreaResolutionVersion);
  place.travelAreaResolutionStatus = "resolved";
  delete place.travelAreaResolutionError;
  return true;
}

function planningRegionResolutionKey(place) {
  return `${state.tripId}|${place?.placeId || place?.sourceUrl || place?.formattedAddress || place?.name || ""}`;
}

function hasPlanningRegionResolutionEvidence(place) {
  return Boolean(place && (place.placeId
    || place.formattedAddress
    || (Array.isArray(place.addressComponents) && place.addressComponents.length)
    || (Array.isArray(place.addressComponentsOriginal) && place.addressComponentsOriginal.length)
    || (Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    || (place.sourceUrl && place.name)));
}

function shouldUpgradePlanningRegionResolution(place) {
  return Boolean(place && !isTravelAreaResolutionCurrent(place) && hasPlanningRegionResolutionEvidence(place));
}

function needsPlanningRegionResolution(place) {
  if (!place) return false;
  return Boolean(
    shouldUpgradePlanningRegionResolution(place)
    && !planningRegionResolutionAttempts.has(planningRegionResolutionKey(place)),
  );
}

async function resolveStoredPlacePlanningRegions() {
  if (!state.tripId || planningRegionResolutionBusy) return false;
  const tripId = state.tripId;
  const targets = state.places.filter(needsPlanningRegionResolution).slice(0, 10);
  if (!targets.length) return false;
  const targetKeys = targets.map(planningRegionResolutionKey);
  planningRegionResolutionBusy = true;
  targetKeys.forEach((key) => {
    planningRegionResolutionAttempts.add(key);
    planningRegionResolutionInFlight.add(key);
  });
  render({ preserveScroll: true });
  let updated = false;
  try {
    const response = await fetch("/api/places", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        places: targets.map((place) => ({
          resolveTravelArea: true,
          placeId: place.placeId || "",
          hintName: place.name || "",
          sourceUrl: place.sourceUrl || "",
          formattedAddress: place.formattedAddress || "",
          latitude: place.latitude,
          longitude: place.longitude,
          manualLocation: place.manualLocation === true,
          detailsLocked: place.detailsLocked === true,
          destination: state.destination,
          countryCode: place.countryCode || "",
          addressComponents: place.addressComponents || [],
          addressComponentsOriginal: place.addressComponentsOriginal || [],
        })),
      }),
    });
    if (state.tripId !== tripId) return false;
    if (!response.ok) throw new Error(`TRAVEL_AREA_REQUEST_${response.status}`);
    const resolvedPlaces = (await response.json()).places || [];
    targets.forEach((target, index) => {
      const resolved = resolvedPlaces[index];
      const current = state.places.find((place) => planningRegionResolutionKey(place) === planningRegionResolutionKey(target));
      if (!current) return;
      if (!resolved || resolved.error) {
        applyPlanningRegionResolution(current, resolved || { error: "TRAVEL_AREA_RESPONSE_MISSING" });
        updated = true;
        return;
      }
      if (!applyPlanningRegionResolution(current, resolved)) {
        updated = true;
        return;
      }
      current.area = resolved.area || current.area;
      current.areaOriginal = resolved.areaOriginal || resolved.area;
      current.areaResolvedByGoogle = resolved.areaResolvedByGoogle === true;
      current.formattedAddress = resolved.formattedAddress || current.formattedAddress || "";
      current.placeId = resolved.placeId || current.placeId;
      current.latitude = Number.isFinite(resolved.latitude) ? resolved.latitude : current.latitude;
      current.longitude = Number.isFinite(resolved.longitude) ? resolved.longitude : current.longitude;
      updated = true;
    });
    if (updated) {
      persist({ sync: canEdit(), recordUndo: false });
      render({ preserveScroll: true });
    }
    return updated;
  } catch (error) {
    if (state.tripId === tripId) {
      targets.forEach((target) => {
        const current = state.places.find((place) => planningRegionResolutionKey(place) === planningRegionResolutionKey(target));
        if (current) applyPlanningRegionResolution(current, { error: error.message || "TRAVEL_AREA_REQUEST_FAILED" });
      });
      persist({ sync: canEdit(), recordUndo: false });
    }
    return false;
  } finally {
    planningRegionResolutionBusy = false;
    targetKeys.forEach((key) => planningRegionResolutionInFlight.delete(key));
    if (state.tripId === tripId) render({ preserveScroll: true });
    if (state.tripId === tripId && state.places.some(needsPlanningRegionResolution)) window.setTimeout(resolveStoredPlacePlanningRegions, 0);
  }
}

async function ensureDayAirportCoordinates() {
  if (state.mapView !== "day" || airportCoordinatesLoading) return false;
  const dates = state.mapDate === "all" ? dateMeta.map(([date]) => date) : [state.mapDate];
  const missing = [];
  const seen = new Set();
  dates.forEach((date) => {
    (state.itinerary[date] || []).filter((item) => item.type === "flight").forEach((item) => {
      const flight = state.flights.find((candidate) => candidate.id === item.flightId);
      flightAirportInfos(flight).forEach((airport) => {
        if (!airport.code || airport.coordinates || seen.has(airport.code)) return;
        seen.add(airport.code);
        missing.push(airport);
      });
    });
  });
  if (!missing.length) return false;
  airportCoordinatesLoading = true;
  let updated = false;
  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        places: missing.slice(0, 10).map((airport) => ({
          sourceUrl: "",
          hintName: `${airport.city} ${airport.code} airport`,
          globalSearch: true,
        })),
      }),
    });
    if (!response.ok) return false;
    const resolvedPlaces = (await response.json()).places || [];
    missing.slice(0, 10).forEach((airport, index) => {
      const resolved = resolvedPlaces[index];
      if (!resolved || resolved.error || !Number.isFinite(resolved.latitude) || !Number.isFinite(resolved.longitude)) return;
      airportCoordinateCache[airport.code] = { latitude: resolved.latitude, longitude: resolved.longitude };
      updated = true;
    });
    if (updated) localStorage.setItem("airport-coordinate-cache-v1", JSON.stringify(airportCoordinateCache));
    return updated;
  } catch {
    return false;
  } finally {
    airportCoordinatesLoading = false;
  }
}

async function initializeInteractiveMap() {
  const token = ++mapRenderToken;
  const host = document.querySelector("#interactive-map");
  if (!host) return;
  const coordinatesUpdated = await ensureMapCoordinates();
  const airportsUpdated = await ensureDayAirportCoordinates();
  if (token !== mapRenderToken || !document.body.contains(host)) return;
  if (coordinatesUpdated || airportsUpdated) document.querySelector(".map-coordinate-note")?.remove();
  const places = filteredMapPlaces().filter(
    (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
  );
  const browserKey = await getGoogleMapsBrowserKey();
  if (token !== mapRenderToken || !document.body.contains(host)) return;
  if (browserKey) {
    try {
      await loadGoogleMapsScript(browserKey);
      if (token === mapRenderToken && document.body.contains(host)) {
        renderGoogleInteractiveMap(host, places);
        return;
      }
    } catch {
      // Fall through to the keyless interactive map.
    }
  }
  try {
    renderLeafletInteractiveMap(host, places);
  } catch {
    clearLiveLocationLayers();
    activeGoogleMap = null;
    activeLeafletMap = null;
    const center = places[0] || { latitude: 35.6762, longitude: 139.6503 };
    host.innerHTML = `<iframe title="Google Maps 互動地圖" src="https://www.google.com/maps?q=${center.latitude},${center.longitude}&z=11&output=embed" loading="eager" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    if (liveLocationEnabled) {
      stopLiveLocation();
      showToast("目前的地圖模式不支援即時位置");
    }
  }
}

function transportSecondaryLine(transport) {
  const stations = [transport.departureStation, transport.arrivalStation].filter(Boolean).join(" → ");
  return stations || transport.line || transport.note || "點擊補充車站、路線與時間";
}

function transportBetweenMarkup(date, item, nextItem) {
  if (!nextItem) return "";
  const fromItemId = itineraryItemKey(item);
  const toItemId = itineraryItemKey(nextItem);
  const transport = transportForPair(date, fromItemId, toItemId);
  if (!transport) {
    return canEdit()
      ? `<div class="transport-between"><button class="transport-add-button" type="button" data-add-transport data-transport-date="${escapeHtml(date)}" data-from-item="${escapeHtml(fromItemId)}" data-to-item="${escapeHtml(toItemId)}">＋ 設定交通</button></div>`
      : "";
  }
  const mode = transportModeMeta(transport.mode);
  const duration = Number(transport.durationMinutes) > 0 ? `${Number(transport.durationMinutes)} 分鐘` : "時間待補";
  const routeUrl = transportDirectionsUrl(transport);
  const routeButton = routeUrl
    ? `<button class="transport-route-button" type="button" data-open-transport-route="${escapeHtml(transport.id)}" aria-label="用 Google Maps 查看路線">地圖 ›</button>`
    : "";
  if (transport.journeyType === "scheduled") {
    const schedule = [transport.departureTime, transport.arrivalTime].filter(Boolean).join(" → ") || "班次時間待補";
    const service = [transport.line, transport.serviceNumber].filter(Boolean).join(" · ") || mode.label;
    const ticket = [transport.fare, transport.ticketStatus].filter(Boolean).join(" · ");
    const travelerNames = (transport.travelers || []).map(memberName).join("、");
    const stations = [transport.departureStation, transport.arrivalStation].filter(Boolean).join(" → ");
    return `<div class="transport-between transport-between-scheduled">
      <article class="transport-card scheduled" style="--transport-color:${mode.color}">
        <button class="transport-card-copy" type="button" data-edit-transport="${escapeHtml(transport.id)}">
          <span class="transport-icon">${mode.icon}</span>
          <span><strong>${escapeHtml(service)}</strong>${stations ? `<small>${escapeHtml(stations)}</small>` : ""}<small>${escapeHtml(schedule)} · ${escapeHtml(duration)}</small>${ticket ? `<small>${escapeHtml(ticket)}</small>` : ""}${travelerNames ? `<small>搭乘：${escapeHtml(travelerNames)}</small>` : ""}</span>
        </button>
        ${routeButton}
      </article>
    </div>`;
  }
  return `<div class="transport-between">
    <article class="transport-card compact" style="--transport-color:${mode.color}">
      <button class="transport-card-copy" type="button" data-edit-transport="${escapeHtml(transport.id)}">
        <span class="transport-icon">${mode.icon}</span>
        <span><strong>${escapeHtml(mode.label)} · ${escapeHtml(duration)}</strong></span>
      </button>
      ${routeButton}
    </article>
  </div>`;
}

function transportReviewMarkup(date) {
  const reviewItems = (state.transports || []).filter((transport) => transport.date === date && transport.needsReview);
  if (!reviewItems.length) return "";
  return `<section class="transport-review-card">
    <div><strong>⚠ 交通待確認</strong><span>行程順序已改變，請重新指定相鄰的兩站。</span></div>
    ${reviewItems.map((transport) => `<button type="button" data-edit-transport="${escapeHtml(transport.id)}"><span>${transportModeMeta(transport.mode).icon}</span><b>${escapeHtml(transport.fromLabel || "原起點")} → ${escapeHtml(transport.toLabel || "原終點")}</b><em>重新連接 ›</em></button>`).join("")}
  </section>`;
}

function shoppingCategoryName(categoryId) {
  return state.shopping.categories.find((category) => category.id === categoryId)?.name || "日常";
}

function shoppingTagName(tagId) {
  return state.shopping.tags.find((tag) => tag.id === tagId)?.name || "";
}

function shoppingPhoto(photoId) {
  return photoId ? state.shopping.photos?.[photoId]?.dataUrl || "" : "";
}

function shoppingPhotoKind(item) {
  if (!item?.photoId) return "";
  if (item.photoKind === "manual" || item.photoKind === "recognition") return item.photoKind;
  return item.aiAnnotation ? "recognition" : "manual";
}

function shoppingAiProductImages(item) {
  return (Array.isArray(item?.aiAnnotation?.productImages) ? item.aiAnnotation.productImages : [])
    .filter((image) => /^data:image\/(?:jpeg|png|webp);base64,/i.test(String(image?.url || "")))
    .filter((image, index, list) => list.findIndex((candidate) => candidate.url === image.url) === index)
    .slice(0, 1);
}

function shoppingPreferredPhoto(item) {
  const manualPhoto = shoppingPhotoKind(item) === "manual" ? shoppingPhoto(item?.photoId) : "";
  if (manualPhoto) return manualPhoto;
  const productImages = shoppingAiProductImages(item);
  const selected = productImages.find((image) => image.url === item?.preferredProductImageUrl) || productImages[0];
  return selected?.url || shoppingPhoto(item?.photoId);
}

const shoppingCurrencies = ["JPY", "TWD", "KRW", "USD", "EUR", "GBP", "CNY", "HKD", "THB", "SGD", "CAD", "AUD"];

function defaultShoppingCurrency() {
  const destination = String(state.destination || "");
  if (/日本|東京|大阪|京都|Japan/i.test(destination)) return "JPY";
  if (/韓國|首爾|釜山|Korea/i.test(destination)) return "KRW";
  if (/台灣|臺灣|Taiwan/i.test(destination)) return "TWD";
  if (/英國|倫敦|United Kingdom|London/i.test(destination)) return "GBP";
  if (/歐洲|法國|德國|義大利|西班牙|荷蘭|Europe|Paris|Frankfurt|Rome/i.test(destination)) return "EUR";
  return "JPY";
}

function normalizeShoppingPrice(value) {
  const normalized = String(value ?? "").normalize("NFKC").replace(/[,，\s]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.min(amount, 1_000_000_000) : 0;
}

function shoppingCurrencyOptions(selected = "") {
  const active = shoppingCurrencies.includes(String(selected).toUpperCase()) ? String(selected).toUpperCase() : defaultShoppingCurrency();
  return shoppingCurrencies.map((currency) => `<option value="${currency}" ${currency === active ? "selected" : ""}>${currency}</option>`).join("");
}

function shoppingMoneyLabel(item) {
  const amount = normalizeShoppingPrice(item?.price);
  const currency = shoppingCurrencies.includes(String(item?.currency).toUpperCase()) ? String(item.currency).toUpperCase() : "";
  if (!amount || !currency) return "";
  try {
    return new Intl.NumberFormat("zh-TW", { style: "currency", currency, maximumFractionDigits: ["JPY", "KRW"].includes(currency) ? 0 : 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("zh-TW")}`;
  }
}

function shoppingBudgetMarkup() {
  const totals = new Map();
  state.shopping.items.forEach((item) => {
    const amount = normalizeShoppingPrice(item.price);
    const currency = shoppingCurrencies.includes(String(item.currency).toUpperCase()) ? String(item.currency).toUpperCase() : "";
    if (amount && currency) totals.set(currency, (totals.get(currency) || 0) + amount);
  });
  if (!totals.size) return `<section class="shopping-budget-strip empty"><span>預估採買</span><strong>加入價格後自動加總</strong></section>`;
  const values = [...totals].map(([currency, price]) => shoppingMoneyLabel({ currency, price })).join(" ＋ ");
  return `<section class="shopping-budget-strip"><span>預估採買總額</span><strong>${escapeHtml(values)}</strong><small>依幣別分開計算，不自動換匯</small></section>`;
}

function shoppingClone() {
  return JSON.parse(JSON.stringify(state.shopping));
}

function recordShoppingUndo() {
  shoppingUndoSnapshot = shoppingClone();
}

function shoppingUndoButtonMarkup(className = "page-undo-button") {
  if (!canManageShopping()) return "";
  return `<button class="${className}" type="button" data-undo-shopping aria-label="復原上一個採買動作" ${shoppingUndoSnapshot ? "" : "disabled"}>↶</button>`;
}

async function restoreShoppingAction() {
  if (!shoppingUndoSnapshot || !canManageShopping()) return false;
  state.shopping = JSON.parse(JSON.stringify(shoppingUndoSnapshot));
  shoppingUndoSnapshot = null;
  shoppingSelectionMode = false;
  shoppingSelectedIds.clear();
  closeSheet();
  render({ preserveScroll: true });
  await saveShopping();
  showToast("已復原上一個採買動作", { allowUndo: false });
  return true;
}

function shoppingFilteredItems() {
  return [...state.shopping.items]
    .filter((item) => state.shoppingFilter === "all" || item.categoryId === state.shoppingFilter)
    .filter((item) => state.shoppingRecipientFilter === "all" || item.recipientTagIds.includes(state.shoppingRecipientFilter))
    .filter((item) => state.shoppingStatus === "all" || (state.shoppingStatus === "done" ? item.purchased : !item.purchased))
    .sort((a, b) => Number(a.purchased) - Number(b.purchased) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

function shoppingItemMarkup(item) {
  const photo = shoppingPreferredPhoto(item);
  const selected = shoppingSelectedIds.has(item.id);
  const tags = item.recipientTagIds
    .map(shoppingTagName)
    .filter(Boolean)
    .map((name) => `<span>${escapeHtml(name)}</span>`)
    .join("");
  const priceLabel = shoppingMoneyLabel(item);
  return `
    <div class="swipe-row shopping-swipe-row ${shoppingSelectionMode ? "selection-mode" : ""}">
      ${canManageShopping() && !shoppingSelectionMode ? `<button class="swipe-delete" type="button" data-request-delete-shopping="${escapeHtml(item.id)}" aria-label="刪除${escapeHtml(item.name)}">刪除</button>` : ""}
      <article class="shopping-item swipe-surface ${item.purchased ? "purchased" : ""} ${selected ? "selected" : ""}" ${canManageShopping() && !shoppingSelectionMode ? `data-swipe-item="shopping:${escapeHtml(item.id)}"` : ""}>
      <button class="shopping-check" type="button" ${shoppingSelectionMode ? `data-select-shopping-item="${escapeHtml(item.id)}"` : `data-toggle-shopping-item="${escapeHtml(item.id)}"`} aria-label="${shoppingSelectionMode ? (selected ? "取消選取" : "選取項目") : (item.purchased ? "改為尚未購買" : "標記為已購買")}">
        <span>${shoppingSelectionMode ? (selected ? "✓" : "") : (item.purchased ? "✓" : "")}</span>
      </button>
      <button class="shopping-item-main" type="button" ${shoppingSelectionMode ? `data-select-shopping-item="${escapeHtml(item.id)}"` : `data-open-shopping-item="${escapeHtml(item.id)}"`}>
        <span class="shopping-thumb">${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}商品圖" referrerpolicy="no-referrer" />` : `<b>${escapeHtml(item.name.slice(0, 1))}</b>`}</span>
        <span class="shopping-item-copy">
          <span class="shopping-item-heading"><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(shoppingCategoryName(item.categoryId))}</em></span>
          ${priceLabel ? `<small class="shopping-price-line">預估 · ${escapeHtml(priceLabel)}</small>` : ""}
          ${item.brand ? `<small class="shopping-brand-line">品牌 · ${escapeHtml(item.brand)}</small>` : ""}
          ${item.benefits ? `<small>功效 · ${escapeHtml(item.benefits)}</small>` : tags ? `<span class="shopping-recipient-tags">${tags}</span>` : `<small>尚未標記購買對象</small>`}
        </span>
        <span class="shopping-chevron">›</span>
      </button>
      </article>
    </div>`;
}

function shoppingScreen() {
  const existingIds = new Set(state.shopping.items.map((item) => item.id));
  shoppingSelectedIds = new Set([...shoppingSelectedIds].filter((id) => existingIds.has(id)));
  const total = state.shopping.items.length;
  const done = state.shopping.items.filter((item) => item.purchased).length;
  const pending = total - done;
  const recipientOptions = state.shopping.tags
    .map((tag) => {
      const taggedItems = state.shopping.items.filter((item) => item.recipientTagIds.includes(tag.id));
      return { ...tag, total: taggedItems.length, done: taggedItems.filter((item) => item.purchased).length };
    })
    .filter((tag) => tag.total > 0);
  if (state.shoppingRecipientFilter !== "all" && !recipientOptions.some((tag) => tag.id === state.shoppingRecipientFilter)) state.shoppingRecipientFilter = "all";
  const activeRecipient = recipientOptions.find((tag) => tag.id === state.shoppingRecipientFilter);
  const recipientFilter = recipientOptions.length ? `<section class="shopping-recipient-filter"><div><span>買給誰</span><div><button type="button" data-shopping-recipient="all" class="${state.shoppingRecipientFilter === "all" ? "active" : ""}">全部</button>${recipientOptions.map((tag) => `<button type="button" data-shopping-recipient="${escapeHtml(tag.id)}" class="${state.shoppingRecipientFilter === tag.id ? "active" : ""}">${escapeHtml(tag.name)} <b>${tag.done}/${tag.total}</b></button>`).join("")}</div></div><p>${activeRecipient ? `${escapeHtml(activeRecipient.name)} · 已買 ${activeRecipient.done} 項 · 未買 ${activeRecipient.total - activeRecipient.done} 項` : "選擇對象後，可配合未購買／已購買查看他的採買項目。"}</p></section>` : "";
  const categoryTabs = [
    `<button type="button" data-shopping-category="all" class="${state.shoppingFilter === "all" ? "active" : ""}">全部 <b>${total}</b></button>`,
    ...state.shopping.categories.map((category) => {
      const count = state.shopping.items.filter((item) => item.categoryId === category.id).length;
      return `<button type="button" data-shopping-category="${escapeHtml(category.id)}" class="${state.shoppingFilter === category.id ? "active" : ""}">${escapeHtml(category.name)}${count ? ` <b>${count}</b>` : ""}</button>`;
    }),
    `<button type="button" class="shopping-add-category" data-manage-shopping-categories>＋ 分類</button>`,
  ].join("");
  const items = shoppingFilteredItems();
  const visibleIds = items.map((item) => item.id);
  const visibleSelectedCount = visibleIds.filter((id) => shoppingSelectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  return `
    <section class="screen shopping-screen">
      <header class="title-row shopping-title-row">
        <div><p class="section-kicker">PRIVATE LIST</p><h1>採買清單</h1><p class="meta">${escapeHtml(state.tripTitle)} · 只有你看得到</p></div>
        <div class="header-actions">${shoppingUndoButtonMarkup()}<span class="shopping-private-pill" aria-label="私人清單">鎖 私人</span></div>
      </header>
      <section class="shopping-summary" aria-label="採買進度">
        <div><strong>${pending}</strong><span>待購買</span></div>
        <div><strong>${done}</strong><span>已完成</span></div>
        <div><strong>${total}</strong><span>全部</span></div>
        <i style="--shopping-progress:${total ? Math.round((done / total) * 100) : 0}%"></i>
      </section>
      ${shoppingBudgetMarkup()}
      <div class="shopping-category-tabs">${categoryTabs}</div>
      ${recipientFilter}
      <div class="shopping-status-tabs" role="group" aria-label="購買狀態">
        <button type="button" data-shopping-status="all" class="${state.shoppingStatus === "all" ? "active" : ""}">全部</button>
        <button type="button" data-shopping-status="pending" class="${state.shoppingStatus === "pending" ? "active" : ""}">未購買</button>
        <button type="button" data-shopping-status="done" class="${state.shoppingStatus === "done" ? "active" : ""}">已購買</button>
      </div>
      ${canManageShopping() && total ? `<div class="shopping-list-tools">
        <button class="shopping-select-button ${shoppingSelectionMode ? "active" : ""}" type="button" data-toggle-shopping-selection>${shoppingSelectionMode ? "× 取消" : "□ 選取"}</button>
        <div>${shoppingSelectionMode ? `<button type="button" data-select-all-shopping>${allVisibleSelected ? "取消全選" : "全部選取"}</button><button class="danger" type="button" data-request-delete-shopping-batch ${visibleSelectedCount ? "" : "disabled"}>刪除${visibleSelectedCount ? ` ${visibleSelectedCount}` : ""}</button>` : ""}</div>
      </div>` : ""}
      ${!state.shoppingLoaded
        ? `<div class="shopping-loading"><span></span><b>正在載入你的私人清單</b></div>`
        : items.length
          ? `<div class="shopping-list">${items.map(shoppingItemMarkup).join("")}</div>`
          : `<div class="shopping-empty"><span>購</span><h2>${total ? "這個篩選沒有項目" : "還沒有採買項目"}</h2><p>${total ? "切換分類或購買狀態看看。" : "上傳推薦截圖，辨識後再確認加入；也可以手動新增。"}</p></div>`}
      ${canManageShopping() && !shoppingSelectionMode
          ? `<div class="shopping-sticky-actions"><button type="button" data-add-shopping-item>＋ 手動新增</button><button type="button" data-import-shopping-screenshot>▧ 截圖辨識</button></div>`
          : ""}
    </section>`;
}

function shoppingTagOptions(selectedIds = []) {
  const selected = new Set(selectedIds);
  if (!state.shopping.tags.length) return `<p class="shopping-tags-empty">儲存第一個標記後，下次就能直接點選。</p>`;
  return state.shopping.tags.map((tag) => `
    <span class="shopping-tag-option-row">
      <label class="shopping-tag-option" data-shopping-tag-name="${escapeHtml(tag.name)}"><input type="checkbox" name="recipientTag" value="${escapeHtml(tag.id)}" ${selected.has(tag.id) ? "checked" : ""} /><span>${escapeHtml(tag.name)}</span></label>
      <button type="button" data-remove-shopping-tag="${escapeHtml(tag.id)}" aria-label="移除${escapeHtml(tag.name)}">×</button>
    </span>`).join("");
}

function shoppingCategoryOptions(selectedId = "daily", includeCustom = true) {
  return `${state.shopping.categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === selectedId ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("")}${includeCustom ? `<option value="__custom__" ${selectedId === "__custom__" ? "selected" : ""}>＋ 新增自訂分類</option>` : ""}`;
}

function openShoppingDetailSheet(itemId) {
  const item = state.shopping.items.find((candidate) => candidate.id === itemId);
  if (!item) return;
  const sourcePhoto = shoppingPhoto(item.photoId);
  const photoKind = shoppingPhotoKind(item);
  const tags = item.recipientTagIds.map(shoppingTagName).filter(Boolean);
  const annotation = item.aiAnnotation;
  const productImages = shoppingAiProductImages(item);
  const productImage = productImages[0];
  const aiList = (title, values) => Array.isArray(values) && values.length
    ? `<div><b>${title}</b><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></div>`
    : "";
  const aiProductPhoto = productImage ? `<figure class="shopping-ai-product-photo"><img src="${escapeHtml(productImage.url)}" alt="${escapeHtml(item.name)}商品圖" /><figcaption>你從網路候選圖片中選擇的商品圖</figcaption></figure>` : "";
  const manualProductPhoto = sourcePhoto && photoKind === "manual" ? `<figure class="shopping-ai-product-photo shopping-manual-detail-photo"><img src="${escapeHtml(sourcePhoto)}" alt="${escapeHtml(item.name)}商品參考圖片" /><figcaption>你自行加入的商品參考圖片</figcaption></figure>` : "";
  const aiAnnotation = annotation
    ? `<section class="shopping-ai-annotation">
        <div class="shopping-ai-heading"><div><small>AI 商品註解</small><strong>商品資訊</strong></div></div>
        ${annotation.summary ? `<p>${escapeHtml(annotation.summary)}</p>` : ""}
        ${aiList("商品特色", annotation.features)}
        ${aiList("使用方式", annotation.usage)}
        ${aiList("注意事項", annotation.cautions)}
        <p class="shopping-ai-disclaimer">資訊供採買辨識參考；藥品與保健品請以產品標示及醫師、藥師建議為準。</p>
        ${sourcePhoto && !productImage ? `<button type="button" data-research-shopping-item="${escapeHtml(item.id)}">搜尋商品資料與圖片</button>` : ""}
      </section>`
    : `<section class="shopping-ai-annotation empty">
        <div><small>舊商品／手動新增</small><strong>尚未有 AI 商品資料</strong><p>新截圖會在第一次辨識時一起取得；只有舊資料需要補查。</p></div>
        <button type="button" data-research-shopping-item="${escapeHtml(item.id)}">${sourcePhoto ? "補查資料並搜尋商品圖" : "補查商品資料"}</button>
      </section>`;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop shopping-detail-backdrop" data-dismiss-sheet>
      <section class="modal-sheet shopping-detail-sheet" data-shopping-sheet role="dialog" aria-modal="true" aria-labelledby="shopping-detail-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(shoppingCategoryName(item.categoryId))}</p><h2 id="shopping-detail-title">${escapeHtml(item.name)}</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        ${manualProductPhoto || aiProductPhoto || `<div class="shopping-detail-photo placeholder"><span>${escapeHtml(item.name.slice(0, 1))}</span></div>`}
        <div class="shopping-detail-state ${item.purchased ? "done" : ""}"><span>${item.purchased ? "✓" : "○"}</span><strong>${item.purchased ? "已經買到了" : "還沒有購買"}</strong></div>
        <section class="shopping-detail-facts"><div><small>品牌</small><strong>${escapeHtml(item.brand || "尚未辨識")}</strong></div><div><small>分類</small><strong>${escapeHtml(shoppingCategoryName(item.categoryId))}</strong></div><div><small>參考價格</small><strong>${escapeHtml(shoppingMoneyLabel(item) || "尚未填寫")}</strong></div></section>
        <section class="shopping-detail-block"><small>功效／推薦重點</small><p>${item.benefits ? escapeHtml(item.benefits) : "尚未辨識功效"}</p></section>
        <section class="shopping-detail-block"><small>購買對象</small><div class="shopping-recipient-tags">${tags.length ? tags.map((name) => `<span>${escapeHtml(name)}</span>`).join("") : `<em>尚未標記</em>`}</div></section>
        <section class="shopping-detail-block"><small>備註</small><p>${item.note ? escapeHtml(item.note) : "尚未新增備註"}</p></section>
        ${aiAnnotation}
        ${sourcePhoto && photoKind === "recognition" ? `<details class="shopping-source-photo"><summary>查看原始辨識圖片</summary><img class="shopping-detail-photo" src="${escapeHtml(sourcePhoto)}" alt="${escapeHtml(item.name)}原始推薦截圖" /></details>` : ""}
        <div class="shopping-privacy-note"><b>鎖</b><span>這筆採買只屬於你的「${escapeHtml(state.tripTitle)}」清單，旅伴無法查看。</span></div>
        <div class="modal-actions shopping-detail-actions"><button class="secondary-button" type="button" data-request-delete-shopping="${escapeHtml(item.id)}">刪除</button><button class="primary-button" type="button" data-edit-shopping-item="${escapeHtml(item.id)}">編輯資料</button></div>
      </section>
    </div>`;
}

function openShoppingItemSheet(itemId = "") {
  const existing = state.shopping.items.find((item) => item.id === itemId);
  const item = existing || { id: "", brand: "", name: "", benefits: "", price: 0, currency: defaultShoppingCurrency(), categoryId: state.shoppingFilter === "all" ? "souvenir" : state.shoppingFilter, recipientTagIds: [], note: "", purchased: false, photoId: "", preferredProductImageUrl: "", aiAnnotation: null };
  const photo = shoppingPhoto(item.photoId);
  const manualPhotoEnabled = !existing || shoppingPhotoKind(item) !== "recognition";
  pendingManualShoppingPhoto = "";
  removeManualShoppingPhoto = false;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop shopping-backdrop" data-dismiss-sheet>
      <form id="shopping-item-form" class="modal-sheet shopping-form-sheet" data-shopping-sheet data-shopping-item-id="${escapeHtml(item.id)}" data-shopping-photo-id="${escapeHtml(item.photoId)}" data-shopping-manual-photo-enabled="${manualPhotoEnabled}">
        <div class="section-row shopping-sheet-header">
          <div><p class="section-kicker">私人採買</p><h2>${existing ? "編輯採買項目" : "新增採買項目"}</h2></div>
          <div class="header-actions">${shoppingUndoButtonMarkup("sheet-undo-button")}<button class="icon-button" type="button" data-close-sheet>×</button></div>
        </div>
        <div class="shopping-sheet-body">
          ${manualPhotoEnabled ? `<section class="shopping-manual-photo-card">
            <div class="shopping-manual-photo-preview ${photo ? "has-photo" : ""}" data-shopping-manual-photo-preview>
              ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name || "採買物品")}商品參考圖片" />` : `<span aria-hidden="true">▧</span><strong>加入商品參考圖片</strong><small>方便到店時快速比對包裝、顏色或款式</small>`}
            </div>
            <div class="shopping-manual-photo-actions">
              <label class="secondary-button" for="shopping-manual-photo-input">${photo ? "更換圖片" : "從相簿或相機選擇"}</label>
              <input id="shopping-manual-photo-input" class="shopping-file-input" type="file" accept="image/*" data-shopping-manual-photo-input />
              <button class="shopping-manual-photo-remove" type="button" data-remove-shopping-manual-photo ${photo ? "" : "hidden"}>移除圖片</button>
            </div>
            <small class="shopping-manual-photo-status" data-shopping-manual-photo-status>${photo ? "目前已附上一張商品圖片" : "支援相簿圖片或直接拍照，儲存前會先壓縮"}</small>
          </section>` : photo ? `<img class="shopping-form-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}原始辨識截圖" />` : ""}
          <div class="field"><label>品牌名稱</label><input name="brand" maxlength="100" value="${escapeHtml(item.brand || "")}" placeholder="例如 興和製藥" /></div>
          <div class="field"><label>物品名稱</label><input name="name" required maxlength="100" value="${escapeHtml(item.name)}" placeholder="例如 東京香蕉" /></div>
          <div class="shopping-price-fields"><div class="field"><label>參考價格</label><input name="price" inputmode="decimal" maxlength="14" value="${item.price ? escapeHtml(item.price) : ""}" placeholder="例如 1280" /></div><div class="field"><label>幣別</label><select name="currency">${shoppingCurrencyOptions(item.currency)}</select></div></div>
          <div class="field"><label>功效／推薦重點</label><textarea name="benefits" maxlength="500" placeholder="例如 關節保養、維持靈活行動">${escapeHtml(item.benefits || "")}</textarea></div>
          <div class="field"><label>分類</label><select name="categoryId" data-shopping-category-select>${shoppingCategoryOptions(item.categoryId)}</select></div>
          <div class="field shopping-custom-category-field" data-shopping-custom-category hidden><label>自訂分類名稱</label><input name="newCategory" maxlength="24" placeholder="例如 文具、紀念品" /></div>
          <fieldset class="shopping-tags-field"><legend>買給誰</legend><div class="shopping-tag-options">${shoppingTagOptions(item.recipientTagIds)}</div><input name="newTags" maxlength="100" placeholder="新增標記，例如：媽媽、同事" /><small>多個標記可用逗號分隔；儲存後下次可直接點選。</small></fieldset>
          <div class="field"><label>備註</label><textarea name="note" maxlength="800" placeholder="數量、尺寸、口味、送給誰或購買地點…">${escapeHtml(item.note)}</textarea></div>
          <label class="shopping-purchased-toggle"><input type="checkbox" name="purchased" ${item.purchased ? "checked" : ""} /><span><b>已經買到了</b><small>勾選後會移到已購買</small></span></label>
          <div class="shopping-privacy-note"><b>鎖</b><span>這頁資料只會儲存在你的帳號，不會加入旅程共用資料。</span></div>
        </div>
        <div class="modal-actions shopping-sheet-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">儲存項目</button></div>
      </form>
    </div>`;
}

function openShoppingCategorySheet() {
  const rows = state.shopping.categories.map((category) => `<div><span><strong>${escapeHtml(category.name)}</strong><small>${category.builtIn ? "預設分類" : "自訂分類"}</small></span>${category.builtIn ? "" : `<button type="button" data-request-delete-shopping-category="${escapeHtml(category.id)}" aria-label="移除${escapeHtml(category.name)}">×</button>`}</div>`).join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet" data-shopping-sheet>
        <div class="section-row"><div><p class="section-kicker">整理方式</p><h2>採買分類</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <div class="shopping-category-list">${rows}</div>
        <p class="shopping-category-hint">新增分類請在商品的「分類」下拉選單選擇「＋ 新增自訂分類」。</p>
        <div class="modal-actions"><button class="primary-button" type="button" data-close-sheet>完成</button></div>
      </section>
    </div>`;
}

function openShoppingCategoryDeleteSheet(categoryId) {
  const category = state.shopping.categories.find((candidate) => candidate.id === categoryId && !candidate.builtIn);
  if (!category) return;
  const affected = state.shopping.items.filter((item) => item.categoryId === category.id).length;
  sheetRoot.innerHTML = `<div class="modal-backdrop" data-dismiss-sheet><section class="modal-sheet" data-shopping-sheet role="alertdialog" aria-modal="true"><div class="danger-mark">刪</div><h2>移除「${escapeHtml(category.name)}」分類？</h2><p>${affected ? `其中 ${affected} 個商品會改到「日常」分類。` : "目前沒有商品使用這個分類。"}</p><div class="modal-actions"><button class="secondary-button" type="button" data-manage-shopping-categories>取消</button><button class="danger-button" type="button" data-confirm-delete-shopping-category="${escapeHtml(category.id)}">確認移除</button></div></section></div>`;
}

function openShoppingDeleteSheet(itemId) {
  const item = state.shopping.items.find((candidate) => candidate.id === itemId);
  if (!item) return;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet" data-shopping-sheet role="alertdialog" aria-modal="true" aria-labelledby="shopping-delete-title">
        <div class="danger-mark">刪</div>
        <h2 id="shopping-delete-title">刪除「${escapeHtml(item.name)}」？</h2>
        <p>這會從你的私人採買清單移除，旅伴不會受到影響。</p>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="danger-button" type="button" data-confirm-delete-shopping="${escapeHtml(item.id)}">確認刪除</button></div>
      </section>
    </div>`;
}

function openShoppingBatchDeleteSheet(itemIds) {
  pendingShoppingBatchDeleteIds = [...new Set(itemIds)].filter((id) => state.shopping.items.some((item) => item.id === id));
  if (!pendingShoppingBatchDeleteIds.length) return;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet" data-shopping-sheet role="alertdialog" aria-modal="true" aria-labelledby="shopping-batch-delete-title">
        <div class="danger-mark">刪</div>
        <h2 id="shopping-batch-delete-title">刪除選取的 ${pendingShoppingBatchDeleteIds.length} 個項目？</h2>
        <p>這些項目會從你的私人採買清單移除，刪除後仍可立即使用復原。</p>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="danger-button" type="button" data-confirm-delete-shopping-batch>確認批次刪除</button></div>
      </section>
    </div>`;
}

function removeUnusedShoppingPhotos() {
  const usedPhotoIds = new Set(state.shopping.items.map((item) => item.photoId).filter(Boolean));
  Object.keys(state.shopping.photos).forEach((photoId) => {
    if (!usedPhotoIds.has(photoId)) delete state.shopping.photos[photoId];
  });
}

function shoppingCustomCategory(name, fallbackId = "daily") {
  const normalized = String(name || "").normalize("NFKC").trim().slice(0, 24);
  if (!normalized) return fallbackId;
  const existing = state.shopping.categories.find((category) => category.name.toLocaleLowerCase() === normalized.toLocaleLowerCase());
  if (existing) return existing.id;
  const category = { id: `category-${crypto.randomUUID?.() || Date.now()}`, name: normalized, builtIn: false };
  state.shopping.categories.push(category);
  return category.id;
}

function shoppingRecipientTagIds(formData) {
  const ids = formData.getAll("recipientTag").map(String);
  const names = String(formData.get("newTags") || "")
    .split(/[，,、;；\n]+/)
    .map((name) => name.normalize("NFKC").trim().slice(0, 24))
    .filter(Boolean);
  names.forEach((name) => {
    let tag = state.shopping.tags.find((candidate) => candidate.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (!tag) {
      tag = { id: `tag-${crypto.randomUUID?.() || Date.now()}-${state.shopping.tags.length}`, name };
      state.shopping.tags.push(tag);
    }
    ids.push(tag.id);
  });
  return [...new Set(ids)].slice(0, 20);
}

function setShoppingRecognitionStatus(form, message, { progress = 0, tone = "" } = {}) {
  const status = form?.querySelector("[data-shopping-recognition-status]");
  const progressBar = form?.querySelector("[data-shopping-recognition-progress]");
  if (status) status.textContent = message;
  if (progressBar) progressBar.style.setProperty("--shopping-ocr-progress", `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%`);
  if (form) form.dataset.shoppingOcrTone = tone;
}

function imageFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function compressShoppingScreenshot(file) {
  const source = await imageFileDataUrl(file);
  const image = await loadImageElement(source);
  const canvas = document.createElement("canvas");
  const drawAtMaxEdge = (maxEdge) => {
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  drawAtMaxEdge(1600);
  let quality = 0.86;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 460000 && quality > 0.58) {
    quality -= 0.06;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > 460000) {
    drawAtMaxEdge(1280);
    quality = 0.8;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 460000 && quality > 0.52) {
      quality -= 0.06;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
  }
  if (dataUrl.length > 480000) throw new Error("IMAGE_TOO_COMPLEX");
  return dataUrl;
}

function renderManualShoppingPhotoPreview(form) {
  if (!form) return;
  const preview = form.querySelector("[data-shopping-manual-photo-preview]");
  const removeButton = form.querySelector("[data-remove-shopping-manual-photo]");
  const status = form.querySelector("[data-shopping-manual-photo-status]");
  const currentPhoto = removeManualShoppingPhoto ? "" : pendingManualShoppingPhoto || shoppingPhoto(form.dataset.shoppingPhotoId);
  if (preview) {
    preview.classList.toggle("has-photo", Boolean(currentPhoto));
    preview.innerHTML = currentPhoto
      ? `<img src="${escapeHtml(currentPhoto)}" alt="商品參考圖片預覽" />`
      : `<span aria-hidden="true">▧</span><strong>加入商品參考圖片</strong><small>方便到店時快速比對包裝、顏色或款式</small>`;
  }
  if (removeButton) removeButton.hidden = !currentPhoto;
  if (status && form.dataset.shoppingPhotoBusy !== "true") {
    status.textContent = currentPhoto ? "圖片已準備好，儲存項目後就會套用" : "支援相簿圖片或直接拍照，儲存前會先壓縮";
  }
}

async function handleManualShoppingPhotoFile(input) {
  const form = input.closest("#shopping-item-form");
  const status = form?.querySelector("[data-shopping-manual-photo-status]");
  const file = input.files?.[0];
  if (!form || !file) return;
  if (!String(file.type || "").startsWith("image/")) {
    input.value = "";
    if (status) status.textContent = "請選擇圖片檔案";
    return;
  }
  form.dataset.shoppingPhotoBusy = "true";
  if (status) status.textContent = "正在準備圖片…";
  try {
    pendingManualShoppingPhoto = await compressShoppingScreenshot(file);
    removeManualShoppingPhoto = false;
    if (status) status.textContent = `已選擇：${file.name}`;
    renderManualShoppingPhotoPreview(form);
  } catch {
    input.value = "";
    if (status) status.textContent = "圖片太大或無法讀取，請換一張圖片";
  } finally {
    form.dataset.shoppingPhotoBusy = "false";
  }
}

async function handlePlaceImportScreenshotFile(input) {
  const status = document.querySelector("[data-social-screenshot-status]");
  const file = input.files?.[0];
  pendingPlaceImportScreenshot = "";
  if (!file) {
    if (status) status.textContent = "尚未選擇圖片";
    updateImportSourceSummary(input.closest("#import-places-form"));
    return;
  }
  if (status) status.textContent = "正在準備截圖…";
  try {
    pendingPlaceImportScreenshot = await compressShoppingScreenshot(file);
    if (status) status.textContent = `已選擇：${file.name}`;
  } catch {
    input.value = "";
    if (status) status.textContent = "圖片太大或無法讀取，請換一張截圖";
  } finally {
    updateImportSourceSummary(input.closest("#import-places-form"));
  }
}

function pruneShoppingPhotos(limit = 16, maxTotal = 3800000) {
  const entries = Object.entries(state.shopping.photos)
    .sort(([, a], [, b]) => String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")));
  let total = 0;
  const retained = new Set();
  entries.forEach(([photoId, photo]) => {
    const length = String(photo?.dataUrl || "").length;
    if (retained.size < limit && total + length <= maxTotal) {
      retained.add(photoId);
      total += length;
    }
  });
  entries.filter(([photoId]) => !retained.has(photoId)).forEach(([photoId]) => {
    delete state.shopping.photos[photoId];
    state.shopping.items.forEach((item) => {
      if (item.photoId === photoId) item.photoId = "";
    });
  });
}

function shoppingResearchErrorMessage(error) {
  const code = String(error?.message || error || "");
  if (code.includes("DAILY_RESEARCH_LIMIT") || code.includes("OPENAI_429")) return "今天的 AI 商品查詢次數已達上限，請明天再試";
  if (code.includes("AI_RESEARCH_NOT_CONFIGURED")) return "AI 商品查詢尚未啟用";
  if (code.includes("SHOPPING_ITEM_NOT_FOUND")) return "找不到這個採買項目，請重新開啟清單";
  if (code.includes("PRODUCT_RESEARCH_EMPTY")) return "暫時找不到足夠可靠的商品資料";
  return "AI 商品查詢暫時失敗，請稍後再試";
}

function shoppingProductImageErrorMessage(code) {
  const value = String(code || "");
  if (value.includes("DAILY_IMAGE_SEARCH_LIMIT") || value.startsWith("OPENAI_429")) return "今天的商品圖搜尋次數已達上限，仍可先加入商品。";
  if (value.startsWith("OPENAI_")) return "商品資料已完成，但商品圖搜尋暫時無法使用。";
  return "暫時找不到合適的商品圖；可按「換一批圖片」重新搜尋。";
}

async function researchShoppingItem(itemId, button) {
  if (!canManageShopping()) return guestOnlyMessage();
  const item = state.shopping.items.find((candidate) => candidate.id === itemId);
  if (!item) return;
  const originalLabel = button?.textContent || "用 AI 查詢商品資料";
  if (button) {
    button.disabled = true;
    button.textContent = "正在查證商品資料…";
  }
  try {
    const response = await fetch("/api/shopping-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: state.tripId, itemId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "AI_RESEARCH_FAILED");
    recordShoppingUndo();
    const rawProductImage = payload.annotation?.productImages?.[0] || null;
    const productImage = await compressAiProductImage(rawProductImage);
    item.aiAnnotation = payload.annotation ? { ...payload.annotation, productImages: productImage ? [productImage] : [] } : null;
    item.preferredProductImageUrl = shoppingAiProductImages(item)[0]?.url || "";
    item.updatedAt = new Date().toISOString();
    await saveShopping();
    openShoppingDetailSheet(item.id);
    showToast(item.preferredProductImageUrl ? "商品資料與商品圖已更新" : "商品資料已更新", { allowUndo: false });
  } catch (error) {
    if (button?.isConnected) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    showToast(shoppingResearchErrorMessage(error));
  }
}

function syncPendingShoppingImportEdits(form) {
  if (!form) return;
  form.querySelectorAll("[data-shopping-import-row]").forEach((row) => {
    const entry = pendingShoppingImports.find((candidate) => candidate.id === row.dataset.shoppingImportRow);
    if (!entry) return;
    entry.details = {
      brand: String(row.querySelector("[data-import-brand]")?.value || "").normalize("NFKC").trim().slice(0, 100),
      name: String(row.querySelector("[data-import-name]")?.value || "").normalize("NFKC").trim().slice(0, 100),
      benefits: String(row.querySelector("[data-import-benefits]")?.value || "").normalize("NFKC").trim().slice(0, 500),
      price: normalizeShoppingPrice(row.querySelector("[data-import-price]")?.value),
      currency: String(row.querySelector("[data-import-currency]")?.value || defaultShoppingCurrency()).toUpperCase(),
      categoryId: String(row.querySelector("[data-import-category]")?.value || "daily"),
      newCategory: String(row.querySelector("[data-import-custom-category]")?.value || "").normalize("NFKC").trim().slice(0, 24),
    };
    entry.selectedProductImageId = String(row.querySelector("[data-import-product-image]:checked")?.value || "");
  });
}

function shoppingImportImageOptions(entry, index) {
  const images = Array.isArray(entry.productImages) ? entry.productImages.slice(0, 3) : [];
  const options = images.length
    ? `<div class="shopping-import-image-options">${images.map((image, imageIndex) => `
        <div class="shopping-import-image-option">
          <input id="shopping-product-image-${escapeHtml(entry.id)}-${imageIndex}" type="radio" name="shopping-product-image-${escapeHtml(entry.id)}" value="${escapeHtml(image.id || String(imageIndex))}" data-import-product-image ${entry.selectedProductImageId === (image.id || String(imageIndex)) ? "checked" : ""} />
          <button type="button" class="shopping-import-image-preview-button" data-preview-shopping-image="${escapeHtml(entry.id)}" data-shopping-image-id="${escapeHtml(image.id || String(imageIndex))}" aria-label="放大預覽第 ${imageIndex + 1} 張商品圖">
            <img src="${escapeHtml(image.url)}" alt="${escapeHtml(entry.details?.name || `商品 ${index + 1}`)}候選商品圖 ${imageIndex + 1}" />
          </button>
          <label for="shopping-product-image-${escapeHtml(entry.id)}-${imageIndex}">選擇第 ${imageIndex + 1} 張</label>
        </div>`).join("")}</div>`
    : `<p class="shopping-ai-result-note">${escapeHtml(shoppingProductImageErrorMessage(entry.productImageError))}</p>`;
  return `<section class="shopping-import-image-picker"><div class="shopping-import-image-heading"><b>選擇商品圖</b><span>${images.length ? `${images.length} 張候選` : "尚無候選圖"}</span></div>${options}<button type="button" data-refresh-shopping-images="${escapeHtml(entry.id)}" ${entry.imageSearchBusy || entry.recognitionBusy ? "disabled" : ""}>${entry.imageSearchBusy ? "正在搜尋…" : "↻ 換一批圖片"}</button></section>`;
}

function closeShoppingImagePreview() {
  sheetRoot.querySelector("[data-shopping-image-preview-root]")?.remove();
}

function openShoppingImagePreview(entryId, imageId) {
  const form = sheetRoot.querySelector("#shopping-import-form");
  syncPendingShoppingImportEdits(form);
  const entry = pendingShoppingImports.find((candidate) => candidate.id === entryId);
  const images = Array.isArray(entry?.productImages) ? entry.productImages.slice(0, 3) : [];
  const imageIndex = images.findIndex((candidate, index) => (candidate.id || String(index)) === imageId);
  if (!entry || imageIndex < 0) return;
  const image = images[imageIndex];
  const selected = entry.selectedProductImageId === (image.id || String(imageIndex));
  closeShoppingImagePreview();
  sheetRoot.insertAdjacentHTML("beforeend", `
    <div class="shopping-image-preview-backdrop" data-shopping-image-preview-root data-dismiss-shopping-image-preview>
      <section class="modal-sheet shopping-image-preview-sheet" role="dialog" aria-modal="true" aria-labelledby="shopping-image-preview-title">
        <div class="section-row">
          <div><p class="section-kicker">商品圖預覽 · ${imageIndex + 1} / ${images.length}</p><h2 id="shopping-image-preview-title">${escapeHtml(entry.details?.name || "候選商品圖")}</h2></div>
          <button class="icon-button" type="button" data-close-shopping-image-preview aria-label="關閉商品圖預覽">×</button>
        </div>
        <div class="shopping-image-preview-stage"><img src="${escapeHtml(image.url)}" alt="${escapeHtml(entry.details?.name || "商品")}候選商品圖 ${imageIndex + 1} 放大預覽" /></div>
        <div class="shopping-image-preview-pager" aria-label="切換候選商品圖">
          <button type="button" data-step-shopping-image-preview="-1" data-shopping-entry-id="${escapeHtml(entry.id)}" data-shopping-image-id="${escapeHtml(image.id || String(imageIndex))}" ${images.length < 2 ? "disabled" : ""} aria-label="上一張候選商品圖">‹</button>
          <span>可左右切換確認圖片細節</span>
          <button type="button" data-step-shopping-image-preview="1" data-shopping-entry-id="${escapeHtml(entry.id)}" data-shopping-image-id="${escapeHtml(image.id || String(imageIndex))}" ${images.length < 2 ? "disabled" : ""} aria-label="下一張候選商品圖">›</button>
        </div>
        <button class="primary-button shopping-image-preview-select" type="button" data-select-shopping-image-preview="${escapeHtml(image.id || String(imageIndex))}" data-shopping-entry-id="${escapeHtml(entry.id)}">${selected ? "✓ 已選擇這張商品圖" : "選擇這張商品圖"}</button>
      </section>
    </div>`);
  requestAnimationFrame(() => sheetRoot.querySelector("[data-close-shopping-image-preview]")?.focus());
}

function stepShoppingImagePreview(entryId, imageId, direction) {
  const entry = pendingShoppingImports.find((candidate) => candidate.id === entryId);
  const images = Array.isArray(entry?.productImages) ? entry.productImages.slice(0, 3) : [];
  const currentIndex = images.findIndex((candidate, index) => (candidate.id || String(index)) === imageId);
  if (currentIndex < 0 || images.length < 2) return;
  const nextIndex = (currentIndex + Number(direction) + images.length) % images.length;
  openShoppingImagePreview(entryId, images[nextIndex].id || String(nextIndex));
}

function selectShoppingImagePreview(entryId, imageId) {
  const form = sheetRoot.querySelector("#shopping-import-form");
  syncPendingShoppingImportEdits(form);
  const entry = pendingShoppingImports.find((candidate) => candidate.id === entryId);
  if (!entry?.productImages?.some((candidate, index) => (candidate.id || String(index)) === imageId)) return;
  entry.selectedProductImageId = imageId;
  closeShoppingImagePreview();
  renderShoppingImportRows(form);
}

function shoppingImportProgressMarkup(entry, index) {
  const stage = entry.recognitionStage
    || (entry.recognitionBusy ? "recognizing" : entry.recognized ? "complete" : entry.recognitionError ? "error" : "queued");
  const labels = {
    queued: "等待處理",
    preparing: "正在準備圖片",
    ready: "圖片準備完成",
    recognizing: "AI 正在辨識",
    complete: "辨識完成",
    error: "辨識失敗",
  };
  const label = labels[stage] || labels.queued;
  const completed = stage === "complete";
  return `<div class="shopping-import-item-progress" data-stage="${escapeHtml(stage)}" role="progressbar" aria-label="商品 ${index + 1} 辨識進度" aria-valuetext="${escapeHtml(label)}" ${completed ? 'aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"' : ""}><span><b>辨識進度</b><em>${escapeHtml(label)}</em></span><i aria-hidden="true"></i></div>`;
}

function renderShoppingImportRows(form) {
  const host = form?.querySelector("[data-shopping-import-results]");
  if (!host) return;
  const busy = form.dataset.shoppingOcrBusy === "true" || form.dataset.shoppingPreparing === "true";
  host.innerHTML = pendingShoppingImports.map((entry, index) => `
    <article class="shopping-import-result" data-shopping-import-row="${escapeHtml(entry.id)}">
      <div class="shopping-import-result-head"><span>商品 ${index + 1}</span><button type="button" data-remove-shopping-import="${escapeHtml(entry.id)}" ${busy ? "disabled" : ""}>移除</button></div>
      ${shoppingImportProgressMarkup(entry, index)}
      ${entry.recognized ? shoppingImportImageOptions(entry, index) : ""}
      ${entry.recognitionError ? `<p class="shopping-ai-result-note error">${escapeHtml(entry.recognitionError)}</p>` : ""}
      ${entry.recognized || entry.recognitionError ? `
      <div class="shopping-import-fields">
        <div class="field"><label>品牌名稱</label><input data-import-brand maxlength="100" value="${escapeHtml(entry.details?.brand || "")}" placeholder="尚未辨識，可自行輸入" /></div>
        <div class="field"><label>商品名稱</label><input data-import-name required maxlength="100" value="${escapeHtml(entry.details?.name || "")}" placeholder="請確認商品名稱" /></div>
        <div class="field"><label>參考價格</label><input data-import-price inputmode="decimal" maxlength="14" value="${entry.details?.price ? escapeHtml(entry.details.price) : ""}" placeholder="圖片有標價時自動帶入" /></div>
        <div class="field"><label>幣別</label><select data-import-currency>${shoppingCurrencyOptions(entry.details?.currency)}</select></div>
        <div class="field full"><label>功效／推薦重點</label><textarea data-import-benefits maxlength="500" placeholder="可修改自動辨識結果">${escapeHtml(entry.details?.benefits || "")}</textarea></div>
        <div class="field full"><label>分類</label><select data-import-category data-shopping-category-select>${shoppingCategoryOptions(entry.details?.categoryId || "daily")}</select></div>
        <div class="field full shopping-custom-category-field" data-shopping-custom-category ${entry.details?.categoryId === "__custom__" ? "" : "hidden"}><label>自訂分類名稱</label><input data-import-custom-category maxlength="24" value="${escapeHtml(entry.details?.newCategory || "")}" placeholder="例如 文具、紀念品" /></div>
      </div>
      ${entry.annotation?.summary ? `<p class="shopping-import-summary">${escapeHtml(entry.annotation.summary)}</p>` : ""}
      ${entry.dataUrl ? `<details class="shopping-original-screenshot"><summary>查看原始辨識圖片</summary><img src="${escapeHtml(entry.dataUrl)}" alt="第 ${index + 1} 張原始推薦截圖" /></details>` : ""}` : ""}
    </article>`).join("");
}

async function refreshShoppingImportImages(entryId, button) {
  const form = button?.closest("#shopping-import-form");
  const entry = pendingShoppingImports.find((candidate) => candidate.id === entryId);
  if (!form || !entry || entry.imageSearchBusy) return;
  syncPendingShoppingImportEdits(form);
  entry.imageSearchBusy = true;
  entry.productImageError = "";
  renderShoppingImportRows(form);
  try {
    const response = await fetch("/api/shopping-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: state.tripId,
        brand: entry.details.brand,
        name: entry.details.name,
        excludeIds: entry.seenProductImageIds || [],
        round: Number(entry.imageSearchRound) || 0,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "PRODUCT_IMAGE_SEARCH_FAILED");
    entry.productImages = Array.isArray(payload.productImages) ? payload.productImages.slice(0, 3) : [];
    entry.seenProductImageIds = [...new Set([...(entry.seenProductImageIds || []), ...entry.productImages.map((image) => image.id).filter(Boolean)])].slice(-30);
    entry.selectedProductImageId = entry.productImages[0]?.id || "";
    entry.imageSearchRound = (Number(entry.imageSearchRound) || 0) + 1;
    if (!entry.productImages.length) entry.productImageError = "PRODUCT_IMAGES_EMPTY";
  } catch (error) {
    entry.productImageError = String(error?.message || "PRODUCT_IMAGE_SEARCH_FAILED");
  } finally {
    entry.imageSearchBusy = false;
    renderShoppingImportRows(form);
  }
}

async function recognizeShoppingScreenshotWithAi(entry) {
  const response = await fetch("/api/shopping-recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId: state.tripId, imageDataUrl: entry.dataUrl }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "AI_RECOGNITION_FAILED");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function compressAiProductImage(image) {
  if (!image?.url || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(image.url)) return null;
  try {
    const source = await loadImageElement(image.url);
    const canvas = document.createElement("canvas");
    const draw = (edge) => {
      const scale = Math.min(1, edge / Math.max(source.naturalWidth, source.naturalHeight));
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
    };
    draw(720);
    let quality = 0.84;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 105000 && quality > 0.42) {
      quality -= 0.07;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > 125000) {
      draw(480);
      dataUrl = canvas.toDataURL("image/jpeg", 0.68);
    }
    return dataUrl.length <= 130000
      ? { ...image, url: dataUrl, pageUrl: "", sourceTitle: image.sourceTitle || "網路商品頁", kind: "web-product" }
      : null;
  } catch {
    return null;
  }
}

function shoppingRecognitionErrorMessage(error) {
  const code = String(error?.message || "");
  if (code === "DAILY_RECOGNITION_LIMIT") return "今天的 AI 辨識次數已達上限，仍可手動輸入。";
  if (code === "AI_RECOGNITION_NOT_CONFIGURED") return "AI 辨識服務尚未啟用，仍可手動輸入。";
  if (code === "PRODUCT_NOT_RECOGNIZED") return "AI 無法確認主要商品，請手動填寫。";
  if (code.startsWith("OPENAI_401")) return "OpenAI API 金鑰無效，系統已記錄錯誤。";
  if (code.startsWith("OPENAI_402") || code.startsWith("OPENAI_429_INSUFFICIENT_QUOTA")) return "OpenAI API 額度不足，請先補充 API 額度。";
  if (code.startsWith("OPENAI_403")) return "OpenAI API 拒絕此專案或模型，系統已記錄錯誤。";
  if (code.startsWith("OPENAI_400")) return "OpenAI 無法接受這張圖片或辨識格式，請換一張圖片重試。";
  if (code.startsWith("OPENAI_404")) return "目前的 AI 模型暫時無法使用，系統已記錄錯誤。";
  if (code.startsWith("OPENAI_429") || error?.status === 429) return "AI 辨識服務目前忙碌，請稍後重試。";
  if (code === "AI_EMPTY_RESULT" || code === "AI_INVALID_RESULT") return "AI 已讀取圖片，但沒有回傳可用的商品資料。";
  return "這張圖片暫時辨識失敗，請重試或手動填寫。";
}

async function recognizeShoppingScreenshots(form) {
  if (!form || !pendingShoppingImports.length || form.dataset.shoppingOcrBusy === "true") return;
  form.dataset.shoppingOcrBusy = "true";
  const token = ++shoppingRecognitionToken;
  const confirm = form.querySelector('button[type="submit"]');
  if (confirm) confirm.disabled = true;
  try {
    const entries = pendingShoppingImports.filter((entry) => entry.dataUrl && !entry.recognitionError);
    if (!entries.length) throw new Error("NO_PREPARED_IMAGES");
    let completedCount = 0;
    entries.forEach((entry) => {
      entry.recognitionBusy = true;
      entry.recognitionStage = "recognizing";
    });
    renderShoppingImportRows(form);
    setShoppingRecognitionStatus(form, `AI 正在同時辨識 ${entries.length} 張圖片…`, { progress: 0.03 });
    await Promise.all(entries.map(async (entry) => {
      try {
        const result = await recognizeShoppingScreenshotWithAi(entry);
        if (!form.isConnected || token !== shoppingRecognitionToken) return;
        syncPendingShoppingImportEdits(form);
        entry.details = result.details;
        entry.recognition = { language: result.source?.language || "多語言", confidence: Number(result.confidence) || 0 };
        entry.annotation = result.annotation || null;
        entry.productImages = Array.isArray(result.annotation?.productImages) ? result.annotation.productImages.slice(0, 3) : [];
        entry.seenProductImageIds = entry.productImages.map((image) => image.id).filter(Boolean);
        entry.selectedProductImageId = entry.productImages[0]?.id || "";
        entry.productImageError = entry.productImages.length ? "" : "PRODUCT_IMAGES_EMPTY";
        if (entry.annotation) entry.annotation = { ...entry.annotation, productImages: [] };
        entry.recognitionError = "";
        entry.recognized = true;
        entry.recognitionStage = "complete";
      } catch (error) {
        entry.recognitionError = shoppingRecognitionErrorMessage(error);
        entry.recognized = false;
        entry.recognitionStage = "error";
      } finally {
        entry.recognitionBusy = false;
        completedCount += 1;
        if (form.isConnected && token === shoppingRecognitionToken) {
          renderShoppingImportRows(form);
          setShoppingRecognitionStatus(form, `已完成 ${completedCount}／${entries.length} 張；其餘圖片仍在同時辨識…`, { progress: completedCount / entries.length });
        }
      }
    }));
    const recognizedCount = pendingShoppingImports.filter((entry) => entry.details?.name).length;
    const failedCount = pendingShoppingImports.length - recognizedCount;
    const summary = failedCount
      ? `AI 已辨識 ${recognizedCount} 個商品，另有 ${failedCount} 張需重試或手動填寫。`
      : `AI 已理解 ${recognizedCount} 個商品，請逐項確認品牌、正式品名、功效與分類。`;
    setShoppingRecognitionStatus(form, summary, { progress: 1, tone: recognizedCount ? "success" : "error" });
    if (confirm) confirm.disabled = false;
  } catch {
    if (form.isConnected && token === shoppingRecognitionToken) {
      setShoppingRecognitionStatus(form, "圖片辨識失敗，可以直接在各張圖片下方手動輸入商品資料。", { progress: 0, tone: "error" });
      if (confirm) confirm.disabled = false;
    }
  } finally {
    if (form.isConnected && token === shoppingRecognitionToken) {
      form.dataset.shoppingOcrBusy = "false";
      renderShoppingImportRows(form);
    }
  }
}

async function handleShoppingScreenshotFile(input) {
  const form = input?.closest("#shopping-import-form");
  const selectedFiles = [...(input?.files || [])];
  if (selectedFiles.length > SHOPPING_IMPORT_MAX_FILES) {
    input.value = "";
    setShoppingRecognitionStatus(form, `一次最多處理 ${SHOPPING_IMPORT_MAX_FILES} 張；這次選了 ${selectedFiles.length} 張，請重新選擇。`, { progress: 0, tone: "error" });
    return showToast(`一次最多 ${SHOPPING_IMPORT_MAX_FILES} 張；你選了 ${selectedFiles.length} 張，請重新選擇`);
  }
  const files = selectedFiles.filter((file) => file.type.startsWith("image/") && file.size <= 15 * 1024 * 1024);
  if (!form || !files.length) return showToast(`請選擇 1 至 ${SHOPPING_IMPORT_MAX_FILES} 張商品截圖，每張小於 15 MB`);
  pendingShoppingImports = files.map((file, index) => ({
    id: `shopping-import-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
    file,
    dataUrl: "",
    details: { brand: "", name: "", benefits: "", price: 0, currency: defaultShoppingCurrency(), categoryId: "daily", newCategory: "" },
    productImages: [],
    seenProductImageIds: [],
    selectedProductImageId: "",
    imageSearchRound: 0,
    recognitionStage: "queued",
  }));
  const confirm = form.querySelector('button[type="submit"]');
  if (confirm) confirm.disabled = true;
  form.dataset.shoppingPreparing = "true";
  renderShoppingImportRows(form);
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const entry = pendingShoppingImports[index];
    entry.recognitionStage = "preparing";
    renderShoppingImportRows(form);
    setShoppingRecognitionStatus(form, `正在準備第 ${index + 1}／${files.length} 張圖片…`, { progress: (index + 0.15) / files.length });
    try {
      entry.dataUrl = await compressShoppingScreenshot(file);
      entry.recognitionStage = "ready";
    } catch {
      entry.recognitionError = "這張圖片無法準備，請移除後重新選擇或手動填寫。";
      entry.recognitionStage = "error";
    }
    renderShoppingImportRows(form);
  }
  form.dataset.shoppingPreparing = "false";
  renderShoppingImportRows(form);
  if (!pendingShoppingImports.some((entry) => entry.dataUrl)) return setShoppingRecognitionStatus(form, "沒有可處理的圖片，請先裁切或縮小後再試。", { tone: "error" });
  await recognizeShoppingScreenshots(form);
}

function openShoppingImportSheet() {
  pendingShoppingImports = [];
  sheetRoot.innerHTML = `
    <div class="modal-backdrop shopping-backdrop" data-dismiss-sheet>
      <form id="shopping-import-form" class="modal-sheet shopping-form-sheet shopping-import-sheet" data-shopping-sheet>
        <div class="section-row shopping-sheet-header"><div><p class="section-kicker">SCREENSHOT TO LIST</p><h2>辨識推薦截圖</h2></div><div class="header-actions">${shoppingUndoButtonMarkup("sheet-undo-button")}<button class="icon-button" type="button" data-close-sheet>×</button></div></div>
        <div class="shopping-sheet-body">
          <label class="shopping-upload-card" for="shopping-screenshot-input"><span>▧</span><strong>一次選擇多張商品截圖</strong><small>最多 ${SHOPPING_IMPORT_MAX_FILES} 張；系統相簿仍可多選，回到 App 後會檢查數量並同時辨識。</small></label>
          <input id="shopping-screenshot-input" class="shopping-file-input" type="file" accept="image/*" multiple data-max-files="${SHOPPING_IMPORT_MAX_FILES}" data-shopping-screenshot-input />
          <div class="shopping-recognition-state"><span data-shopping-recognition-status>多語言 AI 會理解品牌、正式商品名稱、功效與分類</span><i data-shopping-recognition-progress></i></div>
          <div class="shopping-import-results" data-shopping-import-results></div>
          <fieldset class="shopping-tags-field"><legend>買給誰</legend><div class="shopping-tag-options">${shoppingTagOptions()}</div><input name="newTags" maxlength="100" placeholder="新增標記，例如：媽媽、同事" /></fieldset>
          <div class="field"><label>共同備註（選填）</label><textarea name="note" maxlength="800" placeholder="例如：同事一人一盒、到藥妝店比較價格"></textarea></div>
          <div class="shopping-privacy-note"><b>鎖</b><span>截圖會交由伺服器端 AI 理解；只有確認後，圖片與結果才會儲存在你的私人採買清單。</span></div>
        </div>
        <div class="modal-actions shopping-sheet-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit" disabled>確認加入</button></div>
      </form>
    </div>`;
}

function itineraryScreen() {
  syncFlightItineraryItems();
  const dayItems = state.itinerary[state.selectedDate] || [];
  const selectedWeekday = dateMeta.find(([date]) => date === state.selectedDate)?.[1] || "";
  const dates = dateMeta
    .map(
      ([date, weekday]) => `
        <button class="date-button ${state.selectedDate === date ? "active" : ""}" type="button" data-date="${date}">
          <strong>${date}</strong><span>${weekday}</span>
        </button>`,
    )
    .join("");

  const rows = dayItems
    .map((item, index) => {
      const itemKey = itineraryItemKey(item);
      const connector = transportBetweenMarkup(state.selectedDate, item, dayItems[index + 1]);
      if (item.type === "flight") {
        const flight = state.flights.find((candidate) => candidate.id === item.flightId);
        if (!flight) return "";
        const editFlightAttribute = canEdit() ? `data-edit-flight="${escapeHtml(flight.id)}"` : "disabled";
        return `
          <div class="timeline-swipe-row flight-itinerary-row" data-itinerary-row="${escapeHtml(itemKey)}">
            <article class="timeline-item flight-timeline-item" data-item-key="${escapeHtml(itemKey)}">
              <button class="time-button flight-time-button" type="button" ${editFlightAttribute}>${escapeHtml(flight.departureTime || item.time || "--:--")}</button>
              <button class="place-copy place-copy-button timeline-place-details flight-itinerary-details" type="button" ${editFlightAttribute}>
                <strong>✈ ${escapeHtml(flight.direction || "航班")} · ${escapeHtml(flight.departureCity)} → ${escapeHtml(flight.arrivalCity)}</strong>
                <span>${escapeHtml(flight.departureCode || "---")} ${escapeHtml(flight.departureTime || "--:--")}　→　${escapeHtml(flight.arrivalCode || "---")} ${escapeHtml(flight.arrivalTime || "--:--")}</span>
                <span>搭乘：${escapeHtml(flight.travelers || "尚未註記")}</span>
              </button>
              ${canEdit() ? `<button class="drag-handle" type="button" data-drag-key="${escapeHtml(itemKey)}" data-reorder-menu="${escapeHtml(itemKey)}" aria-label="調整${escapeHtml(itineraryItemLabel(item))}順序，目前第 ${index + 1} 個">☰</button>` : ""}
            </article>
          </div>${connector}`;
      }
      const place = state.places.find((candidate) => candidate.name === item.name);
      return `
        <div class="swipe-row timeline-swipe-row ${canEdit() ? "" : "readonly"}" data-itinerary-row="${escapeHtml(itemKey)}">
          ${canEdit() ? `<button class="swipe-delete" type="button" data-request-delete-itinerary="${escapeHtml(item.name)}" data-delete-date="${state.selectedDate}" aria-label="從${state.selectedDate}刪除${escapeHtml(item.name)}">刪除</button>` : ""}
          <article class="timeline-item swipe-surface" data-item-key="${escapeHtml(itemKey)}" ${canEdit() ? `data-swipe-item="itinerary:${state.selectedDate}:${escapeHtml(item.name)}"` : ""}>
            ${canEdit()
              ? `<button class="time-button" type="button" data-edit-time="${escapeHtml(item.name)}" aria-label="修改${escapeHtml(item.name)}時間">${escapeHtml(item.time)}</button>`
              : `<span class="time-button readonly-time">${escapeHtml(item.time)}</span>`}
            <button class="place-copy place-copy-button timeline-place-details" type="button" data-open-place="${escapeHtml(item.name)}">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="opening-line"><b>營業</b>${formatOpeningHoursForDay(place?.openingHours, selectedWeekday)}</span>
              <span class="phone-line"><b>電話</b>${escapeHtml(place?.phone || "待 Google Maps 同步")}</span>
            </button>
            ${canEdit() ? `<button
              class="drag-handle"
              type="button"
              data-drag-key="${escapeHtml(itemKey)}"
              data-reorder-menu="${escapeHtml(itemKey)}"
              aria-label="調整${escapeHtml(item.name)}順序，目前第 ${index + 1} 個"
            >☰</button>` : ""}
          </article>
        </div>${connector}`;
    })
    .join("");

  const placeItems = dayItems.filter((item) => item.type !== "flight");
  const area = placeItems.length
    ? [...new Set(placeItems.map((item) => {
        const place = state.places.find((candidate) => candidate.name === item.name);
        return travelAreaChineseName(place, "行程");
      }))].join("／")
    : "尚未安排";
  const dayCountLabel = [placeItems.length ? `${placeItems.length} 個地點` : "", dayItems.length - placeItems.length ? `${dayItems.length - placeItems.length} 個航班` : ""].filter(Boolean).join(" · ");

  return `
    <section class="screen">
      <header class="title-row">
        <div><h1>每日行程</h1><p class="meta">先排區域，再調整時間</p></div>
        ${state.isGuest ? "" : `<div class="header-actions">${undoButtonMarkup()}${shareButtonMarkup()}</div>`}
      </header>
      <div class="date-strip">${dates}</div>
      <div class="day-area">
        <h2><span class="day-area-name">⌖ ${escapeHtml(area)}</span>${dayCountLabel ? `<small class="day-count">${escapeHtml(dayCountLabel)}</small>` : ""}</h2>
        ${placeItems.length ? `<button class="map-link" type="button" data-day-map>地圖查看 ›</button>` : ""}
      </div>
      ${
        dayItems.length
          ? `<div class="timeline">${rows}</div>${transportReviewMarkup(state.selectedDate)}`
          : `<div class="empty-state"><div><b>這天還沒有地點</b><span>從地圖選取同區景點，加入這一天。</span></div></div>`
      }
      ${canEdit() ? `<button class="outline-button" type="button" data-open-itinerary-places>＋　加入地點</button>` : `<div class="guest-readonly-note">訪客可查看行程；登入後才能調整時間、順序與景點。</div>`}
    </section>`;
}

function render({ preserveScroll = false } = {}) {
  const previousScrollTop = app.scrollTop;
  syncTabBarState();
  const mapIsActive = Boolean(state.tripId && state.activeTab === "places" && state.placesMode === "map");
  if (!mapIsActive) mapFullscreen = false;
  document.body.classList.toggle("map-fullscreen-open", mapIsActive && mapFullscreen);
  if (!state.tripId) app.innerHTML = state.isGuest ? emptyGuestScreen() : emptyTripsScreen();
  else if (state.activeTab === "overview") app.innerHTML = overviewScreen();
  else if (state.activeTab === "places") app.innerHTML = placesScreen();
  else if (state.activeTab === "itinerary") app.innerHTML = itineraryScreen();
  else if (state.activeTab === "shopping") app.innerHTML = shoppingScreen();
  app.scrollTop = preserveScroll ? previousScrollTop : 0;
  if (state.activeTab === "places" && state.placesMode === "map") {
    if (state.mapView !== "planning" && liveLocationEnabled) stopLiveLocation();
    window.requestAnimationFrame(initializeInteractiveMap);
  } else {
    if (liveLocationEnabled) stopLiveLocation();
    mapRenderToken += 1;
    clearLiveLocationLayers();
    activeGoogleMap = null;
    activeLeafletMap?.remove();
    activeLeafletMap = null;
  }
}

function openPlaceSheet(name) {
  const place = state.places.find((item) => item.name === name);
  if (!place) return;
  const reference = placeReferenceMeta(place);
  const mapNavigationUrl = placeNavigationUrl(place);
  const tabelogUrl = safeTabelogUrl(place.tabelogUrl);
  const tabelogWebUrl = tabelogMultilingualWebUrl(tabelogUrl);
  const tabelogLink = tabelogAppLink(tabelogUrl);
  const deleteLabel = place.kind === "lodging"
    ? "刪除這間住宿"
    : place.kind === "restaurant"
      ? "刪除這間餐廳"
      : place.kind === "shopping"
        ? "刪除這間商店"
        : "刪除這個景點";
  const voters = placeVoters(place.name);
  const hasMyVote = voters.includes(currentMemberId());
  const voterChips = voters.length
    ? voters
        .map(
          (memberId) => `
            <span class="voter-chip">
              ${avatarMarkup(memberId, true)}
              ${escapeHtml(memberName(memberId))}
            </span>`,
        )
        .join("")
    : `<span class="meta">還沒有人標記，成為第一個吧</span>`;
  const galleryItems = [];
  if (place.customPhotoDataUrl) galleryItems.push({ type: "custom", url: place.customPhotoDataUrl, caption: place.photoOrigin === "lodging_source" ? "原住宿頁照片" : "自行加入的照片" });
  (place.photos || []).slice(0, place.customPhotoDataUrl ? 2 : 3).forEach((photo) => galleryItems.push({ type: "google", ...photo }));
  const fallbackLabels = place.galleryLabels || ["正在取得 Google Maps 照片", "環境照片", "附近街景"];
  while (galleryItems.length < 3) galleryItems.push({ type: "placeholder", label: fallbackLabels[galleryItems.length] || "地點照片" });
  const gallery = galleryItems.slice(0, 3).map((photo, index) => {
    if (photo.type === "custom") {
      return `<figure class="gallery-card gallery-${index + 1} real-photo custom-place-photo"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(place.name)}自行加入的照片" loading="lazy" /><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`;
    }
    if (photo.type === "google") {
      return `<figure class="gallery-card gallery-${index + 1} real-photo"><img src="/api/place-photo?name=${encodeURIComponent(photo.name)}" alt="${escapeHtml(place.name)} Google Maps 照片" loading="lazy" /><figcaption>${escapeHtml(photo.attribution || "Google Maps 使用者")}</figcaption></figure>`;
    }
    return `<div class="gallery-card gallery-${index + 1}" style="--swatch:${place.swatch}"><span>${escapeHtml(photo.label)}</span></div>`;
  }).join("");
  const highlights = (place.highlights || [])
    .map((highlight) => `<span class="highlight-tag">${escapeHtml(highlight)}</span>`)
    .join("");

  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet place-detail-sheet" data-detail-place="${escapeHtml(place.name)}" role="dialog" aria-modal="true" aria-labelledby="place-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(travelAreaDisplayName(place))}</p><h2 id="place-title">${escapeHtml(place.name)}</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p class="place-byline">${escapeHtml(place.fullName || place.name)} · ${escapeHtml(place.category)}</p>
        <div class="detail-gallery" aria-label="${escapeHtml(place.name)}照片預覽">${gallery}</div>
        <div class="gallery-caption">
          <span>${place.customPhotoDataUrl ? (place.photoOrigin === "lodging_source" ? "使用原住宿頁照片" : "包含你自行加入的照片") : place.photos?.length ? "Google Maps 景點照片" : "尚未加入地點照片"}</span>
          <button type="button" data-open-maps="${escapeHtml(mapNavigationUrl)}">在 Google Maps 開啟 ↗</button>
        </div>
        ${place.formattedAddress ? `<div class="place-address-card"><small>完整地址</small><strong>${escapeHtml(place.formattedAddress)}</strong></div>` : ""}
        <p class="place-description">${escapeHtml(place.description)}</p>
        ${reference ? `<button class="source-reference-button" type="button" data-open-reference="${escapeHtml(reference.url)}">查看原始 ${escapeHtml(reference.platform)} 連結 ↗</button>` : ""}
        <div class="highlight-list">${highlights}</div>
        <section class="place-contact-grid${tabelogLink ? " has-tabelog-action" : ""}" aria-label="營業資訊">
          <div class="place-contact-item hours-contact-item">
            <small>營業時間</small>
            <strong>${formatOpeningHours(place.openingHours)}</strong>
            <span>Google Maps 參考，出發前請再次確認</span>
          </div>
          <div class="place-contact-item phone-contact-item">
            <small>電話</small>
            ${
              place.phone && !place.phone.startsWith("待")
                ? `<a href="tel:${escapeHtml(place.phone.replaceAll("-", ""))}">${escapeHtml(place.phone)}</a>`
                : `<strong>${escapeHtml(place.phone || "待 Google Maps 同步")}</strong>`
            }
          </div>
          ${tabelogLink && tabelogWebUrl ? `<a class="tabelog-reservation-button" href="${escapeHtml(tabelogLink)}" rel="noopener"><span>Tabelog預約</span><b aria-hidden="true">↗</b></a>` : ""}
        </section>
        <form class="place-note-card" id="place-note-form" data-place-name="${escapeHtml(place.name)}">
          <div class="section-row"><div><small>共同註記</small><strong>旅伴都看得到</strong></div>${canEdit() ? `<button type="submit">儲存註記</button>` : ""}</div>
          ${canEdit()
            ? `<textarea name="note" maxlength="800" placeholder="例如：要預約、想買的品項、集合方式…">${escapeHtml(place.note || "")}</textarea>`
            : `<p>${escapeHtml(place.note || "尚未加入註記")}</p>`}
        </form>
        <section class="detail-plan-row" aria-label="行程安排">
          <div>
            <small>行程安排</small>
            <strong class="${placeAssignments(place.name).length ? "scheduled" : ""}">${escapeHtml(placeScheduleLabel(place.name))}</strong>
          </div>
          ${canEdit() ? `<button class="secondary-button" type="button" data-add-place-date="${escapeHtml(place.name)}">＋ 加入某一天</button>` : `<span class="readonly-badge">訪客唯讀</span>`}
        </section>
        <section class="vote-panel" aria-label="最想去投票">
          <div class="section-row">
            <div><strong>最想去</strong><span>${voters.length} 人標記</span></div>
            <div class="avatar-stack">${voters.map((memberId) => avatarMarkup(memberId, true)).join("")}</div>
          </div>
          <div class="voter-list">${voterChips}</div>
        </section>
        ${
          Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
            ? `<p class="meta detail-coordinate">由 ${escapeHtml(placeCreatorName(place))}新增 · 座標 ${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}</p>`
            : `<p class="meta">此自訂地點尚未取得座標</p>`
        }
        <div class="modal-actions">
          <button class="secondary-button ${hasMyVote ? "voted" : ""}" type="button" ${canEdit() ? `data-vote="${escapeHtml(place.name)}"` : "data-guest-action"}>${canEdit() ? (hasMyVote ? "★ 已標記最想去" : "☆ 我也最想去") : "訪客無法投票"}</button>
          <button class="primary-button" type="button" data-open-maps="${escapeHtml(mapNavigationUrl)}">開啟 Google Maps</button>
        </div>
        ${canEdit() ? `<button class="place-detail-edit-button" type="button" data-edit-place="${escapeHtml(place.name)}">編輯名稱、地址、旅遊分區與照片</button>` : ""}
        ${canEdit() ? `<button class="place-detail-delete-button" type="button" data-request-delete-place="${escapeHtml(place.name)}">${deleteLabel}</button>` : ""}
      </section>
    </div>`;
  ensurePlaceDetails(place);
}

async function ensurePlaceDetails(place) {
  if (!place || place.detailsLocked || place.photosLoaded || place.detailsLoading) return;
  place.detailsLoading = true;
  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ places: [{ sourceUrl: place.sourceUrl, hintName: place.name, destination: state.destination, countryCode: place.countryCode || "" }] }),
    });
    if (!response.ok) return;
    const resolved = (await response.json()).places?.[0];
    if (!resolved || resolved.error) return;
    Object.assign(place, {
      placeId: resolved.placeId || place.placeId,
      fullName: resolved.name || place.fullName,
      area: resolved.area || place.area,
      areaOriginal: resolved.areaOriginal || place.areaOriginal || place.area,
      areaResolvedByGoogle: resolved.areaResolvedByGoogle === true || place.areaResolvedByGoogle === true,
      category: resolved.category || place.category,
      kind: normalizedPlaceKind({ ...place, category: resolved.category || place.category }),
      latitude: Number.isFinite(resolved.latitude) ? resolved.latitude : place.latitude,
      longitude: Number.isFinite(resolved.longitude) ? resolved.longitude : place.longitude,
      sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
      formattedAddress: resolved.formattedAddress || place.formattedAddress || "",
      openingHours: resolved.openingHours || place.openingHours,
      phone: resolved.phone || place.phone,
      photos: resolved.photos || place.photos || [],
      photosLoaded: true,
    });
    applyPlanningRegionResolution(place, resolved);
    persist({ recordUndo: false });
    if (document.querySelector(`[data-detail-place="${CSS.escape(place.name)}"]`)) openPlaceSheet(place.name);
  } catch {
    // The existing text details remain available when Google Places is temporarily unavailable.
  } finally {
    place.detailsLoading = false;
  }
}

function openProfileSheet(required = false) {
  const current = state.profile?.nickname || "";
  const memberRows = state.tripId
    ? members().map((member) => `
        <div class="account-member-row">
          ${avatarMarkup(member.id, true)}
          <span><strong>${escapeHtml(member.name)}</strong><small>${member.id === currentMemberId() ? (member.id === state.ownerId ? "你 · 旅程建立者" : "你") : member.id === state.ownerId ? "旅程建立者" : "旅程成員"}</small></span>
          ${isTripOwner() && member.id !== currentMemberId() ? `<button type="button" data-request-remove-member="${escapeHtml(member.id)}" data-member-name="${escapeHtml(member.name)}">移除</button>` : ""}
        </div>`).join("")
    : "";
  sheetRoot.innerHTML = `
    <div class="modal-backdrop profile-backdrop">
      <form class="modal-sheet profile-sheet" id="profile-form" data-required="${required ? "true" : "false"}">
        <div class="profile-mark">旅</div>
        <p class="section-kicker">一起規劃每一趟旅行</p>
        <h2>${required || state.isGuest ? "取一個旅行暱稱" : "編輯我的暱稱"}</h2>
        <p>不用真名，請自行輸入容易辨識的名稱。標記推薦時會使用暱稱的第一個字作為代號。</p>
        <div class="field">
          <label for="profile-nickname">我的暱稱</label>
          <input id="profile-nickname" name="nickname" value="${escapeHtml(current)}" maxlength="10" required autocomplete="nickname" placeholder="輸入你的旅行暱稱" />
          <span class="field-note">最多 10 個字，第一個字會顯示在推薦標記上</span>
        </div>
        <div class="field">
          <label for="profile-pin">4 位數 PIN</label>
          <input id="profile-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" required autocomplete="current-password" placeholder="輸入 4 位數字" />
          <span class="field-note">首次使用會建立 PIN；換手機時用相同暱稱與 PIN 取回身分</span>
        </div>
        ${required ? `<div class="field"><label for="profile-invite">旅程邀請碼（選填）</label><input id="profile-invite" name="inviteCode" maxlength="6" minlength="6" autocomplete="off" autocapitalize="characters" value="${escapeHtml(state.pendingInviteCode)}" placeholder="分享連結會自動帶入" /><span class="field-note">沒有邀請碼也可以先登入，再建立自己的旅程</span></div>` : ""}
        ${!required && state.tripId ? `<section class="account-members"><div class="section-row"><div><p class="section-kicker">這趟旅程</p><h3>${members().length} 位成員</h3></div>${isTripOwner() ? `<span>你是建立者</span>` : ""}</div><div class="account-member-list">${memberRows}</div>${!isTripOwner() ? `<p>只有旅程建立者能移除成員。</p>` : ""}<button class="account-leave-button" type="button" data-request-leave-trip>退出行程</button></section>` : ""}
        <div class="modal-actions ${required ? "profile-entry-actions" : ""}">
          ${required ? `<button class="secondary-button" type="button" data-enter-guest>不登入，以訪客瀏覽</button>` : `<button class="secondary-button" type="button" data-close-sheet>取消</button>`}
          <button class="primary-button" type="submit">儲存並開始</button>
        </div>
      </form>
    </div>`;
  window.setTimeout(() => document.querySelector("#profile-nickname")?.focus(), 0);
}

function openTripsSheet() {
  const tripRows = state.trips.map((trip) => `
    <button class="trip-switch-row ${trip.id === state.tripId ? "active" : ""}" type="button" data-switch-trip="${escapeHtml(trip.id)}">
      <span><strong>${escapeHtml(trip.title)}</strong><small>${escapeHtml(trip.destination)} · ${escapeHtml(tripDateLabel(trip.startDate))}–${escapeHtml(tripDateLabel(trip.endDate))}</small></span>
      <b>${trip.id === state.tripId ? "目前" : "切換"}</b>
    </button>`).join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet trips-sheet" role="dialog" aria-modal="true" aria-labelledby="trips-title">
        <div class="section-row"><div><p class="section-kicker">${escapeHtml(state.profile?.nickname || "我的")}的旅行</p><h2 id="trips-title">切換旅程</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <div class="trip-switch-list">${tripRows || `<p class="meta">目前沒有旅程</p>`}</div>
        ${state.tripId ? `<div class="invite-code-card"><span>邀請旅伴加入</span><strong>${escapeHtml(state.inviteCode || "讀取中")}</strong><small>把這組邀請碼傳給旅伴</small></div>` : ""}
        <div class="modal-actions stacked-actions">
          <button class="primary-button" type="button" data-create-trip>＋ 建立空白旅程</button>
          <button class="secondary-button" type="button" data-join-trip>輸入邀請碼加入旅程</button>
          ${state.tripId ? `<button class="text-button" type="button" data-edit-trip>編輯目前旅程資訊</button>` : ""}
        </div>
      </section>
    </div>`;
}

function openTripForm(editing = false) {
  const today = new Date();
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 6);
  const values = editing
    ? { title: state.tripTitle, destination: state.destination, startDate: state.startDate, endDate: state.endDate }
    : { title: "", destination: "", startDate: defaultStart, endDate: defaultEndDate.toISOString().slice(0, 10) };
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet" id="trip-form" data-editing="${editing ? "true" : "false"}">
        <div class="section-row"><div><p class="section-kicker">${editing ? "旅程設定" : "從空白開始"}</p><h2>${editing ? "編輯旅程" : "建立新旅程"}</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <p>每個旅程的成員、航班、地點、投票與每日安排都會分開保存。</p>
        <div class="field"><label for="trip-destination">旅遊目的地</label><input id="trip-destination" name="destination" maxlength="40" required value="${escapeHtml(values.destination)}" placeholder="例如：首爾" /></div>
        <div class="field"><label for="trip-title-input">旅程名稱</label><input id="trip-title-input" name="title" maxlength="40" value="${escapeHtml(values.title)}" placeholder="例如：首爾姐妹旅行" /></div>
        <div class="field-grid"><div class="field"><label for="trip-start">開始日期</label><input id="trip-start" name="startDate" type="date" required value="${escapeHtml(values.startDate)}" /></div><div class="field"><label for="trip-end">結束日期</label><input id="trip-end" name="endDate" type="date" required value="${escapeHtml(values.endDate)}" /></div></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">${editing ? "儲存變更" : "建立空白旅程"}</button></div>
      </form>
    </div>`;
}

function openJoinTripSheet() {
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet" id="join-trip-form">
        <div class="section-row"><div><p class="section-kicker">加入旅伴</p><h2>輸入旅程邀請碼</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <p>加入後，這個旅程會出現在你的旅程清單；原本自己的旅程不會分享給對方。</p>
        <div class="field"><label for="trip-invite">6 位邀請碼</label><input id="trip-invite" name="inviteCode" maxlength="6" minlength="6" required autocomplete="off" autocapitalize="characters" value="${escapeHtml(state.pendingInviteCode)}" placeholder="例如 TOKYO6" /></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">加入旅程</button></div>
      </form>
    </div>`;
}

function openFlightSheet(flightId = "") {
  const flight = state.flights.find((item) => item.id === flightId) || {
    id: "",
    direction: "去程",
    departureDate: state.startDate,
    departureTime: "09:00",
    departureCity: "",
    departureCode: "",
    arrivalDate: state.startDate,
    arrivalTime: "13:00",
    arrivalCity: state.destination,
    arrivalCode: "",
    travelers: "",
  };
  const selectedDirection = flight.direction === "回程" ? "回程" : "去程";
  const cityOptions = flightCitySuggestions.map((city) => `<option value="${escapeHtml(city)}"></option>`).join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet flight-form-sheet" id="flight-form" data-flight-id="${escapeHtml(flight.id)}">
        <div class="section-row"><div><p class="section-kicker">航班安排</p><h2>${flight.id ? "編輯航班" : "新增航班"}</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <section class="flight-ticket-card" data-flight-ticket-card>
          <div class="flight-ticket-intro"><span>辨</span><div><strong>從機票圖片自動填入</strong><small>照片只在此裝置辨識，不會儲存或分享。</small></div></div>
          <input id="flight-ticket-image" class="flight-ticket-file" type="file" accept="image/*" data-flight-ticket-input />
          <label class="flight-ticket-upload" for="flight-ticket-image">＋ 選擇或拍攝機票圖片</label>
          <div class="flight-ticket-preview" data-flight-ticket-preview hidden>
            <img data-flight-ticket-image alt="待辨識的機票圖片預覽" />
            <div><strong data-flight-ticket-name>機票圖片</strong><span data-flight-ticket-status>準備辨識</span></div>
            <button type="button" data-recognize-flight-ticket hidden>重新辨識</button>
          </div>
          <div class="flight-ticket-progress" data-flight-ticket-progress aria-hidden="true"><i></i></div>
        </section>
        <div class="field"><label for="flight-direction">航程標記</label><select id="flight-direction" name="direction" data-flight-direction><option ${selectedDirection === "去程" ? "selected" : ""}>去程</option><option ${selectedDirection === "回程" ? "selected" : ""}>回程</option>${flight.id ? "" : "<option>來回</option>"}</select></div>
        <section class="flight-leg-fields">
          <div class="flight-segment-heading" data-flight-outbound-heading ${flight.id ? "" : "hidden"}><span>航段 1</span><strong>${flight.id ? "目前航段" : "先填出發與抵達資料"}</strong></div>
          <div class="flight-form-grid"><div class="field"><label>出發城市</label><input name="departureCity" list="flight-city-options" data-flight-city-side="departure" autocomplete="off" required value="${escapeHtml(flight.departureCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="departureCode" required>${airportOptionsMarkup(flight.departureCity, flight.departureCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "出發日期", name: "departureDate", type: "date", value: flight.departureDate })}${flightDateTimeInputMarkup({ label: "出發時間", name: "departureTime", type: "time", value: flight.departureTime })}</div>
          <div class="flight-form-grid"><div class="field"><label>抵達城市</label><input name="arrivalCity" list="flight-city-options" data-flight-city-side="arrival" autocomplete="off" required value="${escapeHtml(flight.arrivalCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="arrivalCode" required>${airportOptionsMarkup(flight.arrivalCity, flight.arrivalCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "抵達日期", name: "arrivalDate", type: "date", value: flight.arrivalDate })}${flightDateTimeInputMarkup({ label: "抵達時間", name: "arrivalTime", type: "time", value: flight.arrivalTime })}</div>
          ${flight.id ? "" : `<div class="flight-connection-list" data-flight-connection-list="outbound"></div><button class="flight-add-connection" type="button" data-add-flight-connection="outbound">＋ 加入轉機航段</button>`}
        </section>
        <section class="flight-return-fields" data-flight-return-fields hidden>
          <div class="flight-segment-heading"><span>回程</span><strong data-flight-return-route>目的地 → 出發地</strong></div>
          <p class="field-note">回程先帶入相反方向，仍可修改城市、機場並加入不同的轉機點。</p>
          <div class="flight-form-grid"><div class="field"><label>出發城市</label><input name="returnDepartureCity" list="flight-city-options" data-flight-city-side="returnDeparture" autocomplete="off" required value="${escapeHtml(flight.arrivalCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="returnDepartureCode" required>${airportOptionsMarkup(flight.arrivalCity, flight.arrivalCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "回程出發日期", name: "returnDepartureDate", type: "date", value: state.endDate, required: false })}${flightDateTimeInputMarkup({ label: "回程出發時間", name: "returnDepartureTime", type: "time", value: "17:00", required: false })}</div>
          <div class="flight-form-grid"><div class="field"><label>抵達城市</label><input name="returnArrivalCity" list="flight-city-options" data-flight-city-side="returnArrival" autocomplete="off" required value="${escapeHtml(flight.departureCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="returnArrivalCode" required>${airportOptionsMarkup(flight.departureCity, flight.departureCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "回程抵達日期", name: "returnArrivalDate", type: "date", value: state.endDate, required: false })}${flightDateTimeInputMarkup({ label: "回程抵達時間", name: "returnArrivalTime", type: "time", value: "21:00", required: false })}</div>
          <div class="flight-connection-list" data-flight-connection-list="return"></div>
          <button class="flight-add-connection" type="button" data-add-flight-connection="return">＋ 加入回程轉機航段</button>
        </section>
        <datalist id="flight-city-options">${cityOptions}</datalist>
        <p class="flight-airport-note">選擇城市後會列出常用機場。每個方向最多 6 個航段，轉機航段會依時間分別出現在每日行程與地圖。</p>
        <div class="field"><label>搭乘成員</label><input name="travelers" required value="${escapeHtml(flight.travelers)}" placeholder="弟弟，或媽媽、妹妹、璋" /><span class="field-note">可填一人或多人，使用頓號或逗號分隔。</span></div>
        <div class="modal-actions">${flight.id ? `<button class="danger-button" type="button" data-delete-flight="${escapeHtml(flight.id)}">刪除</button>` : `<button class="secondary-button" type="button" data-close-sheet>取消</button>`}<button class="primary-button" type="submit">儲存航班</button></div>
      </form>
    </div>`;
  updateFlightFormMode(sheetRoot.querySelector("#flight-form"));
}

const transportFieldProfiles = {
  walk: { stations: false, line: false, note: false, ticket: false },
  subway: { stations: true, line: true, note: true, ticket: true, departure: "進站車站", arrival: "下車車站", route: "路線名稱", routePlaceholder: "東京 Metro 銀座線" },
  train: { stations: true, line: true, note: true, ticket: true, departure: "出發車站", arrival: "抵達車站", route: "路線名稱", routePlaceholder: "JR 山手線" },
  bus: { stations: true, line: true, note: true, ticket: true, departure: "上車站牌", arrival: "下車站牌", route: "公車路線", routePlaceholder: "都營巴士 都01" },
  taxi: { stations: false, line: false, note: true, ticket: false },
  drive: { stations: false, line: false, note: true, ticket: false },
  ferry: { stations: true, line: true, note: true, ticket: true, departure: "出發碼頭", arrival: "抵達碼頭", route: "航線名稱", routePlaceholder: "水上巴士航線" },
  other: { stations: true, line: true, note: true, ticket: true, departure: "出發位置", arrival: "抵達位置", route: "交通名稱", routePlaceholder: "接駁車或包車" },
};

function updateTransportFormMode(form, { refreshEstimate = false } = {}) {
  if (!form) return;
  const mode = String(form.elements.mode?.value || "walk");
  const profile = transportFieldProfiles[mode] || transportFieldProfiles.other;
  const journeyTypeInput = form.elements.journeyType;
  const ticketButton = form.querySelector("[data-toggle-transport-ticket]");
  const ticketControl = form.querySelector("[data-transport-ticket-control]");
  const scheduledFields = form.querySelector(".transport-scheduled-fields");
  const durationInput = form.elements.durationMinutes;
  const durationNote = form.querySelector("[data-transport-duration-note]");

  form.querySelector("[data-transport-station-fields]")?.toggleAttribute("hidden", !profile.stations);
  form.querySelector("[data-transport-line-field]")?.toggleAttribute("hidden", !profile.line);
  form.querySelector("[data-transport-note-field]")?.toggleAttribute("hidden", !profile.note);
  ticketControl?.toggleAttribute("hidden", !profile.ticket);
  if (!profile.ticket && journeyTypeInput) journeyTypeInput.value = "regular";

  const departureLabel = form.querySelector("[data-transport-departure-label]");
  const arrivalLabel = form.querySelector("[data-transport-arrival-label]");
  const routeLabel = form.querySelector("[data-transport-line-label]");
  if (departureLabel) departureLabel.textContent = profile.departure || "上車站／起點";
  if (arrivalLabel) arrivalLabel.textContent = profile.arrival || "下車站／終點";
  if (routeLabel) routeLabel.textContent = profile.route || "路線名稱";
  if (form.elements.line) form.elements.line.placeholder = profile.routePlaceholder || "路線或交通名稱";

  if (mode === "walk") {
    const pair = itineraryAdjacentPairs(form.dataset.transportDate)[Number(form.elements.pairIndex?.value)];
    const estimate = estimatedWalkingMinutes(pair);
    if (durationInput && estimate && (refreshEstimate || durationInput.dataset.autoDuration === "true" || !durationInput.value)) {
      durationInput.value = estimate;
      durationInput.dataset.autoDuration = "true";
    }
    if (durationNote) durationNote.textContent = estimate ? "依兩地座標估計步行時間，可再手動微調。" : "尚無完整座標，請手動填入步行時間。";
  } else {
    if (durationInput?.dataset.autoDuration === "true" && refreshEstimate) durationInput.value = "";
    if (durationInput) durationInput.dataset.autoDuration = "false";
    if (durationNote) durationNote.textContent = "填入預估的移動時間。";
  }

  const scheduled = profile.ticket && journeyTypeInput?.value === "scheduled";
  form.classList.toggle("transport-simple-mode", !profile.line);
  scheduledFields?.classList.toggle("hidden", !scheduled);
  ticketButton?.classList.toggle("active", scheduled);
  ticketButton?.setAttribute("aria-pressed", String(Boolean(scheduled)));
  if (ticketButton) ticketButton.textContent = scheduled ? "✓ 已指定票券" : "＋ 指定票券";
  form.dataset.transportMode = mode;
  updateTransportFormValidation(form);
}

function openTransportSheet({ id = "", date = state.selectedDate, fromItemId = "", toItemId = "" } = {}) {
  ensureItineraryItemIds();
  reconcileTransportSegments(date);
  const existing = (state.transports || []).find((item) => item.id === id);
  const pairs = itineraryAdjacentPairs(date);
  const selectedPairIndex = Math.max(0, pairs.findIndex(({ from, to }) =>
    itineraryItemKey(from) === (existing?.fromItemId || fromItemId) &&
    itineraryItemKey(to) === (existing?.toItemId || toItemId),
  ));
  const transport = existing || {
    id: "",
    date,
    journeyType: "regular",
    mode: "walk",
    durationMinutes: "",
    departureStation: "",
    arrivalStation: "",
    line: "",
    serviceNumber: "",
    departureTime: "",
    arrivalTime: "",
    fare: "",
    ticketStatus: "尚未決定",
    travelers: [],
    bookingUrl: "",
    note: "",
  };
  const pairOptions = pairs.map(({ from, to }, index) =>
    `<option value="${index}" ${index === selectedPairIndex ? "selected" : ""}>${escapeHtml(itineraryItemLabel(from))} → ${escapeHtml(itineraryItemLabel(to))}</option>`,
  ).join("");
  const modeOptions = Object.entries(transportModes).map(([value, meta]) =>
    `<option value="${value}" ${transport.mode === value ? "selected" : ""}>${meta.icon} ${meta.label}</option>`,
  ).join("");
  const readonly = !canEdit();
  const disabled = readonly ? "disabled" : "";
  const travelerIds = new Set(Array.isArray(transport.travelers) ? transport.travelers : []);
  const travelerOptions = members().map((member) => `
    <label class="transport-traveler"><input type="checkbox" name="travelers" value="${escapeHtml(member.id)}" ${travelerIds.has(member.id) ? "checked" : ""} ${disabled} /><span>${avatarMarkup(member.id, true)}${escapeHtml(member.name)}</span></label>`).join("");
  const directionsUrl = existing ? transportDirectionsUrl(existing) : "";
  document.body.classList.add("transport-sheet-open");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop transport-backdrop" data-dismiss-sheet>
      <form class="modal-sheet transport-sheet" id="transport-form" data-transport-id="${escapeHtml(transport.id)}" data-transport-date="${escapeHtml(date)}">
        <div class="section-row transport-sheet-header"><div><p class="section-kicker">兩站之間</p><h2>${transport.id ? "交通安排" : "新增交通"}</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <div class="transport-sheet-body">
          ${transport.needsReview ? `<div class="transport-warning"><strong>交通待確認</strong><span>原本的兩站已不相鄰，請重新選擇連接位置。</span></div>` : ""}
          <div class="field"><label>連接哪兩個行程</label><select name="pairIndex" ${disabled}>${pairOptions}</select></div>
          <div class="field"><label>交通工具</label><select name="mode" data-transport-mode ${disabled}>${modeOptions}</select></div>
          <input type="hidden" name="journeyType" data-transport-kind value="${transport.journeyType === "scheduled" ? "scheduled" : "regular"}" />
          <div class="transport-ticket-control" data-transport-ticket-control>
            <span><strong>有固定班次或已購票？</strong><small>班次、票價與訂票連結需要時才展開。</small></span>
            <button type="button" data-toggle-transport-ticket aria-pressed="${transport.journeyType === "scheduled"}" ${disabled}>＋ 指定票券</button>
          </div>
          <div class="field-grid" data-transport-station-fields>
            <div class="field"><label data-transport-departure-label>上車站／起點</label><input name="departureStation" value="${escapeHtml(transport.departureStation)}" placeholder="新宿站" ${disabled} /></div>
            <div class="field"><label data-transport-arrival-label>下車站／終點</label><input name="arrivalStation" value="${escapeHtml(transport.arrivalStation)}" placeholder="澀谷站" ${disabled} /></div>
          </div>
          <div class="field-grid transport-primary-fields">
            <div class="field" data-transport-line-field><label data-transport-line-label>路線名稱</label><input name="line" value="${escapeHtml(transport.line)}" placeholder="JR 山手線" ${disabled} /></div>
            <div class="field transport-duration-field"><label>所需時間</label><div class="duration-input"><input name="durationMinutes" type="number" inputmode="numeric" min="1" max="1440" value="${escapeHtml(transport.durationMinutes)}" data-auto-duration="${!transport.id && transport.mode === "walk" ? "true" : "false"}" placeholder="18" ${disabled} /><span>分鐘</span></div><small class="field-note" data-transport-duration-note></small></div>
          </div>
          <div class="transport-scheduled-fields ${transport.journeyType === "scheduled" ? "" : "hidden"}">
            <div class="field"><label>班次／車次</label><input name="serviceNumber" value="${escapeHtml(transport.serviceNumber)}" placeholder="N'EX 22 號、NOZOMI 36" ${disabled} /></div>
            <div class="field-grid transport-time-grid"><div class="field"><label>出發時間</label><input name="departureTime" type="time" step="60" value="${escapeHtml(transport.departureTime)}" ${disabled} /></div><div class="field"><label>抵達時間</label><input name="arrivalTime" type="time" step="60" value="${escapeHtml(transport.arrivalTime)}" ${disabled} /></div></div>
            <p class="transport-time-window" data-transport-time-window>${escapeHtml(transportWindowLabel(pairs[selectedPairIndex]))}</p>
            <p class="transport-validation-message" data-transport-validation hidden></p>
            <div class="field-grid"><div class="field"><label>車資</label><input name="fare" value="${escapeHtml(transport.fare)}" placeholder="¥3,250" ${disabled} /></div><div class="field"><label>購票狀態</label><select name="ticketStatus" ${disabled}>${["尚未決定", "不需購票", "尚未購票", "已購票"].map((status) => `<option ${transport.ticketStatus === status ? "selected" : ""}>${status}</option>`).join("")}</select></div></div>
            <div class="field"><label>搭乘成員</label><div class="transport-travelers">${travelerOptions || `<span class="field-note">旅程目前沒有成員資料</span>`}</div></div>
            <div class="field"><label>訂票／憑證連結</label><input name="bookingUrl" type="url" value="${escapeHtml(transport.bookingUrl)}" placeholder="https://…" ${disabled} /></div>
          </div>
          <div class="field" data-transport-note-field><label>交通備註</label><textarea name="note" maxlength="500" placeholder="例如：從南口進站、需先劃位、行李較多…" ${disabled}>${escapeHtml(transport.note)}</textarea></div>
          ${directionsUrl ? `<button class="transport-google-button" type="button" data-open-transport-route="${escapeHtml(transport.id)}">在 Google Maps 查看路線 ↗</button>` : ""}
          ${transport.bookingUrl ? `<button class="transport-booking-button" type="button" data-open-booking-url="${escapeHtml(transport.id)}">開啟訂票／憑證連結 ↗</button>` : ""}
        </div>
        <div class="modal-actions transport-sheet-actions ${readonly ? "single-action" : ""}">
          ${readonly ? `<button class="secondary-button" type="button" data-close-sheet>關閉</button>` : `${transport.id ? `<button class="danger-button" type="button" data-request-delete-transport="${escapeHtml(transport.id)}">刪除</button>` : `<button class="secondary-button" type="button" data-close-sheet>取消</button>`}<button class="primary-button" type="submit" data-transport-save>儲存交通</button>`}
        </div>
      </form>
    </div>`;
  updateTransportFormMode(sheetRoot.querySelector("#transport-form"), { refreshEstimate: !transport.id });
}

function openTransportDeleteConfirmation(id) {
  const transport = (state.transports || []).find((item) => item.id === id);
  if (!transport) return;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="transport-delete-title">
        <div class="danger-mark">刪</div>
        <p class="section-kicker">刪除交通安排</p>
        <h2 id="transport-delete-title">確定刪除這段${escapeHtml(transportModeMeta(transport.mode).label)}？</h2>
        <p>${escapeHtml(transport.fromLabel || "起點")} → ${escapeHtml(transport.toLabel || "終點")}；景點本身不會被移除。</p>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="danger-button" type="button" data-confirm-delete-transport="${escapeHtml(id)}">確認刪除</button></div>
      </section>
    </div>`;
}

function openDeleteConfirmation({ kind, name, date = "", returnToDetails = false }) {
  const isPlace = kind === "place";
  const assignments = placeAssignments(name);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="danger-mark">刪</div>
        <p class="section-kicker">${isPlace ? "刪除收藏地點" : `${escapeHtml(date)} 行程`}</p>
        <h2 id="delete-title">確定要刪除「${escapeHtml(name)}」？</h2>
        <p>${
          isPlace
            ? assignments.length
              ? `這會同時移除收藏、推薦紀錄，以及已排入的 ${assignments.length} 天行程。`
              : "這會移除收藏與推薦紀錄。"
            : "只會從這一天的行程移除，地點仍保留在收藏清單中。"
        }</p>
        <div class="modal-actions">
          <button class="secondary-button" type="button" ${isPlace && returnToDetails ? `data-return-place="${escapeHtml(name)}"` : "data-close-sheet"}>取消</button>
          <button class="danger-button" type="button" data-confirm-delete="${kind}" data-delete-name="${escapeHtml(name)}" data-delete-date="${escapeHtml(date)}">確認刪除</button>
        </div>
      </section>
    </div>`;
}

function openMembershipConfirmation({ action, memberId = "", memberName = "" }) {
  const leaving = action === "leave";
  const remainingMembers = members().filter((member) => member.id !== currentMemberId());
  const isLastMember = leaving && remainingMembers.length === 0;
  const nextOwner = leaving && isTripOwner() ? remainingMembers[0] : null;
  const title = leaving ? `確定退出「${state.tripTitle}」？` : `確定移除「${memberName}」？`;
  const description = leaving
    ? isLastMember
      ? "你是這趟旅程的最後一位成員。退出後，旅程及邀請連結會一併刪除，且無法復原。"
      : nextOwner
        ? `退出後你將無法再查看或修改；旅程建立者會自動交接給「${nextOwner.name}」。`
        : "退出後這趟旅程會從你的清單移除；之後仍可用邀請碼重新加入。"
    : "移除後，對方會失去這趟旅程的查看與編輯權限；對方的推薦標記也會移除。";
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="membership-title">
        <div class="danger-mark">${leaving ? "退" : "移"}</div>
        <p class="section-kicker">${leaving ? "退出目前旅程" : "管理旅程成員"}</p>
        <h2 id="membership-title">${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
        <div class="modal-actions">
          <button class="secondary-button" type="button" data-close-sheet>取消</button>
          <button class="danger-button" type="button" data-confirm-membership="${action}" data-member-id="${escapeHtml(memberId)}" data-member-name="${escapeHtml(memberName)}">${leaving ? "確認退出" : "確認移除"}</button>
        </div>
      </section>
    </div>`;
}

function normalizeGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const hostAndPath = `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "")}`;
    const identityKey = ["query_place_id", "cid", "ftid", "query", "q"]
      .map((key) => [key, url.searchParams.get(key)])
      .find(([, parameter]) => parameter);
    return identityKey
      ? `${hostAndPath}?${identityKey[0]}=${String(identityKey[1]).normalize("NFKC").trim().toLowerCase()}`
      : hostAndPath;
  } catch {
    return "";
  }
}

function isGoogleMapsUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "maps.app.goo.gl" || host === "goo.gl" || host === "google.com" || host === "www.google.com" || host === "maps.google.com";
  } catch {
    return false;
  }
}

function googleMapsNavigationUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return isGoogleMapsUrl(url.toString()) && ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function placeNavigationUrl(place) {
  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);
  if (validMapCoordinates(latitude, longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }
  const address = String(place?.formattedAddress || "").normalize("NFKC").trim();
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return googleMapsNavigationUrl(place?.sourceUrl);
}

function isSocialPlaceUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ["instagram.com", "www.instagram.com", "threads.net", "www.threads.net", "threads.com", "www.threads.com", "abnb.me"].includes(host)
      || ["agoda.com", "booking.com", "airbnb.com", "airbnb.com.tw", "trip.com"].some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

function isLodgingShareUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "abnb.me" || ["agoda.com", "booking.com", "airbnb.com", "airbnb.com.tw", "trip.com"].some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

function placeReferenceMeta(place) {
  const value = String(place?.referenceUrl || "").trim();
  if (!value || isGoogleMapsUrl(value) || !isSocialPlaceUrl(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const platform = host.includes("instagram")
      ? "Instagram"
      : host.includes("threads")
        ? "Threads"
        : host.includes("agoda")
          ? "Agoda"
          : host.includes("booking")
            ? "Booking.com"
            : host.includes("airbnb") || host === "abnb.me"
              ? "Airbnb"
              : host.includes("trip.com")
                ? "Trip.com"
              : "";
    return platform ? { url: url.toString(), platform } : null;
  } catch {
    return null;
  }
}

function isMobileNavigationDevice() {
  const userAgent = String(navigator.userAgent || "");
  return /iphone|ipad|ipod|android/i.test(userAgent)
    || (/macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1);
}

function openGoogleMaps(value) {
  const url = googleMapsNavigationUrl(value);
  if (!url) return showToast("Google Maps 連結格式不正確");
  if (isMobileNavigationDevice()) return window.location.assign(url);
  const openedTab = window.open("about:blank", "_blank");
  if (!openedTab) return window.location.assign(url);
  try {
    openedTab.opener = null;
    openedTab.location.replace(url);
  } catch {
    try { openedTab.close(); } catch {}
    window.location.assign(url);
  }
}

function socialPlaceUrls(value) {
  return [...new Set((String(value).match(/https?:\/\/[^\s<>"']+/g) || [])
    .map((url) => url.replace(/[),，。]+$/, ""))
    .filter(isSocialPlaceUrl))].slice(0, 3);
}

function isShareTargetPath(value) {
  return /\/share-target\/?$/i.test(String(value || ""));
}

function shareTargetTextFromUrl(value) {
  let requestUrl;
  try {
    requestUrl = new URL(String(value || ""));
  } catch {
    return "";
  }
  if (!isShareTargetPath(requestUrl.pathname)) return "";
  const parts = [
    String(requestUrl.searchParams.get("share_title") || "").normalize("NFKC").trim().slice(0, 300),
    String(requestUrl.searchParams.get("share_text") || "").normalize("NFKC").trim().slice(0, 3000),
    String(requestUrl.searchParams.get("share_url") || "").trim().slice(0, 1000),
  ].filter(Boolean);
  const combined = [...new Set(parts)].join("\n");
  const sharedUrls = String(combined).match(/https?:\/\/[^\s<>"']+/g) || [];
  const hasSupportedLink = sharedUrls.some((url) => {
    const cleanUrl = url.replace(/[),，。]+$/, "");
    return isSocialPlaceUrl(cleanUrl) || isGoogleMapsUrl(cleanUrl);
  });
  return hasSupportedLink ? combined.slice(0, 4000) : "";
}

function explicitLodgingDetailsFromText(value) {
  const textValue = String(value || "").normalize("NFKC");
  const name = textValue.match(/(?:公寓|住宿|飯店|酒店|民宿)(?:名稱|名称)\s*[:：]\s*([^\r\n]{1,120})/iu)?.[1]?.trim() || "";
  const address = textValue.match(/(?:公寓|住宿|飯店|酒店|民宿)?地址\s*[:：]\s*([^\r\n]{4,260})/iu)?.[1]?.trim() || "";
  const bookingUrl = socialPlaceUrls(textValue).find(isLodgingShareUrl) || "";
  return { name, address, bookingUrl };
}

function lodgingAddressIdentity(value) {
  const textValue = String(value || "").normalize("NFKC");
  const postal = textValue.match(/(?:〒\s*)?(\d{3})\s*[-‐‑‒–—−ー－]\s*(\d{4})/u);
  const house = textValue.match(/(\d{1,4})\s*(?:丁目|chome)\s*[-‐‑‒–—−ー－]?\s*(\d{1,4})\s*[-‐‑‒–—−ー－]\s*(\d{1,4})/iu)
    || textValue.replace(/(?:〒\s*)?\d{3}\s*[-‐‑‒–—−ー－]\s*\d{4}/gu, " ").match(/(\d{1,4})\s*[-‐‑‒–—−ー－]\s*(\d{1,4})\s*[-‐‑‒–—−ー－]\s*(\d{1,4})/u);
  return postal && house ? `${postal[1]}${postal[2]}:${house[1]}-${house[2]}-${house[3]}` : "";
}

function mergeLodgingMapEvidence(entries, sourceText) {
  const details = explicitLodgingDetailsFromText(sourceText);
  if (!details.bookingUrl) return entries;
  const mapEntries = entries.filter((place) => !place.isSocialCandidate
    && isGoogleMapsUrl(place.sourceUrl)
    && validMapCoordinates(Number(place.latitude), Number(place.longitude)));
  if (!mapEntries.length) return entries;
  const explicitAddressKey = lodgingAddressIdentity(details.address);
  const socialLodgings = entries.filter((place) => place.isSocialCandidate && place.kind === "lodging");
  const preferredSocial = socialLodgings.find((place) => place.selected) || socialLodgings[0] || null;
  const matchingMap = mapEntries.find((place) => {
    const mapKey = lodgingAddressIdentity(place.formattedAddress || place.name);
    const socialKey = lodgingAddressIdentity(preferredSocial?.formattedAddress);
    return Boolean(mapKey && (mapKey === explicitAddressKey || mapKey === socialKey));
  }) || (mapEntries.length === 1 ? mapEntries[0] : null);
  if (!matchingMap) return entries;

  const name = details.name || preferredSocial?.name || matchingMap.name;
  let lodgingPlatform = "住宿平台";
  try {
    const lodgingHost = new URL(details.bookingUrl).hostname.toLowerCase();
    lodgingPlatform = lodgingHost.includes("agoda")
      ? "Agoda"
      : lodgingHost.includes("booking")
        ? "Booking.com"
        : lodgingHost.includes("airbnb") || lodgingHost === "abnb.me"
          ? "Airbnb"
          : lodgingHost.includes("trip.com")
            ? "Trip.com"
            : lodgingPlatform;
  } catch {}
  const merged = {
    ...(preferredSocial || matchingMap),
    name,
    fullName: name,
    category: "住宿地址座標",
    kind: "lodging",
    formattedAddress: details.address || matchingMap.formattedAddress || preferredSocial?.formattedAddress || "",
    sourceUrl: matchingMap.sourceUrl,
    referenceUrl: details.bookingUrl,
    sourcePlatform: lodgingPlatform,
    latitude: Number(matchingMap.latitude),
    longitude: Number(matchingMap.longitude),
    coordinateFallback: true,
    coordinateLocation: true,
    recognition: "complete",
    canImport: true,
    selected: preferredSocial ? true : undefined,
    isExisting: importAlreadyExists({ name, sourceUrl: matchingMap.sourceUrl }),
    description: `已將 ${lodgingPlatform} 住宿資料與你提供的 Google Maps 地址合併；請核對門牌後再加入。`,
  };
  const groupId = preferredSocial?.candidateGroupId;
  return [
    ...entries.filter((place) => place !== matchingMap && (!groupId || place.candidateGroupId !== groupId)),
    merged,
  ];
}

function samePlaceIdentity(first, second) {
  const firstPlaceId = String(first?.placeId || "").trim();
  const secondPlaceId = String(second?.placeId || "").trim();
  if (firstPlaceId && secondPlaceId) return firstPlaceId === secondPlaceId;
  const firstUrl = normalizeGoogleMapsUrl(first?.sourceUrl);
  const secondUrl = normalizeGoogleMapsUrl(second?.sourceUrl);
  if (firstUrl && secondUrl) return firstUrl === secondUrl;
  const firstName = String(first?.name || "").normalize("NFKC").trim().toLowerCase();
  const secondName = String(second?.name || "").normalize("NFKC").trim().toLowerCase();
  return Boolean(firstName && secondName && firstName === secondName);
}

function importAlreadyExists(place) {
  return state.places.some((existing) => samePlaceIdentity(existing, place));
}

function importCanBeAdded(place) {
  return Boolean(place?.canImport)
    && place?.recognition !== "unresolved"
    && !place?.candidateGroupSkipped
    && (!place?.isSocialCandidate || place.selected === true)
    && !importAlreadyExists(place);
}

function importCandidateSelectionMode(placeOrGroup) {
  const candidates = Array.isArray(placeOrGroup) ? placeOrGroup : [placeOrGroup];
  return candidates.some((place) => place?.candidateCategory === "lodging" || place?.kind === "lodging")
    ? "single"
    : "multiple";
}

function samePendingImportIdentity(first, second) {
  const firstPlaceId = String(first?.placeId || "").trim();
  const secondPlaceId = String(second?.placeId || "").trim();
  if (firstPlaceId && secondPlaceId && firstPlaceId === secondPlaceId) return true;
  const firstUrl = normalizeGoogleMapsUrl(first?.sourceUrl);
  const secondUrl = normalizeGoogleMapsUrl(second?.sourceUrl);
  return Boolean(firstUrl && secondUrl && firstUrl === secondUrl) || samePlaceIdentity(first, second);
}

function submittablePlaceImports(entries = pendingPlaceImports) {
  return entries.reduce((unique, place) => {
    if (!importCanBeAdded(place) || unique.some((candidate) => samePendingImportIdentity(candidate, place))) return unique;
    unique.push(place);
    return unique;
  }, []);
}

function validMapCoordinates(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90
    && Math.abs(longitude) <= 180
    && (Math.abs(latitude) > 0.000001 || Math.abs(longitude) > 0.000001);
}

function coordinatesFromText(value) {
  const text = String(value || "").normalize("NFKC");
  const decimal = text.match(/(-?\d{1,2}(?:\.\d+)?)\s*[,，]\s*(-?\d{1,3}(?:\.\d+)?)/u);
  if (decimal) {
    const latitude = Number(decimal[1]);
    const longitude = Number(decimal[2]);
    if (validMapCoordinates(latitude, longitude)) return { latitude, longitude };
  }
  const dms = [...text.matchAll(/(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NSEW])/giu)];
  if (dms.length >= 2) {
    const toDecimal = (match) => {
      const direction = match[4].toUpperCase();
      const decimalValue = Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
      return ["S", "W"].includes(direction) ? -decimalValue : decimalValue;
    };
    const latitudeMatch = dms.find((match) => ["N", "S"].includes(match[4].toUpperCase()));
    const longitudeMatch = dms.find((match) => ["E", "W"].includes(match[4].toUpperCase()));
    const latitude = latitudeMatch ? toDecimal(latitudeMatch) : NaN;
    const longitude = longitudeMatch ? toDecimal(longitudeMatch) : NaN;
    if (validMapCoordinates(latitude, longitude)) return { latitude, longitude };
  }
  return null;
}

function coordinatesFromGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const query = url.searchParams.get("query") || url.searchParams.get("q") || "";
    const dataCoordinates = `${url.pathname}${url.search}`.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/u);
    const pathCoordinates = url.pathname.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/u);
    return coordinatesFromText(query)
      || (dataCoordinates ? coordinatesFromText(`${dataCoordinates[1]},${dataCoordinates[2]}`) : null)
      || (pathCoordinates ? coordinatesFromText(`${pathCoordinates[1]},${pathCoordinates[2]}`) : null)
      || coordinatesFromText(decodeURIComponent(url.pathname.replaceAll("+", " ")));
  } catch {
    return null;
  }
}

function extractNameFromGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const queryName = url.searchParams.get("query") || url.searchParams.get("q");
    if (queryName) {
      const decoded = decodeURIComponent(queryName.replaceAll("+", " ")).trim();
      return coordinatesFromText(decoded) ? "" : decoded;
    }
    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch) {
      const decoded = decodeURIComponent(placeMatch[1].replaceAll("+", " ")).trim();
      return coordinatesFromText(decoded) ? "" : decoded;
    }
  } catch {
    return "";
  }
  return "";
}

function inferPlaceArea(name) {
  const areaNames = ["銀座", "新宿", "澀谷", "原宿", "淺草", "上野", "池袋", "大塚", "惠比壽", "代官山", "六本木", "台場", "東京站", "秋葉原", "吉祥寺", "中目黑"];
  return areaNames.find((area) => name.includes(area)) || "待確認區域";
}

function inferPlaceCategory(name) {
  const rules = [
    [/美術館|博物館|Museum/i, "博物館／美術館"],
    [/神社|寺|宮/, "寺廟／神社"],
    [/公園|庭園/, "公園／庭園"],
    [/水族館|Aquarium/i, "水族館"],
    [/塔|展望|Tower/i, "展望景點"],
    [/咖啡|珈琲|Cafe/i, "咖啡"],
    [/燒肉|焼肉|牛舌|牛たん|餐廳|食堂|小館|合菜|Restaurant|Steak/i, "餐廳"],
    [/百貨|商場|Market|Mall/i, "購物"],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || "景點";
}

function knownGooglePlace(value) {
  const normalized = normalizeGoogleMapsUrl(value);
  return fallbackPlaces
    .map((place) => ({ ...place, ...placeDetails[place.name] }))
    .find((place) => normalizeGoogleMapsUrl(place.sourceUrl) === normalized);
}

function googleMapsImportCandidates(value) {
  const lines = String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = [];
  let pendingLabel = "";
  const hasSupportedUrl = lines.some((line) => (line.match(/https?:\/\/[^\s<>"']+/g) || []).some((rawUrl) => isGoogleMapsUrl(rawUrl) || isSocialPlaceUrl(rawUrl)));

  lines.forEach((line, index) => {
    const urls = line.match(/https?:\/\/[^\s<>"']+/g) || [];
    if (!urls.length) {
      const nextLine = lines[index + 1] || "";
      if ((nextLine.match(/https?:\/\/[^\s<>"']+/g) || []).some(isGoogleMapsUrl)) {
        pendingLabel = line;
      } else if (!hasSupportedUrl) {
        candidates.push({ label: line, url: "" });
      }
      return;
    }

    const lineLabel = urls
      .reduce((label, rawUrl) => label.replace(rawUrl, ""), line)
      .replace(/^[\s•·\-*\d.)、]+/, "")
      .replace(/[|｜:：\-–—]+$/, "")
      .trim();
    urls.filter((rawUrl) => {
      try {
        const host = new URL(rawUrl).hostname.toLowerCase();
        return ["maps.app.goo.gl", "goo.gl", "google.com", "www.google.com", "maps.google.com"].includes(host);
      } catch {
        return false;
      }
    }).forEach((rawUrl, urlIndex) => {
      candidates.push({
        label: lineLabel || (urlIndex === 0 ? pendingLabel : ""),
        url: rawUrl.replace(/[),，。]+$/, ""),
      });
    });
    pendingLabel = "";
  });

  if (pendingLabel) candidates.push({ label: pendingLabel, url: "" });
  return candidates;
}

function parseGoogleMapsList(value) {
  const entries = [];
  const seen = new Set();
  googleMapsImportCandidates(value).forEach(({ label: lineName, url }) => {
    const known = url ? knownGooglePlace(url) : null;
    const coordinates = url ? coordinatesFromGoogleMapsUrl(url) : null;
    const parsedName = known?.name || lineName || extractNameFromGoogleMapsUrl(url);
    const displayName = parsedName || (coordinates ? "正在確認座標地址" : "正在辨識 Google Maps 地點");
    const identity = normalizeGoogleMapsUrl(url) || parsedName.toLowerCase();
    if (!identity || seen.has(identity)) return;
    seen.add(identity);
    const isExisting = importAlreadyExists({ name: parsedName, sourceUrl: url });
    const canImport = Boolean(parsedName || normalizeGoogleMapsUrl(url));
    entries.push({
      ...(known || {}),
      name: displayName,
      fullName: known?.fullName || displayName,
      category: known?.category || inferPlaceCategory(parsedName || ""),
      kind: known?.kind || inferPlaceKind(known?.category || inferPlaceCategory(parsedName || "")),
      area: known?.area || inferPlaceArea(parsedName || ""),
      sourceUrl:
        url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsedName)}`,
      swatch: known?.swatch || "#587a73",
      mark: known?.mark || (coordinates ? "⌖" : (parsedName || "?").slice(0, 1)),
      latitude: known?.latitude ?? coordinates?.latitude ?? null,
      longitude: known?.longitude ?? coordinates?.longitude ?? null,
      openingHours: known?.openingHours || "待 Google Maps 同步",
      phone: known?.phone || "待 Google Maps 同步",
      description:
        known?.description ||
        "這是從 Google Maps 清單匯入的地點，串接 Places API 後會自動補齊更多介紹。",
      highlights: known?.highlights || ["Google Maps 匯入"],
      galleryLabels: known?.galleryLabels || ["地點照片", "環境照片", "附近街景"],
      addedBy: currentMemberId(),
      addedByName: state.profile?.nickname || "我",
      isCustom: true,
      recognition: known ? "complete" : parsedName ? "partial" : "unresolved",
      coordinateLocation: Boolean(coordinates),
      isExisting,
      canImport,
    });
  });
  return entries;
}

function placeAreaFromAddress(address, fallbackName = "") {
  const district = String(address || "").match(/(?:縣|県|市|都|道|府)([\p{L}]{1,8}(?:區|区|鄉|郷|鎮|町|村))/u)?.[1];
  return district || inferPlaceArea(fallbackName);
}

function promoteSinglePlaceImport(entry, result) {
  if (!result || result.isList || entry.recognition === "complete") return entry;
  const sourceUrl = result.expandedUrl || entry.sourceUrl;
  const expandedName = extractNameFromGoogleMapsUrl(sourceUrl);
  const name = entry.recognition === "partial" && entry.name ? entry.name : expandedName;
  if (!name) return entry;
  const category = inferPlaceCategory(name);
  return {
    ...entry,
    name,
    fullName: name,
    category,
    kind: inferPlaceKind(category),
    area: inferPlaceArea(name),
    sourceUrl,
    mark: name.slice(0, 1),
    recognition: "partial",
    isExisting: importAlreadyExists({ name, sourceUrl }),
    canImport: true,
    globalSearch: true,
  };
}

async function expandGoogleMapsSharedLists(entries) {
  const urls = [...new Set(entries.map((place) => place.sourceUrl).filter(Boolean))].slice(0, 5);
  if (!urls.length) return entries;

  try {
    const response = await fetch("/api/place-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    if (!response.ok) return entries;
    const payload = await response.json();
    const listsByUrl = new Map(
      (payload.results || []).map((result) => [normalizeGoogleMapsUrl(result.requestUrl), result]),
    );

    return entries.flatMap((entry) => {
      const result = listsByUrl.get(normalizeGoogleMapsUrl(entry.sourceUrl));
      if (!result?.isList) return [promoteSinglePlaceImport(entry, result)];
      if (!Array.isArray(result.places) || !result.places.length) {
        const title = result.title || entry.name || "Google Maps";
        return [{
          ...entry,
          name: `「${title}」清單暫時無法讀取`,
          fullName: `「${title}」清單暫時無法讀取`,
          description: result.error || "請確認這是公開的 Google Maps 共用清單後再試一次。",
          mark: "?",
          recognition: "unresolved",
          canImport: false,
          isSharedList: true,
        }];
      }

      return result.places.map((rawPlace) => {
        const name = String(rawPlace.name || "").trim();
        const address = String(rawPlace.address || "").trim();
        const category = inferPlaceCategory(`${result.title || ""} ${name}`);
        const isExisting = importAlreadyExists({ name, sourceUrl: rawPlace.sourceUrl });
        return {
          name,
          fullName: name,
          category,
          kind: inferPlaceKind(category),
          area: placeAreaFromAddress(address, name),
          areaOriginal: placeAreaFromAddress(address, name),
          formattedAddress: address,
          sourceUrl: rawPlace.sourceUrl,
          swatch: "#587a73",
          mark: name.slice(0, 1) || "?",
          latitude: Number.isFinite(rawPlace.latitude) ? rawPlace.latitude : null,
          longitude: Number.isFinite(rawPlace.longitude) ? rawPlace.longitude : null,
          openingHours: "待 Google Maps 同步",
          phone: "待 Google Maps 同步",
          description: `從「${result.title || "Google Maps 共用清單"}」匯入，將由 Google Places 自動補齊資料。`,
          highlights: [result.title || "Google Maps 共用清單", "Google Maps 匯入"],
          galleryLabels: ["地點照片", "環境照片", "附近街景"],
          addedBy: currentMemberId(),
          addedByName: state.profile?.nickname || "我",
          isCustom: true,
          recognition: "partial",
          isExisting,
          canImport: Boolean(name),
          globalSearch: true,
          isSharedList: true,
          listTitle: result.title || "Google Maps 共用清單",
          listIndex: rawPlace.listIndex,
        };
      });
    });
  } catch {
    return entries;
  }
}

async function enrichPlaceImportsFromApi(entries) {
  const targets = entries.filter(
    (place) => !place.isExisting && place.canImport && place.recognition !== "complete",
  );
  if (!targets.length) return entries;

  try {
    const chunks = Array.from({ length: Math.ceil(targets.length / 10) }, (_, index) => targets.slice(index * 10, index * 10 + 10));
    const payloads = await Promise.all(chunks.map(async (chunk) => {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: chunk.map((place) => ({
            sourceUrl: place.sourceUrl,
            hintName: place.recognition === "unresolved" ? "" : place.name,
            globalSearch: place.globalSearch === true || place.recognition === "unresolved",
            latitude: place.latitude,
            longitude: place.longitude,
            destination: state.destination,
            countryCode: place.countryCode || "",
          })),
        }),
      });
      return response.ok ? response.json() : { places: [] };
    }));
    const resolvedByUrl = new Map(
      payloads.flatMap((payload) => payload.places || []).map((place) => [normalizeGoogleMapsUrl(place.requestUrl), place]),
    );

    return entries.map((place) => {
      const resolved = resolvedByUrl.get(normalizeGoogleMapsUrl(place.sourceUrl));
      if (!resolved || resolved.error || !resolved.name) return place;
      const isExisting = importAlreadyExists({
        name: resolved.name,
        placeId: resolved.placeId,
        sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
      });
      return {
        ...place,
        placeId: resolved.placeId || place.placeId,
        name: resolved.name,
        fullName: resolved.name,
        area: resolved.area || place.area,
        areaOriginal: resolved.areaOriginal || place.areaOriginal || place.area,
        areaResolvedByGoogle: resolved.areaResolvedByGoogle === true || place.areaResolvedByGoogle === true,
        travelAreaKey: resolved.travelAreaKey || place.travelAreaKey || "",
        travelAreaZh: resolved.travelAreaZh || place.travelAreaZh || "",
        travelAreaLocal: resolved.travelAreaLocal || place.travelAreaLocal || "",
        travelAreaResolved: resolved.travelAreaResolved === true,
        travelAreaSource: resolved.travelAreaSource || place.travelAreaSource || "automatic",
        travelAreaResolver: resolved.travelAreaResolver || place.travelAreaResolver || "",
        travelAreaResolutionVersion: Number(resolved.travelAreaResolutionVersion) || 0,
        administrativeAreas: resolved.administrativeAreas || place.administrativeAreas || null,
        countryCode: resolved.countryCode || place.countryCode || "",
        addressComponents: Array.isArray(resolved.addressComponents) ? resolved.addressComponents : place.addressComponents || [],
        addressComponentsOriginal: Array.isArray(resolved.addressComponentsOriginal) ? resolved.addressComponentsOriginal : place.addressComponentsOriginal || [],
        category: resolved.category || place.category,
        kind: inferPlaceKind(resolved.category || place.category),
        formattedAddress: resolved.formattedAddress || place.formattedAddress || "",
        sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
        latitude: Number.isFinite(resolved.latitude) ? resolved.latitude : place.latitude,
        longitude: Number.isFinite(resolved.longitude) ? resolved.longitude : place.longitude,
        openingHours: resolved.openingHours || place.openingHours,
        phone: resolved.phone || place.phone,
        photos: resolved.photos || place.photos || [],
        mark: resolved.name.slice(0, 1),
        description: `${resolved.name}位於${resolved.travelAreaZh || "待確認旅遊分區"}，由 Google Places 自動補齊地點資料。`,
        highlights: [resolved.category || "Google Maps 匯入", resolved.travelAreaZh || "待確認旅遊分區"],
        recognition: "complete",
        coordinateLocation: resolved.coordinateLocation === true || place.coordinateLocation === true,
        addressProvider: resolved.addressProvider || place.addressProvider || "",
        isExisting,
        canImport: true,
      };
    });
  } catch {
    return entries;
  }
}

function socialImportErrorMessage(error) {
  const code = String(error?.message || "");
  if (code === "SOURCE_CONTENT_REQUIRED") return "這篇貼文無法公開讀取，請上傳貼文截圖後再辨識。";
  if (code === "SOCIAL_MEDIA_SCREENSHOT_REQUIRED") return "貼文只公開了封面或部分內容，完整影片、輪播圖片與留言無法直接讀取；請上傳含店名的截圖後再辨識。";
  if (code === "PLACE_NOT_RECOGNIZED") return "AI 還無法確認貼文中的地點，請上傳更清楚的截圖後再試。";
  if (code === "GOOGLE_PLACE_NOT_FOUND") return "已讀到地點資訊，但目前無法建立可靠的地圖位置；請補上完整地址或 Google Maps 連結。";
  if (code === "LODGING_DETAILS_REQUIRED") return "住宿頁沒有公開足以確認的完整地址。請再貼上訂單／房東提供的地址或 Google Maps 連結；系統不會改抓附近餐廳。";
  if (code === "DAILY_RECOGNITION_LIMIT") return "今天的社群地點辨識次數已達上限，請稍後再試。";
  if (code === "AI_RECOGNITION_NOT_CONFIGURED") return "AI 辨識服務尚未啟用。";
  if (code === "PLACES_API_NOT_CONFIGURED") return "Google Places 服務尚未啟用。";
  if (code.startsWith("GOOGLE_PLACES_")) return "已辨識貼文內容，但 Google Maps 候選搜尋暫時失敗，請再試一次。";
  if (code.startsWith("OPENAI_402") || code.startsWith("OPENAI_429_INSUFFICIENT_QUOTA")) return "OpenAI API 額度不足，請補充額度後再試。";
  if (code.startsWith("OPENAI_429") || error?.status === 429) return "AI 辨識服務目前忙碌，請稍後再試。";
  return "社群貼文暫時無法辨識，請上傳截圖後重試。";
}

function socialGroupsToImports(payload, sourceIndex = 0, uploadedImageDataUrl = "") {
  const imports = (payload.groups || []).flatMap((group, groupIndex) => {
    const groupId = `social-${sourceIndex + 1}-${group.id || groupIndex + 1}`;
    const allSourceImages = uploadedImageDataUrl
      ? [uploadedImageDataUrl]
      : Array.isArray(payload.source?.imageUrls)
        ? payload.source.imageUrls
        : [];
    const requestedSourceImages = (Array.isArray(group.extracted?.sourceImageIndexes) ? group.extracted.sourceImageIndexes : [])
      .map((index) => allSourceImages[Number(index) - 1])
      .filter(Boolean);
    const sourceOriginalImages = requestedSourceImages.length ? requestedSourceImages : allSourceImages;
    const candidates = (group.candidates || []).map((candidate, candidateIndex) => ({
      ...candidate,
      addedBy: currentMemberId(),
      addedByName: state.profile?.nickname || "我",
      recognition: "complete",
      canImport: candidate.importEligible !== false && Boolean(candidate.name && candidate.sourceUrl),
      isExisting: importAlreadyExists(candidate),
      isSocialCandidate: true,
      candidateGroupId: groupId,
      candidateLabel: group.extracted?.name || candidate.name,
      candidateRank: Number(candidate.candidateRank) || candidateIndex + 1,
      candidateSearchQuery: group.extracted?.searchQuery || group.extracted?.nameOriginal || group.extracted?.nameZh || candidate.name,
      candidateSearchClues: group.extracted?.searchClues || "",
      candidateAddress: group.extracted?.address || "",
      candidateCity: group.extracted?.city || "",
      candidateArea: group.extracted?.area || "",
      candidateCountry: group.extracted?.country || "",
      candidateCategory: group.extracted?.category || candidate.kind || "attraction",
      candidateExcludedPlaceIds: [],
      candidateGroupSkipped: false,
      sourceOriginalText: payload.source?.originalText || "",
      sourceOriginalImages,
      sourceEvidence: candidate.sourceEvidence || group.extracted?.evidence || "",
      selected: false,
    }));
    const isLodgingGroup = group.extracted?.category === "lodging";
    const preferred = candidates.find((candidate) => candidate.canImport
      && !candidate.isExisting
      && (!isLodgingGroup || candidate.recommended === true));
    if (preferred) preferred.selected = true;
    return candidates;
  });
  const draft = payload.lodgingDraft && typeof payload.lodgingDraft === "object"
    ? { ...payload.lodgingDraft, id: `lodging-draft-${sourceIndex + 1}`, notice: payload.notice || "" }
    : null;
  return { imports, draft };
}

async function recognizeSocialPlace(sourceUrl, sharedText, imageDataUrl, sourceIndex, requestedKind = "auto") {
  const response = await fetch("/api/social-place-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tripId: state.tripId,
      sourceUrl,
      sharedText,
      imageDataUrl,
      requestedKind,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "SOCIAL_PLACE_RECOGNITION_FAILED");
    error.status = response.status;
    error.platform = payload.platform || "社群貼文";
    throw error;
  }
  return socialGroupsToImports(payload, sourceIndex, imageDataUrl);
}

function updateImportConfirmState() {
  const addableCount = submittablePlaceImports().length;
  const confirmButton = document.querySelector("[data-confirm-import]");
  if (confirmButton) {
    confirmButton.disabled = addableCount === 0;
    confirmButton.textContent = addableCount ? `加入已選 ${addableCount} 個地點` : "尚未選擇地點";
  }
}

function socialImportStats(entries) {
  const groups = new Map();
  let candidateCount = 0;
  entries.forEach((place) => {
    if (!place?.isSocialCandidate || !place.candidateGroupId) return;
    candidateCount += 1;
    if (!groups.has(place.candidateGroupId)) {
      groups.set(place.candidateGroupId, {
        candidateCount: 0,
        importable: false,
        selected: false,
        selectedCount: 0,
        skipped: false,
        selectionMode: importCandidateSelectionMode(place),
      });
    }
    const group = groups.get(place.candidateGroupId);
    group.candidateCount += 1;
    if (place.canImport && place.recognition !== "unresolved" && !importAlreadyExists(place)) group.importable = true;
    if (importCanBeAdded(place)) {
      group.selected = true;
      group.selectedCount += 1;
    }
    if (place.candidateGroupSkipped) group.skipped = true;
  });
  const values = [...groups.values()];
  return {
    groupCount: groups.size,
    candidateCount,
    importableGroupCount: values.filter((group) => group.importable).length,
    activeImportableGroupCount: values.filter((group) => group.importable && !group.skipped).length,
    selectedGroupCount: values.filter((group) => group.selected).length,
    selectedCandidateCount: values.reduce((sum, group) => sum + group.selectedCount, 0),
    skippedGroupCount: values.filter((group) => group.skipped).length,
    groups,
  };
}

function importCandidateIdentity(place) {
  return String(place?.placeId || place?.sourceUrl || "");
}

function renderImportPreview({ preserveScroll = false } = {}) {
  const preview = document.querySelector("#import-preview");
  if (!preview) return;
  const scrollTop = preserveScroll ? preview.scrollTop : 0;
  preview.innerHTML = importPreviewMarkup(pendingPlaceImports);
  if (preserveScroll) preview.scrollTop = scrollTop;
}

function selectImportCandidate(groupId, identity, checked = true) {
  const group = pendingPlaceImports.filter((place) => place.candidateGroupId === groupId);
  const target = group.find((place) => importCandidateIdentity(place) === identity);
  if (!target || !target.canImport || importAlreadyExists(target)) return;
  group.forEach((place) => { place.candidateGroupSkipped = false; });
  if (importCandidateSelectionMode(group) === "single") {
    group.forEach((place) => { place.selected = Boolean(checked) && place === target; });
  } else {
    target.selected = Boolean(checked);
  }
  renderImportPreview({ preserveScroll: true });
  updateImportConfirmState();
}

function setImportCandidateGroupSkipped(groupId, skipped) {
  const group = pendingPlaceImports.filter((place) => place.candidateGroupId === groupId);
  if (!group.length) return;
  group.forEach((place) => {
    place.candidateGroupSkipped = skipped;
    place.selected = false;
  });
  if (!skipped) {
    const lodgingGroup = group[0]?.candidateCategory === "lodging" || group[0]?.kind === "lodging";
    const preferred = group.find((place) => place.canImport
      && !importAlreadyExists(place)
      && (!lodgingGroup || place.recommended === true));
    if (preferred) preferred.selected = true;
  }
  renderImportPreview({ preserveScroll: true });
  updateImportConfirmState();
}

function closeImportRematchSheet() {
  sheetRoot.querySelector("[data-import-rematch-root]")?.remove();
}

function openImportRematchSheet(groupId) {
  const place = importSourcePlace(groupId);
  if (!place) return;
  closeImportRematchSheet();
  const query = place.candidateSearchQuery || place.candidateLabel || place.name;
  sheetRoot.insertAdjacentHTML("beforeend", `
    <div class="import-rematch-backdrop" data-import-rematch-root data-dismiss-import-rematch>
      <section class="modal-sheet import-rematch-sheet" role="dialog" aria-modal="true" aria-labelledby="import-rematch-title">
        <div class="section-row">
          <div><p class="section-kicker">只重搜這一個地點</p><h2 id="import-rematch-title">重新尋找正確地點</h2></div>
          <button class="icon-button" type="button" data-close-import-rematch aria-label="關閉重新搜尋">×</button>
        </div>
        <p class="import-rematch-copy">修改店名、分店或地址；其他已辨識地點不會重新處理，也不會再呼叫整篇 AI。</p>
        <label class="field" for="import-rematch-query"><span>店名、分店或地址</span><input id="import-rematch-query" type="text" value="${escapeHtml(query)}" maxlength="300" autocomplete="off" /></label>
        <p class="import-rematch-status" data-import-rematch-status>會排除剛才已顯示的錯誤候選，再找一批新的 Google Maps 結果。</p>
        <div class="modal-actions">
          <button class="secondary-button" type="button" data-close-import-rematch>取消</button>
          <button class="primary-button" type="button" data-run-import-rematch="${escapeHtml(groupId)}">重新搜尋</button>
        </div>
      </section>
    </div>`);
  window.setTimeout(() => sheetRoot.querySelector("#import-rematch-query")?.focus(), 0);
}

async function rematchImportCandidateGroup(groupId) {
  const root = sheetRoot.querySelector("[data-import-rematch-root]");
  const button = root?.querySelector("[data-run-import-rematch]");
  const status = root?.querySelector("[data-import-rematch-status]");
  const query = String(root?.querySelector("#import-rematch-query")?.value || "").normalize("NFKC").trim();
  const group = pendingPlaceImports.filter((place) => place.candidateGroupId === groupId);
  const source = group[0];
  if (!root || !button || !status || !source) return;
  if (!query) {
    status.textContent = "請輸入店名、分店或地址。";
    status.dataset.tone = "error";
    return;
  }
  button.disabled = true;
  button.textContent = "搜尋中…";
  status.textContent = "正在重新比對 Google Maps，只處理這一個地點…";
  delete status.dataset.tone;
  const excludedPlaceIds = [...new Set([
    ...(Array.isArray(source.candidateExcludedPlaceIds) ? source.candidateExcludedPlaceIds : []),
    ...group.map((place) => place.placeId).filter(Boolean),
  ])].slice(0, 20);
  try {
    const response = await fetch("/api/social-place-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rematch",
        tripId: state.tripId,
        query,
        requestedKind: ["attraction", "restaurant", "lodging", "shopping"].includes(source.candidateCategory) ? source.candidateCategory : source.kind,
        category: source.candidateCategory,
        address: source.candidateAddress,
        city: source.candidateCity,
        area: source.candidateArea,
        country: source.candidateCountry,
        searchClues: source.candidateSearchClues,
        evidence: source.sourceEvidence,
        sourceImageIndexes: source.sourceImageIndexes,
        sourceUrl: source.referenceUrl,
        sourcePlatform: source.sourcePlatform,
        sourceSummary: source.sourceSummary,
        excludePlaceIds,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "GOOGLE_PLACE_NOT_FOUND");
    const replacements = (payload.candidates || []).map((candidate, candidateIndex) => ({
      ...candidate,
      addedBy: currentMemberId(),
      addedByName: state.profile?.nickname || "我",
      recognition: "complete",
      canImport: candidate.importEligible !== false && Boolean(candidate.name && candidate.sourceUrl),
      isExisting: importAlreadyExists(candidate),
      isSocialCandidate: true,
      candidateGroupId: groupId,
      candidateLabel: query,
      candidateRank: Number(candidate.candidateRank) || candidateIndex + 1,
      candidateSearchQuery: query,
      candidateSearchClues: source.candidateSearchClues,
      candidateAddress: source.candidateAddress,
      candidateCity: source.candidateCity,
      candidateArea: source.candidateArea,
      candidateCountry: source.candidateCountry,
      candidateCategory: source.candidateCategory,
      candidateExcludedPlaceIds: excludedPlaceIds,
      candidateGroupSkipped: false,
      sourceOriginalText: source.sourceOriginalText,
      sourceOriginalImages: source.sourceOriginalImages,
      sourceEvidence: source.sourceEvidence,
      sourceImageIndexes: source.sourceImageIndexes,
      selected: false,
    }));
    if (!replacements.length) throw new Error("GOOGLE_PLACE_NOT_FOUND");
    const lodgingGroup = source.candidateCategory === "lodging" || source.kind === "lodging";
    const preferred = replacements.find((candidate) => candidate.canImport
      && !candidate.isExisting
      && (!lodgingGroup || candidate.recommended === true));
    if (preferred) preferred.selected = true;
    const firstIndex = pendingPlaceImports.findIndex((place) => place.candidateGroupId === groupId);
    pendingPlaceImports = pendingPlaceImports.filter((place) => place.candidateGroupId !== groupId);
    pendingPlaceImports.splice(Math.max(0, firstIndex), 0, ...replacements);
    closeImportRematchSheet();
    renderImportPreview({ preserveScroll: true });
    updateImportConfirmState();
    showToast(`已為「${query}」找到 ${replacements.length} 個新候選`);
  } catch (error) {
    status.textContent = String(error?.message || "").startsWith("GOOGLE_")
      ? "這次仍找不到新的吻合結果。可修改店名或地址再搜尋，也可返回後略過不加入。"
      : "重新搜尋暫時失敗，請稍後再試；你仍可略過這個地點。";
    status.dataset.tone = "error";
    button.disabled = false;
    button.textContent = "再搜尋一次";
  }
}

function closeImportCandidatePreview() {
  closeImportSourceImagePreview();
  closeImportSourcePreview();
  sheetRoot.querySelector("[data-import-candidate-preview-root]")?.remove();
}

function importSourcePlace(groupId) {
  return pendingPlaceImports.find((candidate) => candidate.isSocialCandidate && candidate.candidateGroupId === groupId);
}

function closeImportSourcePreview() {
  closeImportSourceImagePreview();
  sheetRoot.querySelector("[data-import-source-preview-root]")?.remove();
}

function closeImportSourceImagePreview() {
  sheetRoot.querySelector("[data-import-source-image-root]")?.remove();
}

function openImportSourceImagePreview(groupId, imageIndex) {
  const place = importSourcePlace(groupId);
  const images = Array.isArray(place?.sourceOriginalImages) ? place.sourceOriginalImages : [];
  const index = Number(imageIndex);
  const sourceImage = images[index];
  if (!sourceImage) return;
  closeImportSourceImagePreview();
  sheetRoot.insertAdjacentHTML("beforeend", `
    <div class="import-source-image-backdrop" data-import-source-image-root data-dismiss-import-source-image>
      <section class="import-source-image-sheet" role="dialog" aria-modal="true" aria-label="原貼文圖片 ${index + 1}">
        <button class="icon-button import-source-image-close" type="button" data-close-import-source-image aria-label="關閉原圖">×</button>
        <img src="${escapeHtml(sourceImage)}" alt="${escapeHtml(place.candidateLabel || place.name)} 原貼文圖片 ${index + 1}" />
        <span>原貼文圖片 ${index + 1} / ${images.length}</span>
      </section>
    </div>`);
}

function openImportSourcePreview(groupId) {
  const place = importSourcePlace(groupId);
  if (!place) return;
  const reference = placeReferenceMeta(place);
  closeImportSourcePreview();
  const images = Array.isArray(place.sourceOriginalImages) ? place.sourceOriginalImages : [];
  const imageMarkup = images.length
    ? `<div class="import-source-images" aria-label="原貼文相關圖片">${images.map((imageUrl, index) => `
        <button type="button" class="import-source-image-button" data-preview-import-source-image="${index}" data-source-group="${escapeHtml(groupId)}" aria-label="放大原貼文圖片 ${index + 1}">
          <img src="${escapeHtml(imageUrl)}" alt="原貼文圖片 ${index + 1}" loading="lazy" />
          <span>原圖 ${index + 1}</span>
        </button>`).join("")}</div>`
    : "";
  const originalText = place.sourceOriginalText
    ? `<section class="import-source-copy"><small>原文敘述</small><p>${escapeHtml(place.sourceOriginalText)}</p></section>`
    : "";
  const evidence = place.sourceEvidence
    ? `<section class="import-source-copy evidence"><small>AI 辨識線索</small><p>${escapeHtml(place.sourceEvidence)}</p></section>`
    : "";
  sheetRoot.insertAdjacentHTML("beforeend", `
    <div class="import-source-backdrop" data-import-source-preview-root data-dismiss-import-source>
      <section class="modal-sheet import-source-sheet" role="dialog" aria-modal="true" aria-labelledby="import-source-title">
        <div class="section-row">
          <div><p class="section-kicker">候選比對依據</p><h2 id="import-source-title">${escapeHtml(place.candidateLabel || place.name)}</h2></div>
          <button class="icon-button" type="button" data-close-import-source aria-label="關閉原始資料">×</button>
        </div>
        ${evidence}
        ${imageMarkup}
        ${originalText}
        ${reference ? `<button class="source-reference-button" type="button" data-open-reference="${escapeHtml(reference.url)}">開啟完整 ${escapeHtml(reference.platform)} 連結 ↗</button>` : ""}
      </section>
    </div>`);
}

function importCandidateGalleryMarkup(place) {
  if (place.photos?.length) {
    return place.photos.slice(0, 3).map((photo, index) => `
      <figure class="gallery-card gallery-${index + 1} real-photo">
        <img src="/api/place-photo?name=${encodeURIComponent(photo.name)}" alt="${escapeHtml(place.name)} Google Maps 照片" loading="lazy" />
        <figcaption>${escapeHtml(photo.attribution || "Google Maps 使用者")}</figcaption>
      </figure>`).join("");
  }
  return (place.galleryLabels || ["Google Maps 地點", "環境照片", "附近街景"]).map((label, index) => `
    <div class="gallery-card gallery-${index + 1}" style="--swatch:${place.swatch || "#587a73"}">
      <span>${escapeHtml(label)}</span>
    </div>`).join("");
}

function openImportCandidatePreview(identity) {
  const place = pendingPlaceImports.find((candidate) => importCandidateIdentity(candidate) === identity);
  if (!place) return;
  closeImportCandidatePreview();
  const rating = Number(place.rating) > 0
    ? `★ ${Number(place.rating).toFixed(1)}${Number(place.ratingCount) > 0 ? `（${Number(place.ratingCount).toLocaleString("zh-TW")} 則評價）` : ""}`
    : "尚無評分資料";
  const fullName = place.fullName && place.fullName !== place.name ? `<p class="place-byline">${escapeHtml(place.fullName)}</p>` : "";
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const mapPreview = validMapCoordinates(latitude, longitude)
    ? `<section class="import-location-preview" aria-label="${escapeHtml(place.name)}地圖位置"><iframe title="${escapeHtml(place.name)}地圖位置" src="https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=17&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><span>請用地圖與下方完整地址確認位置</span></section>`
    : "";
  const selectionMode = importCandidateSelectionMode(place);
  const selectLabel = selectionMode === "multiple"
    ? place.selected ? "取消選取" : "加入這個地點"
    : place.selected ? "✓ 已選擇這個住宿" : "選擇這個住宿";
  sheetRoot.insertAdjacentHTML("beforeend", `
    <div class="import-candidate-backdrop" data-import-candidate-preview-root data-dismiss-import-candidate>
      <section class="modal-sheet import-candidate-sheet" role="dialog" aria-modal="true" aria-labelledby="import-candidate-title">
        <div class="section-row">
          <div><p class="section-kicker">加入前確認 · 候選 ${Number(place.candidateRank) || 1}</p><h2 id="import-candidate-title">${escapeHtml(place.name)}</h2></div>
          <button class="icon-button" type="button" data-close-import-candidate aria-label="關閉候選預覽">×</button>
        </div>
        ${fullName}
        ${place.locationApproximate ? `<p class="coordinate-fallback-notice"><strong>這是住宿大約位置，不是入住地址</strong><span>Airbnb 等平台可能在預訂前隱藏門牌；預訂後請用房東提供的完整地址更新。</span></p>` : place.coordinateFallback ? `<p class="coordinate-fallback-notice"><strong>這是住宿地址座標</strong><span>Google Maps 沒有獨立住宿頁，請核對下方地址後再選擇。</span></p>` : ""}
        ${place.coordinateLocation && !place.coordinateFallback ? `<p class="coordinate-fallback-notice"><strong>這是地址座標，不是住宿名稱</strong><span>請核對地圖與完整地址；若要保留住宿名稱，請改貼 Booking、Agoda、Trip.com 或 Airbnb 原始連結。</span></p>` : ""}
        ${mapPreview}
        <div class="detail-gallery" aria-label="${escapeHtml(place.name)}照片預覽">${importCandidateGalleryMarkup(place)}</div>
        <div class="gallery-caption"><span>${place.photos?.length ? "Google Maps 地點照片" : "可到 Google Maps 查看更多照片"}</span><button type="button" data-open-maps="${escapeHtml(place.sourceUrl)}">查看完整地圖 ↗</button></div>
        <section class="import-candidate-facts" aria-label="候選地點資料">
          <div><small>類型</small><strong>${escapeHtml(place.category || kindLabel(place.kind))}</strong></div>
          <div><small>Google 評分</small><strong>${escapeHtml(rating)}</strong></div>
        </section>
        <section class="import-candidate-address"><small>完整地址</small><strong>${escapeHtml(place.formattedAddress || "Google Maps 尚未提供地址")}</strong></section>
        ${place.addressProvider === "OpenStreetMap" ? `<p class="import-address-attribution">地址資料 © OpenStreetMap contributors；請以住宿頁門牌為準。</p>` : ""}
        ${(place.sourceOriginalText || place.sourceOriginalImages?.length || place.sourceEvidence) ? `<button class="import-source-compare-button" type="button" data-preview-import-source="${escapeHtml(place.candidateGroupId)}">查看原文／原圖，比對這個候選</button>` : ""}
        ${place.description ? `<p class="place-description">${escapeHtml(place.description)}</p>` : ""}
        <section class="place-contact-grid" aria-label="營業與聯絡資訊">
          <div class="place-contact-item"><small>營業時間</small><strong>${formatOpeningHours(place.openingHours || "待 Google Maps 同步")}</strong></div>
          <div class="place-contact-item"><small>電話</small><strong>${escapeHtml(place.phone || "待 Google Maps 同步")}</strong></div>
        </section>
        <div class="modal-actions import-candidate-actions">
          <button class="secondary-button" type="button" data-close-import-candidate>返回候選</button>
          ${place.isSocialCandidate ? `<button class="primary-button" type="button" data-select-import-candidate="${escapeHtml(identity)}" data-candidate-group="${escapeHtml(place.candidateGroupId)}" data-candidate-checked="${place.selected ? "false" : "true"}">${selectLabel}</button>` : `<button class="primary-button" type="button" data-close-import-candidate>確認位置後返回</button>`}
        </div>
      </section>
    </div>`);
}

function lodgingDraftsMarkup() {
  return pendingLodgingDrafts.map((draft, index) => {
    const approximate = draft.locationPrecision === "approximate";
    const image = draft.sourceImageDataUrl
      ? `<img src="${escapeHtml(draft.sourceImageDataUrl)}" alt="${escapeHtml(draft.sourceLodgingName || "住宿")}來源照片" />`
      : `<span aria-hidden="true">住</span>`;
    const address = draft.address
      ? `<small>${escapeHtml(draft.address)}</small>`
      : `<small class="missing">尚未取得入住地址，建立前必須補上</small>`;
    return `<article class="lodging-draft-card">
      <div class="lodging-draft-photo">${image}</div>
      <div class="lodging-draft-copy">
        <span>${escapeHtml(draft.sourcePlatform || "住宿平台")}來源資料</span>
        <strong>${escapeHtml(draft.sourceLodgingName || "住宿名稱待補")}</strong>
        ${address}
      </div>
      ${approximate ? `<p class="coordinate-fallback-notice"><strong>這是住宿大約位置，不是入住地址</strong><span>建立前請使用房東或訂單提供的完整地址。</span></p>` : ""}
      ${draft.notice ? `<p class="lodging-draft-notice">${escapeHtml(draft.notice)}</p>` : ""}
      <button class="primary-button" type="button" data-create-lodging-draft="${index}">自行建立住宿</button>
    </article>`;
  }).join("");
}

function importPreviewMarkup(entries) {
  const lodgingDraftMarkup = lodgingDraftsMarkup();
  if (!entries.length && !pendingLodgingDrafts.length) {
    return `${pendingPlaceImportNotice ? `<p class="import-feedback error">${escapeHtml(pendingPlaceImportNotice)}</p>` : ""}<div class="import-empty"><strong>沒有找到可辨識的內容</strong><span>請貼上 Google Maps、住宿平台或社群貼文連結，也可上傳截圖。</span></div>`;
  }
  if (!entries.length) {
    return `${pendingPlaceImportNotice ? `<p class="import-feedback error">${escapeHtml(pendingPlaceImportNotice)}</p>` : ""}${lodgingDraftMarkup}<div class="import-empty"><strong>沒有可靠的 Google Maps 配對</strong><span>可用上方來源資料自行建立住宿，不會改選附近飯店。</span></div>`;
  }
  const socialStats = socialImportStats(entries);
  const seenCandidateGroups = new Set();
  let groupNumber = 0;
  const rows = entries
    .map((place) => {
      const isExisting = importAlreadyExists(place);
      const status = isExisting
        ? ["duplicate", "已在收藏"]
        : place.recognition === "complete"
          ? ["complete", "資料已辨識"]
          : place.canImport
            ? ["partial", "基本資料已辨識"]
            : ["unresolved", "需要 Places API"];
      const rating = Number(place.rating) > 0 ? ` · ★ ${Number(place.rating).toFixed(1)}` : "";
      const socialMeta = place.isSocialCandidate
        ? `<span>${escapeHtml(place.formattedAddress || `${place.area} · ${place.category}`)}</span><small>${escapeHtml(place.sourcePlatform || "社群貼文")}候選 ${place.candidateRank}${rating}</small>`
        : `<span>${escapeHtml(place.area)} · ${escapeHtml(place.category)}</span><small>${escapeHtml(place.openingHours)}</small>`;
      const selectionMode = importCandidateSelectionMode(place);
      const inputType = selectionMode === "multiple" ? "checkbox" : "radio";
      const unavailable = isExisting || !place.canImport || place.recognition === "unresolved";
      const radio = place.isSocialCandidate
        ? `<input class="import-candidate-control" type="${inputType}" name="${escapeHtml(place.candidateGroupId)}" data-social-place-candidate="${escapeHtml(importCandidateIdentity(place))}" data-candidate-group="${escapeHtml(place.candidateGroupId)}" ${place.selected ? "checked" : ""} ${unavailable ? "disabled" : ""} aria-label="${place.selected ? "取消選取" : "選擇"} ${escapeHtml(place.name)}" />`
        : "";
      const previewable = place.isSocialCandidate || validMapCoordinates(Number(place.latitude), Number(place.longitude)) || Boolean(place.formattedAddress);
      const copy = previewable
        ? `<button class="import-place-copy import-candidate-copy" type="button" data-preview-import-candidate="${escapeHtml(importCandidateIdentity(place))}" aria-label="查看 ${escapeHtml(place.name)} 詳細資料"><strong>${escapeHtml(place.name)}</strong>${socialMeta}</button>`
        : `<div class="import-place-copy"><strong>${escapeHtml(place.name)}</strong>${socialMeta}</div>`;
      const previewTarget = previewable
        ? ` data-preview-import-candidate="${escapeHtml(importCandidateIdentity(place))}"`
        : "";
      let groupHeader = "";
      if (place.isSocialCandidate && !seenCandidateGroups.has(place.candidateGroupId)) {
        seenCandidateGroups.add(place.candidateGroupId);
        groupNumber += 1;
        const groupState = socialStats.groups.get(place.candidateGroupId);
        const groupCandidateCount = groupState?.candidateCount || 1;
        groupHeader = `
          <div class="import-candidate-group-label ${groupState?.skipped ? "skipped" : ""}">
            <span>辨識地點 ${groupNumber}</span>
            <strong>${escapeHtml(place.candidateLabel || place.name)}</strong>
            <small>${groupState?.skipped ? "已略過，不會加入旅程" : `${groupCandidateCount} 個 Google Maps 候選 · ${groupState?.selectionMode === "multiple" ? "可複選或略過" : "可擇一或略過"}`}</small>
            <div class="import-candidate-group-actions">
              <button type="button" data-preview-import-source="${escapeHtml(place.candidateGroupId)}">原文／原圖</button>
              <button type="button" data-rematch-import-group="${escapeHtml(place.candidateGroupId)}">重新搜尋</button>
              <button type="button" data-skip-import-group="${escapeHtml(place.candidateGroupId)}" data-skip-value="${groupState?.skipped ? "false" : "true"}">${groupState?.skipped ? "取消略過" : "略過不加"}</button>
            </div>
          </div>`;
        if (groupState?.skipped) {
          return `${groupHeader}<div class="import-candidate-skipped"><strong>這個地點已取消</strong><span>不必從錯誤候選中選擇；其他地點仍可正常加入。</span></div>`;
        }
      }
      if (place.candidateGroupSkipped) return "";
      return `
        ${groupHeader}
        <article class="import-place-row ${place.isSocialCandidate ? "social-candidate" : ""} ${place.selected ? "selected" : ""} ${status[0]}"${previewTarget}>
          ${radio}
          <span class="mini-thumb" style="--swatch:${place.swatch}">${escapeHtml(place.mark)}</span>
          ${copy}
          ${previewable ? `<span class="import-open-hint" aria-hidden="true">查看 ›</span>` : `<b>${status[1]}</b>`}
        </article>`;
    })
    .join("");
  const addableCount = submittablePlaceImports(entries).length;
  const socialSummary = socialStats.groupCount
    ? `<div class="import-group-summary"><strong>辨識到 ${socialStats.groupCount} 個來源地點，${socialStats.candidateCount} 個候選，已選 ${addableCount}</strong></div>`
    : "";
  const summary = socialStats.groupCount
    ? ""
    : `可新增 ${addableCount} 個地點；重複項目會自動略過。`;
  return `${pendingPlaceImportNotice ? `<p class="import-feedback error">${escapeHtml(pendingPlaceImportNotice)}</p>` : ""}${lodgingDraftMarkup}${socialSummary}${rows}${summary ? `<p class="import-summary">${summary}</p>` : ""}`;
}

function updateImportSourceSummary(form = document.querySelector("#import-places-form")) {
  if (!form) return;
  const summary = form.querySelector("[data-import-source-summary]");
  if (!summary) return;
  const hasText = Boolean(String(form.elements.mapsList?.value || "").trim());
  const sources = [hasText ? "已填入來源" : "", pendingPlaceImportScreenshot ? "已加入圖片" : ""].filter(Boolean);
  summary.textContent = form.dataset.importState === "results"
    ? `${sources.join("、") || "辨識資料已準備"}，可展開修改或重新辨識`
    : sources.join("、") || "貼上連結或加入圖片";
}

function setImportSheetState(nextState) {
  const form = document.querySelector("#import-places-form");
  if (!form) return;
  form.dataset.importState = nextState;
  form.setAttribute("aria-busy", nextState === "loading" ? "true" : "false");
  const tools = form.querySelector("[data-import-source-tools]");
  if (tools && nextState === "results") tools.open = false;
  if (tools && (nextState === "input" || nextState === "input-error")) tools.open = true;
  updateImportSourceSummary(form);
}

function openAddPlaceSheet({ initialText = "", autoAnalyze = false } = {}) {
  pendingPlaceImports = [];
  pendingLodgingDrafts = [];
  pendingPlaceImportScreenshot = "";
  pendingPlaceImportNotice = "";
  const fromShareTarget = Boolean(initialText);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop import-places-backdrop" data-dismiss-sheet>
      <form class="modal-sheet import-places-sheet" id="import-places-form" data-import-state="input" aria-busy="false">
        <div class="section-row">
          <div><p class="section-kicker">${fromShareTarget ? "從系統分享收到" : "地點匯入"}</p>${fromShareTarget ? "<h2>確認分享地點</h2>" : "<h2>新增地點</h2>"}</div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <details class="import-source-tools" data-import-source-tools open>
          <summary><span>匯入來源</span><small data-import-source-summary>${initialText ? "已填入來源" : "貼上連結或加入圖片"}</small></summary>
          <div class="import-source-tools-body">
            <div class="field"><label for="import-place-kind">加入哪一類</label><select id="import-place-kind" name="placeKind"><option value="auto">依 Google Maps 自動判斷</option><option value="attraction">景點</option><option value="restaurant">餐廳</option><option value="lodging">住宿</option><option value="shopping">購物</option></select></div>
            <div class="field">
              <label for="google-maps-list">貼上連結</label>
              <textarea id="google-maps-list" name="mapsList" rows="2" placeholder="Google Maps、Agoda、Booking.com、Trip.com、Airbnb 或社群連結">${escapeHtml(initialText)}</textarea>
              <p class="field-hint">訂房平台常擋住自動讀取。住宿請連同房東訊息或訂單確認信一起貼上（含「公寓名稱：…」「地址：…」），才能用正確名稱與門牌定位。</p>
            </div>
            <label class="social-screenshot-picker social-screenshot-picker-standalone" for="social-place-screenshot"><span>截圖／照片</span><small data-social-screenshot-status>尚未選擇</small></label>
            <input class="visually-hidden" id="social-place-screenshot" type="file" accept="image/jpeg,image/png,image/webp" data-social-place-screenshot />
            <button class="analyze-button" type="button" data-analyze-places>⌁　辨識地點</button>
          </div>
        </details>
        <button class="manual-place-entry" type="button" data-manual-place><span>找不到正確地點？</span><strong>手動新增住宿／自訂地點</strong><small>名稱、完整地址、Maps 連結與照片都由你確認</small></button>
        <div id="import-preview" class="import-preview" aria-live="polite"></div>
        <div class="modal-actions import-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit" data-confirm-import disabled>尚未選擇地點</button></div>
      </form>
    </div>`;
  if (autoAnalyze) {
    const analyzeButton = sheetRoot.querySelector("[data-analyze-places]");
    window.setTimeout(() => analyzePlaceImportSheet(analyzeButton), 0);
  }
}

function manualPlaceSeed(value = "") {
  const lines = String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const urls = lines.flatMap((line) => line.match(/https?:\/\/[^\s<>"']+/g) || []);
  const sourceUrl = urls.find(isGoogleMapsUrl) || "";
  const referenceUrl = urls.find(isLodgingShareUrl) || "";
  const reference = placeReferenceMeta({ referenceUrl });
  const textLines = lines.map((line) => urls.reduce((text, url) => text.replace(url, ""), line).trim()).filter(Boolean);
  const labelledName = textLines.map((line) => line.match(/^(?:公寓|住宿|飯店|酒店|民宿|房源)名稱\s*[：:]\s*(.+)$/u)?.[1]).find(Boolean) || "";
  const labelledAddress = textLines.map((line) => line.match(/^(?:公寓|住宿|飯店|酒店|民宿|房源)?地址\s*[：:]\s*(.+)$/u)?.[1]).find(Boolean) || "";
  const address = labelledAddress || textLines.find((line) => /\d/.test(line) && /(?:縣|県|市|區|区|町|村|路|街|丁目|番|號|号)/u.test(line)) || "";
  return { name: labelledName, address, sourceUrl, referenceUrl, sourcePlatform: reference?.platform || "" };
}

async function compressPlacePhoto(file) {
  const source = await imageFileDataUrl(file);
  return compressPlacePhotoDataUrl(source);
}

async function compressPlacePhotoDataUrl(source) {
  const image = await loadImageElement(source);
  const canvas = document.createElement("canvas");
  const drawAtMaxEdge = (maxEdge) => {
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  drawAtMaxEdge(1200);
  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 240000 && quality > 0.5) {
    quality -= 0.07;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > 250000) {
    drawAtMaxEdge(900);
    dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  }
  if (dataUrl.length > 260000) throw new Error("IMAGE_TOO_COMPLEX");
  return dataUrl;
}

function renderPlacePhotoEditor(form) {
  if (!form) return;
  const existing = state.places.find((place) => place.name === form.dataset.originalPlaceName);
  const photo = pendingPlacePhoto || (!removePendingPlacePhoto ? existing?.customPhotoDataUrl || "" : "");
  const preview = form.querySelector("[data-place-photo-preview]");
  const removeButton = form.querySelector("[data-remove-place-photo]");
  const status = form.querySelector("[data-place-photo-status]");
  if (preview) {
    preview.classList.toggle("has-photo", Boolean(photo));
    preview.innerHTML = photo
      ? `<img src="${escapeHtml(photo)}" alt="地點照片預覽" />`
      : `<span aria-hidden="true">▧</span><strong>加入一張你認得的照片</strong><small>可用房東照片、建築外觀或門口照片</small>`;
  }
  if (removeButton) removeButton.hidden = !photo;
  if (status) status.textContent = photo ? "這張照片會顯示在地點詳情與地圖預覽" : "照片會壓縮後與旅伴共用";
}

function openPlaceEditSheet(name = "", seed = {}) {
  const existing = name ? state.places.find((place) => place.name === name) : null;
  if (name && !existing) return showToast("找不到這個地點");
  pendingPlacePhoto = String(seed.customPhotoDataUrl || "");
  removePendingPlacePhoto = false;
  const kind = seed.kind && seed.kind !== "auto" ? seed.kind : existing?.kind || "lodging";
  const address = seed.address || existing?.formattedAddress || "";
  const sourceUrl = seed.sourceUrl || existing?.sourceUrl || "";
  const displayName = seed.name || existing?.name || (kind === "lodging" ? "私人住宿" : "");
  const category = existing?.category || (kind === "lodging" ? "私人住宿" : kindLabel(kind));
  const referenceUrl = seed.referenceUrl || existing?.referenceUrl || "";
  const sourcePlatform = seed.sourcePlatform || existing?.sourcePlatform || placeReferenceMeta({ referenceUrl })?.platform || "";
  const sourceLodgingName = seed.sourceLodgingName || existing?.sourceLodgingName || displayName;
  const sourceListingId = seed.sourceListingId || existing?.sourceListingId || "";
  const photoOrigin = seed.photoOrigin || existing?.photoOrigin || (pendingPlacePhoto ? "lodging_source" : "user_upload");
  const sourceReference = placeReferenceMeta({ referenceUrl });
  const editorPhoto = pendingPlacePhoto || existing?.customPhotoDataUrl || "";
  if (existing) ensureTravelAreaFields(existing);
  const manualTravelArea = existing?.travelAreaSource === "manual" || existing?.travelAreaManuallySet === true;
  const travelAreaZh = manualTravelArea ? existing.travelAreaZh : "";
  const travelAreaLocal = manualTravelArea ? existing.travelAreaLocal : "";
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet place-editor-sheet" id="place-editor-form" data-original-place-name="${escapeHtml(existing?.name || "")}" data-original-address="${escapeHtml(existing?.formattedAddress || "")}">
        <div class="section-row">
          <div><p class="section-kicker">${existing ? "地點資料" : "不依賴商家搜尋"}</p><h2>${existing ? "編輯地點" : "手動新增地點"}</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p class="place-editor-intro">私人住宿不一定有 Google 商家頁面。這裡會用門牌定位，名稱、地址與照片則以你填寫的內容為準。</p>
        <input type="hidden" name="referenceUrl" value="${escapeHtml(referenceUrl)}" />
        <input type="hidden" name="sourcePlatform" value="${escapeHtml(sourcePlatform)}" />
        <input type="hidden" name="sourceLodgingName" value="${escapeHtml(sourceLodgingName)}" />
        <input type="hidden" name="sourceListingId" value="${escapeHtml(sourceListingId)}" />
        <input type="hidden" name="photoOrigin" value="${escapeHtml(photoOrigin)}" />
        ${sourceReference ? `<div class="lodging-source-reference"><span>原始住宿來源</span><strong>${escapeHtml(sourceReference.platform)}</strong><button type="button" data-open-reference="${escapeHtml(sourceReference.url)}">開啟原始網址 ↗</button></div>` : ""}
        <div class="place-editor-grid">
          <div class="field full"><label for="place-editor-name">顯示名稱</label><input id="place-editor-name" name="name" maxlength="100" value="${escapeHtml(displayName)}" placeholder="例如：江之島私人住宿" required /></div>
          <div class="field"><label for="place-editor-kind">類型</label><select id="place-editor-kind" name="kind"><option value="lodging" ${kind === "lodging" ? "selected" : ""}>住宿</option><option value="attraction" ${kind === "attraction" ? "selected" : ""}>景點</option><option value="restaurant" ${kind === "restaurant" ? "selected" : ""}>餐廳</option><option value="shopping" ${kind === "shopping" ? "selected" : ""}>購物</option></select></div>
          <div class="field"><label for="place-editor-category">分類</label><input id="place-editor-category" name="category" maxlength="60" value="${escapeHtml(category)}" placeholder="例如：私人住宿" /></div>
          <div class="field full"><label for="place-editor-address">完整地址</label><textarea id="place-editor-address" name="address" maxlength="300" rows="3" placeholder="請貼上房東提供的完整門牌地址" required>${escapeHtml(address)}</textarea><small>儲存時會以地址定位，不會改抓附近的餐廳或商店。</small><small class="field-error" data-place-address-error hidden></small></div>
          <div class="field full"><label for="place-editor-url">Google Maps 連結（選填）</label><input id="place-editor-url" name="sourceUrl" inputmode="url" maxlength="500" value="${escapeHtml(sourceUrl)}" placeholder="https://maps.app.goo.gl/…" /></div>
          <div class="field"><label for="place-editor-travel-area-zh">旅遊分區（繁中，選填）</label><input id="place-editor-travel-area-zh" name="travelAreaZh" maxlength="60" value="${escapeHtml(travelAreaZh)}" placeholder="例如：淺草" /></div>
          <div class="field"><label for="place-editor-travel-area-local">旅遊分區（當地語言）</label><input id="place-editor-travel-area-local" name="travelAreaLocal" maxlength="60" value="${escapeHtml(travelAreaLocal)}" placeholder="例如：浅草" /></div>
          <div class="field full"><small>${existing ? `目前顯示：${escapeHtml(travelAreaDisplayName(existing))}。` : "留空時會依完整地址自動辨識。"} 兩欄都填寫即視為手動指定，之後不會被自動辨識覆蓋。</small></div>
        </div>
        <section class="place-photo-editor">
          <div class="place-photo-preview ${editorPhoto ? "has-photo" : ""}" data-place-photo-preview>${editorPhoto ? `<img src="${escapeHtml(editorPhoto)}" alt="${escapeHtml(displayName)}地點照片" />` : `<span aria-hidden="true">▧</span><strong>加入一張你認得的照片</strong><small>可用房東照片、建築外觀或門口照片</small>`}</div>
          <div class="place-photo-actions"><label class="secondary-button" for="place-photo-input">${editorPhoto ? "更換照片" : "從相簿或相機選擇"}</label><input class="visually-hidden" id="place-photo-input" type="file" accept="image/*" data-place-photo-input /><button type="button" data-remove-place-photo ${editorPhoto ? "" : "hidden"}>移除照片</button></div>
          <small data-place-photo-status>${editorPhoto ? (photoOrigin === "lodging_source" ? "已帶入原住宿頁的照片，儲存時會壓縮保留" : "這張照片會顯示在地點詳情與地圖預覽") : "照片會壓縮後與旅伴共用"}</small>
        </section>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">${existing ? "儲存變更" : "確認新增"}</button></div>
      </form>
    </div>`;
}

function renamePlaceReferences(previousName, nextName) {
  if (!previousName || previousName === nextName) return;
  if (state.votes[previousName]) {
    state.votes[nextName] = state.votes[previousName];
    delete state.votes[previousName];
  }
  Object.values(state.itinerary || {}).forEach((items) => items.forEach((item) => {
    if (item.name === previousName) item.name = nextName;
  }));
  (state.transports || []).forEach((transport) => {
    if (transport.fromLabel === previousName) transport.fromLabel = nextName;
    if (transport.toLabel === previousName) transport.toLabel = nextName;
  });
  if (state.selectedMapPlace === previousName) state.selectedMapPlace = nextName;
}

function maybeOpenShareTargetImport() {
  if (!pendingShareTargetText || !canEdit()) return false;
  const sharedText = pendingShareTargetText;
  pendingShareTargetText = "";
  sessionStorage.removeItem(shareTargetSessionKey);
  state.activeTab = "places";
  state.placesMode = "list";
  render();
  openAddPlaceSheet({ initialText: sharedText, autoAnalyze: true });
  return true;
}

async function analyzePlaceImportSheet(analyzePlaces) {
  const textarea = document.querySelector("#google-maps-list");
  const preview = document.querySelector("#import-preview");
  if (!analyzePlaces || !textarea || !preview) return;
  setImportSheetState("loading");
  analyzePlaces.disabled = true;
  analyzePlaces.textContent = "正在理解連結與地點…";
  preview.innerHTML = `<div class="import-empty loading"><strong>正在辨識</strong><span>正在理解連結內容，再比對 Google Maps 候選。</span></div>`;
  pendingPlaceImports = [];
  pendingLodgingDrafts = [];
  pendingPlaceImportNotice = "";
  updateImportConfirmState();
  const notices = [];
  try {
    pendingPlaceImports = parseGoogleMapsList(textarea.value);
    pendingPlaceImports = await expandGoogleMapsSharedLists(pendingPlaceImports);
    pendingPlaceImports = await enrichPlaceImportsFromApi(pendingPlaceImports);
    const mapImports = [...pendingPlaceImports];

    const socialUrls = socialPlaceUrls(textarea.value);
    const requestedKind = String(document.querySelector("#import-place-kind")?.value || "auto");
    const socialSources = socialUrls.length
      ? socialUrls
      : pendingPlaceImportScreenshot
        ? [""]
        : [];
    for (let sourceIndex = 0; sourceIndex < socialSources.length; sourceIndex += 1) {
      try {
        const sourceRequestedKind = requestedKind === "auto" && isLodgingShareUrl(socialSources[sourceIndex]) ? "lodging" : requestedKind;
        const socialResult = await recognizeSocialPlace(
          socialSources[sourceIndex],
          textarea.value,
          sourceIndex === 0 ? pendingPlaceImportScreenshot : "",
          sourceIndex,
          sourceRequestedKind,
        );
        pendingPlaceImports.push(...socialResult.imports);
        if (socialResult.draft) pendingLodgingDrafts.push(socialResult.draft);
      } catch (error) {
        notices.push(socialImportErrorMessage(error));
      }
    }
    pendingPlaceImports = mergeLodgingMapEvidence(pendingPlaceImports, textarea.value);
    if (pendingPlaceImports.some((place) => place.kind === "lodging"
      && place.referenceUrl
      && validMapCoordinates(Number(place.latitude), Number(place.longitude)))) {
      const notFoundNotice = socialImportErrorMessage(new Error("GOOGLE_PLACE_NOT_FOUND"));
      for (let index = notices.length - 1; index >= 0; index -= 1) {
        if (notices[index] === notFoundNotice) notices.splice(index, 1);
      }
    }
    if (!mapImports.length && !socialSources.length && textarea.value.trim()) {
      notices.push("沒有找到支援的連結，請貼上 Google Maps、Agoda、Booking.com、Trip.com、Airbnb、Instagram 或 Threads 分享網址。");
    }
  } catch {
    notices.push("地點資料暫時無法辨識，請稍後再試。");
  } finally {
    pendingPlaceImportNotice = [...new Set(notices)].join(" ");
    const hasResults = pendingPlaceImports.length > 0 || pendingLodgingDrafts.length > 0;
    setImportSheetState(hasResults ? "results" : "input-error");
    renderImportPreview();
    updateImportConfirmState();
    analyzePlaces.disabled = false;
    analyzePlaces.textContent = "⌁　重新辨識";
  }
}

function openDateSheet(regionKey) {
  const representative = state.places.find((place) => travelAreaGroupKey(place) === regionKey);
  const regionLabel = travelAreaDisplayName(representative);
  const options = dateMeta
    .map(([date, weekday]) => `<option value="${date}" ${date === state.selectedDate ? "selected" : ""}>${date} ${weekday}</option>`)
    .join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet" id="add-area-form" data-travel-area-key="${escapeHtml(regionKey)}">
        <div class="section-row"><div><p class="section-kicker">${escapeHtml(regionLabel)}</p><h2>加入同一天</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <p>此區域的收藏地點會一起加入指定日期，之後仍可個別移除或調整時間。</p>
        <div class="field"><label for="trip-date">選擇日期</label><select id="trip-date" name="date">${options}</select></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">確認加入</button></div>
      </form>
    </div>`;
}

function openAddPlaceDateSheet(name) {
  const place = state.places.find((item) => item.name === name);
  if (!place) return;
  const options = dateMeta
    .map(([date, weekday]) => `<option value="${date}" ${date === state.selectedDate ? "selected" : ""}>${date} ${weekday}</option>`)
    .join("");
  const assignments = placeAssignments(name);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet" id="add-place-day-form" data-place-name="${escapeHtml(name)}">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(travelAreaDisplayName(place))}</p><h2>加入某一天</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p><strong>${escapeHtml(name)}</strong>${assignments.length ? `目前已排：${escapeHtml(placeScheduleLabel(name))}` : "目前尚未安排。"}</p>
        <div class="field"><label for="place-trip-date">選擇日期</label><select id="place-trip-date" name="date">${options}</select></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">確認加入</button></div>
      </form>
    </div>`;
}

function timeWheelOptions(count) {
  return Array.from({ length: count }, (_, value) => {
    const text = String(value).padStart(2, "0");
    return `<button class="time-wheel-option" type="button" data-wheel-value="${text}">${text}</button>`;
  }).join("");
}

function updateTimeWheelColumn(column) {
  if (!pendingTimePicker || !column) return;
  const options = [...column.querySelectorAll("[data-wheel-value]")];
  const index = Math.max(0, Math.min(options.length - 1, Math.round(column.scrollTop / 44)));
  const selected = options[index];
  options.forEach((option) => option.classList.toggle("active", option === selected));
  pendingTimePicker[column.dataset.wheelPart] = selected?.dataset.wheelValue || "00";
  const value = document.querySelector("[data-pending-time-value]");
  if (value) value.textContent = `${pendingTimePicker.hour}:${pendingTimePicker.minute}`;
}

function syncPendingTimeFromWheel() {
  document.querySelectorAll("[data-wheel-part]").forEach(updateTimeWheelColumn);
}

function openTimeWheel(name) {
  const item = (state.itinerary[state.selectedDate] || []).find((entry) => entry.name === name);
  if (!item) return;
  const [hour = "00", minute = "00"] = String(item.time || "00:00").split(":");
  pendingTimePicker = { name, hour, minute };
  sheetRoot.innerHTML = `
    <div class="modal-backdrop time-wheel-backdrop" data-dismiss-sheet>
      <section class="modal-sheet time-wheel-sheet" role="dialog" aria-modal="true" aria-label="調整${escapeHtml(name)}時間">
        <div class="time-wheel-toolbar">
          <button type="button" data-cancel-time aria-label="取消時間修改">×</button>
          <span><strong>${escapeHtml(name)}</strong><small data-pending-time-value>${hour}:${minute}</small></span>
          <button type="button" class="confirm" data-confirm-time aria-label="確認時間修改">✓</button>
        </div>
        <div class="time-wheel-picker">
          <div class="time-wheel-selection" aria-hidden="true"></div>
          <div class="time-wheel-column" data-wheel-part="hour" role="listbox" aria-label="小時">${timeWheelOptions(24)}</div>
          <b aria-hidden="true">:</b>
          <div class="time-wheel-column" data-wheel-part="minute" role="listbox" aria-label="分鐘">${timeWheelOptions(60)}</div>
        </div>
      </section>
    </div>`;
  window.requestAnimationFrame(() => {
    document.querySelector('[data-wheel-part="hour"]')?.scrollTo({ top: Number(hour) * 44 });
    document.querySelector('[data-wheel-part="minute"]')?.scrollTo({ top: Number(minute) * 44 });
    syncPendingTimeFromWheel();
  });
}

function rememberItineraryPlaceChecks() {
  document.querySelectorAll('#itinerary-places-form input[name="places"]').forEach((input) => {
    if (input.checked) itineraryPlaceSelection.add(input.value);
    else itineraryPlaceSelection.delete(input.value);
  });
}

function suggestedItineraryTimes(count) {
  const usedTimes = (state.itinerary[state.selectedDate] || [])
    .filter((item) => item.type !== "flight" && /^\d{2}:\d{2}$/.test(item.time || ""))
    .map((item) => item.time)
    .sort();
  const latest = usedTimes.at(-1) || "09:30";
  const [hour, minute] = latest.split(":").map(Number);
  const baseMinutes = hour * 60 + minute;
  return Array.from({ length: count }, (_, index) => {
    const total = Math.min(23 * 60 + 45, baseMinutes + (index + 1) * 90);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  });
}

function openItineraryPlacesSheet({ reset = false } = {}) {
  if (reset) itineraryPlaceSelection = new Set();
  const currentNames = new Set((state.itinerary[state.selectedDate] || []).filter((item) => item.type !== "flight").map((item) => item.name));
  const visiblePlaces = state.places.filter((place) => state.itineraryPlaceKind === "all" || place.kind === state.itineraryPlaceKind);
  const rows = visiblePlaces.map((place) => {
    const current = currentNames.has(place.name);
    const otherDates = placeAssignments(place.name).filter((assignment) => assignment.date !== state.selectedDate).map((assignment) => assignment.date);
    const status = current ? "本日已加入" : otherDates.length ? `另排於 ${otherDates.join("、")}` : "尚未安排";
    return `
      <label class="itinerary-place-option ${current ? "already-added" : ""}">
        <input type="checkbox" name="places" value="${escapeHtml(place.name)}" ${current ? "checked disabled" : itineraryPlaceSelection.has(place.name) ? "checked" : ""} />
        <span class="itinerary-place-check" aria-hidden="true">✓</span>
        <span class="itinerary-place-copy"><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(travelAreaChineseName(place))} · ${escapeHtml(kindLabel(place.kind))}</small></span>
        <b>${escapeHtml(status)}</b>
      </label>`;
  }).join("");
  const kindTabs = [["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"], ["shopping", "購物"]]
    .map(([kind, label]) => `<button type="button" class="${state.itineraryPlaceKind === kind ? "active" : ""}" data-itinerary-place-kind="${kind}">${label}</button>`).join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet itinerary-places-sheet" id="itinerary-places-form">
        <div class="section-row"><div><p class="section-kicker">${escapeHtml(state.selectedDate)}</p><h2>勾選要加入的地點</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <p>不離開行程頁即可加入；右側會標示是否已安排在其他日期。</p>
        <div class="sheet-kind-tabs">${kindTabs}</div>
        <div class="itinerary-place-options">${rows || `<div class="import-empty"><strong>此分類沒有收藏地點</strong></div>`}</div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">加入勾選地點</button></div>
      </form>
    </div>`;
}

function openReorderSheet(key) {
  const items = state.itinerary[state.selectedDate] || [];
  const index = items.findIndex((item) => itineraryItemKey(item) === key);
  if (index < 0) return;
  const label = itineraryItemLabel(items[index]);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="reorder-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(state.selectedDate)}</p><h2 id="reorder-title">調整行程順序</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p>拖曳「☰」也可以直接排序。按鈕是觸控與輔助使用的替代方式。</p>
        <div class="sheet-place">
          <strong>${escapeHtml(label)}</strong>
          <span class="meta">目前第 ${index + 1} 個</span>
        </div>
        <div class="modal-actions">
          <button class="secondary-button" type="button" data-move-item="up" data-move-key="${escapeHtml(key)}" ${index === 0 ? "disabled" : ""}>↑ 上移一格</button>
          <button class="primary-button" type="button" data-move-item="down" data-move-key="${escapeHtml(key)}" ${index === items.length - 1 ? "disabled" : ""}>↓ 下移一格</button>
        </div>
      </section>
    </div>`;
}

function closeSheet() {
  pendingTimePicker = null;
  pendingFlightTicketFile = null;
  flightTicketRecognitionToken += 1;
  shoppingRecognitionToken += 1;
  pendingShoppingImports = [];
  pendingShoppingBatchDeleteIds = [];
  pendingPlacePhoto = "";
  removePendingPlacePhoto = false;
  if (flightTicketPreviewUrl) URL.revokeObjectURL(flightTicketPreviewUrl);
  flightTicketPreviewUrl = "";
  sheetRoot.innerHTML = "";
  document.body.classList.remove("transport-sheet-open");
}

let suppressReorderClick = false;
let pointerDrag = null;
let swipeDrag = null;
let suppressSwipeClick = false;
let previewRailDrag = null;
let suppressPreviewCardClick = false;
let itineraryPlaceSelection = new Set();

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-guest-action]")) return guestOnlyMessage();

  const previewShoppingImage = event.target.closest("[data-preview-shopping-image]");
  if (previewShoppingImage) {
    return openShoppingImagePreview(previewShoppingImage.dataset.previewShoppingImage, previewShoppingImage.dataset.shoppingImageId);
  }

  if (event.target.closest("[data-close-shopping-image-preview]") || event.target.matches("[data-dismiss-shopping-image-preview]")) {
    return closeShoppingImagePreview();
  }

  const stepShoppingImage = event.target.closest("[data-step-shopping-image-preview]");
  if (stepShoppingImage) {
    return stepShoppingImagePreview(stepShoppingImage.dataset.shoppingEntryId, stepShoppingImage.dataset.shoppingImageId, stepShoppingImage.dataset.stepShoppingImagePreview);
  }

  const selectShoppingImage = event.target.closest("[data-select-shopping-image-preview]");
  if (selectShoppingImage) {
    return selectShoppingImagePreview(selectShoppingImage.dataset.shoppingEntryId, selectShoppingImage.dataset.selectShoppingImagePreview);
  }

  const previewImportSource = event.target.closest("[data-preview-import-source]");
  if (previewImportSource) return openImportSourcePreview(previewImportSource.dataset.previewImportSource);

  const previewImportSourceImage = event.target.closest("[data-preview-import-source-image]");
  if (previewImportSourceImage) {
    return openImportSourceImagePreview(previewImportSourceImage.dataset.sourceGroup, previewImportSourceImage.dataset.previewImportSourceImage);
  }

  if (event.target.closest("[data-close-import-source-image]") || event.target.matches("[data-dismiss-import-source-image]")) {
    return closeImportSourceImagePreview();
  }

  if (event.target.closest("[data-close-import-source]") || event.target.matches("[data-dismiss-import-source]")) {
    return closeImportSourcePreview();
  }

  const rematchImportGroup = event.target.closest("[data-rematch-import-group]");
  if (rematchImportGroup) return openImportRematchSheet(rematchImportGroup.dataset.rematchImportGroup);

  const skipImportGroup = event.target.closest("[data-skip-import-group]");
  if (skipImportGroup) {
    return setImportCandidateGroupSkipped(skipImportGroup.dataset.skipImportGroup, skipImportGroup.dataset.skipValue === "true");
  }

  if (event.target.closest("[data-close-import-rematch]") || event.target.matches("[data-dismiss-import-rematch]")) {
    return closeImportRematchSheet();
  }

  const runImportRematch = event.target.closest("[data-run-import-rematch]");
  if (runImportRematch) return rematchImportCandidateGroup(runImportRematch.dataset.runImportRematch);

  const previewImportCandidate = event.target.closest("[data-preview-import-candidate]");
  const clickedCandidateRadio = event.target.closest("[data-social-place-candidate]");
  if (previewImportCandidate && !clickedCandidateRadio) {
    return openImportCandidatePreview(previewImportCandidate.dataset.previewImportCandidate);
  }

  if (event.target.closest("[data-close-import-candidate]") || event.target.matches("[data-dismiss-import-candidate]")) {
    return closeImportCandidatePreview();
  }

  const selectImportCandidateButton = event.target.closest("[data-select-import-candidate]");
  if (selectImportCandidateButton) {
    selectImportCandidate(
      selectImportCandidateButton.dataset.candidateGroup,
      selectImportCandidateButton.dataset.selectImportCandidate,
      selectImportCandidateButton.dataset.candidateChecked === "true",
    );
    closeImportCandidatePreview();
    return;
  }

  if (event.target.closest("[data-enter-guest]")) {
    state.isGuest = true;
    state.profile = null;
    state.tripId = "";
    state.trips = [];
    state.sharedRevision = 0;
    sessionStorage.setItem("tokyo-access-mode-v1", "guest");
    closeSheet();
    render();
    return showToast("已用訪客身分進入；登入後可建立或加入旅程");
  }

  if (suppressPreviewCardClick && event.target.closest(".preview-rail")) {
    event.preventDefault();
    return;
  }

  if (suppressSwipeClick && event.target.closest("[data-swipe-item]")) {
    event.preventDefault();
    return;
  }

  const tab = event.target.closest("[data-tab]");
  if (tab) return setTab(tab.dataset.tab);

  const goTab = event.target.closest("[data-go-tab]");
  if (goTab) return setTab(goTab.dataset.goTab);

  if (event.target.closest("[data-undo-shopping]")) return restoreShoppingAction();
  if (event.target.closest("[data-undo-last]")) return restoreLastAction();

  const shoppingCategory = event.target.closest("[data-shopping-category]");
  if (shoppingCategory) {
    state.shoppingFilter = shoppingCategory.dataset.shoppingCategory;
    shoppingSelectedIds.clear();
    return render({ preserveScroll: true });
  }

  const shoppingRecipient = event.target.closest("[data-shopping-recipient]");
  if (shoppingRecipient) {
    state.shoppingRecipientFilter = shoppingRecipient.dataset.shoppingRecipient;
    shoppingSelectedIds.clear();
    return render({ preserveScroll: true });
  }

  const shoppingStatus = event.target.closest("[data-shopping-status]");
  if (shoppingStatus) {
    state.shoppingStatus = shoppingStatus.dataset.shoppingStatus;
    shoppingSelectedIds.clear();
    return render({ preserveScroll: true });
  }

  if (event.target.closest("[data-toggle-shopping-selection]")) {
    shoppingSelectionMode = !shoppingSelectionMode;
    shoppingSelectedIds.clear();
    return render({ preserveScroll: true });
  }

  if (event.target.closest("[data-select-all-shopping]")) {
    const visibleIds = shoppingFilteredItems().map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => shoppingSelectedIds.has(id));
    visibleIds.forEach((id) => allSelected ? shoppingSelectedIds.delete(id) : shoppingSelectedIds.add(id));
    return render({ preserveScroll: true });
  }

  const selectShoppingItem = event.target.closest("[data-select-shopping-item]");
  if (selectShoppingItem) {
    const itemId = selectShoppingItem.dataset.selectShoppingItem;
    if (shoppingSelectedIds.has(itemId)) shoppingSelectedIds.delete(itemId);
    else shoppingSelectedIds.add(itemId);
    return render({ preserveScroll: true });
  }

  if (event.target.closest("[data-request-delete-shopping-batch]")) {
    return canManageShopping() ? openShoppingBatchDeleteSheet([...shoppingSelectedIds]) : guestOnlyMessage();
  }

  if (event.target.closest("[data-manage-shopping-categories]")) return canManageShopping() ? openShoppingCategorySheet() : guestOnlyMessage();
  if (event.target.closest("[data-add-shopping-item]")) return canManageShopping() ? openShoppingItemSheet() : guestOnlyMessage();
  if (event.target.closest("[data-import-shopping-screenshot]")) return canManageShopping() ? openShoppingImportSheet() : guestOnlyMessage();

  const removeManualPhoto = event.target.closest("[data-remove-shopping-manual-photo]");
  if (removeManualPhoto) {
    const form = removeManualPhoto.closest("#shopping-item-form");
    pendingManualShoppingPhoto = "";
    removeManualShoppingPhoto = true;
    const input = form?.querySelector("[data-shopping-manual-photo-input]");
    if (input) input.value = "";
    renderManualShoppingPhotoPreview(form);
    return;
  }

  const removeShoppingTag = event.target.closest("[data-remove-shopping-tag]");
  if (removeShoppingTag) {
    if (!canManageShopping()) return guestOnlyMessage();
    const tagId = removeShoppingTag.dataset.removeShoppingTag;
    const tag = state.shopping.tags.find((candidate) => candidate.id === tagId);
    if (!tag) return;
    recordShoppingUndo();
    state.shopping.tags = state.shopping.tags.filter((candidate) => candidate.id !== tagId);
    state.shopping.items.forEach((item) => { item.recipientTagIds = item.recipientTagIds.filter((id) => id !== tagId); });
    if (state.shoppingRecipientFilter === tagId) state.shoppingRecipientFilter = "all";
    removeShoppingTag.closest(".shopping-tag-option-row")?.remove();
    render({ preserveScroll: true });
    await saveShopping();
    return showToast(`已移除「${tag.name}」購買對象`, { allowUndo: false });
  }

  const requestDeleteShoppingCategory = event.target.closest("[data-request-delete-shopping-category]");
  if (requestDeleteShoppingCategory) return canManageShopping() ? openShoppingCategoryDeleteSheet(requestDeleteShoppingCategory.dataset.requestDeleteShoppingCategory) : guestOnlyMessage();

  const confirmDeleteShoppingCategory = event.target.closest("[data-confirm-delete-shopping-category]");
  if (confirmDeleteShoppingCategory) {
    if (!canManageShopping()) return guestOnlyMessage();
    const categoryId = confirmDeleteShoppingCategory.dataset.confirmDeleteShoppingCategory;
    const category = state.shopping.categories.find((candidate) => candidate.id === categoryId && !candidate.builtIn);
    if (!category) return openShoppingCategorySheet();
    recordShoppingUndo();
    state.shopping.categories = state.shopping.categories.filter((candidate) => candidate.id !== categoryId);
    state.shopping.items.forEach((item) => { if (item.categoryId === categoryId) item.categoryId = "daily"; });
    if (state.shoppingFilter === categoryId) state.shoppingFilter = "all";
    await saveShopping();
    openShoppingCategorySheet();
    render({ preserveScroll: true });
    return showToast(`已移除「${category.name}」分類`, { allowUndo: false });
  }

  const removeShoppingImport = event.target.closest("[data-remove-shopping-import]");
  if (removeShoppingImport) {
    const form = removeShoppingImport.closest("#shopping-import-form");
    syncPendingShoppingImportEdits(form);
    pendingShoppingImports = pendingShoppingImports.filter((entry) => entry.id !== removeShoppingImport.dataset.removeShoppingImport);
    renderShoppingImportRows(form);
    const confirm = form?.querySelector('button[type="submit"]');
    if (confirm) confirm.disabled = !pendingShoppingImports.length;
    return setShoppingRecognitionStatus(form, pendingShoppingImports.length ? `目前保留 ${pendingShoppingImports.length} 個待加入商品。` : "已移除全部圖片，請重新選擇。", { progress: pendingShoppingImports.length ? 1 : 0 });
  }

  const refreshShoppingImages = event.target.closest("[data-refresh-shopping-images]");
  if (refreshShoppingImages) return refreshShoppingImportImages(refreshShoppingImages.dataset.refreshShoppingImages, refreshShoppingImages);

  const openShoppingItem = event.target.closest("[data-open-shopping-item]");
  if (openShoppingItem) return openShoppingDetailSheet(openShoppingItem.dataset.openShoppingItem);

  const researchShopping = event.target.closest("[data-research-shopping-item]");
  if (researchShopping) return researchShoppingItem(researchShopping.dataset.researchShoppingItem, researchShopping);

  const editShoppingItem = event.target.closest("[data-edit-shopping-item]");
  if (editShoppingItem) return canManageShopping() ? openShoppingItemSheet(editShoppingItem.dataset.editShoppingItem) : guestOnlyMessage();

  const toggleShoppingItem = event.target.closest("[data-toggle-shopping-item]");
  if (toggleShoppingItem) {
    if (!canManageShopping()) return guestOnlyMessage();
    const item = state.shopping.items.find((candidate) => candidate.id === toggleShoppingItem.dataset.toggleShoppingItem);
    if (!item) return;
    recordShoppingUndo();
    item.purchased = !item.purchased;
    item.updatedAt = new Date().toISOString();
    render({ preserveScroll: true });
    saveShopping();
    return showToast(item.purchased ? `「${item.name}」已標記為買到` : `「${item.name}」改回待購買`, { allowUndo: false });
  }

  const deleteShoppingItem = event.target.closest("[data-request-delete-shopping]");
  if (deleteShoppingItem) return canManageShopping() ? openShoppingDeleteSheet(deleteShoppingItem.dataset.requestDeleteShopping) : guestOnlyMessage();

  const confirmDeleteShopping = event.target.closest("[data-confirm-delete-shopping]");
  if (confirmDeleteShopping) {
    if (!canManageShopping()) return guestOnlyMessage();
    const item = state.shopping.items.find((candidate) => candidate.id === confirmDeleteShopping.dataset.confirmDeleteShopping);
    if (!item) return closeSheet();
    recordShoppingUndo();
    state.shopping.items = state.shopping.items.filter((candidate) => candidate.id !== item.id);
    removeUnusedShoppingPhotos();
    closeSheet();
    render({ preserveScroll: true });
    await saveShopping();
    return showToast(`已刪除「${item.name}」`, { allowUndo: false });
  }

  if (event.target.closest("[data-confirm-delete-shopping-batch]")) {
    if (!canManageShopping()) return guestOnlyMessage();
    const ids = new Set(pendingShoppingBatchDeleteIds);
    if (!ids.size) return closeSheet();
    recordShoppingUndo();
    state.shopping.items = state.shopping.items.filter((item) => !ids.has(item.id));
    removeUnusedShoppingPhotos();
    shoppingSelectionMode = false;
    shoppingSelectedIds.clear();
    closeSheet();
    render({ preserveScroll: true });
    await saveShopping();
    return showToast(`已刪除 ${ids.size} 個採買項目`, { allowUndo: false });
  }

  const overviewAction = event.target.closest("[data-overview-action]");
  if (overviewAction) {
    const action = overviewAction.dataset.overviewAction;
    if (action === "flight") return canEdit() ? openFlightSheet() : guestOnlyMessage();
    if (action === "lodging") {
      state.placeKind = "lodging";
      state.placesMode = "list";
      return setTab("places");
    }
    if (action === "favorites") {
      state.placeKind = "all";
      state.placesMode = "list";
      return setTab("places");
    }
    return setTab("itinerary");
  }

  const mode = event.target.closest("[data-places-mode]");
  if (mode) {
    state.placesMode = mode.dataset.placesMode;
    if (state.placesMode === "map") {
      state.selectedMapPlace = "";
      if (state.mapView === "planning") {
        state.placeKind = "all";
        state.mapCategory = "all";
        state.mapPreference = "all";
      }
    }
    return render();
  }

  const placeKind = event.target.closest("[data-place-kind]");
  if (placeKind) {
    state.placeKind = placeKind.dataset.placeKind;
    state.mapCategory = "all";
    return render({ preserveScroll: true });
  }

  if (event.target.closest("[data-toggle-map-fullscreen]")) {
    mapFullscreen = !mapFullscreen;
    mapSidebarOpen = true;
    return render({ preserveScroll: true });
  }

  if (event.target.closest("[data-toggle-map-sidebar]")) {
    mapSidebarOpen = !mapSidebarOpen;
    const screen = document.querySelector(".map-screen.is-fullscreen");
    screen?.classList.toggle("sidebar-open", mapSidebarOpen);
    screen?.classList.toggle("sidebar-closed", !mapSidebarOpen);
    window.setTimeout(() => {
      if (activeGoogleMap && window.google?.maps) google.maps.event.trigger(activeGoogleMap, "resize");
      activeLeafletMap?.invalidateSize?.();
    }, 260);
    return;
  }

  const focusMapPlace = event.target.closest("[data-focus-map-place]");
  if (focusMapPlace) {
    const name = focusMapPlace.dataset.focusMapPlace;
    const place = filteredMapPlaces().find((candidate) => candidate.name === name);
    if (!place) return;
    selectMapPlace(place);
    if (window.matchMedia("(max-width: 700px)").matches && mapSidebarOpen) {
      mapSidebarOpen = false;
      const screen = document.querySelector(".map-screen.is-fullscreen");
      screen?.classList.remove("sidebar-open");
      screen?.classList.add("sidebar-closed");
      window.setTimeout(() => activeLeafletMap?.invalidateSize?.(), 260);
    }
    return;
  }

  const openMapPlaceDetail = event.target.closest("[data-open-map-place-detail]");
  if (openMapPlaceDetail) return openPlaceSheet(openMapPlaceDetail.dataset.openMapPlaceDetail);

  if (event.target.closest("[data-close-map-preview]")) {
    updateMapPlacePreview(null);
    return;
  }

  const mapView = event.target.closest("[data-map-view]");
  if (mapView) {
    state.mapView = mapView.dataset.mapView;
    if (state.mapView === "planning") {
      state.placeKind = "all";
      state.mapCategory = "all";
      state.mapPreference = "all";
    }
    state.selectedMapPlace = "";
    return render();
  }

  if (event.target.closest("[data-toggle-live-location]")) {
    if (liveLocationEnabled) stopLiveLocation({ notify: true });
    else startLiveLocation();
    return;
  }

  if (event.target.closest("[data-open-itinerary-places]")) {
    if (!canEdit()) return guestOnlyMessage();
    state.itineraryPlaceKind = "all";
    return openItineraryPlacesSheet({ reset: true });
  }

  const itineraryPlaceKind = event.target.closest("[data-itinerary-place-kind]");
  if (itineraryPlaceKind) {
    rememberItineraryPlaceChecks();
    state.itineraryPlaceKind = itineraryPlaceKind.dataset.itineraryPlaceKind;
    return openItineraryPlacesSheet();
  }

  const mapPlace = event.target.closest("[data-select-map-place]");
  if (mapPlace) {
    return openPlaceSheet(mapPlace.dataset.selectMapPlace);
  }

  const place = event.target.closest("[data-open-place]");
  if (place) return openPlaceSheet(place.dataset.openPlace);

  const returnPlace = event.target.closest("[data-return-place]");
  if (returnPlace) return openPlaceSheet(returnPlace.dataset.returnPlace);

  const vote = event.target.closest("[data-vote]");
  if (vote) {
    if (!canEdit()) return guestOnlyMessage();
    const name = vote.dataset.vote;
    const detailWasOpen = Boolean(event.target.closest(".place-detail-sheet"));
    const active = toggleMyVote(name);
    render({ preserveScroll: true });
    if (detailWasOpen) openPlaceSheet(name);
    return showToast(active ? `你也想去「${name}」` : `已取消你的「最想去」`);
  }

  if (event.target.closest("[data-edit-profile]")) return openProfileSheet(false);

  if (event.target.closest("[data-share-trip]")) return shareCurrentTrip();

  const removeMember = event.target.closest("[data-request-remove-member]");
  if (removeMember) {
    if (!isTripOwner()) return showToast("只有旅程建立者能移除成員");
    return openMembershipConfirmation({
      action: "remove",
      memberId: removeMember.dataset.requestRemoveMember,
      memberName: removeMember.dataset.memberName,
    });
  }

  if (event.target.closest("[data-request-leave-trip]")) {
    if (!canEdit()) return guestOnlyMessage();
    return openMembershipConfirmation({ action: "leave" });
  }

  const confirmMembership = event.target.closest("[data-confirm-membership]");
  if (confirmMembership) {
    if (!canEdit()) return guestOnlyMessage();
    confirmMembership.disabled = true;
    try {
      if (sharedSaveTimer) {
        window.clearTimeout(sharedSaveTimer);
        sharedSaveTimer = 0;
        await saveSharedTrip();
      }
      if (confirmMembership.dataset.confirmMembership === "remove") {
        await mutateTrips({ action: "removeMember", tripId: state.tripId, memberId: confirmMembership.dataset.memberId });
        closeSheet();
        await loadTrips();
        return showToast(`已將「${confirmMembership.dataset.memberName}」移出旅程`);
      }
      const previousTitle = state.tripTitle;
      await mutateTrips({ action: "leave", tripId: state.tripId });
      localStorage.removeItem("active-trip-v1");
      state.tripId = "";
      state.ownerId = "";
      closeSheet();
      await loadTrips();
      return showToast(`已退出「${previousTitle}」`);
    } catch (error) {
      confirmMembership.disabled = false;
      const message = error.message === "OWNER_REQUIRED" ? "只有旅程建立者能移除成員" : "操作失敗，請稍後再試";
      return showToast(message);
    }
  }

  if (event.target.closest("[data-open-trips]")) return canEdit() ? openTripsSheet() : guestOnlyMessage();
  if (event.target.closest("[data-create-trip]")) return state.profile ? openTripForm(false) : guestOnlyMessage();
  if (event.target.closest("[data-join-trip]")) return state.profile ? openJoinTripSheet() : guestOnlyMessage();
  if (event.target.closest("[data-edit-trip]")) return canEdit() ? openTripForm(true) : guestOnlyMessage();

  const switchButton = event.target.closest("[data-switch-trip]");
  if (switchButton) return switchTrip(switchButton.dataset.switchTrip);

  if (event.target.closest("[data-add-flight]")) return canEdit() ? openFlightSheet() : guestOnlyMessage();
  const editFlight = event.target.closest("[data-edit-flight]");
  if (editFlight) return canEdit() ? openFlightSheet(editFlight.dataset.editFlight) : guestOnlyMessage();
  const addFlightConnectionButton = event.target.closest("[data-add-flight-connection]");
  if (addFlightConnectionButton) {
    if (!canEdit()) return guestOnlyMessage();
    return addFlightConnection(addFlightConnectionButton.closest("#flight-form"), addFlightConnectionButton.dataset.addFlightConnection);
  }
  const removeFlightConnectionButton = event.target.closest("[data-remove-flight-connection]");
  if (removeFlightConnectionButton) {
    removeFlightConnectionButton.closest("[data-flight-connection]")?.remove();
    return;
  }
  const recognizeFlightTicketButton = event.target.closest("[data-recognize-flight-ticket]");
  if (recognizeFlightTicketButton) {
    if (!canEdit()) return guestOnlyMessage();
    return recognizeFlightTicket(recognizeFlightTicketButton.closest("#flight-form"));
  }
  const deleteFlight = event.target.closest("[data-delete-flight]");
  if (deleteFlight) {
    if (!canEdit()) return guestOnlyMessage();
    state.flights = state.flights.filter((flight) => flight.id !== deleteFlight.dataset.deleteFlight);
    syncFlightItineraryItems();
    reconcileTransportSegments();
    persist();
    closeSheet();
    render();
    return showToast("航班已刪除");
  }

  const requestPlaceDelete = event.target.closest("[data-request-delete-place]");
  if (requestPlaceDelete) {
    if (!canEdit()) return guestOnlyMessage();
    return openDeleteConfirmation({
      kind: "place",
      name: requestPlaceDelete.dataset.requestDeletePlace,
      returnToDetails: Boolean(requestPlaceDelete.closest(".place-detail-sheet")),
    });
  }

  const requestItineraryDelete = event.target.closest("[data-request-delete-itinerary]");
  if (requestItineraryDelete) {
    if (!canEdit()) return guestOnlyMessage();
    return openDeleteConfirmation({
      kind: "itinerary",
      name: requestItineraryDelete.dataset.requestDeleteItinerary,
      date: requestItineraryDelete.dataset.deleteDate,
    });
  }

  const confirmDelete = event.target.closest("[data-confirm-delete]");
  if (confirmDelete) {
    if (!canEdit()) return guestOnlyMessage();
    const kind = confirmDelete.dataset.confirmDelete;
    const name = confirmDelete.dataset.deleteName;
    const deleted =
      kind === "place"
        ? deletePlace(name)
        : deleteItineraryItem(confirmDelete.dataset.deleteDate, name);
    closeSheet();
    render();
    return showToast(
      deleted
        ? kind === "place"
          ? `已刪除收藏「${name}」`
          : `已從當天行程移除「${name}」`
        : "找不到要刪除的項目",
    );
  }

  const selectArea = event.target.closest("[data-select-area]");
  if (selectArea) {
    state.selectedArea = selectArea.dataset.selectArea;
    return render();
  }

  if (event.target.closest("[data-close-area]")) {
    state.selectedArea = "";
    return render();
  }

  const retryTravelArea = event.target.closest("[data-retry-travel-area]");
  if (retryTravelArea) {
    if (!canEdit()) return guestOnlyMessage();
    const regionKey = retryTravelArea.dataset.retryTravelArea;
    state.places.filter((place) => travelAreaGroupKey(place) === regionKey).forEach((place) => {
      planningRegionResolutionAttempts.delete(planningRegionResolutionKey(place));
      place.travelAreaResolutionStatus = "retry-required";
    });
    render({ preserveScroll: true });
    await resolveStoredPlacePlanningRegions();
    return;
  }

  const addArea = event.target.closest("[data-add-area-day]");
  if (addArea) return canEdit() ? openDateSheet(addArea.dataset.addAreaDay) : guestOnlyMessage();

  const addPlaceDate = event.target.closest("[data-add-place-date]");
  if (addPlaceDate) return canEdit() ? openAddPlaceDateSheet(addPlaceDate.dataset.addPlaceDate) : guestOnlyMessage();

  if (event.target.closest("[data-add-place]")) return canEdit() ? openAddPlaceSheet() : guestOnlyMessage();

  const manualPlace = event.target.closest("[data-manual-place]");
  if (manualPlace) {
    if (!canEdit()) return guestOnlyMessage();
    const importForm = manualPlace.closest("#import-places-form");
    const seed = manualPlaceSeed(importForm?.elements.mapsList?.value || "");
    seed.kind = String(importForm?.elements.placeKind?.value || "lodging");
    return openPlaceEditSheet("", seed);
  }

  const lodgingDraftButton = event.target.closest("[data-create-lodging-draft]");
  if (lodgingDraftButton) {
    if (!canEdit()) return guestOnlyMessage();
    const draft = pendingLodgingDrafts[Number(lodgingDraftButton.dataset.createLodgingDraft)];
    if (!draft) return showToast("找不到這筆住宿來源資料");
    return openPlaceEditSheet("", {
      kind: "lodging",
      name: draft.sourceLodgingName || "",
      sourceLodgingName: draft.sourceLodgingName || "",
      address: draft.locationPrecision === "approximate" ? "" : draft.address || "",
      referenceUrl: draft.referenceUrl || "",
      sourcePlatform: draft.sourcePlatform || "",
      sourceListingId: draft.sourceListingId || "",
      customPhotoDataUrl: draft.sourceImageDataUrl || "",
      photoOrigin: draft.sourceImageDataUrl ? "lodging_source" : "",
    });
  }

  const editPlace = event.target.closest("[data-edit-place]");
  if (editPlace) return canEdit() ? openPlaceEditSheet(editPlace.dataset.editPlace) : guestOnlyMessage();

  const removePlacePhoto = event.target.closest("[data-remove-place-photo]");
  if (removePlacePhoto) {
    pendingPlacePhoto = "";
    removePendingPlacePhoto = true;
    const form = removePlacePhoto.closest("#place-editor-form");
    const input = form?.querySelector("[data-place-photo-input]");
    if (input) input.value = "";
    const photoOrigin = form?.elements.photoOrigin;
    if (photoOrigin) photoOrigin.value = "";
    renderPlacePhotoEditor(form);
    return;
  }

  const analyzePlaces = event.target.closest("[data-analyze-places]");
  if (analyzePlaces) {
    await analyzePlaceImportSheet(analyzePlaces);
    return;
  }

  const date = event.target.closest("[data-date]");
  if (date) {
    state.selectedDate = date.dataset.date;
    return render();
  }

  if (event.target.closest("[data-day-map]")) {
    state.activeTab = "places";
    state.placesMode = "map";
    state.mapView = "day";
    state.mapDate = state.selectedDate;
    state.mapCategory = "all";
    state.mapPreference = "all";
    state.selectedMapPlace = "";
    document.querySelectorAll(".tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === "places");
    });
    return render();
  }

  const mapLink = event.target.closest("[data-open-maps]");
  if (mapLink) return openGoogleMaps(mapLink.dataset.openMaps);

  const referenceLink = event.target.closest("[data-open-reference]");
  if (referenceLink) return window.open(referenceLink.dataset.openReference, "_blank", "noopener");

  const addTransport = event.target.closest("[data-add-transport]");
  if (addTransport) {
    if (!canEdit()) return guestOnlyMessage();
    return openTransportSheet({
      date: addTransport.dataset.transportDate,
      fromItemId: addTransport.dataset.fromItem,
      toItemId: addTransport.dataset.toItem,
    });
  }

  const editTransport = event.target.closest("[data-edit-transport]");
  if (editTransport) return openTransportSheet({ id: editTransport.dataset.editTransport });

  const toggleTransportTicket = event.target.closest("[data-toggle-transport-ticket]");
  if (toggleTransportTicket) {
    const transportForm = toggleTransportTicket.closest("#transport-form");
    if (!transportForm || !canEdit()) return guestOnlyMessage();
    const input = transportForm.elements.journeyType;
    input.value = input.value === "scheduled" ? "regular" : "scheduled";
    updateTransportFormMode(transportForm);
    return;
  }

  const transportRoute = event.target.closest("[data-open-transport-route]");
  if (transportRoute) {
    const transport = (state.transports || []).find((item) => item.id === transportRoute.dataset.openTransportRoute);
    const url = transport ? transportDirectionsUrl(transport) : "";
    return url ? openGoogleMaps(url) : showToast("請先補上交通起點與終點");
  }

  const bookingLink = event.target.closest("[data-open-booking-url]");
  if (bookingLink) {
    const transport = (state.transports || []).find((item) => item.id === bookingLink.dataset.openBookingUrl);
    try {
      const url = new URL(transport?.bookingUrl || "");
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("INVALID_URL");
      return window.open(url.toString(), "_blank", "noopener");
    } catch {
      return showToast("訂票連結格式不正確");
    }
  }

  const requestTransportDelete = event.target.closest("[data-request-delete-transport]");
  if (requestTransportDelete) {
    if (!canEdit()) return guestOnlyMessage();
    return openTransportDeleteConfirmation(requestTransportDelete.dataset.requestDeleteTransport);
  }

  const confirmTransportDelete = event.target.closest("[data-confirm-delete-transport]");
  if (confirmTransportDelete) {
    if (!canEdit()) return guestOnlyMessage();
    const before = state.transports.length;
    state.transports = state.transports.filter((transport) => transport.id !== confirmTransportDelete.dataset.confirmDeleteTransport);
    persist();
    closeSheet();
    render({ preserveScroll: true });
    return showToast(state.transports.length < before ? "交通安排已刪除" : "找不到這段交通");
  }

  const editTime = event.target.closest("[data-edit-time]");
  if (editTime) return canEdit() ? openTimeWheel(editTime.dataset.editTime) : guestOnlyMessage();

  const wheelOption = event.target.closest("[data-wheel-value]");
  if (wheelOption) {
    const column = wheelOption.closest("[data-wheel-part]");
    const options = [...column.querySelectorAll("[data-wheel-value]")];
    column.scrollTo({ top: options.indexOf(wheelOption) * 44, behavior: "smooth" });
    return;
  }

  if (event.target.closest("[data-cancel-time]")) {
    closeSheet();
    return showToast("已取消時間修改");
  }

  if (event.target.closest("[data-confirm-time]")) {
    if (!pendingTimePicker) return closeSheet();
    syncPendingTimeFromWheel();
    const { name, hour, minute } = pendingTimePicker;
    const item = (state.itinerary[state.selectedDate] || []).find((entry) => entry.name === name);
    if (!item) return showToast("找不到這個行程項目");
    item.time = `${hour}:${minute}`;
    sortItineraryByTime(state.selectedDate);
    persist();
    closeSheet();
    render({ preserveScroll: true });
    return showToast("時間與行程順序已更新");
  }

  if (event.target.closest("[data-close-sheet]")) return closeSheet();
  if (event.target.matches("[data-dismiss-sheet]")) return closeSheet();

  const reorderMenu = event.target.closest("[data-reorder-menu]");
  if (reorderMenu) {
    if (!canEdit()) return guestOnlyMessage();
    if (suppressReorderClick) return;
    return openReorderSheet(reorderMenu.dataset.reorderMenu);
  }

  const moveItem = event.target.closest("[data-move-item]");
  if (moveItem) {
    if (!canEdit()) return guestOnlyMessage();
    const moved = moveItineraryItem(
      state.selectedDate,
      moveItem.dataset.moveKey,
      moveItem.dataset.moveItem,
    );
    closeSheet();
    render();
    return showToast(moved ? "行程順序已更新" : "已經在最前或最後");
  }

});

document.addEventListener("pointerdown", (event) => {
  if (!canEdit()) return;
  const surface = event.target.closest("[data-swipe-item]");
  if (!surface || event.target.closest("[data-drag-key]")) return;

  document.querySelectorAll("[data-swipe-item].revealed").forEach((item) => {
    if (item !== surface) {
      item.classList.remove("revealed");
      item.closest(".swipe-row")?.classList.remove("delete-visible");
    }
  });
  surface.closest(".swipe-row")?.classList.toggle("delete-visible", surface.classList.contains("revealed"));
  swipeDrag = {
    surface,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startOffset: surface.classList.contains("revealed") ? -84 : 0,
    offset: surface.classList.contains("revealed") ? -84 : 0,
    axis: "",
  };
});

document.addEventListener("pointermove", (event) => {
  if (!swipeDrag || swipeDrag.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - swipeDrag.startX;
  const deltaY = event.clientY - swipeDrag.startY;
  if (!swipeDrag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 7) {
    swipeDrag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    if (swipeDrag.axis === "horizontal") {
      swipeDrag.surface.setPointerCapture?.(event.pointerId);
    }
  }
  if (swipeDrag.axis !== "horizontal") return;
  swipeDrag.offset = Math.max(-84, Math.min(0, swipeDrag.startOffset + deltaX));
  swipeDrag.surface.style.transform = `translateX(${swipeDrag.offset}px)`;
  swipeDrag.surface.closest(".swipe-row")?.classList.toggle("delete-visible", swipeDrag.offset < -4);
  event.preventDefault();
});

function finishSwipe(event) {
  if (!swipeDrag || swipeDrag.pointerId !== event.pointerId) return;
  const current = swipeDrag;
  swipeDrag = null;
  current.surface.style.removeProperty("transform");
  if (current.axis !== "horizontal") return;
  const revealed = current.offset < -42;
  current.surface.classList.toggle("revealed", revealed);
  current.surface.closest(".swipe-row")?.classList.toggle("delete-visible", revealed);
  suppressSwipeClick = true;
  window.setTimeout(() => {
    suppressSwipeClick = false;
  }, 120);
}

document.addEventListener("pointerup", finishSwipe);
document.addEventListener("pointercancel", finishSwipe);

document.addEventListener("pointerdown", (event) => {
  const rail = event.target.closest(".preview-rail");
  if (!rail || event.pointerType === "touch") return;
  previewRailDrag = {
    rail,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: rail.scrollLeft,
    axis: "",
    moved: false,
  };
});

document.addEventListener("pointermove", (event) => {
  if (!previewRailDrag || previewRailDrag.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - previewRailDrag.startX;
  const deltaY = event.clientY - previewRailDrag.startY;
  if (!previewRailDrag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
    previewRailDrag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    if (previewRailDrag.axis === "horizontal") {
      previewRailDrag.rail.setPointerCapture?.(event.pointerId);
    }
  }
  if (previewRailDrag.axis !== "horizontal") return;
  previewRailDrag.moved = true;
  previewRailDrag.rail.scrollLeft = previewRailDrag.startScrollLeft - deltaX;
  event.preventDefault();
});

function finishPreviewRailDrag(event) {
  if (!previewRailDrag || previewRailDrag.pointerId !== event.pointerId) return;
  const didMove = previewRailDrag.moved;
  previewRailDrag = null;
  if (!didMove) return;
  suppressPreviewCardClick = true;
  window.setTimeout(() => {
    suppressPreviewCardClick = false;
  }, 140);
}

document.addEventListener("pointerup", finishPreviewRailDrag);
document.addEventListener("pointercancel", finishPreviewRailDrag);

document.addEventListener("scroll", (event) => {
  const column = event.target.closest?.("[data-wheel-part]");
  if (column) updateTimeWheelColumn(column);
}, true);

document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-shopping-category-select]")) {
    const owner = event.target.closest("[data-shopping-import-row], #shopping-item-form");
    const customField = owner?.querySelector("[data-shopping-custom-category]");
    if (customField) customField.hidden = event.target.value !== "__custom__";
    return;
  }

  if (event.target.matches("[data-social-place-screenshot]")) {
    handlePlaceImportScreenshotFile(event.target);
    return;
  }

  if (event.target.matches("[data-place-photo-input]")) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("請選擇照片格式的圖片");
    const form = input.closest("#place-editor-form");
    const status = form?.querySelector("[data-place-photo-status]");
    input.disabled = true;
    if (status) status.textContent = "正在準備照片…";
    try {
      pendingPlacePhoto = await compressPlacePhoto(file);
      removePendingPlacePhoto = false;
      const photoOrigin = form?.elements.photoOrigin;
      if (photoOrigin) photoOrigin.value = "user_upload";
      renderPlacePhotoEditor(form);
    } catch {
      input.value = "";
      showToast("這張照片太大或無法讀取，請換一張再試");
      renderPlacePhotoEditor(form);
    } finally {
      input.disabled = false;
    }
    return;
  }

  if (event.target.matches("[data-social-place-candidate]")) {
    const groupId = event.target.dataset.candidateGroup;
    const identity = event.target.dataset.socialPlaceCandidate;
    selectImportCandidate(groupId, identity, event.target.checked);
    return;
  }

  if (event.target.matches("[data-shopping-screenshot-input]")) {
    handleShoppingScreenshotFile(event.target);
    return;
  }

  if (event.target.matches("[data-shopping-manual-photo-input]")) {
    handleManualShoppingPhotoFile(event.target);
    return;
  }

  if (event.target.matches("[data-flight-ticket-input]")) {
    handleFlightTicketFile(event.target);
    return;
  }

  if (event.target.matches("[data-flight-native-control]")) syncFlightDateTimeDisplay(event.target);

  const flightForm = event.target.closest("#flight-form");
  if (flightForm && event.target.matches("[data-flight-direction]")) {
    updateFlightFormMode(flightForm);
    return;
  }

  if (flightForm && event.target.matches("[data-flight-city-side]")) {
    refreshFlightAirportField(flightForm, event.target.dataset.flightCitySide);
    updateFlightFormMode(flightForm);
    return;
  }

  if (event.target.matches("[data-transport-mode]")) {
    const transportForm = event.target.closest("#transport-form");
    updateTransportFormMode(transportForm, { refreshEstimate: true });
    return;
  }

  const transportForm = event.target.closest("#transport-form");
  if (transportForm && event.target.matches('[name="pairIndex"]')) {
    updateTransportFormMode(transportForm, { refreshEstimate: transportForm.elements.mode?.value === "walk" });
    return;
  }
  if (transportForm && event.target.matches('[name="departureTime"], [name="arrivalTime"], [name="durationMinutes"]')) {
    updateTransportFormValidation(transportForm);
    return;
  }

  if (event.target.matches("[data-map-date]")) {
    state.mapDate = event.target.value;
    state.mapView = "day";
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }

  if (event.target.matches("[data-map-kind]")) {
    state.placeKind = event.target.value;
    state.mapCategory = "all";
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }

  if (event.target.matches("[data-map-preference]")) {
    state.mapPreference = event.target.value;
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-flight-native-control]")) syncFlightDateTimeDisplay(event.target);

  const flightForm = event.target.closest("#flight-form");
  if (flightForm && event.target.matches("[data-flight-city-side]")) {
    refreshFlightAirportField(flightForm, event.target.dataset.flightCitySide);
    updateFlightFormMode(flightForm);
    return;
  }

  const transportForm = event.target.closest("#transport-form");
  if (transportForm && event.target.matches('[name="departureTime"], [name="arrivalTime"], [name="durationMinutes"]')) {
    if (event.target.matches('[name="durationMinutes"]')) event.target.dataset.autoDuration = "false";
    updateTransportFormValidation(transportForm);
  }
});

document.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-drag-key]");
  if (!canEdit() || !handle) return;
  const item = handle.closest(".timeline-item");
  const row = handle.closest("[data-itinerary-row]");
  if (!item || !row) return;
  document.querySelectorAll("[data-swipe-item].revealed").forEach((surface) => {
    surface.classList.remove("revealed");
    surface.style.removeProperty("transform");
  });
  pointerDrag = {
    key: handle.dataset.dragKey,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    handle,
    item,
    row,
  };
  handle.setPointerCapture?.(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const deltaY = event.clientY - pointerDrag.startY;
  if (!pointerDrag.dragging && Math.abs(deltaY) > 8) {
    const rect = pointerDrag.item.getBoundingClientRect();
    pointerDrag.dragging = true;
    pointerDrag.grabOffsetY = pointerDrag.startY - rect.top;
    pointerDrag.row.classList.add("dragging-row");
    pointerDrag.row.style.height = `${pointerDrag.row.getBoundingClientRect().height}px`;
    pointerDrag.item.classList.add("dragging");
    Object.assign(pointerDrag.item.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      pointerEvents: "none",
      transform: "translate3d(0,0,0)",
    });
    document.body.classList.add("itinerary-dragging");
  }
  if (!pointerDrag.dragging) return;

  pointerDrag.item.style.top = `${event.clientY - pointerDrag.grabOffsetY}px`;
  const appRect = app.getBoundingClientRect();
  if (event.clientY < appRect.top + 72) app.scrollTop -= Math.min(14, appRect.top + 72 - event.clientY);
  else if (event.clientY > appRect.bottom - 72) app.scrollTop += Math.min(14, event.clientY - (appRect.bottom - 72));

  const timeline = pointerDrag.row.closest(".timeline");
  const rows = [...timeline.querySelectorAll("[data-itinerary-row]")];
  const otherRows = rows.filter((row) => row !== pointerDrag.row);
  const nextRow = otherRows.find((row) => event.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2) || null;
  const currentRowIndex = rows.indexOf(pointerDrag.row);
  const shouldMove = nextRow ? rows[currentRowIndex + 1] !== nextRow : pointerDrag.row !== rows.at(-1);
  if (shouldMove) {
    otherRows.forEach((row) => row.getAnimations?.().forEach((animation) => animation.cancel()));
    const before = new Map(otherRows.map((row) => [row, row.getBoundingClientRect().top]));
    if (nextRow) timeline.insertBefore(pointerDrag.row, nextRow);
    else timeline.append(pointerDrag.row);
    otherRows.forEach((row) => {
      const shift = (before.get(row) || 0) - row.getBoundingClientRect().top;
      if (Math.abs(shift) < 1) return;
      row.animate([{ transform: `translateY(${shift}px)` }, { transform: "translateY(0)" }], { duration: 170, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  }
  event.preventDefault();
});

async function finishItineraryDrag(event) {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const dragState = pointerDrag;
  pointerDrag = null;
  if (!dragState.dragging) return;
  suppressReorderClick = true;
  window.setTimeout(() => {
    suppressReorderClick = false;
  }, 180);
  const itemsByKey = new Map((state.itinerary[state.selectedDate] || []).map((item) => [itineraryItemKey(item), item]));
  const keys = [...dragState.row.closest(".timeline").querySelectorAll("[data-itinerary-row]")].map((row) => row.dataset.itineraryRow);
  state.itinerary[state.selectedDate] = keys.map((key) => itemsByKey.get(key)).filter(Boolean);
  reconcileTransportSegments(state.selectedDate);
  persist();
  const targetRect = dragState.row.getBoundingClientRect();
  const currentRect = dragState.item.getBoundingClientRect();
  const settle = dragState.item.animate([
    { left: `${currentRect.left}px`, top: `${currentRect.top}px`, transform: "scale(1.02)" },
    { left: `${targetRect.left}px`, top: `${targetRect.top}px`, transform: "scale(1)" },
  ], { duration: 150, easing: "cubic-bezier(.2,.85,.25,1)", fill: "forwards" });
  await settle.finished.catch(() => {});
  document.body.classList.remove("itinerary-dragging");
  dragState.item.classList.remove("dragging");
  dragState.row.classList.remove("dragging-row");
  dragState.row.style.removeProperty("height");
  ["position", "left", "top", "width", "height", "margin", "pointer-events", "transform"].forEach((property) => dragState.item.style.removeProperty(property));
  render({ preserveScroll: true });
  showToast("行程順序已更新");
}

document.addEventListener("pointerup", finishItineraryDrag);
document.addEventListener("pointercancel", finishItineraryDrag);

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".timeline")) event.preventDefault();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (sheetRoot.querySelector("[data-shopping-image-preview-root]")) {
    event.preventDefault();
    return closeShoppingImagePreview();
  }
  if (mapFullscreen) {
    event.preventDefault();
    mapFullscreen = false;
    render({ preserveScroll: true });
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "place-editor-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const originalName = event.target.dataset.originalPlaceName || "";
    const existing = originalName ? state.places.find((place) => place.name === originalName) : null;
    const name = String(form.get("name") || "").normalize("NFKC").trim().slice(0, 100);
    const address = String(form.get("address") || "").normalize("NFKC").trim().slice(0, 300);
    const sourceUrl = String(form.get("sourceUrl") || "").trim().slice(0, 500);
    const referenceUrl = String(form.get("referenceUrl") || existing?.referenceUrl || "").trim().slice(0, 1000);
    const sourcePlatform = String(form.get("sourcePlatform") || existing?.sourcePlatform || "").normalize("NFKC").trim().slice(0, 60);
    const sourceLodgingName = String(form.get("sourceLodgingName") || existing?.sourceLodgingName || name).normalize("NFKC").trim().slice(0, 160);
    const sourceListingId = String(form.get("sourceListingId") || existing?.sourceListingId || "").normalize("NFKC").trim().slice(0, 80);
    let photoOrigin = String(form.get("photoOrigin") || existing?.photoOrigin || "").trim();
    const manualTravelAreaZh = String(form.get("travelAreaZh") || "").normalize("NFKC").trim().slice(0, 60);
    const manualTravelAreaLocal = String(form.get("travelAreaLocal") || "").normalize("NFKC").trim().slice(0, 60);
    const hasManualTravelArea = Boolean(manualTravelAreaZh || manualTravelAreaLocal);
    if (!name) return showToast("請輸入地點名稱");
    if (!address) return showToast("請輸入房東或訂單提供的完整地址");
    if (sourceUrl && !isGoogleMapsUrl(sourceUrl)) return showToast("請貼上有效的 Google Maps 連結");
    if (hasManualTravelArea && (!manualTravelAreaZh || !manualTravelAreaLocal)) return showToast("手動旅遊分區需同時填寫繁中與當地語言");
    if (state.places.some((place) => place !== existing && place.name === name)) return showToast("已有同名地點，請換一個顯示名稱");
    const customPhotoCount = state.places.filter((place) => place.customPhotoDataUrl).length;
    if (pendingPlacePhoto && !existing?.customPhotoDataUrl && customPhotoCount >= 12) return showToast("每趟旅程最多保存 12 張自訂地點照片");
    const submitButton = event.target.querySelector('button[type="submit"]');
    const addressError = event.target.querySelector("[data-place-address-error]");
    if (addressError) addressError.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = "正在確認地址…";
    let resolved = null;
    let resolutionError = "";
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: [{ sourceUrl, manualAddress: address, destination: state.destination, countryCode: existing?.countryCode || "" }] }),
      });
      if (response.ok) {
        const candidate = (await response.json()).places?.[0];
        if (candidate && !candidate.error) resolved = candidate;
        else resolutionError = candidate?.error || "無法解析這個地址";
      } else {
        resolutionError = "地址定位服務暫時無法使用";
      }
    } catch {
      resolutionError = "地址定位服務暫時無法使用";
    }
    if (!resolved || !validMapCoordinates(Number(resolved.latitude), Number(resolved.longitude))) {
      if (addressError) {
        addressError.hidden = false;
        addressError.textContent = `${resolutionError || "找不到這個完整地址的位置"}。請檢查門牌後再試，住宿尚未建立。`;
      }
      submitButton.disabled = false;
      submitButton.textContent = existing ? "儲存變更" : "確認新增";
      return showToast("地址無法解析，尚未建立住宿");
    }
    const kind = String(form.get("kind") || "lodging");
    const category = String(form.get("category") || "").normalize("NFKC").trim().slice(0, 60) || kindLabel(kind);
    const addressUnchanged = Boolean(existing && address === event.target.dataset.originalAddress);
    let customPhotoDataUrl = pendingPlacePhoto || (!removePendingPlacePhoto ? existing?.customPhotoDataUrl || "" : "");
    if (customPhotoDataUrl && customPhotoDataUrl.length > 260000) {
      try {
        submitButton.textContent = "正在壓縮住宿照片…";
        customPhotoDataUrl = await compressPlacePhotoDataUrl(customPhotoDataUrl);
      } catch {
        submitButton.disabled = false;
        submitButton.textContent = existing ? "儲存變更" : "確認新增";
        return showToast("來源照片無法儲存，請移除或更換照片");
      }
    }
    if (!customPhotoDataUrl) photoOrigin = "";
    const travelAreaSource = resolved?.travelAreaResolved === true ? resolved : existing;
    const locationSource = resolved || (addressUnchanged ? existing : null);
    const nextPlace = {
      ...(existing || {}),
      id: existing?.id || `custom-place-${crypto.randomUUID?.() || Date.now()}`,
      name,
      fullName: name,
      category,
      kind,
      area: resolved?.area || (addressUnchanged ? existing?.area : "") || placeAreaFromAddress(address, name),
      areaOriginal: resolved?.areaOriginal || (addressUnchanged ? existing?.areaOriginal : "") || "",
      areaResolvedByGoogle: Boolean(resolved?.areaResolvedByGoogle || (addressUnchanged && existing?.areaResolvedByGoogle)),
      areaManuallySet: false,
      travelAreaKey: hasManualTravelArea ? travelAreaKeyFromNames(resolved?.countryCode || existing?.countryCode, manualTravelAreaZh, manualTravelAreaLocal) : travelAreaSource?.travelAreaKey || "",
      travelAreaZh: hasManualTravelArea ? manualTravelAreaZh : travelAreaSource?.travelAreaZh || "",
      travelAreaLocal: hasManualTravelArea ? manualTravelAreaLocal : travelAreaSource?.travelAreaLocal || "",
      travelAreaResolved: hasManualTravelArea || resolved?.travelAreaResolved === true,
      travelAreaSource: hasManualTravelArea ? "manual" : resolved?.travelAreaResolved === true ? "automatic" : "legacy-fallback",
      travelAreaManuallySet: hasManualTravelArea,
      travelAreaResolver: hasManualTravelArea ? "MANUAL" : travelAreaSource?.travelAreaResolver || "",
      travelAreaResolutionVersion: hasManualTravelArea ? TRAVEL_AREA_RESOLUTION_VERSION : Number(travelAreaSource?.travelAreaResolutionVersion) || 0,
      travelAreaResolutionStatus: hasManualTravelArea || resolved?.travelAreaResolved === true ? "resolved" : "failed",
      travelAreaResolutionError: hasManualTravelArea || resolved?.travelAreaResolved === true ? "" : resolved?.travelAreaResolutionError || "TRAVEL_AREA_NOT_RESOLVED",
      countryCode: locationSource?.countryCode || existing?.countryCode || "",
      addressComponents: Array.isArray(locationSource?.addressComponents) ? locationSource.addressComponents : [],
      addressComponentsOriginal: Array.isArray(locationSource?.addressComponentsOriginal) ? locationSource.addressComponentsOriginal : [],
      administrativeAreas: locationSource?.administrativeAreas || existing?.administrativeAreas || null,
      formattedAddress: address,
      sourceUrl: sourceUrl || resolved?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      referenceUrl,
      sourcePlatform,
      sourceLodgingName,
      sourceListingId,
      placeId: existing && !existing.manualLocation ? existing.placeId || "" : "",
      latitude: Number.isFinite(resolved?.latitude) ? resolved.latitude : addressUnchanged ? existing?.latitude ?? null : null,
      longitude: Number.isFinite(resolved?.longitude) ? resolved.longitude : addressUnchanged ? existing?.longitude ?? null : null,
      addressProvider: resolved?.addressProvider || (addressUnchanged ? existing?.addressProvider : "") || "自行確認地址",
      locationSource: "address_geocode",
      locationPrecision: "exact",
      customPhotoDataUrl,
      photoOrigin: customPhotoDataUrl ? photoOrigin || "user_upload" : "",
      swatch: existing?.swatch || (kind === "lodging" ? "#9d5d43" : "#587a73"),
      mark: name.slice(0, 1),
      openingHours: existing?.openingHours || (kind === "lodging" ? "私人住宿不提供營業時間" : "自訂地點未提供營業時間"),
      phone: existing?.phone || "自訂地點未提供電話",
      description: existing?.description || `${name}由旅伴依照完整地址自行建立，定位不依賴附近商家名稱。`,
      highlights: existing?.highlights || ["自訂地點", "地址已自行確認"],
      galleryLabels: existing?.galleryLabels || ["自行加入照片", "建築外觀", "附近街景"],
      addedBy: existing?.addedBy || currentMemberId(),
      addedByName: existing?.addedByName || state.profile?.nickname || "我",
      isCustom: true,
      manualLocation: true,
      detailsLocked: true,
      photosLoaded: true,
    };
    if (existing) {
      const index = state.places.indexOf(existing);
      state.places[index] = nextPlace;
      renamePlaceReferences(originalName, name);
    } else {
      state.places.push(nextPlace);
    }
    state.placeKind = kind;
    state.selectedArea = "";
    persist();
    closeSheet();
    render();
    return showToast(resolved ? (existing ? "地點資料已更新" : "已加入自訂地點") : (existing ? "資料已更新；地址暫時無法定位" : "已加入；地址暫時無法定位"));
  }

  if (event.target.id === "shopping-item-form") {
    event.preventDefault();
    if (!canManageShopping()) return guestOnlyMessage();
    if (event.target.dataset.shoppingPhotoBusy === "true") return showToast("圖片還在準備中，請稍候再儲存");
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").normalize("NFKC").trim().slice(0, 100);
    if (!name) return showToast("請輸入採買物品名稱");
    const selectedCategoryId = String(form.get("categoryId") || "daily");
    const newCategoryName = String(form.get("newCategory") || "").normalize("NFKC").trim().slice(0, 24);
    if (selectedCategoryId === "__custom__" && !newCategoryName) return showToast("請輸入自訂分類名稱");
    recordShoppingUndo();
    const now = new Date().toISOString();
    const itemId = event.target.dataset.shoppingItemId || `shopping-${crypto.randomUUID?.() || Date.now()}`;
    const index = state.shopping.items.findIndex((item) => item.id === itemId);
    const previous = index >= 0 ? state.shopping.items[index] : null;
    const manualPhotoEnabled = event.target.dataset.shoppingManualPhotoEnabled === "true";
    let photoId = event.target.dataset.shoppingPhotoId || "";
    let photoKind = previous ? shoppingPhotoKind(previous) : "";
    if (manualPhotoEnabled) {
      if (removeManualShoppingPhoto) photoId = "";
      if (pendingManualShoppingPhoto) {
        photoId = `shopping-photo-${crypto.randomUUID?.() || Date.now()}`;
        state.shopping.photos[photoId] = { dataUrl: pendingManualShoppingPhoto, createdAt: now };
      }
      photoKind = photoId ? "manual" : "";
    }
    const item = {
      id: itemId,
      brand: String(form.get("brand") || "").normalize("NFKC").trim().slice(0, 100),
      name,
      benefits: String(form.get("benefits") || "").normalize("NFKC").trim().slice(0, 500),
      price: normalizeShoppingPrice(form.get("price")),
      currency: shoppingCurrencies.includes(String(form.get("currency") || "").toUpperCase()) ? String(form.get("currency")).toUpperCase() : defaultShoppingCurrency(),
      categoryId: selectedCategoryId === "__custom__" ? shoppingCustomCategory(newCategoryName) : selectedCategoryId,
      recipientTagIds: shoppingRecipientTagIds(form),
      note: String(form.get("note") || "").normalize("NFKC").trim().slice(0, 800),
      purchased: form.get("purchased") === "on",
      photoId,
      photoKind,
      preferredProductImageUrl: previous?.preferredProductImageUrl || "",
      aiAnnotation: previous?.aiAnnotation || null,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    if (index >= 0) state.shopping.items[index] = item;
    else state.shopping.items.unshift(item);
    removeUnusedShoppingPhotos();
    pruneShoppingPhotos();
    state.shoppingFilter = item.categoryId;
    closeSheet();
    render();
    const savedShopping = await saveShopping();
    if (savedShopping?.items && savedShopping?.photos) {
      applyPrivateShopping(savedShopping);
      render({ preserveScroll: true });
    }
    return showToast(index >= 0 ? "採買資料已更新" : "已加入私人採買清單", { allowUndo: false });
  }

  if (event.target.id === "shopping-import-form") {
    event.preventDefault();
    if (!canManageShopping()) return guestOnlyMessage();
    const form = new FormData(event.target);
    syncPendingShoppingImportEdits(event.target);
    const imports = pendingShoppingImports.filter((entry) => entry.details?.name).slice(0, SHOPPING_IMPORT_MAX_FILES);
    if (!imports.length) return showToast("請保留至少一個有商品名稱的項目");
    if (imports.some((entry) => entry.details.categoryId === "__custom__" && !entry.details.newCategory)) return showToast("請輸入自訂分類名稱");
    recordShoppingUndo();
    const recipientTagIds = shoppingRecipientTagIds(form);
    const note = String(form.get("note") || "").normalize("NFKC").trim().slice(0, 800);
    const now = new Date().toISOString();
    const additions = await Promise.all(imports.map(async (entry, index) => {
      const photoId = `shopping-photo-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`;
      state.shopping.photos[photoId] = { dataUrl: entry.dataUrl, createdAt: new Date(Date.now() + index).toISOString() };
      const categoryId = entry.details.categoryId === "__custom__" ? shoppingCustomCategory(entry.details.newCategory) : entry.details.categoryId || "daily";
      const selectedCandidate = (entry.productImages || []).find((image) => image.id === entry.selectedProductImageId) || null;
      const selectedProductImage = await compressAiProductImage(selectedCandidate);
      const productImages = selectedProductImage ? [selectedProductImage] : [];
      const aiAnnotation = entry.annotation ? { ...entry.annotation, productImages } : null;
      return {
        id: `shopping-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
        brand: entry.details.brand,
        name: entry.details.name,
        benefits: entry.details.benefits,
        price: normalizeShoppingPrice(entry.details.price),
        currency: shoppingCurrencies.includes(String(entry.details.currency || "").toUpperCase()) ? String(entry.details.currency).toUpperCase() : defaultShoppingCurrency(),
        categoryId,
        recipientTagIds,
        note,
        purchased: false,
        photoId,
        photoKind: "recognition",
        preferredProductImageUrl: productImages[0]?.url || "",
        aiAnnotation,
        createdAt: now,
        updatedAt: now,
      };
    }));
    state.shopping.items.unshift(...additions);
    pruneShoppingPhotos();
    const categories = [...new Set(additions.map((item) => item.categoryId))];
    state.shoppingFilter = categories.length === 1 ? categories[0] : "all";
    closeSheet();
    render();
    const savedShopping = await saveShopping();
    if (Array.isArray(savedShopping?.items)) {
      const savedById = new Map(savedShopping.items.map((item) => [item.id, item]));
      additions.forEach((addition) => {
        const savedItem = savedById.get(addition.id);
        if (!savedItem) return;
        const localItem = state.shopping.items.find((item) => item.id === addition.id);
        if (localItem) Object.assign(localItem, savedItem);
      });
      render({ preserveScroll: true });
    }
    return showToast(`已加入 ${additions.length} 個私人採買項目`, { allowUndo: false });
  }

  if (event.target.id === "transport-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    ensureItineraryItemIds();
    const form = new FormData(event.target);
    const date = event.target.dataset.transportDate;
    const pairs = itineraryAdjacentPairs(date);
    const pair = pairs[Number(form.get("pairIndex"))];
    if (!pair) return showToast("請先選擇相鄰的兩個行程");
    const journeyType = String(form.get("journeyType") || "regular");
    const timingError = transportTimingError(pair, {
      journeyType,
      departureTime: String(form.get("departureTime") || ""),
      arrivalTime: String(form.get("arrivalTime") || ""),
      durationMinutes: form.get("durationMinutes"),
    });
    if (timingError) {
      updateTransportFormValidation(event.target);
      return showToast(timingError);
    }
    const id = event.target.dataset.transportId || `transport-${crypto.randomUUID?.() || Date.now()}`;
    const fromItemId = itineraryItemKey(pair.from);
    const toItemId = itineraryItemKey(pair.to);
    const conflict = (state.transports || []).find((transport) =>
      transport.id !== id && transport.date === date && transport.fromItemId === fromItemId && transport.toItemId === toItemId,
    );
    if (conflict) return showToast("這兩個行程之間已經有交通安排");
    const previous = (state.transports || []).find((transport) => transport.id === id);
    const durationValue = Number(form.get("durationMinutes"));
    const mode = String(form.get("mode") || "walk");
    const fieldProfile = transportFieldProfiles[mode] || transportFieldProfiles.other;
    const transport = {
      ...(previous || {}),
      id,
      date,
      fromItemId,
      toItemId,
      fromLabel: itineraryItemLabel(pair.from),
      toLabel: itineraryItemLabel(pair.to),
      journeyType,
      mode,
      durationMinutes: Number.isFinite(durationValue) && durationValue > 0 ? Math.min(1440, Math.round(durationValue)) : "",
      departureStation: fieldProfile.stations ? String(form.get("departureStation") || "").trim().slice(0, 80) : "",
      arrivalStation: fieldProfile.stations ? String(form.get("arrivalStation") || "").trim().slice(0, 80) : "",
      line: fieldProfile.line ? String(form.get("line") || "").trim().slice(0, 80) : "",
      serviceNumber: journeyType === "scheduled" ? String(form.get("serviceNumber") || "").trim().slice(0, 80) : "",
      departureTime: journeyType === "scheduled" ? String(form.get("departureTime") || "") : "",
      arrivalTime: journeyType === "scheduled" ? String(form.get("arrivalTime") || "") : "",
      fare: journeyType === "scheduled" ? String(form.get("fare") || "").trim().slice(0, 40) : "",
      ticketStatus: journeyType === "scheduled" ? String(form.get("ticketStatus") || "尚未決定") : "",
      travelers: journeyType === "scheduled" ? form.getAll("travelers").map(String).slice(0, 30) : [],
      bookingUrl: journeyType === "scheduled" ? String(form.get("bookingUrl") || "").trim().slice(0, 500) : "",
      note: fieldProfile.note ? String(form.get("note") || "").trim().slice(0, 500) : "",
      needsReview: false,
      addedBy: previous?.addedBy || currentMemberId(),
      addedByName: previous?.addedByName || state.profile.nickname,
    };
    const index = state.transports.findIndex((item) => item.id === id);
    if (index >= 0) state.transports[index] = transport;
    else state.transports.push(transport);
    reconcileTransportSegments(date);
    persist();
    closeSheet();
    render({ preserveScroll: true });
    return showToast(index >= 0 ? "交通安排已更新" : "交通安排已加入行程");
  }

  if (event.target.id === "place-note-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const place = state.places.find((item) => item.name === event.target.dataset.placeName);
    if (!place) return showToast("找不到這個地點");
    place.note = String(new FormData(event.target).get("note") || "").trim().slice(0, 800);
    persist();
    return showToast("景點註記已儲存");
  }

  if (event.target.id === "itinerary-places-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    rememberItineraryPlaceChecks();
    const existing = state.itinerary[state.selectedDate] || [];
    const existingNames = new Set(existing.map((item) => item.name));
    const names = [...itineraryPlaceSelection].filter((name) => !existingNames.has(name));
    if (!names.length) return showToast("請先勾選尚未加入本日的地點");
    const times = suggestedItineraryTimes(names.length);
    const additions = names.map((name, index) => ({ name, time: times[index] }));
    const returnFlightIndex = existing.findIndex((item) => item.type === "flight" && state.flights.find((flight) => flight.id === item.flightId)?.direction === "回程");
    state.itinerary[state.selectedDate] = returnFlightIndex < 0
      ? [...existing, ...additions]
      : [...existing.slice(0, returnFlightIndex), ...additions, ...existing.slice(returnFlightIndex)];
    itineraryPlaceSelection = new Set();
    persist();
    closeSheet();
    render({ preserveScroll: true });
    return showToast(`已加入 ${additions.length} 個地點`);
  }

  if (event.target.id === "profile-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const nickname = String(form.get("nickname") || "").trim().slice(0, 10);
    const pin = String(form.get("pin") || "").trim();
    const inviteCode = String(form.get("inviteCode") || "").trim().toUpperCase();
    if (!nickname || !/^\d{4}$/.test(pin)) return showToast("請輸入 4 位數字 PIN");
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "驗證中…";
    let member;
    try {
      member = await authenticateMember(nickname, pin);
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = "儲存並開始";
      const messages = {
        INVALID_PIN: "PIN 不正確，請再試一次",
        TOO_MANY_ATTEMPTS: "嘗試次數過多，請稍後再試",
      };
      return showToast(messages[error.message] || "目前無法登入，請稍後再試");
    }
    const { id } = member;
    state.profile = member;
    state.isGuest = false;
    state.members[id] = member.nickname;
    sessionStorage.setItem("tokyo-access-mode-v1", "member");
    state.pendingInviteCode = inviteCode;
    persist({ sync: false });
    closeSheet();
    try {
      await loadTrips();
    } catch {
      render();
      showToast("已登入，但旅程清單暫時無法載入");
      return;
    }
    if (inviteCode) {
      try {
        const trip = await mutateTrips({ action: "join", inviteCode });
        clearSharedInviteFromUrl();
        await loadTrips();
        await switchTrip(trip.id);
        return showToast(`已登入並加入「${trip.title}」`);
      } catch (error) {
        state.pendingInviteCode = inviteCode;
        openJoinTripSheet();
        return showToast(error.message === "INVITE_NOT_FOUND" ? "找不到這組邀請碼，請確認後重試" : "已登入，但暫時無法加入旅程");
      }
    }
    maybeOpenShareTargetImport();
    return showToast(`接下來會用「${nickname}」標記你的選擇`);
  }

  if (event.target.id === "trip-form") {
    event.preventDefault();
    if (!state.profile) return guestOnlyMessage();
    const form = new FormData(event.target);
    const editing = event.target.dataset.editing === "true";
    const destination = String(form.get("destination") || "").trim();
    const title = String(form.get("title") || "").trim() || `${destination}旅行`;
    const startDate = String(form.get("startDate") || "");
    const endDate = String(form.get("endDate") || "");
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = editing ? "儲存中…" : "建立中…";
    try {
      const trip = await mutateTrips({ action: editing ? "update" : "create", tripId: editing ? state.tripId : undefined, destination, title, startDate, endDate });
      await loadTrips();
      await switchTrip(trip.id);
      return showToast(editing ? "旅程資訊已更新" : `已建立「${trip.title}」`);
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = editing ? "儲存變更" : "建立空白旅程";
      return showToast(error.message === "INVALID_TRIP" ? "請確認目的地與日期，旅程最長 60 天" : "目前無法儲存旅程");
    }
  }

  if (event.target.id === "join-trip-form" || event.target.id === "empty-join-trip-form") {
    event.preventDefault();
    if (!state.profile) return guestOnlyMessage();
    const inviteCode = String(new FormData(event.target).get("inviteCode") || "").trim().toUpperCase();
    try {
      const trip = await mutateTrips({ action: "join", inviteCode });
      clearSharedInviteFromUrl();
      await loadTrips();
      await switchTrip(trip.id);
      return showToast(`已加入「${trip.title}」`);
    } catch (error) {
      return showToast(error.message === "INVITE_NOT_FOUND" ? "找不到這組邀請碼" : "目前無法加入旅程");
    }
  }

  if (event.target.id === "flight-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const direction = String(form.get("direction") || "去程");
    const baseFlight = {
      departureCity: String(form.get("departureCity") || "").trim(),
      departureCode: String(form.get("departureCode") || "").trim().toUpperCase(),
      departureDate: String(form.get("departureDate") || ""),
      departureTime: String(form.get("departureTime") || ""),
      arrivalCity: String(form.get("arrivalCity") || "").trim(),
      arrivalCode: String(form.get("arrivalCode") || "").trim().toUpperCase(),
      arrivalDate: String(form.get("arrivalDate") || ""),
      arrivalTime: String(form.get("arrivalTime") || ""),
      travelers: String(form.get("travelers") || "").trim(),
    };
    const isRoundTrip = direction === "來回" && !event.target.dataset.flightId;
    let index = -1;
    if (!event.target.dataset.flightId) {
      const batchId = crypto.randomUUID?.() || Date.now();
      const journeyRecords = [];
      const outboundSegments = [
        baseFlight,
        ...[...event.target.querySelectorAll('[data-flight-connection][data-flight-direction="outbound"]')].map(flightSegmentFromConnection),
      ];
      const pushJourney = (segments, journeyDirection, suffix) => {
        const journeyId = `journey-${batchId}-${suffix}`;
        segments.forEach((segment, segmentIndex) => journeyRecords.push({
          ...segment,
          id: `flight-${batchId}-${suffix}-${segmentIndex + 1}`,
          direction: journeyDirection,
          journeyId,
          segmentIndex,
          segmentCount: segments.length,
          travelers: baseFlight.travelers,
        }));
      };
      pushJourney(outboundSegments, direction === "回程" ? "回程" : "去程", direction === "回程" ? "return" : "outbound");
      if (isRoundTrip) {
        const returnBase = {
          departureCity: String(form.get("returnDepartureCity") || "").trim(),
          departureCode: String(form.get("returnDepartureCode") || "").trim().toUpperCase(),
          departureDate: String(form.get("returnDepartureDate") || ""),
          departureTime: String(form.get("returnDepartureTime") || ""),
          arrivalCity: String(form.get("returnArrivalCity") || "").trim(),
          arrivalCode: String(form.get("returnArrivalCode") || "").trim().toUpperCase(),
          arrivalDate: String(form.get("returnArrivalDate") || ""),
          arrivalTime: String(form.get("returnArrivalTime") || ""),
          travelers: baseFlight.travelers,
        };
        const returnSegments = [
          returnBase,
          ...[...event.target.querySelectorAll('[data-flight-connection][data-flight-direction="return"]')].map(flightSegmentFromConnection),
        ];
        pushJourney(returnSegments, "回程", "return");
      }
      state.flights.push(...journeyRecords);
    } else {
      const previousFlight = state.flights.find((item) => item.id === event.target.dataset.flightId);
      const flight = {
        ...baseFlight,
        id: event.target.dataset.flightId || `flight-${crypto.randomUUID?.() || Date.now()}`,
        direction: direction === "回程" ? "回程" : "去程",
        journeyId: previousFlight?.journeyId || "",
        segmentIndex: Number.isInteger(previousFlight?.segmentIndex) ? previousFlight.segmentIndex : 0,
        segmentCount: Number.isInteger(previousFlight?.segmentCount) ? previousFlight.segmentCount : 1,
      };
      index = state.flights.findIndex((item) => item.id === flight.id);
      if (index >= 0) state.flights[index] = flight;
      else state.flights.push(flight);
    }
    state.flights.sort((a, b) => `${a.departureDate} ${a.departureTime}`.localeCompare(`${b.departureDate} ${b.departureTime}`));
    syncFlightItineraryItems();
    persist();
    closeSheet();
    render();
    const newSegmentCount = event.target.querySelectorAll("[data-flight-connection]").length;
    return showToast(isRoundTrip ? "來回航班與轉機航段已新增" : index >= 0 ? "航班已更新" : newSegmentCount ? `已新增 ${newSegmentCount + 1} 個航段` : "航班已新增");
  }

  if (event.target.id === "add-place-day-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const date = form.get("date");
    const name = event.target.dataset.placeName;
    const items = state.itinerary[date] || [];
    if (items.some((item) => item.name === name)) {
      closeSheet();
      return showToast(`「${name}」已在 ${date}`);
    }
    state.itinerary[date] = [...items, { name, time: items.length ? "15:00" : "11:00" }];
    state.selectedDate = date;
    state.mapView = "day";
    state.mapDate = date;
    persist();
    closeSheet();
    render();
    return showToast(`已將「${name}」加入 ${date}`);
  }

  if (event.target.id === "import-places-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const parsed = pendingPlaceImports.length
      ? pendingPlaceImports
      : parseGoogleMapsList(String(form.get("mapsList") || ""));
    const requestedKind = String(form.get("placeKind") || "auto");
    const additions = submittablePlaceImports(parsed)
      .map(({ recognition, isExisting, canImport, selected, isSocialCandidate, candidateGroupId, candidateLabel, candidateRank, candidateSearchQuery, candidateSearchClues, candidateAddress, candidateCity, candidateArea, candidateCountry, candidateCategory, candidateExcludedPlaceIds, candidateGroupSkipped, matchConfidence, sourceOriginalText, sourceOriginalImages, sourceImageIndexes, ...place }) => withStoredTabelogLink({
        ...place,
        kind: requestedKind === "auto" ? (place.kind || inferPlaceKind(place.category)) : requestedKind,
      }, state.destination));
    if (!additions.length) return showToast("沒有可新增的地點");
    state.places.push(...additions);
    const addedKinds = [...new Set(additions.map((place) => place.kind))];
    state.placeKind = addedKinds.length === 1 ? addedKinds[0] : "all";
    state.selectedArea = "";
    persist();
    closeSheet();
    render();
    showToast(`已加入 ${additions.length} 個地點`);
    return;
  }

  if (event.target.id === "add-area-form") {
    event.preventDefault();
    if (!canEdit()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const date = form.get("date");
    const regionKey = event.target.dataset.travelAreaKey;
    const representative = state.places.find((place) => travelAreaGroupKey(place) === regionKey);
    const regionLabel = travelAreaChineseName(representative, "未分類");
    const existing = state.itinerary[date] || [];
    const existingNames = new Set(existing.map((item) => item.name));
    const additions = state.places
      .filter((place) => travelAreaGroupKey(place) === regionKey && !existingNames.has(place.name))
      .map((place, index) => ({
        name: place.name,
        time: index === 0 ? "11:00" : `${Math.min(18, 14 + index * 3)}:00`,
      }));
    state.itinerary[date] = [...existing, ...additions];
    state.selectedDate = date;
    persist();
    closeSheet();
    setTab("itinerary");
    showToast(additions.length ? `已將 ${additions.length} 個${regionLabel}地點加入 ${date}` : `${regionLabel}地點已在 ${date}`);
  }
});

persist({ sync: false, resetUndo: true });
render();
if (!state.profile && !state.isGuest) openProfileSheet(true);
if (state.profile) {
  loadTrips()
    .then(() => {
      if (state.pendingInviteCode) openJoinTripSheet();
      else maybeOpenShareTargetImport();
    })
    .catch(() => showToast("旅程清單暫時無法載入"));
} else if (state.isGuest) {
  state.tripId = "";
  render();
}
window.setInterval(() => {
  if (!document.hidden && state.tripId) {
    loadSharedTrip({ quiet: true });
    if (state.activeTab === "shopping") loadShopping({ quiet: true });
  }
}, 15000);
let activeAppAssetTag = "";
let checkingAppUpdate = false;
let lastAppUpdateCheck = 0;

async function checkForAppUpdate({ reloadOnChange = false } = {}) {
  const now = Date.now();
  if (checkingAppUpdate || (reloadOnChange && now - lastAppUpdateCheck < 15000)) return;
  checkingAppUpdate = true;
  lastAppUpdateCheck = now;
  try {
    const response = await fetch(`./app.js?update-check=${now}`, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return;
    const assetTag = response.headers.get("etag") || response.headers.get("last-modified") || "";
    if (reloadOnChange && activeAppAssetTag && assetTag && assetTag !== activeAppAssetTag) {
      window.location.reload();
      return;
    }
    if (assetTag) activeAppAssetTag = assetTag;
  } catch {
    // Offline use remains available; the next foreground check will retry.
  } finally {
    checkingAppUpdate = false;
  }
}

checkForAppUpdate();
window.addEventListener("pageshow", () => checkForAppUpdate({ reloadOnChange: true }));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkForAppUpdate({ reloadOnChange: true });
});
window.addEventListener("pagehide", () => stopLiveLocation());
