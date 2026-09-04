import {
  administrativeInfoFromAddressComponents,
  countryCodeFromAddressComponents,
  normalizeAddressComponents,
  resolveTravelArea,
} from "../lib/planning-region.mjs";

const ALLOWED_MAP_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
]);

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

function safeMapsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || !ALLOWED_MAP_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function validCoordinates(latitude, longitude) {
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
    if (validCoordinates(latitude, longitude)) return { latitude, longitude };
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
    if (validCoordinates(latitude, longitude)) return { latitude, longitude };
  }
  return null;
}

function coordinatesFromMapsUrl(value) {
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

function nameFromMapsUrl(value) {
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

function geocodeArea(addressComponents = []) {
  const priorities = [
    "administrative_area_level_3",
    "locality",
    "postal_town",
    "sublocality_level_1",
    "administrative_area_level_2",
    "administrative_area_level_1",
    "sublocality_level_2",
    "neighborhood",
  ];
  for (const type of priorities) {
    const component = addressComponents.find((item) => item.types?.includes(type));
    if (component?.long_name) return component.long_name;
  }
  return "";
}

function geocodeCountryCode(addressComponents = []) {
  return String(addressComponents.find((item) => item.types?.includes("country"))?.short_name || "").toUpperCase();
}

function addressAndPlanningFields(localizedAddressComponents = [], originalAddressComponents = [], countryCodeHint = "") {
  const addressComponents = normalizeAddressComponents(localizedAddressComponents);
  const addressComponentsOriginal = normalizeAddressComponents(originalAddressComponents?.length ? originalAddressComponents : localizedAddressComponents);
  const localizedArea = pickArea(addressComponents);
  const areaOriginal = pickArea(addressComponentsOriginal) || localizedArea;
  const area = chineseAreaName(localizedArea, areaOriginal) || localizedArea || areaOriginal;
  const countryCode = countryCodeFromAddressComponents(addressComponentsOriginal)
    || countryCodeFromAddressComponents(addressComponents)
    || String(countryCodeHint || "").toUpperCase();
  return {
    area,
    areaOriginal: areaOriginal || area,
    areaResolvedByGoogle: Boolean(area || areaOriginal),
    addressComponents,
    addressComponentsOriginal,
    countryCode,
    administrativeAreas: administrativeInfoFromAddressComponents(addressComponents, addressComponentsOriginal),
    ...resolveTravelArea({
      localizedAddressComponents: addressComponents,
      originalAddressComponents: addressComponentsOriginal,
      countryCode,
    }),
  };
}

function countryCodeForDestination(value = "") {
  const text = String(value || "").normalize("NFKC").toLocaleLowerCase();
  if (/日本|東京|大阪|京都|沖繩|札幌|福岡|鎌倉|神奈川|japan|tokyo|osaka|kyoto|kamakura/.test(text)) return "JP";
  if (/韓國|南韓|首爾|釜山|濟州|korea|seoul|busan|jeju/.test(text)) return "KR";
  if (/美國|紐約|洛杉磯|舊金山|波士頓|芝加哥|united states|usa|new york|los angeles|san francisco|boston|chicago/.test(text)) return "US";
  if (/台灣|臺灣|台北|臺北|高雄|台中|臺中|taiwan|taipei|kaohsiung|taichung/.test(text)) return "TW";
  return "";
}

function localLanguageForCountry(countryCode = "") {
  const languages = {
    JP: "ja", KR: "ko", CN: "zh-CN", TW: "zh-TW", HK: "zh-HK", MO: "zh-HK",
    TH: "th", VN: "vi", KH: "km", LA: "lo", MM: "my", MN: "mn", NP: "ne", BD: "bn", LK: "si",
    IN: "hi", ID: "id", MY: "ms", PH: "fil", GE: "ka", AM: "hy", GR: "el", IL: "he", IR: "fa",
    RU: "ru", UA: "uk", BY: "be", BG: "bg", RS: "sr", MK: "mk", TR: "tr", CZ: "cs", SK: "sk",
    PL: "pl", HU: "hu", RO: "ro", DE: "de", AT: "de", CH: "de", FR: "fr", IT: "it", ES: "es",
    PT: "pt", BR: "pt-BR", NL: "nl", SE: "sv", NO: "no", DK: "da", FI: "fi", IS: "is",
    SA: "ar", AE: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar", JO: "ar", LB: "ar", EG: "ar",
    ET: "am", KE: "sw", TZ: "sw",
  };
  return languages[String(countryCode || "").toUpperCase()] || "";
}

function conciseAddress(value, latitude, longitude) {
  const address = String(value || "")
    .replace(/^日本[、,\s]*/u, "")
    .replace(/^〒?\s*\d{3}-\d{4}\s*/u, "")
    .trim();
  return address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

async function reverseGeocode({ apiKey, latitude, longitude, requestUrl }) {
  const requestGeocode = async (language = "") => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${latitude},${longitude}`);
    if (language) url.searchParams.set("language", language);
    url.searchParams.set("key", apiKey);
    const response = await fetch(url);
    return response.ok ? response.json() : {};
  };
  const localizedPayload = await requestGeocode("zh-TW");
  const result = localizedPayload.results?.[0];
  const localPayload = await requestGeocode(localLanguageForCountry(geocodeCountryCode(result?.address_components)));
  if (result) {
    const addressFields = addressAndPlanningFields(
      result.address_components,
      localPayload.results?.[0]?.address_components,
    );
    const formattedAddress = result.formatted_address || "";
    const addressLabel = conciseAddress(formattedAddress, latitude, longitude);
    return {
      requestUrl,
      placeId: result.place_id || `coordinate-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
      name: `地址位置｜${addressLabel}`.slice(0, 160),
      ...addressFields,
      category: "地址座標",
      formattedAddress,
      latitude,
      longitude,
      googleMapsUrl: requestUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`,
      openingHours: "此為地址座標",
      phone: "此為地址座標",
      photos: [],
      coordinateLocation: true,
      addressProvider: "Google Maps",
    };
  }

  const osmUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  osmUrl.searchParams.set("format", "jsonv2");
  osmUrl.searchParams.set("lat", String(latitude));
  osmUrl.searchParams.set("lon", String(longitude));
  osmUrl.searchParams.set("zoom", "18");
  osmUrl.searchParams.set("addressdetails", "1");
  const osmResponse = await fetch(osmUrl, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "zh-TW,ja;q=0.9,en;q=0.7",
      Referer: "https://trip-eddie23.vercel.app/",
      "User-Agent": "TripTravelPlanner/1.0 (https://trip-eddie23.vercel.app)",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!osmResponse.ok) return { requestUrl, error: "這組座標暫時查不到完整地址" };
  const osm = await osmResponse.json().catch(() => ({}));
  const formattedAddress = String(osm.display_name || "").trim();
  if (!formattedAddress) return { requestUrl, error: "這組座標暫時查不到完整地址" };
  const address = osm.address || {};
  const osmAddressComponents = [
    address.neighbourhood ? { longText: address.neighbourhood, types: ["neighborhood"] } : null,
    address.quarter ? { longText: address.quarter, types: ["sublocality_level_2"] } : null,
    address.suburb ? { longText: address.suburb, types: ["sublocality_level_1"] } : null,
    address.city_district ? { longText: address.city_district, types: ["sublocality_level_1"] } : null,
    address.city ? { longText: address.city, types: ["locality"] } : null,
    address.town ? { longText: address.town, types: ["postal_town"] } : null,
    address.municipality ? { longText: address.municipality, types: ["administrative_area_level_2"] } : null,
    address.county ? { longText: address.county, types: ["administrative_area_level_2"] } : null,
    address.state ? { longText: address.state, types: ["administrative_area_level_1"] } : null,
    address.country ? { longText: address.country, shortText: String(address.country_code || "").toUpperCase(), types: ["country"] } : null,
  ].filter(Boolean);
  const addressFields = addressAndPlanningFields(osmAddressComponents, osmAddressComponents);
  const addressLabel = conciseAddress(formattedAddress, latitude, longitude);
  return {
    requestUrl,
    placeId: osm.place_id ? `osm-${osm.place_id}` : `coordinate-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: `地址位置｜${addressLabel}`.slice(0, 160),
    ...addressFields,
    category: "地址座標",
    formattedAddress,
    latitude,
    longitude,
    googleMapsUrl: requestUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`,
    openingHours: "此為地址座標",
    phone: "此為地址座標",
    photos: [],
    coordinateLocation: true,
    addressProvider: "OpenStreetMap",
  };
}

async function geocodeAddress({ apiKey, address, requestUrl }) {
  const requestGeocode = async (language = "") => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    if (language) url.searchParams.set("language", language);
    url.searchParams.set("key", apiKey);
    const response = await fetch(url);
    return response.ok ? response.json() : {};
  };
  const localizedPayload = await requestGeocode("zh-TW");
  const result = localizedPayload.results?.[0];
  if (!result || !validCoordinates(result.geometry?.location?.lat, result.geometry?.location?.lng)) {
    return { requestUrl, error: "找不到這個完整地址的位置" };
  }
  const localPayload = await requestGeocode(localLanguageForCountry(geocodeCountryCode(result.address_components)));
  const localResult = localPayload.results?.[0];
  const addressFields = addressAndPlanningFields(result.address_components, localResult?.address_components);
  const latitude = result.geometry.location.lat;
  const longitude = result.geometry.location.lng;
  return {
    requestUrl,
    placeId: result.place_id || `manual-address-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: conciseAddress(result.formatted_address || address, latitude, longitude),
    ...addressFields,
    category: "自訂地址",
    formattedAddress: result.formatted_address || address,
    latitude,
    longitude,
    googleMapsUrl: requestUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    openingHours: "私人地點不提供營業時間",
    phone: "私人地點不提供電話",
    photos: [],
    coordinateLocation: true,
    manualLocation: true,
    addressProvider: "Google Maps 地址定位",
  };
}

async function expandShortMapsUrl(url) {
  if (!url || !["maps.app.goo.gl", "goo.gl"].includes(url.hostname.toLowerCase())) {
    return url?.toString() || "";
  }
  const result = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "TripTravelPlanner/1.0" },
  });
  const expanded = safeMapsUrl(result.url);
  return expanded?.toString() || url.toString();
}

