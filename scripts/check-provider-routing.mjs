import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const native=createRequire(import.meta.url),cache=new Map();
function load(file){const absolute=path.resolve(file);if(cache.has(absolute))return cache.get(absolute);const exports={};cache.set(absolute,exports);const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','exports',code)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):name.startsWith('.')?load(path.resolve(path.dirname(absolute),name+'.ts')):native(name),exports);return exports;}
const {POST}=load('app/api/ai/route.ts'),{GET}=load('app/api/models/route.ts'),{lapakModels}=load('lib/provider-routing.ts');
const oldKey=process.env.LAPAK_ROUTER_API_KEY,oldFetch=globalThis.fetch;
const {APPROVED_MODELS}=load('lib/approved-models.ts');
assert.equal(APPROVED_MODELS.length,26);assert.equal(new Set(APPROVED_MODELS).size,26);
assert.deepEqual(new Set(lapakModels({data:[...APPROVED_MODELS.map(id=>({id:id.slice(6)})),{id:'untested-new-model'},{id:'deepseek-v4-flash'},{id:'gemini-3.8-flash'}]}).map(m=>m.id)),new Set(APPROVED_MODELS));
const catalog={data:[{id:'deepseek-v4-flash'},{id:'gpt-5.6-luna'},...['gemini-3.6-flash','gemini-3.7-flash','gemini-3.8-flash','auto','auto-combo','combo-1.0'].map(id=>({id})),{id:'disabled',enabled:false},{id:'whisper'}]};
const good={action:'tool',purpose:'Inspect data quality',tool:{name:'quality'}};
const send=(model,mode='agent',extra={})=>POST(new Request('http://localhost/api/ai',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({mode,model,language:'en',question:'Explore dataset',summary:{profile:{rows:3,columns:[{name:'value',type:'number'}]},...extra},agentContext:{version:1,phase:'running',goal:'Explore',reports:[]}})}));
try{process.env.LAPAK_ROUTER_API_KEY='router-placeholder';const endpoints=[];globalThis.fetch=async(url,init)=>{endpoints.push(String(url));if(String(url).endsWith('/models'))return Response.json(catalog);assert.equal(init.headers.Authorization,'Bearer router-placeholder');return Response.json({model:JSON.parse(init.body).model,choices:[{message:{content:JSON.stringify(good)},finish_reason:'stop'}]});};
const direct=await send('lapak:auto');assert.equal(direct.status,200);assert.equal((await direct.json()).providerModel,'auto');
for(const id of ['gemini-3.8-flash','relink:deepseek-v4-flash','google:gemini-3.8-flash','lapak:disabled','lapak:deepseek-v4-flash','lapak:gemini-3.6-flash','lapak:gemini-3.7-flash','lapak:gemini-3.8-flash'])assert.equal((await send(id)).status,400);
for(const id of ['auto','auto-combo','combo-1.0']){const r=await send('lapak:'+id);assert.equal(r.status,200);assert.equal((await r.json()).providerModel,id);}
const listed=await (await GET()).json();assert.equal(listed.models.length,4);assert.equal(listed.defaultModel,'lapak:auto');assert.ok(listed.models.every(m=>m.id.startsWith('lapak:')));assert.ok(endpoints.every(url=>url.startsWith('https://router.lapakvip.com/api/v1/')));
const finding={id:'missing:value',kind:'missing',column:'value',numeric:true,count:1},recommendation={id:finding.id,recommended:'median',reason:'Numeric median is resistant to extreme values.',impact:'One missing value is replaced; uncertainty remains.',assumption:'An estimate is acceptable for this exploration.'};
globalThis.fetch=async url=>String(url).endsWith('/models')?Response.json(catalog):Response.json({choices:[{message:{content:JSON.stringify({recommendations:[recommendation]})},finish_reason:'stop'}]});
const reviewed=await send('lapak:auto','review',{cleaningFindings:[finding]});assert.equal(reviewed.status,200);assert.deepEqual((await reviewed.json()).recommendations,[recommendation]);
delete process.env.LAPAK_ROUTER_API_KEY;assert.equal((await GET()).status,503);assert.equal((await send('lapak:auto')).status,400);
console.log('Lapak-only catalog, requests, legacy rejection and review recommendation API passed.');
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.LAPAK_ROUTER_API_KEY;else process.env.LAPAK_ROUTER_API_KEY=oldKey;}
