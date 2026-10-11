/** Some compatible providers support chat completions but not JSON mode. */
export async function requestCompatible(url:string,init:RequestInit,fetcher:typeof fetch=fetch){
 const response=await fetcher(url,init);
 if(response.status!==400&&response.status!==422)return response;
 const body=typeof init.body==='string'?JSON.parse(init.body):null;
 if(!body?.response_format)return response;
 const detail=await response.clone().text();
 if(!/response_format|json_object|json mode/i.test(detail)||!/unsupported|not supported|not support|invalid|not available/i.test(detail))return response;
 const {response_format:unused,...compatible}=body;
 return fetcher(url,{...init,body:JSON.stringify(compatible)});
}
