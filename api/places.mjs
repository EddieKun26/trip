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
  const priorities = ["neighborhood", "sublocality_level_2", "sublocality_level_1", "administrative_area_level_3", "locality"];
  for (const type of priorities) {
    const component = addressComponents.find((item) => item.types?.includes(type));
    if (component?.long_name) return component.long_name;
  }
  return "";
}

function conciseAddress(value, latitude, longitude) {
  const address = String(value || "")
    .replace(/^日本[、,\s]*/u, "")
    .replace(/^〒?\s*\d{3}-\d{4}\s*/u, "")
    .trim();
  return address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

async function reverseGeocode({ apiKey, latitude, longitude, requestUrl }) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("language", "zh-TW");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  const payload = response.ok ? await response.json() : {};
  const result = payload.results?.[0];
  if (result) {
    const areaOriginal = geocodeArea(result.address_components);
    const area = chineseAreaName(areaOriginal, areaOriginal);
    const formattedAddress = result.formatted_address || "";
    const addressLabel = conciseAddress(formattedAddress, latitude, longitude);
    return {
      requestUrl,
      placeId: result.place_id || `coordinate-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
      name: `地址位置｜${addressLabel}`.slice(0, 160),
      area: area || "待確認區域",
      areaOriginal: areaOriginal || area || "待確認區域",
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
  const areaOriginal = address.neighbourhood || address.suburb || address.quarter || address.city_district || address.city || "";
  const area = chineseAreaName(areaOriginal, areaOriginal);
  const addressLabel = conciseAddress(formattedAddress, latitude, longitude);
  return {
    requestUrl,
    placeId: osm.place_id ? `osm-${osm.place_id}` : `coordinate-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: `地址位置｜${addressLabel}`.slice(0, 160),
    area: area || "待確認區域",
    areaOriginal: areaOriginal || area || "待確認區域",
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
  const requestGeocode = async (language) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("language", language);
    url.searchParams.set("region", "jp");
    url.searchParams.set("key", apiKey);
    const response = await fetch(url);
    return response.ok ? response.json() : {};
  };
  const [localizedPayload, originalPayload] = await Promise.all([
    requestGeocode("zh-TW"),
    requestGeocode("ja"),
  ]);
  const result = localizedPayload.results?.[0];
  if (!result || !validCoordinates(result.geometry?.location?.lat, result.geometry?.location?.lng)) {
    return { requestUrl, error: "找不到這個完整地址的位置" };
  }
  const originalResult = originalPayload.results?.[0];
  const localizedArea = geocodeArea(result.address_components);
  const areaOriginal = geocodeArea(originalResult?.address_components) || localizedArea;
  const latitude = result.geometry.location.lat;
  const longitude = result.geometry.location.lng;
  return {
    requestUrl,
    placeId: result.place_id || `manual-address-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: conciseAddress(result.formatted_address || address, latitude, longitude),
    area: chineseAreaName(localizedArea, areaOriginal) || "待確認區域",
    areaOriginal: areaOriginal || localizedArea || "待確認區域",
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
    headers: { "User-Agent": "TokyoTripPlanner/1.0" },
  });
  const expanded = safeMapsUrl(result.url);
  return expanded?.toString() || url.toString();
}

function pickArea(addressComponents = []) {
  const priorities = [
    "neighborhood",
    "sublocality_level_2",
    "sublocality_level_1",
    "administrative_area_level_3",
    "locality",
  ];
  for (const type of priorities) {
    const component = addressComponents.find((item) => item.types?.includes(type));
    if (component?.longText) return component.longText;
  }
  return "";
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
  const local = String(original || localized || "").trim();
  const override = chineseAreaOverrides.get(local)
    || [...chineseAreaOverrides].find(([key]) => normalizedAreaKey(key) === normalizedAreaKey(local))?.[1];
  if (override) return override;
  if (/[一-龯々ヶ]/.test(local)) {
    return local.replaceAll("恵", "惠").replaceAll("寿", "壽").replaceAll("渋", "澀").replaceAll("浅", "淺").replaceAll("豊", "豐").replaceAll("黒", "黑").replaceAll("区", "區").replaceAll("横", "橫").replaceAll("浜", "濱").replaceAll("瀬", "瀨");
  }
  const fallback = String(localized || original || "").trim();
  return /[A-Za-z]/.test(fallback) && !/[\u3000-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(fallback)
    ? "待確認區域"
    : fallback;
}

async function originalAreaForPlace(apiKey, placeId, fallback) {
  if (!placeId) return fallback;
  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    url.searchParams.set("languageCode", "ja");
    url.searchParams.set("regionCode", "JP");
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "addressComponents",
      },
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    return pickArea(payload.addressComponents) || fallback;
  } catch {
    return fallback;
  }
}

async function searchPlace({ apiKey, textQuery, requestUrl, globalSearch = false, latitude = null, longitude = null }) {
  const requestBody = {
    textQuery,
    languageCode: "zh-TW",
    maxResultCount: 1,
  };
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    requestBody.locationBias = {
      circle: {
        center: { latitude, longitude },
        radius: 3000,
      },
    };
  } else if (!globalSearch) {
    requestBody.regionCode = "JP";
    requestBody.locationBias = {
      circle: {
        center: { latitude: 35.6762, longitude: 139.6503 },
        radius: 50000,
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
  const localizedArea = pickArea(place.addressComponents);
  const areaOriginal = await originalAreaForPlace(apiKey, place.id, localizedArea);
  const area = chineseAreaName(localizedArea, areaOriginal);

  return {
    requestUrl,
    placeId: place.id,
    name: place.displayName?.text || textQuery,
    area,
    areaOriginal,
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
  if (!apiKey) return sendJson(response, 503, { error: "PLACES_API_NOT_CONFIGURED" });

  const requestedPlaces = Array.isArray(request.body?.places) ? request.body.places.slice(0, 10) : [];
  if (!requestedPlaces.length) return sendJson(response, 400, { error: "NO_PLACES_PROVIDED" });

  const places = await Promise.all(
    requestedPlaces.map(async (item) => {
      const originalUrl = safeMapsUrl(item.sourceUrl);
      const hintName = String(item.hintName || "").trim().slice(0, 160);
      const manualAddress = String(item.manualAddress || "").normalize("NFKC").trim().slice(0, 300);
      const globalSearch = item.globalSearch === true;
      const latitude = item.latitude === null || item.latitude === undefined || item.latitude === "" ? NaN : Number(item.latitude);
      const longitude = item.longitude === null || item.longitude === undefined || item.longitude === "" ? NaN : Number(item.longitude);
      if (!originalUrl && !hintName && !manualAddress) return { requestUrl: item.sourceUrl || "", error: "無效的 Google Maps 連結" };
      try {
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
          textQuery: globalSearch ? textQuery : `${textQuery} 東京`,
          requestUrl: originalUrl?.toString() || item.sourceUrl,
          globalSearch,
          latitude: validCoordinates(resolvedLatitude, resolvedLongitude) ? resolvedLatitude : null,
          longitude: validCoordinates(resolvedLatitude, resolvedLongitude) ? resolvedLongitude : null,
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
