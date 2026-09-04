export const TRAVEL_AREA_RESOLUTION_VERSION = 5;
export const PLANNING_REGION_RESOLUTION_VERSION = TRAVEL_AREA_RESOLUTION_VERSION;

const TYPE_PRIORITY = ["neighborhood", "route", "sublocality_level_4", "sublocality_level_3", "sublocality_level_2", "sublocality_level_1", "locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2"];
const JP_NAMED_TRAVEL_AREAS = new Map();
const KR_NAMED_TRAVEL_AREAS = new Map();
const GENERIC_NAMED_TRAVEL_AREAS = new Map();

function normalizedName(value) {
  return String(value || "").normalize("NFKD").replace(/\p{M}/gu, "").normalize("NFC")
    .replace(/(?:special\s+ward|district|city|ward|shi|ku|gu)$/iu, "")
    .replace(/[都道府県縣市区區町村구]/gu, "").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase("en");
}

function registerArea(map, area, names) {
  names.forEach((name) => map.set(normalizedName(name), area));
}

registerArea(JP_NAMED_TRAVEL_AREAS, { key: "shibuya", zh: "澀谷", local: "渋谷", resolver: "JP_TRAVEL_AREA" }, ["神宮前", "Jingumae", "神南", "Jinnan", "富ヶ谷", "富ケ谷", "Tomigaya", "渋谷", "Shibuya"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "asakusa", zh: "淺草", local: "浅草", resolver: "JP_TRAVEL_AREA" }, ["花川戸", "花川戶", "Hanakawado", "雷門", "Kaminarimon", "浅草", "淺草", "Asakusa"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "ginza", zh: "銀座", local: "銀座", resolver: "JP_TRAVEL_AREA" }, ["銀座", "Ginza"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "ebisu-daikanyama", zh: "惠比壽／代官山", local: "恵比寿／代官山", resolver: "JP_TRAVEL_AREA" }, ["恵比寿", "恵比寿西", "惠比壽", "惠比壽西", "Ebisu", "代官山", "代官山町", "Daikanyama"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "shinjuku", zh: "新宿", local: "新宿", resolver: "JP_TRAVEL_AREA" }, ["西新宿", "Nishishinjuku", "代々木", "代代木", "Yoyogi", "新宿", "Shinjuku"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "otsuka", zh: "大塚", local: "大塚", resolver: "JP_TRAVEL_AREA" }, ["北大塚", "南大塚", "大塚", "Otsuka"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "ikebukuro", zh: "池袋", local: "池袋", resolver: "JP_TRAVEL_AREA" }, ["西池袋", "東池袋", "池袋", "Ikebukuro"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "toyosu", zh: "豐洲", local: "豊洲", resolver: "JP_TRAVEL_AREA" }, ["豊洲", "豐洲", "Toyosu"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "marunouchi-otemachi", zh: "丸之內／大手町", local: "丸の内／大手町", resolver: "JP_TRAVEL_AREA" }, ["丸の内", "丸之內", "大手町", "Marunouchi", "Otemachi"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "tsukiji", zh: "築地", local: "築地", resolver: "JP_TRAVEL_AREA" }, ["築地", "Tsukiji"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "azabujuban", zh: "麻布十番", local: "麻布十番", resolver: "JP_TRAVEL_AREA" }, ["麻布十番", "Azabujuban"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "tokyo-tower-shiba", zh: "東京鐵塔／芝公園", local: "東京タワー／芝公園", resolver: "JP_TRAVEL_AREA" }, ["芝", "芝公園", "Tokyo Tower"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "harajuku-omotesando", zh: "原宿／表參道", local: "原宿／表参道", resolver: "JP_TRAVEL_AREA" }, ["千駄ケ谷", "千駄ヶ谷", "Harajuku", "Omotesando", "表参道", "表參道"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "nerima", zh: "練馬", local: "練馬", resolver: "JP_TRAVEL_AREA" }, ["春日町", "練馬", "Nerima"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "kamakura", zh: "鎌倉", local: "鎌倉", resolver: "JP_TRAVEL_AREA" }, ["鎌倉", "Kamakura"]);
registerArea(JP_NAMED_TRAVEL_AREAS, { key: "fujisawa", zh: "藤澤", local: "藤沢", resolver: "JP_TRAVEL_AREA" }, ["藤沢", "藤澤", "Fujisawa"]);

