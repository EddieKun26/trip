function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

export default async function placePhotoHandler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: "PLACES_API_NOT_CONFIGURED" });
  const name = String(request.query?.name || "");
  if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
    return sendJson(response, 400, { error: "INVALID_PHOTO_NAME" });
  }

  const mediaUrl = new URL(`https://places.googleapis.com/v1/${name}/media`);
  mediaUrl.searchParams.set("maxWidthPx", "1200");
  mediaUrl.searchParams.set("maxHeightPx", "900");
  mediaUrl.searchParams.set("skipHttpRedirect", "true");
  mediaUrl.searchParams.set("key", apiKey);

  try {
    const googleResponse = await fetch(mediaUrl);
    if (!googleResponse.ok) {
      return sendJson(response, googleResponse.status, { error: "PHOTO_NOT_AVAILABLE" });
    }
    const payload = await googleResponse.json();
    if (!payload.photoUri) return sendJson(response, 404, { error: "PHOTO_NOT_AVAILABLE" });
    response.status(302).setHeader("Location", payload.photoUri);
    response.setHeader("Cache-Control", "public, max-age=86400");
    response.end();
  } catch {
    return sendJson(response, 502, { error: "PHOTO_SERVICE_UNAVAILABLE" });
  }
}
