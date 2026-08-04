import { createHash, randomBytes, randomUUID } from "node:crypto";

const LEGACY_TRIP_KEY = "tokyo-family-trip:v1";
const DEFAULT_TRIP_ID = "tokyo-family-2026";
const TRIP_PREFIX = "tokyo-family-trip:trip:";
const INVITE_PREFIX = "tokyo-family-trip:invite:";
const MEMBER_TRIPS_PREFIX = "tokyo-family-trip:member-trips:";
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
  const match = String(request.headers.cookie || "")
    .split(";")
    .find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : "";
}

async function authenticatedMember(request) {
  const token = cookieValue(request, "tokyo_trip_session");
  if (!token) return null;
  return readJson(`${SESSION_PREFIX}${createHash("sha256").update(token).digest("hex")}`);
}

function tripSummary(trip) {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    inviteCode: trip.inviteCode,
    ownerId: trip.ownerId,
    placeCount: Array.isArray(trip.places) ? trip.places.length : 0,
    memberCount: Object.keys(trip.members || {}).length,
  };
}

async function memberTripIds(memberId) {
  return (await readJson(`${MEMBER_TRIPS_PREFIX}${memberId}`)) || [];
}

async function addMemberTrip(memberId, tripId) {
  const key = `${MEMBER_TRIPS_PREFIX}${memberId}`;
  const ids = await memberTripIds(memberId);
  if (!ids.includes(tripId)) await redisCommand(["SET", key, JSON.stringify([...ids, tripId])]);
}

async function removeMemberTrip(memberId, tripId) {
  const key = `${MEMBER_TRIPS_PREFIX}${memberId}`;
  const ids = await memberTripIds(memberId);
  await redisCommand(["SET", key, JSON.stringify(ids.filter((id) => id !== tripId))]);
}

function removeMemberVotes(votes, memberId) {
  return Object.fromEntries(
    Object.entries(votes || {}).map(([placeName, memberIds]) => [
      placeName,
      Array.isArray(memberIds) ? memberIds.filter((id) => id !== memberId) : [],
    ]),
  );
}

async function legacyTripFor(member) {
  const key = `${TRIP_PREFIX}${DEFAULT_TRIP_ID}`;
  const migrated = await readJson(key);
  if (migrated) {
    let changed = false;
    let previousInviteCode = "";
    if (migrated.publicRead !== false) {
      migrated.publicRead = false;
      changed = true;
    }
    if (!migrated.inviteCode || migrated.inviteCode === "TOKYO6") {
      previousInviteCode = migrated.inviteCode || "";
      migrated.inviteCode = inviteCode();
      changed = true;
    }
    if (changed) await redisCommand(["SET", key, JSON.stringify(migrated)]);
    if (previousInviteCode) {
      await redisCommand(["SET", `${INVITE_PREFIX}${migrated.inviteCode}`, migrated.id]);
      await redisCommand(["DEL", `${INVITE_PREFIX}${previousInviteCode}`]);
    }
    return migrated;
  }
  const legacy = await readJson(LEGACY_TRIP_KEY);
  if (!legacy) return null;
  const trip = {
    id: DEFAULT_TRIP_ID,
    title: "東京 7 日",
    destination: "東京",
    startDate: "2026-09-20",
    endDate: "2026-09-26",
    inviteCode: inviteCode(),
    publicRead: false,
    ownerId: Object.keys(legacy.members || {})[0] || member.id,
    flights: [
      { id: "flight-khh-nrt", direction: "去程", departureDate: "2026-09-20", departureTime: "09:55", departureCity: "高雄", departureCode: "KHH", arrivalDate: "2026-09-20", arrivalTime: "14:45", arrivalCity: "成田", arrivalCode: "NRT", travelers: "尚未註記" },
      { id: "flight-nrt-khh", direction: "回程", departureDate: "2026-09-26", departureTime: "17:50", departureCity: "成田", departureCode: "NRT", arrivalDate: "2026-09-26", arrivalTime: "21:00", arrivalCity: "高雄", arrivalCode: "KHH", travelers: "尚未註記" },
    ],
    places: Array.isArray(legacy.places) ? legacy.places : [],
    votes: legacy.votes || {},
    itinerary: legacy.itinerary || {},
    transports: Array.isArray(legacy.transports) ? legacy.transports : [],
    members: legacy.members || {},
    revision: Number(legacy.revision) || 1,
    updatedAt: legacy.updatedAt || new Date().toISOString(),
    updatedBy: legacy.updatedBy || "migration",
  };
  const created = await redisCommand(["SET", key, JSON.stringify(trip), "NX"]);
  if (created) await redisCommand(["SET", `${INVITE_PREFIX}${trip.inviteCode}`, trip.id]);
  return created ? trip : readJson(key);
}

function validTripFields(body) {
  const destination = String(body.destination || "").normalize("NFKC").trim().slice(0, 40);
  const title = String(body.title || `${destination}旅行`).normalize("NFKC").trim().slice(0, 40);
  const startDate = String(body.startDate || "");
  const endDate = String(body.endDate || "");
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = (end - start) / 86400000;
  if (!destination || !title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !Number.isFinite(days) || days < 0 || days > 60) return null;
  return { destination, title, startDate, endDate };
}

