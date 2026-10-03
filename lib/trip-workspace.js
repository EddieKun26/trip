(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TripWorkspace=api;})(globalThis,function(){
  'use strict';
  const identity = p => p.id ? `app:${p.id}` : p.placeId ? `google:${p.placeId}` : `name:${p.name}`;
  const valid = p => Number.isFinite(p?.latitude)&&Number.isFinite(p?.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180&&(p.latitude!==0||p.longitude!==0);
  function worldPoint(p,zoom) {
    const size=256*2**zoom, sin=Math.sin(Math.max(-85.05112878,Math.min(85.05112878,p.latitude))*Math.PI/180);
    return {x:(p.longitude+180)/360*size,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size};
  }
  function clusters(places,zoom,selectedKey='') {
    const cells=new Map(), single=[];
    for(const p of places.filter(valid)) {
      // A selected Place and detail-level pins always use the exact original position.
      if(identity(p)===selectedKey) {single.push({place:p,members:[p]});continue;}
      const pixel=worldPoint(p,zoom), key=zoom>=16?`exact:${p.latitude}:${p.longitude}`:`${Math.floor(pixel.x/64)}:${Math.floor(pixel.y/64)}`;
      if(!cells.has(key))cells.set(key,[]);cells.get(key).push(p);
    }
    return [...single,...[...cells.values()].map(members=>({place:members[0],members}))];
  }
  function distanceKm(a,b) {
    if(!valid(a)||!valid(b))return null;
    const r=Math.PI/180, dlat=(b.latitude-a.latitude)*r, dlng=(b.longitude-a.longitude)*r;
    const x=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlng/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
  }
  function todayKey(startDate,days,now=new Date()) {
    const key=`${now.getMonth()+1}/${now.getDate()}`;
    return now.getFullYear()===Number(String(startDate).slice(0,4))&&days.some(d=>d[0]===key)?key:days[0]?.[0]||'';
  }
  function category(p) {
    const base={restaurant:'餐廳',lodging:'住宿',shopping:'購物',attraction:'景點'}[p.kind]||'地點';
    const subtype=p.kind==='restaurant'&&Array.isArray(p.restaurantTags)?p.restaurantTags[0]:p.category;
    return subtype && subtype!==base ? `${base}・${subtype}` : base;
  }
  function groups(places,catalog) {
    const result=new Map();
    for(const place of places) {
      const area=catalog[place.travelAreaKey];
      const key=area?.travelAreaKey||'needs-confirmation';
      if(!result.has(key))result.set(key,{key,label:area?.travelAreaZh||'請確認地區',places:[]});
      result.get(key).places.push(place);
    }
    return [...result.values()];
  }
  function orderedPlaces(places,items=[]) {
    return items.filter(i=>i.type!=='flight').map((item,index)=>({item,place:places.find(p=>p.name===item.name),order:index+1})).filter(e=>e.place);
  }
  function freeze(value) {if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  return {identity,valid,worldPoint,clusters,distanceKm,todayKey,category,groups,orderedPlaces,freeze};
});
