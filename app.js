const fallbackPlaces = [
  {
    name: "銀座八芳",
    fullName: "Seafood Buffet Dining Ginza Happo",
    category: "自助餐餐廳",
    area: "銀座",
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

const dateMeta = [
  ["9/20", "週日"],
  ["9/21", "週一"],
  ["9/22", "週二"],
  ["9/23", "週三"],
  ["9/24", "週四"],
  ["9/25", "週五"],
  ["9/26", "週六"],
];

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

const state = {
  activeTab: "overview",
  placesMode: "list",
  selectedArea: "",
  selectedMapPlace: "",
  mapView: "planning",
  mapCategory: "all",
  mapPreference: "all",
  selectedDate: "9/22",
  places: [
    ...fallbackPlaces
      .filter((place) => !savedDeletedPlaces.includes(place.name))
      .map((place) => ({ ...place, ...placeDetails[place.name] })),
    ...savedCustomPlaces.map((place) => ({
      description: "這是家人新增的收藏地點，詳細介紹可以稍後再補上。",
      highlights: ["自訂收藏"],
      galleryLabels: ["地點照片", "環境照片", "附近街景"],
      openingHours: "待 Google Maps 同步",
      phone: "待 Google Maps 同步",
      addedByName: "璋",
      ...place,
    })),
  ],
  deletedPlaces: savedDeletedPlaces,
  profile: savedProfile,
  isGuest: savedAccessMode === "guest" && !savedProfile,
  members: savedProfile ? { [savedProfile.id]: savedProfile.nickname } : {},
  sharedRevision: 0,
  votes: JSON.parse(
    localStorage.getItem("tokyo-votes-v2") || JSON.stringify(defaultVotes),
  ),
  itinerary: JSON.parse(localStorage.getItem("tokyo-itinerary") || "{}"),
};

const app = document.querySelector("#app");
const sheetRoot = document.querySelector("#sheet-root");
const toastRoot = document.querySelector("#toast-root");
let pendingPlaceImports = [];
let sharedSaveTimer = 0;
let sharedSyncBusy = false;
let mapRenderToken = 0;
let activeLeafletMap = null;
let googleMapsLoader = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function canEdit() {
  return Boolean(state.profile) && !state.isGuest;
}

function currentMemberId() {
  return state.profile?.id || "";
}

function persist({ sync = true } = {}) {
  localStorage.setItem("tokyo-votes-v2", JSON.stringify(state.votes));
  if (state.profile) {
    localStorage.setItem("tokyo-profile-v1", JSON.stringify(state.profile));
  }
  localStorage.setItem("tokyo-itinerary", JSON.stringify(state.itinerary));
  localStorage.setItem("tokyo-deleted-places-v1", JSON.stringify(state.deletedPlaces));
  localStorage.setItem(
    "tokyo-custom-places",
    JSON.stringify(state.places.filter((place) => place.isCustom)),
  );
  if (sync && canEdit()) {
    window.clearTimeout(sharedSaveTimer);
    sharedSaveTimer = window.setTimeout(saveSharedTrip, 120);
  }
}

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

function formatOpeningHours(value = "") {
  return escapeHtml(value || "待 Google Maps 同步").replace(
    /([（(][^）)]*最晚[^）)]*[）)])/g,
    '<br><span class="last-entry-time">$1</span>',
  );
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

function deletePlace(name) {
  if (!canEdit()) return false;
  const place = state.places.find((item) => item.name === name);
  if (!place) return false;
  state.places = state.places.filter((item) => item.name !== name);
  if (!place.isCustom && !state.deletedPlaces.includes(name)) state.deletedPlaces.push(name);
  delete state.votes[name];
  Object.keys(state.itinerary).forEach((date) => {
    state.itinerary[date] = (state.itinerary[date] || []).filter((item) => item.name !== name);
  });
  if (!state.places.some((item) => item.area === state.selectedArea)) state.selectedArea = "";
  if (state.selectedMapPlace === name) state.selectedMapPlace = "";
  persist();
  return true;
}

function deleteItineraryItem(date, name) {
  if (!canEdit()) return false;
  const items = state.itinerary[date] || [];
  const nextItems = items.filter((item) => item.name !== name);
  if (nextItems.length === items.length) return false;
  state.itinerary[date] = nextItems;
  persist();
  return true;
}

function reorderItineraryItem(date, sourceName, targetName) {
  if (!canEdit()) return false;
  const items = state.itinerary[date] || [];
  const sourceIndex = items.findIndex((item) => item.name === sourceName);
  const targetIndex = items.findIndex((item) => item.name === targetName);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
  const [movedItem] = items.splice(sourceIndex, 1);
  items.splice(targetIndex, 0, movedItem);
  persist();
  return true;
}

function moveItineraryItem(date, name, direction) {
  if (!canEdit()) return false;
  const items = state.itinerary[date] || [];
  const index = items.findIndex((item) => item.name === name);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return false;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  persist();
  return true;
}

function showToast(message) {
  toastRoot.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastRoot.innerHTML = "";
  }, 2200);
}

