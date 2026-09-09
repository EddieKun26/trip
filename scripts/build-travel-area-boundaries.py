"""Offline audited contract. Requires Shapely 2.1.2. No hull, buffer, snapping or repair.
Raw OSM geometry remains ODbL; Census geometry remains public domain.
"""
import json, hashlib
from pathlib import Path
import shapely
from shapely.geometry import Polygon, MultiPolygon, shape, mapping
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/area-geometry'
def read(name): return json.loads((DATA/name).read_text(encoding='utf8'))
def digest(name): return hashlib.sha256((DATA/name).read_bytes()).hexdigest()
def write(path,value): path.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')

def union_geometry(geometries):
    parts=[shape(g) for g in geometries]
    assert parts and all(p.geom_type in ('Polygon','MultiPolygon') and p.is_valid and not p.is_empty for p in parts), 'Invalid source polygon'
    result=unary_union(parts)
    assert result.is_valid and not result.is_empty and result.geom_type in ('Polygon','MultiPolygon')
    assert all(p.difference(result).area < 1e-14 for p in parts), 'Union lost coverage'
    return result

def join_rings(parts):
    rings=[]
    while parts:
        ring=parts.pop(0)
        while ring[-1]!=ring[0]:
            for i,p in enumerate(parts):
                if ring[-1]==p[0]: ring+=p[1:];parts.pop(i);break
                if ring[-1]==p[-1]: ring+=p[-2::-1];parts.pop(i);break
            else:raise ValueError('Open source ring; do not fabricate an edge')
        assert len(ring)>=4
        rings.append(ring)
    return rings

def osm_geometry(filename,osm_type,osm_id):
    elements=read(filename)['elements']; nodes={e['id']:[e['lon'],e['lat']] for e in elements if e['type']=='node'}
    ways={e['id']:e for e in elements if e['type']=='way'}
    source=next(e for e in elements if e['type']==osm_type and e['id']==osm_id)
    if osm_type=='way':
        ring=[nodes[n] for n in source['nodes']]
        assert ring[0]==ring[-1]
        return mapping(Polygon(ring)),source['tags']
    parts={'outer':[],'inner':[]}
    for member in source['members']:
        if member['role'] not in parts:continue
        assert member['type']=='way','Nested polygon member requires manual review'
        parts[member['role']].append([nodes[n] for n in ways[member['ref']]['nodes']])
    outers=join_rings(parts['outer']); inners=join_rings(parts['inner'])
    holes=[[] for _ in outers]
    for ring in inners:
        owners=[i for i,outer in enumerate(outers) if Polygon(outer).covers(Polygon(ring))]
        assert len(owners)==1,'Unassigned source hole'
        holes[owners[0]].append(ring)
    return mapping(MultiPolygon([Polygon(ring,holes[i]) for i,ring in enumerate(outers)])),source['tags']

