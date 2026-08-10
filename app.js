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
      .map((place) => ({ ...place, ...placeDetails[place.name], kind: inferPlaceKind(place.category) })),
    ...savedCustomPlaces.map((place) => ({
      description: "這是家人新增的收藏地點，詳細介紹可以稍後再補上。",
      highlights: ["自訂收藏"],
      galleryLabels: ["地點照片", "環境照片", "附近街景"],
      openingHours: "待 Google Maps 同步",
      phone: "待 Google Maps 同步",
      addedByName: "璋",
      ...place,
      kind: place.kind || inferPlaceKind(place.category),
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
};

const app = document.querySelector("#app");
const sheetRoot = document.querySelector("#sheet-root");
const toastRoot = document.querySelector("#toast-root");
let pendingPlaceImports = [];
let pendingPlaceImportScreenshot = "";
let pendingPlaceImportNotice = "";
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
let pendingTimePicker = null;
let pendingFlightTicketFile = null;
let flightTicketPreviewUrl = "";
let flightTicketRecognitionToken = 0;
let flightOcrLoader = null;
let shoppingRecognitionToken = 0;
let pendingShoppingImports = [];
let shoppingSaveBusy = false;
let shoppingSavePending = false;
let shoppingUndoSnapshot = null;
let shoppingSelectionMode = false;
let shoppingSelectedIds = new Set();
let pendingShoppingBatchDeleteIds = [];
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

const knownAreaLabels = {
  "銀座": ["銀座", "銀座"],
  "Ginza": ["銀座", "銀座"],
  "惠比壽": ["惠比壽", "恵比寿"],
  "Ebisu": ["惠比壽", "恵比寿"],
  "Ebisunishi": ["惠比壽西", "恵比寿西"],
  "惠比壽／代官山": ["惠比壽／代官山", "恵比寿／代官山"],
  "恵比寿": ["惠比壽", "恵比寿"],
  "恵比寿／代官山": ["惠比壽／代官山", "恵比寿／代官山"],
  "澀谷": ["澀谷", "渋谷"],
  "渋谷": ["澀谷", "渋谷"],
  "新宿": ["新宿", "新宿"],
  "西新宿": ["西新宿", "西新宿"],
  "Nishishinjuku": ["西新宿", "西新宿"],
  "大塚": ["大塚", "大塚"],
  "Kitaōtsuka": ["北大塚", "北大塚"],
  "Kitaotsuka": ["北大塚", "北大塚"],
  "淺草": ["淺草", "浅草"],
  "浅草": ["淺草", "浅草"],
  "池袋": ["池袋", "池袋"],
  "上野": ["上野", "上野"],
  "六本木": ["六本木", "六本木"],
  "秋葉原": ["秋葉原", "秋葉原"],
};

function areaDisplayName(area = "", original = "") {
  const value = String(area || "待確認區域").trim();
  const known = knownAreaLabels[value];
  const chinese = known?.[0] || value;
  const local = String(known?.[1] || original || value).trim();
  return `${chinese}（${local}）`;
}

function areaChineseName(area = "") {
  const value = String(area || "行程").trim();
  return knownAreaLabels[value]?.[0] || value;
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
];

const flightCitySuggestions = ["高雄", "台北", "桃園", "台中", "東京", "成田", "大阪", "名古屋", "福岡", "札幌", "沖繩", "首爾", "釜山", "濟州", "香港", "澳門", "新加坡", "曼谷"];

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
    returnFields.querySelectorAll("input").forEach((input) => {
      input.disabled = !isRoundTrip;
      input.required = isRoundTrip;
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
  if (!state.places.some((item) => item.area === state.selectedArea)) state.selectedArea = "";
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
  state.places = payload.places.map((place) => ({ ...place, kind: place.kind || inferPlaceKind(place.category) }));
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
  } catch {
    showToast("私人採買清單暫時無法儲存，請稍後重試");
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
  shoppingUndoSnapshot = null;
  shoppingSelectionMode = false;
  shoppingSelectedIds.clear();
  localStorage.setItem("active-trip-v1", tripId);
  closeSheet();
  await loadSharedTrip({ force: true });
  await loadShopping({ quiet: true, force: true });
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
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  render();
  if (tab === "shopping" && canManageShopping() && !state.shoppingLoaded) {
    await loadShopping({ force: true });
  }
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

function flightMarkup(flight) {
  return `
    <button class="flight-leg editable-flight" type="button" ${canEdit() ? `data-edit-flight="${escapeHtml(flight.id)}"` : "data-guest-action"}>
      <span class="flight-direction-badge">${escapeHtml(flight.direction || tripDateLabel(flight.departureDate))}</span>
      <div class="airport departure-airport"><strong>${escapeHtml(flight.departureCity || "出發地")}</strong><span>${escapeHtml(flight.departureCode || "---")} · ${escapeHtml(flight.departureTime || "--:--")}</span></div>
      <div class="flight-arrow" aria-hidden="true"><span class="plane">✈</span></div>
      <div class="airport arrival-airport"><strong>${escapeHtml(flight.arrivalCity || "抵達地")}</strong><span>${escapeHtml(flight.arrivalCode || "---")} · ${escapeHtml(flight.arrivalTime || "--:--")}</span></div>
      <span class="flight-travelers">${escapeHtml(flight.travelers || "尚未註記乘客")}</span>
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
  const favoritePlaces = state.places.filter((place) => placeVoters(place.name).length > 0);
  const unplannedFavorites = favoritePlaces.filter((place) => !scheduledNames.has(place.name));
  const lodgingCount = state.places.filter((place) => place.kind === "lodging").length;
  const pairs = dateMeta.flatMap(([date]) => itineraryAdjacentPairs(date).map((pair) => ({ date, ...pair })));
  const missingTransport = pairs.filter(({ date, from, to }) => !transportForPair(date, itineraryItemKey(from), itineraryItemKey(to))).length;
  const checks = [state.flights.length > 0, lodgingCount > 0, scheduledPlaces.length > 0, pairs.length > 0 && missingTransport === 0];
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
    readiness: Math.round((checks.filter(Boolean).length / checks.length) * 100),
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
        <div class="overview-readiness"><strong>${summary.readiness}<small>%</small></strong><span>準備度</span></div>
        <div class="overview-progress" aria-label="旅程準備度 ${summary.readiness}%"><i style="width:${summary.readiness}%"></i></div>
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
  const areas = [...new Set(visiblePlaces.map((place) => place.area))];
  const groups = areas
    .map((area) => {
      const rows = visiblePlaces
        .filter((place) => place.area === area)
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
      return `
        <section class="place-group">
          <h2 class="group-title">⌖ ${escapeHtml(areaDisplayName(area, visiblePlaces.find((place) => place.area === area && place.areaOriginal)?.areaOriginal))}</h2>
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
  return { attraction: "景點", restaurant: "餐廳", lodging: "住宿" }[kind] || "地點";
}

function inferPlaceKind(category = "") {
  const value = String(category);
  if (/住宿|飯店|酒店|旅館|Hotel|Hostel|Inn/i.test(value)) return "lodging";
  if (/餐廳|料理|燒肉|牛排|咖啡|酒吧|Restaurant|Cafe|Bar/i.test(value)) return "restaurant";
  return "attraction";
}

function placeKindTabs() {
  return `
    <div class="place-kind-tabs" aria-label="地點分類">
      ${[["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"]].map(([value, label]) => `<button type="button" class="${state.placeKind === value ? "active" : ""}" data-place-kind="${value}">${label}</button>`).join("")}
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
      pinOffsetX: offsetIndex * 34,
      pinOffsetY: Math.abs(offsetIndex) % 2 ? -8 : 0,
    };
  });
}

function mapScreen() {
  const projectedPlaces = filteredMapPlaces();
  const kindPlaces = state.places.filter((place) => state.placeKind === "all" || place.kind === state.placeKind);
  const unlocatedCount = kindPlaces.length - projectPlaces(kindPlaces).length;
  const mapCenter = projectedPlaces.length
    ? {
        latitude: projectedPlaces.reduce((sum, place) => sum + place.latitude, 0) / projectedPlaces.length,
        longitude: projectedPlaces.reduce((sum, place) => sum + place.longitude, 0) / projectedPlaces.length,
      }
    : { latitude: 35.6762, longitude: 139.6503 };

  const kindOptions = [["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"]]
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

  return `
    <section class="screen map-screen">
      <div class="map-toolbar">
        <div><h2 style="margin:0">${mapTitle}</h2><p class="meta" style="margin:4px 0 0">顯示 ${projectedPlaces.length} 個地點</p></div>
        ${undoButtonMarkup()}
      </div>
      <div style="margin-top:14px">${placesSegment("map")}</div>
      <div class="map-purpose-tabs" aria-label="地圖用途">
        <button class="${state.mapView === "planning" ? "active" : ""}" type="button" data-map-view="planning"><strong>規劃地圖</strong><span>全部候選</span></button>
        <button class="${state.mapView === "day" ? "active" : ""}" type="button" data-map-view="day"><strong>當日地圖</strong><span>拜訪順序</span></button>
      </div>
      <div class="map-filters" aria-label="地圖篩選">
        <label class="${state.mapView === "planning" ? "map-date-disabled" : ""}"><span>日期</span><select data-map-date ${state.mapView === "planning" ? "disabled" : ""}>${dateOptions}</select></label>
        <label><span>類型</span><select data-map-kind>${kindOptions}</select></label>
        <label><span>想去程度</span><select data-map-preference>
          <option value="all" ${state.mapPreference === "all" ? "selected" : ""}>全部</option>
          <option value="group" ${state.mapPreference === "group" ? "selected" : ""}>2 人以上</option>
          <option value="mine" ${state.mapPreference === "mine" ? "selected" : ""}>我已標記</option>
          <option value="none" ${state.mapPreference === "none" ? "selected" : ""}>尚未推薦</option>
        </select></label>
      </div>
      <div class="map-legend" aria-label="圖釘狀態">
        ${state.mapView === "day" ? `${dayLegend}${flightLegend}` : `<span><i class="candidate"></i>候選</span><span><i class="favorite"></i>2+ 推薦</span><span><i class="scheduled"></i>已排行程</span><span><i class="lodging"></i>住宿</span>`}
        ${state.mapView === "planning" ? `
          <button class="map-live-location-toggle ${liveLocationEnabled ? "active" : ""} ${liveLocationEnabled && !liveLocationPosition ? "locating" : ""}" type="button" role="switch" aria-checked="${liveLocationEnabled}" data-toggle-live-location>
            <span class="map-live-location-icon" aria-hidden="true">⌖</span>
            <b data-live-location-label>${liveLocationLabel()}</b>
          </button>` : ""}
      </div>
      <div class="map-canvas" data-map-host>
        <div id="interactive-map" class="google-map" aria-label="互動地圖，可用單指拖曳與雙指縮放"><div class="map-loading">載入互動地圖…</div></div>
        <div class="map-gesture-note">單指拖曳 · 雙指縮放</div>
        ${unlocatedCount ? `<div class="map-coordinate-note">${unlocatedCount} 個地點待取得座標</div>` : ""}
        ${!projectedPlaces.length ? `<div class="map-empty"><strong>沒有符合條件的地點</strong><span>${state.mapView === "day" ? "選取的日期尚未安排，或目前篩選太嚴格。" : "調整類型或想去程度後再看看。"}</span></div>` : ""}
      </div>
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
  return `<button class="google-place-pin ${isDayRoute ? "day-route-pin" : ""} ${place.isAirport ? "airport-pin" : ""}" type="button" style="--pin-color:${color}" aria-label="${routeLabel}${escapeHtml(place.name)}${recommendationLabel}"><span>${escapeHtml(place.mark)}</span><b>${badge}</b>${isDayRoute ? `<em>${place.dayOrder}</em>` : ""}</button>`;
}

function openMapNode(place) {
  if (place.isAirport) return window.open(place.sourceUrl, "_blank", "noopener");
  return openPlaceSheet(place.name);
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
          if (url) window.open(url, "_blank", "noopener");
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
      iconSize: [64, 42],
      iconAnchor: [32 - (place.pinOffsetX || 0), 42 - (place.pinOffsetY || 0)],
    });
    L.marker(point, { icon, title: place.name })
      .addTo(activeLeafletMap)
      .on("click", () => openMapNode(place));
  });
  if (bounds.length > 1) activeLeafletMap.fitBounds(bounds, { padding: [42, 42] });
  else activeLeafletMap.setView(bounds[0] || [35.6762, 139.6503], bounds.length ? 14 : 11);
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
      body: JSON.stringify({ places: missing.map((place) => ({ sourceUrl: place.sourceUrl, hintName: place.name })) }),
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
    .filter((item) => state.shoppingStatus === "all" || (state.shoppingStatus === "done" ? item.purchased : !item.purchased))
    .sort((a, b) => Number(a.purchased) - Number(b.purchased) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

function shoppingItemMarkup(item) {
  const photo = shoppingPhoto(item.photoId);
  const selected = shoppingSelectedIds.has(item.id);
  const tags = item.recipientTagIds
    .map(shoppingTagName)
    .filter(Boolean)
    .map((name) => `<span>${escapeHtml(name)}</span>`)
    .join("");
  return `
    <div class="swipe-row shopping-swipe-row ${shoppingSelectionMode ? "selection-mode" : ""}">
      ${canManageShopping() && !shoppingSelectionMode ? `<button class="swipe-delete" type="button" data-request-delete-shopping="${escapeHtml(item.id)}" aria-label="刪除${escapeHtml(item.name)}">刪除</button>` : ""}
      <article class="shopping-item swipe-surface ${item.purchased ? "purchased" : ""} ${selected ? "selected" : ""}" ${canManageShopping() && !shoppingSelectionMode ? `data-swipe-item="shopping:${escapeHtml(item.id)}"` : ""}>
      <button class="shopping-check" type="button" ${shoppingSelectionMode ? `data-select-shopping-item="${escapeHtml(item.id)}"` : `data-toggle-shopping-item="${escapeHtml(item.id)}"`} aria-label="${shoppingSelectionMode ? (selected ? "取消選取" : "選取項目") : (item.purchased ? "改為尚未購買" : "標記為已購買")}">
        <span>${shoppingSelectionMode ? (selected ? "✓" : "") : (item.purchased ? "✓" : "")}</span>
      </button>
      <button class="shopping-item-main" type="button" ${shoppingSelectionMode ? `data-select-shopping-item="${escapeHtml(item.id)}"` : `data-open-shopping-item="${escapeHtml(item.id)}"`}>
        <span class="shopping-thumb">${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}截圖" />` : `<b>${escapeHtml(item.name.slice(0, 1))}</b>`}</span>
        <span class="shopping-item-copy">
          <span class="shopping-item-heading"><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(shoppingCategoryName(item.categoryId))}</em></span>
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
      <div class="shopping-category-tabs">${categoryTabs}</div>
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
    <label class="shopping-tag-option" data-shopping-tag-name="${escapeHtml(tag.name)}">
      <input type="checkbox" name="recipientTag" value="${escapeHtml(tag.id)}" ${selected.has(tag.id) ? "checked" : ""} />
      <span>${escapeHtml(tag.name)}</span>
    </label>`).join("");
}

function shoppingCategoryOptions(selectedId = "daily") {
  return state.shopping.categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === selectedId ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("");
}

function openShoppingDetailSheet(itemId) {
  const item = state.shopping.items.find((candidate) => candidate.id === itemId);
  if (!item) return;
  const photo = shoppingPhoto(item.photoId);
  const tags = item.recipientTagIds.map(shoppingTagName).filter(Boolean);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet shopping-detail-sheet" data-shopping-sheet role="dialog" aria-modal="true" aria-labelledby="shopping-detail-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(shoppingCategoryName(item.categoryId))}</p><h2 id="shopping-detail-title">${escapeHtml(item.name)}</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        ${photo ? `<img class="shopping-detail-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}推薦截圖" />` : `<div class="shopping-detail-photo placeholder"><span>${escapeHtml(item.name.slice(0, 1))}</span></div>`}
        <div class="shopping-detail-state ${item.purchased ? "done" : ""}"><span>${item.purchased ? "✓" : "○"}</span><strong>${item.purchased ? "已經買到了" : "還沒有購買"}</strong></div>
        <section class="shopping-detail-facts"><div><small>品牌</small><strong>${escapeHtml(item.brand || "尚未辨識")}</strong></div><div><small>分類</small><strong>${escapeHtml(shoppingCategoryName(item.categoryId))}</strong></div></section>
        <section class="shopping-detail-block"><small>功效／推薦重點</small><p>${item.benefits ? escapeHtml(item.benefits) : "尚未辨識功效"}</p></section>
        <section class="shopping-detail-block"><small>購買對象</small><div class="shopping-recipient-tags">${tags.length ? tags.map((name) => `<span>${escapeHtml(name)}</span>`).join("") : `<em>尚未標記</em>`}</div></section>
        <section class="shopping-detail-block"><small>備註</small><p>${item.note ? escapeHtml(item.note) : "尚未新增備註"}</p></section>
        <div class="shopping-privacy-note"><b>鎖</b><span>這筆採買只屬於你的「${escapeHtml(state.tripTitle)}」清單，旅伴無法查看。</span></div>
        <div class="modal-actions shopping-detail-actions"><button class="secondary-button" type="button" data-request-delete-shopping="${escapeHtml(item.id)}">刪除</button><button class="primary-button" type="button" data-edit-shopping-item="${escapeHtml(item.id)}">編輯資料</button></div>
      </section>
    </div>`;
}

