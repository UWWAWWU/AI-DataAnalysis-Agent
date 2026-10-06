export type ModelOption={id:string;label:string};
const SWITCH_CODES=new Set(['AI_HTTP_500','AI_HTTP_502','AI_HTTP_503','AI_HTTP_504','AI_HTTP_404','AI_TIMEOUT','AI_CONNECTION']);
export async function withModelFailover<T>(selected:string,catalog:ModelOption[],run:(id:string)=>Promise<T>,onAttempt?:(id:string,index:number)=>void){
 const available=catalog.map(m=>m.id);const candidates=[...(available.includes(selected)||!available.length?[selected]:[]),...available.filter(id=>id!==selected)].filter((id,i,a)=>a.indexOf(id)===i).slice(0,3);
 let last:unknown;const attempted:string[]=[];
 for(const [index,id] of candidates.entries()){onAttempt?.(id,index);attempted.push(id);try{return {value:await run(id),model:id,attempted}}catch(e){last=e;const code=(e as {code?:string}).code;if(!SWITCH_CODES.has(code||''))throw e;}}
 const error=new Error('The AI models tried could not complete this request. Your uploaded data is retained. Please try again later.') as Error&{code:string;attempted:string[]};error.code='AI_MODELS_UNAVAILABLE';error.attempted=attempted;error.cause=last;throw error;
}