SPLITS={'tokyo-tower-shiba':['tokyo-tower','shiba-park'],'harajuku-omotesando':['harajuku','omotesando']}
NEW={'tokyo-tower':('東京鐵塔','東京タワー'),'shiba-park':('芝公園','芝公園'),'harajuku':('原宿','原宿'),'omotesando':('表參道','表参道')}
JP_ADMIN={'chiyoda':('千代田区','131016'),'chuo':('中央区','131024'),'minato':('港区','131032'),'bunkyo':('文京区','131059'),'taito':('台東区','131067'),'sumida':('墨田区','131075'),'koto':('江東区','131083'),'shinagawa':('品川区','131091'),'meguro':('目黒区','131105'),'ota':('大田区','131113'),'setagaya':('世田谷区','131121'),'nakano':('中野区','131148'),'suginami':('杉並区','131156'),'toshima':('豊島区','131164'),'kita':('北区','131172'),'arakawa':('荒川区','131181'),'itabashi':('板橋区','131199'),'adachi':('足立区','131211'),'katsushika':('葛飾区','131229'),'edogawa':('江戸川区','131237'),'kamakura':('鎌倉市','142042'),'fujisawa':('藤沢市','142051')}
KR_ADMIN={'jongno':(2419946,'종로구'),'jung':(2419947,'중구'),'yongsan':(2419955,'용산구'),'mapo':(2419949,'마포구'),'dongdaemun':(2419941,'동대문구'),'seocho':(2414779,'서초구'),'songpa':(2419954,'송파구')}
US={'brooklyn':('36047','Kings County'),'manhattan':('36061','New York County'),'queens':('36081','Queens County'),'bronx':('36005','Bronx County'),'staten-island':('36085','Richmond County'),'new-york':('3651000','New York city'),'los-angeles':('0644000','Los Angeles city'),'san-francisco':('0667000','San Francisco city'),'chicago':('1714000','Chicago city'),'boston':('2507000','Boston city')}
KR_NAMED={'myeongdong','hongdae','itaewon','gangnam'}
NONE_NOTES={
 'tokyo-tower':'Landmark-based Travel Area. OSM relation 4247312 is the tower structure, not a tourism district. No buffer or building footprint substituted.',
 'harajuku':'Official tourism guide describes a travel circle; OSM has station/place nodes and station site 7755206. Whole Jingumae or Sendagaya does not define Harajuku.',
 'omotesando':'Official guide describes a shopping street and surrounding circle. OSM Q1205090 ways are roads and Q1326733 nodes are stations; neither is an area polygon.',
 'nerima':'Resolver merges Kasugacho with Nerima; station/town/ward meaning is ambiguous. Verified Nerima ward candidate is too broad until the user-facing scope is defined.',
 'myeongdong':'OSM administrative Myeongdong relation 3884091 (level 8) exists, but administrative dong and shopping district are not equivalent; candidate not promoted.',
 'hongdae':'University/station-oriented travel circle; Mapo district does not define Hongdae. No independently verified tourism perimeter.',
 'itaewon':'Travel circle can cross Itaewon dong boundaries. No verified component coverage definition; Yongsan district is not a substitute.',
 'gangnam':'Named tourism circle versus entire Gangnam-gu is ambiguous. OSM 2410520 level 6 is the whole district, not accepted as the travel circle.',
 'montmartre':'OSM 6438767 is a site relation, plus place nodes. Paris 18th arrondissement and Clignancourt are not the same tourism circle.',
}
GOOGLE='https://developers.google.com/maps/documentation/javascript/dds-boundaries/coverage'
GOOGLE_TYPES='https://developers.google.com/maps/documentation/javascript/reference/data-driven-styling'
GOOGLE_PLACES='https://developers.google.com/maps/documentation/javascript/dds-boundaries/dds-use-maps-places-apis'
OFFICIAL_JP='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html'
OFFICIAL_TOWNS='https://www.e-stat.go.jp/gis/statmap-search?aggregateUnitForBoundary=A&page=1&type=2'
OSM_CREDIT={'text':'© OpenStreetMap contributors · ODbL','url':'https://www.openstreetmap.org/copyright','license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/'}
CENSUS_CREDIT={'text':'U.S. Census Bureau · TIGERweb ACS 2026','url':'https://tigerweb.geo.census.gov/','license':'public-domain-US-government'}