function pickArea(addressComponents = []) {
  const priorities = [
    "administrative_area_level_3",
    "locality",
    "postal_town",
    "sublocality_level_1",
    "administrative_area_level_2",
    "administrative_area_level_1",
    "sublocality_level_2",
    "neighborhood",
  ];
  for (const type of priorities) {
    const component = addressComponents.find((item) => item.types?.includes(type));
    if (component?.longText) return component.longText;
  }
  return "";
}

function pickCountryCode(addressComponents = []) {
  return String(addressComponents.find((item) => item.types?.includes("country"))?.shortText || "").toUpperCase();
}

const chineseAreaOverrides = new Map([
  ["銀座", "銀座"],
  ["Ginza", "銀座"],
  ["恵比寿", "惠比壽"],
  ["Ebisu", "惠比壽"],
  ["恵比寿西", "惠比壽西"],
  ["Ebisunishi", "惠比壽西"],
  ["西新宿", "西新宿"],
  ["Shinjuku", "新宿"],
  ["Nishishinjuku", "西新宿"],
  ["北大塚", "北大塚"],
  ["Kitaotsuka", "北大塚"],
  ["Kitaōtsuka", "北大塚"],
  ["Kaminarimon", "雷門"],
  ["Jingumae", "神宮前"],
  ["Jingūmae", "神宮前"],
  ["Jinnan", "神南"],
  ["Azabujuban", "麻布十番"],
  ["Azabu-juban", "麻布十番"],
  ["Yoyogi", "代代木"],
  ["Asakusa", "淺草"],
  ["Hyakunincho", "百人町"],
  ["Hyakuninchō", "百人町"],
  ["Katase", "片瀨"],
  ["片瀬", "片瀨"],
]);

function normalizedAreaKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("en");
}

function chineseAreaName(localized, original) {
  const localizedText = String(localized || "").trim();
  const local = String(original || localized || "").trim();
  const override = [localizedText, local]
    .map((value) => chineseAreaOverrides.get(value)
      || [...chineseAreaOverrides].find(([key]) => normalizedAreaKey(key) === normalizedAreaKey(value))?.[1])
    .find(Boolean);
  if (override) return override;
  const traditionalize = (value) => value.replaceAll("恵", "惠").replaceAll("寿", "壽").replaceAll("渋", "澀").replaceAll("浅", "淺").replaceAll("豊", "豐").replaceAll("黒", "黑").replaceAll("区", "區").replaceAll("横", "橫").replaceAll("浜", "濱").replaceAll("瀬", "瀨");
  const isOnlyLatinScript = (value) => /[A-Za-z]/.test(value) && !/[^\p{Script=Latin}\p{N}\p{P}\p{Z}\p{M}]/u.test(value);
  if (localizedText && !isOnlyLatinScript(localizedText)) return traditionalize(localizedText);
  if (local && !isOnlyLatinScript(local)) return traditionalize(local);
  return localizedText || local;
}

async function placeAreaDetails(apiKey, placeId, language = "") {
  if (!placeId) return {};
  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    if (language) url.searchParams.set("languageCode", language);
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,addressComponents,formattedAddress,location",
      },
    });
    return response.ok ? response.json() : {};
  } catch {
    return {};
  }
}

