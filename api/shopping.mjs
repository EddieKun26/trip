import { createHash } from "node:crypto";

const TRIP_PREFIX = "tokyo-family-trip:trip:";
const SESSION_PREFIX = "tokyo-family-trip:session:";
const SHOPPING_PREFIX = "tokyo-family-trip:shopping:";
const MAX_ITEMS = 300;
const MAX_CATEGORIES = 30;
const MAX_TAGS = 80;
const MAX_PHOTOS = 16;
const MAX_PHOTO_LENGTH = 480000;
const MAX_PHOTO_TOTAL = 3800000;
const MAX_PRODUCT_IMAGE_LENGTH = 140000;
const MAX_PRODUCT_IMAGE_TOTAL = 1600000;

const defaultCategories = [
  { id: "souvenir", name: "伴手禮", builtIn: true },
  { id: "appliance", name: "家電", builtIn: true },
  { id: "daily", name: "日常", builtIn: true },
  { id: "medicine", name: "藥品", builtIn: true },
  { id: "skincare", name: "保養品", builtIn: true },
];

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
  const digest = createHash("sha256").update(token).digest("hex");
  return readJson(`${SESSION_PREFIX}${digest}`);
}

function requestedTripId(request) {
  const direct = String(request.query?.tripId || "").trim();
  if (direct) return direct;
  try {
    return new URL(request.url, "https://trip.local").searchParams.get("tripId") || "";
  } catch {
    return "";
  }
}

function cleanText(value, length) {
  return String(value || "").normalize("NFKC").trim().slice(0, length);
}

function cleanTextList(value, limit, itemLength) {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanText(item, itemLength))
    .filter(Boolean)
    .slice(0, limit);
}

function cleanDisplayText(value, length) {
  return cleanText(value, Math.max(length * 3, 600))
    .replace(/\[([^\]]+)\]\(\s*https?:\/\/[^)]+\)/gi, "$1")
    .replace(/\(\s*\[[^\]]+\]\s*\)/g, " ")
    .replace(/\[\s*(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}[^\]]*\]/gi, " ")
    .replace(/\(?\s*https?:\/\/[^\s<>()\]]+(?:\([^\s<>()]*\)[^\s<>()]*)?\s*\)?/gi, " ")
    .replace(/\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi, " ")
    .replace(/\s+([，。；、：])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s()（）\[\]]+|[\s()（）\[\]]+$/g, "")
    .slice(0, length);
}

function cleanHttpsUrl(value, length = 1000) {
  const url = cleanText(value, length);
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : "";
  } catch {
    return "";
  }
}

function cleanGeneratedImageUrl(value) {
  const image = String(value || "");
  return /^data:image\/(?:jpeg|png|webp);base64,/i.test(image) && image.length <= MAX_PRODUCT_IMAGE_LENGTH ? image : "";
}

function cleanAiAnnotation(value) {
  if (!value || typeof value !== "object") return null;
  const productImages = (Array.isArray(value.productImages) ? value.productImages : [])
    .map((image) => ({
      url: cleanGeneratedImageUrl(image?.url),
      pageUrl: "",
      sourceTitle: cleanText(image?.sourceTitle, 120) || "網路商品頁",
      kind: "web-product",
    }))
    .filter((image) => image.url)
    .filter((image, index, list) => list.findIndex((candidate) => candidate.url === image.url) === index)
    .slice(0, 1);
  const annotation = {
    summary: cleanDisplayText(value.summary, 500),
    features: (Array.isArray(value.features) ? value.features : []).map((item) => cleanDisplayText(item, 180)).filter(Boolean).slice(0, 4),
    usage: (Array.isArray(value.usage) ? value.usage : []).map((item) => cleanDisplayText(item, 180)).filter(Boolean).slice(0, 4),
    cautions: (Array.isArray(value.cautions) ? value.cautions : []).map((item) => cleanDisplayText(item, 180)).filter(Boolean).slice(0, 4),
    confidence: Math.max(0, Math.min(1, Number(value.confidence) || 0)),
    sources: [],
    productImages,
    researchedAt: cleanText(value.researchedAt, 40),
  };
  return annotation.summary || annotation.features.length ? annotation : null;
}

function emptyShopping() {
  return {
    scope: "private",
    categories: defaultCategories,
    tags: [],
    items: [],
    photos: {},
    revision: 0,
    updatedAt: "",
  };
}

