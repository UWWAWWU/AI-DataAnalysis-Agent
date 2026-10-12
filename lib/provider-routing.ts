import {relinkModels} from './relink-provider';
export const LAPAK_PREFIX='lapak:';
export const LAPAK_BASE_URL='https://router.lapakvip.com/api/v1';
export function lapakModels(data:unknown){
 return relinkModels(data).map(m=>({id:LAPAK_PREFIX+m.id.replace(/^relink:/,''),label:m.label}));
}
export function lapakBase(env:Record<string,unknown>){return String(env.LAPAK_ROUTER_BASE_URL||LAPAK_BASE_URL).replace(/\/$/,'');}
