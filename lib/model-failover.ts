export type ModelOption={id:string;label:string};
const SWITCH_CODES=new Set(['AI_HTTP_400','AI_HTTP_401','AI_HTTP_403','AI_HTTP_429','AI_HTTP_500','AI_HTTP_502','AI_HTTP_503','AI_HTTP_504','AI_HTTP_404','AI_TIMEOUT','AI_CONNECTION','AI_MODEL_DISABLED','AI_MODEL_UNAVAILABLE','AI_CONFIGURATION','AI_REQUEST','AI_VALIDATION','AI_JSON','AI_EMPTY','AI_TRUNCATED','AI_CATALOG_UNAVAILABLE']);
const cooldowns=new Map<string,number>();
const modelFamily=(id:string)=>id.replace(/^relink:/,'').match(/^[a-z]+/i)?.[0]?.toLowerCase()||id;
export function clearModelCooldowns(){cooldowns.clear()}
export async function withModelFailover<T>(selected:string,catalog:ModelOption[],run:(id:string)=>Promise<T>,onAttempt?:(id:string,index:number,previous?:{model:string;code:string;message:string},total?:number)=>void){
 const available=[...new Set(catalog.map(m=>m.id))];const start=available.indexOf(selected);
 const ordered=available.length?(start<0?available:[...available.slice(start),...available.slice(0,start)]):[selected];
 const ready=ordered.filter(id=>(cooldowns.get(id)||0)<=Date.now());const candidates=ready.length?ready:[ordered.reduce((a,b)=>(cooldowns.get(a)||0)<(cooldowns.get(b)||0)?a:b)];
 let last:unknown;let previous:{model:string;code:string;message:string}|undefined;const attempted:string[]=[];
 for(const [index,id] of candidates.entries()){onAttempt?.(id,index,previous,candidates.length);attempted.push(id);try{const value=await run(id);cooldowns.delete(id);return {value,model:id,attempted}}catch(e){last=e;const code=(e as {code?:string}).code||'';if(!SWITCH_CODES.has(code))throw e;cooldowns.set(id,Date.now()+5*60*1000);previous={model:id,code,message:e instanceof Error?e.message:'Request failed'};const next=candidates.findIndex((candidate,j)=>j>index&&modelFamily(candidate)!==modelFamily(id));if(next>index+1)candidates.splice(index+1,0,candidates.splice(next,1)[0]);}}
 const error=new Error('All available models failed to complete this request. Your uploaded data is retained. Please retry the analysis.'+(last instanceof Error?' Last error: '+last.message:'')) as Error&{code:string;attempted:string[]};error.code='AI_MODELS_UNAVAILABLE';error.attempted=attempted;error.cause=last;throw error;
}
