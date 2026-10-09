import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/model-failover.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {withModelFailover,clearModelCooldowns}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const models=['a','b','c','d'].map(id=>({id,label:id}));const failure=code=>Object.assign(new Error('failed'),{code});
let seen=[];clearModelCooldowns();const r=await withModelFailover('a',models,async id=>{seen.push(id);if(id==='a')throw failure('AI_HTTP_503');return {ok:true}});assert.deepEqual(seen,['a','b']);assert.equal(r.model,'b');assert.deepEqual(r.attempted,['a','b']);
clearModelCooldowns();seen=[];await withModelFailover('b',models,async id=>{seen.push(id);if(id==='b')throw failure('AI_TIMEOUT');return true});assert.deepEqual(seen,['b','c']);
clearModelCooldowns();seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_HTTP_429')}));assert.deepEqual(seen,['a','b','c','d']);
clearModelCooldowns();seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_HTTP_503')}),e=>e.code==='AI_MODELS_UNAVAILABLE');assert.deepEqual(seen,['a','b','c','d']);
clearModelCooldowns();seen=[];await withModelFailover('removed',models,async id=>{seen.push(id);return true});assert.deepEqual(seen,['a']);
clearModelCooldowns();seen=[];await withModelFailover('selected',[],async id=>{seen.push(id);return true});assert.deepEqual(seen,['selected']);
clearModelCooldowns();seen=[];await assert.rejects(withModelFailover('a',models,async id=>{seen.push(id);throw failure('AI_VALIDATION')}));assert.deepEqual(seen,['a','b','c','d']);
clearModelCooldowns();seen=[];const events=[];await assert.rejects(withModelFailover('c',models,async id=>{seen.push(id);throw failure('AI_HTTP_503')},(id,index,previous)=>events.push({id,index,previous})),e=>e.code==='AI_MODELS_UNAVAILABLE');assert.deepEqual(seen,['c','d','a','b']);assert.equal(events[1].previous.model,'c');assert.equal(events[1].previous.code,'AI_HTTP_503');
console.log('Failover checks passed: circular order, cross-provider traversal, quota/timeout/validation fallback, every model once, previous failure status, and exhaustion.');

const mixed=[{id:'gemini-3.8-flash',label:'Gemini'},{id:'relink:gpt-5.6',label:'GPT'},{id:'relink:gpt-5.6-luna',label:'Luna'}];clearModelCooldowns();seen=[];await withModelFailover('relink:gpt-5.6',mixed,async id=>{seen.push(id);if(id!=='gemini-3.8-flash')throw failure('AI_TIMEOUT');return true});assert.deepEqual(seen,['relink:gpt-5.6','gemini-3.8-flash']);

clearModelCooldowns();seen=[];await withModelFailover('a',models,async id=>{if(id==='a')throw failure('AI_TIMEOUT');return true});await withModelFailover('a',models,async id=>{seen.push(id);return true});assert.deepEqual(seen,['b'],'A recently failed model must not be retried on the next decision');console.log('Recent failure cooldown passed.');

clearModelCooldowns();seen=[];await withModelFailover('gemini-3.8-flash',[{id:'gemini-3.8-flash',label:'Gemini'},{id:'gemini-3.7-flash',label:'Gemini'},{id:'relink:deepseek-v4-flash',label:'DeepSeek'}],async id=>{seen.push(id);if(id.startsWith('gemini'))throw failure('AI_TIMEOUT');return true});assert.deepEqual(seen,['gemini-3.8-flash','relink:deepseek-v4-flash']);console.log('Fallback prioritizes a different model family after failure.');
