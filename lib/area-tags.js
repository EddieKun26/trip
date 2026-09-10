/* Optional user labels. Deliberately independent of Travel Area and geometry. */
(function (root) {
  const key = (value) => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("und");
  function normalize(values) {
    const seen = new Set();
    return (Array.isArray(values) ? values : []).filter((value) => {
      if (typeof value !== "string" || !key(value) || seen.has(key(value))) return false;
      seen.add(key(value));
      return true;
    }).map((value) => value.trim());
  }
  const values = (place) => normalize(place?.areaTags);
  const matches = (place, tag) => !tag || values(place).some((value) => key(value) === key(tag));
  const tripTags = (places) => normalize((Array.isArray(places) ? places : []).flatMap(values));
  const componentTypes = (component) => Array.isArray(component?.types) ? component.types : [];
  const componentName = (component) => String(component?.longText || component?.long_name || "").trim();
  const typeSignature = (component) => [...new Set(componentTypes(component))].sort().join("|");
  function meaningfulName(component, japanese) {
    const types = componentTypes(component);
    // Explicit exclusions win over a positive type on a mixed/malformed component.
    if (types.some((type) => /^(?:administrative_area(?:_level_\d+)?|locality|postal_town|country|postal_code(?:_suffix|_prefix)?|street_number|street_address|premise|subpremise|route)$/.test(type))) return "";
    if (!types.some((type) => /^(?:neighborhood|sublocality(?:_level_[1-5])?)$/.test(type))) return "";
    // Japanese level 1 is the ward/municipality layer, not a town candidate.
    if (japanese && types.includes("sublocality_level_1")) return "";
    const name = componentName(component).replace(/[0-9０-９一二三四五六七八九十]+丁目$/u, "").trim();
    const comparison = name.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[‐‑‒–—−ー－]/gu, "-").toLowerCase();
    if (!/\p{L}/u.test(name) || /^[一二三四五六七八九十]+$/u.test(name)) return "";
    if (/^(?:[0-9一二三四五六七八九十]+[\s-]*(?:丁目|番地?|号|號)?[\s-]*)+$/u.test(comparison)) return "";
    if (/^(?:[0-9一二三四五六七八九十]+[\s-]*)?(?:chome|丁目|番(?:地)?|ban|号|號)(?:[\s-]*\d+)*$/u.test(comparison)) return "";
    if (/(?:\b(?:city|ward|prefecture|state|county)|[-\s](?:ku|shi)|[市区區都府県縣])$/iu.test(comparison)) return "";
    return name;
  }
  // Read existing saved components only; never resolve a place or infer travel semantics.
  function addressSuggestions(place) {
    const primary = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
    const original = Array.isArray(place?.addressComponentsOriginal) ? place.addressComponentsOriginal : [];
    const japanese = String(place?.countryCode || "").toUpperCase() === "JP" || [...primary, ...original].some((component) =>
      componentTypes(component).includes("country") && String(component?.shortText || component?.short_name || "").toUpperCase() === "JP");
    const components = primary.some((component) => meaningfulName(component, japanese)) ? primary : original;
    const candidates = components.map((component) => {
      const name = meaningfulName(component, japanese);
      if (!name) return "";
      // The API stores paired localized/original address arrays. Match an unambiguous
      // exact component type signature, never array position, legacy area or an alias.
      const signature = typeSignature(component);
      const peers = original.filter((candidate) => typeSignature(candidate) === signature);
      if (components === primary && components.filter((candidate) => typeSignature(candidate) === signature).length === 1
        && peers.length === 1 && /\p{Script=Latin}/u.test(name) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name)) {
        const local = meaningfulName(peers[0], japanese);
        if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(local)) return local;
      }
      return name;
    }).filter(Boolean);
    if (candidates.length) return normalize(candidates);
    // Only accept a Japanese street block following an explicit municipality delimiter.
    // No suffix guessing for free text, building names, or a Place's display name.
    const address = String(place?.formattedAddress || place?.address || "");
    const match = address.match(/^.*(?:区|區|市)\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ヶケー]+?)[0-9０-９]+丁目/u)
      || address.match(/^\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ヶケー]+?)[0-9０-９]+丁目\s*$/u);
    return match ? normalize([match[1]]) : [];
  }
  function suggestions(place, places, selected = values(place)) {
    const selectedKeys = new Set(normalize(selected).map(key));
    const trip = tripTags(places).filter((tag) => !selectedKeys.has(key(tag)));
    const tripKeys = new Set(trip.map(key));
    const address = addressSuggestions(place).filter((tag) => !selectedKeys.has(key(tag)) && !tripKeys.has(key(tag)));
    return { trip, address };
  }
  // Absence stays absent. An explicit [] always stays cleared; there is no migration.
  function cleanPlace(place, previousPlaces = []) {
    if (place && Object.hasOwn(place, "areaTags")) return { ...place, areaTags: values(place) };
    // An older client may omit an unknown optional field. Preserve it only on an
    // unambiguous stable identity, never by a display name or geographic inference.
    const previous = (Array.isArray(previousPlaces) ? previousPlaces : []).filter((candidate) => place?.id ? candidate?.id === place.id
      : place?.placeId ? candidate?.placeId === place.placeId : false);
    return previous.length === 1 && Object.hasOwn(previous[0], "areaTags")
      ? { ...place, areaTags: values(previous[0]) } : place;
  }
  const api = { key, normalize, values, matches, tripTags, addressSuggestions, suggestions, cleanPlace };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AreaTags = api;
})(globalThis);