function openShoppingItemSheet(itemId = "") {
  const existing = state.shopping.items.find((item) => item.id === itemId);
  const item = existing || { id: "", brand: "", name: "", benefits: "", categoryId: state.shoppingFilter === "all" ? "souvenir" : state.shoppingFilter, recipientTagIds: [], note: "", purchased: false, photoId: "" };
  const photo = shoppingPhoto(item.photoId);
  sheetRoot.innerHTML = `
    <div class="modal-backdrop shopping-backdrop" data-dismiss-sheet>
      <form id="shopping-item-form" class="modal-sheet shopping-form-sheet" data-shopping-sheet data-shopping-item-id="${escapeHtml(item.id)}" data-shopping-photo-id="${escapeHtml(item.photoId)}">
        <div class="section-row shopping-sheet-header">
          <div><p class="section-kicker">私人採買</p><h2>${existing ? "編輯採買項目" : "新增採買項目"}</h2></div>
          <div class="header-actions">${shoppingUndoButtonMarkup("sheet-undo-button")}<button class="icon-button" type="button" data-close-sheet>×</button></div>
        </div>
        <div class="shopping-sheet-body">
          ${photo ? `<img class="shopping-form-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}截圖" />` : ""}
          <div class="field"><label>品牌名稱</label><input name="brand" maxlength="100" value="${escapeHtml(item.brand || "")}" placeholder="例如 興和製藥" /></div>
          <div class="field"><label>物品名稱</label><input name="name" required maxlength="100" value="${escapeHtml(item.name)}" placeholder="例如 東京香蕉" /></div>
          <div class="field"><label>功效／推薦重點</label><textarea name="benefits" maxlength="500" placeholder="例如 關節保養、維持靈活行動">${escapeHtml(item.benefits || "")}</textarea></div>
          <div class="field"><label>分類</label><select name="categoryId">${shoppingCategoryOptions(item.categoryId)}</select></div>
          <div class="field"><label>新增自訂分類（選填）</label><input name="newCategory" maxlength="24" placeholder="輸入後會保留在分類列" /></div>
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
  const rows = state.shopping.categories.map((category) => `<div><strong>${escapeHtml(category.name)}</strong><span>${category.builtIn ? "預設分類" : "自訂分類"}</span></div>`).join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form id="shopping-category-form" class="modal-sheet" data-shopping-sheet>
        <div class="section-row"><div><p class="section-kicker">整理方式</p><h2>採買分類</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
        <div class="shopping-category-list">${rows}</div>
        <div class="field"><label>新增自訂分類</label><input name="name" maxlength="24" required placeholder="例如 文具、紀念品" /></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit">新增分類</button></div>
      </form>
    </div>`;
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

async function handlePlaceImportScreenshotFile(input) {
  const status = document.querySelector("[data-social-screenshot-status]");
  const file = input.files?.[0];
  pendingPlaceImportScreenshot = "";
  if (!file) {
    if (status) status.textContent = "尚未選擇圖片";
    return;
  }
  if (status) status.textContent = "正在準備截圖…";
  try {
    pendingPlaceImportScreenshot = await compressShoppingScreenshot(file);
    if (status) status.textContent = `已選擇：${file.name}`;
  } catch {
    input.value = "";
    if (status) status.textContent = "圖片太大或無法讀取，請換一張截圖";
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

function syncPendingShoppingImportEdits(form) {
  if (!form) return;
  form.querySelectorAll("[data-shopping-import-row]").forEach((row) => {
    const entry = pendingShoppingImports.find((candidate) => candidate.id === row.dataset.shoppingImportRow);
    if (!entry) return;
    entry.details = {
      brand: String(row.querySelector("[data-import-brand]")?.value || "").normalize("NFKC").trim().slice(0, 100),
      name: String(row.querySelector("[data-import-name]")?.value || "").normalize("NFKC").trim().slice(0, 100),
      benefits: String(row.querySelector("[data-import-benefits]")?.value || "").normalize("NFKC").trim().slice(0, 500),
      categoryId: String(row.querySelector("[data-import-category]")?.value || "daily"),
    };
  });
}

function renderShoppingImportRows(form) {
  const host = form?.querySelector("[data-shopping-import-results]");
  if (!host) return;
  const busy = form.dataset.shoppingOcrBusy === "true";
  host.innerHTML = pendingShoppingImports.map((entry, index) => `
    <article class="shopping-import-result" data-shopping-import-row="${escapeHtml(entry.id)}">
      <div class="shopping-import-result-head"><span>商品 ${index + 1}</span><button type="button" data-remove-shopping-import="${escapeHtml(entry.id)}" ${busy ? "disabled" : ""}>移除</button></div>
      <img src="${escapeHtml(entry.dataUrl)}" alt="第 ${index + 1} 張推薦商品截圖" />
      ${entry.recognition?.language ? `<p class="shopping-ai-result-note">AI 已理解${escapeHtml(entry.recognition.language)}內容${entry.recognition.confidence ? ` · 判讀信心 ${Math.round(entry.recognition.confidence * 100)}%` : ""}</p>` : ""}
      ${entry.recognitionError ? `<p class="shopping-ai-result-note error">${escapeHtml(entry.recognitionError)}</p>` : ""}
      <div class="shopping-import-fields">
        <div class="field"><label>品牌名稱</label><input data-import-brand maxlength="100" value="${escapeHtml(entry.details?.brand || "")}" placeholder="尚未辨識，可自行輸入" /></div>
        <div class="field"><label>商品名稱</label><input data-import-name required maxlength="100" value="${escapeHtml(entry.details?.name || "")}" placeholder="請確認商品名稱" /></div>
        <div class="field full"><label>功效／推薦重點</label><textarea data-import-benefits maxlength="500" placeholder="可修改自動辨識結果">${escapeHtml(entry.details?.benefits || "")}</textarea></div>
        <div class="field full"><label>自動分類</label><select data-import-category>${shoppingCategoryOptions(entry.details?.categoryId || "daily")}</select></div>
      </div>
    </article>`).join("");
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
    setShoppingRecognitionStatus(form, `AI 正在理解 ${pendingShoppingImports.length} 張圖片…`, { progress: 0.03 });
    for (let currentIndex = 0; currentIndex < pendingShoppingImports.length; currentIndex += 1) {
      const entry = pendingShoppingImports[currentIndex];
      setShoppingRecognitionStatus(form, `AI 正在理解第 ${currentIndex + 1}／${pendingShoppingImports.length} 張商品圖…`, { progress: currentIndex / pendingShoppingImports.length });
      try {
        const result = await recognizeShoppingScreenshotWithAi(entry);
        if (!form.isConnected || token !== shoppingRecognitionToken) return;
        syncPendingShoppingImportEdits(form);
        entry.details = result.details;
        entry.recognition = { language: result.source?.language || "多語言", confidence: Number(result.confidence) || 0 };
        entry.recognitionError = "";
        entry.recognized = true;
        renderShoppingImportRows(form);
      } catch (error) {
        entry.recognitionError = shoppingRecognitionErrorMessage(error);
        entry.recognized = false;
        renderShoppingImportRows(form);
      }
    }
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
  const files = [...(input?.files || [])].filter((file) => file.type.startsWith("image/") && file.size <= 15 * 1024 * 1024).slice(0, 8);
  if (!form || !files.length) return showToast("請選擇 1 至 8 張商品截圖，每張小於 15 MB");
  pendingShoppingImports = [];
  const confirm = form.querySelector('button[type="submit"]');
  if (confirm) confirm.disabled = true;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    setShoppingRecognitionStatus(form, `正在準備第 ${index + 1}／${files.length} 張圖片…`, { progress: (index + 0.15) / files.length });
    try {
      const dataUrl = await compressShoppingScreenshot(file);
      pendingShoppingImports.push({
        id: `shopping-import-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
        file,
        dataUrl,
        details: { brand: "", name: "", benefits: "", categoryId: "daily" },
      });
      renderShoppingImportRows(form);
    } catch {
      showToast(`第 ${index + 1} 張圖片太大，已略過`);
    }
  }
  if (!pendingShoppingImports.length) return setShoppingRecognitionStatus(form, "沒有可處理的圖片，請先裁切或縮小後再試。", { tone: "error" });
  await recognizeShoppingScreenshots(form);
}

function openShoppingImportSheet() {
  pendingShoppingImports = [];
  sheetRoot.innerHTML = `
    <div class="modal-backdrop shopping-backdrop" data-dismiss-sheet>
      <form id="shopping-import-form" class="modal-sheet shopping-form-sheet shopping-import-sheet" data-shopping-sheet>
        <div class="section-row shopping-sheet-header"><div><p class="section-kicker">SCREENSHOT TO LIST</p><h2>辨識推薦截圖</h2></div><div class="header-actions">${shoppingUndoButtonMarkup("sheet-undo-button")}<button class="icon-button" type="button" data-close-sheet>×</button></div></div>
        <div class="shopping-sheet-body">
          <label class="shopping-upload-card" for="shopping-screenshot-input"><span>▧</span><strong>一次選擇多張商品截圖</strong><small>最多 8 張；每張圖片各自辨識一個品牌與商品。</small></label>
          <input id="shopping-screenshot-input" class="shopping-file-input" type="file" accept="image/*" multiple data-shopping-screenshot-input />
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
    ? [...new Set(placeItems.map((item) => areaChineseName(state.places.find((place) => place.name === item.name)?.area || "行程")))].join("／")
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
  const gallery = place.photos?.length
    ? place.photos
        .slice(0, 3)
        .map(
          (photo, index) => `
            <figure class="gallery-card gallery-${index + 1} real-photo">
              <img src="/api/place-photo?name=${encodeURIComponent(photo.name)}" alt="${escapeHtml(place.name)} Google Maps 照片" loading="lazy" />
              <figcaption>${escapeHtml(photo.attribution || "Google Maps 使用者")}</figcaption>
            </figure>`,
        )
        .join("")
    : (place.galleryLabels || ["正在取得 Google Maps 照片", "環境照片", "附近街景"])
        .map(
          (label, index) => `
            <div class="gallery-card gallery-${index + 1}" style="--swatch:${place.swatch}">
              <span>${escapeHtml(label)}</span>
            </div>`,
        )
        .join("");
  const highlights = (place.highlights || [])
    .map((highlight) => `<span class="highlight-tag">${escapeHtml(highlight)}</span>`)
    .join("");

  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet place-detail-sheet" data-detail-place="${escapeHtml(place.name)}" role="dialog" aria-modal="true" aria-labelledby="place-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(place.area)}</p><h2 id="place-title">${escapeHtml(place.name)}</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p class="place-byline">${escapeHtml(place.fullName)} · ${escapeHtml(place.category)}</p>
        <div class="detail-gallery" aria-label="${escapeHtml(place.name)}照片預覽">${gallery}</div>
        <div class="gallery-caption">
          <span>${place.photos?.length ? "Google Maps 景點照片" : "正在同步 Google Maps 照片"}</span>
          <button type="button" data-open-maps="${escapeHtml(place.sourceUrl)}">到 Google Maps 看照片 ↗</button>
        </div>
        <p class="place-description">${escapeHtml(place.description)}</p>
        ${place.referenceUrl ? `<button class="source-reference-button" type="button" data-open-reference="${escapeHtml(place.referenceUrl)}">查看原始 ${escapeHtml(place.sourcePlatform || "社群")} 貼文 ↗</button>` : ""}
        <div class="highlight-list">${highlights}</div>
        <section class="place-contact-grid" aria-label="營業資訊">
          <div class="place-contact-item">
            <small>營業時間</small>
            <strong>${formatOpeningHours(place.openingHours)}</strong>
            <span>Google Maps 參考，出發前請再次確認</span>
          </div>
          <div class="place-contact-item">
            <small>電話</small>
            ${
              place.phone && !place.phone.startsWith("待")
                ? `<a href="tel:${escapeHtml(place.phone.replaceAll("-", ""))}">${escapeHtml(place.phone)}</a>`
                : `<strong>${escapeHtml(place.phone || "待 Google Maps 同步")}</strong>`
            }
          </div>
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
          <button class="primary-button" type="button" data-open-maps="${escapeHtml(place.sourceUrl)}">開啟 Google Maps</button>
        </div>
      </section>
    </div>`;
  ensurePlaceDetails(place);
}

async function ensurePlaceDetails(place) {
  if (!place || place.photosLoaded || place.detailsLoading) return;
  place.detailsLoading = true;
  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ places: [{ sourceUrl: place.sourceUrl, hintName: place.name }] }),
    });
    if (!response.ok) return;
    const resolved = (await response.json()).places?.[0];
    if (!resolved || resolved.error) return;
    Object.assign(place, {
      placeId: resolved.placeId || place.placeId,
      fullName: resolved.name || place.fullName,
      area: resolved.area || place.area,
      areaOriginal: resolved.areaOriginal || place.areaOriginal || place.area,
      category: resolved.category || place.category,
      kind: place.kind || inferPlaceKind(resolved.category || place.category),
      latitude: Number.isFinite(resolved.latitude) ? resolved.latitude : place.latitude,
      longitude: Number.isFinite(resolved.longitude) ? resolved.longitude : place.longitude,
      sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
      openingHours: resolved.openingHours || place.openingHours,
      phone: resolved.phone || place.phone,
      photos: resolved.photos || place.photos || [],
      photosLoaded: true,
    });
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
          <div class="flight-segment-heading" data-flight-outbound-heading hidden><span>去程</span><strong>先填出發與抵達資料</strong></div>
          <div class="flight-form-grid"><div class="field"><label>出發城市</label><input name="departureCity" list="flight-city-options" data-flight-city-side="departure" autocomplete="off" required value="${escapeHtml(flight.departureCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="departureCode" required>${airportOptionsMarkup(flight.departureCity, flight.departureCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "出發日期", name: "departureDate", type: "date", value: flight.departureDate })}${flightDateTimeInputMarkup({ label: "出發時間", name: "departureTime", type: "time", value: flight.departureTime })}</div>
          <div class="flight-form-grid"><div class="field"><label>抵達城市</label><input name="arrivalCity" list="flight-city-options" data-flight-city-side="arrival" autocomplete="off" required value="${escapeHtml(flight.arrivalCity)}" placeholder="選擇城市" /></div><div class="field compact-field"><label>機場</label><select name="arrivalCode" required>${airportOptionsMarkup(flight.arrivalCity, flight.arrivalCode)}</select></div></div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "抵達日期", name: "arrivalDate", type: "date", value: flight.arrivalDate })}${flightDateTimeInputMarkup({ label: "抵達時間", name: "arrivalTime", type: "time", value: flight.arrivalTime })}</div>
        </section>
        <section class="flight-return-fields" data-flight-return-fields hidden>
          <div class="flight-segment-heading"><span>回程</span><strong data-flight-return-route>目的地 → 出發地</strong></div>
          <p class="field-note">回程會自動使用相反方向的城市與機場。</p>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "回程出發日期", name: "returnDepartureDate", type: "date", value: state.endDate, required: false })}${flightDateTimeInputMarkup({ label: "回程出發時間", name: "returnDepartureTime", type: "time", value: "17:00", required: false })}</div>
          <div class="field-grid flight-date-time-grid">${flightDateTimeInputMarkup({ label: "回程抵達日期", name: "returnArrivalDate", type: "date", value: state.endDate, required: false })}${flightDateTimeInputMarkup({ label: "回程抵達時間", name: "returnArrivalTime", type: "time", value: "21:00", required: false })}</div>
        </section>
        <datalist id="flight-city-options">${cityOptions}</datalist>
        <p class="flight-airport-note">選擇城市後，機場欄位會自動列出該城市可用的機場。</p>
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

function openDeleteConfirmation({ kind, name, date = "" }) {
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
          <button class="secondary-button" type="button" data-close-sheet>取消</button>
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

function isSocialPlaceUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ["instagram.com", "www.instagram.com", "threads.net", "www.threads.net", "threads.com", "www.threads.com"].includes(host);
  } catch {
    return false;
  }
}

function socialPlaceUrls(value) {
  return [...new Set((String(value).match(/https?:\/\/[^\s<>"']+/g) || [])
    .map((url) => url.replace(/[),，。]+$/, ""))
    .filter(isSocialPlaceUrl))].slice(0, 3);
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
    && (!place?.isSocialCandidate || place.selected === true)
    && !importAlreadyExists(place);
}

function extractNameFromGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const queryName = url.searchParams.get("query") || url.searchParams.get("q");
    if (queryName) return decodeURIComponent(queryName.replaceAll("+", " ")).trim();
    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replaceAll("+", " ")).trim();
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

  lines.forEach((line, index) => {
    const urls = line.match(/https?:\/\/[^\s<>"']+/g) || [];
    if (!urls.length) {
      const nextLine = lines[index + 1] || "";
      if (/https?:\/\/[^\s<>"']+/.test(nextLine)) {
        if (pendingLabel) candidates.push({ label: pendingLabel, url: "" });
        pendingLabel = line;
      } else {
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
    const parsedName = known?.name || lineName || extractNameFromGoogleMapsUrl(url);
    const identity = normalizeGoogleMapsUrl(url) || parsedName.toLowerCase();
    if (!identity || seen.has(identity)) return;
    seen.add(identity);
    const isExisting = importAlreadyExists({ name: parsedName, sourceUrl: url });
    const canImport = Boolean(parsedName || normalizeGoogleMapsUrl(url));
    entries.push({
      ...(known || {}),
      name: parsedName || "正在辨識 Google Maps 地點",
      fullName: known?.fullName || parsedName || "正在辨識 Google Maps 地點",
      category: known?.category || inferPlaceCategory(parsedName || ""),
      kind: known?.kind || inferPlaceKind(known?.category || inferPlaceCategory(parsedName || "")),
      area: known?.area || inferPlaceArea(parsedName || ""),
      sourceUrl:
        url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsedName)}`,
      swatch: known?.swatch || "#587a73",
      mark: known?.mark || (parsedName || "?").slice(0, 1),
      latitude: known?.latitude ?? null,
      longitude: known?.longitude ?? null,
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
        description: `${resolved.name}位於${resolved.area || place.area || "待確認區域"}，由 Google Places 自動補齊地點資料。`,
        highlights: [resolved.category || "Google Maps 匯入", resolved.area || place.area || "待確認區域"],
        recognition: "complete",
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
  if (code === "PLACE_NOT_RECOGNIZED") return "AI 還無法確認貼文中的地點，請上傳更清楚的截圖後再試。";
  if (code === "GOOGLE_PLACE_NOT_FOUND") return "已理解貼文內容，但 Google Maps 找不到足夠吻合的地點。";
  if (code === "DAILY_RECOGNITION_LIMIT") return "今天的社群地點辨識次數已達上限，請稍後再試。";
  if (code === "AI_RECOGNITION_NOT_CONFIGURED") return "AI 辨識服務尚未啟用。";
  if (code === "PLACES_API_NOT_CONFIGURED") return "Google Places 服務尚未啟用。";
  if (code.startsWith("GOOGLE_PLACES_")) return "已辨識貼文內容，但 Google Maps 候選搜尋暫時失敗，請再試一次。";
  if (code.startsWith("OPENAI_402") || code.startsWith("OPENAI_429_INSUFFICIENT_QUOTA")) return "OpenAI API 額度不足，請補充額度後再試。";
  if (code.startsWith("OPENAI_429") || error?.status === 429) return "AI 辨識服務目前忙碌，請稍後再試。";
  return "社群貼文暫時無法辨識，請上傳截圖後重試。";
}

function socialGroupsToImports(payload, sourceIndex = 0) {
  return (payload.groups || []).flatMap((group, groupIndex) => {
    const groupId = `social-${sourceIndex + 1}-${group.id || groupIndex + 1}`;
    const candidates = (group.candidates || []).map((candidate, candidateIndex) => ({
      ...candidate,
      addedBy: currentMemberId(),
      addedByName: state.profile?.nickname || "我",
      recognition: "complete",
      canImport: Boolean(candidate.name && candidate.sourceUrl),
      isExisting: importAlreadyExists(candidate),
      isSocialCandidate: true,
      candidateGroupId: groupId,
      candidateLabel: group.extracted?.name || candidate.name,
      candidateRank: Number(candidate.candidateRank) || candidateIndex + 1,
      selected: false,
    }));
    const preferred = candidates.find((candidate) => candidate.canImport && !candidate.isExisting);
    if (preferred) preferred.selected = true;
    return candidates;
  });
}

async function recognizeSocialPlace(sourceUrl, sharedText, imageDataUrl, sourceIndex) {
  const response = await fetch("/api/social-place-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tripId: state.tripId,
      sourceUrl,
      sharedText,
      imageDataUrl,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "SOCIAL_PLACE_RECOGNITION_FAILED");
    error.status = response.status;
    error.platform = payload.platform || "社群貼文";
    throw error;
  }
  return socialGroupsToImports(payload, sourceIndex);
}

function updateImportConfirmState() {
  const addableCount = pendingPlaceImports.filter(importCanBeAdded).length;
  const confirmButton = document.querySelector("[data-confirm-import]");
  if (confirmButton) {
    confirmButton.disabled = addableCount === 0;
    confirmButton.textContent = addableCount ? `加入 ${addableCount} 個地點` : "沒有可新增地點";
  }
}

function importPreviewMarkup(entries) {
  if (!entries.length) {
    return `${pendingPlaceImportNotice ? `<p class="import-feedback error">${escapeHtml(pendingPlaceImportNotice)}</p>` : ""}<div class="import-empty"><strong>沒有找到可辨識的內容</strong><span>請貼上 Google Maps 或社群貼文連結，也可上傳截圖。</span></div>`;
  }
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
      const radio = place.isSocialCandidate
        ? `<input class="import-candidate-radio" type="radio" name="${escapeHtml(place.candidateGroupId)}" data-social-place-candidate="${escapeHtml(place.placeId || place.sourceUrl)}" data-candidate-group="${escapeHtml(place.candidateGroupId)}" ${place.selected ? "checked" : ""} ${isExisting ? "disabled" : ""} aria-label="選擇 ${escapeHtml(place.name)}" />`
        : "";
      return `
        <article class="import-place-row ${place.isSocialCandidate ? "social-candidate" : ""} ${place.selected ? "selected" : ""} ${status[0]}">
          ${radio}
          <span class="mini-thumb" style="--swatch:${place.swatch}">${escapeHtml(place.mark)}</span>
          <div><strong>${escapeHtml(place.name)}</strong>${socialMeta}</div>
          <b>${status[1]}</b>
        </article>`;
    })
    .join("");
  const addableCount = entries.filter(importCanBeAdded).length;
  return `${pendingPlaceImportNotice ? `<p class="import-feedback error">${escapeHtml(pendingPlaceImportNotice)}</p>` : ""}${rows}<p class="import-summary">可新增 ${addableCount} 個地點；社群候選請先確認，重複項目會自動略過。</p>`;
}

function openAddPlaceSheet() {
  pendingPlaceImports = [];
  pendingPlaceImportScreenshot = "";
  pendingPlaceImportNotice = "";
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet import-places-sheet" id="import-places-form">
        <div class="section-row">
          <div><p class="section-kicker">地點匯入</p><h2>新增地點</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p>貼上地點或社群連結，也可直接上傳截圖或拍照辨識。</p>
        <div class="field"><label for="import-place-kind">加入哪一類</label><select id="import-place-kind" name="placeKind"><option value="auto">依 Google Maps 自動判斷</option><option value="attraction">景點</option><option value="restaurant">餐廳</option><option value="lodging">住宿</option></select><span class="field-note">新增飯店或民宿時可直接選擇「住宿」。</span></div>
        <div class="field">
          <label for="google-maps-list">貼上連結</label>
          <textarea id="google-maps-list" name="mapsList" rows="4" placeholder="Google Maps 地點或公開清單&#10;Instagram、Reels 或 Threads 貼文"></textarea>
          <span class="field-note">社群貼文會先由 AI 理解，再列出 Google Maps 候選供你確認。</span>
        </div>
        <label class="social-screenshot-picker social-screenshot-picker-standalone" for="social-place-screenshot"><span>上傳截圖或拍照</span><small data-social-screenshot-status>尚未選擇圖片</small></label>
        <input class="visually-hidden" id="social-place-screenshot" type="file" accept="image/jpeg,image/png,image/webp" data-social-place-screenshot />
        <span class="social-import-input-note">連結和截圖可擇一使用；一起提供時辨識會更準確。</span>
        <button class="analyze-button" type="button" data-analyze-places>⌁　辨識地點、清單或貼文</button>
        <div id="import-preview" class="import-preview" aria-live="polite"></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit" data-confirm-import disabled>加入收藏</button></div>
      </form>
    </div>`;
}

function openDateSheet(area) {
  const options = dateMeta
    .map(([date, weekday]) => `<option value="${date}" ${date === state.selectedDate ? "selected" : ""}>${date} ${weekday}</option>`)
    .join("");
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet" id="add-area-form" data-area="${escapeHtml(area)}">
        <div class="section-row"><div><p class="section-kicker">${escapeHtml(area)}</p><h2>加入同一天</h2></div><button class="icon-button" type="button" data-close-sheet>×</button></div>
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
          <div><p class="section-kicker">${escapeHtml(place.area)}</p><h2>加入某一天</h2></div>
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
        <span class="itinerary-place-copy"><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(areaChineseName(place.area))} · ${escapeHtml(kindLabel(place.kind))}</small></span>
        <b>${escapeHtml(status)}</b>
      </label>`;
  }).join("");
  const kindTabs = [["all", "全部"], ["attraction", "景點"], ["restaurant", "餐廳"], ["lodging", "住宿"]]
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

  const openShoppingItem = event.target.closest("[data-open-shopping-item]");
  if (openShoppingItem) return openShoppingDetailSheet(openShoppingItem.dataset.openShoppingItem);

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

  const addArea = event.target.closest("[data-add-area-day]");
  if (addArea) return canEdit() ? openDateSheet(addArea.dataset.addAreaDay) : guestOnlyMessage();

  const addPlaceDate = event.target.closest("[data-add-place-date]");
  if (addPlaceDate) return canEdit() ? openAddPlaceDateSheet(addPlaceDate.dataset.addPlaceDate) : guestOnlyMessage();

  if (event.target.closest("[data-add-place]")) return canEdit() ? openAddPlaceSheet() : guestOnlyMessage();

  const analyzePlaces = event.target.closest("[data-analyze-places]");
  if (analyzePlaces) {
    const textarea = document.querySelector("#google-maps-list");
    const preview = document.querySelector("#import-preview");
    if (!textarea || !preview) return;
    analyzePlaces.disabled = true;
    analyzePlaces.textContent = "正在理解連結與地點…";
    preview.innerHTML = `<div class="import-empty loading"><strong>正在辨識</strong><span>社群貼文會先理解內容，再比對 Google Maps 候選。</span></div>`;
    pendingPlaceImports = [];
    pendingPlaceImportNotice = "";
    const notices = [];
    try {
      pendingPlaceImports = parseGoogleMapsList(textarea.value);
      pendingPlaceImports = await expandGoogleMapsSharedLists(pendingPlaceImports);
      pendingPlaceImports = await enrichPlaceImportsFromApi(pendingPlaceImports);
      const mapImports = [...pendingPlaceImports];

      const socialUrls = socialPlaceUrls(textarea.value);
      const socialSources = socialUrls.length
        ? socialUrls
        : pendingPlaceImportScreenshot
          ? [""]
          : [];
      for (let sourceIndex = 0; sourceIndex < socialSources.length; sourceIndex += 1) {
        try {
          const socialImports = await recognizeSocialPlace(
            socialSources[sourceIndex],
            "",
            sourceIndex === 0 ? pendingPlaceImportScreenshot : "",
            sourceIndex,
          );
          pendingPlaceImports.push(...socialImports);
        } catch (error) {
          notices.push(socialImportErrorMessage(error));
        }
      }
      if (!mapImports.length && !socialSources.length && textarea.value.trim()) {
        notices.push("沒有找到支援的連結，請貼上 Google Maps、Instagram 或 Threads 分享網址。");
      }
    } catch {
      notices.push("地點資料暫時無法辨識，請稍後再試。");
    } finally {
      pendingPlaceImportNotice = [...new Set(notices)].join(" ");
      preview.innerHTML = importPreviewMarkup(pendingPlaceImports);
      updateImportConfirmState();
      analyzePlaces.disabled = false;
      analyzePlaces.textContent = "⌁　重新辨識";
    }
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
  if (mapLink) return window.open(mapLink.dataset.openMaps, "_blank", "noopener");

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
    return url ? window.open(url, "_blank", "noopener") : showToast("請先補上交通起點與終點");
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

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-social-place-screenshot]")) {
    handlePlaceImportScreenshotFile(event.target);
    return;
  }

  if (event.target.matches("[data-social-place-candidate]")) {
    const groupId = event.target.dataset.candidateGroup;
    const identity = event.target.dataset.socialPlaceCandidate;
    pendingPlaceImports.forEach((place) => {
      if (place.candidateGroupId === groupId) {
        place.selected = (place.placeId || place.sourceUrl) === identity;
      }
    });
    const preview = document.querySelector("#import-preview");
    if (preview) preview.innerHTML = importPreviewMarkup(pendingPlaceImports);
    updateImportConfirmState();
    return;
  }

  if (event.target.matches("[data-shopping-screenshot-input]")) {
    handleShoppingScreenshotFile(event.target);
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

document.addEventListener("submit", async (event) => {
  if (event.target.id === "shopping-item-form") {
    event.preventDefault();
    if (!canManageShopping()) return guestOnlyMessage();
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").normalize("NFKC").trim().slice(0, 100);
    if (!name) return showToast("請輸入採買物品名稱");
    recordShoppingUndo();
    const now = new Date().toISOString();
    const itemId = event.target.dataset.shoppingItemId || `shopping-${crypto.randomUUID?.() || Date.now()}`;
    const index = state.shopping.items.findIndex((item) => item.id === itemId);
    const previous = index >= 0 ? state.shopping.items[index] : null;
    const item = {
      id: itemId,
      brand: String(form.get("brand") || "").normalize("NFKC").trim().slice(0, 100),
      name,
      benefits: String(form.get("benefits") || "").normalize("NFKC").trim().slice(0, 500),
      categoryId: shoppingCustomCategory(form.get("newCategory"), String(form.get("categoryId") || "daily")),
      recipientTagIds: shoppingRecipientTagIds(form),
      note: String(form.get("note") || "").normalize("NFKC").trim().slice(0, 800),
      purchased: form.get("purchased") === "on",
      photoId: event.target.dataset.shoppingPhotoId || "",
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    if (index >= 0) state.shopping.items[index] = item;
    else state.shopping.items.unshift(item);
    state.shoppingFilter = item.categoryId;
    closeSheet();
    render();
    await saveShopping();
    return showToast(index >= 0 ? "採買資料已更新" : "已加入私人採買清單", { allowUndo: false });
  }

  if (event.target.id === "shopping-category-form") {
    event.preventDefault();
    if (!canManageShopping()) return guestOnlyMessage();
    const name = String(new FormData(event.target).get("name") || "").normalize("NFKC").trim().slice(0, 24);
    if (!name) return showToast("請輸入分類名稱");
    recordShoppingUndo();
    const categoryId = shoppingCustomCategory(name);
    state.shoppingFilter = categoryId;
    closeSheet();
    render();
    await saveShopping();
    return showToast(`已新增「${name}」分類`, { allowUndo: false });
  }

  if (event.target.id === "shopping-import-form") {
    event.preventDefault();
    if (!canManageShopping()) return guestOnlyMessage();
    const form = new FormData(event.target);
    syncPendingShoppingImportEdits(event.target);
    const imports = pendingShoppingImports.filter((entry) => entry.details?.name).slice(0, 8);
    if (!imports.length) return showToast("請保留至少一個有商品名稱的項目");
    recordShoppingUndo();
    const recipientTagIds = shoppingRecipientTagIds(form);
    const note = String(form.get("note") || "").normalize("NFKC").trim().slice(0, 800);
    const now = new Date().toISOString();
    const additions = imports.map((entry, index) => {
      const photoId = `shopping-photo-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`;
      state.shopping.photos[photoId] = { dataUrl: entry.dataUrl, createdAt: new Date(Date.now() + index).toISOString() };
      return {
        id: `shopping-${crypto.randomUUID?.() || `${Date.now()}-${index}`}`,
        brand: entry.details.brand,
        name: entry.details.name,
        benefits: entry.details.benefits,
        categoryId: entry.details.categoryId || "daily",
        recipientTagIds,
        note,
        purchased: false,
        photoId,
        createdAt: now,
        updatedAt: now,
      };
    });
    state.shopping.items.unshift(...additions);
    pruneShoppingPhotos();
    const categories = [...new Set(additions.map((item) => item.categoryId))];
    state.shoppingFilter = categories.length === 1 ? categories[0] : "all";
    closeSheet();
    render();
    await saveShopping();
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
    if (isRoundTrip) {
      const batchId = crypto.randomUUID?.() || Date.now();
      state.flights.push(
        { ...baseFlight, id: `flight-${batchId}-outbound`, direction: "去程" },
        {
          ...baseFlight,
          id: `flight-${batchId}-return`,
          direction: "回程",
          departureCity: baseFlight.arrivalCity,
          departureCode: baseFlight.arrivalCode,
          departureDate: String(form.get("returnDepartureDate") || ""),
          departureTime: String(form.get("returnDepartureTime") || ""),
          arrivalCity: baseFlight.departureCity,
          arrivalCode: baseFlight.departureCode,
          arrivalDate: String(form.get("returnArrivalDate") || ""),
          arrivalTime: String(form.get("returnArrivalTime") || ""),
        },
      );
    } else {
      const flight = {
        ...baseFlight,
        id: event.target.dataset.flightId || `flight-${crypto.randomUUID?.() || Date.now()}`,
        direction: direction === "回程" ? "回程" : "去程",
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
    return showToast(isRoundTrip ? "來回航班已新增" : index >= 0 ? "航班已更新" : "航班已新增");
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
    const additions = parsed
      .filter(importCanBeAdded)
      .map(({ recognition, isExisting, canImport, selected, isSocialCandidate, candidateGroupId, candidateLabel, candidateRank, matchConfidence, ...place }) => ({
        ...place,
        kind: requestedKind === "auto" ? (place.kind || inferPlaceKind(place.category)) : requestedKind,
      }));
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
    const area = event.target.dataset.area;
    const existing = state.itinerary[date] || [];
    const existingNames = new Set(existing.map((item) => item.name));
    const additions = state.places
      .filter((place) => place.area === area && !existingNames.has(place.name))
      .map((place, index) => ({
        name: place.name,
        time: index === 0 ? "11:00" : `${Math.min(18, 14 + index * 3)}:00`,
      }));
    state.itinerary[date] = [...existing, ...additions];
    state.selectedDate = date;
    persist();
    closeSheet();
    setTab("itinerary");
    showToast(additions.length ? `已將 ${additions.length} 個${area}地點加入 ${date}` : `${area}地點已在 ${date}`);
  }
});

persist({ sync: false, resetUndo: true });
render();
if (!state.profile && !state.isGuest) openProfileSheet(true);
if (state.profile) {
  loadTrips()
    .then(() => {
      if (state.pendingInviteCode) openJoinTripSheet();
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
window.addEventListener("pagehide", () => stopLiveLocation());
