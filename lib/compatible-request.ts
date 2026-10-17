/** Some compatible providers support chat completions but not JSON mode. */
export async function requestCompatible(url:string,init:RequestInit,fetcher:typeof fetch=fetch){
 const body=typeof init.body==='string'?JSON.parse(init.body):null;
 let options=init;
 for(let attempt=0;attempt<3;attempt++){
  const response=await fetcher(url,options);
  if((response.status!==400&&response.status!==422)||!body?.response_format)return response;
  const detail=await response.clone().text();
  if(!/response_format|json_schema|json_object|json mode/i.test(detail)||!/unsupported|not supported|not support|not available/i.test(detail))return response;
  // Keep the same model, messages, deadline and application validation.
  if(body.response_format.type==='json_schema')body.response_format={type:'json_object'};
  else delete body.response_format;
  options={...init,body:JSON.stringify(body)};
 }
 throw Error('Response-format compatibility exhausted.');
}
