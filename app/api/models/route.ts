export const runtime='nodejs';
export const maxDuration=60;
import {analysisModels,type ListedModel} from '@/lib/model-options';
import {relinkModels} from '@/lib/relink-provider';
const env=process.env;

export async function GET(){

 const runtime=env as Record<string,unknown>,tasks:{label:string;load:()=>Promise<{id:string;label:string}[]>}[]=[];
 if(runtime.GEMINI_API_KEY)tasks.push({label:'Google',load:async()=>{
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',{headers:{'x-goog-api-key':String(runtime.GEMINI_API_KEY)},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();const data=await response.json() as {models?:ListedModel[]};return analysisModels(data.models||[]);
 }});
 if(runtime.RELINK_API_KEY)tasks.push({label:'API',load:async()=>{
  const response=await fetch(String(runtime.RELINK_BASE_URL||'https://api.relink-gateway.biz.id/v1').replace(/\/$/,'')+'/models',{headers:{Authorization:'Bearer '+String(runtime.RELINK_API_KEY)},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();const models=relinkModels(await response.json());if(!models.length)throw Error();return models;
 }});
 const results=await Promise.allSettled(tasks.map(t=>t.load()));
 const models=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 const unavailable=results.flatMap((r,i)=>r.status==='rejected'?[tasks[i].label]:[]);
 return Response.json({models,defaultModel:models[0]?.id||null,unavailable,...(!models.length&&unavailable.length?{error:'Model options are temporarily unavailable.'}:{})},{status:!models.length&&unavailable.length?502:200,headers:{'Cache-Control':'no-store'}});
}