def build():
    old=read('mapping-audit.json')['areas']; cores=read('tokyo-v1.json')['areas']; reviewed=read('reviewed-admin.json')
    assert len(old)==61
    definitions=[]
    for entry in old:
        if entry['travelAreaKey'] in SPLITS:
            for key in SPLITS[entry['travelAreaKey']]:
                zh,local=NEW[key];definitions.append({'travelAreaKey':key,'travelAreaZh':zh,'travelAreaLocal':local,'geometryComponents':[]})
        else: definitions.append(entry)
    result={'version':'20260910.1','auditedAt':'2026-09-10','sourceRetrievedAt':'2026-09-09','baseline':'00a4a525f21c0919f18d5f2319e0b0fe11b53c29','baselineCount':61,'finalCount':63,'engine':f'Shapely {shapely.__version__} / GEOS {shapely.geos_version_string}',
      'policy':'True offline union; runtime renders exterior rings only. Unknown/unverified means no boundary.',
      'baselineMapping':[{'travelAreaKey':e['travelAreaKey'],'finalKeys':SPLITS.get(e['travelAreaKey'],[e['travelAreaKey']]),'status':'composite-split' if e['travelAreaKey'] in SPLITS else 'audited'} for e in old],
      'legacySplits':{'ebisu-daikanyama':['ebisu','daikanyama'],**SPLITS},'areas':{}}
    audit_rows=[]
    for definition in definitions:
        key=definition['travelAreaKey']; country='KR' if key in KR_ADMIN or key in KR_NAMED else 'US' if key in US else 'FR' if key in ['paris','montmartre'] else 'JP'
        admin=key in JP_ADMIN or key in KR_ADMIN or key in US or key=='paris'
        entry={k:definition[k] for k in ['travelAreaKey','travelAreaZh','travelAreaLocal']}
        entry.update(countryCode=country,userFacingReasonable=key not in ['nerima','gangnam'],userFacingAssessment='Existing explicit municipality/ward/borough fallback; boundary means the full administrative scope.' if admin else 'Independent travel circle; internal towns do not become selectable areas.',compositeName='／' in definition['travelAreaZh'],sourceType='none',geometryComponents=[],finalGeometry=None,drawable=False,confidence='unverified',limitation=NONE_NOTES.get(key,'Verified core coverage is partial; union is not an official tourism perimeter.'),unionStatus='not-applicable',attribution=None)
        google_status='country-only-no-local-boundary' if country=='KR' else 'supported-type-feature-unverified' if admin else 'no-matching-feature-type'
        entry['googleBoundary']={'status':google_status,'featureTypeCandidate':('LOCALITY / ADMINISTRATIVE_AREA_LEVEL_2' if admin and country!='KR' else None),'verifiedFeature':False,'placeId':None,'reason':'Places/Geocoding supply location, Place ID and viewport, not polygon. No verified feature-specific DDS Place ID or vector map ID configured in this app.' if google_status=='supported-type-feature-unverified' else 'No neighborhood, shopping-circle, park or landmark feature type. Korea coverage is country only.' if country=='KR' else 'Travel circle is not a supported DDS feature type; a same-name administrative locality would not prove equivalence.','sources':[GOOGLE,GOOGLE_TYPES,GOOGLE_PLACES]}
        entry['alternativeAuthoritativeSource']={'status':'available-administrative-candidate-not-selected' if admin else 'no-verified-equivalent-tourism-polygon','url':OFFICIAL_JP if country=='JP' and admin else OFFICIAL_TOWNS if country=='JP' else 'https://data.seoul.go.kr/' if country=='KR' else 'https://www.data.gouv.fr/datasets/contours-administratifs' if country=='FR' else 'https://tigerweb.geo.census.gov/','limitation':'Japanese N03/GSI provides administrative geometry; direct redistribution/processing qualification was not established for this release. Selected OSM/ODbL snapshots have explicit reusable terms. Town census areas do not define travel circles.' if country=='JP' else 'Official source availability is separate from a verified area-specific geometry match.'}
        geoms=[]
        if key in cores:
            for f in cores[key]['features']:
                geoms.append(f['geometry']);entry['geometryComponents'].append(f['properties'])
            entry['sourceType']='osm';entry['attribution']=OSM_CREDIT
        elif key=='shiba-park':
            for osm_id in [30520683,745301114,745301116,745301120]:
                filename=f'source-park-{osm_id}.json';geom,tags=osm_geometry(filename,'way',osm_id)
                assert tags.get('leisure')=='park' and tags.get('name')=='芝公園'
                assert shape(geom).bounds[0]>139.74 and shape(geom).bounds[2]<139.76 and shape(geom).bounds[1]>35.64 and shape(geom).bounds[3]<35.67
                geoms.append(geom);entry['geometryComponents'].append({'osmType':'way','osmId':osm_id,'name':tags['name'],'sourceTags':tags,'sourceUrl':f'https://www.openstreetmap.org/way/{osm_id}','snapshot':filename,'sha256':digest(filename),'semanticEvidence':['https://www.tokyo-park.or.jp/park/siba/index.html','https://www.tokyo-park.or.jp/park/siba/assets/files/shiba_map.pdf']})
            entry.update(sourceType='osm',attribution=OSM_CREDIT,limitation='Verified Shiba Park parcels, not the entire Shibakoen town and not a Tokyo Tower travel boundary; separated parcels stay separate.')
        elif key in JP_ADMIN or key in KR_ADMIN or key=='paris':
            if key in JP_ADMIN:
                name,ref=JP_ADMIN[key];candidates=[e for e in reviewed if e['tags'].get('name')==name and e['tags'].get('ref')==ref and e['tags'].get('admin_level')=='7']
            elif key in KR_ADMIN:
                osm_id,name=KR_ADMIN[key];candidates=[e for e in reviewed if e['id']==osm_id and e['tags'].get('name')==name and e['tags'].get('admin_level')=='6']
            else:candidates=[e for e in reviewed if e['id']==7444 and e['tags'].get('name')=='Paris' and e['tags'].get('admin_level')=='8']
            assert len(candidates)==1,(key,'requires exact ID/administrative scope review')
            candidate=candidates[0];osm_id=candidate['id'];filename=f'source-admin-{osm_id}.json'
            geom,tags=osm_geometry(filename,'relation',osm_id)
            assert tags['name']==candidate['tags']['name'] and tags['admin_level']==candidate['tags']['admin_level']
            geoms.append(geom);entry['geometryComponents'].append({'osmType':'relation','osmId':osm_id,'name':tags['name'],'sourceTags':tags,'sourceUrl':f'https://www.openstreetmap.org/relation/{osm_id}','snapshot':filename,'sha256':digest(filename),'semanticEvidence':[entry['alternativeAuthoritativeSource']['url']],'verification':'Exact stable relation ID, administrative level, JP municipal ref / KR district identity / Paris commune code, source discovery coordinates, closed valid polygon; matches existing resolver administrative fallback.'})
            entry.update(sourceType='osm',attribution=OSM_CREDIT,limitation='Full administrative fallback extent, including source islands/water where present. Not a smaller station district or tourism core.')
        elif key in US:
            code,name=US[key];filename='source-us-boroughs.json' if len(code)==5 else 'source-us-cities.json'
            features=[f for f in read(filename)['features'] if f['properties']['GEOID']==code and f['properties']['NAME']==name]
            assert len(features)==1,(key,'Census identity mismatch')
            f=features[0];geoms.append(f['geometry']);entry['geometryComponents'].append({'name':name,'geoid':code,'sourceUrl':'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2026/MapServer/'+('82' if len(code)==5 else '28'),'snapshot':filename,'sha256':digest(filename),'sourceProperties':f['properties'],'verification':'Exact GEOID, official NAME, state/county/place code, WGS84 geometry; NYC boroughs are coterminous counties.'})
            entry.update(sourceType='official',attribution=CENSUS_CREDIT,limitation='Official administrative extent (including water/islands); NYC boroughs use their coterminous county codes. Not a walkable tourism core.')
            entry['alternativeAuthoritativeSource'].update(status='verified-selected',limitation='Exact official GEOID geometry selected; no OSM fallback needed.')
        entry['osmEvidence']={'status':'verified-selected' if entry['sourceType']=='osm' else 'not-selected-higher-priority-official' if entry['sourceType']=='official' else 'source-uncertain','snapshots': ['source-overpass.json','source-audit-additions.json'] if key in cores else ['source-boundary-discovery.json'] if key in NEW else [f'discovery-{country.lower()}.json'] if (DATA/f'discovery-{country.lower()}.json').exists() else [],'note':entry['limitation']}
        if geoms:
            union=union_geometry(geoms);polygons=list(union.geoms) if union.geom_type=='MultiPolygon' else [union]
            entry.update(finalGeometry=mapping(union),bounds=list(union.bounds),drawable=True,confidence='high-source-medium-travel-coverage' if not admin else 'high-administrative-scope',unionStatus='verified',exteriorRingCount=len(polygons),interiorRingCount=sum(len(p.interiors) for p in polygons),inputComponentCount=len(geoms))
            entry['topology']={'inputArea':sum(shape(g).area for g in geoms),'unionArea':union.area,'inputBoundaryLength':sum(shape(g).length for g in geoms),'unionBoundaryLength':union.length}
        else:entry['auditStatus']='landmark-no-polygon' if key=='tokyo-tower' else 'source-uncertain'
        if entry['drawable']:entry['auditStatus']='trusted-boundary'
        result['areas'][key]=entry
    assert len(result['areas'])==63
    result['summary']={kind:sum(a['sourceType']==kind for a in result['areas'].values()) for kind in ['google','official','osm','none']}
    result['sourceSnapshots']={p.name:digest(p.name) for p in sorted(DATA.glob('source-*.json'))}
    write(DATA/'travel-area-boundaries.json',result)
    audit={**result,'areas':{key:{k:v for k,v in a.items() if k!='finalGeometry'} for key,a in result['areas'].items()}}
    (DATA/'boundary-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(result['summary']),flush=True)
    print('Non-drawable:',','.join(k for k,a in result['areas'].items() if not a['drawable']))
    lines=['# Travel Area boundary audit — 2026-09-10','','Baseline `00a4a52`: **61/61 audited**. Two remaining pairs split to **63 final areas**; Ebisu/Daikanyama were already split in baseline. Legacy aliases are retained only in non-destructive migration.','',f"Source totals: {result['summary']}",'','Canonical structured audit: [boundary-audit.json](../data/area-geometry/boundary-audit.json). Runtime contract and complete GeoJSON: [travel-area-boundaries.json](../data/area-geometry/travel-area-boundaries.json). Every record includes user-facing assessment, composite flag, Google availability, authoritative alternative, OSM evidence, component IDs, final source, union status, drawable flag, confidence and limitations.','','## Google capability decision','',f'[Coverage]({GOOGLE}); [Feature types]({GOOGLE_TYPES}); [Places/Geocoding]({GOOGLE_PLACES}). Places/Geocoding location and viewport are not polygon exports. DDS supports JP/FR administrative/locality types and US administrative/locality types; KR has country coverage only. DDS has no neighborhood/landmark/park feature type. Supported type does not verify a specific area feature. This app has no configured DDS vector map ID or reviewed feature-specific Place IDs, so **zero Google boundaries are selected**. Administrative candidates remain explicitly unverified for DDS; verified static official/OSM sources work on both map providers. No consumer Maps page, screenshot tracing or proprietary polygon extraction used.','','## Source priority and licensing','','US Census exact GEOID polygons take precedence over OSM. Japanese N03/GSI/e-Stat administrative products exist, but direct redistribution/processing qualification is not established here; use verified reusable OSM/ODbL snapshots instead. They are marked available candidates, not falsely reported absent. Seoul official data and French official administrative data are alternatives; the selected OSM snapshots have independently reviewed administrative identity. Travel-circle names never prove administrative equivalence.','', '[OSM license](https://www.openstreetmap.org/copyright). The OSM-derived geometry and raw sources are offered under ODbL; [Census quality guidelines](https://www.census.gov/about/policies/quality/guidelines.html). Source URLs, tags, stable IDs and SHA-256 snapshots are retained. Geometry processing: Shapely/GEOS unary_union; no simplification, snapping, buffer, repair, hull or hand-built bridge.','','## Complete final catalog','','| Key | 中文 | Local | User-facing / composite | Google | Official alternative | Components | Final source | Union | Drawable | Confidence / limitation |','|---|---|---|---|---|---|---|---|---|---|---|']
    for key,a in result['areas'].items():
        comps='; '.join(f"{c['name']} ({c.get('osmId',c.get('geoid'))})" for c in a['geometryComponents']) or 'none'
        lines.append('| '+' | '.join([key,a['travelAreaZh'],a['travelAreaLocal'],('reasonable' if a['userFacingReasonable'] else 'scope-uncertain')+(' / composite retained (adjacent business districts)' if a['compositeName'] else ' / independent'),a['googleBoundary']['status'],a['alternativeAuthoritativeSource']['status'],comps,a['sourceType'],a['unionStatus'],'yes' if a['drawable'] else 'no',a['confidence']+'; '+a['limitation']])+' |')
    lines+=['','## Baseline 61-entry gate','','| Baseline key | Final keys | Audit status |','|---|---|---|']
    for row in result['baselineMapping']:lines.append(f"| {row['travelAreaKey']} | {', '.join(row['finalKeys'])} | {row['status']} |")
    lines+=['','## Migration and acceptance','','Production private inventory is not accessible without authorized authentication: actual converted/unresolved counts are **unknown**, not zero. Resolver uses stored area evidence, address components/address, then verified final geometry containment. Boundary points and unresolved/conflicting evidence preserve the original record. GET conversion does not persist; normal authorized save does. Place ID, names, address, coordinates, photos and Google Maps identity are unchanged. Unresolved composite values display as 地區待確認, never a slash-combined filter.','','Select each of the six split areas in a trip containing those places. Shinjuku/Shibuya should show only union exteriors; Shiba Park can have genuinely separate parcels. Tower/Harajuku/Omotesando can have filters without a boundary. Select All to clear; rapidly A → B → C, then fullscreen/List/Map. Verify markers and gestures remain available and attribution matches the selected source. Full catalog coverage and topology are automated; no need to manually identify each town component.']
    (ROOT/'documentation/travel-area-boundary-audit.md').write_text('\n'.join(lines)+'\n',encoding='utf8')

if __name__=='__main__':build()
