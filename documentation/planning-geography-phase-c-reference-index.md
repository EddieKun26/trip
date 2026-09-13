# Phase C baseline direct-reference index

Generated from the clean Phase B tracked source, before implementation. Semantic analysis: planning-geography-phase-c-consumers.md. Static data and fixture lines are included to make search coverage reviewable.

## api/places.mjs

```text
610:             if (storedResolution.travelAreaResolved) {
```

## app.js

```text
540: function travelAreaKeyFromNames(countryCode, zh, local) {
549:   if (place.travelAreaKey && place.travelAreaZh && place.travelAreaLocal) return place;
553:     place.travelAreaKey = travelAreaKeyFromNames(place.countryCode, zh, local);
556:     place.travelAreaSource = place.travelAreaManuallySet === true || place.areaManuallySet === true ? "manual" : "legacy-fallback";
557:     place.travelAreaResolutionStatus = "retry-required";
559:     place.travelAreaKey = `unclassified:${place.placeId || place.id || place.name || "place"}`;
562:     place.travelAreaSource = "unresolved";
563:     place.travelAreaResolutionStatus = "retry-required";
570:   return Boolean(place?.travelAreaKey && place?.travelAreaZh && place?.travelAreaLocal);
577:   if (place?.travelAreaSource === "manual" || place?.travelAreaManuallySet === true) return hasUsableTravelArea(place);
578:   return Boolean(place?.travelAreaResolved === true && Number(place?.travelAreaResolutionVersion) >= TRAVEL_AREA_RESOLUTION_VERSION && hasUsableTravelArea(place));
618:   return String(place.travelAreaKey);
2669:   return geography ? geography.areaKeys.includes(key) : place.travelAreaKey === key;
2676:     return place.travelAreaKey && place.travelAreaZh && !String(place.travelAreaKey).startsWith("unclassified:")
2677:       ? [[place.travelAreaKey, globalThis.TravelAreaAudit?.isLegacy(place) ? "地區待確認" : place.travelAreaZh]] : [];
2703:   const travelAreaKeys = [...new Set(visiblePlaces.map(planningSectionKey))];
2704:   const groups = travelAreaKeys
2915:   if (state.placeAreaFilter && !(globalThis.PlanningGeography?.getPlacePlanningGeography(place)?.areaKeys || [place.travelAreaKey]).includes(state.placeAreaFilter)) return false;
3534:   if (!catalog?.areas || !place || !Object.hasOwn(catalog.areas, place.travelAreaKey)) return null;
3535:   const area = catalog.areas[place.travelAreaKey];
3565:     const representatives = state.places.filter((place) => place.travelAreaKey === key);
3827:   if (place.travelAreaSource === "manual" || place.travelAreaManuallySet === true) return true;
3828:   if (resolved.travelAreaResolved !== true || !resolved.travelAreaKey || !resolved.travelAreaZh || !resolved.travelAreaLocal
3830:     place.travelAreaResolved = false;
3831:     place.travelAreaResolutionStatus = "failed";
3832:     place.travelAreaResolutionError = resolved.travelAreaResolutionError || resolved.error || "TRAVEL_AREA_NOT_RESOLVED";
3835:   place.travelAreaKey = resolved.travelAreaKey;
3838:   place.travelAreaResolved = true;
3839:   place.travelAreaSource = "automatic";
3840:   place.travelAreaResolver = resolved.travelAreaResolver || "";
3842:   place.travelAreaResolutionStatus = "resolved";
3843:   delete place.travelAreaResolutionError;
6643:         travelAreaKey: resolved.travelAreaKey || place.travelAreaKey || "",
6646:         travelAreaResolved: resolved.travelAreaResolved === true,
6647:         travelAreaSource: resolved.travelAreaSource || place.travelAreaSource || "automatic",
6648:         travelAreaResolver: resolved.travelAreaResolver || place.travelAreaResolver || "",
7489:   const success = resolved?.travelAreaResolved === true;
7491:     travelAreaKey: success ? resolved.travelAreaKey : "unclassified:address",
7494:     travelAreaResolved: success, travelAreaManuallySet: false,
7495:     travelAreaSource: resolved?.travelAreaSource || "automatic",
7496:     travelAreaResolver: resolved?.travelAreaResolver || "",
7498:     travelAreaResolutionStatus: resolved?.travelAreaResolutionStatus || (success ? "resolved" : "failed"),
7499:     travelAreaResolutionError: success ? "" : resolved?.travelAreaResolutionError || "TRAVEL_AREA_NOT_RESOLVED",
7505:   if (restoreAuto) return { ...auto, autoTravelArea: auto };
7506:   const manual = existing?.travelAreaSource === "manual" || existing?.travelAreaManuallySet === true;
7507:   if (!selected && manual && (!selectedKey || selectedKey === existing.travelAreaKey)) {
7508:     const fields = Object.fromEntries(Object.entries(existing).filter(([key]) => key.startsWith("travelArea") || key === "autoTravelArea"));
7510:     if (!globalThis.PlanningGeography?.canonicalArea(existing.travelAreaKey)) fields.autoTravelArea = auto;
7513:   if (selectedKey && (selected || selectedKey !== existing?.travelAreaKey
7514:     || existing?.travelAreaSource === "manual" || existing?.travelAreaManuallySet === true)) {
7517:     return { ...fields, ...(existing?.autoTravelArea ? { autoTravelArea: existing.autoTravelArea }
7518:       : !existing && resolved?.travelAreaResolved ? { autoTravelArea: auto } : {}) };
7520:   return { ...auto, autoTravelArea: auto };
7525:   if (!session?.dirty.has("travelAreaKey") || session.restoreAuto || session.saving
7528:     || !Object.entries(session.tagEditBaseline).every(([key, value]) => key === "travelAreaKey" || (form.elements[key]?.value || "") === value)) return false;
7531:   const key = form.elements.travelAreaKey.value;
7550:   session.tagEditBaseline = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin", "travelAreaKey", "kind", "category"].map((key) => [key, form.elements[key]?.value || ""]));
7583:     const area = placeEditorTravelArea(candidate, existing, form.elements.travelAreaKey?.value || "",
7584:       session.restoreAuto, session.dirty.has("travelAreaKey"));
7585:     session.status(area.travelAreaResolved
7586:       ? `✓ 地址已定位 · ${globalThis.TravelAreaAudit?.isLegacy(area) ? "地區待確認" : travelAreaDisplayName(area)}${area.travelAreaManuallySet ? " · 手動分區" : ""}`
7659:     if (event.target.name === "travelAreaKey") {
7696:     form.elements.travelAreaKey.value = "";
7706:   const cachedAuto = existing?.autoTravelArea || existing;
7709:     && (!(existing.travelAreaSource === "manual" || existing.travelAreaManuallySet) || existing.autoTravelArea)
7711:     session.result = { ...existing, ...(existing.autoTravelArea || {}) };
7964:   const travelAreaKey = editorGeography?.primaryAreaKey || "";
7988:           <div class="field full"><label for="place-editor-travel-area-key">旅遊分區</label><select id="place-editor-travel-area-key" name="travelAreaKey"><option value="">未手動指定</option>${Object.values(globalThis.CanonicalTravelCatalog?.catalog || {}).map(area => `<option value="${escapeHtml(area.travelAreaKey)}" ${travelAreaKey === area.travelAreaKey ? "selected" : ""}>${escapeHtml(PlanningGeography.formatCanonicalArea(area))}</option>`).join("")}</select></div>
8940:       place.travelAreaResolutionStatus = "retry-required";
9564:     const selectedTravelAreaKey = String(form.get("travelAreaKey") || "");
9568:     if ((selectedTravelAreaKey || (tagSession.dirty.has("travelAreaKey") && !tagSession.restoreAuto)) && !PlanningGeography.canonicalArea(selectedTravelAreaKey)) return showToast("請選擇有效的旅遊分區");
9634:       ...placeEditorTravelArea(resolved, existing, selectedTravelAreaKey, session.restoreAuto, session.dirty.has("travelAreaKey")),
10145:     const regionKey = event.target.dataset.travelAreaKey;
```

## lib/area-tags.js

```text
107:       .map(({ areaKey, area }) => ({ travelAreaKey: areaKey, travelAreaZh: area.travelAreaZh, travelAreaLocal: area.travelAreaLocal }));
178:         const hit = hits.find((item) => item.travelAreaKey === target);
185:         changes.push({ place, tag, label, travelAreaKey: hit.travelAreaKey,
```

## lib/canonical-travel-catalog.js

