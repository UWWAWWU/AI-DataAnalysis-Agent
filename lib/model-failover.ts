export type ModelOption={id:string;label:string};
const SWITCH_CODES=new Set(['AI_HTTP_400','AI_HTTP_401','AI_HTTP_403','AI_HTTP_429','AI_HTTP_500','AI_HTTP_502','AI_HTTP_503','AI_HTTP_504','AI_HTTP_404','AI_TIMEOUT','AI_CONNECTION','AI_MODEL_DISABLED','AI_MODEL_UNAVAILABLE','AI_CONFIGURATION','AI_REQUEST','AI_VALIDATION','AI_JSON','AI_EMPTY','AI_TRUNCATED']);
export async function withModelFailover<T>(selected:string,catalog:ModelOption[],run:(id:string)=>Promise<T>,onAttempt?:(id:string,index:number,previous?:{model:string;code:string;message:string})=>void){
 const available=[...new Set(catalog.map(m=>m.id))];const start=available.indexOf(selected);
 const candidates=available.length?(start<0?available:[...available.slice(start),...available.slice(0,start)]):[selected];
 let last:unknown;let previous:{model:string;code:string;message:string}|undefined;const attempted:string[]=[];
 for(const [index,id] of candidates.entries()){onAttempt?.(id,index,previous);attempted.push(id);try{return {value:await run(id),model:id,attempted}}catch(e){last=e;const code=(e as {code?:string}).code||'';if(!SWITCH_CODES.has(code))throw e;previous={model:id,code,message:e instanceof Error?e.message:'Request failed'};}}
 const error=new Error('All available models failed to complete this request. Your uploaded data is retained. Please retry the analysis.'+(last instanceof Error?' Last error: '+last.message:'')) as Error&{code:string;attempted:string[]};error.code='AI_MODELS_UNAVAILABLE';error.attempted=attempted;error.cause=last;throw error;
}
