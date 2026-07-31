const TRIP_KEY = "tokyo-family-trip:v1";

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

function redisConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("SHARED_DATABASE_NOT_CONFIGURED");
  const result = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!result.ok) throw new Error(`DATABASE_${result.status}`);
  const payload = await result.json();
  if (payload.error) throw new Error("DATABASE_COMMAND_FAILED");
  return payload.result;
}

async function readTrip() {
  const raw = await redisCommand(["GET", TRIP_KEY]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cleanTrip(input, memberId, memberName, revision) {
  const places = Array.isArray(input?.places) ? input.places.slice(0, 250) : [];
  const votes = input?.votes && typeof input.votes === "object" ? input.votes : {};
  const itinerary = input?.itinerary && typeof input.itinerary === "object" ? input.itinerary : {};
  const members = input?.members && typeof input.members === "object" ? input.members : {};
  members[memberId] = String(memberName).slice(0, 10);
  return {
    places,
    votes,
    itinerary,
    members,
    revision,
    updatedAt: new Date().toISOString(),
    updatedBy: memberId,
  };
}

export default async function tripHandler(request, response) {
  try {
    if (request.method === "GET") {
      const trip = await readTrip();
      if (!trip) return sendJson(response, 404, { error: "TRIP_NOT_INITIALIZED" });
      return sendJson(response, 200, trip);
    }

    if (request.method === "PUT") {
      const memberId = String(request.headers["x-trip-member-id"] || "").trim().slice(0, 80);
      const memberName = String(request.headers["x-trip-member-name"] || "").trim().slice(0, 10);
      if (!memberId || !memberName) {
        return sendJson(response, 403, { error: "MEMBER_REQUIRED" });
      }
      const previous = await readTrip();
      const trip = cleanTrip(request.body, memberId, memberName, (previous?.revision || 0) + 1);
      await redisCommand(["SET", TRIP_KEY, JSON.stringify(trip)]);
      return sendJson(response, 200, trip);
    }

    response.setHeader("Allow", "GET, PUT");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SHARED_DATABASE_ERROR";
    return sendJson(response, message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, {
      error: message,
    });
  }
}
