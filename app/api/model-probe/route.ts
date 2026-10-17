import {lapakBase,lapakModels,LAPAK_PREFIX} from '@/lib/provider-routing';
import {requestProvider} from '@/lib/provider-request';
import {providerResponseDiagnostics} from '@/lib/ai-diagnostics';
export const runtime='nodejs';
export const maxDuration=60;
/** Fixed, small diagnostics: no dataset, custom prompt, response prose or secrets. */
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid request origin.'},{status:403});
 try{
  const raw=await request.text();if(raw.length>1000)return Response.json({error:'Probe request is too large.'},{status:413});
  const body=JSON.parse(raw),model=String(body.model||''),format=body.format||'plain',namespace=body.namespace||'catalog';
  if(!model.startsWith(LAPAK_PREFIX)||!['plain','json_object','json_schema'].includes(format)||!['catalog','lv'].includes(namespace))return Response.json({error:'Invalid probe options.'},{status:400});
  const key=process.env.LAPAK_ROUTER_API_KEY;if(!key)return Response.json({error:'The AI service is not configured.'},{status:503});
  const base=lapakBase(process.env),signal=AbortSignal.any([request.signal,AbortSignal.timeout(45000)]);
  const catalog=await fetch(base+'/models',{headers:{Authorization:'Bearer '+key},signal});
  if(!catalog.ok)return Response.json({error:'Provider catalog unavailable.',providerStatus:catalog.status},{status:502});
  if(!lapakModels(await catalog.json()).some(m=>m.id===model))return Response.json({error:'Model is not in the active catalog.'},{status:400});
  const id=model.slice(LAPAK_PREFIX.length),requestedModel=namespace==='lv'?'lv/'+id.replace(/^lv\//,''):id;
  const payload={model:requestedModel,messages:[{role:'user',content:format==='plain'?'Reply with exactly OK.':'Reply with exactly the JSON object {"ok":true}.'}],max_tokens:64,...(format==='plain'?{}:{response_format:format==='json_object'?{type:'json_object'}:{type:'json_schema',json_schema:{name:'probe',strict:false,schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false}}}})};
  const response=await requestProvider(base+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal},fetch,35000);
  const data=await response.json().catch(()=>null);const message=typeof data?.error?.message==='string'?data.error.message:'';
  const categories=[...(/response_format|json_schema|json_object|structured.?output/i.test(message)?['response_format']:[]),...(/unknown model|invalid model|model.*not found|model.*not supported|model.*tidak|model_disabled/i.test(message)?['model_identifier']:[]),...(/quota|credit|saldo|rate.limit|capacity|busy|overload|exhaust/i.test(message)?['capacity_or_quota']:[]),...(/api.?key|unauthori|authentication|credential/i.test(message)?['authentication']:[])];
  const text=data?.choices?.[0]?.message?.content;let acknowledged=false;
  if(response.ok&&typeof text==='string'){if(format==='plain')acknowledged=text.trim()==='OK';else{try{acknowledged=JSON.parse(text).ok===true}catch{}}}
  return Response.json({model,requestedModel,format,namespace,providerHost:new URL(base).hostname,providerStatus:response.status,acknowledged,errorCategories:categories,diagnostics:providerResponseDiagnostics(data)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error&&['TimeoutError','AbortError'].includes(e.name)?'Probe timed out.':'Probe failed.',code:e instanceof SyntaxError?'INVALID_REQUEST':'PROBE_FAILED'},{status:502});}
}
