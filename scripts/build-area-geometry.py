"""Build reviewed OSM GeoJSON. No inferred edges, simplification, hull or union.
Input is an Overpass `out body geom` snapshot. License: ODbL-1.0.
Usage: python scripts/build-area-geometry.py geometry-source-raw.json
"""
import json, sys, hashlib
from pathlib import Path
mapping = {
 'ginza': ('銀座', [(4859036,'銀座')]),
 'ebisu-daikanyama': ('恵比寿／代官山', [(9521529,'恵比寿'),(17008303,'恵比寿西'),(17022574,'代官山町')]),
 'shibuya': ('渋谷', [(17022659,'渋谷'),(17022738,'神南'),(17054296,'神宮前'),(17054730,'富ヶ谷')]),
 'asakusa': ('浅草', [(9046136,'浅草'),(16400401,'花川戸'),(18158548,'雷門')]),
 'shinjuku': ('新宿', [(17081654,'新宿'),(17081666,'西新宿'),(17054674,'代々木')]),
 'otsuka': ('大塚', [(18687916,'南大塚'),(18687920,'北大塚')]),
 'ikebukuro': ('池袋', [(4869702,'池袋'),(18672896,'西池袋'),(18672902,'東池袋')]),
 'toyosu': ('豊洲', [(3789147,'豊洲')]),
 'marunouchi-otemachi': ('丸の内／大手町', [(3544394,'丸の内'),(3545196,'大手町')]),
 'tsukiji': ('築地', [(16170475,'築地')]),
 'azabujuban': ('麻布十番', [(3562067,'麻布十番')]),
 'ueno': ('上野', [(18158684,'上野')]),
}
raw=Path(sys.argv[1]).read_bytes(); data=json.loads(raw); elements={e['id']:e for e in data['elements'] if e['type']=='relation'}

def rings_for(e):
    assert e['tags']['boundary']=='administrative' and e['tags']['admin_level']=='9'
    assert not any(m.get('role')=='inner' for m in e['members']), 'Unreviewed inner rings'
    parts=[]
    for m in e['members']:
        if m.get('role')!='outer':continue
        assert m['type']=='way' and len(m.get('geometry',[]))>=2
        part=[[p['lon'],p['lat']] for p in m['geometry']]
        assert all(139.55<x<139.90 and 35.55<y<35.85 for x,y in part)
        parts.append(part)
    rings=[]
    while parts:
        ring=parts.pop(0)
        while ring[-1]!=ring[0]:
            for i,p in enumerate(parts):
                if p[0]==ring[-1]: ring+=p[1:];parts.pop(i);break
                if p[-1]==ring[-1]: ring+=p[-2::-1];parts.pop(i);break
            else:raise ValueError('Unclosed source boundary '+str(e['id']))
        assert len(ring)>=4 and len({tuple(p) for p in ring})>=3
        rings.append(ring)
    assert rings
    return rings

out={'version':'20260909.1','source':'OpenStreetMap contributors','license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','attributionUrl':'https://www.openstreetmap.org/copyright','retrievedAt':'2026-09-09','osmTimestamp':data['osm3s']['timestamp_osm_base'],'snapshotSha256':hashlib.sha256(raw).hexdigest(),'areas':{}}
for key,(local,items) in mapping.items():
    features=[]
    for osm_id,name in items:
        e=elements[osm_id];assert e['tags']['name']==name
        rings=rings_for(e)
        features.append({'type':'Feature','properties':{'name':name,'osmType':'relation','osmId':osm_id,'sourceUrl':f'https://www.openstreetmap.org/relation/{osm_id}','sourceTags':e['tags']},'geometry':{'type':'MultiPolygon','coordinates':[[r] for r in rings]}})
    out['areas'][key]={'countryCode':'JP','localNames':[local], 'type':'FeatureCollection','features':features}
Path('data/area-geometry/tokyo-v1.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({k:len(v['features']) for k,v in out['areas'].items()}))