registerArea(KR_NAMED_TRAVEL_AREAS, { key: "myeongdong", zh: "明洞", local: "명동", resolver: "KR_TRAVEL_AREA" }, ["명동", "명동길", "明洞", "Myeongdong", "Myeongdong-gil"]);
registerArea(KR_NAMED_TRAVEL_AREAS, { key: "hongdae", zh: "弘大", local: "홍대", resolver: "KR_TRAVEL_AREA" }, ["홍대", "弘大", "Hongdae"]);
registerArea(KR_NAMED_TRAVEL_AREAS, { key: "itaewon", zh: "梨泰院", local: "이태원", resolver: "KR_TRAVEL_AREA" }, ["이태원", "梨泰院", "Itaewon"]);
registerArea(KR_NAMED_TRAVEL_AREAS, { key: "gangnam", zh: "江南", local: "강남", resolver: "KR_TRAVEL_AREA" }, ["강남", "江南", "Gangnam"]);
registerArea(GENERIC_NAMED_TRAVEL_AREAS, { key: "montmartre", zh: "蒙馬特", local: "Montmartre", resolver: "GENERIC_NAMED_TRAVEL_AREA" }, ["Montmartre", "蒙馬特", "Rue du Chevalier de la Barre", "Place du Tertre"]);

const JP_FALLBACK_AREAS = new Map([
  ["千代田", ["chiyoda", "千代田", "千代田"]], ["chiyoda", ["chiyoda", "千代田", "千代田"]], ["中央", ["chuo", "中央", "中央"]], ["chuo", ["chuo", "中央", "中央"]],
  ["港", ["minato", "港", "港"]], ["minato", ["minato", "港", "港"]], ["文京", ["bunkyo", "文京", "文京"]], ["bunkyo", ["bunkyo", "文京", "文京"]],
  ["台東", ["taito", "台東", "台東"]], ["taito", ["taito", "台東", "台東"]], ["墨田", ["sumida", "墨田", "墨田"]], ["sumida", ["sumida", "墨田", "墨田"]],
  ["江東", ["koto", "江東", "江東"]], ["koto", ["koto", "江東", "江東"]], ["品川", ["shinagawa", "品川", "品川"]], ["shinagawa", ["shinagawa", "品川", "品川"]],
  ["目黒", ["meguro", "目黑", "目黒"]], ["meguro", ["meguro", "目黑", "目黒"]], ["大田", ["ota", "大田", "大田"]], ["ota", ["ota", "大田", "大田"]],
  ["世田谷", ["setagaya", "世田谷", "世田谷"]], ["setagaya", ["setagaya", "世田谷", "世田谷"]], ["中野", ["nakano", "中野", "中野"]], ["nakano", ["nakano", "中野", "中野"]],
  ["杉並", ["suginami", "杉並", "杉並"]], ["suginami", ["suginami", "杉並", "杉並"]], ["豊島", ["toshima", "豐島", "豊島"]], ["toshima", ["toshima", "豐島", "豊島"]],
  ["北", ["kita", "北", "北"]], ["kita", ["kita", "北", "北"]], ["荒川", ["arakawa", "荒川", "荒川"]], ["arakawa", ["arakawa", "荒川", "荒川"]],
  ["板橋", ["itabashi", "板橋", "板橋"]], ["itabashi", ["itabashi", "板橋", "板橋"]], ["足立", ["adachi", "足立", "足立"]], ["adachi", ["adachi", "足立", "足立"]],
  ["葛飾", ["katsushika", "葛飾", "葛飾"]], ["katsushika", ["katsushika", "葛飾", "葛飾"]], ["江戸川", ["edogawa", "江戶川", "江戸川"]], ["edogawa", ["edogawa", "江戶川", "江戸川"]],
]);
const KR_DISTRICT_AREAS = new Map([
  ["종로", ["jongno", "鐘路", "종로"]], ["중", ["jung", "中", "중"]], ["용산", ["yongsan", "龍山", "용산"]], ["마포", ["mapo", "麻浦", "마포"]],
  ["동대문", ["dongdaemun", "東大門", "동대문"]], ["서초", ["seocho", "瑞草", "서초"]], ["송파", ["songpa", "松坡", "송파"]],
]);
const US_BOROUGHS = new Map([
  ["brooklyn", ["brooklyn", "布魯克林", "Brooklyn"]], ["manhattan", ["manhattan", "曼哈頓", "Manhattan"]], ["queens", ["queens", "皇后區", "Queens"]],
  ["bronx", ["bronx", "布朗克斯", "Bronx"]], ["statenisland", ["staten-island", "史泰登島", "Staten Island"]],
]);
const COMMON_CITY_TRANSLATIONS = new Map([
  ["paris", ["paris", "巴黎", "Paris"]], ["newyork", ["new-york", "紐約", "New York"]], ["losangeles", ["los-angeles", "洛杉磯", "Los Angeles"]],
  ["sanfrancisco", ["san-francisco", "舊金山", "San Francisco"]], ["chicago", ["chicago", "芝加哥", "Chicago"]], ["boston", ["boston", "波士頓", "Boston"]],
]);

