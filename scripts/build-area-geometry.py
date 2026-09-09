"""Build reviewed OSM GeoJSON. No inferred edges, simplification, hull or union.
Input is an Overpass `out body geom` snapshot. License: ODbL-1.0.
Usage: python scripts/build-area-geometry.py geometry-source-raw.json
"""
import json, sys, hashlib
from pathlib import Path
manifest=json.loads(Path('data/area-geometry/mapping-audit.json').read_text(encoding='utf-8'))
mapping={a['travelAreaKey']:(a['travelAreaLocal'],[(c['osmId'],c['name']) for c in a['geometryComponents']]) for a in manifest['areas'] if a['geometryComponents']}
raw=Path(sys.argv[1]).read_bytes(); data=json.loads(raw)
extra_path=Path('data/area-geometry/source-audit-additions.json'); extra_raw=extra_path.read_bytes(); extra=json.loads(extra_raw)
elements={e['id']:e for e in data['elements']+extra['elements'] if e['type']=='relation'}

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

out={'version':'20260909.2','source':'OpenStreetMap contributors','license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','attributionUrl':'https://www.openstreetmap.org/copyright','retrievedAt':'2026-09-09','osmTimestamp':data['osm3s']['timestamp_osm_base'],'snapshotSha256':hashlib.sha256(raw).hexdigest(),'additionalSnapshotSha256':hashlib.sha256(extra_raw).hexdigest(),'additionalOsmTimestamp':extra['osm3s']['timestamp_osm_base'],'areas':{}}
for key,(local,items) in mapping.items():
    features=[]
    definition_components=next(a for a in manifest['areas'] if a['travelAreaKey']==key)['geometryComponents']
    for osm_id,name in items:
        e=elements[osm_id];assert e['tags']['name']==name
        rings=rings_for(e)
        features.append({'type':'Feature','properties':{'name':name,'osmType':'relation','osmId':osm_id,'sourceUrl':f'https://www.openstreetmap.org/relation/{osm_id}','sourceTags':e['tags'],'semanticEvidence':next(c['semanticEvidence'] for c in definition_components if c['osmId']==osm_id)},'geometry':{'type':'MultiPolygon','coordinates':[[r] for r in rings]}})
    definition=next(a for a in manifest['areas'] if a['travelAreaKey']==key)
    out['areas'][key]={'travelAreaKey':key,'travelAreaZh':definition['travelAreaZh'],'travelAreaLocal':local,'coverage':definition['coverage'],'countryCode':'JP','localNames':[local], 'type':'FeatureCollection','features':features}
Path('data/area-geometry/tokyo-v1.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({k:len(v['features']) for k,v in out['areas'].items()}))
