# Tokyo Travel Area geometry snapshot

© OpenStreetMap contributors. Geometry and source snapshot are available under
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
[Attribution / copyright](https://www.openstreetmap.org/copyright).

Downloaded once through https://overpass-api.de/api/interpreter on 2026-09-09.
`tokyo-v1.json` retains the OSM database timestamp, raw snapshot SHA-256,
exact OSM relation IDs, source URLs, names and original source tags.
`source-overpass.json` is the original response, including the unused same-name
Niijuku relation (18088194), which is deliberately not mapped to Shinjuku.

No production request goes to Overpass or Nominatim. The browser loads the
versioned same-origin static JSON lazily, independently of markers, and caches
that promise. Unknown keys, wrong local names/country, absent polygons and failed
loads produce no boundary. A page reload permits retry after a failed load.

## Reviewed mapping

| Travel Area | OSM source components (relation IDs) |
| --- | --- |
| 銀座 | 銀座 4859036 |
| 惠比壽／代官山 | 恵比寿 9521529; 恵比寿西 17008303; 代官山町 17022574 |
| 澀谷 | 渋谷 17022659; 神南 17022738; 神宮前 17054296; 富ヶ谷 17054730 |
| 淺草 | 浅草 9046136; 花川戸 16400401; 雷門 18158548 |
| 新宿 | 新宿 17081654; 西新宿 17081666; 代々木 17054674 |
| 大塚 | 南大塚 18687916; 北大塚 18687920 |
| 池袋 | 池袋 4869702; 西池袋 18672896; 東池袋 18672902 |
| 豐洲 | 豊洲 3789147 |
| 丸之內／大手町 | 丸の内 3544394; 大手町 3545196 |
| 築地 | 築地 16170475 |
| 麻布十番 | 麻布十番 3562067 |
| 上野 | 上野 18158684 |

These are OSM-mapped named town boundaries (admin_level=9), not a claim that an
informal travel neighborhood has an official encompassing perimeter. Components
follow the existing Travel Area names/aliases; the resolver itself is unchanged.
Multiple source components remain separate features. No convex hull, envelope,
circle, interpolation, simplification, union, or fabricated edge is generated.
Other areas have no included geometry, rather than a guessed boundary.

## Reproduction

Run from project root:

```
python scripts/build-area-geometry.py data/area-geometry/source-overpass.json
```

The builder joins only shared endpoints of source outer ways, checks closed
rings, exact names, whitelisted relation IDs, administrative level and Tokyo
coordinates, and rejects unreviewed inner rings. Source members are retained
in the snapshot for auditing. It makes no network request.

Snapshot query used `nwr[boundary]` with an exact allowlist of local names inside
35.55,139.55,35.85,139.90 and `out body geom`. Raw payload and build script are the
authoritative reproducibility inputs; do not refresh boundaries during render.
