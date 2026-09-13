(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports
    ? require('./canonical-travel-catalog.js').catalog : root.CanonicalTravelCatalog.catalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlanningGeography = api;
})(globalThis, function (catalog) {
  'use strict';
  // Only identities present in the Phase A catalog. Missing proposed children are
  // deliberately omitted; this taxonomy never creates identities or resolver rules.
  const groups = [
    { key: 'shibuya-harajuku-ebisu', label: '澀谷・原宿・惠比壽', children: ['shibuya', 'harajuku', 'omotesando', 'ebisu', 'daikanyama', 'yoyogi-park'] },
    { key: 'ginza-tsukiji-tokyo-station', label: '銀座・築地・東京車站', children: ['ginza', 'tsukiji', 'marunouchi-otemachi'] },
    { key: 'ueno-asakusa-akihabara', label: '上野・淺草・秋葉原', children: ['ueno', 'asakusa'] },
    { key: 'roppongi-akasaka-azabu', label: '六本木・赤坂・麻布', children: ['azabujuban', 'tokyo-tower', 'shiba-park'] },
    { key: 'ikebukuro-otsuka', label: '池袋・大塚', children: ['ikebukuro', 'otsuka'] },
    { key: 'odaiba-toyosu', label: '台場・豐洲', children: ['toyosu'] },
  ].map(group => Object.freeze({ ...group, countryCode: 'JP', destinationKey: 'tokyo', children: Object.freeze(group.children) }));
  Object.freeze(groups);

  function validateTaxonomy(areas = catalog, taxonomy = groups) {
    const seen = new Set(), parents = new Set();
    for (const group of taxonomy) {
      if (!group.key || parents.has(group.key)) throw new Error(`INVALID_PLANNING_GROUP:${group.key}`);
      parents.add(group.key);
      for (const key of group.children) {
        const area = Object.hasOwn(areas, key) && areas[key];
        if (!area || seen.has(key) || area.countryCode !== group.countryCode || area.destinationKey !== group.destinationKey) {
          throw new Error(`INVALID_PLANNING_CHILD:${key}`);
        }
        seen.add(key);
      }
    }
    return true;
  }
  validateTaxonomy();
  const parentByArea = new Map(groups.flatMap(group => group.children.map(key => [key, group])));
  const normalizeLabel = value => String(value ?? '').normalize('NFC').trim().replace(/\s+/gu, ' ');
  function formatCanonicalArea(area) {
    const zh = normalizeLabel(area?.travelAreaZh), local = normalizeLabel(area?.travelAreaLocal);
    return zh && local && zh !== local ? `${zh}（${local}）` : zh || local;
  }
  function canonicalArea(key) {
    return typeof key === 'string' && Object.hasOwn(catalog, key) ? catalog[key] : null;
  }
  // Explicit stable comparator, independent of object/evidence order. The reviewed
  // Ebisu pair has a fixed display order; all remaining keys use code-point order.
  function compareCandidateKeys(a, b) {
    const rank = key => key === 'ebisu' ? 0 : key === 'daikanyama' ? 1 : 2;
    return rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0);
  }
  function candidateKeys(values) {
    if (!Array.isArray(values) || Array.from(values).some(key => !canonicalArea(key))
      || new Set(values).size !== values.length) throw new Error('INVALID_CANONICAL_CANDIDATES');
    const keys = [...values].sort(compareCandidateKeys);
    if (keys.length < 2) throw new Error('INVALID_CANONICAL_CANDIDATES');
    return keys;
  }
  function isAmbiguous(place) {
    if (place?.travelAreaResolutionStatus !== 'ambiguous') return false;
    candidateKeys(place.travelAreaCandidateKeys);
    if (place.travelAreaKey !== '' || place.travelAreaZh !== '' || place.travelAreaLocal !== ''
      || place.travelAreaResolved !== false || place.travelAreaManuallySet !== false
      || place.travelAreaSource !== 'automatic' || Number(place.travelAreaResolutionVersion) < 5
      || !Number.isFinite(Number(place.travelAreaResolutionVersion)) || place.travelAreaResolutionError) {
      throw new Error('INVALID_CANONICAL_AMBIGUITY');
    }
    return true;
  }
  function normalizePlace(place) {
    if (!place || typeof place !== 'object') return place;
    let next = place;
    if (isAmbiguous(place)) next = { ...place, travelAreaCandidateKeys: candidateKeys(place.travelAreaCandidateKeys) };
    else if (Object.hasOwn(place, 'travelAreaCandidateKeys')) {
      if (!Array.isArray(place.travelAreaCandidateKeys) || place.travelAreaCandidateKeys.length) throw new Error('INVALID_CANONICAL_SPLIT_BRAIN');
      next = { ...place }; delete next.travelAreaCandidateKeys;
    }
    if (place.autoTravelArea && typeof place.autoTravelArea === 'object') {
      if (Object.hasOwn(place.autoTravelArea, 'autoTravelArea')) throw new Error('INVALID_AUTO_SNAPSHOT');
      const auto = normalizePlace(place.autoTravelArea);
      if (auto !== place.autoTravelArea) next = { ...next, autoTravelArea: auto };
    }
    return next;
  }
  function ambiguousAreaFields(keys, resolver = 'EXACT_GEOGRAPHIC_TIE') {
    return {
      travelAreaKey: '', travelAreaZh: '', travelAreaLocal: '',
      travelAreaCandidateKeys: candidateKeys(keys), travelAreaResolved: false,
      travelAreaManuallySet: false, travelAreaSource: 'automatic',
      travelAreaResolver: resolver, travelAreaResolutionVersion: 5,
      travelAreaResolutionStatus: 'ambiguous',
    };
  }
  const automaticFields = ['travelAreaKey', 'travelAreaZh', 'travelAreaLocal', 'travelAreaCandidateKeys',
    'travelAreaResolved', 'travelAreaManuallySet', 'travelAreaSource', 'travelAreaResolver',
    'travelAreaResolutionVersion', 'travelAreaResolutionStatus', 'travelAreaResolutionError'];
  function automaticSnapshot(place) {
    const normalized = normalizePlace(place);
    const result = Object.fromEntries(automaticFields.filter(key => Object.hasOwn(normalized, key)).map(key => [key, Array.isArray(normalized[key]) ? [...normalized[key]] : normalized[key]]));
    return normalizePlace({ ...result, travelAreaManuallySet: false, travelAreaSource: 'automatic' });
  }
  function restoreAutomaticFields(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('INVALID_AUTO_SNAPSHOT');
    const normalized = normalizePlace(snapshot);
    if (!isAmbiguous(normalized) && (!canonicalArea(normalized.travelAreaKey)
      || normalized.travelAreaResolved !== true || !normalized.travelAreaZh || !normalized.travelAreaLocal
      || (normalized.travelAreaResolutionStatus && normalized.travelAreaResolutionStatus !== 'resolved')
      || !Number.isFinite(Number(normalized.travelAreaResolutionVersion)) || Number(normalized.travelAreaResolutionVersion) < 5
      || normalized.travelAreaManuallySet === true || normalized.travelAreaSource !== 'automatic'
      || normalized.travelAreaResolutionError)) throw new Error('INVALID_AUTO_SNAPSHOT');
    const auto = automaticSnapshot(normalized);
    return { ...auto, travelAreaResolutionStatus: auto.travelAreaResolutionStatus || 'resolved', autoTravelArea: auto };
  }
  function mergeAreaFields(place, fields) {
    const next = { ...place, ...fields };
    if (!Object.hasOwn(fields, 'travelAreaCandidateKeys')) delete next.travelAreaCandidateKeys;
    if (fields.travelAreaResolutionStatus === 'ambiguous') delete next.travelAreaResolutionError;
    return normalizePlace(next);
  }
  /**
   * @typedef {Object} NormalizedPlanningGeography
   * @property {'resolved'|'ambiguous'} status Valid terminal geography state.
   * @property {'automatic'|'manual'} source
   * @property {string[]} areaKeys Singular identity or deterministic automatic candidates.
   * @property {string|null} primaryAreaKey Null for ambiguity.
   * @property {string|null} planningGroupKey
   * @property {string|null} destinationKey
   * @property {number|null} latitude Original Place coordinate, never a centroid.
   * @property {number|null} longitude Original Place coordinate, never a centroid.
   * @property {string[]} areaDisplayLabels
   * @property {string} sectionKey group:<key>, area:<key> or candidates:<keys>
   * @property {string} sectionLabel
   */
  /** @returns {NormalizedPlanningGeography|null} null for pre-existing noncatalog/unresolved records; no inferred identity or persisted state. */
  function getPlacePlanningGeography(place) {
    const normalized = normalizePlace(place);
    if (isAmbiguous(normalized)) {
      const keys = normalized.travelAreaCandidateKeys, areas = keys.map(canonicalArea);
      const parents = keys.map(key => parentByArea.get(key));
      const group = parents[0] && parents.every(parent => parent === parents[0]) ? parents[0] : null;
      const labels = areas.map(formatCanonicalArea);
      return {
        status: 'ambiguous', source: 'automatic', areaKeys: keys, primaryAreaKey: null,
        planningGroupKey: group?.key || null,
        destinationKey: areas.every(area => area.destinationKey === areas[0].destinationKey) ? areas[0].destinationKey || null : null,
        latitude: Number.isFinite(place.latitude) ? place.latitude : null,
        longitude: Number.isFinite(place.longitude) ? place.longitude : null,
        areaDisplayLabels: labels, sectionKey: group ? `group:${group.key}` : `candidates:${keys.join('|')}`,
        sectionLabel: group?.label || labels.join(' / '),
      };
    }
    const area = canonicalArea(place?.travelAreaKey);
    if (!area) return null;
    const group = parentByArea.get(area.travelAreaKey), label = formatCanonicalArea(area);
    return {
      status: 'resolved',
      source: place.travelAreaManuallySet === true || place.travelAreaSource === 'manual' ? 'manual' : 'automatic',
      areaKeys: [area.travelAreaKey], primaryAreaKey: area.travelAreaKey,
      planningGroupKey: group?.key || null, destinationKey: area.destinationKey || null,
      latitude: Number.isFinite(place.latitude) ? place.latitude : null,
      longitude: Number.isFinite(place.longitude) ? place.longitude : null,
      areaDisplayLabels: [label],
      sectionKey: group ? `group:${group.key}` : `area:${area.travelAreaKey}`,
      sectionLabel: group?.label || label,
    };
  }
  function manualAreaFields(key) {
    const area = canonicalArea(key);
    if (!area) throw new Error('INVALID_CANONICAL_KEY');
    return {
      travelAreaKey: key, travelAreaZh: area.travelAreaZh, travelAreaLocal: area.travelAreaLocal,
      travelAreaManuallySet: true, travelAreaSource: 'manual', travelAreaResolver: 'MANUAL',
      travelAreaResolved: true, travelAreaResolutionVersion: 5,
      travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
    };
  }
  return { groups, validateTaxonomy, canonicalArea, formatCanonicalArea, getPlacePlanningGeography, manualAreaFields,
    compareCandidateKeys, candidateKeys, isAmbiguous, normalizePlace, ambiguousAreaFields, automaticSnapshot, restoreAutomaticFields, mergeAreaFields };
});
