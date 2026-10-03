// V3 presentation and orchestration. Place facts stay in state.places; schedules hold references.
const v3UI = { filter:'saved', sheet:'partial', workspace:null, durations:new Map(), exchange:null, text:'', exchangeError:null, resolve:null, resize:null, exchangeBusy:false };
function v3Minutes(time){const [h,m]=String(time||'').split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function v3MapResults(places){return places.length?places.map(p=>'<button type="button" data-v3-focus="'+escapeHtml(placeDetailKey(p))+'"><b>'+(p.dayOrder||(v3Selected(p)?'★':'○'))+'</b><span>'+escapeHtml(p.name)+'<small>'+escapeHtml(v3Area(p))+' · '+escapeHtml(TripWorkspace.category(p))+'</small></span></button>').join(''):'<p>此範圍沒有收藏地點。可以切換「已收藏」，或新增想去的地方。</p>';}
function v3MapContextChanged(){rememberMapViewport();const label=document.querySelector('[data-v3-location-context]');if(label)label.textContent=v3LocationContext();if(v3UI.filter==='nearby'){v3UI.refreshPins?.();const list=document.querySelector('.v3-map-results');if(list)list.innerHTML=v3MapResults(v3MapPlaces());}}
function v3ObserveMap(host,resize){v3UI.resize?.disconnect();if(typeof ResizeObserver!=='undefined'){v3UI.resize=new ResizeObserver(resize);v3UI.resize.observe(host);}}
function v3MarkerText(place){return String(place.dayOrder || (v3Selected(place)?'★':'○'));}
function v3GoogleMap(host,places){
  clearLiveLocationLayers();activeLeafletMap?.remove();activeLeafletMap=null;host.innerHTML='';
  const viewport=emptyMapViewport(),map=new google.maps.Map(host,{center:{lat:viewport.latitude,lng:viewport.longitude},zoom:viewport.zoom,gestureHandling:'greedy',mapTypeControl:false,fullscreenControl:false,streetViewControl:false});activeGoogleMap=map;
  let markers=[];
  const draw=()=>{markers.forEach(m=>m.setMap(null));markers=TripWorkspace.clusters(v3UI.filter==='nearby'?v3MapPlaces():places,map.getZoom()||11,state.selectedMapPlaceKey).map(group=>{
    const p=group.place,multiple=group.members.length>1,selected=placeDetailKey(p)===state.selectedMapPlaceKey;
    const marker=new google.maps.Marker({map,position:{lat:p.latitude,lng:p.longitude},title:multiple?`${group.members.length} 個地點，點選展開`:p.name,
      icon:{path:google.maps.SymbolPath.CIRCLE,scale:22,fillColor:selected?'#23645D':'#A44330',fillOpacity:1,strokeColor:'#FFFDF8',strokeWeight:selected?4:2},label:{text:multiple?String(group.members.length):v3MarkerText(p),color:'#FFFFFF',fontSize:'15px',fontWeight:'700'},zIndex:selected?1000:multiple?100:1});
    marker.addListener('click',()=>{if(multiple&&v3SamePosition(group.members)){v3CoLocated(group.members);return;}if(multiple){const bounds=new google.maps.LatLngBounds();group.members.forEach(q=>bounds.extend({lat:q.latitude,lng:q.longitude}));map.fitBounds(bounds,70);if(map.getZoom()<16)map.setZoom(Math.min(16,(map.getZoom()||11)+2));}else{updateMapPlacePreview(p);openPlaceSheet(placeDetailKey(p));}});return marker;
  });};
  v3UI.refreshPins=draw;map.addListener('zoom_changed',draw);map.addListener('idle',v3MapContextChanged);map.addListener('dragstart',()=>{mapInteractionUntil=Date.now()+5000;});
  if(state.mapView==='day'){const ordered=[...places].filter(p=>p.dayOrder).sort((a,b)=>a.dayOrder-b.dayOrder);new google.maps.Polyline({map,path:ordered.map(p=>({lat:p.latitude,lng:p.longitude})),strokeColor:'#23645D',strokeWeight:3,strokeOpacity:.65,geodesic:true});}
  if(places.length&&(!lastMapViewport||state.selectedArea)){const bounds=new google.maps.LatLngBounds();places.forEach(p=>bounds.extend({lat:p.latitude,lng:p.longitude}));if(places.length===1){map.setCenter({lat:places[0].latitude,lng:places[0].longitude});map.setZoom(15);}else map.fitBounds(bounds,60);}
  draw();v3ObserveMap(host,()=>google.maps.event.trigger(map,'resize'));syncLiveLocationLayers();
}
function v3LeafletMap(host,places){
  if(!window.L)throw Error('LEAFLET_NOT_AVAILABLE');clearLiveLocationLayers();activeGoogleMap=null;activeLeafletMap?.remove();host.innerHTML='';
  const map=L.map(host,{dragging:true,touchZoom:true,scrollWheelZoom:true,zoomControl:true});activeLeafletMap=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  const viewport=emptyMapViewport();map.setView([viewport.latitude,viewport.longitude],viewport.zoom);
  let markers=[];const draw=()=>{markers.forEach(m=>m.remove());markers=TripWorkspace.clusters(v3UI.filter==='nearby'?v3MapPlaces():places,map.getZoom(),state.selectedMapPlaceKey).map(group=>{const p=group.place,multiple=group.members.length>1;
    const marker=L.marker([p.latitude,p.longitude],{title:multiple?`${group.members.length} 個地點`:p.name,icon:L.divIcon({className:'v3-leaflet-pin',html:`<span class="${placeDetailKey(p)===state.selectedMapPlaceKey?'selected':''}">${multiple?group.members.length:escapeHtml(v3MarkerText(p))}</span>`,iconSize:[44,44],iconAnchor:[22,22]})}).addTo(map);
    marker.on('click',()=>{if(multiple&&v3SamePosition(group.members)){v3CoLocated(group.members);return;}if(multiple)map.fitBounds(group.members.map(q=>[q.latitude,q.longitude]),{padding:[64,64],maxZoom:16});else{updateMapPlacePreview(p);openPlaceSheet(placeDetailKey(p));}});return marker;});};
  if(state.mapView==='day'){const ordered=[...places].filter(p=>p.dayOrder).sort((a,b)=>a.dayOrder-b.dayOrder);if(ordered.length>1)L.polyline(ordered.map(p=>[p.latitude,p.longitude]),{color:'#23645D',weight:3,opacity:.65}).addTo(map);}
  if(places.length&&(!lastMapViewport||state.selectedArea))map.fitBounds(places.map(p=>[p.latitude,p.longitude]),{padding:[60,60],maxZoom:15});
  v3UI.refreshPins=draw;map.on('zoomend',draw);map.on('moveend',v3MapContextChanged);map.on('movestart',()=>{mapInteractionUntil=Date.now()+5000;});draw();v3ObserveMap(host,()=>map.invalidateSize());syncLiveLocationLayers();
}
function v3SamePosition(places){return places.every(p=>p.latitude===places[0].latitude&&p.longitude===places[0].longitude);}
function v3CoLocated(places){sheetRoot.innerHTML='<div class="modal-backdrop"><section class="modal-sheet v3-place-workspace" role="dialog" aria-modal="true" aria-label="同位置地點"><header><h2>同一位置的地點</h2><button type="button" data-close-sheet aria-label="關閉">×</button></header>'+places.map(p=>'<button type="button" data-v3-focus="'+escapeHtml(placeDetailKey(p))+'">'+escapeHtml(p.name)+'</button>').join('')+'</section></div>';}
function v3Desktop() { return Boolean(window.matchMedia?.('(min-width: 1180px)').matches); }
function v3Today() { return TripWorkspace.todayKey(state.startDate,dateMeta); }
function v3Day() { return state.selectedDate || v3Today(); }
function v3Area(place) { return PlanningGeography.canonicalArea(place?.travelAreaKey)?.travelAreaZh || '請確認地區'; }
function v3Selected(place) { return placePoolSelectedKeys().has(placeDetailKey(place)); }
function v3Header(title,subtitle='') { return `<header class="v3-header"><div><p class="v3-eyebrow">${escapeHtml(state.tripTitle || '一起出發')}</p><h1>${title}</h1>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div><div>${undoButtonMarkup()}<button class="text-button" data-tab="overview" type="button" aria-label="旅程資訊與設定">旅程</button><button class="text-button" data-tab="shopping" type="button">採買</button></div></header>`; }
function v3LibraryRow(place) {
  const key=placeDetailKey(place), assigned=placeAssignments(place.name), selected=v3Selected(place);
  return `<article class="v3-place-row ${state.selectedMapPlaceKey===key?'is-focused':''}" data-v3-place-key="${escapeHtml(key)}"><button class="v3-place-open" data-open-place="${escapeHtml(key)}" type="button"><span class="v3-place-icon" aria-hidden="true">${escapeHtml(place.mark || '⌖')}</span><span><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(TripWorkspace.category(place))}</small>${placeTagsList(place)}<span>${assigned.length?`已安排 · ${escapeHtml(assigned.map(a=>a.date).join('、'))}`:'已收藏 · 尚未安排'}</span></span></button>${canEdit()&&!assigned.length?`<button class="v3-select" type="button" data-v3-select="${escapeHtml(key)}" aria-pressed="${selected}" aria-label="${selected?'取消必去':'選為必去'} ${escapeHtml(place.name)}">${selected?'✓ 必去':'＋ 必去'}</button>`:''}${selected?plannerCandidateHoursMarkup({key,place}):''}</article>`;
}
function v3LibraryMarkup(compact=false) {
  const model=placesFilterModel(state.places,state),places=model.visible;
  const groups=TripWorkspace.groups(places,CanonicalTravelCatalog.catalog);
  return `<section class="screen v3-library">${v3Header('收藏地點',compact?'':'想去的地方，隨時可以加入行程')}<div class="v3-chips" aria-label="地點類型">${[['all','全部'],['restaurant','餐廳'],['attraction','景點'],['shopping','購物'],['lodging','住宿']].map(([key,label])=>`<button data-v3-kind="${key}" aria-pressed="${state.placeKind===key}" type="button">${label}</button>`).join('')}</div><details class="v3-library-filters"><summary>更多篩選</summary>${placesFilterDropdowns(model)}</details>${groups.map(g=>`<section class="v3-area-section"><h2><button type="button" data-v3-area="${escapeHtml(g.key)}">${escapeHtml(g.label)} <span>${g.places.length}</span></button></h2>${g.places.map(v3LibraryRow).join('')}</section>`).join('')||'<div class="v3-empty"><h2>先收藏一個想去的地方</h2><p>貼上 Google Maps 連結，或搜尋並確認地點。</p></div>'}${canEdit()?'<button class="primary-button v3-add" type="button" data-add-place>＋ 新增地點</button>':''}</section>`;
}
function v3MapPlaces() {
  const ordered=TripWorkspace.orderedPlaces(state.places,state.itinerary[v3Day()]||[]), byKey=new Map(ordered.map(e=>[placeDetailKey(e.place),e.order]));
  let places=state.places.filter(p=>TripWorkspace.valid(p));
  if(v3UI.filter==='today')places=places.filter(p=>byKey.has(placeDetailKey(p)));
  if(v3UI.filter==='required')places=places.filter(v3Selected);
  if(['restaurant','attraction'].includes(v3UI.filter))places=places.filter(p=>normalizedPlaceKind(p)===v3UI.filter);
  if(state.selectedArea)places=places.filter(p=>p.travelAreaKey===state.selectedArea);
  const center=liveLocationPosition || (lastMapViewport?.tripId===state.tripId?lastMapViewport:null);
  if(v3UI.filter==='nearby'&&center)places=places.map(p=>({p,d:TripWorkspace.distanceKm(center,p)})).filter(e=>e.d!==null&&e.d<=3).sort((a,b)=>a.d-b.d).map(e=>e.p);
  return places.map(p=>({...p,dayOrder:byKey.get(placeDetailKey(p)),routeDate:v3Day(),routeColor:'#23645D'}));
}
function v3LocationContext() {
  const center=liveLocationPosition || (lastMapViewport?.tripId===state.tripId?lastMapViewport:null);
  if(!center)return state.selectedMapPlaceKey ? `正在查看 ${v3Area(resolveDetailPlace(state.selectedMapPlaceKey))}` : '從收藏地點認識這趟旅程';
  const nearest=state.places.map(p=>({p,d:TripWorkspace.distanceKm(center,p)})).filter(e=>e.d!==null&&e.d<2).sort((a,b)=>a.d-b.d)[0];
  if(nearest)return `${liveLocationPosition?'你目前在':'地圖顯示'}${v3Area(nearest.p)}附近`;
  return liveLocationPosition?'顯示你目前的位置':'依目前地圖範圍探索';
}
function v3MapMarkup() {
  const places=v3MapPlaces(), selected=places.find(p=>placeDetailKey(p)===state.selectedMapPlaceKey);
  const items=state.itinerary[v3Day()]||[], now=new Date(), minutes=now.getHours()*60+now.getMinutes();
  const actualToday=`${now.getMonth()+1}/${now.getDate()}`===v3Day()&&Number(state.startDate.slice(0,4))===now.getFullYear();
  const next=items.find(i=>i.type!=='flight'&&(!actualToday||v3Minutes(i.time)>=minutes));
  return `<section class="screen map-screen v3-map-screen">${v3Desktop()?'<h2 class="v3-map-heading">地圖</h2>':v3Header('地圖')}<div class="v3-map-context"><strong data-v3-location-context>${escapeHtml(v3LocationContext())}</strong><button type="button" data-toggle-live-location aria-pressed="${liveLocationEnabled}">${liveLocationEnabled?'停止定位':'⌖ 顯示位置'}</button></div><div class="v3-chips" aria-label="地圖篩選">${[['today','今天'],['nearby','附近'],['saved','已收藏'],['required','必去'],['restaurant','餐廳'],['attraction','景點']].map(([key,label])=>`<button type="button" data-v3-filter="${key}" aria-pressed="${v3UI.filter===key}">${label}</button>`).join('')}${state.selectedArea?'<button type="button" data-v3-area="">清除地區</button>':''}</div><div class="map-canvas v3-map-canvas" data-map-host><div id="interactive-map" class="google-map" aria-label="旅程互動地圖"><div class="map-loading">載入地圖…</div></div><div class="v3-map-key">數字：當日順序 · ★：必去 · ○：收藏；連線僅表示順序</div><section class="v3-map-sheet is-${v3UI.sheet}" aria-label="地圖地點與今天"><div class="v3-sheet-states">${[['collapsed','收合'],['partial','摘要'],['expanded','展開']].map(([key,label])=>`<button type="button" data-v3-sheet="${key}" aria-pressed="${v3UI.sheet===key}">${label}</button>`).join('')}</div><div class="v3-sheet-content"><p class="v3-today"><strong>${escapeHtml(v3Day())}</strong> ${items.filter(i=>i.type!=='flight').length} 個已安排地點${next?` · 下一站 ${escapeHtml(next.name)} ${escapeHtml(next.time||'')}`:''}</p><div data-map-preview-dock class="v3-selected-preview" ${selected?'':'hidden'}>${selected?mapPlacePreviewMarkup(selected):''}</div><div class="v3-map-results">${places.length?places.map(p=>`<button type="button" data-v3-focus="${escapeHtml(placeDetailKey(p))}"><b>${p.dayOrder|| (v3Selected(p)?'★':'○')}</b><span>${escapeHtml(p.name)}<small>${escapeHtml(v3Area(p))} · ${escapeHtml(TripWorkspace.category(p))}</small></span></button>`).join(''):'<p>此範圍沒有收藏地點。可以切換「已收藏」，或新增想去的地方。</p>'}</div></div></section></div></section>`;
}
function v3DesktopScreen() { return `<div class="v3-desktop">${v3LibraryMarkup(true)}<div class="v3-timeline-column">${itineraryScreen()}</div>${v3MapMarkup()}</div>`; }
function v3Hours(place,day,time,duration=30) {
  const entry={key:placeDetailKey(place),place}, windows=plannerHoursWindows(entry), id=plannerHoursGooglePlaceId(place);
  if(!windows) return {blocked:false,label:plannerHoursFailures.has(id)?'營業時間暫時無法確認':'營業時間無法確認'};
  const dayWindows=windows[day];
  if(!Array.isArray(dayWindows))return {blocked:false,label:'營業時間無法確認'};
  const format=value=>value>=1440?`${String(Math.floor(value/60)%24).padStart(2,'0')}:${String(value%60).padStart(2,'0')}（次日）`:`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  const label=`當日 ${dayWindows.map(w=>`${format(w.startMinute)}–${format(w.endMinute)}`).join('、')||'休息'}`;
  if(!time)return {blocked:false,label};
  const start=v3Minutes(time), blocked=!dayWindows.some(w=>start>=w.startMinute&&start+duration<=w.endMinute);
  return {blocked,label:blocked?`營業時間不符合：${time} 起停留 ${duration} 分鐘不在營業時間內。${label}`:label};
}
function v3OpenPlace(place,{refreshDetails=true}={}) {
  if(!place)return;
  const key=placeDetailKey(place), assigned=placeAssignments(place.name), date=assigned.find(a=>a.date===state.selectedDate)?.date || assigned[0]?.date || v3Day();
  const scheduled=(state.itinerary[date]||[]).find(i=>i.name===place.name&&i.type!=='flight');
  state.selectedMapPlaceKey=key; state.selectedMapPlace=place.name;
  const firstOpen=v3UI.workspace?.key!==key;
  if(firstOpen) v3UI.workspace={key,date,originalDate:scheduled?date:null,itemId:scheduled?.id||null,time:scheduled?.time||'09:00',duration:scheduled?.durationMinutes||v3UI.durations.get(key)||60,options:cloneValue(placePoolConstraintFor(key)),error:'',returnFocus:document.activeElement};
  v3RenderPlace();
  if(firstOpen)sheetRoot.querySelector?.("[data-close-sheet]")?.focus?.();
  focusActiveMapOnPlace(place);
  void hydratePlannerPlaceHours({key,place},true).then(()=>{if(v3UI.workspace?.key===key)v3RefreshHours();});
  if(refreshDetails)void ensurePlaceDetails(place);
}
function v3RenderPlace() {
  const w=v3UI.workspace, place=w&&resolveDetailPlace(w.key);if(!place)return;
  const gallery=detailGalleryPhotos(place).slice(0,3).map((photo,i)=>detailGalleryCard(place,photo,i,placeMapsUrl(place))).join('');
  const available=getUnscheduledPlaces().entries.some(e=>e.key===w.key), selected=v3Selected(place);
  sheetRoot.innerHTML=`<div class="modal-backdrop v3-place-backdrop" data-dismiss-sheet><section class="modal-sheet place-detail-sheet v3-place-workspace" data-detail-place="${escapeHtml(w.key)}" role="dialog" aria-modal="true" aria-labelledby="v3-place-title"><header><div><p class="v3-eyebrow">${escapeHtml(v3Area(place))} · ${escapeHtml(TripWorkspace.category(place))}</p><h2 id="v3-place-title">${escapeHtml(place.name)}</h2></div><button class="icon-button" type="button" data-close-sheet aria-label="關閉地點工作區">×</button></header>${gallery?`<div class="detail-gallery">${gallery}</div>`:''}<p class="place-byline">${escapeHtml(place.fullName||place.name)} · ${escapeHtml(place.category||'')}</p><p class="place-description">${escapeHtml(place.description||'')}</p><p>${escapeHtml(place.formattedAddress||'地址待確認')}</p><div class="v3-place-actions"><span>✓ 已收藏</span><button type="button" data-open-maps="${escapeHtml(placeNavigationUrl(place))}">Google Maps 導航 ↗</button>${canEdit()?`<button type="button" data-edit-place="${escapeHtml(place.name)}">編輯地點資料</button>`:''}</div><p class="detail-geography-summary">主要地區：${escapeHtml(v3Area(place))}</p><p class="v3-schedule-summary">${escapeHtml(placeScheduleLabel(place.name))}</p>${canEdit()?`<section class="v3-scheduling" aria-label="安排這個地點">${available?`<button type="button" data-v3-select="${escapeHtml(w.key)}" aria-pressed="${selected}">${selected?'✓ 一定要安排':'＋ 設為必去'}</button>`:''}<h3>安排日期與時間</h3><p>勾選可安排日期；只展開目前編輯的一天。</p><div class="v3-date-rows">${dateMeta.map(([date,weekday])=>{const option=w.options.find(o=>o.dayKey===date),active=w.date===date;return `<div class="v3-date-row ${active?'is-active':''}"><label><input type="checkbox" data-v3-allowed="${date}" ${option?'checked':''}>${date} ${weekday}</label><button type="button" data-v3-date="${date}" aria-expanded="${active}">${active?'正在編輯':'編輯'}</button>${active?`<div class="v3-time-fields"><label>時間方式<select data-v3-mode>${[['none','不指定時間'],['preferred','偏好時段'],['exact','指定時間']].map(([value,label])=>`<option value="${value}" ${value===(option?.mode||'none')?'selected':''}>${label}</option>`).join('')}</select></label>${option?.mode==='preferred'?`<label>偏好時段<select data-v3-period>${POOL_PREFERRED_PERIOD_KEYS.map(p=>`<option value="${p}" ${option.preferredPeriods.includes(p)?'selected':''}>${poolPreferredPeriodLabel(p)}</option>`).join('')}</select></label>`:''}<label>${option?.mode==='exact'?'指定時間':'手動安排開始時間'}<input type="time" value="${escapeHtml(option?.mode==='exact'?option.exactTime:w.time)}" data-v3-time></label><label>停留分鐘<input type="number" min="30" max="240" step="15" value="${w.duration}" data-v3-duration></label></div><div data-v3-hours role="status">${escapeHtml(v3Hours(place,w.date,w.time,w.duration).label)}</div>`:''}</div>`;}).join('')}</div><p data-v3-workspace-error class="v3-error" role="alert">${escapeHtml(w.error)}</p><div class="v3-workspace-footer"><button class="secondary-button" type="button" data-v3-save-constraints>保留規劃條件</button><button class="primary-button" type="button" data-v3-schedule>${w.originalDate?'更新行程':'加入行程'} · ${w.date}</button></div></section>`:''}<details><summary>地點補充資訊</summary>${placeTagsDetail(place)}<p>${formatOpeningHours(place.openingHours)}</p>${v3Supplement(place)}${placeReferenceMeta(place)?`<button type="button" data-open-reference="${escapeHtml(placeReferenceMeta(place).url)}">原始來源 ↗</button>`:''}</details>${canEdit()?`<button class="place-detail-delete-button" type="button" data-request-delete-place="${escapeHtml(place.name)}">移除收藏地點</button>`:''}</section></div>`;
  bindDetailGallery(sheetRoot.querySelector?.('.detail-gallery'),place);v3RefreshHours();
  if(!w.focused){sheetRoot.querySelector?.('[data-close-sheet]')?.focus?.();w.focused=true;}
}
function v3RefreshHours(){const w=v3UI.workspace,p=w&&resolveDetailPlace(w.key);if(!p)return;const hours=v3Hours(p,w.date,w.time,w.duration),node=sheetRoot.querySelector?.('[data-v3-hours]');if(node){node.textContent=hours.label;node.classList.toggle('v3-error',hours.blocked);}const save=sheetRoot.querySelector?.('[data-v3-schedule]');if(save)save.disabled=hours.blocked;}
function v3SaveConstraints(){const w=v3UI.workspace;if(!w)return;if(!Number.isInteger(w.duration)||w.duration<30||w.duration>240||w.duration%15){w.error='停留時間請使用 30–240 分鐘，以 15 分鐘為單位。';return v3RenderPlace();}if(!placePoolSelectedKeys().has(w.key))togglePlacePoolSelection(w.key);if(!applyPlacePoolConstraint(w.key,w.options)){w.error='這個地點已在行程中，請直接更新行程。';return v3RenderPlace();}v3UI.durations.set(w.key,w.duration);showToast('已保留規劃條件');}
function v3DraftDays(){return dateMeta.map(([dayKey])=>({dayKey,items:(state.itinerary[dayKey]||[]).map((item,index)=>({ref:`existing:${state.sharedRevision}:${dayKey}:${index}`,startTime:item.type==='flight'?(state.flights.find(f=>f.id===item.flightId)?.departureTime||item.time||''):item.time||'',durationMinutes:item.durationMinutes??null}))}));}
async function v3SaveSchedule(){
  const w=v3UI.workspace,p=w&&resolveDetailPlace(w.key);if(!p||!canEdit())return;
  if(sharedSyncBusy||sharedSaveTimer){w.error='正在同步，請稍後再儲存。';return v3RenderPlace();}
  const days=v3DraftDays();let intent;
  if(w.originalDate){const index=(state.itinerary[w.originalDate]||[]).findIndex(i=>i.type!=='flight'&&(w.itemId?i.id===w.itemId:i.name===p.name));if(index<0){w.error='行程已更新，請重新開啟地點。';return v3RenderPlace();}intent=days.find(d=>d.dayKey===w.originalDate).items.splice(index,1)[0];}else intent={ref:w.key};
  Object.assign(intent,{startTime:w.time,durationMinutes:Number(w.duration)});const destination=days.find(d=>d.dayKey===w.date);if(!destination){w.error="請選擇旅程內的日期。";return v3RenderPlace();}destination.items.push(intent);destination.items.sort((a,b)=>(a.startTime?v3Minutes(a.startTime):Infinity)-(b.startTime?v3Minutes(b.startTime):Infinity));
  const before=reversibleTripSnapshot(),tripId=state.tripId,memberId=currentMemberId(),context=tripContextVersion;sharedSyncBusy=true;
  try{const {response,result}=await v3Request(tripId,{action:'applyPlan',expectedRevision:state.sharedRevision,days});if(state.tripId!==tripId||currentMemberId()!==memberId||tripContextVersion!==context)return;if(!response.ok){w.error=v3ErrorText(result);v3RenderPlace();return;}applySharedTrip(result);undoSnapshot=before;undoExpectedRevision=result.revision;offerUndoWithNextToast=true;state.selectedDate=w.date;closeSheet();render();showToast('已儲存行程');}catch{w.error='暫時無法確認儲存結果，請重新載入確認。';v3RenderPlace();}finally{sharedSyncBusy=false;}
}
function v3ErrorText(result){const d=result?.detail||{};return d.message||({TRIP_STALE:'行程已更新，請重新產生規劃說明。',PLANNING_SNAPSHOT_STALE:'規劃說明已過期，請重新產生。',PLANNING_SNAPSHOT_REQUIRED:'請先產生新的規劃說明。',OPENING_HOURS_CONFLICT:`營業時間不符合：${d.name||''} ${d.startTime||''}。當日 ${(d.openingWindows||[]).join('、')}`,TIME_OVERLAP:'行程時間重疊，請調整開始時間或停留時間。',INVALID_CANONICAL_AREA_REQUIRED:'請先確認地點所屬大區。',UNRESOLVED_PLACE:'請先確認所有新地點。',INVALID_DURATION:'停留時間請使用 30–240 分鐘，以 15 分鐘為單位。'})[result?.error]||'請確認規劃條件後再試。';}
function v3ExchangeMarkup(){const x=v3UI.exchange;return `<div class="place-pool v3-exchange" id="place-pool-panel"><section class="place-pool-workspace" role="dialog" aria-modal="true" aria-labelledby="v3-exchange-title"><header><h2 id="v3-exchange-title">用你習慣的 AI 規劃</h2><button type="button" data-close-place-pool aria-label="關閉規劃">×</button></header><div class="v3-exchange-body"><p>複製說明到外部 AI，再貼回 PLAN-TEXT-V1。也可以直接編輯文字；目前行程不會改變。</p><label>規劃說明<textarea readonly data-v3-instructions>${escapeHtml(x?.document||'')}</textarea></label><button class="secondary-button" type="button" data-v3-copy>複製規劃說明</button><label>貼回規劃結果<textarea data-v3-plan-text placeholder="規劃格式：PLAN-TEXT-V1">${escapeHtml(v3UI.text)}</textarea></label><div role="alert" class="v3-error">${v3UI.exchangeError?`<p>${escapeHtml(v3ErrorText(v3UI.exchangeError))}</p>${(v3UI.exchangeError.detail?.errors||[]).map(e=>`<p>${e.line?`第 ${e.line} 行：`:''}${escapeHtml(e.message||e.code)}</p>`).join('')}`:''}</div></div><footer><button class="secondary-button" type="button" data-v3-regenerate ${v3UI.exchangeBusy?'disabled':''}>重新產生說明</button><button class="primary-button" type="button" data-v3-import-text ${v3UI.exchangeBusy?'disabled aria-busy="true"':''}>匯入草稿</button></footer></section></div>`;}
async function v3Request(tripId,body,method='POST') {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try { const response=await fetch('/api/trip?id='+encodeURIComponent(tripId),{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});return {response,result:await response.json()}; }
  finally {clearTimeout(timer);}
}
function v3RequestCurrent(request,sequence){return placePoolPlanner.sequence===sequence&&state.tripId===request.tripId&&currentMemberId()===request.memberId&&tripContextVersion===request.context;}
async function v3CreateExchange({regenerate=false}={}) {
  const planner=placePoolPlannerState();
  if(!canEdit()||v3UI.exchangeBusy||planner.status==='loading'||planner.status==='applying')return;
  if(sharedSyncBusy||sharedSaveTimer)return showToast('請等待同步完成');
  if(!placePoolPlannerCandidateCount(getUnscheduledPlaces()))return showToast('目前沒有可規劃的地點');
  if(!confirmPlannerDiscard(()=>v3CreateExchange({regenerate})))return;
  let request=regenerate&&planner.snapshot?{...cloneValue(planner.snapshot),expectedRevision:state.sharedRevision,context:tripContextVersion}:placePoolPlannerSnapshot();
  const sequence=++planner.sequence;planner.status='loading';v3UI.exchangeBusy=true;planner.error=null;
  render({preserveScroll:true,filterOnly:true});
  try {
    if(placePoolSelectedEntries().some(plannerHoursNeedsResolution))await ensureSelectedPlannerHoursResolved();
    if(!v3RequestCurrent(request,sequence))return;
    refreshPlacePoolHoursConflicts();if(placePoolHoursConflicts.size){planner.error={message:'請先修正指定時間的營業衝突'};return;}
    if(!regenerate)request=placePoolPlannerSnapshot();
    const {response,result}=await v3Request(request.tripId,{action:'planningSnapshot',expectedRevision:request.expectedRevision,selected:request.selected});
    if(!v3RequestCurrent(request,sequence))return;
    if(!response.ok){planner.error={...result,message:v3ErrorText(result)};v3UI.exchangeError=result;return;}
    if(result.snapshot?.tripId!==request.tripId||result.snapshot.baseRevision!==request.expectedRevision)throw Error('INVALID_SNAPSHOT');
    v3UI.exchange={...result,snapshot:TripWorkspace.freeze(result.snapshot)};v3UI.exchangeError=null;
    Object.assign(planner,{snapshot:request,preview:null,draft:null,draftDirty:false});
  }catch{if(v3RequestCurrent(request,sequence))planner.error={message:'暫時無法產生說明，請稍後再試。'};}
  finally{if(v3RequestCurrent(request,sequence)){planner.status='idle';v3UI.exchangeBusy=false;render({preserveScroll:true,filterOnly:true});}}
}
async function v3ImportText(){
  if(!v3UI.exchange||v3UI.exchangeBusy||!canEdit())return;
  const request=placePoolPlannerSnapshot(),sequence=++placePoolPlanner.sequence,exchange=v3UI.exchange;
  v3UI.text=document.querySelector('[data-v3-plan-text]')?.value??v3UI.text;v3UI.exchangeBusy=true;v3UI.exchangeError=null;
  render({preserveScroll:true,filterOnly:true});
  try{const {response,result}=await v3Request(request.tripId,{action:'importPlanText',snapshot:exchange.snapshot,text:v3UI.text});
    if(!v3RequestCurrent(request,sequence)||v3UI.exchange!==exchange)return;
    if(!response.ok){v3UI.exchangeError=result;return;}
    if(result.preview?.tripId!==request.tripId||result.preview.revision!==state.sharedRevision)throw Error('INVALID_PREVIEW');
    Object.assign(placePoolPlanner,{status:'preview',preview:result.preview,draft:cloneValue(result.preview),draftDirty:false,error:null});
  }catch{if(v3RequestCurrent(request,sequence))v3UI.exchangeError={detail:{message:'連線失敗或行程已更新，貼上的文字已保留。'}};}
  finally{if(v3RequestCurrent(request,sequence)){v3UI.exchangeBusy=false;render({preserveScroll:true,filterOnly:true});}}
}
function v3ResolveMarkup(){const r=v3UI.resolve;if(!r)return;sheetRoot.innerHTML=`<div class="modal-backdrop"><section class="modal-sheet place-detail-sheet v3-place-workspace" role="dialog" aria-modal="true" aria-label="確認新地點"><header><h2>確認新地點</h2><button type="button" data-close-sheet aria-label="關閉">×</button></header><p>「${escapeHtml(r.name)}」尚未加入地點清單。請選擇正確的 Google 地點。</p><label>搜尋名稱<input data-v3-search-name value="${escapeHtml(r.name)}"></label><button class="primary-button" type="button" data-v3-search ${r.busy?'disabled':''}>搜尋 Google Maps</button><p role="status">${escapeHtml(r.error||'')}</p>${r.candidates.map((p,index)=>`<article class="v3-resolution-result"><strong>${escapeHtml(p.name)}</strong><p>${escapeHtml(p.formattedAddress||'')}</p><p>${escapeHtml(TripWorkspace.category(p))}</p><button type="button" data-open-maps="${escapeHtml(p.sourceUrl||'')}">查看 Google Maps</button>${!PlanningGeography.isImportAreaReady(p)?`<label>確認大區<select data-v3-resolve-area="${index}"><option value="">請選擇大區</option>${Object.values(CanonicalTravelCatalog.catalog).map(a=>`<option value="${escapeHtml(a.travelAreaKey)}">${escapeHtml(a.travelAreaZh)}</option>`).join('')}</select></label>`:''}<button class="primary-button" type="button" data-v3-bind="${index}" ${r.busy?'disabled':''}>確認是這個地點</button></article>`).join('')}</section></div>`;}
async function v3SearchSuggestion(){
  const r=v3UI.resolve;if(!r||r.busy)return;const tripId=state.tripId,memberId=currentMemberId();
  r.name=String(sheetRoot.querySelector('[data-v3-search-name]')?.value||r.name).trim();r.busy=true;r.error='搜尋中…';v3ResolveMarkup();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch('/api/social-place-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rematch',searchMode:'keyword',tripId,query:r.name,excludePlaceIds:[]}),signal:controller.signal});const result=await response.json();
    if(state.tripId!==tripId||currentMemberId()!==memberId||v3UI.resolve!==r)return;
    if(!response.ok)throw Error();r.candidates=result.candidates||[];r.error=r.candidates.length?'請確認名稱、分店與地址；系統不會自動選第一筆。':'沒有找到地點，請調整搜尋名稱。';
  }catch{r.error='搜尋暫時無法完成，請重試。';}finally{clearTimeout(timer);r.busy=false;if(v3UI.resolve===r)v3ResolveMarkup();}
}
async function v3BindSuggestion(index){
  const r=v3UI.resolve,p=r?.candidates[index],planner=placePoolPlanner,draft=planner.draft;
  if(!canEdit()||!p||!draft||r.busy||!p.placeId)return;
  if(sharedSyncBusy||sharedSaveTimer||draft.revision!==state.sharedRevision){r.error='行程正在同步或已更新，請重新產生規劃說明。';return v3ResolveMarkup();}
  const matches=state.places.filter(q=>plannerHoursGooglePlaceId(q)===p.placeId);
  if(matches.length>1){r.error='收藏中有重複的 Google 身分，請先整理地點。';return v3ResolveMarkup();}
  let canonical=matches[0];
  if(!canonical&&!PlanningGeography.isImportAreaReady(p)){r.error='請先確認這個地點所屬大區。';return v3ResolveMarkup();}
  const item=draft.days.flatMap(d=>d.items).find(i=>i.ref===r.ref);if(!item)return;
  if(canonical&&draft.days.some(d=>d.items.some(i=>i.ref===placeDetailKey(canonical)||i.name===canonical.name&&!i.unresolved))){r.error='這個地點已在草稿中，請移除重複的新建議。';return v3ResolveMarkup();}
  if(!canonical&&state.places.some(q=>q.name===p.name)){r.error='收藏中已有同名地點，請先在地點清單確認名稱與分店。';return v3ResolveMarkup();}
  const request=placePoolPlannerSnapshot(),sequence=planner.sequence; r.busy=true;v3ResolveMarkup();
  try{
    if(!canonical){
      const oldRevision=state.sharedRevision,before=reversibleTripSnapshot();
      const addition=withStoredTabelogLink({...p,id:'place-'+crypto.randomUUID(),addedBy:currentMemberId(),addedByName:state.profile?.nickname||'我'},state.destination);
      sharedSyncBusy=true;
      const {response,result}=await v3Request(request.tripId,{...sharedTripPayload(),places:[...state.places,addition],expectedRevision:oldRevision,requireAtomic:true},'PUT');
      if(!v3RequestCurrent(request,sequence)||planner.draft!==draft)return;
      if(!response.ok){r.error=v3ErrorText(result);return;}
      if(result.id!==request.tripId||result.revision!==oldRevision+1||!Array.isArray(result.places))throw Error('INVALID_SAVE_RESPONSE');
      applySharedTrip(result);undoSnapshot=before;undoExpectedRevision=result.revision;
      canonical=state.places.find(q=>q.id===addition.id&&q.placeId===p.placeId);if(!canonical)throw Error('INVALID_SAVED_IDENTITY');
      draft.revision=result.revision;
      for(const day of draft.days)for(const i of day.items)if(i.ref.startsWith('existing:'+oldRevision+':'))i.ref=i.ref.replace('existing:'+oldRevision+':','existing:'+result.revision+':');
    }
    Object.assign(item,{ref:placeDetailKey(canonical),placeKey:placeDetailKey(canonical),name:canonical.name,kind:normalizedPlaceKind(canonical),area:v3Area(canonical),unresolved:false,source:'saved'});
    planner.draftDirty=true;
    await hydratePlannerPlaceHours({key:placeDetailKey(canonical),place:canonical},true);
    if(!v3RequestCurrent(request,sequence)||planner.draft!==draft)return;
    if(v3UI.resolve===r)closeSheet();
    await v3ValidateDraft();
  }catch{r.error='暫時無法確認加入結果，請重新載入行程確認。';}
  finally{r.busy=false;sharedSyncBusy=false;if(v3UI.resolve===r)v3ResolveMarkup();if(v3RequestCurrent(request,sequence))render({preserveScroll:true,filterOnly:true});}
}
async function v3ValidateDraft(){
  const draft=placePoolPlanner.draft;if(!draft)return;const request=placePoolPlannerSnapshot(),sequence=placePoolPlanner.sequence;
  try{const {response,result}=await v3Request(request.tripId,{action:'validatePlan',expectedRevision:draft.revision,days:draft.days.map(d=>({dayKey:d.dayKey,items:d.items.filter(i=>!i.unresolved).map(i=>({ref:i.ref,startTime:i.startTime||i.time||'',durationMinutes:i.durationMinutes??null}))}))});
    if(v3RequestCurrent(request,sequence)&&placePoolPlanner.draft===draft)placePoolPlanner.error=response.ok?null:{...result,message:v3ErrorText(result)};
  }catch{if(v3RequestCurrent(request,sequence))placePoolPlanner.error={message:'驗證暫時失敗，草稿已保留。'};}
}
function v3VotePanel(place){
  const voters=placeVoters(place.name),voted=voters.includes(currentMemberId());
  return '<section class="vote-panel" aria-label="最想去投票"><div class="section-row"><div><strong>最想去</strong><span>'+voters.length+' 人標記</span></div></div><div class="voter-list">'+(voters.length?voters.map(id=>'<span class="voter-chip">'+avatarMarkup(id,true)+escapeHtml(memberName(id))+'</span>').join(''):'<span class="meta">還沒有人標記，成為第一個吧</span>')+'</div></section>'+(canEdit()?'<button class="secondary-button '+(voted?'voted':'')+'" type="button" data-vote="'+escapeHtml(place.name)+'" aria-pressed="'+voted+'">'+(voted?'★ 這我想去！':'☆ 這我還好')+'</button>':'');
}
function v3Supplement(place){
  const reference=placeReferenceMeta(place),tabelogLink=tabelogAppLink(safeTabelogUrl(place.tabelogUrl));
  return '<section class="place-contact-grid" aria-label="聯絡資訊"><div class="place-contact-item phone-contact-item"><small>電話</small>'+(place.phone&&!place.phone.startsWith('待')?'<a href="tel:'+escapeHtml(place.phone.replaceAll('-',''))+'">'+escapeHtml(place.phone)+'</a>':'<strong>電話待確認</strong>')+'</div>'+(tabelogLink?'<a class="tabelog-reservation-button" href="'+escapeHtml(tabelogLink)+'" rel="noopener">Tabelog預約 ↗</a>':'')+'</section><form class="place-note-card" id="place-note-form" data-place-name="'+escapeHtml(place.name)+'"><label>共同註記'+(canEdit()?'<textarea name="note" maxlength="800">'+escapeHtml(place.note||'')+'</textarea>':'<p>'+escapeHtml(place.note||'尚未加入註記')+'</p>')+'</label>'+(canEdit()?'<button type="submit">儲存註記</button>':'')+'</form>'+v3VotePanel(place);
}
function v3HandleKey(event){
  const dialog=sheetRoot.querySelector?.('.v3-place-workspace')||document.querySelector?.('.v3-exchange [role="dialog"],.v3-planning [role="dialog"]');
  if(!dialog)return false;
  if(event.key==='Escape'){event.preventDefault();if(sheetRoot.innerHTML)closeSheet();else setPlacePoolOpen(false);return true;}
  if(event.key==='Tab'){const nodes=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(n=>!n.hidden);const first=nodes[0],last=nodes.at(-1);if(first&&(!nodes.includes(document.activeElement)||(event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last))){event.preventDefault();(event.shiftKey?last:first).focus();return true;}}
  return false;
}
function v3HandleClick(event){
  const el=event.target.closest('[data-v3-select],[data-v3-kind],[data-v3-filter],[data-v3-area],[data-v3-sheet],[data-v3-focus],[data-v3-show-map],[data-v3-date],[data-v3-save-constraints],[data-v3-schedule],[data-v3-copy],[data-v3-import-text],[data-v3-regenerate],[data-v3-resolve],[data-v3-remove],[data-v3-search],[data-v3-bind],[data-v3-external]');if(!el)return false;
  const d=el.dataset;
  if(d.v3Select!==undefined){togglePlacePoolSelection(d.v3Select);if(v3UI.workspace&&sheetRoot.querySelector('.v3-place-workspace'))v3RenderPlace();}
  else if(d.v3Kind!==undefined){state.placeKind=d.v3Kind;render({preserveScroll:true});}
  else if(d.v3Filter!==undefined){v3UI.filter=d.v3Filter;state.selectedArea='';state.mapView=d.v3Filter==='today'?'day':'planning';if(d.v3Filter==='today')state.selectedDate=v3Today();state.mapDate=v3Day();render({preserveScroll:true});}
  else if(d.v3Area!==undefined){state.selectedArea=d.v3Area;state.activeTab='map';state.mapView='planning';v3UI.filter='saved';render();}
  else if(d.v3Sheet!==undefined){v3UI.sheet=d.v3Sheet;const sheet=el.closest('.v3-map-sheet');sheet.className=`v3-map-sheet is-${v3UI.sheet}`;sheet.querySelectorAll('[data-v3-sheet]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v3Sheet===v3UI.sheet)));}
  else if(d.v3ShowMap!==undefined){const p=resolveDetailPlace(d.v3ShowMap);if(p){state.selectedMapPlaceKey=placeDetailKey(p);state.selectedMapPlace=p.name;state.selectedArea='';v3UI.filter='saved';v3UI.sheet='partial';if(TripWorkspace.valid(p))lastMapViewport={tripId:state.tripId,latitude:p.latitude,longitude:p.longitude,zoom:16};setTab('map');updateMapPlacePreview(p);}}
  else if(d.v3Focus!==undefined){const p=resolveDetailPlace(d.v3Focus);if(p){updateMapPlacePreview(p);openPlaceSheet(d.v3Focus);}}
  else if(d.v3Date!==undefined){v3UI.workspace.date=d.v3Date;const option=v3UI.workspace.options.find(o=>o.dayKey===d.v3Date);if(option?.mode==='exact')v3UI.workspace.time=option.exactTime;v3RenderPlace();}
  else if(d.v3SaveConstraints!==undefined)v3SaveConstraints();
  else if(d.v3Schedule!==undefined)void v3SaveSchedule();
  else if(d.v3External!==undefined){state.placePool.open=true;void v3CreateExchange();}
  else if(d.v3Copy!==undefined)void navigator.clipboard.writeText(v3UI.exchange?.document||'').then(()=>showToast('已複製規劃說明')).catch(()=>showToast('請長按文字手動複製'));
  else if(d.v3ImportText!==undefined)void v3ImportText();
  else if(d.v3Regenerate!==undefined)void v3CreateExchange();
  else if(d.v3Resolve!==undefined){const item=placePoolPlanner.draft?.days.flatMap(d=>d.items).find(i=>i.ref===d.v3Resolve);if(item){v3UI.resolve={ref:item.ref,name:item.name,candidates:[],error:''};v3ResolveMarkup();}}
  else if(d.v3Remove!==undefined){for(const day of placePoolPlanner.draft?.days||[])day.items=day.items.filter(i=>i.ref!==d.v3Remove||i.source==='existing'||i.protected);placePoolPlanner.draftDirty=true;render({preserveScroll:true,filterOnly:true});}
  else if(d.v3Search!==undefined)void v3SearchSuggestion();
  else if(d.v3Bind!==undefined)void v3BindSuggestion(Number(d.v3Bind));
  return true;
}
function v3HandleChange(event){const el=event.target,d=el.dataset,w=v3UI.workspace;
  if(d.v3ResolveArea!==undefined&&v3UI.resolve){const p=v3UI.resolve.candidates[Number(d.v3ResolveArea)];if(p&&el.value){delete p.travelAreaCandidateKeys;Object.assign(p,PlanningGeography.manualAreaFields(el.value));}return true;}
  if(d.v3PlanText!==undefined){v3UI.text=el.value;return true;}
  if(!w)return false;
  if(d.v3Allowed!==undefined){w.options=w.options.filter(o=>o.dayKey!==d.v3Allowed);if(el.checked){w.options.push({dayKey:d.v3Allowed,mode:'none',preferredPeriods:[],exactTime:null});w.date=d.v3Allowed;}v3RenderPlace();return true;}
  if(d.v3Mode!==undefined||d.v3Period!==undefined){let option=w.options.find(o=>o.dayKey===w.date);if(!option){option={dayKey:w.date,mode:'none',preferredPeriods:[],exactTime:null};w.options.push(option);}if(d.v3Mode!==undefined){option.mode=el.value;option.preferredPeriods=el.value==='preferred'?['morning']:[];option.exactTime=el.value==='exact'?w.time:null;}else option.preferredPeriods=[el.value];v3RenderPlace();return true;}
  if(d.v3Time!==undefined){w.time=el.value;const option=w.options.find(o=>o.dayKey===w.date);if(option?.mode==='exact')option.exactTime=el.value;v3RefreshHours();return true;}
  if(d.v3Duration!==undefined){w.duration=Number(el.value);v3RefreshHours();return true;}
  return false;
}