```text
5:       "travelAreaKey": "ginza",
13:       "travelAreaKey": "ebisu",
21:       "travelAreaKey": "daikanyama",
29:       "travelAreaKey": "shibuya",
37:       "travelAreaKey": "asakusa",
45:       "travelAreaKey": "shinjuku",
53:       "travelAreaKey": "otsuka",
61:       "travelAreaKey": "ikebukuro",
69:       "travelAreaKey": "toyosu",
77:       "travelAreaKey": "marunouchi-otemachi",
85:       "travelAreaKey": "tsukiji",
93:       "travelAreaKey": "azabujuban",
101:       "travelAreaKey": "ueno",
109:       "travelAreaKey": "tokyo-tower",
117:       "travelAreaKey": "shiba-park",
125:       "travelAreaKey": "harajuku",
133:       "travelAreaKey": "omotesando",
141:       "travelAreaKey": "nerima",
149:       "travelAreaKey": "kamakura",
157:       "travelAreaKey": "fujisawa",
165:       "travelAreaKey": "myeongdong",
173:       "travelAreaKey": "hongdae",
181:       "travelAreaKey": "itaewon",
189:       "travelAreaKey": "gangnam",
197:       "travelAreaKey": "montmartre",
205:       "travelAreaKey": "chiyoda",
213:       "travelAreaKey": "chuo",
221:       "travelAreaKey": "minato",
229:       "travelAreaKey": "bunkyo",
237:       "travelAreaKey": "taito",
245:       "travelAreaKey": "sumida",
253:       "travelAreaKey": "koto",
261:       "travelAreaKey": "shinagawa",
269:       "travelAreaKey": "meguro",
277:       "travelAreaKey": "ota",
285:       "travelAreaKey": "setagaya",
293:       "travelAreaKey": "nakano",
301:       "travelAreaKey": "suginami",
309:       "travelAreaKey": "toshima",
317:       "travelAreaKey": "kita",
325:       "travelAreaKey": "arakawa",
333:       "travelAreaKey": "itabashi",
341:       "travelAreaKey": "adachi",
349:       "travelAreaKey": "katsushika",
357:       "travelAreaKey": "edogawa",
365:       "travelAreaKey": "jongno",
373:       "travelAreaKey": "jung",
381:       "travelAreaKey": "yongsan",
389:       "travelAreaKey": "mapo",
397:       "travelAreaKey": "dongdaemun",
405:       "travelAreaKey": "seocho",
413:       "travelAreaKey": "songpa",
421:       "travelAreaKey": "brooklyn",
429:       "travelAreaKey": "manhattan",
437:       "travelAreaKey": "queens",
445:       "travelAreaKey": "bronx",
453:       "travelAreaKey": "staten-island",
461:       "travelAreaKey": "paris",
469:       "travelAreaKey": "new-york",
477:       "travelAreaKey": "los-angeles",
485:       "travelAreaKey": "san-francisco",
493:       "travelAreaKey": "chicago",
501:       "travelAreaKey": "boston",
509:       "travelAreaKey": "yoyogi-park",
519:       "travelAreaKey": "toshimaen",
529:       "travelAreaKey": "nakameguro",
539:       "travelAreaKey": "jiyugaoka",
549:       "travelAreaKey": "ichigaya",
559:       "travelAreaKey": "katase-enoshima",
```

## lib/canonical-travel-manifest.js

