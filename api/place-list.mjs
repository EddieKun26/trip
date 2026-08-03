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
    if (url.protocol !== "https:" || !ALLOWED_MAP_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

function isPlaceListUrl(url) {
  if (!url) return false;
  return /\/maps\/placelists\/list\//i.test(url.pathname)
    || /\/maps\/@\/data=.*!11m1!2s[^!/?]+/i.test(url.pathname);
}

function decodeHtmlAttribute(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&#x26;", "&");
}

function listDataEndpoint(html) {
  const match = String(html || "").match(/href="([^"]*\/maps\/preview\/entitylist\/getlist\?[^\"]+)"/i);
  if (!match) return null;
  try {
    const url = new URL(decodeHtmlAttribute(match[1]), "https://www.google.com");
    return url.origin === "https://www.google.com" && url.pathname === "/maps/preview/entitylist/getlist" ? url : null;
  } catch {
    return null;
  }
}

function mapsSearchUrl(name, address) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", [name, address].filter(Boolean).join(" "));
  return url.toString();
}

function parsePublicListPayload(value) {
  const raw = String(value || "").replace(/^\)\]\}'\s*/, "");
  const payload = JSON.parse(raw);
  const list = payload?.[0];
  const title = typeof list?.[4] === "string" ? list[4].trim() : "Google Maps 共用清單";
  const entries = Array.isArray(list?.[8]) ? list[8] : [];
  const seen = new Set();
  const places = entries.slice(0, 50).flatMap((entry, index) => {
    const detail = entry?.[1];
    const name = typeof entry?.[2] === "string" ? entry[2].trim() : "";
    const address = typeof detail?.[4] === "string"
      ? detail[4].trim()
      : typeof detail?.[2] === "string" ? detail[2].trim() : "";
    const coordinates = Array.isArray(detail?.[5]) ? detail[5] : [];
    const latitude = Number(coordinates[2]);
    const longitude = Number(coordinates[3]);
    if (!name) return [];
    const identity = `${name.toLowerCase()}|${Number.isFinite(latitude) ? latitude.toFixed(6) : ""}|${Number.isFinite(longitude) ? longitude.toFixed(6) : ""}`;
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [{
      name,
      address,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      sourceUrl: mapsSearchUrl(name, address),
      listIndex: index,
    }];
  });
  return { title, places };
}

async function inspectSharedUrl(value) {
  const requestedUrl = safeMapsUrl(value);
  if (!requestedUrl) return { requestUrl: value || "", isList: false, error: "無效的 Google Maps 連結" };
  const pageResponse = await fetch(requestedUrl, {
    redirect: "follow",
    headers: { "Accept-Language": "zh-TW", "User-Agent": "TripPlanner/1.0" },
  });
  const expandedUrl = safeMapsUrl(pageResponse.url) || requestedUrl;
  if (!isPlaceListUrl(expandedUrl)) {
    return { requestUrl: requestedUrl.toString(), expandedUrl: expandedUrl.toString(), isList: false };
  }
  if (!pageResponse.ok) {
    return { requestUrl: requestedUrl.toString(), expandedUrl: expandedUrl.toString(), isList: true, error: `共用清單回應 ${pageResponse.status}` };
  }
  const endpoint = listDataEndpoint(await pageResponse.text());
  if (!endpoint) {
    return { requestUrl: requestedUrl.toString(), expandedUrl: expandedUrl.toString(), isList: true, error: "找不到公開清單內容" };
  }
  const dataResponse = await fetch(endpoint, {
    headers: { "Accept-Language": "zh-TW", "User-Agent": "TripPlanner/1.0" },
  });
  if (!dataResponse.ok) {
    return { requestUrl: requestedUrl.toString(), expandedUrl: expandedUrl.toString(), isList: true, error: `清單資料回應 ${dataResponse.status}` };
  }
  const parsed = parsePublicListPayload(await dataResponse.text());
  return { requestUrl: requestedUrl.toString(), expandedUrl: expandedUrl.toString(), isList: true, ...parsed };
}

export default async function placeListHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  }
  const urls = Array.isArray(request.body?.urls) ? request.body.urls.slice(0, 5) : [];
  if (!urls.length) return sendJson(response, 400, { error: "NO_URLS_PROVIDED" });
  const results = await Promise.all(urls.map(async (url) => {
    try {
      return await inspectSharedUrl(url);
    } catch (error) {
      return {
        requestUrl: url || "",
        isList: false,
        error: error instanceof Error ? error.message : "PLACE_LIST_FAILED",
      };
    }
  }));
  return sendJson(response, 200, { results });
}

export { listDataEndpoint, parsePublicListPayload };
