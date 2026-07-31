import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const TRIP_KEY = "tokyo-family-trip:v1";
const ACCOUNT_PREFIX = "tokyo-family-trip:account:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const ATTEMPT_PREFIX = "tokyo-family-trip:attempt:";
const SESSION_SECONDS = 60 * 60 * 24 * 180;

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

function normalizeNickname(value) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("zh-TW");
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pinHash(pin, salt) {
  return scryptSync(pin, salt, 32).toString("hex");
}

function validPin(pin, account) {
  try {
    const actual = Buffer.from(pinHash(pin, account.salt), "hex");
    const expected = Buffer.from(account.pinHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
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

async function legacyMemberId(nickname) {
  const trip = await readJson(TRIP_KEY);
  const normalized = normalizeNickname(nickname);
  return (
    Object.entries(trip?.members || {}).find(
      ([, name]) => normalizeNickname(name) === normalized,
    )?.[0] || randomUUID()
  );
}

async function issueSession(response, account) {
  const token = randomBytes(32).toString("base64url");
  const sessionKey = `${SESSION_PREFIX}${digest(token)}`;
  await redisCommand([
    "SET",
    sessionKey,
    JSON.stringify({ id: account.id, nickname: account.nickname }),
    "EX",
    SESSION_SECONDS,
  ]);
  response.setHeader(
    "Set-Cookie",
    `tokyo_trip_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
  );
}

export default async function memberHandler(request, response) {
  try {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
    }

    const nickname = String(request.body?.nickname || "").normalize("NFKC").trim().slice(0, 10);
    const pin = String(request.body?.pin || "").trim();
    if (!nickname) return sendJson(response, 400, { error: "NICKNAME_REQUIRED" });
    if (!/^\d{4}$/.test(pin)) return sendJson(response, 400, { error: "PIN_REQUIRED" });

    const nicknameDigest = digest(normalizeNickname(nickname));
    const accountKey = `${ACCOUNT_PREFIX}${nicknameDigest}`;
    const forwardedFor = String(request.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
    const attemptKey = `${ATTEMPT_PREFIX}${nicknameDigest}:${digest(forwardedFor).slice(0, 16)}`;
    let account = await readJson(accountKey);

    if (account) {
      const attempts = Number(await redisCommand(["INCR", attemptKey]));
      if (attempts === 1) await redisCommand(["EXPIRE", attemptKey, 300]);
      if (attempts > 10) return sendJson(response, 429, { error: "TOO_MANY_ATTEMPTS" });
      if (!validPin(pin, account)) return sendJson(response, 401, { error: "INVALID_PIN" });
      await redisCommand(["DEL", attemptKey]);
    } else {
      const salt = randomBytes(16).toString("hex");
      const candidate = {
        id: await legacyMemberId(nickname),
        nickname,
        salt,
        pinHash: pinHash(pin, salt),
        createdAt: new Date().toISOString(),
      };
      const created = await redisCommand(["SET", accountKey, JSON.stringify(candidate), "NX"]);
      account = created ? candidate : await readJson(accountKey);
      if (!account || !validPin(pin, account)) {
        return sendJson(response, 401, { error: "INVALID_PIN" });
      }
    }

    await issueSession(response, account);
    return sendJson(response, 200, {
      member: { id: account.id, nickname: account.nickname, authVersion: 2 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MEMBER_LOGIN_ERROR";
    return sendJson(response, message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, {
      error: message,
    });
  }
}
