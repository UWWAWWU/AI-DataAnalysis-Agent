import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/model-failover.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {withModelFailover}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const models=['a','b','c','d'].map(id=>({id,label:id}));const failure=code=>Object.assign(new Error('failed'),{code});
let seen=[];const r=await withModelFailover('a',models,async id=>{seen.push(id);if(id==='a')throw failure('AI_HTTP_503');return {ok:true}});assert.deepEqual(seen,['a','b']);assert.equal(r.model,'b');assert.deepEqual(r.attempted,['a','b']);
seen=[];await withModelFailover('b',models,async id=>{seen.push(id);if(id==='b')throw failure('AI_TIMEOUT');return true});assert.deepEqual(seen,['b','c']);
seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_HTTP_429')}));assert.deepEqual(seen,['a','b','c','d']);
seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_HTTP_503')}),e=>e.code==='AI_MODELS_UNAVAILABLE');assert.deepEqual(seen,['a','b','c','d']);
seen=[];await withModelFailover('removed',models,async id=>{seen.push(id);return true});assert.deepEqual(seen,['a']);
seen=[];await withModelFailover('selected',[],async id=>{seen.push(id);return true});assert.deepEqual(seen,['selected']);
seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_VALIDATION')}));assert.deepEqual(seen,['a','b','c','d']);
seen=[];const events=[];await assert.rejects(withModelFailover('c',models,async id=>{seen.push(id);throw failure('AI_HTTP_503')},(id,index,previous)=>events.push({id,index,previous})),e=>e.code==='AI_MODELS_UNAVAILABLE');assert.deepEqual(seen,['c','d','a','b']);assert.equal(events[1].previous.model,'c');assert.equal(events[1].previous.code,'AI_HTTP_503');
console.log('Failover checks passed: circular order, cross-provider traversal, quota/timeout/validation fallback, every model once, previous failure status, and exhaustion.');

const mixed=[{id:'gemini-3.8-flash',label:'Gemini'},{id:'relink:gpt-5.6',label:'GPT'},{id:'relink:gpt-5.6-luna',label:'Luna'}];seen=[];await withModelFailover('relink:gpt-5.6',mixed,async id=>{seen.push(id);if(id!=='gemini-3.8-flash')throw failure('AI_TIMEOUT');return true});assert.deepEqual(seen,['relink:gpt-5.6','relink:gpt-5.6-luna','gemini-3.8-flash']);
