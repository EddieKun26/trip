import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import mig from '../../lib/canonical-travel-migration.js';

export const source = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
export const section = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a);
  return source.slice(a, b);
};
export const tick = () => new Promise(resolve => setImmediate(resolve));
export function gateContext({tripId=mig.TRIP, ready=true, editor=true, outcome=mig.MIGRATED, trip=null, execute, transport}={}) {
  const calls={containment:0,backfill:0,runs:0,applied:0,renders:0,toasts:[],warnings:[],infos:[],requests:[]};
  const context=vm.createContext({
    state:{tripId,hydrationStatus:ready?'ready':'loading',hydratedTripId:ready?tripId:'',hydratedMemberId:ready?'test-editor':'',
      profile:{id:'test-editor',nickname:'Test'},isGuest:!editor,trips:editor?[{id:tripId}]:[]},
    tripContextVersion:1, console:{warn:line=>calls.warnings.push(line),info:line=>calls.infos.push(line)},
    currentMemberId:()=> 'test-editor',
    scheduleContainmentMigration:()=>calls.containment++,scheduleTagBackfillMigration:()=>calls.backfill++,
    applySharedTrip:()=>{calls.applied++;},render:()=>calls.renders++,showToast:line=>calls.toasts.push(line),
    loadAreaGeometry:async()=>({areas:{}}),
    readAppJson:async(url,options={})=>{calls.requests.push({url,options});return transport?transport(url,options):{ok:true,payload:{}};},
    AreaTags:{cleanPlace:p=>p},TravelAreaAudit:{reclassify:p=>p},
    CanonicalTravelManifest:{rows:[],placeStableIds:[],baselineFields:{}},CanonicalTravelCatalog:{catalog:{}},
    CanonicalTravelMigration:{...mig,run:async options=>{calls.runs++;return execute?execute(options):{outcome,trip,stage:'done',schedulersReleased:mig.RELEASES_SCHEDULERS.has(outcome)};}},
  });
  vm.runInContext(section('function tripIsHydrated','function safeMainTab')+section('function canEdit()', 'function canManageShopping')
    +section('const canonicalAreaSessions','// A whitelisted tag string'),context);
  const readyNow=(id=context.state.tripId)=>{Object.assign(context.state,{tripId:id,hydrationStatus:'ready',hydratedTripId:id,hydratedMemberId:'test-editor',trips:editor?[{id}]:[]});};
  return {context,calls,readyNow,registry:()=>vm.runInContext('canonicalAreaSessions',context)};
}
