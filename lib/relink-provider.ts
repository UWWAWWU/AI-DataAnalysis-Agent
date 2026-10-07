import {AIResponseError,parseAIResponse} from './ai-response';
export const RELINK_PREFIX='relink:';
// Account-accessible models verified through the deployed agent on 2026-10-07.
export const TESTED_MODELS=['deepseek-v4-flash','deepseek-v4-flash-0731','deepseek-v4-flash-vision-exp','deepseek-v4-mod','deepseek-v4-pro-0813','deepseek-v4.1-flash','deepseek-v4.1-mod','gpt-5.6','gpt-5.6-luna','auto','glm-5.3','glm-5.3-mod','glm-5.3-flashx','kimi-k3','kimi-k3-mod'] as const;
export const isTestedModel=(id:string)=>TESTED_MODELS.some(model=>model===id);
export function relinkModels(data:unknown){
 const catalog=(data as {data?:{id?:unknown;enabled?:boolean;available?:boolean;modalities?:{output?:string[]}}[]})?.data;
 if(!Array.isArray(catalog))return [];
 const ids=[...new Set(catalog.filter(m=>m.enabled!==false&&m.available!==false&&(!m.modalities?.output?.length||m.modalities.output.includes('text'))).map(m=>m.id).filter((id):id is string=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,150}$/.test(id)&&!/(embed|whisper|tts|image|dall-e|rerank|video)/i.test(id)))];
 return ids.sort((a,b)=>Number(isTestedModel(b))-Number(isTestedModel(a))||a.localeCompare(b)).filter(id=>!/^gemini-[012](?:[.-]|$)/i.test(id)).map(id=>({id:RELINK_PREFIX+id,label:id}));
}
export function relinkError(code:unknown){
 if(code==='model_disabled')return 'This model is not enabled for your provider account. Choose another model or check your provider settings.';
 return null;
}
export function relinkPayload(payload:any,model:string){
 const schema=payload.generationConfig.responseJsonSchema;
 return {model,messages:[{role:'system',content:payload.systemInstruction.parts.map((p:any)=>p.text).join('\n')+(schema?'\nReturn a JSON object conforming to this JSON Schema. Include every required field; no Markdown or surrounding text.\n'+JSON.stringify(schema):'')},{role:'user',content:payload.contents[0].parts.map((p:any)=>p.text).join('\n')}],max_tokens:payload.generationConfig.maxOutputTokens,response_format:{type:'json_object'}};
}
export function parseRelinkResponse(response:any){
 const choice=response?.choices?.[0];
 if(choice?.finish_reason==='length')throw new AIResponseError('AI_TRUNCATED','The AI response reached its output limit. Please retry the analysis.');
 if(choice?.finish_reason==='content_filter'||choice?.message?.refusal)throw new AIResponseError('AI_BLOCKED','The AI service blocked this request. Try a different analysis request.');
 const content=choice?.message?.content;
 const text=typeof content==='string'?content:Array.isArray(content)?content.filter((p:any)=>p.type==='text').map((p:any)=>p.text||'').join('\n'):'';
 return parseAIResponse({candidates:[{content:{parts:[{text}]}}]});
}