```text
57:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.autoTravelArea": "6d80264973b7f254a031a3710036bed5eec6afd2e8d8104383149add482428d3",
64:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
65:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaKey": "793bcfdcc0cc9a88b16e49c74fd0c92290fbd66b6efcc16f3656958d5464ab0e",
67:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaManuallySet": "fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa",
68:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaResolutionError": "12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126",
69:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
71:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
72:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
73:     "app:custom-place-91223779-84cb-4b13-9713-53991d03ee81.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
82:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.autoTravelArea": "4baae4d127b197c55d4861deee4370af58c9dbaf14359bc02968e9c125e5275c",
92:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
93:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaKey": "acaeb51881123a980e7b2e87606314a245ae532b97c2e6720e2609fd139a25d1",
95:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaManuallySet": "fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa",
96:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaResolutionError": "12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126",
97:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
99:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
100:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
101:     "app:custom-place-e57bfc74-abe9-4f54-a27c-89817a8d77bd.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
110:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
120:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
121:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
123:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
124:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
125:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
127:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
128:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
129:     "google:ChIJ12loNJqNGGARAaV1M_saNLU.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
138:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
148:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
149:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
151:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
152:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
153:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
155:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
156:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
157:     "google:ChIJ1V262MDzGGARBRfYcTc47ek.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
165:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
172:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
173:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaKey": "96be1bfb1f77b8969e7b09e2acfd1ebdd482fec025caab9d262b9339c21b1d8a",
175:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
176:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
177:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
179:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
180:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
181:     "google:ChIJ6-Rvg5-OGGAR99AELnNenOU.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
189:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
196:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
197:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
199:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
200:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
201:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
203:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
204:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
205:     "google:ChIJ6UVSHl2JGGARDurMrMPwvdk.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
214:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
224:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
225:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaKey": "3827068e71ed1efb08208ced123137c985c13470a126ed9054609bbfa29dda34",
227:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
228:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
229:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
231:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
232:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
233:     "google:ChIJ8zGDRQCLGGARVi58iI41Eaw.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
241:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
248:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
249:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
251:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
252:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
253:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
255:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
256:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
257:     "google:ChIJ9frbIO-LGGARv-QxJ_nZIs0.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
266:     "google:ChIJAQCl79GMGGARZheneHqgIUs.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
276:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
277:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
279:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
280:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
281:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
283:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
284:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
285:     "google:ChIJAQCl79GMGGARZheneHqgIUs.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
294:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
304:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
305:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
307:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
308:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
309:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
311:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
312:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
313:     "google:ChIJAQCnnaaMGGARv3e26w2Kczk.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
321:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
328:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
329:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaKey": "fb7bcff287849e45bb712c121ef35b3049415f3b355f8ea87733f1badfec6f1d",
331:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
332:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
333:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
335:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
336:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
337:     "google:ChIJD1tMwoWLGGARmEUmZXQ5iyY.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
345:     "google:ChIJH6PLVACNGGARQr7noWtLVac.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
352:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
353:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaKey": "793bcfdcc0cc9a88b16e49c74fd0c92290fbd66b6efcc16f3656958d5464ab0e",
355:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
356:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
357:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
359:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
360:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
361:     "google:ChIJH6PLVACNGGARQr7noWtLVac.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
369:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
376:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
377:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaKey": "f789027feae043bbe77b12eea15e4494b886c07918b5c40f085f6dfcce8bf9a6",
379:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
380:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
381:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
383:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
384:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
385:     "google:ChIJHYK4PcGOGGARqzUV1AuY7aA.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
393:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
400:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
401:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaKey": "b3aae07c7c0d14b223123ac4c9e57d9af541b0ac4c38589f47f988ce831ee60a",
403:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
404:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
405:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
407:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
408:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
409:     "google:ChIJLUA2hdKLGGARCXm5iPml7EU.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
417:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
424:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
425:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaKey": "f8bdc1a892a2267f67ba997f185f112a26f0f04014b8e40e2bac07e381c8677c",
427:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
428:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
429:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
431:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
432:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
433:     "google:ChIJLaZ-H1CLGGARDWuOinQuVfE.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
442:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
452:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
453:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaKey": "5d00d2545f26b13ffe8286c66c13707464fb35b12e9cb28095b470c24af944f4",
455:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
456:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
457:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
459:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
460:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
461:     "google:ChIJM0WFXGGMGGARw_UnwLWimko.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
469:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
476:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
477:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
479:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
480:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
481:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
483:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
484:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
485:     "google:ChIJMfuLmPSLGGAR6zoDvW3kiWE.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
493:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
500:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
501:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaKey": "96be1bfb1f77b8969e7b09e2acfd1ebdd482fec025caab9d262b9339c21b1d8a",
503:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
504:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
505:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
507:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
508:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
509:     "google:ChIJR2JEzGCPGGARdPJDgHnVbuI.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
517:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
524:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
525:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaKey": "65119cb00487e4eaaf5c1ad9064ed324788e56d2e5c99e495fa8260a05d3e90e",
527:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
528:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
529:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
531:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
532:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
533:     "google:ChIJSeco5wiJGGARItbTS8lQ5G0.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
542:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
552:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
553:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaKey": "3827068e71ed1efb08208ced123137c985c13470a126ed9054609bbfa29dda34",
555:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
556:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
557:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
559:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
560:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
561:     "google:ChIJUcAAFgD1GGARSAPL8cuwJTI.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
570:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
580:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
581:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaKey": "883a077fec423f8f9f6e8debccac9768ef19c9aa54cf1753e4c18bc34846eb45",
583:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
584:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
585:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
587:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
588:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
589:     "google:ChIJUxeDv0OLGGAR8sIBBOBmuDs.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
597:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
604:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
605:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
607:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
608:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
609:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
611:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
612:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
613:     "google:ChIJUzfHlaiMGGARpLxcCvZnorQ.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
621:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
628:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
629:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaKey": "793bcfdcc0cc9a88b16e49c74fd0c92290fbd66b6efcc16f3656958d5464ab0e",
631:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
632:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
633:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
635:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
636:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
637:     "google:ChIJVTIOxCmNGGARCFoKYM32SAE.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
645:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
652:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
653:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaKey": "fb7bcff287849e45bb712c121ef35b3049415f3b355f8ea87733f1badfec6f1d",
655:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
656:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
657:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
659:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
660:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
661:     "google:ChIJW2cLzSGLGGARXAKXv6EkbqI.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
669:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
676:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
677:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaKey": "df362f96633693b1b05fd37b2fc3a8188af6a83989f09046301ee5ae66925002",
679:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
680:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
681:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
683:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
684:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
685:     "google:ChIJW6FfMXeNGGAR5m5-0fiqNf4.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
693:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
700:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
701:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
703:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
704:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
705:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
707:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
708:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
709:     "google:ChIJX05jZOaLGGAR2rUy9EXaYLk.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
717:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
724:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
725:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaKey": "f789027feae043bbe77b12eea15e4494b886c07918b5c40f085f6dfcce8bf9a6",
727:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
728:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
729:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
731:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
732:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
733:     "google:ChIJYWZXR6mPGGAR_VL9r1zbtHo.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
742:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
752:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
753:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaKey": "8facf5677f1dc3759d0c570451395a5ec6e9255c4994c24599ece825a6c46230",
755:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
756:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
757:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
759:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
760:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
761:     "google:ChIJZzjXkvLtGGARm2YFfi26zoU.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
769:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
776:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
777:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaKey": "756a1d6984753a303cd4d7b482ecb324e59b48bba8e27148b7f9d4e1028a877b",
779:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
780:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
781:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
783:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
784:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
785:     "google:ChIJa5vB3z6NGGAR4u3vH-UMD9k.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
793:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
800:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
801:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaKey": "f8bdc1a892a2267f67ba997f185f112a26f0f04014b8e40e2bac07e381c8677c",
803:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
804:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
805:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
807:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
808:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
809:     "google:ChIJb0TBBMaLGGARgCt7NWYODWY.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
817:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
824:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
825:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaKey": "f789027feae043bbe77b12eea15e4494b886c07918b5c40f085f6dfcce8bf9a6",
827:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
828:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
829:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
831:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
832:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
833:     "google:ChIJdzczsDuPGGARHhw2tyh5Dt0.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
841:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
848:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
849:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
851:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
852:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
853:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
855:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
856:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
857:     "google:ChIJjykJZCCLGGARMx5vYqRsWYI.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
865:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
872:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
873:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaKey": "4bbe12c02843f955f0604226ae32317f739cf5e4584432dd11e06ae3762e7268",
875:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
876:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
877:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
879:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
880:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
881:     "google:ChIJlbohVy2NGGARYM9c0wZX34I.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
889:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
896:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
897:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
899:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
900:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
901:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
903:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
904:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
905:     "google:ChIJm2TXf-aLGGARtR9aL0V6gxE.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
914:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
924:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
925:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaKey": "57d1b1cc11e59343b9e5abf3740303f3931f7c1f57396a003e1b3f3d51c7819a",
927:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
928:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
929:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
931:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
932:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
933:     "google:ChIJmdEypbuLGGARdMZWaiYKZIg.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
941:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
948:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
949:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaKey": "756a1d6984753a303cd4d7b482ecb324e59b48bba8e27148b7f9d4e1028a877b",
951:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
952:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
953:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
955:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
956:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
957:     "google:ChIJoyaAE1yNGGARC29VU38_0Ns.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
965:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
972:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
973:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
975:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
976:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
977:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
979:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
980:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
981:     "google:ChIJs7dmFgCLGGARTn-etNVuCYI.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
990:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1000:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1001:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaKey": "54b8ff5f612a25dd4b8d92e81facf471c2f364e4ca8bbe2485e0bd079ce860c5",
1003:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1004:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1005:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1007:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1008:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1009:     "google:ChIJuW1uWLmMGGAR9vxc5gsmk5A.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1017:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1024:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1025:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaKey": "54bdeeabe1ab180f3836208ab16211cff8b672565ec840615d27ff04eba1103c",
1027:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1028:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1029:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1031:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1032:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1033:     "google:ChIJy4YMDwCLGGAR6BajLITe_Oo.travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1042:         "travelAreaKey": "883a077fec423f8f9f6e8debccac9768ef19c9aa54cf1753e4c18bc34846eb45",
1045:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1046:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1047:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1048:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1049:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1051:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1052:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1053:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1071:         "travelAreaKey": "ebisu",
1074:         "travelAreaManuallySet": true,
1075:         "travelAreaSource": "manual",
1076:         "travelAreaResolver": "MANUAL",
1077:         "travelAreaResolved": true,
1079:         "travelAreaResolutionStatus": "resolved",
1080:         "travelAreaResolutionError": ""
1082:       "autoTravelAreaAction": "no-safe-auto",
1083:       "autoTravelAreaBeforeState": "absent"
1090:         "travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
1093:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1094:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1095:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1096:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1097:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1099:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1100:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1101:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1119:         "travelAreaKey": "harajuku",
1122:         "travelAreaManuallySet": true,
1123:         "travelAreaSource": "manual",
1124:         "travelAreaResolver": "MANUAL",
1125:         "travelAreaResolved": true,
1127:         "travelAreaResolutionStatus": "resolved",
1128:         "travelAreaResolutionError": "",
1129:         "autoTravelArea": {
1130:           "travelAreaKey": "shibuya",
1133:           "travelAreaResolver": "JP_TRAVEL_AREA",
1134:           "travelAreaResolved": true,
1135:           "travelAreaManuallySet": false,
1136:           "travelAreaSource": "automatic",
1138:           "travelAreaResolutionStatus": "resolved",
1139:           "travelAreaResolutionError": ""
1142:       "autoTravelAreaAction": "create",
1143:       "autoTravelAreaBeforeState": "absent"
1150:         "travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
1153:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1154:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1155:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1156:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1157:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1159:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1160:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1161:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1179:         "travelAreaKey": "harajuku",
1182:         "travelAreaManuallySet": true,
1183:         "travelAreaSource": "manual",
1184:         "travelAreaResolver": "MANUAL",
1185:         "travelAreaResolved": true,
1187:         "travelAreaResolutionStatus": "resolved",
1188:         "travelAreaResolutionError": "",
1189:         "autoTravelArea": {
1190:           "travelAreaKey": "shibuya",
1193:           "travelAreaResolver": "JP_TRAVEL_AREA",
1194:           "travelAreaResolved": true,
1195:           "travelAreaManuallySet": false,
1196:           "travelAreaSource": "automatic",
1198:           "travelAreaResolutionStatus": "resolved",
1199:           "travelAreaResolutionError": ""
1202:       "autoTravelAreaAction": "create",
1203:       "autoTravelAreaBeforeState": "absent"
1210:         "travelAreaKey": "54b8ff5f612a25dd4b8d92e81facf471c2f364e4ca8bbe2485e0bd079ce860c5",
1213:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1214:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1215:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1216:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1217:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1219:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1220:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1221:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1239:         "travelAreaKey": "harajuku",
1242:         "travelAreaManuallySet": true,
1243:         "travelAreaSource": "manual",
1244:         "travelAreaResolver": "MANUAL",
1245:         "travelAreaResolved": true,
1247:         "travelAreaResolutionStatus": "resolved",
1248:         "travelAreaResolutionError": "",
1249:         "autoTravelArea": {
1250:           "travelAreaKey": "shibuya",
1253:           "travelAreaResolver": "JP_TRAVEL_AREA",
1254:           "travelAreaResolved": true,
1255:           "travelAreaManuallySet": false,
1256:           "travelAreaSource": "automatic",
1258:           "travelAreaResolutionStatus": "resolved",
1259:           "travelAreaResolutionError": ""
1262:       "autoTravelAreaAction": "create",
1263:       "autoTravelAreaBeforeState": "absent"
1270:         "travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
1273:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1274:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1275:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1276:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1277:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1279:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1280:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1281:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1299:         "travelAreaKey": "yoyogi-park",
1302:         "travelAreaManuallySet": true,
1303:         "travelAreaSource": "manual",
1304:         "travelAreaResolver": "MANUAL",
1305:         "travelAreaResolved": true,
1307:         "travelAreaResolutionStatus": "resolved",
1308:         "travelAreaResolutionError": "",
1309:         "autoTravelArea": {
1310:           "travelAreaKey": "shibuya",
1313:           "travelAreaResolver": "JP_TRAVEL_AREA",
1314:           "travelAreaResolved": true,
1315:           "travelAreaManuallySet": false,
1316:           "travelAreaSource": "automatic",
1318:           "travelAreaResolutionStatus": "resolved",
1319:           "travelAreaResolutionError": ""
1322:       "autoTravelAreaAction": "create",
1323:       "autoTravelAreaBeforeState": "absent"
1330:         "travelAreaKey": "acf040aeec9cc86f8d029bc1e7ca348a55cc07676e06eb691377b1015334e13f",
1333:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1334:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1335:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1336:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1337:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1339:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1340:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1341:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1359:         "travelAreaKey": "shinjuku",
1362:         "travelAreaManuallySet": true,
1363:         "travelAreaSource": "manual",
1364:         "travelAreaResolver": "MANUAL",
1365:         "travelAreaResolved": true,
1367:         "travelAreaResolutionStatus": "resolved",
1368:         "travelAreaResolutionError": "",
1369:         "autoTravelArea": {
1370:           "travelAreaKey": "shibuya",
1373:           "travelAreaResolver": "JP_TRAVEL_AREA",
1374:           "travelAreaResolved": true,
1375:           "travelAreaManuallySet": false,
1376:           "travelAreaSource": "automatic",
1378:           "travelAreaResolutionStatus": "resolved",
1379:           "travelAreaResolutionError": ""
1382:       "autoTravelAreaAction": "create",
1383:       "autoTravelAreaBeforeState": "absent"
1390:         "travelAreaKey": "8facf5677f1dc3759d0c570451395a5ec6e9255c4994c24599ece825a6c46230",
1393:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1394:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1395:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1396:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1397:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1399:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1400:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1401:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1419:         "travelAreaKey": "toshimaen",
1422:         "travelAreaManuallySet": true,
1423:         "travelAreaSource": "manual",
1424:         "travelAreaResolver": "MANUAL",
1425:         "travelAreaResolved": true,
1427:         "travelAreaResolutionStatus": "resolved",
1428:         "travelAreaResolutionError": "",
1429:         "autoTravelArea": {
1430:           "travelAreaKey": "nerima",
1433:           "travelAreaResolver": "JP_TRAVEL_AREA",
1434:           "travelAreaResolved": true,
1435:           "travelAreaManuallySet": false,
1436:           "travelAreaSource": "automatic",
1438:           "travelAreaResolutionStatus": "resolved",
1439:           "travelAreaResolutionError": ""
1442:       "autoTravelAreaAction": "create",
1443:       "autoTravelAreaBeforeState": "absent"
1450:         "travelAreaKey": "3827068e71ed1efb08208ced123137c985c13470a126ed9054609bbfa29dda34",
1453:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1454:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1455:         "travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
1456:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1457:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1459:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1460:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1461:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1479:         "travelAreaKey": "nakameguro",
1482:         "travelAreaManuallySet": true,
1483:         "travelAreaSource": "manual",
1484:         "travelAreaResolver": "MANUAL",
1485:         "travelAreaResolved": true,
1487:         "travelAreaResolutionStatus": "resolved",
1488:         "travelAreaResolutionError": "",
1489:         "autoTravelArea": {
1490:           "travelAreaKey": "meguro",
1493:           "travelAreaResolver": "JP_WARD_FALLBACK",
1494:           "travelAreaResolved": true,
1495:           "travelAreaManuallySet": false,
1496:           "travelAreaSource": "automatic",
1498:           "travelAreaResolutionStatus": "resolved",
1499:           "travelAreaResolutionError": ""
1502:       "autoTravelAreaAction": "create",
1503:       "autoTravelAreaBeforeState": "absent"
1510:         "travelAreaKey": "3827068e71ed1efb08208ced123137c985c13470a126ed9054609bbfa29dda34",
1513:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1514:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1515:         "travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
1516:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1517:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1519:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1520:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1521:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1539:         "travelAreaKey": "jiyugaoka",
1542:         "travelAreaManuallySet": true,
1543:         "travelAreaSource": "manual",
1544:         "travelAreaResolver": "MANUAL",
1545:         "travelAreaResolved": true,
1547:         "travelAreaResolutionStatus": "resolved",
1548:         "travelAreaResolutionError": "",
1549:         "autoTravelArea": {
1550:           "travelAreaKey": "meguro",
1553:           "travelAreaResolver": "JP_WARD_FALLBACK",
1554:           "travelAreaResolved": true,
1555:           "travelAreaManuallySet": false,
1556:           "travelAreaSource": "automatic",
1558:           "travelAreaResolutionStatus": "resolved",
1559:           "travelAreaResolutionError": ""
1562:       "autoTravelAreaAction": "create",
1563:       "autoTravelAreaBeforeState": "absent"
1570:         "travelAreaKey": "5d00d2545f26b13ffe8286c66c13707464fb35b12e9cb28095b470c24af944f4",
1573:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1574:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1575:         "travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
1576:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1577:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1579:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1580:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1581:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1599:         "travelAreaKey": "ichigaya",
1602:         "travelAreaManuallySet": true,
1603:         "travelAreaSource": "manual",
1604:         "travelAreaResolver": "MANUAL",
1605:         "travelAreaResolved": true,
1607:         "travelAreaResolutionStatus": "resolved",
1608:         "travelAreaResolutionError": "",
1609:         "autoTravelArea": {
1610:           "travelAreaKey": "chiyoda",
1613:           "travelAreaResolver": "JP_WARD_FALLBACK",
1614:           "travelAreaResolved": true,
1615:           "travelAreaManuallySet": false,
1616:           "travelAreaSource": "automatic",
1618:           "travelAreaResolutionStatus": "resolved",
1619:           "travelAreaResolutionError": ""
1622:       "autoTravelAreaAction": "create",
1623:       "autoTravelAreaBeforeState": "absent"
1630:         "travelAreaKey": "57d1b1cc11e59343b9e5abf3740303f3931f7c1f57396a003e1b3f3d51c7819a",
1633:         "travelAreaManuallySet": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1634:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1635:         "travelAreaResolver": "13352f963094bd8429ca735552ffad81368c0a6246f2205752d6e9acea17c00a",
1636:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1637:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1639:         "travelAreaResolutionError": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1640:         "autoTravelArea": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1641:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1659:         "travelAreaKey": "shiba-park",
1662:         "travelAreaManuallySet": true,
1663:         "travelAreaSource": "manual",
1664:         "travelAreaResolver": "MANUAL",
1665:         "travelAreaResolved": true,
1667:         "travelAreaResolutionStatus": "resolved",
1668:         "travelAreaResolutionError": "",
1669:         "autoTravelArea": {
1670:           "travelAreaKey": "minato",
1673:           "travelAreaResolver": "JP_WARD_FALLBACK",
1674:           "travelAreaResolved": true,
1675:           "travelAreaManuallySet": false,
1676:           "travelAreaSource": "automatic",
1678:           "travelAreaResolutionStatus": "resolved",
1679:           "travelAreaResolutionError": ""
1682:       "autoTravelAreaAction": "create",
1683:       "autoTravelAreaBeforeState": "absent"
1690:         "travelAreaKey": "acaeb51881123a980e7b2e87606314a245ae532b97c2e6720e2609fd139a25d1",
1693:         "travelAreaManuallySet": "fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa",
1694:         "travelAreaSource": "214f1adae32ccc38f5403f4bccd7aeb0409c51003414a19a2df80e9e2471b524",
1695:         "travelAreaResolver": "0fea5742ee070ad0f3e99fd526e3997e3c2ba6d7190707fff23294a3a41b7e4d",
1696:         "travelAreaResolutionStatus": "0772fde17309bd271c343f359e848907b3a93b420878fd1e0b68bbdadcd98eda",
1697:         "travelAreaResolved": "b5bea41b6c623f7c09f1bf24dcae58ebab3c0cdd90ad966bc43a45b44867e12b",
1699:         "travelAreaResolutionError": "12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126",
1700:         "autoTravelArea": "4baae4d127b197c55d4861deee4370af58c9dbaf14359bc02968e9c125e5275c",
1701:         "travelAreaCandidateKeys": "e21e6f28ecd7e5831b4a2930ce4e6c8a1b243f69a01fabd8fbe8c7a0ff3703ff",
1719:         "travelAreaKey": "katase-enoshima",
1722:         "travelAreaManuallySet": true,
1723:         "travelAreaSource": "manual",
1724:         "travelAreaResolver": "MANUAL",
1725:         "travelAreaResolved": true,
1727:         "travelAreaResolutionStatus": "resolved",
1728:         "travelAreaResolutionError": "",
1729:         "autoTravelArea": {
1730:           "travelAreaKey": "fujisawa",
1733:           "travelAreaResolved": true,
1734:           "travelAreaManuallySet": false,
1735:           "travelAreaSource": "automatic",
1736:           "travelAreaResolver": "JP_TRAVEL_AREA",
1738:           "travelAreaResolutionStatus": "resolved",
1739:           "travelAreaResolutionError": ""
1742:       "autoTravelAreaAction": "preserve",
1743:       "autoTravelAreaBeforeState": "existing"
```

