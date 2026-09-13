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
  /**
   * @typedef {Object} ResolvedPlanningGeography
   * @property {'resolved'} status Discriminant reserved for future contract variants.
   * @property {'automatic'|'manual'} source
   * @property {string[]} areaKeys One identity in Phase B.
   * @property {string} primaryAreaKey
   * @property {string|null} planningGroupKey
   * @property {string|null} destinationKey
   * @property {number|null} latitude Original Place coordinate, never a centroid.
   * @property {number|null} longitude Original Place coordinate, never a centroid.
   * @property {string[]} areaDisplayLabels
   * @property {string} sectionKey group:<key> or area:<key>
   * @property {string} sectionLabel
   */
  /** @returns {ResolvedPlanningGeography|null} null for pre-existing noncatalog/unresolved records; no inferred identity or persisted state. */
  function getPlacePlanningGeography(place) {
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
  return { groups, validateTaxonomy, canonicalArea, formatCanonicalArea, getPlacePlanningGeography, manualAreaFields };
});
