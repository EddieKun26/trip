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
  if (request.query?.placeId !== undefined) {
    const placeId = String(request.query.placeId);
    if (!/^[A-Za-z0-9_-]+$/.test(placeId) || placeId.length > 300) return sendJson(response, 400, { error: "INVALID_PLACE_ID" });
    try {
      const result = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "id,photos" },
        signal: AbortSignal.timeout(10000),
      });
      if (!result.ok) return sendJson(response, result.status, { error: "PHOTO_DETAILS_UNAVAILABLE" });
      const data = await result.json();
      if (data.id !== placeId) return sendJson(response, 409, { error: "PHOTO_IDENTITY_MISMATCH" });
      const photos = (Array.isArray(data.photos) ? data.photos : [])
        .filter((photo) => String(photo?.name || "").startsWith(`places/${placeId}/photos/`))
        .slice(0, 10).map((photo) => ({ name: photo.name,
          attribution: (photo.authorAttributions || []).map((author) => author.displayName).filter(Boolean).join("、"),
        }));
      return sendJson(response, 200, { placeId, photos });
    } catch {
      return sendJson(response, 502, { error: "PHOTO_DETAILS_UNAVAILABLE" });
    }
  }
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
    response.setHeader("Cache-Control", "no-store");
    response.end();
  } catch {
    return sendJson(response, 502, { error: "PHOTO_SERVICE_UNAVAILABLE" });
  }
}
