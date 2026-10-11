/** Structural diagnostics only: never include prompts, response prose or credentials. */
export function aiResponseDiagnostics(value:unknown){
 const record=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 const keys=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).filter(key=>/^[a-zA-Z_][a-zA-Z0-9_]{0,31}$/.test(key)).slice(0,20):[];
 const tool=record?.tool as {name?:unknown}|undefined;
 const toolName=tool?['quality','describe','aggregate','correlation','distribution','python'].includes(String(tool.name))?tool.name:'unrecognized':undefined;
 const recommendations=Array.isArray(record?.recommendations)?record.recommendations:[];
 const treatmentTokens=new Set(['keep','remove','median','mean','delete_rows','drop_rows','remove_rows','fill_median','impute_median','fill_mean','impute_mean','keep_data','retain']);
 return {valueType:Array.isArray(value)?'array':value===null?'null':typeof value,keys:keys(record),action:typeof record?.action==='string'&&/^[a-z_]{1,32}$/.test(record.action)?record.action:undefined,purposeType:typeof record?.purpose,purposeLength:typeof record?.purpose==='string'?record.purpose.length:undefined,toolName,recommendationTokens:recommendations.length?recommendations.slice(0,64).map(r=>treatmentTokens.has(r?.recommended)?r.recommended:'unrecognized'):undefined,nested:Object.fromEntries(['decision','tool','plan','response','result','recommendations'].filter(key=>record&&key in record).map(key=>[key,{type:Array.isArray(record![key])?'array':typeof record![key],keys:keys(record![key])}]))};
}
export function providerResponseDiagnostics(value:unknown){
 const data=value as {model?:unknown;choices?:{finish_reason?:unknown;message?:{content?:unknown;reasoning_content?:unknown;refusal?:unknown}}[]};
 const choice=data?.choices?.[0],content=choice?.message?.content;
 const token=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9._:/-]{1,160}$/.test(v)?v:undefined;
 return {reportedModel:token(data?.model),finishReason:token(choice?.finish_reason),choices:Array.isArray(data?.choices)?data.choices.length:0,contentType:Array.isArray(content)?'array':typeof content,contentLength:typeof content==='string'?content.length:undefined,textParts:Array.isArray(content)?content.filter(p=>p&&typeof p==='object'&&(p as {type?:unknown}).type==='text').length:undefined,hasReasoning:typeof choice?.message?.reasoning_content==='string'&&Boolean(choice.message.reasoning_content),hasRefusal:Boolean(choice?.message?.refusal)};
}
