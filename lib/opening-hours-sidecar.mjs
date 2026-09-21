import { createHash } from "node:crypto";
import { resolveStructuredOpeningPeriods, structuredHoursPlaceId } from "./opening-hours.mjs";

// Only a regularOpeningPeriods v1 value is stored. The hash makes arbitrary Google IDs safe
// as Redis keys; the value is independently checked against the current Place identity.
export const openingHoursKey = (placeId) => `tokyo-family-trip:opening-hours:v1:${createHash("sha256").update(placeId).digest("hex")}`;

export async function readOpeningHoursSidecars(places, redisCommand) {
  const ids = [...new Set(places.map(structuredHoursPlaceId).filter(Boolean))];
  if (!ids.length) return new Map();
  try {
    const values = await redisCommand(["MGET", ...ids.map(openingHoursKey)]);
    return new Map(ids.map((id, index) => {
      try { return [id, JSON.parse(values?.[index] || "null")]; }
      catch { return [id, null]; }
    }));
  } catch {
    // A store read failure preserves valid legacy embedded data; otherwise hours are unknown.
    return new Map();
  }
}

export function overlayOpeningHours(trip, sidecars) {
  return { ...trip, places: (trip.places || []).map(place => {
    const effective = resolveStructuredOpeningPeriods(place, sidecars.get(structuredHoursPlaceId(place)));
    return effective ? { ...place, regularOpeningPeriods: effective } : { ...place, regularOpeningPeriods: undefined };
  }) };
}

export async function writeOpeningHoursSidecar(record, redisCommand) {
  const place = { placeId: record?.placeId };
  if (resolveStructuredOpeningPeriods(place, record) !== record) throw new Error("INVALID_OPENING_HOURS_RECORD");
  await redisCommand(["SET", openingHoursKey(record.placeId), JSON.stringify(record)]);
  return record;
}
