import { createHash } from "node:crypto";
import { searchProductImageCandidates } from "../product-image-search.mjs";

export const maxDuration = 90;

const TRIP_PREFIX = "tokyo-family-trip:trip:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const SEARCH_LIMIT_PREFIX = "tokyo-family-trip:shopping-image-search:";
const DAILY_SEARCH_LIMIT = 80;

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.json(payload);
}

function cleanText(value, length = 120) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, length);
}

function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  try { return JSON.parse(String(request.body || "{}")); } catch { return {}; }
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
  try { return JSON.parse(raw); } catch { return null; }
}

function cookieValue(request, name) {
  const match = String(request.headers.cookie || "").split(";").find((cookie) => cookie.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : "";
}

async function authenticatedMember(request) {
  const token = cookieValue(request, "tokyo_trip_session");
  if (!token) return null;
  const digest = createHash("sha256").update(token).digest("hex");
  return readJson(`${SESSION_PREFIX}${digest}`);
}

async function enforceDailyLimit(memberId) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${SEARCH_LIMIT_PREFIX}${memberId}:${day}`;
  const count = Number(await redisCommand(["INCR", key])) || 0;
  if (count === 1) await redisCommand(["EXPIRE", key, 86400]);
  return count <= DAILY_SEARCH_LIMIT;
}

export default async function shoppingImagesHandler(request, response) {
  try {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
    }
    const member = await authenticatedMember(request);
    if (!member?.id) return sendJson(response, 401, { error: "AUTH_REQUIRED" });
    const body = requestBody(request);
    const tripId = cleanText(body.tripId, 80);
    const brand = cleanText(body.brand, 100);
    const name = cleanText(body.name, 120);
    if (!tripId || !name) return sendJson(response, 400, { error: "PRODUCT_REQUIRED" });
    const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
    if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });
    const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
    if (!apiKey) return sendJson(response, 503, { error: "AI_RECOGNITION_NOT_CONFIGURED" });
    if (!(await enforceDailyLimit(member.id))) return sendJson(response, 429, { error: "DAILY_IMAGE_SEARCH_LIMIT" });
    const excludeIds = (Array.isArray(body.excludeIds) ? body.excludeIds : []).map((value) => cleanText(value, 40)).filter(Boolean).slice(0, 30);
    const productImages = await searchProductImageCandidates(apiKey, {
      brand,
      name,
      excludeIds,
      round: Math.max(0, Math.min(20, Number(body.round) || 0)),
    });
    return sendJson(response, 200, { productImages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PRODUCT_IMAGE_SEARCH_FAILED";
    console.warn("shopping-images failed", { code: message });
    const status = message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : message.startsWith("OPENAI_429") ? 429 : 502;
    return sendJson(response, status, { error: message });
  }
}