function inviteCode() {
  return randomBytes(5).toString("base64url").replace(/[-_0OIl]/g, "A").slice(0, 6).toUpperCase();
}

export default async function tripsHandler(request, response) {
  try {
    const member = await authenticatedMember(request);
    if (!member?.id) return sendJson(response, 401, { error: "AUTH_REQUIRED" });
    const legacy = await legacyTripFor(member);

    if (request.method === "GET") {
      const ids = await memberTripIds(member.id);
      if (legacy?.members?.[member.id] && !ids.includes(DEFAULT_TRIP_ID)) {
        ids.push(DEFAULT_TRIP_ID);
        await redisCommand(["SET", `${MEMBER_TRIPS_PREFIX}${member.id}`, JSON.stringify(ids)]);
      }
      const trips = [];
      for (const id of ids) {
        const trip = await readJson(`${TRIP_PREFIX}${id}`);
        if (trip?.members?.[member.id]) trips.push(tripSummary(trip));
      }
      return sendJson(response, 200, { trips });
    }

    if (request.method === "POST") {
      const action = String(request.body?.action || "create");
      if (action === "join") {
        const code = String(request.body?.inviteCode || "").trim().toUpperCase();
        const tripId = await redisCommand(["GET", `${INVITE_PREFIX}${code}`]);
        const trip = tripId ? await readJson(`${TRIP_PREFIX}${tripId}`) : null;
        if (!trip) return sendJson(response, 404, { error: "INVITE_NOT_FOUND" });
        trip.members = { ...(trip.members || {}), [member.id]: member.nickname };
        trip.revision = (Number(trip.revision) || 0) + 1;
        trip.updatedAt = new Date().toISOString();
        trip.updatedBy = member.id;
        await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip)]);
        await addMemberTrip(member.id, trip.id);
        return sendJson(response, 200, { trip: tripSummary(trip) });
      }

      if (action === "update") {
        const tripId = String(request.body?.tripId || "");
        const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
        if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
        const fields = validTripFields(request.body);
        if (!fields) return sendJson(response, 400, { error: "INVALID_TRIP" });
        Object.assign(trip, fields, { revision: (Number(trip.revision) || 0) + 1, updatedAt: new Date().toISOString(), updatedBy: member.id });
        await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip)]);
        return sendJson(response, 200, { trip: tripSummary(trip) });
      }

      if (action === "removeMember") {
        const tripId = String(request.body?.tripId || "");
        const memberId = String(request.body?.memberId || "");
        const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
        if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
        if (trip.ownerId !== member.id) return sendJson(response, 403, { error: "OWNER_REQUIRED" });
        if (!memberId || memberId === member.id || !trip.members?.[memberId]) {
          return sendJson(response, 400, { error: "INVALID_MEMBER" });
        }
        const nextMembers = { ...(trip.members || {}) };
        delete nextMembers[memberId];
        trip.members = nextMembers;
        trip.votes = removeMemberVotes(trip.votes, memberId);
        trip.revision = (Number(trip.revision) || 0) + 1;
        trip.updatedAt = new Date().toISOString();
        trip.updatedBy = member.id;
        await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip)]);
        await removeMemberTrip(memberId, trip.id);
        return sendJson(response, 200, { trip: tripSummary(trip), removedMemberId: memberId });
      }

      if (action === "leave") {
        const tripId = String(request.body?.tripId || "");
        const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
        if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
        const nextMembers = { ...(trip.members || {}) };
        delete nextMembers[member.id];
        const remainingMemberIds = Object.keys(nextMembers);
        await removeMemberTrip(member.id, trip.id);
        if (!remainingMemberIds.length) {
          await redisCommand(["DEL", `${TRIP_PREFIX}${trip.id}`]);
          await redisCommand(["DEL", `${INVITE_PREFIX}${trip.inviteCode}`]);
          if (trip.id === DEFAULT_TRIP_ID) await redisCommand(["DEL", LEGACY_TRIP_KEY]);
          return sendJson(response, 200, { left: true, deleted: true, tripId: trip.id });
        }
        trip.members = nextMembers;
        trip.votes = removeMemberVotes(trip.votes, member.id);
        if (trip.ownerId === member.id) trip.ownerId = remainingMemberIds[0];
        trip.revision = (Number(trip.revision) || 0) + 1;
        trip.updatedAt = new Date().toISOString();
        trip.updatedBy = member.id;
        await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip)]);
        return sendJson(response, 200, { left: true, deleted: false, tripId: trip.id, ownerId: trip.ownerId });
      }

      const fields = validTripFields(request.body || {});
      if (!fields) return sendJson(response, 400, { error: "INVALID_TRIP" });
      const trip = {
        id: randomUUID(),
        ...fields,
        inviteCode: inviteCode(),
        publicRead: false,
        ownerId: member.id,
        flights: [],
        places: [],
        votes: {},
        itinerary: {},
        transports: [],
        members: { [member.id]: member.nickname },
        revision: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: member.id,
      };
      await redisCommand(["SET", `${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip)]);
      await redisCommand(["SET", `${INVITE_PREFIX}${trip.inviteCode}`, trip.id]);
      await addMemberTrip(member.id, trip.id);
      return sendJson(response, 201, { trip: tripSummary(trip) });
    }

    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TRIPS_ERROR";
    return sendJson(response, message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, { error: message });
  }
}