async function localizeArea({ apiKey, placeId, address, latitude, longitude, requestUrl }) {
  const isGooglePlaceId = placeId && !/^(?:osm-|coordinate-|manual-address-|custom-place-)/u.test(placeId);
  if (isGooglePlaceId) {
    const localizedDetails = await placeAreaDetails(apiKey, placeId, "zh-TW");
    const localLanguage = localLanguageForCountry(pickCountryCode(localizedDetails.addressComponents));
    const localDetails = await placeAreaDetails(apiKey, placeId, localLanguage);
    const addressFields = addressAndPlanningFields(localizedDetails.addressComponents, localDetails.addressComponents);
    if (addressFields.addressComponents.length) {
      return {
        requestUrl,
        placeId: localizedDetails.id || placeId,
        ...addressFields,
        formattedAddress: localizedDetails.formattedAddress || address || "",
        latitude: localizedDetails.location?.latitude ?? latitude ?? null,
        longitude: localizedDetails.location?.longitude ?? longitude ?? null,
      };
    }
  }
  const requestGeocode = async (language = "") => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    if (placeId && !/^(?:osm-|coordinate-|manual-address-|custom-place-)/u.test(placeId)) url.searchParams.set("place_id", placeId);
    else if (validCoordinates(latitude, longitude)) url.searchParams.set("latlng", `${latitude},${longitude}`);
    else if (address) url.searchParams.set("address", address);
    else return {};
    if (language) url.searchParams.set("language", language);
    url.searchParams.set("key", apiKey);
    const response = await fetch(url);
    return response.ok ? response.json() : {};
  };
  const localizedPayload = await requestGeocode("zh-TW");
  const result = localizedPayload.results?.[0];
  const localPayload = await requestGeocode(localLanguageForCountry(geocodeCountryCode(result?.address_components)));
  const localResult = localPayload.results?.[0];
  if (!result) return { requestUrl, error: "Google 地址中找不到可用的地區欄位" };
  const addressFields = addressAndPlanningFields(result.address_components, localResult?.address_components);
  if (!addressFields.addressComponents.length) return { requestUrl, error: "Google 地址中找不到可用的地區欄位" };
  return {
    requestUrl,
    placeId: result.place_id || placeId || "",
    ...addressFields,
    formattedAddress: result.formatted_address || address || "",
    latitude: result.geometry?.location?.lat ?? latitude ?? null,
    longitude: result.geometry?.location?.lng ?? longitude ?? null,
  };
}

