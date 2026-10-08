import {relinkModels} from './relink-provider';
export const LAPAK_PREFIX='lapak:';
export const LAPAK_BASE_URL='https://router.lapakvip.com/api/v1';
export function geminiKeys(env:Record<string,unknown>,personal?:unknown){
 const dedicated=[env.GEMINI_API_KEY_1,env.GEMINI_API_KEY_2].filter((key):key is string=>typeof key==='string'&&Boolean(key.trim()));
 return [...new Set(dedicated.length?dedicated:[env.GEMINI_API_KEY,personal].filter((key):key is string=>typeof key==='string'&&Boolean(key.trim())))];
}
export function lapakModels(data:unknown){
 return relinkModels(data).map(m=>({id:LAPAK_PREFIX+m.id.replace(/^relink:/,''),label:m.label})).filter(m=>!/(?:^|[/:])gemini(?:-|$)/i.test(m.label)&&!/(?:^|[/:])(?:auto(?:-combo)?|combo-\d+(?:\.\d+)?)(?:$)/i.test(m.label));
}
export function lapakBase(env:Record<string,unknown>){return String(env.LAPAK_ROUTER_BASE_URL||LAPAK_BASE_URL).replace(/\/$/,'');}
