function cleanText(value, length = 500) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, length);
}
function decodeHtml(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function jsonString(value) {
  try {
    return JSON.parse(`"${String(value || "")}"`);
  } catch {
    return decodeHtml(String(value || "").replace(/\\\//g, "/"));
  }
}

function flattenedJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenedJsonLd);
  if (!value || typeof value !== "object") return [];
  return [value, ...flattenedJsonLd(value["@graph"] || [])];
}

function jsonLdNodes(html) {
  const nodes = [];
  const pattern = /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of String(html || "").matchAll(pattern)) {
    const raw = decodeHtml(match[1]).trim().replace(/^<!--|-->$/g, "").trim();
    if (!raw) continue;
    try {
      nodes.push(...flattenedJsonLd(JSON.parse(raw)));
    } catch {
      // Some booking sites emit malformed analytics JSON beside valid JSON-LD.
    }
  }
  return nodes;
}

function typeNames(node) {
  return (Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]])
    .map((value) => cleanText(value, 80).toLowerCase())
    .filter(Boolean);
}

function looksLikeLodgingNode(node) {
  const types = typeNames(node);
  return types.some((type) => /hotel|lodging|accommodation|vacationrental|apartment|house|product/u.test(type));
}

function firstImage(value) {
  const entry = Array.isArray(value) ? value[0] : value;
  return cleanText(typeof entry === "object" ? entry?.url || entry?.contentUrl : entry, 1000);
}

function coordinatesFromNode(node) {
  const geo = node?.geo && typeof node.geo === "object" ? node.geo : node;
  const latitude = Number(geo?.latitude);
  const longitude = Number(geo?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180
    || (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001)) return null;
  return { latitude, longitude };
}

function addressParts(value) {
  if (typeof value === "string") return { address: cleanText(value, 300), locationLabel: "" };
  if (!value || typeof value !== "object") return { address: "", locationLabel: "" };
  const street = cleanText(value.streetAddress, 220);
  const locality = cleanText(value.addressLocality, 100);
  const region = cleanText(value.addressRegion, 100);
  const postal = cleanText(value.postalCode, 30);
  const country = cleanText(typeof value.addressCountry === "object" ? value.addressCountry?.name : value.addressCountry, 100);
  const locationLabel = [locality, region, country].filter(Boolean).filter((part, index, parts) => parts.indexOf(part) === index).join("，");
  if (!street) return { address: "", locationLabel };
  const additions = [locality, region, postal, country].filter((part) => part && !street.toLowerCase().includes(part.toLowerCase()));
  return { address: [street, ...additions].join("，"), locationLabel };
}

function agodaBootstrapMetadata(html) {
  const decoded = decodeHtml(String(html || ""));
  const names = [...decoded.matchAll(/"hotelName"\s*:\s*"((?:\\.|[^"\\]){1,240})"/gi)]
    .map((match) => cleanText(jsonString(match[1]), 160))
    .filter(Boolean);
  const id = decoded.match(/"hotelId"\s*:\s*(?:"(\d+)"|(\d+))/i);
  return {
    lodgingName: names[0] || "",
    lodgingId: cleanText(id?.[1] || id?.[2], 40),
  };
}

export function extractStructuredLodgingMetadata(html) {
  const lodgingNodes = jsonLdNodes(html).filter(looksLikeLodgingNode);
  const allNodes = jsonLdNodes(html);
  let lodgingName = "";
  let description = "";
  let imageUrl = "";
  let address = "";
  let locationLabel = "";
  let coordinates = null;
  for (const node of lodgingNodes) {
    lodgingName ||= cleanText(node.name || node.headline, 160);
    description ||= cleanText(node.description, 3000);
    imageUrl ||= firstImage(node.image || node.photo);
    const parsedAddress = addressParts(node.address || node.location?.address);
    address ||= parsedAddress.address;
    locationLabel ||= parsedAddress.locationLabel;
    coordinates ||= coordinatesFromNode(node) || coordinatesFromNode(node.location);
  }
  for (const node of allNodes) {
    const parsedAddress = addressParts(node.address || node.location?.address);
    address ||= parsedAddress.address;
    locationLabel ||= parsedAddress.locationLabel;
    coordinates ||= coordinatesFromNode(node) || coordinatesFromNode(node.geo) || coordinatesFromNode(node.location);
  }
  const agoda = agodaBootstrapMetadata(html);
  lodgingName ||= agoda.lodgingName;
  const locationApproximate = Boolean(coordinates && !address);
  return {
    ...(lodgingName ? { lodgingName } : {}),
    ...(description ? { structuredDescription: description } : {}),
    ...(imageUrl ? { lodgingImageUrl: imageUrl } : {}),
    ...(address ? { address } : {}),
    ...(locationLabel ? { locationLabel } : {}),
    ...(coordinates || {}),
    ...(locationApproximate ? { locationApproximate: true } : {}),
    ...(agoda.lodgingId ? { lodgingId: agoda.lodgingId } : {}),
  };
}
