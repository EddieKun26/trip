"""Fetch official US geographic codes and four reviewed OSM park ways, not name guesses."""
import json, urllib.request, urllib.parse, hashlib
from pathlib import Path
ROOT=Path('data/area-geometry')
def fetch(url, filename):
 req=urllib.request.Request(url,headers={'User-Agent':'TravelAreaBoundaryAudit/1.0'})
 raw=urllib.request.urlopen(req,timeout=50).read()
 d=json.loads(raw); assert 'error' not in d,d.get('error')
 (ROOT/filename).write_bytes(raw)
 print(filename,len(raw),hashlib.sha256(raw).hexdigest(),flush=True)
 return d
if __name__=='__main__':
 import sys
 if 'us' in sys.argv:
  service='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2026/MapServer'
  for layer,where,name in [(28,"GEOID IN ('3651000','0644000','0667000','1714000','2507000')",'source-us-cities.json'),(82,"GEOID IN ('36061','36047','36081','36005','36085')",'source-us-boroughs.json')]:
   q=urllib.parse.urlencode({'where':where,'outFields':'*','outSR':4326,'returnGeometry':'true','f':'geojson'})
   fetch(f'{service}/{layer}/query?{q}',name)
 if 'park' in sys.argv:
  for osm_id in [30520683,745301114,745301116,745301120]:
   fetch(f'https://api.openstreetmap.org/api/0.6/way/{osm_id}/full.json',f'source-park-{osm_id}.json')
