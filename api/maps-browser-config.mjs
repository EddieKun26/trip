export default function mapsBrowserConfigHandler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  const browserKey = process.env.GOOGLE_MAPS_BROWSER_KEY;
  response.setHeader("Cache-Control", "public, max-age=300");
  if (!browserKey) return response.status(503).json({ error: "BROWSER_MAP_NOT_CONFIGURED" });
  return response.status(200).json({ key: browserKey });
}
