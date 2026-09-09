/* Shared deterministic, non-destructive legacy Travel Area split. */
(function (root) {
  const version = 3;
  const targets = {
    ebisu: { travelAreaKey: "ebisu", travelAreaZh: "惠比壽", travelAreaLocal: "恵比寿" },
    daikanyama: { travelAreaKey: "daikanyama", travelAreaZh: "代官山", travelAreaLocal: "代官山" },
    harajuku: { travelAreaKey: "harajuku", travelAreaZh: "原宿", travelAreaLocal: "原宿" },
    omotesando: { travelAreaKey: "omotesando", travelAreaZh: "表參道", travelAreaLocal: "表参道" },
    'tokyo-tower': { travelAreaKey: "tokyo-tower", travelAreaZh: "東京鐵塔", travelAreaLocal: "東京タワー" },
    'shiba-park': { travelAreaKey: "shiba-park", travelAreaZh: "芝公園", travelAreaLocal: "芝公園" },
  };
  const splits = {
    'ebisu-daikanyama': ['ebisu', 'daikanyama'],
    'harajuku-omotesando': ['harajuku', 'omotesando'],
    'tokyo-tower-shiba': ['tokyo-tower', 'shiba-park'],
  };
  function legacyKey(place) {
    if (Object.hasOwn(splits, place?.travelAreaKey || '')) return place.travelAreaKey;
    const names = [place?.travelAreaZh, place?.travelAreaLocal, place?.planningRegion, place?.planningRegionOriginal];
    for (const value of names) {
      const text = String(value || '').normalize('NFKC');
      if (/^(?:惠比壽|恵比寿)[/]代官山$/.test(text)) return 'ebisu-daikanyama';
      if (/^原宿[/]表[參参]道$/.test(text)) return 'harajuku-omotesando';
      if (/^(?:東京鐵塔|東京タワー)[/]芝公園$/.test(text)) return 'tokyo-tower-shiba';
    }
    return '';
  }
  function isLegacy(place) {
    return Boolean(legacyKey(place));
  }
  function explicitArea(value) {
    const text = String(value || "").normalize("NFKC").trim();
    if (/^(?:惠比壽|恵比寿|Ebisu)$/i.test(text)) return "ebisu";
    if (/^(?:代官山|代官山町|Daikanyama)$/i.test(text)) return "daikanyama";
    if (/^(?:原宿|Harajuku)$/i.test(text)) return 'harajuku';
    if (/^(?:表[參参]道|Omotesando)$/i.test(text)) return 'omotesando';
    if (/^(?:東京鐵塔|東京タワー|Tokyo Tower)$/i.test(text)) return 'tokyo-tower';
    if (/^(?:芝公園|Shiba Park)$/i.test(text)) return 'shiba-park';
    return "";
  }
  function fromAddress(text) {
    text=String(text || "").normalize("NFKC");
    // Official Tower address; the surrounding Shibakoen locality alone cannot split this pair.
    if (/芝公園\s*4(?:丁目|[-−ー])2(?:番(?:地)?|[-−ー])8(?:号)?(?:\s|$|[,、])/u.test(text)
      || /\b4-2-8\s+Shibakoen\b/i.test(text)) return 'tokyo-tower';
    if (/^(?:原宿|Harajuku)(?:\s*\d|\s*[,、]|$)/i.test(text)) return 'harajuku';
    if (/^(?:表[參参]道|Omotesando)(?:\s*\d|\s*[,、]|$)/i.test(text)) return 'omotesando';
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
    if (!Array.isArray(polygons)) return false;
    return polygons.some(rings=>Array.isArray(rings) && rings.length && rings.every(ring => Array.isArray(ring) && ring.length >= 4
      && ring.every(p=>Array.isArray(p) && p.length===2 && p.every(Number.isFinite)))
      && inRing(point,rings[0])===true && rings.slice(1).every(ring=>inRing(point,ring)===false));
  }
  function classify(place, catalog) {
    const allowed = splits[legacyKey(place)] || [];
    if (place.countryCode && place.countryCode !== 'JP') return {key:'',basis:'country-mismatch'};
    const choose = values => [...new Set(values.filter(key => allowed.includes(key)))];
    const evidence=place.travelAreaEvidence;
    const values=typeof evidence==='string'?[evidence]:evidence&&typeof evidence==='object'?[evidence.travelAreaLocal,evidence.travelAreaZh,evidence.area,evidence.local,evidence.name]:[];
    const explicit=choose(values.map(explicitArea));
    if(explicit.length) return explicit.length===1?{key:explicit[0],basis:'existing-evidence'}:{key:'',basis:'conflicting-evidence'};
    const components=[place.addressComponentsOriginal,place.addressComponents].flatMap(value=>Array.isArray(value)?value:[]).filter(c=>c && Array.isArray(c.types) && c.types.some(t=>typeof t==='string' && (t==='neighborhood'||t.startsWith('sublocality'))));
    const addressCandidates=choose(components.map(c=>fromAddress(c.longText||c.long_name)));
    if(addressCandidates.length) return addressCandidates.length===1?{key:addressCandidates[0],basis:'address-components'}:{key:'',basis:'conflicting-address'};
    const addresses=choose([place.formattedAddress,place.address].map(fromAddress));
    if(addresses.length) return addresses.length===1?{key:addresses[0],basis:'address'}:{key:'',basis:'conflicting-address'};
    if(Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&catalog?.areas
      && place.latitude>35.55 && place.latitude<35.85 && place.longitude>139.55 && place.longitude<139.9) {
      const matches=allowed.filter(key=>catalog.areas[key]?.drawable === true && contains({geometry:catalog.areas[key].finalGeometry},[place.longitude,place.latitude]));
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
      travelAreaAuditPrevious:place.travelAreaAuditPrevious||Object.fromEntries(Object.entries({key:place.travelAreaKey,zh:place.travelAreaZh,local:place.travelAreaLocal,
        planningRegion:place.planningRegion,planningRegionOriginal:place.planningRegionOriginal}).filter(([,value])=>value!==undefined))};
  }
  const api={version,targets,splits,legacyKey,isLegacy,classify,reclassify,contains};
  root.TravelAreaAudit=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