## lib/canonical-travel-migration.js

```text
27:   // travelAreaResolutionError is covered even though the field list in the round contract omits
30:   const CANONICAL_FIELDS = ['travelAreaKey', 'travelAreaZh', 'travelAreaLocal', 'travelAreaManuallySet',
31:     'travelAreaSource', 'travelAreaResolver', 'travelAreaResolutionStatus', 'travelAreaResolved',
32:     'travelAreaResolutionVersion', 'travelAreaResolutionError'];
33:   const AUTO_FIELDS = ['autoTravelArea'];
36:   const CANDIDATE_FIELDS = ['travelAreaCandidateKeys'];
262:       if (!knownKey(place.travelAreaKey, catalog) || place.travelAreaResolved !== true
263:         || place.travelAreaResolutionStatus === 'ambiguous' || Object.hasOwn(place, 'travelAreaCandidateKeys')) {
266:       const auto = place.autoTravelArea;
267:       if (auto != null && (!knownKey(auto.travelAreaKey, catalog) || auto.travelAreaResolved !== true
268:         || Object.hasOwn(auto, 'candidateKeys') || auto.status === 'ambiguous')) failures.push(id + ': invalid snapshot state');
482:       summary.autoTravelArea = { preserved: 1, createdResolved: 10, noSafeAuto: 1 };
```

