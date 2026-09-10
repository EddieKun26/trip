/* Optional user labels. Deliberately independent of Travel Area and geometry. */
(function (root) {
  const plainKey = (value) => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("und");
  // Fold only vowel macrons, and only when a Japanese address candidate registers
  // the romanized name in a comparison context. Other accents remain significant.
  const romanKey = (value) => plainKey(value).normalize("NFD").replace(/([aeiou])\u0304/gu, "$1").normalize("NFC");
  const key = (value, context) => context?.get?.(romanKey(value)) || plainKey(value);
  function normalize(values, context) {
    const seen = new Set();
    return (Array.isArray(values) ? values : []).filter((value) => {
      if (typeof value !== "string" || !key(value, context) || seen.has(key(value, context))) return false;
      seen.add(key(value, context));
      return true;
    }).map((value) => value.trim());
  }
  const values = (place, context = comparison([place])) => normalize(place?.areaTags, context);
  const matches = (place, tag, context = comparison([place])) => !tag || values(place, context).some((value) => key(value, context) === key(tag, context));
  const tripTags = (places, context = comparison(places)) => normalize((Array.isArray(places) ? places : []).flatMap((place) => values(place, context)), context);
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
  function addressCandidates(place) {
    const primary = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
    const original = Array.isArray(place?.addressComponentsOriginal) ? place.addressComponentsOriginal : [];
    const japanese = String(place?.countryCode || "").toUpperCase() === "JP" || [...primary, ...original].some((component) =>
      componentTypes(component).includes("country") && String(component?.shortText || component?.short_name || "").toUpperCase() === "JP")
      || [...primary, ...original].some((component) => /\bch[oō]me\b/iu.test(componentName(component)))
      || [place?.formattedAddress, place?.manualAddress, place?.address].some((raw) => /丁目|\bch[oō]me\b/iu.test(String(raw || "")));
    const components = primary.some((component) => meaningfulName(component, japanese)) ? primary : original;
    const candidates = components.map((component) => {
      const name = meaningfulName(component, japanese);
      if (!name) return null;
      const record = { label: name, names: [name], japanese, source: "structured" };
      // The API stores paired localized/original address arrays. Match an unambiguous
      // exact component type signature, never array position, legacy area or an alias.
      const signature = typeSignature(component);
      const peers = original.filter((candidate) => typeSignature(candidate) === signature);
      if (components === primary && components.filter((candidate) => typeSignature(candidate) === signature).length === 1
        && peers.length === 1 && /\p{Script=Latin}/u.test(name) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name)) {
        const local = meaningfulName(peers[0], japanese);
        if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(local)) return { ...record, label: local, names: [name, local] };
      }
      if (components === primary && peers.length === 1 && components.filter((candidate) => typeSignature(candidate) === signature).length === 1) {
        const counterpart = meaningfulName(peers[0], japanese);
        if (counterpart) record.names.push(counterpart);
      }
      return record;
    }).filter(Boolean);
    if (candidates.length) return candidates;
    return formattedCandidates(place);
  }
  function parserCopy(value) {
    return String(value || "").normalize("NFKC").replace(/[‐‑‒–—−－]/gu, "-")
      .replace(/\s+/gu, " ").replace(/\s*-\s*/gu, "-").replace(/\s*,\s*/gu, ", ").trim();
  }
  function formattedCandidates(place) {
    for (const raw of [place?.formattedAddress, place?.manualAddress, place?.address]) {
      const address = parserCopy(raw);
      const match = address.match(/^.*(?:区|區|市)\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ヶケー]+?)[0-9]+丁目/u)
        || address.match(/^\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ヶケー]+?)[0-9]+丁目\s*$/u);
      if (match) return [{ label: match[1], names: [match[1]], japanese: true, source: "formatted" }];
      // A district must sit between a numbered Chome block and an explicit
      // municipality, or between that municipality and the block. Room numbers,
      // prefecture, postal code and bare building text are never candidates.
      const latin = "[\\p{Script=Latin}\\p{M}]+(?:[ '-][\\p{Script=Latin}\\p{M}]+)*?";
      const block = "\\b[0-9]+[ -]?ch[oō]me-[0-9]+(?:-[0-9]+)?";
      const municipality = latin + "(?: City|-ku|-shi)";
      const forward = new RegExp(block + "\\s+(" + latin + ")(?:,\\s*|\\s+)" + municipality + "(?=,|$)", "giu");
      const reverse = new RegExp(municipality + ",\\s*(" + latin + "),\\s*" + block, "giu");
      const names = normalize([...address.matchAll(forward), ...address.matchAll(reverse)].map((item) => item[1]));
      if (names.length === 1) return [{ label: names[0], names, japanese: true, source: "formatted" }];
    }
    return [];
  }
  // A verified user-facing Travel Area beats any address token. The catalog's own assessment
  // is what separates an independent travel circle from a ward/municipality fallback boundary,
  // so a point inside 渋谷區 never suggests the whole ward. No network, no runtime geocoding:
  // the caller injects the same pre-generated geometry the map already loads.
  const TRAVEL_CIRCLE = "Independent travel circle";
  function travelAreaHits(place, catalog) {
    const contains = root.TravelAreaAudit?.contains;
    const lat = Number(place?.latitude), lng = Number(place?.longitude);
    if (typeof contains !== "function" || !catalog?.areas || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const country = String(place?.countryCode || "").toUpperCase();
    return Object.keys(catalog.areas).sort().map((areaKey) => ({ areaKey, area: catalog.areas[areaKey] }))
      .filter(({ area }) => area?.drawable === true && area.finalGeometry
        && String(area.userFacingAssessment || "").startsWith(TRAVEL_CIRCLE)
        && (!country || !area.countryCode || country === String(area.countryCode).toUpperCase())
        && (!Array.isArray(area.bounds) || (lng >= area.bounds[0] && lng <= area.bounds[2] && lat >= area.bounds[1] && lat <= area.bounds[3]))
        && contains({ geometry: area.finalGeometry }, [lng, lat]))
      .map(({ areaKey, area }) => ({ travelAreaKey: areaKey, travelAreaZh: area.travelAreaZh, travelAreaLocal: area.travelAreaLocal }));
  }
  // zh and local are the same area's own catalog names. Reuse whichever spelling this trip
  // already persists so one area never becomes two filter identities (浅草 vs 淺草).
  function areaLabelForms(hit, places) {
    const forms = [hit?.travelAreaZh, hit?.travelAreaLocal].filter(Boolean).map(plainKey);
    return [...new Set(normalize((Array.isArray(places) ? places : []).flatMap((place) => place?.areaTags || []))
      .filter((tag) => forms.includes(plainKey(tag))))];
  }
  function areaLabel(hit, places) {
    return areaLabelForms(hit, places)[0] || hit?.travelAreaZh || "";
  }
  function addressSuggestions(place, catalog) {
    const hits = travelAreaHits(place, catalog);
    if (hits.length) return normalize(hits.map((hit) => hit.travelAreaZh));
    return normalize(addressCandidates(place).map((candidate) => candidate.label));
  }
  function comparison(places = []) {
    const groups = new Map();
    const localLabels = new Map();
    for (const place of Array.isArray(places) ? places : []) for (const candidate of addressCandidates(place)) {
      if (!candidate.japanese) continue;
      const local = candidate.names.filter((name) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name));
      for (const label of local) if (!localLabels.has(plainKey(label))) localLabels.set(plainKey(label), label);
      for (const name of candidate.names.filter((name) => /^[\p{Script=Latin}\p{M} '-]+$/u.test(name))) {
        const id = romanKey(name);
        if (!groups.has(id)) groups.set(id, new Set());
        local.forEach((value) => groups.get(id).add(plainKey(value)));
      }
    }
    const context = new Map();
    context.labels = localLabels;
    for (const [roman, local] of groups) context.set(roman, local.size === 1 ? [...local][0] : roman);
    return context;
  }
  function preferredLabel(label, places, context = comparison(places)) {
    return (Array.isArray(places) ? places : []).flatMap((place) => normalize(place?.areaTags))
      .find((tag) => key(tag, context) === key(label, context)) || context?.labels?.get(key(label, context)) || label;
  }
  function queryMatches(label, query, context) {
    if (key(label, context).includes(key(query, context))) return true;
    // Search a localized saved label using its evidenced romanized counterpart.
    return [...(context || [])].some(([roman, identity]) => identity === key(label, context) && roman.includes(romanKey(query)));
  }
  function suggestions(place, places, selected = values(place), catalog = null) {
    const context = comparison([...(places || []), place]);
    const selectedKeys = new Set(normalize(selected, context).map((tag) => key(tag, context)));
    const trip = tripTags(places, context).filter((tag) => !selectedKeys.has(key(tag, context)));
    // Verified containment first; the address/町名 parser stays the fallback for every place
    // with no coordinates and for every area with no verified user-facing polygon.
    const hits = travelAreaHits(place, catalog);
    const candidates = hits.length ? hits.map((hit) => areaLabel(hit, places))
      : addressSuggestions(place).map((tag) => preferredLabel(tag, places, context));
    const address = normalize(candidates, context).filter((tag) => !selectedKeys.has(key(tag, context)));
    return { trip, address };
  }
  // Conservative cleanup of fine-grained address tags that a verified travel-circle polygon
  // proves belong to one canonical area. Whitelist only, and every place must re-prove it with
  // its own coordinates -- a matching tag string alone never migrates anything. Returns a
  // manifest; the caller applies it all-or-nothing and never writes partial results.
  const CONTAINMENT_MIGRATIONS = { "花川戸": "asakusa", "花川戶": "asakusa", "雷門": "asakusa", "神南": "shibuya" };
  function containmentMigration(places, catalog) {
    const list = Array.isArray(places) ? places : [];
    const changes = [], blocked = [];
    for (const place of list) {
      const current = values(place);
      for (const tag of current) {
        const target = CONTAINMENT_MIGRATIONS[plainKey(tag)] || CONTAINMENT_MIGRATIONS[String(tag).normalize("NFKC").trim()];
        if (!target) continue;
        const hits = travelAreaHits(place, catalog);
        const hit = hits.find((item) => item.travelAreaKey === target);
        if (!hit) { blocked.push({ place, tag, reason: "containment-failed" }); continue; }
        if (hits.length > 1) { blocked.push({ place, tag, reason: "multiple-travel-areas" }); continue; }
        const forms = areaLabelForms(hit, list);
        if (forms.length > 1) { blocked.push({ place, tag, reason: "ambiguous-canonical-label" }); continue; }
        const label = forms[0] || hit.travelAreaZh;
        if (!label) { blocked.push({ place, tag, reason: "missing-canonical-label" }); continue; }
        changes.push({ place, tag, label, travelAreaKey: hit.travelAreaKey,
          before: current, after: normalize(current.map((value) => (value === tag ? label : value))) });
      }
    }
    return { changes, blocked };
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
  const api = { key, normalize, values, matches, tripTags, addressSuggestions, suggestions, cleanPlace, comparison, preferredLabel, queryMatches,
    travelAreaHits, areaLabel, containmentMigration, CONTAINMENT_MIGRATIONS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AreaTags = api;
})(globalThis);
