"""Fetch reviewed administrative relations by stable ID, ref, level and region."""
import json, urllib.request
from pathlib import Path
ROOT=Path('data/area-geometry')
if __name__=='__main__':
 jp=json.loads((ROOT/'discovery-jp.json').read_text(encoding='utf8'))['elements']
 kr=json.loads((ROOT/'discovery-kr.json').read_text(encoding='utf8'))['elements']
 selected=[e for e in jp if e['tags'].get('admin_level')=='7' and e['tags'].get('name')!='練馬区' and e['tags'].get('ref','').startswith(('131','142'))]
 selected += [e for e in kr if e['id'] in [2414779,2419941,2419946,2419947,2419949,2419954,2419955]]
 selected += [e for e in json.loads((ROOT/'discovery-fr.json').read_text(encoding='utf8'))['elements'] if e['id']==7444]
 (ROOT/'reviewed-admin.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2),encoding='utf8')
 for e in selected:
  path=ROOT/f"source-admin-{e['id']}.json"
  if path.exists():continue
  req=urllib.request.Request(f"https://api.openstreetmap.org/api/0.6/relation/{e['id']}/full.json",headers={'User-Agent':'TravelAreaBoundaryAudit/1.0'})
  try:
   raw=urllib.request.urlopen(req,timeout=30).read();d=json.loads(raw)
   assert any(x['type']=='relation' and x['id']==e['id'] for x in d['elements'])
   path.write_bytes(raw);print(e['id'],e['tags']['name'],len(raw),flush=True)
  except Exception as error:print(e['id'],str(error),flush=True)