export function normalizeAddressComponents(addressComponents = []) {
  return (Array.isArray(addressComponents) ? addressComponents : []).slice(0, 20).map((component) => ({
    longText: String(component?.longText ?? component?.long_name ?? "").normalize("NFKC").trim().slice(0, 160),
    shortText: String(component?.shortText ?? component?.short_name ?? "").normalize("NFKC").trim().slice(0, 80),
    types: Array.isArray(component?.types) ? component.types.slice(0, 10).map((type) => String(type).slice(0, 80)) : [],
  })).filter((component) => component.longText || component.shortText);
}

export function countryCodeFromAddressComponents(addressComponents = []) {
  return String(normalizeAddressComponents(addressComponents).find((component) => component.types.includes("country"))?.shortText || "").toUpperCase();
}

export function administrativeInfoFromAddressComponents(localizedAddressComponents = [], originalAddressComponents = []) {
  const localized = normalizeAddressComponents(localizedAddressComponents);
  const local = normalizeAddressComponents(originalAddressComponents?.length ? originalAddressComponents : localizedAddressComponents);
  const administrative = (component) => component.types.some((type) => type === "locality" || type === "postal_town" || type.startsWith("administrative_area_") || type === "sublocality_level_1");
  return { countryCode: countryCodeFromAddressComponents(local) || countryCodeFromAddressComponents(localized), localized: localized.filter(administrative), local: local.filter(administrative) };
}

function componentByPriority(components, priorities, predicate = () => true) {
  for (const type of priorities) {
    const component = components.find((item) => item.types.includes(type) && predicate(item));
    if (component) return component;
  }
  return null;
}

function findNamedArea(components, map) {
  for (const type of TYPE_PRIORITY) {
    for (const component of components.filter((item) => item.types.includes(type))) {
      const area = map.get(normalizedName(component.longText));
      if (area) return area;
    }
  }
  return null;
}

function stripJapaneseAdministrativeSuffix(value) {
  return String(value || "").trim().replace(/(?:[都道府県縣市区區町村]|\s+(?:Special Ward|City|Ward|Town|Village)|[-\s](?:shi|ku|cho|machi|mura))$/iu, "").trim();
}
function stripKoreanDistrictSuffix(value) {
  return String(value || "").trim().replace(/(?:區|区|구|\s+(?:District|Gu)|[-\s]gu)$/iu, "").trim();
}

function areaResult(area, countryCode) {
  if (!area?.key || !area?.zh || !area?.local || !/\p{Script=Han}/u.test(area.zh)) return null;
  return {
    travelAreaKey: area.key, travelAreaZh: area.zh, travelAreaLocal: area.local, countryCode,
    travelAreaResolved: true, travelAreaSource: "automatic", travelAreaResolver: area.resolver, travelAreaResolutionVersion: TRAVEL_AREA_RESOLUTION_VERSION,
    planningRegion: area.zh, planningRegionOriginal: area.local, planningRegionResolved: true, planningRegionResolver: area.resolver, planningRegionResolutionVersion: TRAVEL_AREA_RESOLUTION_VERSION,
  };
}

function unresolvedResult(countryCode, reason) {
  return {
    travelAreaKey: "", travelAreaZh: "", travelAreaLocal: "", countryCode, travelAreaResolved: false, travelAreaSource: "automatic", travelAreaResolver: "", travelAreaResolutionVersion: 0, travelAreaResolutionError: reason,
    planningRegion: "", planningRegionOriginal: "", planningRegionResolved: false, planningRegionResolver: "", planningRegionResolutionVersion: 0, planningRegionResolutionError: reason,
  };
}

function resolveJapan(components, countryCode) {
  const named = findNamedArea(components, JP_NAMED_TRAVEL_AREAS);
  if (named) return areaResult(named, countryCode);
  const fallback = componentByPriority(components, ["locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2"], (item) => JP_FALLBACK_AREAS.has(normalizedName(item.longText)) || /(?:市|町|村|区|\s+(?:City|Town|Village|Ward)|[-\s](?:shi|cho|machi|mura|ku))$/iu.test(item.longText));
  if (!fallback) return unresolvedResult(countryCode, "JP_TRAVEL_AREA_NOT_FOUND");
  const known = JP_FALLBACK_AREAS.get(normalizedName(fallback.longText));
  if (known) return areaResult({ key: known[0], zh: known[1], local: known[2], resolver: "JP_WARD_FALLBACK" }, countryCode);
  const local = stripJapaneseAdministrativeSuffix(fallback.longText);
  const zh = local.replaceAll("渋", "澀").replaceAll("浅", "淺").replaceAll("豊", "豐").replaceAll("黒", "黑").replaceAll("戸", "戶").replaceAll("沢", "澤").replaceAll("瀬", "瀨");
  return areaResult({ key: normalizedName(local), zh, local, resolver: "JP_MUNICIPALITY_FALLBACK" }, countryCode) || unresolvedResult(countryCode, "JP_TRAVEL_AREA_EMPTY");
}

