# Tokyo Travel Area geometry snapshot

© OpenStreetMap contributors. [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), [attribution](https://www.openstreetmap.org/copyright).

Original source-overpass.json is preserved unchanged. source-audit-additions.json adds eight exact administrative relations through Overpass on 2026-09-09. Both raw inputs, source timestamps and SHA-256 are retained in tokyo-v1.json. Every mapped feature retains source relation ID, URL, original tags and semanticEvidence links to official tourism / municipal sources.

[mapping-audit.json](mapping-audit.json) is the finite 61-entry audit manifest. [Complete audit and limitations](../../documentation/travel-area-geometry-audit.md) lists all mappings. 13 areas have verified core components; 48 have no geometry. Internal town names are never separate user-facing filters or map labels. Coverage is partial verified core, not an official tourism perimeter.

## Reproduce without network

Run: python scripts/build-area-geometry.py data/area-geometry/source-overpass.json

The builder also reads source-audit-additions.json and mapping-audit.json. It joins only shared source endpoints, checks closed rings, exact names, whitelisted IDs, admin level 9 and Tokyo coordinates, and rejects unreviewed inner rings. No simplification, union, fabricated edge, hull or envelope.

Additional source query (out body geom retains original way members):

```
[out:json][timeout:60];relation[boundary=administrative][name~"^(恵比寿南|猿楽町|歌舞伎町|上野公園|宇田川町|道玄坂|円山町|南池袋)$"](35.55,139.55,35.85,139.90);out body geom;
```

The browser loads the versioned same-origin static file once, independently of markers. Unknown key / mismatched local name / absent or failed geometry draws no boundary. Stale responses cannot replace a newer area; All clears every layer and label. No production request goes to Overpass or Nominatim.
