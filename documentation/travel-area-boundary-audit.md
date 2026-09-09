# Travel Area boundary audit — 2026-09-10

Baseline `00a4a52`: **61/61 audited**. Two remaining pairs split to **63 final areas**; Ebisu/Daikanyama were already split in baseline. Legacy aliases are retained only in non-destructive migration.

Source totals: {'google': 0, 'official': 10, 'osm': 44, 'none': 9}

Canonical structured audit: [boundary-audit.json](../data/area-geometry/boundary-audit.json). Runtime contract and complete GeoJSON: [travel-area-boundaries.json](../data/area-geometry/travel-area-boundaries.json). Every record includes user-facing assessment, composite flag, Google availability, authoritative alternative, OSM evidence, component IDs, final source, union status, drawable flag, confidence and limitations.

## Google capability decision

[Coverage](https://developers.google.com/maps/documentation/javascript/dds-boundaries/coverage); [Feature types](https://developers.google.com/maps/documentation/javascript/reference/data-driven-styling); [Places/Geocoding](https://developers.google.com/maps/documentation/javascript/dds-boundaries/dds-use-maps-places-apis). Places/Geocoding location and viewport are not polygon exports. DDS supports JP/FR administrative/locality types and US administrative/locality types; KR has country coverage only. DDS has no neighborhood/landmark/park feature type. Supported type does not verify a specific area feature. This app has no configured DDS vector map ID or reviewed feature-specific Place IDs, so **zero Google boundaries are selected**. Administrative candidates remain explicitly unverified for DDS; verified static official/OSM sources work on both map providers. No consumer Maps page, screenshot tracing or proprietary polygon extraction used.

## Source priority and licensing

US Census exact GEOID polygons take precedence over OSM. Japanese N03/GSI/e-Stat administrative products exist, but direct redistribution/processing qualification is not established here; use verified reusable OSM/ODbL snapshots instead. They are marked available candidates, not falsely reported absent. Seoul official data and French official administrative data are alternatives; the selected OSM snapshots have independently reviewed administrative identity. Travel-circle names never prove administrative equivalence.

[OSM license](https://www.openstreetmap.org/copyright). The OSM-derived geometry and raw sources are offered under ODbL; [Census quality guidelines](https://www.census.gov/about/policies/quality/guidelines.html). Source URLs, tags, stable IDs and SHA-256 snapshots are retained. Geometry processing: Shapely/GEOS unary_union; no simplification, snapping, buffer, repair, hull or hand-built bridge.

## Complete final catalog

| Key | 中文 | Local | User-facing / composite | Google | Official alternative | Components | Final source | Union | Drawable | Confidence / limitation |
|---|---|---|---|---|---|---|---|---|---|---|
| ginza | 銀座 | 銀座 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 銀座 (4859036) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| ebisu | 惠比壽 | 恵比寿 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 恵比寿 (9521529); 恵比寿南 (9616318) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| daikanyama | 代官山 | 代官山 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 代官山町 (17022574); 猿楽町 (17022575) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| shibuya | 澀谷 | 渋谷 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 渋谷 (17022659); 神南 (17022738); 宇田川町 (17022739); 道玄坂 (17022582); 円山町 (17022583) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| asakusa | 淺草 | 浅草 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 浅草 (9046136); 花川戸 (16400401); 雷門 (18158548) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| shinjuku | 新宿 | 新宿 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 新宿 (17081654); 西新宿 (17081666); 歌舞伎町 (17081657) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| otsuka | 大塚 | 大塚 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 南大塚 (18687916); 北大塚 (18687920) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| ikebukuro | 池袋 | 池袋 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 池袋 (4869702); 西池袋 (18672896); 東池袋 (18672902); 南池袋 (3047806) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| toyosu | 豐洲 | 豊洲 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 豊洲 (3789147) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| marunouchi-otemachi | 丸之內／大手町 | 丸の内／大手町 | reasonable / composite retained (adjacent business districts) | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 丸の内 (3544394); 大手町 (3545196) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| tsukiji | 築地 | 築地 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 築地 (16170475) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| azabujuban | 麻布十番 | 麻布十番 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 麻布十番 (3562067) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| ueno | 上野 | 上野 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 上野 (18158684); 上野公園 (18158889) | osm | verified | yes | high-source-medium-travel-coverage; Verified core coverage is partial; union is not an official tourism perimeter. |
| tokyo-tower | 東京鐵塔 | 東京タワー | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Landmark-based Travel Area. OSM relation 4247312 is the tower structure, not a tourism district. No buffer or building footprint substituted. |
| shiba-park | 芝公園 | 芝公園 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | 芝公園 (30520683); 芝公園 (745301114); 芝公園 (745301116); 芝公園 (745301120) | osm | verified | yes | high-source-medium-travel-coverage; Verified Shiba Park parcels, not the entire Shibakoen town and not a Tokyo Tower travel boundary; separated parcels stay separate. |
| harajuku | 原宿 | 原宿 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Official tourism guide describes a travel circle; OSM has station/place nodes and station site 7755206. Whole Jingumae or Sendagaya does not define Harajuku. |
| omotesando | 表參道 | 表参道 | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Official guide describes a shopping street and surrounding circle. OSM Q1205090 ways are roads and Q1326733 nodes are stations; neither is an area polygon. |
| nerima | 練馬 | 練馬 | scope-uncertain / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Resolver merges Kasugacho with Nerima; station/town/ward meaning is ambiguous. Verified Nerima ward candidate is too broad until the user-facing scope is defined. |
| kamakura | 鎌倉 | 鎌倉 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 鎌倉市 (2689445) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| fujisawa | 藤澤 | 藤沢 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 藤沢市 (2689443) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| myeongdong | 明洞 | 명동 | reasonable / independent | country-only-no-local-boundary | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; OSM administrative Myeongdong relation 3884091 (level 8) exists, but administrative dong and shopping district are not equivalent; candidate not promoted. |
| hongdae | 弘大 | 홍대 | reasonable / independent | country-only-no-local-boundary | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; University/station-oriented travel circle; Mapo district does not define Hongdae. No independently verified tourism perimeter. |
| itaewon | 梨泰院 | 이태원 | reasonable / independent | country-only-no-local-boundary | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Travel circle can cross Itaewon dong boundaries. No verified component coverage definition; Yongsan district is not a substitute. |
| gangnam | 江南 | 강남 | scope-uncertain / independent | country-only-no-local-boundary | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; Named tourism circle versus entire Gangnam-gu is ambiguous. OSM 2410520 level 6 is the whole district, not accepted as the travel circle. |
| montmartre | 蒙馬特 | Montmartre | reasonable / independent | no-matching-feature-type | no-verified-equivalent-tourism-polygon | none | none | not-applicable | no | unverified; OSM 6438767 is a site relation, plus place nodes. Paris 18th arrondissement and Clignancourt are not the same tourism circle. |
| chiyoda | 千代田 | 千代田 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 千代田区 (1761742) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| chuo | 中央 | 中央 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 中央区 (1758897) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| minato | 港 | 港 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 港区 (1761717) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| bunkyo | 文京 | 文京 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 文京区 (1758878) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| taito | 台東 | 台東 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 台東区 (1758888) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| sumida | 墨田 | 墨田 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 墨田区 (1758891) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| koto | 江東 | 江東 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 江東区 (3554015) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| shinagawa | 品川 | 品川 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 品川区 (3554304) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| meguro | 目黑 | 目黒 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 目黒区 (1758936) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| ota | 大田 | 大田 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 大田区 (1758947) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| setagaya | 世田谷 | 世田谷 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 世田谷区 (1759474) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| nakano | 中野 | 中野 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 中野区 (1543056) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| suginami | 杉並 | 杉並 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 杉並区 (1543055) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| toshima | 豐島 | 豊島 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 豊島区 (1759506) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| kita | 北 | 北 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 北区 (1760038) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| arakawa | 荒川 | 荒川 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 荒川区 (1760040) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| itabashi | 板橋 | 板橋 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 板橋区 (1760078) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| adachi | 足立 | 足立 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 足立区 (1760124) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| katsushika | 葛飾 | 葛飾 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 葛飾区 (1761718) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| edogawa | 江戶川 | 江戸川 | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | 江戸川区 (1761743) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| jongno | 鐘路 | 종로 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 종로구 (2419946) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| jung | 中 | 중 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 중구 (2419947) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| yongsan | 龍山 | 용산 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 용산구 (2419955) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| mapo | 麻浦 | 마포 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 마포구 (2419949) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| dongdaemun | 東大門 | 동대문 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 동대문구 (2419941) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| seocho | 瑞草 | 서초 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 서초구 (2414779) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| songpa | 松坡 | 송파 | reasonable / independent | country-only-no-local-boundary | available-administrative-candidate-not-selected | 송파구 (2419954) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| brooklyn | 布魯克林 | Brooklyn | reasonable / independent | supported-type-feature-unverified | verified-selected | Kings County (36047) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| manhattan | 曼哈頓 | Manhattan | reasonable / independent | supported-type-feature-unverified | verified-selected | New York County (36061) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| queens | 皇后區 | Queens | reasonable / independent | supported-type-feature-unverified | verified-selected | Queens County (36081) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| bronx | 布朗克斯 | Bronx | reasonable / independent | supported-type-feature-unverified | verified-selected | Bronx County (36005) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| staten-island | 史泰登島 | Staten Island | reasonable / independent | supported-type-feature-unverified | verified-selected | Richmond County (36085) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| paris | 巴黎 | Paris | reasonable / independent | supported-type-feature-unverified | available-administrative-candidate-not-selected | Paris (7444) | osm | verified | yes | high-administrative-scope; Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core. |
| new-york | 紐約 | New York | reasonable / independent | supported-type-feature-unverified | verified-selected | New York city (3651000) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| los-angeles | 洛杉磯 | Los Angeles | reasonable / independent | supported-type-feature-unverified | verified-selected | Los Angeles city (0644000) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| san-francisco | 舊金山 | San Francisco | reasonable / independent | supported-type-feature-unverified | verified-selected | San Francisco city (0667000) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| chicago | 芝加哥 | Chicago | reasonable / independent | supported-type-feature-unverified | verified-selected | Chicago city (1714000) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |
| boston | 波士頓 | Boston | reasonable / independent | supported-type-feature-unverified | verified-selected | Boston city (2507000) | official | verified | yes | high-administrative-scope; Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core. |

## Baseline 61-entry gate

| Baseline key | Final keys | Audit status |
|---|---|---|
| ginza | ginza | audited |
| ebisu | ebisu | audited |
| daikanyama | daikanyama | audited |
| shibuya | shibuya | audited |
| asakusa | asakusa | audited |
| shinjuku | shinjuku | audited |
| otsuka | otsuka | audited |
| ikebukuro | ikebukuro | audited |
| toyosu | toyosu | audited |
| marunouchi-otemachi | marunouchi-otemachi | audited |
| tsukiji | tsukiji | audited |
| azabujuban | azabujuban | audited |
| ueno | ueno | audited |
| tokyo-tower-shiba | tokyo-tower, shiba-park | composite-split |
| harajuku-omotesando | harajuku, omotesando | composite-split |
| nerima | nerima | audited |
| kamakura | kamakura | audited |
| fujisawa | fujisawa | audited |
| myeongdong | myeongdong | audited |
| hongdae | hongdae | audited |
| itaewon | itaewon | audited |
| gangnam | gangnam | audited |
| montmartre | montmartre | audited |
| chiyoda | chiyoda | audited |
| chuo | chuo | audited |
| minato | minato | audited |
| bunkyo | bunkyo | audited |
| taito | taito | audited |
| sumida | sumida | audited |
| koto | koto | audited |
| shinagawa | shinagawa | audited |
| meguro | meguro | audited |
| ota | ota | audited |
| setagaya | setagaya | audited |
| nakano | nakano | audited |
| suginami | suginami | audited |
| toshima | toshima | audited |
| kita | kita | audited |
| arakawa | arakawa | audited |
| itabashi | itabashi | audited |
| adachi | adachi | audited |
| katsushika | katsushika | audited |
| edogawa | edogawa | audited |
| jongno | jongno | audited |
| jung | jung | audited |
| yongsan | yongsan | audited |
| mapo | mapo | audited |
| dongdaemun | dongdaemun | audited |
| seocho | seocho | audited |
| songpa | songpa | audited |
| brooklyn | brooklyn | audited |
| manhattan | manhattan | audited |
| queens | queens | audited |
| bronx | bronx | audited |
| staten-island | staten-island | audited |
| paris | paris | audited |
| new-york | new-york | audited |
| los-angeles | los-angeles | audited |
| san-francisco | san-francisco | audited |
| chicago | chicago | audited |
| boston | boston | audited |

## Migration and acceptance

Production private inventory is not accessible without authorized authentication: actual converted/unresolved counts are **unknown**, not zero. Resolver uses stored area evidence, address components/address, then verified final geometry containment. Boundary points and unresolved/conflicting evidence preserve the original record. GET conversion does not persist; normal authorized save does. Place ID, names, address, coordinates, photos and Google Maps identity are unchanged. Unresolved composite values display as 地區待確認, never a slash-combined filter.

Select each of the six split areas in a trip containing those places. Shinjuku/Shibuya should show only union exteriors; Shiba Park can have genuinely separate parcels. Tower/Harajuku/Omotesando can have filters without a boundary. Select All to clear; rapidly A → B → C, then fullscreen/List/Map. Verify markers and gestures remain available and attribution matches the selected source. Full catalog coverage and topology are automated; no need to manually identify each town component.