## lib/planning-geography.js

```text
61:     const area = canonicalArea(place?.travelAreaKey);
63:     const group = parentByArea.get(area.travelAreaKey), label = formatCanonicalArea(area);
66:       source: place.travelAreaManuallySet === true || place.travelAreaSource === 'manual' ? 'manual' : 'automatic',
67:       areaKeys: [area.travelAreaKey], primaryAreaKey: area.travelAreaKey,
72:       sectionKey: group ? `group:${group.key}` : `area:${area.travelAreaKey}`,
80:       travelAreaKey: key, travelAreaZh: area.travelAreaZh, travelAreaLocal: area.travelAreaLocal,
81:       travelAreaManuallySet: true, travelAreaSource: 'manual', travelAreaResolver: 'MANUAL',
82:       travelAreaResolved: true, travelAreaResolutionVersion: 5,
83:       travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
```

## lib/planning-region.mjs

```text
118:     travelAreaKey: area.key, travelAreaZh: area.zh, travelAreaLocal: area.local, countryCode,
119:     travelAreaResolved: true, travelAreaSource: "automatic", travelAreaResolver: area.resolver, travelAreaResolutionVersion: TRAVEL_AREA_RESOLUTION_VERSION,
126:     travelAreaKey: "", travelAreaZh: "", travelAreaLocal: "", countryCode, travelAreaResolved: false, travelAreaSource: "automatic", travelAreaResolver: "", travelAreaResolutionVersion: 0, travelAreaResolutionError: reason,
```

## lib/travel-area-audit.js

```text
5:     ebisu: { travelAreaKey: "ebisu", travelAreaZh: "惠比壽", travelAreaLocal: "恵比寿" },
6:     daikanyama: { travelAreaKey: "daikanyama", travelAreaZh: "代官山", travelAreaLocal: "代官山" },
7:     harajuku: { travelAreaKey: "harajuku", travelAreaZh: "原宿", travelAreaLocal: "原宿" },
8:     omotesando: { travelAreaKey: "omotesando", travelAreaZh: "表參道", travelAreaLocal: "表参道" },
9:     'tokyo-tower': { travelAreaKey: "tokyo-tower", travelAreaZh: "東京鐵塔", travelAreaLocal: "東京タワー" },
10:     'shiba-park': { travelAreaKey: "shiba-park", travelAreaZh: "芝公園", travelAreaLocal: "芝公園" },
18:     if (Object.hasOwn(splits, place?.travelAreaKey || '')) return place.travelAreaKey;
94:     if (place?.travelAreaManuallySet === true || place?.travelAreaSource === 'manual') return place;
101:       travelAreaAuditPrevious:place.travelAreaAuditPrevious||Object.fromEntries(Object.entries({key:place.travelAreaKey,zh:place.travelAreaZh,local:place.travelAreaLocal,
```

## scripts/verify-boundary-components.cjs

```text
27:  Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places:defs.flatMap(([key,zh,local,lat,lng],i)=>[0,1].map(j=>({id:'p'+i+j,name:zh+j,kind:'restaurant',category:i===0?'壽喜燒':j===0?'燒肉':'牛排',placeId:'ChIJ'+i+j,photos:[{name:'places/ChIJ'+i+j+'/photos/p'}],photosLoaded:true,formattedAddress:'原地址',sourceUrl:'https://www.google.com/maps/dir/?api=1&destination=wrong',countryCode:'JP',travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,latitude:lat+j*.001,longitude:lng,mark:'店'})))});state.hydratedMemberId=currentMemberId(); state.hydratedTripId=state.tripId;render();
```

## scripts/verify-boundary-union.cjs

```text
29:  const places=Object.values(catalog.areas).map((area,i)=>({id:'p'+i,name:area.travelAreaZh,kind:'restaurant',restaurantTags:['測試'],travelAreaKey:area.travelAreaKey,travelAreaZh:area.travelAreaZh,travelAreaLocal:area.travelAreaLocal,countryCode:area.countryCode,latitude:area.bounds?(area.bounds[1]+area.bounds[3])/2:35.68,longitude:area.bounds?(area.bounds[0]+area.bounds[2])/2:139.72}));
```

## scripts/verify-drawer-filters.cjs

```text
27:  Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places:defs.flatMap(([key,zh,local,lat,lng],i)=>[0,1].map(j=>({id:'p'+i+j,name:zh+j,kind:'restaurant',category:i===0?'壽喜燒':j===0?'燒肉':'牛排',placeId:'ChIJ'+i+j,photos:[{name:'places/ChIJ'+i+j+'/photos/p'}],photosLoaded:true,formattedAddress:'原地址',sourceUrl:'https://www.google.com/maps/dir/?api=1&destination=wrong',countryCode:'JP',travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,latitude:lat+j*.001,longitude:lng,mark:'店'})))});state.hydratedMemberId=currentMemberId(); state.hydratedTripId=state.tripId;render();
```

## scripts/verify-places-ux.cjs

```text
27:  Object.assign(state,{tripId:'test',tripTitle:'測試',hydrationStatus:'ready',activeTab:'places',placesMode:'list',placeKind:'all',isGuest:true,startDate:'2026-09-08',endDate:'2026-09-09',places:defs.flatMap(([key,zh,local,lat,lng],i)=>[0,1].map(j=>({id:'p'+i+j,name:zh+j,kind:'restaurant',category:i===0?'壽喜燒':j===0?'燒肉':'牛排',placeId:'ChIJ'+i+j,photos:[{name:'places/ChIJ'+i+j+'/photos/p'}],photosLoaded:true,formattedAddress:'原地址',sourceUrl:'https://www.google.com/maps/dir/?api=1&destination=wrong',countryCode:'JP',travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,latitude:lat+j*.001,longitude:lng,mark:'店'})))});state.hydratedMemberId=currentMemberId(); state.hydratedTripId=state.tripId;render();
```

## scripts/verify-travel-area-audit.cjs

```text
29:  const places=Object.values(catalog.areas).map((area,i)=>({id:'p'+i,name:area.travelAreaZh,kind:'restaurant',restaurantTags:['測試'],travelAreaKey:area.travelAreaKey,travelAreaZh:area.travelAreaZh,travelAreaLocal:area.travelAreaLocal,countryCode:'JP',latitude:35.68,longitude:139.72}));
```

## tests/area-geometry.test.mjs

```text
27:  const c=vm.createContext({state:{tripId:'t',placeAreaFilter:'ginza',places:[{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'JP'}]},
36:  assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'新宿',countryCode:'JP'}),null);
37:  assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'ginza',travelAreaLocal:'銀座',countryCode:'US'}),null);
38:  assert.equal(c.areaGeometryForPlace(catalog,{travelAreaKey:'unknown',countryCode:'JP'}),null);
41:   const result=c.areaGeometryForPlace(catalog,{travelAreaKey:area.travelAreaKey,travelAreaLocal:area.travelAreaLocal,countryCode:area.countryCode});
```

## tests/area-tags.test.mjs

```text
72:     for (const extra of [{}, {travelAreaKey:'harajuku-omotesando',travelAreaZh:'原宿／表參道',travelAreaLocal:'原宿／表参道'}, {travelAreaKey:'ebisu-daikanyama',formattedAddress:'東京都渋谷区恵比寿南1-2-3',countryCode:'JP'}]) {
77:       classified.travelAreaKey='unclassified:changed';
80:       c.applyPlanningRegionResolution(classified,{travelAreaResolved:true,travelAreaResolutionVersion:5,travelAreaKey:'ginza',travelAreaZh:'銀座',travelAreaLocal:'銀座'});
82:       c.applyPlanningRegionResolution(classified,{travelAreaResolved:false,error:'unresolved'});
91:   const places=[{name:'both',areaTags:['原宿','表參道']},{name:'empty',areaTags:[]},{name:'old',travelAreaKey:'ginza',travelAreaZh:'銀座'},{name:'custom',areaTags:['ＭＹ Place']}];
```

## tests/auth.test.mjs

