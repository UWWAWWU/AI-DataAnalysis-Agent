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
const schemaInit={...init,body:JSON.stringify({...JSON.parse(init.body),response_format:{type:'json_schema',json_schema:{name:'test',schema:{type:'object'}}}})};
calls=[];
const schemaResult=await requestCompatible('https://example.test',schemaInit,async(url,options)=>{
 calls.push(JSON.parse(options.body));
 return calls.length<3?new Response('response_format '+calls.at(-1).response_format.type+' is not supported',{status:422}):new Response('{}');
});
assert.equal(schemaResult.status,200);
assert.deepEqual(calls.map(c=>c.response_format?.type),['json_schema','json_object',undefined]);
assert.ok(calls.every(c=>c.model==='test'&&JSON.stringify(c.messages)===JSON.stringify(calls[0].messages)));
assert.equal(JSON.parse(schemaInit.body).response_format.type,'json_schema');
let invalidSchemaCalls=0;
const invalidSchema=await requestCompatible('https://example.test',schemaInit,async()=>{invalidSchemaCalls++;return new Response('Invalid json_schema: required field missing',{status:400});});
assert.equal(invalidSchema.status,400);assert.equal(invalidSchemaCalls,1);
console.log('Schema -> JSON -> prompt compatibility preserves model and instructions; invalid schemas and unrelated errors are not retried.');
