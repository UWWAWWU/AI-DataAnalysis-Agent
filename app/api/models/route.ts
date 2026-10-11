import {lapakModels,lapakBase} from '@/lib/provider-routing';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(){
 const key=process.env.LAPAK_ROUTER_API_KEY;
 if(!key)return Response.json({models:[],defaultModel:null,unavailable:['Lapak Router'],error:'Lapak Router is not configured.'},{status:503});
 try{const response=await fetch(lapakBase(process.env)+'/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const models=lapakModels(await response.json());if(!models.length)throw Error();return Response.json({models,defaultModel:models[0].id,unavailable:[]},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({models:[],defaultModel:null,unavailable:['Lapak Router'],error:'Model options are temporarily unavailable.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
