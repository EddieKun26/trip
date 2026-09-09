"""Reproducible bounded source discovery; never promotes name matches to geometry."""
import json, urllib.request, urllib.parse
from pathlib import Path
queries = {
 'jp': '[out:json][timeout:60];relation[boundary=administrative][name~"^(千代田区|中央区|港区|文京区|台東区|墨田区|江東区|品川区|目黒区|大田区|世田谷区|中野区|杉並区|豊島区|北区|荒川区|板橋区|足立区|葛飾区|江戸川区|練馬区|鎌倉市|藤沢市)$"](35.2,139.3,35.9,139.95);out tags center;',
 'kr': '[out:json][timeout:60];relation[boundary=administrative](37.4,126.7,37.75,127.25);out tags center;',
 'fr': '[out:json][timeout:60];(relation[boundary=administrative][name="Paris"](48.7,2.1,49,2.6);nwr[name="Montmartre"](48.8,2.2,48.95,2.45););out tags center;',
 'us': '[out:json][timeout:60];relation[boundary=administrative][name~"^(New York|City of New York|New York City|Manhattan|Brooklyn|Queens|Bronx|The Bronx|Staten Island|Los Angeles|San Francisco|Chicago|Boston)$"](24,-126,50,-66);out tags center;',
 'park': '[out:json][timeout:60];way[leisure=park][name="芝公園"](35.64,139.74,35.67,139.76);out body geom;',
}
if __name__ == '__main__':
 import sys
 for key in sys.argv[1:] or queries:
  q=queries[key]; path=Path(f'data/area-geometry/discovery-{key}.json')
  req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':q}).encode(),headers={'User-Agent':'TravelAreaBoundaryAudit/1.0'})
  try:
   raw=urllib.request.urlopen(req,timeout=85).read(); d=json.loads(raw)
   assert 'remark' not in d, d.get('remark')
   path.write_bytes(raw)
   print(key,len(d['elements']),flush=True)
  except Exception as e: print(key,str(e),flush=True)
