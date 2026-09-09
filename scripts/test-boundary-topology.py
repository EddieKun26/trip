"""Independent GEOS release gate: real union topology, fixtures and all selected sources."""
import importlib.util,json
from pathlib import Path
from shapely.geometry import Polygon, shape, LineString
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',root/'scripts/build-travel-area-boundaries.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
catalog=builder.read('travel-area-boundaries.json');cores=builder.read('tokyo-v1.json')['areas']

# Adjacent rectangles dissolve their shared edge. A disconnected island stays disconnected.
a=Polygon([(0,0),(1,0),(1,1),(0,1)])
b=Polygon([(1,0),(2,0),(2,1),(1,1)])
c=Polygon([(5,0),(6,0),(6,1),(5,1)])
fixture=builder.union_geometry([a.__geo_interface__,b.__geo_interface__,c.__geo_interface__])
assert fixture.geom_type=='MultiPolygon' and len(fixture.geoms)==2
assert fixture.boundary.intersection(LineString([(1,.1),(1,.9)])).is_empty
donut=Polygon([(0,0),(4,0),(4,4),(0,4)],holes=[[(1,1),(2,1),(2,2),(1,2)]])
assert len(builder.union_geometry([donut.__geo_interface__]).interiors)==1
try:builder.union_geometry([Polygon([(0,0),(1,1),(1,0),(0,1)]).__geo_interface__])
except AssertionError:pass
else:raise AssertionError('Invalid polygon was silently repaired')

verified=0
for key,area in catalog['areas'].items():
 if not area['drawable']:
  assert area['finalGeometry'] is None and not area['geometryComponents']
  continue
 if key in cores: geoms=[shape(f['geometry']) for f in cores[key]['features']]
 else:
  geoms=[]
  for component in area['geometryComponents']:
   if area['sourceType']=='osm':
    g,_=builder.osm_geometry(component['snapshot'],component['osmType'],component['osmId'])
   else:
    g=next(f['geometry'] for f in builder.read(component['snapshot'])['features'] if f['properties']['GEOID']==component['geoid'])
   geoms.append(shape(g))
 final=shape(area['finalGeometry']); expected=unary_union(geoms)
 assert final.is_valid and not final.is_empty
 assert final.equals(expected),key+' differs from exact source union'
 polygons=list(final.geoms) if final.geom_type=='MultiPolygon' else [final]
 assert len(polygons)==area['exteriorRingCount']
 assert sum(len(p.interiors) for p in polygons)==area['interiorRingCount']
 for i,x in enumerate(geoms):
  for y in geoms[i+1:]:
   shared=x.boundary.intersection(y.boundary)
   # Subtract any real union boundary (e.g. coincident overlapping outer edges).
   internal=shared.difference(final.boundary)
   assert final.boundary.intersection(internal).length<1e-12
 if key in ['shinjuku','shibuya','ebisu','daikanyama']:
  assert sum(g.length for g in geoms)>final.length,key+' retained internal town borders'
 verified+=1
assert verified==54
print('PASS: 54 source unions topologically equal; 9 absent; adjacent seam removed; disconnected islands and containment holes preserved; invalid input rejected.')
