import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/compatible-request.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {requestCompatible}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const init={method:'POST',body:JSON.stringify({model:'test',messages:[{role:'system',content:'Return JSON.'}],response_format:{type:'json_object'}})};
let calls=[];
const result=await requestCompatible('https://example.test',init,async (url,options)=>{
 calls.push(JSON.parse(options.body));
 return calls.length===1?new Response('response_format json_object is not supported',{status:400}):new Response('{"choices":[]}');
});
assert.equal(result.status,200);assert.equal(calls.length,2);
assert.equal(calls[1].response_format,undefined);assert.deepEqual(calls[1].messages,calls[0].messages);
assert.equal(JSON.parse(init.body).response_format.type,'json_object');
for(const [status,message] of [[400,'Invalid model'],[422,'Invalid messages'],[429,'response_format not supported'],[503,'Unavailable']]){
 let count=0;const response=await requestCompatible('https://example.test',init,async()=>{count++;return new Response(message,{status})});
 assert.equal(response.status,status);assert.equal(count,1);
}
console.log('JSON-mode compatibility retry preserves instructions; unrelated errors are not retried.');
