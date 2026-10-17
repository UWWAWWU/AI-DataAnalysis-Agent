import {lapakModels,lapakBase} from '@/lib/provider-routing';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(){
 const key=process.env.LAPAK_ROUTER_API_KEY;
 if(!key)return Response.json({models:[],defaultModel:null,unavailable:['AI service'],error:'The AI service is not configured.'},{status:503});
 let providerStatus:number|undefined;
 try{const response=await fetch(lapakBase(process.env)+'/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});providerStatus=response.status;if(!response.ok)throw Error();const models=lapakModels(await response.json());if(!models.length)throw Error();const defaultModel=models.find(m=>m.id==='lapak:auto')?.id||models[0].id;return Response.json({models,defaultModel,unavailable:[]},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({models:[],defaultModel:null,unavailable:['AI service'],error:'Model options are temporarily unavailable.',code:'AI_CATALOG_UNAVAILABLE',providerStatus},{status:502,headers:{'Cache-Control':'no-store'}});}
}
