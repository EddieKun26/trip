import { createHash } from "node:crypto";

const LEGACY_TRIP_KEY = "tokyo-family-trip:v1";
const DEFAULT_TRIP_ID = "tokyo-family-2026";
const TRIP_PREFIX = "tokyo-family-trip:trip:";
const INVITE_PREFIX = "tokyo-family-trip:invite:";
const SESSION_PREFIX = "tokyo-family-trip:session:";

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
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!result.ok) throw new Error(`DATABASE_${result.status}`);
  const payload = await result.json();
  if (payload.error) throw new Error("DATABASE_COMMAND_FAILED");
  return payload.result;
}

async function readJson(key) {
  const raw = await redisCommand(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const cookies = String(request.headers.cookie || "").split(";");
  const match = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : "";
}

async function authenticatedMember(request) {
  const token = cookieValue(request, "tokyo_trip_session");
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return readJson(`${SESSION_PREFIX}${tokenHash}`);
}

function requestedTripId(request) {
  const direct = String(request.query?.id || "").trim();
  if (direct) return direct;
  try {
    return new URL(request.url, "https://trip.local").searchParams.get("id") || DEFAULT_TRIP_ID;
  } catch {
    return DEFAULT_TRIP_ID;
  }
}

function defaultFlights() {
  return [
    {
      id: "flight-khh-nrt",
      direction: "去程",
      departureDate: "2026-09-20",
      departureTime: "09:55",
      departureCity: "高雄",
      departureCode: "KHH",
      arrivalDate: "2026-09-20",
      arrivalTime: "14:45",
      arrivalCity: "成田",
      arrivalCode: "NRT",
      travelers: "尚未註記",
    },
    {
      id: "flight-nrt-khh",
      direction: "回程",
      departureDate: "2026-09-26",
      departureTime: "17:50",
      departureCity: "成田",
      departureCode: "NRT",
      arrivalDate: "2026-09-26",
      arrivalTime: "21:00",
      arrivalCity: "高雄",
      arrivalCode: "KHH",
      travelers: "尚未註記",
    },
  ];
}

async function ensureLegacyTrip() {
  const key = `${TRIP_PREFIX}${DEFAULT_TRIP_ID}`;
  const existing = await readJson(key);
  if (existing) return existing;
  const legacy = await readJson(LEGACY_TRIP_KEY);
  if (!legacy) return null;
  const trip = {
    id: DEFAULT_TRIP_ID,
    title: "東京 7 日",
    destination: "東京",
    startDate: "2026-09-20",
    endDate: "2026-09-26",
    inviteCode: "TOKYO6",
    publicRead: true,
    ownerId: Object.keys(legacy.members || {})[0] || "",
    flights: defaultFlights(),
    places: Array.isArray(legacy.places) ? legacy.places : [],
    votes: legacy.votes && typeof legacy.votes === "object" ? legacy.votes : {},
    itinerary: legacy.itinerary && typeof legacy.itinerary === "object" ? legacy.itinerary : {},
    members: legacy.members && typeof legacy.members === "object" ? legacy.members : {},
    revision: Number(legacy.revision) || 1,
    updatedAt: legacy.updatedAt || new Date().toISOString(),
    updatedBy: legacy.updatedBy || "migration",
  };
  const created = await redisCommand(["SET", key, JSON.stringify(trip), "NX"]);
  if (created) await redisCommand(["SET", `${INVITE_PREFIX}${trip.inviteCode}`, trip.id]);
  return created ? trip : readJson(key);
}

async function readTrip(id) {
  if (id === DEFAULT_TRIP_ID) return ensureLegacyTrip();
  return readJson(`${TRIP_PREFIX}${id}`);
}

function cleanTrip(input, previous, member) {
  return {
    ...previous,
    title: String(input?.title || previous.title).trim().slice(0, 40),
    destination: String(input?.destination || previous.destination).trim().slice(0, 40),
    startDate: String(input?.startDate || previous.startDate),
    endDate: String(input?.endDate || previous.endDate),
    flights: Array.isArray(input?.flights) ? input.flights.slice(0, 30) : previous.flights || [],
    places: Array.isArray(input?.places) ? input.places.slice(0, 250) : [],
    votes: input?.votes && typeof input.votes === "object" ? input.votes : {},
    itinerary: input?.itinerary && typeof input.itinerary === "object" ? input.itinerary : {},
    members: {
      ...(previous.members || {}),
      ...(input?.members && typeof input.members === "object" ? input.members : {}),
      [member.id]: member.nickname,
    },
    revision: (Number(previous.revision) || 0) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: member.id,
  };
}

export default async function tripHandler(request, response) {
  try {
    const tripId = requestedTripId(request);
    const trip = await readTrip(tripId);
    if (!trip) return sendJson(response, 404, { error: "TRIP_NOT_FOUND" });
    const member = await authenticatedMember(request);
    const isMember = Boolean(member?.id && trip.members?.[member.id]);

    if (request.method === "GET") {
      if (!isMember && !trip.publicRead) return sendJson(response, member ? 403 : 401, { error: "TRIP_ACCESS_REQUIRED" });
      if (!isMember) {
        const { inviteCode, ownerId, ...publicTrip } = trip;
        return sendJson(response, 200, publicTrip);
      }
      return sendJson(response, 200, trip);
    }

    if (request.method === "PUT") {
      if (!isMember) return sendJson(response, member ? 403 : 401, { error: "AUTH_REQUIRED" });
      const updated = cleanTrip(request.body, trip, member);
      await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(updated)]);
      return sendJson(response, 200, updated);
    }

    response.setHeader("Allow", "GET, PUT");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SHARED_DATABASE_ERROR";
    return sendJson(response, message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, { error: message });
  }
}