function resolveKorea(components, countryCode) {
  const named = findNamedArea(components, KR_NAMED_TRAVEL_AREAS);
  if (named) return areaResult(named, countryCode);
  if (hasUnmappedNeighborhood(components)) return unresolvedResult(countryCode, "KR_TRAVEL_AREA_RULE_REQUIRED");
  const district = componentByPriority(components, ["sublocality_level_1", "administrative_area_level_2", "administrative_area_level_3"], (item) => /(?:구|\s+(?:District|Gu)|[-\s]gu)$/iu.test(item.longText));
  const local = stripKoreanDistrictSuffix(district?.longText);
  const known = KR_DISTRICT_AREAS.get(normalizedName(local));
  return known ? areaResult({ key: known[0], zh: known[1], local: known[2], resolver: "KR_DISTRICT_FALLBACK" }, countryCode) : unresolvedResult(countryCode, "KR_TRAVEL_AREA_NOT_FOUND");
}

function resolveUnitedStates(components, countryCode) {
  const borough = componentByPriority(components, ["neighborhood", "sublocality_level_1", "administrative_area_level_2", "administrative_area_level_3"], (item) => US_BOROUGHS.has(normalizedName(item.longText)));
  if (borough) {
    const known = US_BOROUGHS.get(normalizedName(borough.longText));
    return areaResult({ key: known[0], zh: known[1], local: known[2], resolver: "US_BOROUGH" }, countryCode);
  }
  if (hasUnmappedNeighborhood(components)) return unresolvedResult(countryCode, "US_TRAVEL_AREA_RULE_REQUIRED");
  const city = componentByPriority(components, ["locality", "postal_town"]);
  const known = city && COMMON_CITY_TRANSLATIONS.get(normalizedName(city.longText));
  return known ? areaResult({ key: known[0], zh: known[1], local: known[2], resolver: "US_CITY_FALLBACK" }, countryCode) : unresolvedResult(countryCode, "US_TRAVEL_AREA_NOT_FOUND");
}

function resolveGeneric(components, countryCode) {
  const named = findNamedArea(components, GENERIC_NAMED_TRAVEL_AREAS);
  if (named) return areaResult(named, countryCode);
  if (hasUnmappedNeighborhood(components)) return unresolvedResult(countryCode, "TRAVEL_AREA_RULE_REQUIRED");
  const city = componentByPriority(components, ["locality", "postal_town", "administrative_area_level_3"]);
  const known = city && COMMON_CITY_TRANSLATIONS.get(normalizedName(city.longText));
  return known ? areaResult({ key: known[0], zh: known[1], local: known[2], resolver: "GENERIC_CITY_FALLBACK" }, countryCode) : unresolvedResult(countryCode, "TRAVEL_AREA_NOT_FOUND");
}

function hasUnmappedNeighborhood(components) {
  return components.some((component) => component.types.some((type) =>
    type === "neighborhood" || /^sublocality_level_[2-5]$/.test(type)));
}

export function resolveTravelArea({ localizedAddressComponents = [], originalAddressComponents = [], countryCode = "" } = {}) {
  const localized = normalizeAddressComponents(localizedAddressComponents);
  const original = normalizeAddressComponents(originalAddressComponents?.length ? originalAddressComponents : localizedAddressComponents);
  const resolvedCountryCode = String(countryCode || countryCodeFromAddressComponents(original) || countryCodeFromAddressComponents(localized)).toUpperCase();
  if (!resolvedCountryCode) return unresolvedResult("", "COUNTRY_CODE_NOT_FOUND");
  const combined = [...original, ...localized];
  if (resolvedCountryCode === "JP") return resolveJapan(combined, resolvedCountryCode);
  if (resolvedCountryCode === "KR") return resolveKorea(combined, resolvedCountryCode);
  if (resolvedCountryCode === "US") return resolveUnitedStates(combined, resolvedCountryCode);
  return resolveGeneric(combined, resolvedCountryCode);
}

export const resolvePlanningRegion = resolveTravelArea;
