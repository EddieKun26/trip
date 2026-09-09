/* Shared deterministic, non-destructive legacy Travel Area split. */
(function (root) {
  const version = 2;
  const targets = {
    ebisu: { travelAreaKey: "ebisu", travelAreaZh: "惠比壽", travelAreaLocal: "恵比寿" },
    daikanyama: { travelAreaKey: "daikanyama", travelAreaZh: "代官山", travelAreaLocal: "代官山" },
  };
  function isLegacy(place) {
    return place?.travelAreaKey === "ebisu-daikanyama"
      || /^(?:惠比壽|恵比寿)[／/]代官山$/.test(String(place?.travelAreaZh || place?.travelAreaLocal || ""));
  }
  function explicitArea(value) {
    const text = String(value || "").normalize("NFKC").trim();
    if (/^(?:惠比壽|恵比寿|Ebisu)$/i.test(text)) return "ebisu";
    if (/^(?:代官山|代官山町|Daikanyama)$/i.test(text)) return "daikanyama";
    return "";
  }
  function fromAddress(text) {
    text=String(text || "").normalize("NFKC");
    // Ebisu-Nishi crosses travel circles. Never classify the entire town by its name.
    if (/恵比寿西|惠比壽西|Ebisu[ -]?Nishi|Ebisunishi/i.test(text)) return "";
    const daikanyama=/代官山町|猿楽町|猿樂町|\bDaikanyamacho\b|\bSarugaku(?:cho)?\b/i.test(text);
    const ebisu=/(?:恵比寿|惠比壽)(?:南)?(?=\s*[0-9一二三四,、]|$)|\bEbisu(?:[ -]?Minami)?(?=[,\s]|$)/i.test(text);
    return daikanyama === ebisu ? "" : daikanyama ? "daikanyama" : "ebisu";
  }
  function inRing(point, ring) {
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[j],b=ring[i];
      const cross=(point[0]-a[0])*(b[1]-a[1])-(point[1]-a[1])*(b[0]-a[0]);
      if(Math.abs(cross)<1e-12 && point[0]>=Math.min(a[0],b[0]) && point[0]<=Math.max(a[0],b[0]) && point[1]>=Math.min(a[1],b[1]) && point[1]<=Math.max(a[1],b[1])) return null;
      if((b[1]>point[1])!==(a[1]>point[1]) && point[0]<(a[0]-b[0])*(point[1]-b[1])/(a[1]-b[1])+b[0]) inside=!inside;
    }
    return inside;
  }
  function contains(feature, point) {
    const polygons=feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:[];
    return polygons.some(rings=>inRing(point,rings[0])===true && rings.slice(1).every(ring=>inRing(point,ring)===false));
  }
  function classify(place, catalog) {
    const evidence=place.travelAreaEvidence;
    const values=typeof evidence==='string'?[evidence]:evidence&&typeof evidence==='object'?[evidence.travelAreaLocal,evidence.travelAreaZh,evidence.area,evidence.local,evidence.name]:[];
    const explicit=[...new Set(values.map(explicitArea).filter(Boolean))];
    if(explicit.length) return explicit.length===1?{key:explicit[0],basis:'existing-evidence'}:{key:'',basis:'conflicting-evidence'};
    const components=[place.addressComponentsOriginal,place.addressComponents].flatMap(value=>Array.isArray(value)?value:[]).filter(c=>c && Array.isArray(c.types) && c.types.some(t=>typeof t==='string' && (t==='neighborhood'||t.startsWith('sublocality'))));
    const addressCandidates=[...new Set(components.map(c=>fromAddress(c.longText||c.long_name)).filter(Boolean))];
    if(addressCandidates.length) return addressCandidates.length===1?{key:addressCandidates[0],basis:'address-components'}:{key:'',basis:'conflicting-address'};
    const addresses=[...new Set([place.formattedAddress,place.address].map(fromAddress).filter(Boolean))];
    if(addresses.length) return addresses.length===1?{key:addresses[0],basis:'address'}:{key:'',basis:'conflicting-address'};
    if(Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&catalog?.areas) {
      const matches=Object.keys(targets).filter(key=>catalog.areas[key]?.features.some(f=>contains(f,[place.longitude,place.latitude])));
      if(matches.length===1)return {key:matches[0],basis:'verified-geometry'};
    }
    return {key:'',basis:'insufficient-evidence'};
  }
  function reclassify(place, catalog) {
    if(!isLegacy(place))return place;
    const result=classify(place,catalog);
    if(!result.key)return place;
    const area=targets[result.key];
    return {...place,...area,planningRegion:area.travelAreaZh,planningRegionOriginal:area.travelAreaLocal,
      travelAreaAuditVersion:version,travelAreaAuditBasis:result.basis,
      travelAreaAuditPrevious:place.travelAreaAuditPrevious||{key:place.travelAreaKey,zh:place.travelAreaZh,local:place.travelAreaLocal}};
  }
  const api={version,targets,isLegacy,classify,reclassify,contains};
  root.TravelAreaAudit=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