```text
192:     travelAreaKey: "fujisawa", travelAreaZh: "藤澤", travelAreaLocal: "藤沢",
193:     travelAreaResolved: true, travelAreaSource: "automatic", travelAreaResolver: "JP_CITY_FALLBACK",
194:     travelAreaResolutionVersion: 5, travelAreaResolutionStatus: "resolved", travelAreaResolutionError: "",
293:   const legacy={id:'legacy',travelAreaKey:'ebisu-daikanyama',travelAreaZh:'惠比壽／代官山',travelAreaLocal:'恵比寿／代官山',placeId:'ChIJ_exact',formattedAddress:'東京都渋谷区猿楽町16-15',photos:[{name:'places/ChIJ_exact/photos/one'}],restaurantTags:[],restaurantTagsSource:'manual'};
295:   const harajuku={...legacy,id:'harajuku',travelAreaKey:'harajuku-omotesando',travelAreaZh:'原宿／表參道',travelAreaLocal:'原宿／表参道',formattedAddress:'',travelAreaEvidence:{local:'原宿'}};
296:   const tower={...legacy,id:'tower',travelAreaKey:'tokyo-tower-shiba',travelAreaZh:'東京鐵塔／芝公園',travelAreaLocal:'東京タワー／芝公園',formattedAddress:'東京都港区芝公園4丁目2-8'};
301:   assert.equal(read.payload.places[0].travelAreaKey,'daikanyama');
304:   assert.equal(read.payload.places[2].travelAreaKey,'harajuku');assert.equal(read.payload.places[3].travelAreaKey,'tokyo-tower');
310:   assert.equal(again.payload.places[0].travelAreaKey,'daikanyama');
```

## tests/boundary-catalog.test.mjs

```text
14:  assert.deepEqual(catalog.baselineMapping.map(a=>a.travelAreaKey),original.areas.map(a=>a.travelAreaKey));
18:   assert.equal(a.travelAreaKey,key);
38: const old=(key,extra={})=>({id:'saved',travelAreaKey:key,travelAreaZh:'legacy',travelAreaLocal:'legacy',name:'原宿 東京鐵塔 代官山店',placeId:'ChIJ_P0_exact',googleMapsUrl:'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ_P0_exact',photos:[{name:'places/ChIJ_P0_exact/photos/exact'}],address:'',latitude:null,longitude:null,countryCode:'JP',restaurantTags:[],...extra});
39: const areaFields=new Set(['travelAreaKey','travelAreaZh','travelAreaLocal','planningRegion','planningRegionOriginal','travelAreaAuditVersion','travelAreaAuditBasis','travelAreaAuditPrevious']);
52:   assert.equal(after.travelAreaKey,target,JSON.stringify(evidence));assert.deepEqual(before,original);
78:   assert.equal(area.travelAreaKey,key);assert.equal(area.travelAreaZh,catalog.areas[key].travelAreaZh);
```

## tests/candidate-draft.test.mjs

```text
48:     "sourceListingId", "photoOrigin", "travelAreaKey", "kind", "category"].map((key) => [key, node()]));
```

## tests/canonical-area-hydration.test.mjs

```text
68:   const before={id:mig.TRIP,revision:261,places:[{placeId:'P1',travelAreaKey:'shibuya',travelAreaZh:'澀谷',travelAreaLocal:'渋谷',
69:     travelAreaResolved:true,travelAreaResolutionStatus:'resolved',areaTags:['raw'],latitude:35.66,longitude:139.7,
71:   const after={travelAreaKey:'ebisu',travelAreaZh:'惠比壽',travelAreaLocal:'恵比寿',travelAreaResolved:true,
72:     travelAreaResolutionStatus:'resolved',travelAreaManuallySet:true,travelAreaSource:'manual',travelAreaResolver:'MANUAL',
73:     travelAreaResolutionVersion:5,travelAreaResolutionError:''};
```

## tests/canonical-area-migration-runtime.test.mjs

```text
13:   shibuya: { travelAreaKey: 'shibuya' }, harajuku: { travelAreaKey: 'harajuku' },
14:   ebisu: { travelAreaKey: 'ebisu' }, daikanyama: { travelAreaKey: 'daikanyama' },
15:   shinjuku: { travelAreaKey: 'shinjuku' },
19:   travelAreaKey: key, travelAreaZh: key, travelAreaLocal: key, travelAreaResolved: true,
20:   travelAreaManuallySet: false, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
21:   travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
24:   travelAreaKey: key, travelAreaZh: key, travelAreaLocal: key, travelAreaResolved: true,
25:   travelAreaManuallySet: true, travelAreaSource: 'manual', travelAreaResolver: 'MANUAL',
26:   travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
42:     places: [place('T1', 'shibuya'), place('T2', 'shibuya', { autoTravelArea: automatic('shibuya') }),
51:     autoTravelAreaBeforeState: 'absent', autoTravelAreaAction: 'no-safe-auto',
54:     autoTravelAreaBeforeState: 'existing', autoTravelAreaAction: 'preserve',
55:     noSafeAutoReason: '', after: { ...manual('harajuku'), autoTravelArea: automatic('shibuya') } },
139:   assert.equal(stored.places.find(p => p.placeId === 'T1').travelAreaKey, 'ebisu');
140:   assert.equal(stored.places.find(p => p.placeId === 'T2').travelAreaKey, 'harajuku');
142:   assert.ok(!Object.hasOwn(stored.places.find(p => p.placeId === 'T1'), 'autoTravelArea'));
174:   drifted.places[0].travelAreaKey = 'daikanyama';
180:   assert.ok(result.preDiff.some(line => line.startsWith('google:T1.travelAreaKey')));
336:     broken.places[0].travelAreaKey = key;
340:   snapshot.places[0].autoTravelArea = { ...automatic('shibuya'), travelAreaKey: 'harajuku-omotesando' };
345:   for (const mutate of [p=>p.travelAreaCandidateKeys=['ebisu','daikanyama'],p=>p.travelAreaResolutionStatus='ambiguous',
346:     p=>p.autoTravelArea={status:'ambiguous',candidateKeys:['ebisu','daikanyama']}]) {
356:     assert.equal(item.travelAreaCandidateKeys, undefined);
357:     assert.notEqual(item.travelAreaResolutionStatus, 'ambiguous');
358:     assert.ok(item.travelAreaKey, 'every Place keeps a non-empty key at Phase A completion');
605:   const drifted=structuredClone(before);drifted.places[0].travelAreaKey='changed';
613:   assert.ok(text.includes('updatedByHash='+context.updatedByHash));assert.ok(text.includes('google:T1.travelAreaKey'));
```

## tests/canonical-area-phase-a.test.mjs

