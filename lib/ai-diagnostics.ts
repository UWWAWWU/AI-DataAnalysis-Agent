/** Structural diagnostics only: never include prompts, response prose or credentials. */
export function aiResponseDiagnostics(value:unknown){
 const record=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 const keys=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).filter(key=>/^[a-zA-Z_][a-zA-Z0-9_]{0,31}$/.test(key)).slice(0,20):[];
 return {valueType:Array.isArray(value)?'array':value===null?'null':typeof value,keys:keys(record),action:typeof record?.action==='string'&&/^[a-z_]{1,32}$/.test(record.action)?record.action:undefined,purposeType:typeof record?.purpose,purposeLength:typeof record?.purpose==='string'?record.purpose.length:undefined,nested:Object.fromEntries(['decision','plan','response','result','recommendations'].filter(key=>record&&key in record).map(key=>[key,{type:Array.isArray(record![key])?'array':typeof record![key],keys:keys(record![key])}]))};
}
