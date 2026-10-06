import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';import readline from 'node:readline';
async function url(file){let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;for(const m of [...code.matchAll(/from ['"](\.\/[^'"]+)['"]/g)])code=code.replaceAll(m[1],await url(path.resolve(path.dirname(file),m[1]+'.ts')));return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64')}
const load=async f=>import(await url(path.resolve(f)));
const {relinkPayload,parseRelinkResponse,relinkModels}=await load('lib/relink-provider.ts');
const {PLAN_SCHEMA,CHAT_SCHEMA,INSIGHT_SCHEMA}=await load('lib/ai-response.ts');
const {PYTHON_INSTRUCTIONS,DASHBOARD_INSTRUCTIONS,validatePlan}=await load('lib/python-contract.ts');
const {validateSpec}=await load('lib/dashboard.ts');
const {insightFacts,renderGroundedAnswer,GROUNDED_INSTRUCTIONS,REVIEW_INSTRUCTIONS}=await load('lib/insight-facts.ts');
const {PRESENTATION_INSTRUCTIONS,patchPresentation}=await load('lib/presentation-patch.ts');
const {profile}=await import('../public/engine.js');
console.log('Ready for hidden live Re:Link credential.');const rl=readline.createInterface({input:process.stdin,terminal:false});let key=await new Promise(r=>rl.once('line',r));rl.close();
const selectedModel=process.argv[2]||'auto';
const rows=[{Region:'A',Sales:20,Date:'2026-01-01'},{Region:'B',Sales:10,Date:'2026-02-01'}],p=profile(rows),result={rows:2,kpis:{Revenue:30},charts:[{title:'Revenue by region',labels:['A','B'],values:[20,10]}],definitions:[],cleaning_log:[]};
const spec={layout:'kpi-first',countryColumn:'Region',dateColumn:'Date',metrics:[{id:'revenue',operation:'sum',columns:['Sales'],rules:[]}],kpis:[{label:'Revenue',metric:'revenue'}],charts:[{title:'Revenue by region',view:'bar',width:'wide',metric:'revenue',groupBy:'Region',time:false,limit:10}]};
const facts=insightFacts(p,result);
try{
 const catalogResponse=await fetch('https://api.relink-gateway.biz.id/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});assert.ok(catalogResponse.ok);const models=relinkModels(await catalogResponse.json());assert.ok(models.some(m=>m.id==='relink:'+selectedModel));console.log(JSON.stringify({availableModels:models.map(m=>m.id)}));
 const checks=[['plan',PYTHON_INSTRUCTIONS+DASHBOARD_INSTRUCTIONS,PLAN_SCHEMA,'Choose useful analysis and a dashboard for this dataset.'],['presentation',GROUNDED_INSTRUCTIONS+REVIEW_INSTRUCTIONS+PRESENTATION_INSTRUCTIONS,CHAT_SCHEMA,'Change only Revenue by region to a horizontal ranking bar chart. Preserve the existing KPI and metric definition.'],['insight',GROUNDED_INSTRUCTIONS,INSIGHT_SCHEMA,'Explain the revenue and category figures from the verified facts.']];
 for(const [kind,instructions,schema,question] of checks){let passed=false;for(let attempt=0;attempt<2;attempt++){
  const payload={systemInstruction:{parts:[{text:instructions+' Respond in English.'}]},contents:[{parts:[{text:JSON.stringify({question,verifiedFacts:facts,summary:{profile:{rows:p.rows,duplicates:p.duplicates,columns:p.columns},filter:{},previousDashboard:spec},toolResult:result})+(attempt?'\nReturn complete schema-compliant JSON using only the supplied columns.':'')}]}],generationConfig:{maxOutputTokens:8192,responseJsonSchema:schema}};
  const r=await fetch('https://api.relink-gateway.biz.id/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(relinkPayload(payload,selectedModel)),signal:AbortSignal.timeout(55000)});if(!r.ok){const e=await r.json();throw Object.assign(new Error('Provider rejected request'),{code:e.error?.code,status:r.status})}
  try{const raw=parseRelinkResponse(await r.json());if(kind==='plan'){const plan=validatePlan({...raw,code:'# Trusted calculation'});validateSpec(plan.dashboard,p.columns.map(c=>c.name));}else{const answer=renderGroundedAnswer(raw,facts);if(kind==='presentation'){assert.equal(answer.action,'presentation');const next=patchPresentation(spec,answer.chartChanges);assert.equal(next.charts[0].view,'ranking');assert.deepEqual(next.metrics,spec.metrics);assert.deepEqual(next.kpis,spec.kpis);}else{assert.equal(answer.action,'answer');for(const observation of raw.observations||[])for(const id of observation.factIds||[])assert.ok(facts.some(f=>f.id===id));}}passed=true;break;}catch(e){if(attempt===1)throw e;}
 }assert.ok(passed);console.log('LIVE RELINK '+kind+': passed');}
 console.log('3/3 live Re:Link analysis and conversation checks passed.');
}catch(e){console.log(JSON.stringify({failure:e.name,code:e.code,status:e.status,message:e.message?.slice(0,200)}));process.exitCode=1;}finally{key='';}
