export const runtime='nodejs';
export const maxDuration=60;
import {analysisModels,type ListedModel} from '@/lib/model-options';
import {relinkModels,isTestedModel} from '@/lib/relink-provider';
import {geminiKeys,lapakModels,lapakBase} from '@/lib/provider-routing';
const env=process.env;
export async function GET(request:Request){
 const catalogMode=new URL(request.url).searchParams.get('catalog')==='all';
 const runtime=env as Record<string,unknown>,tasks:{label:string;load:()=>Promise<{id:string;label:string}[]>}[]=[];
 for(const [index,key] of geminiKeys(runtime).entries())tasks.push({label:'Google API '+(index+1),load:async()=>{
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();const data=await response.json() as {models?:ListedModel[]};return analysisModels(data.models||[]);
 }});
 if(runtime.LAPAK_ROUTER_API_KEY)tasks.push({label:'API',load:async()=>{
  const response=await fetch(lapakBase(runtime)+'/models',{headers:{Authorization:'Bearer '+String(runtime.LAPAK_ROUTER_API_KEY)},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();return lapakModels(await response.json());
 }});else if(runtime.RELINK_API_KEY)tasks.push({label:'API',load:async()=>{
  const response=await fetch(String(runtime.RELINK_BASE_URL||'https://api.relink-gateway.biz.id/v1').replace(/\/$/,'')+'/models',{headers:{Authorization:'Bearer '+String(runtime.RELINK_API_KEY)},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();const models=relinkModels(await response.json());if(!models.length)throw Error();return catalogMode?models:models.filter(m=>isTestedModel(m.id.replace(/^relink:/,'')));
 }});
 const results=await Promise.allSettled(tasks.map(t=>t.load()));
 const all=results.flatMap(r=>r.status==='fulfilled'?r.value:[]),seen=new Set<string>();
 const google=analysisModels(all.filter(m=>m.id.startsWith('gemini-')).map(m=>({name:m.id,supportedGenerationMethods:['generateContent']})));
 const models=[...google,...all.filter(m=>!m.id.startsWith('gemini-'))].filter(m=>{if(seen.has(m.id))return false;seen.add(m.id);return true;});
 const unavailable=results.flatMap((r,i)=>r.status==='rejected'?[tasks[i].label]:[]);
 return Response.json({models,defaultModel:models[0]?.id||null,unavailable,...(!models.length&&unavailable.length?{error:'Model options are temporarily unavailable.'}:{})},{status:!models.length&&unavailable.length?502:200,headers:{'Cache-Control':'no-store'}});
}