function cleanShopping(input, previous) {
  const customCategories = (Array.isArray(input?.categories) ? input.categories : [])
    .filter((category) => category && !defaultCategories.some((item) => item.id === category.id))
    .slice(0, Math.max(0, MAX_CATEGORIES - defaultCategories.length))
    .map((category) => ({
      id: cleanText(category.id, 80),
      name: cleanText(category.name, 24),
      builtIn: false,
    }))
    .filter((category) => category.id && category.name);
  const categories = [
    ...defaultCategories,
    ...customCategories.filter((category, index, list) => list.findIndex((item) => item.id === category.id) === index),
  ];
  const categoryIds = new Set(categories.map((category) => category.id));

  const tags = (Array.isArray(input?.tags) ? input.tags : [])
    .slice(0, MAX_TAGS)
    .map((tag) => ({ id: cleanText(tag?.id, 80), name: cleanText(tag?.name, 24) }))
    .filter((tag) => tag.id && tag.name)
    .filter((tag, index, list) => list.findIndex((item) => item.id === tag.id) === index);
  const tagIds = new Set(tags.map((tag) => tag.id));

  const photos = {};
  let photoTotal = 0;
  const photoEntries = Object.entries(input?.photos && typeof input.photos === "object" ? input.photos : {})
    .sort(([, a], [, b]) => String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")));
  for (const [idValue, photo] of photoEntries) {
    if (Object.keys(photos).length >= MAX_PHOTOS) break;
    const id = cleanText(idValue, 80);
    const dataUrl = String(photo?.dataUrl || "");
    if (!id || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(dataUrl) || dataUrl.length > MAX_PHOTO_LENGTH) continue;
    if (photoTotal + dataUrl.length > MAX_PHOTO_TOTAL) break;
    photos[id] = { dataUrl, createdAt: cleanText(photo?.createdAt, 40) };
    photoTotal += dataUrl.length;
  }

  let productImageTotal = 0;
  const items = (Array.isArray(input?.items) ? input.items : [])
    .slice(0, MAX_ITEMS)
    .map((item) => {
      const photoId = cleanText(item?.photoId, 80);
      let aiAnnotation = cleanAiAnnotation(item?.aiAnnotation);
      const imageLength = String(aiAnnotation?.productImages?.[0]?.url || "").length;
      if (imageLength && productImageTotal + imageLength <= MAX_PRODUCT_IMAGE_TOTAL) productImageTotal += imageLength;
      else if (aiAnnotation?.productImages?.length) aiAnnotation = { ...aiAnnotation, productImages: [] };
      const requestedProductImage = cleanGeneratedImageUrl(item?.preferredProductImageUrl);
      const preferredProductImageUrl = aiAnnotation?.productImages.some((image) => image.url === requestedProductImage)
        ? requestedProductImage
        : aiAnnotation?.productImages[0]?.url || "";
      return {
        id: cleanText(item?.id, 80),
        brand: cleanText(item?.brand, 100),
        name: cleanText(item?.name, 100),
        benefits: cleanDisplayText(item?.benefits, 500),
        categoryId: categoryIds.has(item?.categoryId) ? item.categoryId : "daily",
        recipientTagIds: (Array.isArray(item?.recipientTagIds) ? item.recipientTagIds : [])
          .filter((id) => tagIds.has(id))
          .slice(0, 20),
        note: cleanText(item?.note, 800),
        purchased: Boolean(item?.purchased),
        photoId: photos[photoId] ? photoId : "",
        preferredProductImageUrl,
        aiAnnotation,
        createdAt: cleanText(item?.createdAt, 40) || new Date().toISOString(),
        updatedAt: cleanText(item?.updatedAt, 40) || new Date().toISOString(),
      };
    })
    .filter((item) => item.id && item.name)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);

  const usedPhotos = new Set(items.map((item) => item.photoId).filter(Boolean));
  const prunedPhotos = Object.fromEntries(Object.entries(photos).filter(([id]) => usedPhotos.has(id)));
  return {
    scope: "private",
    categories,
    tags,
    items,
    photos: prunedPhotos,
    revision: (Number(previous?.revision) || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

export default async function shoppingHandler(request, response) {
  try {
    const member = await authenticatedMember(request);
    if (!member?.id) return sendJson(response, 401, { error: "AUTH_REQUIRED" });
    const tripId = requestedTripId(request);
    if (!tripId) return sendJson(response, 400, { error: "TRIP_REQUIRED" });
    const trip = await readJson(`${TRIP_PREFIX}${tripId}`);
    if (!trip?.members?.[member.id]) return sendJson(response, 403, { error: "TRIP_ACCESS_REQUIRED" });

    const key = `${SHOPPING_PREFIX}${member.id}:${tripId}`;
    const previous = (await readJson(key)) || emptyShopping();
    if (request.method === "GET") {
      const sanitized = {
        ...previous,
        items: (Array.isArray(previous.items) ? previous.items : []).map((item) => {
          const aiAnnotation = cleanAiAnnotation(item?.aiAnnotation);
          const preferredProductImageUrl = aiAnnotation?.productImages?.some((image) => image.url === item?.preferredProductImageUrl)
            ? item.preferredProductImageUrl
            : aiAnnotation?.productImages?.[0]?.url || "";
          return { ...item, preferredProductImageUrl, aiAnnotation };
        }),
      };
      return sendJson(response, 200, sanitized);
    }
    if (request.method === "PUT") {
      const updated = cleanShopping(request.body, previous);
      await redisCommand(["SET", key, JSON.stringify(updated)]);
      return sendJson(response, 200, updated);
    }
    response.setHeader("Allow", "GET, PUT");
    return sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SHOPPING_DATA_ERROR";
    return sendJson(response, message === "SHARED_DATABASE_NOT_CONFIGURED" ? 503 : 500, { error: message });
  }
}

export { cleanAiAnnotation, cleanDisplayText, defaultCategories };