```text
13:     autoTravelArea: {
14:       travelAreaKey: 'fujisawa', travelAreaZh: '藤澤', travelAreaLocal: '藤沢',
15:       travelAreaResolved: true, travelAreaManuallySet: false, travelAreaSource: 'automatic',
16:       travelAreaResolver: 'JP_TRAVEL_AREA', travelAreaResolutionVersion: 5,
17:       travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
22:     autoTravelArea: {
23:       travelAreaKey: 'shinjuku', travelAreaZh: '新宿', travelAreaLocal: '新宿',
24:       travelAreaResolved: true, travelAreaManuallySet: false, travelAreaSource: 'automatic',
25:       travelAreaResolver: 'JP_TRAVEL_AREA', travelAreaResolutionVersion: 5,
26:       travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
31: const AUTO_SNAPSHOT_FIELDS = ['travelAreaKey', 'travelAreaLocal', 'travelAreaManuallySet',
32:   'travelAreaResolutionError', 'travelAreaResolutionStatus', 'travelAreaResolutionVersion',
33:   'travelAreaResolved', 'travelAreaResolver', 'travelAreaSource', 'travelAreaZh'];
37:     const expected = manifest.baselineFields[`${fixture.stableId}.autoTravelArea`];
38:     assert.ok(expected, `baseline is missing ${fixture.stableId}.autoTravelArea`);
39:     const actual = await mig.fieldHash(fixture, 'autoTravelArea');
48:     assert.deepEqual(Object.keys(fixture.autoTravelArea).sort(), AUTO_SNAPSHOT_FIELDS);
49:     for (const key of Object.keys(fixture.autoTravelArea)) {
53:     assert.equal(await mig.fieldHash(fixture, 'autoTravelArea'), await mig.fieldHash(fixture, 'autoTravelArea'));
55:     const reversed = Object.fromEntries(Object.entries(fixture.autoTravelArea).reverse());
56:     assert.equal(await mig.fieldHash({ autoTravelArea: reversed }, 'autoTravelArea'),
57:       await mig.fieldHash(fixture, 'autoTravelArea'));
64:     undefined: { travelAreaManuallySet: undefined },
65:     false: { travelAreaManuallySet: false },
66:     true: { travelAreaManuallySet: true },
67:     null: { travelAreaManuallySet: null },
68:     emptyString: { travelAreaManuallySet: '' },
69:     zero: { travelAreaManuallySet: 0 },
70:     emptyObject: { travelAreaManuallySet: {} },
71:     emptyArray: { travelAreaManuallySet: [] },
75:     const value = await mig.fieldHash(source, 'travelAreaManuallySet');
78:     assert.equal(await mig.fieldHash(source, 'travelAreaManuallySet'), value, `${label} is unstable`);
80:   assert.equal(mig.canonicalField({}, 'travelAreaManuallySet'), mig.ABSENT);
81:   assert.equal(mig.canonicalField({ travelAreaManuallySet: undefined }, 'travelAreaManuallySet'), mig.UNDEFINED);
92:   for (const field of ['travelAreaKey', 'travelAreaZh', 'travelAreaLocal', 'travelAreaManuallySet',
93:     'travelAreaSource', 'travelAreaResolver', 'travelAreaResolutionStatus', 'travelAreaResolved',
94:     'travelAreaResolutionVersion', 'autoTravelArea', 'travelAreaCandidateKeys', 'areaTags',
108:   const expected = { 'google:ChIJtest.travelAreaKey': 'a'.repeat(64) };
109:   const actual = { 'google:ChIJtest.travelAreaKey': 'b'.repeat(64) };
112:   assert.deepEqual(rows[0], { key: 'google:ChIJtest.travelAreaKey', expected: 'aaaaaaaa', actual: 'bbbbbbbb' });
114:   assert.equal(text, 'google:ChIJtest.travelAreaKey expected aaaaaaaa actual bbbbbbbb');
196:   const distinct = map => new Set(manifest.placeStableIds.map(id => map[`${id}.travelAreaKey`])).size;
207:     const before = pre[`${row.stableId}.autoTravelArea`];
208:     const after = post[`${row.stableId}.autoTravelArea`];
215:   assert.equal(post[`${R01}.autoTravelArea`], absent);
221:     assert.ok(['preserve','create','no-safe-auto'].includes(row.autoTravelAreaAction));
222:     assert.ok(['absent','existing'].includes(row.autoTravelAreaBeforeState));
223:     assert.deepEqual(Object.keys(row).sort(), ['after','autoTravelAreaAction','autoTravelAreaBeforeState','beforeHashes','placeId','stableId']);
251:     assert.equal(after.travelAreaKey, key);
252:     assert.equal(after.travelAreaManuallySet, true);
253:     assert.equal(after.travelAreaSource, 'manual');
254:     assert.equal(after.travelAreaResolver, 'MANUAL');
255:     assert.equal(after.travelAreaResolutionStatus, 'resolved');
256:     assert.equal(after.travelAreaResolved, true);
258:     assert.equal(after.travelAreaResolutionError, '');
261:     assert.ok(!['ebisu-daikanyama', 'harajuku-omotesando'].includes(r.after.travelAreaKey));
262:     assert.ok(!String(r.after.travelAreaKey).startsWith('jp:'));
263:     assert.ok(r.after.travelAreaKey, 'canonical key must be non-empty');
264:     assert.equal(r.after.travelAreaCandidateKeys, undefined, 'Phase A must not persist candidate state');
```

## tests/lodging-editor.test.mjs

```text
22:   travelAreaKey: "shinjuku", travelAreaZh: "新宿", travelAreaLocal: "新宿", travelAreaResolved: true,
23:   travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
38:   form.elements = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin", "travelAreaKey", "kind", "category"].map((key) => [key, node()]));
219:   h.reply(0, { ...good, travelAreaResolved: false, travelAreaKey: "", travelAreaZh: "", travelAreaLocal: "", travelAreaResolutionError: "TIMEOUT", travelAreaResolutionVersion: 0 });
222:   assert.equal(place.latitude, good.latitude); assert.equal(place.travelAreaResolutionStatus, "failed");
223:   assert.equal(place.travelAreaResolutionError, "TIMEOUT"); assert.notEqual(place.travelAreaKey, good.travelAreaKey);
228:   const original = { ...good, name: "既有住宿", travelAreaKey: "my-area", travelAreaZh: "我的區", travelAreaLocal: "My area", travelAreaSource: "manual", travelAreaManuallySet: true };
232:   assert.equal(place.travelAreaKey, "my-area"); assert.equal(place.autoTravelArea.travelAreaKey, "shinjuku");
236:   assert.equal(restored.context.state.places[0].travelAreaKey, "shinjuku");
237:   assert.equal(restored.context.state.places[0].travelAreaManuallySet, false);
406:       ...(manual ? { travelAreaKey: "my-area", travelAreaZh: "我的區", travelAreaLocal: "My area", travelAreaSource: "manual",
407:         travelAreaManuallySet: true, travelAreaResolutionVersion: 5, autoTravelArea: oldAuto } : {}) };
413:     assert.equal(saved.travelAreaKey, manual ? "my-area" : good.travelAreaKey);
414:     assert.equal(saved.travelAreaManuallySet, manual);
415:     assert.equal(saved.autoTravelArea.travelAreaResolutionVersion, 5);
681:  const existing={id:"original",name:"原 Place",kind:"attraction",placeId:"ChIJExact",formattedAddress:"",address:"original",addressComponents:[{longText:"神宮前",types:["neighborhood"]}],latitude:35.7,longitude:139.7,photos:[{name:"exact"}],googleMapsUrl:"https://maps.google.com/exact",restaurantTags:["custom"],lodging:{x:1},shopping:{x:2},travelAreaKey:"unclassified:original",areaTags:["手動區"]};
733:   assert.equal(result.travelAreaKey,"shinjuku");
893:   travelAreaKey:"shinjuku",travelAreaZh:"新宿",travelAreaLocal:"新宿",travelAreaResolved:true,travelAreaSource:"automatic",travelAreaResolver:"JP_NAMED_AREA",travelAreaResolutionVersion:5};
```

## tests/manual-canonical-precedence.test.mjs

```text
29:     travelAreaKey:key,travelAreaZh:zh,travelAreaLocal:local,travelAreaManuallySet:true,
30:     travelAreaSource:'manual',travelAreaResolver:'MANUAL',travelAreaResolved:true,travelAreaResolutionVersion:5,
38:   for(const flags of [{travelAreaManuallySet:true,travelAreaSource:'automatic'},
39:     {travelAreaManuallySet:false,travelAreaSource:'manual'},
40:     {travelAreaManuallySet:true,travelAreaSource:'manual'}]) {
55:     context.applyPlanningRegionResolution(place,{travelAreaKey:'shibuya',travelAreaZh:'澀谷',travelAreaLocal:'渋谷',
56:       travelAreaResolved:true,travelAreaResolutionVersion:5});
94:     context.applyPlanningRegionResolution(hydrated,{travelAreaKey:'harajuku',travelAreaZh:'原宿',travelAreaLocal:'原宿',travelAreaResolved:true,travelAreaResolutionVersion:5});
103:   const automatic={...manual(),travelAreaManuallySet:false,travelAreaSource:'automatic'};
104:   assert.equal(audit.reclassify(automatic,catalog).travelAreaKey,'harajuku');
107:   assert.equal(result.travelAreaResolved,false);
108:   assert.equal(result.travelAreaKey,'');
109:   assert.equal(result.travelAreaResolutionError,'AMBIGUOUS_EBISU_DAIKANYAMA');
```

## tests/place-editor-navigation.test.mjs

```text
44:   travelAreaKey: "shinjuku", travelAreaZh: "新宿", travelAreaLocal: "新宿", travelAreaResolved: true,
45:   travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
49: const classified = { travelAreaKey: "shibuya", travelAreaZh: "澀谷", travelAreaLocal: "渋谷", travelAreaResolved: true,
50:   travelAreaSource: "automatic", travelAreaResolver: "JP_NAMED_AREA", travelAreaResolutionVersion: 5 };
63:   form.elements = Object.fromEntries(["name", "address", "sourceUrl", "referenceUrl", "sourcePlatform", "sourceLodgingName", "sourceListingId", "photoOrigin", "travelAreaKey", "kind", "category"].map((key) => [key, node()]));
```

## tests/places-filters.test.mjs

```text
12:  { name: "a", kind: "restaurant", travelAreaKey: "ueno", travelAreaZh: "上野", restaurantTags: ["燒肉", "日式"] },
13:  { name: "b", kind: "restaurant", travelAreaKey: "shinjuku", travelAreaZh: "新宿", restaurantTags: ["壽喜燒"] },
14:  { name: "c", kind: "attraction", travelAreaKey: "ueno", travelAreaZh: "上野" },
16:  { name: "e", kind: "restaurant", travelAreaKey: "other", travelAreaZh: "上野", restaurantTags: ["燒肉"] },
26:  assert.equal(places[3].travelAreaKey, undefined);
```

## tests/places.test.mjs