async function searchPlace({ apiKey, textQuery, requestUrl, globalSearch = false, latitude = null, longitude = null, destination = "", countryCode = "" }) {
  const requestBody = {
    textQuery: !globalSearch && destination && !String(textQuery).toLocaleLowerCase().includes(String(destination).toLocaleLowerCase())
      ? `${textQuery} ${destination}`
      : textQuery,
    languageCode: "zh-TW",
    maxResultCount: 1,
  };
  const searchCountryCode = String(countryCode || countryCodeForDestination(destination)).toUpperCase();
  if (/^[A-Z]{2}$/.test(searchCountryCode)) requestBody.regionCode = searchCountryCode;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    requestBody.locationBias = {
      circle: {
        center: { latitude, longitude },
        radius: 3000,
      },
    };
  }
  const googleResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.addressComponents",
        "places.primaryTypeDisplayName",
        "places.location",
        "places.googleMapsUri",
        "places.regularOpeningHours",
        "places.nationalPhoneNumber",
        "places.photos",
      ].join(","),
    },
    body: JSON.stringify(requestBody),
  });

  if (!googleResponse.ok) {
    const error = await googleResponse.text();
    return { requestUrl, error: `Google Places 回應 ${googleResponse.status}: ${error.slice(0, 160)}` };
  }

  const payload = await googleResponse.json();
  const place = payload.places?.[0];
  if (!place) return { requestUrl, error: "找不到符合的 Google Maps 地點" };
  const localDetails = await placeAreaDetails(
    apiKey,
    place.id,
    localLanguageForCountry(pickCountryCode(place.addressComponents)),
  );
  const addressFields = addressAndPlanningFields(place.addressComponents, localDetails.addressComponents);

  return {
    requestUrl,
    placeId: place.id,
    name: place.displayName?.text || textQuery,
    ...addressFields,
    category: place.primaryTypeDisplayName?.text || "景點",
    formattedAddress: place.formattedAddress || "",
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    googleMapsUrl: place.googleMapsUri || requestUrl,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join("；") || "營業時間未提供",
    phone: place.nationalPhoneNumber || "電話未提供",
    photos: (place.photos || []).slice(0, 3).map((photo) => ({
      name: photo.name,
      attribution: photo.authorAttributions?.[0]?.displayName || "Google Maps 使用者",
    })),
  };
}

