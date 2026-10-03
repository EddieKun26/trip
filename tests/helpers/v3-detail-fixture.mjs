// Dependencies for narrow identity/editor fixtures. Executes the shipped V3 renderer;
// only unrelated scheduling, device and network surfaces receive inert defaults.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import TripWorkspace from '../../lib/trip-workspace.js';
import PlanningGeography from '../../lib/planning-geography.js';
export function installV3Detail(context){
  const defaults={document:{activeElement:null},TripWorkspace,PlanningGeography,dateMeta:[['9/20','週日']],cloneValue:structuredClone,
    getUnscheduledPlaces:()=>({entries:[]}),placePoolSelectedKeys:()=>new Set(),placePoolConstraintFor:()=>[],
    focusActiveMapOnPlace:()=>{},hydratePlannerPlaceHours:async()=>{},plannerHoursWindows:()=>null,
    plannerHoursGooglePlaceId:()=>'',plannerHoursFailures:new Set()};
  for(const [key,value] of Object.entries(defaults))if(!(key in context))context[key]=value;
  context.state.itinerary ||= {};context.state.selectedDate ||= '9/20';
  context.sheetRoot.querySelector ||= ()=>null;
  vm.runInContext(readFileSync(new URL('../../workspace-v3.js',import.meta.url),'utf8'),context);
}
