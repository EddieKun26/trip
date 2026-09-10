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
  // Read existing saved components only; never resolve a place or infer travel semantics.
  function addressSuggestions(place) {
    const components = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
    const candidates = components.filter((component) => (Array.isArray(component?.types) ? component.types : []).some((type) =>
      /^(?:neighborhood|sublocality(?:_level_[1-5])?|locality)$/.test(type)))
      .map((component) => String(component.longText || component.long_name || ""))
      .map((name) => name.trim().replace(/[0-9０-９一二三四五六七八九十]+丁目$/u, "").trim())
      .filter((name) => /\p{L}/u.test(name) && !/^[一二三四五六七八九十]+$/u.test(name) && !/^\d+\s*-?\s*chome$/i.test(name));
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