function sharedTripPayload() {
  return {
    places: state.places,
    votes: state.votes,
    itinerary: state.itinerary,
    members: state.members,
  };
}

function applySharedTrip(payload) {
  if (!payload || !Array.isArray(payload.places)) return false;
  state.places = payload.places;
  state.votes = payload.votes && typeof payload.votes === "object" ? payload.votes : {};
  state.itinerary = payload.itinerary && typeof payload.itinerary === "object" ? payload.itinerary : {};
  state.members = payload.members && typeof payload.members === "object" ? payload.members : {};
  if (state.profile) state.members[state.profile.id] = state.profile.nickname;
  state.sharedRevision = Number(payload.revision) || state.sharedRevision;
  return true;
}

async function saveSharedTrip() {
  if (!canEdit() || sharedSyncBusy) return;
  sharedSyncBusy = true;
  try {
    state.members[currentMemberId()] = state.profile.nickname;
    const response = await fetch("/api/trip", {
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

async function loadSharedTrip({ quiet = false } = {}) {
  if (sharedSyncBusy) return;
  try {
    const response = await fetch("/api/trip", { cache: "no-store" });
    if (response.status === 404) {
      if (canEdit()) saveSharedTrip();
      return;
    }
    if (!response.ok) throw new Error("LOAD_FAILED");
    const payload = await response.json();
    if ((Number(payload.revision) || 0) < state.sharedRevision) return;
    if (applySharedTrip(payload)) {
      persist({ sync: false });
      render({ preserveScroll: true });
    }
  } catch {
    if (!quiet) showToast("目前顯示離線資料");
  }
}

function guestOnlyMessage() {
  showToast("訪客只能閱覽；登入暱稱後即可參與規劃");
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  render();
}

function overviewScreen() {
  const cards = state.places
    .map(
      (place) => `
        <button class="preview-card" style="--swatch:${place.swatch}" data-open-place="${escapeHtml(place.name)}">
          <strong>${escapeHtml(place.name)}</strong>
        </button>`,
    )
    .join("");

  return `
    <section class="screen">
      ${state.isGuest ? `<div class="guest-banner"><span><strong>訪客模式</strong>僅供閱覽</span><button type="button" data-edit-profile>登入參與規劃</button></div>` : ""}
      <header class="title-row">
        <div>
          <h1>東京 7 日</h1>
          <p class="subtitle">9/20–9/26</p>
        </div>
        <button class="profile-button" type="button" data-edit-profile aria-label="編輯旅行暱稱">
          ${state.isGuest ? `<span class="member-avatar guest">訪</span>` : avatarMarkup(currentMemberId())}
          <span><small>${state.isGuest ? "目前身分" : "這趟旅程的我"}</small><strong>${escapeHtml(state.isGuest ? "訪客" : state.profile?.nickname || "設定暱稱")}</strong></span>
        </button>
      </header>

      <section class="flight-section">
        <h2>✈ 航班</h2>
        <div class="flight-card">
          <div class="flight-leg">
            <div class="airport"><strong>高雄</strong><span>KHH · 09:55</span></div>
            <div class="flight-arrow"><span class="plane">✈</span><span>9/20</span></div>
            <div class="airport"><strong>成田</strong><span>NRT · 14:45</span></div>
          </div>
          <div class="flight-leg">
            <div class="airport"><strong>成田</strong><span>NRT · 17:50</span></div>
            <div class="flight-arrow"><span class="plane">✈</span><span>9/26</span></div>
            <div class="airport"><strong>高雄</strong><span>KHH · 21:00</span></div>
          </div>
        </div>
      </section>

      <section class="saved-preview">
        <div class="section-row">
          <h2>已收藏 ${state.places.length} 個地點</h2>
          <button class="icon-button" type="button" data-go-tab="places" aria-label="查看所有地點">→</button>
        </div>
        <div class="preview-rail">${cards}</div>
      </section>

      <button class="primary-button" type="button" data-go-tab="places">繼續規劃　→</button>
    </section>`;
}

function placesScreen() {
  if (state.placesMode === "map") return mapScreen();

  const areas = [...new Set(state.places.map((place) => place.area))];
  const groups = areas
    .map((area) => {
      const rows = state.places
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
          <h2 class="group-title">⌖ ${escapeHtml(area)}</h2>
          <div class="place-list">${rows}</div>
        </section>`;
    })
    .join("");

  return `
    <section class="screen">
      <header class="title-row">
        <div><h1>收藏地點</h1><p class="meta">${state.places.length} 個地點</p></div>
        ${canEdit() ? `<button class="round-button" type="button" data-add-place aria-label="新增地點">＋</button>` : `<span class="readonly-badge">訪客唯讀</span>`}
      </header>
      ${placesSegment("list")}
      ${groups || `<div class="empty-state"><div><b>還沒有收藏地點</b><span>新增第一個想一起討論的景點。</span></div></div>`}
      ${canEdit() ? `<div class="list-footer"><button class="primary-button" type="button" data-add-place>＋　新增地點</button></div>` : ""}
    </section>`;
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

function filteredMapPlaces() {
  const allProjectedPlaces = projectPlaces(state.places);
  const dayItems = state.itinerary[state.selectedDate] || [];
  const dayNames = new Set(dayItems.map((item) => item.name));
  return allProjectedPlaces.filter((place) => {
    if (state.mapView === "day" && !dayNames.has(place.name)) return false;
    return matchesMapFilters(place);
  });
}

function mapScreen() {
  const projectedPlaces = filteredMapPlaces();
  const unlocatedCount = state.places.length - projectPlaces(state.places).length;
  const categories = [...new Set(state.places.map((place) => place.category))].sort();
  const mapCenter = projectedPlaces.length
    ? {
        latitude: projectedPlaces.reduce((sum, place) => sum + place.latitude, 0) / projectedPlaces.length,
        longitude: projectedPlaces.reduce((sum, place) => sum + place.longitude, 0) / projectedPlaces.length,
      }
    : { latitude: 35.6762, longitude: 139.6503 };

  const categoryOptions = [
    `<option value="all">所有類型</option>`,
    ...categories.map(
      (category) => `<option value="${escapeHtml(category)}" ${state.mapCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`,
    ),
  ].join("");
  const dateOptions = [
    `<option value="all" ${state.mapView === "planning" ? "selected" : ""}>所有日期</option>`,
    ...dateMeta.map(
      ([date, weekday]) => `<option value="${date}" ${state.mapView === "day" && state.selectedDate === date ? "selected" : ""}>${date} ${weekday}</option>`,
    ),
  ].join("");

  return `
    <section class="screen map-screen">
      <div class="map-toolbar">
        <div><h2 style="margin:0">${state.mapView === "planning" ? "規劃地圖" : `${state.selectedDate} 當日地圖`}</h2><p class="meta" style="margin:4px 0 0">顯示 ${projectedPlaces.length} 個地點</p></div>
        <span class="coordinate-badge" title="可單指拖曳的互動地圖">互動地圖</span>
      </div>
      <div style="margin-top:14px">${placesSegment("map")}</div>
      <div class="map-purpose-tabs" aria-label="地圖用途">
        <button class="${state.mapView === "planning" ? "active" : ""}" type="button" data-map-view="planning"><strong>規劃地圖</strong><span>全部候選</span></button>
        <button class="${state.mapView === "day" ? "active" : ""}" type="button" data-map-view="day"><strong>當日地圖</strong><span>拜訪順序</span></button>
      </div>
      <div class="map-filters" aria-label="地圖篩選">
        <label><span>日期</span><select data-map-date>${dateOptions}</select></label>
        <label><span>類型</span><select data-map-category>${categoryOptions}</select></label>
        <label><span>想去程度</span><select data-map-preference>
          <option value="all" ${state.mapPreference === "all" ? "selected" : ""}>全部</option>
          <option value="group" ${state.mapPreference === "group" ? "selected" : ""}>2 人以上</option>
          <option value="mine" ${state.mapPreference === "mine" ? "selected" : ""}>我已標記</option>
          <option value="none" ${state.mapPreference === "none" ? "selected" : ""}>尚未推薦</option>
        </select></label>
      </div>
      <div class="map-legend" aria-label="圖釘狀態">
        <span><i class="candidate"></i>候選</span><span><i class="favorite"></i>2+ 推薦</span><span><i class="scheduled"></i>已排行程</span><span class="muted"><i class="lodging"></i>住宿未設定</span>
      </div>
      <div class="map-canvas" data-map-host>
        <div id="interactive-map" class="google-map" aria-label="互動地圖，可用單指拖曳與雙指縮放"><div class="map-loading">載入互動地圖…</div></div>
        <div class="map-gesture-note">單指拖曳 · 雙指縮放</div>
        ${unlocatedCount ? `<div class="map-coordinate-note">${unlocatedCount} 個地點待取得座標</div>` : ""}
        ${!projectedPlaces.length ? `<div class="map-empty"><strong>沒有符合條件的地點</strong><span>${state.mapView === "day" ? "這一天尚未安排，或目前篩選太嚴格。" : "調整類型或想去程度後再看看。"}</span></div>` : ""}
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

function markerHtml(place) {
  return `<button class="google-place-pin" type="button" style="--pin-color:${mapPinColor(placeMapStatus(place))}" aria-label="${escapeHtml(place.name)}，${placeVoters(place.name).length} 人推薦"><span>${escapeHtml(place.mark)}</span><b>★ ${placeVoters(place.name).length}</b></button>`;
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
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  });
  const bounds = new google.maps.LatLngBounds();
  places.forEach((place) => {
    const position = { lat: place.latitude, lng: place.longitude };
    bounds.extend(position);
    const marker = new google.maps.Marker({
      map,
      position,
      title: place.name,
      label: {
        text: `${place.mark} ${placeVoters(place.name).length}`,
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "800",
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: mapPinColor(placeMapStatus(place)),
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 20,
      },
    });
    marker.addListener("click", () => openPlaceSheet(place.name));
  });
  if (places.length > 1) map.fitBounds(bounds, 42);
}

function renderLeafletInteractiveMap(host, places) {
  if (!window.L) throw new Error("LEAFLET_NOT_AVAILABLE");
  activeLeafletMap?.remove();
  host.innerHTML = "";
  activeLeafletMap = L.map(host, {
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: true,
    tap: true,
    zoomControl: true,
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(activeLeafletMap);
  const bounds = [];
  places.forEach((place) => {
    const point = [place.latitude, place.longitude];
    bounds.push(point);
    const icon = L.divIcon({
      className: "trip-div-icon",
      html: markerHtml(place),
      iconSize: [48, 48],
      iconAnchor: [24, 46],
    });
    L.marker(point, { icon, title: place.name })
      .addTo(activeLeafletMap)
      .on("click", () => openPlaceSheet(place.name));
  });
  if (bounds.length > 1) activeLeafletMap.fitBounds(bounds, { padding: [42, 42] });
  else activeLeafletMap.setView(bounds[0] || [35.6762, 139.6503], bounds.length ? 14 : 11);
}

async function initializeInteractiveMap() {
  const token = ++mapRenderToken;
  const host = document.querySelector("#interactive-map");
  if (!host) return;
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
    const center = places[0] || { latitude: 35.6762, longitude: 139.6503 };
    host.innerHTML = `<iframe title="Google Maps 互動地圖" src="https://www.google.com/maps?q=${center.latitude},${center.longitude}&z=11&output=embed" loading="eager" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  }
}

function itineraryScreen() {
  const dayItems = state.itinerary[state.selectedDate] || [];
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
      const place = state.places.find((candidate) => candidate.name === item.name);
      return `
        <div class="swipe-row timeline-swipe-row ${canEdit() ? "" : "readonly"}">
          ${canEdit() ? `<button class="swipe-delete" type="button" data-request-delete-itinerary="${escapeHtml(item.name)}" data-delete-date="${state.selectedDate}" aria-label="從${state.selectedDate}刪除${escapeHtml(item.name)}">刪除</button>` : ""}
          <article class="timeline-item swipe-surface" data-item-name="${escapeHtml(item.name)}" ${canEdit() ? `data-swipe-item="itinerary:${state.selectedDate}:${escapeHtml(item.name)}"` : ""}>
            <button class="time-button" type="button" ${canEdit() ? `data-edit-time="${escapeHtml(item.name)}"` : "disabled"}>${escapeHtml(item.time)}</button>
            <button class="place-copy place-copy-button timeline-place-details" type="button" data-open-place="${escapeHtml(item.name)}">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="opening-line"><b>營業</b>${formatOpeningHours(place?.openingHours)}</span>
              <span class="phone-line"><b>電話</b>${escapeHtml(place?.phone || "待 Google Maps 同步")}</span>
            </button>
            ${canEdit() ? `<button
              class="drag-handle"
              type="button"
              draggable="true"
              data-drag-name="${escapeHtml(item.name)}"
              data-reorder-menu="${escapeHtml(item.name)}"
              aria-label="調整${escapeHtml(item.name)}順序，目前第 ${index + 1} 個"
            >☰</button>` : ""}
          </article>
        </div>`;
    })
    .join("");

  const area = dayItems.length
    ? [...new Set(dayItems.map((item) => state.places.find((place) => place.name === item.name)?.area || "行程"))].join("／")
    : "尚未安排";

  return `
    <section class="screen">
      <header class="title-row">
        <div><h1>每日行程</h1><p class="meta">先排區域，再調整時間</p></div>
        <button class="icon-button" type="button" aria-label="更多">•••</button>
      </header>
      <div class="date-strip">${dates}</div>
      <div class="day-area">
        <h2>⌖ ${escapeHtml(area)}${dayItems.length ? ` · ${dayItems.length} 個地點` : ""}</h2>
        ${dayItems.length ? `<button class="map-link" type="button" data-day-map>地圖查看　›</button>` : ""}
      </div>
      ${
        dayItems.length
          ? `<div class="timeline">${rows}</div>`
          : `<div class="empty-state"><div><b>這天還沒有地點</b><span>從地圖選取同區景點，加入這一天。</span></div></div>`
      }
      ${canEdit() ? `<button class="outline-button" type="button" data-go-tab="places">＋　加入地點</button>` : `<div class="guest-readonly-note">訪客可查看行程；登入後才能調整時間、順序與景點。</div>`}
      <div class="boundary-card">
        <div class="boundary-row"><span>🛬</span><strong>9/20 14:45 抵達成田</strong></div>
        <div class="boundary-row"><span>🛫</span><strong>9/26 17:50 成田起飛</strong></div>
      </div>
    </section>`;
}

function render({ preserveScroll = false } = {}) {
  const previousScrollTop = app.scrollTop;
  if (state.activeTab === "overview") app.innerHTML = overviewScreen();
  if (state.activeTab === "places") app.innerHTML = placesScreen();
  if (state.activeTab === "itinerary") app.innerHTML = itineraryScreen();
  app.scrollTop = preserveScroll ? previousScrollTop : 0;
  if (state.activeTab === "places" && state.placesMode === "map") {
    window.requestAnimationFrame(initializeInteractiveMap);
  } else {
    mapRenderToken += 1;
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
      fullName: resolved.name || place.fullName,
      area: resolved.area || place.area,
      category: resolved.category || place.category,
      latitude: Number.isFinite(resolved.latitude) ? resolved.latitude : place.latitude,
      longitude: Number.isFinite(resolved.longitude) ? resolved.longitude : place.longitude,
      sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
      openingHours: resolved.openingHours || place.openingHours,
      phone: resolved.phone || place.phone,
      photos: resolved.photos || place.photos || [],
      photosLoaded: true,
    });
    persist();
    if (document.querySelector(`[data-detail-place="${CSS.escape(place.name)}"]`)) openPlaceSheet(place.name);
  } catch {
    // The existing text details remain available when Google Places is temporarily unavailable.
  } finally {
    place.detailsLoading = false;
  }
}

function openProfileSheet(required = false) {
  const current = state.profile?.nickname || "";
  sheetRoot.innerHTML = `
    <div class="modal-backdrop profile-backdrop">
      <form class="modal-sheet profile-sheet" id="profile-form" data-required="${required ? "true" : "false"}">
        <div class="profile-mark">旅</div>
        <p class="section-kicker">一起規劃東京</p>
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
        <div class="modal-actions ${required ? "profile-entry-actions" : ""}">
          ${required ? `<button class="secondary-button" type="button" data-enter-guest>不登入，以訪客瀏覽</button>` : `<button class="secondary-button" type="button" data-close-sheet>取消</button>`}
          <button class="primary-button" type="submit">儲存並開始</button>
        </div>
      </form>
    </div>`;
  window.setTimeout(() => document.querySelector("#profile-nickname")?.focus(), 0);
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

function normalizeGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return "";
  }
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
    [/燒肉|焼肉|牛舌|牛たん|餐廳|Restaurant|Steak/i, "餐廳"],
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

function parseGoogleMapsList(value) {
  const entries = [];
  const seen = new Set();
  String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const urls = line.match(/https?:\/\/[^\s<>"']+/g) || [];
      const candidates = urls.length ? urls : [""];
      candidates.forEach((rawUrl) => {
        const url = rawUrl.replace(/[),，。]+$/, "");
        const lineName = line
          .replace(rawUrl, "")
          .replace(/^[\s•·\-*\d.)、]+/, "")
          .replace(/[|｜:：\-–—]+$/, "")
          .trim();
        const known = url ? knownGooglePlace(url) : null;
        const parsedName = known?.name || lineName || extractNameFromGoogleMapsUrl(url);
        const identity = normalizeGoogleMapsUrl(url) || parsedName.toLowerCase();
        if (!identity || seen.has(identity)) return;
        seen.add(identity);
        const isExisting = state.places.some(
          (place) =>
            (url && normalizeGoogleMapsUrl(place.sourceUrl) === normalizeGoogleMapsUrl(url)) ||
            (parsedName && place.name.toLowerCase() === parsedName.toLowerCase()),
        );
        const canImport = Boolean(parsedName);
        entries.push({
          ...(known || {}),
          name: parsedName || "無法辨識的 Google Maps 短連結",
          fullName: known?.fullName || parsedName || "待辨識地點",
          category: known?.category || inferPlaceCategory(parsedName || ""),
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
          recognition: known ? "complete" : canImport ? "partial" : "unresolved",
          isExisting,
          canImport,
        });
      });
    });
  return entries;
}

async function enrichPlaceImportsFromApi(entries) {
  const targets = entries.filter(
    (place) => !place.isExisting && place.recognition !== "complete",
  );
  if (!targets.length) return entries;

  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        places: targets.map((place) => ({
          sourceUrl: place.sourceUrl,
          hintName: place.canImport ? place.name : "",
        })),
      }),
    });
    if (!response.ok) return entries;
    const payload = await response.json();
    const resolvedByUrl = new Map(
      (payload.places || []).map((place) => [normalizeGoogleMapsUrl(place.requestUrl), place]),
    );

    return entries.map((place) => {
      const resolved = resolvedByUrl.get(normalizeGoogleMapsUrl(place.sourceUrl));
      if (!resolved || resolved.error || !resolved.name) return place;
      const isExisting = state.places.some(
        (existing) =>
          existing.name.toLowerCase() === resolved.name.toLowerCase() ||
          normalizeGoogleMapsUrl(existing.sourceUrl) ===
            normalizeGoogleMapsUrl(resolved.googleMapsUrl || place.sourceUrl),
      );
      return {
        ...place,
        name: resolved.name,
        fullName: resolved.name,
        area: resolved.area || place.area,
        category: resolved.category || place.category,
        sourceUrl: resolved.googleMapsUrl || place.sourceUrl,
        latitude: Number.isFinite(resolved.latitude) ? resolved.latitude : place.latitude,
        longitude: Number.isFinite(resolved.longitude) ? resolved.longitude : place.longitude,
        openingHours: resolved.openingHours || place.openingHours,
        phone: resolved.phone || place.phone,
        photos: resolved.photos || place.photos || [],
        mark: resolved.name.slice(0, 1),
        description: `${resolved.name}位於${resolved.area || "東京"}，由 Google Places 自動補齊地點資料。`,
        highlights: [resolved.category || "Google Maps 匯入", resolved.area || "東京"],
        recognition: "complete",
        isExisting,
        canImport: true,
      };
    });
  } catch {
    return entries;
  }
}

function importPreviewMarkup(entries) {
  if (!entries.length) {
    return `<div class="import-empty"><strong>沒有找到可辨識的內容</strong><span>請貼上 Google Maps 連結，或使用「景點名稱＋連結」。</span></div>`;
  }
  const rows = entries
    .map((place) => {
      const status = place.isExisting
        ? ["duplicate", "已在收藏"]
        : place.recognition === "complete"
          ? ["complete", "資料已辨識"]
          : place.canImport
            ? ["partial", "基本資料已辨識"]
            : ["unresolved", "需要 Places API"];
      return `
        <article class="import-place-row ${status[0]}">
          <span class="mini-thumb" style="--swatch:${place.swatch}">${escapeHtml(place.mark)}</span>
          <div><strong>${escapeHtml(place.name)}</strong><span>${escapeHtml(place.area)} · ${escapeHtml(place.category)}</span><small>${escapeHtml(place.openingHours)}</small></div>
          <b>${status[1]}</b>
        </article>`;
    })
    .join("");
  const addableCount = entries.filter((place) => place.canImport && !place.isExisting).length;
  return `${rows}<p class="import-summary">可新增 ${addableCount} 個地點；重複項目會自動略過。</p>`;
}

function openAddPlaceSheet() {
  pendingPlaceImports = [];
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <form class="modal-sheet import-places-sheet" id="import-places-form">
        <div class="section-row">
          <div><p class="section-kicker">Google Maps 批次匯入</p><h2>一次新增多個景點</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p>每行貼上一個景點連結；短連結前可加上名稱，例如「東京鐵塔 https://maps.app.goo.gl/...」。</p>
        <div class="field">
          <label for="google-maps-list">Google Maps 景點清單</label>
          <textarea id="google-maps-list" name="mapsList" rows="6" required placeholder="銀座八芳 https://maps.app.goo.gl/...&#10;銀座金魚美術館 https://maps.app.goo.gl/..."></textarea>
          <span class="field-note">會自動辨識名稱、區域與類型；正式串接 Places API 後可同步任意地點的營業時間與電話。</span>
        </div>
        <button class="analyze-button" type="button" data-analyze-places>⌁　辨識並預覽</button>
        <div id="import-preview" class="import-preview" aria-live="polite"></div>
        <div class="modal-actions"><button class="secondary-button" type="button" data-close-sheet>取消</button><button class="primary-button" type="submit" data-confirm-import disabled>一次加入收藏</button></div>
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

function openReorderSheet(name) {
  const items = state.itinerary[state.selectedDate] || [];
  const index = items.findIndex((item) => item.name === name);
  if (index < 0) return;
  sheetRoot.innerHTML = `
    <div class="modal-backdrop" data-dismiss-sheet>
      <section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="reorder-title">
        <div class="section-row">
          <div><p class="section-kicker">${escapeHtml(state.selectedDate)}</p><h2 id="reorder-title">調整行程順序</h2></div>
          <button class="icon-button" type="button" data-close-sheet>×</button>
        </div>
        <p>拖曳「☰」也可以直接排序。按鈕是觸控與輔助使用的替代方式。</p>
        <div class="sheet-place">
          <strong>${escapeHtml(name)}</strong>
          <span class="meta">目前第 ${index + 1} 個</span>
        </div>
        <div class="modal-actions">
          <button class="secondary-button" type="button" data-move-item="up" data-move-name="${escapeHtml(name)}" ${index === 0 ? "disabled" : ""}>↑ 上移一格</button>
          <button class="primary-button" type="button" data-move-item="down" data-move-name="${escapeHtml(name)}" ${index === items.length - 1 ? "disabled" : ""}>↓ 下移一格</button>
        </div>
      </section>
    </div>`;
}

function closeSheet() {
  sheetRoot.innerHTML = "";
}

let suppressReorderClick = false;
let pointerDrag = null;
let swipeDrag = null;
let suppressSwipeClick = false;
let previewRailDrag = null;
let suppressPreviewCardClick = false;

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-guest-action]")) return guestOnlyMessage();

  if (event.target.closest("[data-enter-guest]")) {
    state.isGuest = true;
    state.profile = null;
    sessionStorage.setItem("tokyo-access-mode-v1", "guest");
    closeSheet();
    render();
    return showToast("已用訪客身分進入；所有內容皆可閱覽");
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

  const mode = event.target.closest("[data-places-mode]");
  if (mode) {
    state.placesMode = mode.dataset.placesMode;
    if (state.placesMode === "map") state.selectedMapPlace = "";
    return render();
  }

  const mapView = event.target.closest("[data-map-view]");
  if (mapView) {
    state.mapView = mapView.dataset.mapView;
    state.selectedMapPlace = "";
    return render();
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
    analyzePlaces.textContent = "辨識 Google Maps 資料中…";
    pendingPlaceImports = parseGoogleMapsList(textarea.value);
    pendingPlaceImports = await enrichPlaceImportsFromApi(pendingPlaceImports);
    preview.innerHTML = importPreviewMarkup(pendingPlaceImports);
    const addableCount = pendingPlaceImports.filter(
      (place) => place.canImport && !place.isExisting,
    ).length;
    const confirmButton = document.querySelector("[data-confirm-import]");
    if (confirmButton) {
      confirmButton.disabled = addableCount === 0;
      confirmButton.textContent = addableCount ? `加入 ${addableCount} 個地點` : "沒有可新增地點";
    }
    analyzePlaces.disabled = false;
    analyzePlaces.textContent = "⌁　重新辨識";
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
      moveItem.dataset.moveName,
      moveItem.dataset.moveItem,
    );
    closeSheet();
    render();
    return showToast(moved ? "行程順序已更新" : "已經在最前或最後");
  }

  const time = event.target.closest("[data-edit-time]");
  if (time) {
    if (!canEdit()) return guestOnlyMessage();
    const current = time.textContent.trim();
    const next = window.prompt("輸入時間（HH:MM）", current);
    if (!next || !/^([01]\d|2[0-3]):[0-5]\d$/.test(next)) {
      if (next) showToast("請使用 HH:MM 格式");
      return;
    }
    const item = (state.itinerary[state.selectedDate] || []).find((entry) => entry.name === time.dataset.editTime);
    if (item) item.time = next;
    persist();
    return render();
  }
});

document.addEventListener("dragstart", (event) => {
  if (!canEdit()) return event.preventDefault();
  const handle = event.target.closest("[data-drag-name]");
  if (!handle) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", handle.dataset.dragName);
  handle.closest(".timeline-item")?.classList.add("dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest(".timeline-item")) event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const target = event.target.closest(".timeline-item");
  if (!target) return;
  event.preventDefault();
  const sourceName = event.dataTransfer.getData("text/plain");
  if (reorderItineraryItem(state.selectedDate, sourceName, target.dataset.itemName)) {
    render();
    showToast("行程順序已更新");
  }
});

document.addEventListener("dragend", () => {
  document.querySelector(".timeline-item.dragging")?.classList.remove("dragging");
});

document.addEventListener("pointerdown", (event) => {
  if (!canEdit()) return;
  const surface = event.target.closest("[data-swipe-item]");
  if (!surface || event.target.closest("[data-drag-name]")) return;

  document.querySelectorAll("[data-swipe-item].revealed").forEach((item) => {
    if (item !== surface) item.classList.remove("revealed");
  });
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
  event.preventDefault();
});

function finishSwipe(event) {
  if (!swipeDrag || swipeDrag.pointerId !== event.pointerId) return;
  const current = swipeDrag;
  swipeDrag = null;
  current.surface.style.removeProperty("transform");
  if (current.axis !== "horizontal") return;
  current.surface.classList.toggle("revealed", current.offset < -42);
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

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-map-date]")) {
    if (event.target.value === "all") {
      state.mapView = "planning";
    } else {
      state.mapView = "day";
      state.selectedDate = event.target.value;
    }
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }

  if (event.target.matches("[data-map-category]")) {
    state.mapCategory = event.target.value;
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }

  if (event.target.matches("[data-map-preference]")) {
    state.mapPreference = event.target.value;
    state.selectedMapPlace = "";
    return render({ preserveScroll: true });
  }
});

document.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-drag-name]");
  if (!canEdit() || !handle || event.pointerType === "mouse") return;
  pointerDrag = {
    name: handle.dataset.dragName,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    handle,
  };
  handle.setPointerCapture?.(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const distance = Math.hypot(
    event.clientX - pointerDrag.startX,
    event.clientY - pointerDrag.startY,
  );
  if (distance > 10) {
    pointerDrag.dragging = true;
    pointerDrag.handle.closest(".timeline-item")?.classList.add("dragging");
    event.preventDefault();
  }
});

document.addEventListener("pointerup", (event) => {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const dragState = pointerDrag;
  pointerDrag = null;
  dragState.handle.closest(".timeline-item")?.classList.remove("dragging");
  if (!dragState.dragging) return;

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".timeline-item");
  suppressReorderClick = true;
  window.setTimeout(() => {
    suppressReorderClick = false;
  }, 0);
  if (
    target &&
    reorderItineraryItem(state.selectedDate, dragState.name, target.dataset.itemName)
  ) {
    render();
    showToast("行程順序已更新");
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "profile-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const nickname = String(form.get("nickname") || "").trim().slice(0, 10);
    const pin = String(form.get("pin") || "").trim();
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
    persist();
    closeSheet();
    render();
    return showToast(`接下來會用「${nickname}」標記你的選擇`);
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
    const additions = parsed
      .filter((place) => place.canImport && !place.isExisting)
      .filter(
        (place) =>
          !state.places.some(
            (existing) =>
              existing.name.toLowerCase() === place.name.toLowerCase() ||
              normalizeGoogleMapsUrl(existing.sourceUrl) === normalizeGoogleMapsUrl(place.sourceUrl),
          ),
      )
      .map(({ recognition, isExisting, canImport, ...place }) => place);
    if (!additions.length) return showToast("沒有可新增的地點");
    state.places.push(...additions);
    persist();
    closeSheet();
    render();
    showToast(`已加入 ${additions.length} 個 Google Maps 地點`);
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

persist({ sync: false });
render();
if (!state.profile && !state.isGuest) openProfileSheet(true);
loadSharedTrip();
window.setInterval(() => {
  if (!document.hidden) loadSharedTrip({ quiet: true });
}, 15000);