```text
74:   assert.equal(response.payload.places[0].travelAreaKey, "shibuya");
77:   assert.equal(response.payload.places[0].travelAreaResolved, true);
199:   assert.equal(response.payload.places[0].travelAreaKey, "fujisawa");
264:     response.payload.places.map(({ area, areaOriginal, travelAreaKey, travelAreaZh, travelAreaLocal, travelAreaResolved, travelAreaResolutionVersion }) => ({ area, areaOriginal, travelAreaKey, travelAreaZh, travelAreaLocal, travelAreaResolved, travelAreaResolutionVersion })),
266:       { area: "中區", areaOriginal: "중구", travelAreaKey: "myeongdong", travelAreaZh: "明洞", travelAreaLocal: "명동", travelAreaResolved: true, travelAreaResolutionVersion: 5 },
267:       { area: "Paris", areaOriginal: "Paris", travelAreaKey: "montmartre", travelAreaZh: "蒙馬特", travelAreaLocal: "Montmartre", travelAreaResolved: true, travelAreaResolutionVersion: 5 },
```

## tests/planning-geography.test.mjs

```text
24:     travelAreaResolved: true, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
25:     travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
71:     const input = place('harajuku', { travelAreaKey: key, planningRegion: '原宿', areaTags: ['原宿'] });
152:     { travelAreaManuallySet: true, travelAreaSource: 'automatic' },
153:     { travelAreaManuallySet: false, travelAreaSource: 'manual' },
159:     assert.equal(Object.hasOwn(input, 'autoTravelArea'), false);
170:     'photoOrigin', 'travelAreaKey', 'kind', 'category'].map(key => [key, node(key === 'address' ? existing.formattedAddress : existing[key] || '')]));
183:   assert.match(b.sheet.innerHTML, /name="travelAreaKey"/);
186:   const options = b.sheet.innerHTML.match(/name="travelAreaKey">([\s\S]*?)<\/select>/)[1];
191:   const original = place('shinjuku', { planningRegion: '澀谷', areaTags: ['神宮前'], autoTravelArea: { ...PlanningGeography.manualAreaFields('ebisu'), travelAreaSource: 'automatic', travelAreaManuallySet: false, travelAreaResolver: 'JP_TRAVEL_AREA' } });
195:   form.elements.travelAreaKey.value = 'harajuku';
196:   form.elements.travelAreaKey.name = 'travelAreaKey';
197:   form.fire('input', { target: form.elements.travelAreaKey });
202:   assert.deepEqual(json(saved.autoTravelArea), original.autoTravelArea);
242:     reload.run('applyPlanningRegionResolution(target, { travelAreaResolved: true, travelAreaKey: "shibuya", travelAreaZh: "澀谷", travelAreaLocal: "渋谷", travelAreaResolutionVersion: 5 })');
243:     assert.equal(final.travelAreaKey, 'harajuku');
245:     assert.deepEqual(json(final.autoTravelArea), original.autoTravelArea);
257:   form.placeEditorSession.dirty.add('travelAreaKey');
258:   form.elements.travelAreaKey.value = 'jp:原宿';
259:   b.run('saveCanonicalAreaOnly(form)'); assert.equal(b.state.places[0].travelAreaKey, 'ebisu');
260:   form.elements.travelAreaKey.value = 'harajuku';
262:   assert.equal(b.state.places[0].travelAreaKey, 'harajuku');
263:   assert.equal(Object.hasOwn(b.state.places[0], 'autoTravelArea'), false);
268:   assert.equal(resolved.travelAreaKey, 'ginza'); assert.equal(resolved.travelAreaResolved, true);
286:   assert.equal(result.travelAreaResolved, false); assert.equal(result.travelAreaKey, '');
287:   assert.equal(result.travelAreaResolutionError, 'AMBIGUOUS_EBISU_DAIKANYAMA');
289:   assert.equal(Object.hasOwn(result, 'travelAreaCandidateKeys'), false);
295:   form.elements.travelAreaKey.value = geo(existing)?.primaryAreaKey || '';
319:     const original = place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: key,
334:   const b = await boot(trip([place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: 'jp:原宿' })]));
338:   const options = b.sheet.innerHTML.match(/name="travelAreaKey">([\s\S]*?)<\/select>/)[1];
345:   const b = await boot(trip([place('harajuku', { ...PlanningGeography.manualAreaFields('harajuku'), travelAreaKey: 'jp:原宿' })]));
347:   edit(form, 'name', 'Catalog corrected'); edit(form, 'travelAreaKey', 'ebisu');
358:     edit(form, 'name', 'Must not save'); edit(form, 'travelAreaKey', key);
370:     autoTravelArea: { ...PlanningGeography.manualAreaFields('shinjuku'), travelAreaSource: 'automatic', travelAreaManuallySet: false },
373:   edit(form, 'travelAreaKey', 'harajuku');
379:   assert.equal(after.travelAreaKey, 'harajuku');
```

## tests/planning-region.test.mjs

```text
28:     assert.equal(result.travelAreaKey, key, title);
30:     assert.equal(result.travelAreaResolved, true);
37:   assert.equal(new Set(results.map((place) => place.travelAreaKey)).size, 1);
39:   assert.equal(new Set(asakusa.map((place) => place.travelAreaKey)).size, 1);
45:   assert.equal(result.travelAreaKey, "shibuya");
70:   assert.equal(result.travelAreaResolved, false);
72:   assert.equal(result.travelAreaKey, "");
78:   assert.equal(korea.travelAreaResolved, false);
79:   assert.equal(us.travelAreaResolved, false);
80:   assert.equal(korea.travelAreaKey, "");
81:   assert.equal(us.travelAreaKey, "");
90:   assert.equal(result.travelAreaKey, "ginza");
```

## tests/social-place-import.test.mjs

```text
586:   assert.equal(response.payload.groups[0].candidates[0].travelAreaKey, "shinjuku");
```

## tests/startup.test.mjs

```text
397:  const payload={...trip("b"),places:[{id:"a",name:"Saved",kind:"attraction",travelAreaKey:"unclassified:a",areaTags:["原宿","表參道"]},{id:"b",name:"Empty",kind:"attraction",areaTags:[]},{id:"c",name:"Old",kind:"attraction"}]};
```

## tests/travel-area-audit.test.mjs

```text
13:    const area=catalog.areas[key];assert.equal(area.travelAreaKey,key);
19:  for(const entry of manifest.areas){assert(entry.travelAreaKey&&entry.travelAreaZh&&entry.travelAreaLocal);assert(Array.isArray(entry.geometryComponents));assert.doesNotMatch(entry.travelAreaZh,/惠比壽西|西新宿|歌舞伎町|丁目/);}
27: const original={travelAreaKey:'ebisu-daikanyama',travelAreaZh:'惠比壽／代官山',travelAreaLocal:'恵比寿／代官山',placeId:'ChIJoriginal',name:'店名不准作證據',photos:[{name:'places/ChIJoriginal/photos/exact'}],restaurantTags:[],latitude:null,longitude:null};
34:  for(const {key,...fields} of cases){const p={...structuredClone(original),...fields};const before=structuredClone(p);const after=audit.reclassify(p,finalCatalog);assert.equal(after.travelAreaKey,key);assert.deepEqual(p,before);for(const field of ['placeId','name','photos','restaurantTags','formattedAddress','latitude','longitude'])assert.deepEqual(after[field],p[field]);assert.equal(audit.reclassify(after,finalCatalog),after);assert.equal(after.travelAreaAuditPrevious.key,'ebisu-daikanyama');}
41:  for(const [text,key] of [['恵比寿','ebisu'],['恵比寿南','ebisu'],['猿楽町','daikanyama'],['代官山町','daikanyama'],['西新宿','shinjuku'],['歌舞伎町','shinjuku'],['上野公園','ueno'],['宇田川町','shibuya'],['道玄坂','shibuya'],['南池袋','ikebukuro']])assert.equal(resolve(text).travelAreaKey,key);
42:  assert.equal(resolve('恵比寿西').travelAreaResolved,false);
```

## tests/ui-logic.test.mjs

```text
17: test("places group only by stable travelAreaKey and retain usable labels while refresh is pending", () => {
24:     travelAreaKey: "shibuya",
27:     travelAreaResolved: true,
28:     travelAreaSource: "automatic",
33:   const stale = { ...shibuya, travelAreaResolved: false, travelAreaResolutionVersion: 3, travelAreaResolutionStatus: "failed" };
42:   const manual = { ...stale, travelAreaSource: "manual", travelAreaManuallySet: true };
44:   assert.match(appSource, /if \(place\.travelAreaSource === "manual" \|\| place\.travelAreaManuallySet === true\) return true/);
45:   assert.match(appSource, /place\.travelAreaResolutionStatus = "failed"/);
46:   assert.doesNotMatch(sourceSection("function applyPlanningRegionResolution", "function planningRegionResolutionKey"), /place\.travelAreaZh = ""|place\.travelAreaLocal = ""|place\.travelAreaKey = ""/);
68:   assert.equal(place.travelAreaResolutionStatus, "failed");
69:   const success = { travelAreaKey: "shibuya", travelAreaZh: "澀谷", travelAreaLocal: "渋谷", travelAreaResolved: true, travelAreaResolutionVersion: 5 };
72:   assert.equal(place.travelAreaResolutionError, undefined);
77:   assert.equal(manual.travelAreaSource, "manual");
88:   assert.match(editor, /name="travelAreaKey"/);
```