export default async function placesHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const requestedPlaces = Array.isArray(request.body?.places) ? request.body.places.slice(0, 10) : [];
  if (!requestedPlaces.length) return sendJson(response, 400, { error: "NO_PLACES_PROVIDED" });

  const places = await Promise.all(
    requestedPlaces.map(async (item) => {
      const originalUrl = safeMapsUrl(item.sourceUrl);
      const hintName = String(item.hintName || "").trim().slice(0, 160);
      const manualAddress = String(item.manualAddress || "").normalize("NFKC").trim().slice(0, 300);
      const formattedAddress = String(item.formattedAddress || "").normalize("NFKC").trim().slice(0, 300);
      const placeId = String(item.placeId || "").trim().slice(0, 180);
      const shouldLocalizeArea = item.resolveTravelArea === true || item.resolvePlanningRegion === true || item.localizeArea === true;
      const globalSearch = item.globalSearch === true;
      const destination = String(item.destination || "").normalize("NFKC").trim().slice(0, 100);
      const requestedCountryCode = String(item.countryCode || "").trim().toUpperCase().slice(0, 2);
      const storedAddressComponents = normalizeAddressComponents(item.addressComponents).slice(0, 20);
      const storedAddressComponentsOriginal = normalizeAddressComponents(item.addressComponentsOriginal).slice(0, 20);
      const latitude = item.latitude === null || item.latitude === undefined || item.latitude === "" ? NaN : Number(item.latitude);
      const longitude = item.longitude === null || item.longitude === undefined || item.longitude === "" ? NaN : Number(item.longitude);
      if (!originalUrl && !hintName && !manualAddress && !(shouldLocalizeArea && (placeId || formattedAddress || storedAddressComponents.length || validCoordinates(latitude, longitude)))) return { requestUrl: item.sourceUrl || "", error: "無效的 Google Maps 連結" };
      try {
        if (shouldLocalizeArea) {
          if (storedAddressComponents.length) {
            const storedResolution = addressAndPlanningFields(
              storedAddressComponents,
              storedAddressComponentsOriginal,
              requestedCountryCode,
            );
            if (storedResolution.travelAreaResolved) {
              return {
                requestUrl: originalUrl?.toString() || item.sourceUrl || "",
                placeId,
                formattedAddress,
                latitude: validCoordinates(latitude, longitude) ? latitude : null,
                longitude: validCoordinates(latitude, longitude) ? longitude : null,
                ...storedResolution,
              };
            }
          }
          if (!apiKey) return { requestUrl: originalUrl?.toString() || item.sourceUrl || "", error: "PLACES_API_NOT_CONFIGURED" };
          if (placeId || formattedAddress || validCoordinates(latitude, longitude)) {
            const localized = await localizeArea({
              apiKey,
              placeId,
              address: formattedAddress,
              latitude,
              longitude,
              requestUrl: originalUrl?.toString() || item.sourceUrl || "",
            });
            if (!localized.error || item.manualLocation === true || item.detailsLocked === true) return localized;
          }
          const expandedUrl = await expandShortMapsUrl(originalUrl);
          const urlCoordinates = coordinatesFromMapsUrl(expandedUrl);
          if (validCoordinates(urlCoordinates?.latitude, urlCoordinates?.longitude)) {
            const localized = await localizeArea({
              apiKey,
              placeId: "",
              address: "",
              latitude: urlCoordinates.latitude,
              longitude: urlCoordinates.longitude,
              requestUrl: originalUrl?.toString() || item.sourceUrl || "",
            });
            if (!localized.error || item.manualLocation === true || item.detailsLocked === true) return localized;
          }
          const textQuery = hintName || nameFromMapsUrl(expandedUrl);
          if (textQuery) {
            return await searchPlace({
              apiKey,
              textQuery,
              requestUrl: originalUrl?.toString() || item.sourceUrl || "",
              globalSearch: true,
              destination,
              countryCode: requestedCountryCode,
            });
          }
          return { requestUrl: originalUrl?.toString() || "", error: "Google 連結中找不到可辨識的地址資料" };
        }
        if (!apiKey) return { requestUrl: originalUrl?.toString() || item.sourceUrl || "", error: "PLACES_API_NOT_CONFIGURED" };
        if (manualAddress) {
          return await geocodeAddress({
            apiKey,
            address: manualAddress,
            requestUrl: originalUrl?.toString() || item.sourceUrl || "",
          });
        }
        const expandedUrl = await expandShortMapsUrl(originalUrl);
        const urlCoordinates = coordinatesFromMapsUrl(expandedUrl);
        const resolvedLatitude = Number.isFinite(latitude) ? latitude : urlCoordinates?.latitude;
        const resolvedLongitude = Number.isFinite(longitude) ? longitude : urlCoordinates?.longitude;
        const textQuery = hintName || nameFromMapsUrl(expandedUrl);
        if (!textQuery && validCoordinates(resolvedLatitude, resolvedLongitude)) {
          return await reverseGeocode({
            apiKey,
            latitude: resolvedLatitude,
            longitude: resolvedLongitude,
            requestUrl: originalUrl?.toString() || item.sourceUrl,
          });
        }
        if (!textQuery) {
          return { requestUrl: originalUrl?.toString() || "", error: "短連結中無法取得景點名稱" };
        }
        return await searchPlace({
          apiKey,
          textQuery,
          requestUrl: originalUrl?.toString() || item.sourceUrl,
          globalSearch,
          latitude: validCoordinates(resolvedLatitude, resolvedLongitude) ? resolvedLatitude : null,
          longitude: validCoordinates(resolvedLatitude, resolvedLongitude) ? resolvedLongitude : null,
          destination,
          countryCode: requestedCountryCode,
        });
      } catch (error) {
        return {
          requestUrl: originalUrl?.toString() || item.sourceUrl || "",
          error: error instanceof Error ? error.message : "Google Places 連線失敗",
        };
      }
    }),
  );

  return sendJson(response, 200, { places });
};
