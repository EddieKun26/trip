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

function nameFromMapsUrl(value) {
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

async function searchPlace({ apiKey, textQuery, requestUrl }) {
  const googleResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.addressComponents",
        "places.primaryTypeDisplayName",
        "places.location",
        "places.googleMapsUri",
        "places.regularOpeningHours",
        "places.nationalPhoneNumber",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "zh-TW",
      regionCode: "JP",
      maxResultCount: 1,
      locationBias: {
        circle: {
          center: { latitude: 35.6762, longitude: 139.6503 },
          radius: 50000,
        },
      },
    }),
  });

  if (!googleResponse.ok) {
    const error = await googleResponse.text();
    return { requestUrl, error: `Google Places 回應 ${googleResponse.status}: ${error.slice(0, 160)}` };
  }

  const payload = await googleResponse.json();
  const place = payload.places?.[0];
  if (!place) return { requestUrl, error: "找不到符合的 Google Maps 地點" };

  return {
    requestUrl,
    name: place.displayName?.text || textQuery,
    area: pickArea(place.addressComponents),
    category: place.primaryTypeDisplayName?.text || "景點",
    formattedAddress: place.formattedAddress || "",
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    googleMapsUrl: place.googleMapsUri || requestUrl,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join("；") || "營業時間未提供",
    phone: place.nationalPhoneNumber || "電話未提供",
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
      if (!originalUrl && !hintName) return { requestUrl: item.sourceUrl || "", error: "無效的 Google Maps 連結" };
      try {
        const expandedUrl = await expandShortMapsUrl(originalUrl);
        const textQuery = hintName || nameFromMapsUrl(expandedUrl);
        if (!textQuery) {
          return { requestUrl: originalUrl?.toString() || "", error: "短連結中無法取得景點名稱" };
        }
        return await searchPlace({
          apiKey,
          textQuery: `${textQuery} 東京`,
          requestUrl: originalUrl?.toString() || item.sourceUrl,
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

