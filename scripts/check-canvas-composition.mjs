import ts from 'typescript';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const source=await fs.readFile('lib/canvas-layout.ts','utf8');const {composeDashboard,overlap,chartRows}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const chart=(view,n=5,extra={})=>({title:view,view,labels:Array.from({length:n},(_,i)=>String(i)),values:Array(n).fill(1),...extra});
const cases=[
 ...[7,8,9].map(n=>({name:`${n} charts with a primary relationship`,charts:[chart('scatter'),...Array.from({length:n-1},()=>chart('bar'))],metrics:6,options:{width:1400}})),
 {name:'Long time series with mixed charts',charts:[chart('line',24,{time:true}),chart('bar'),chart('donut'),chart('histogram')],metrics:5,options:{kpiPlacement:'horizontal',width:1400}},
 {name:'Relationship overview',charts:[chart('scatter'),chart('bar'),chart('histogram'),chart('donut')],metrics:5,options:{width:1200}},
 {name:'Four compact comparisons',charts:Array.from({length:4},()=>chart('donut')),metrics:4,options:{width:1400}},
 {name:'Two charts',charts:[chart('line',12,{time:true}),chart('bar')],metrics:3,options:{layout:'charts-first'}},
 {name:'Dense ranking and table',charts:[chart('ranking',100),chart('table',50)],metrics:8,options:{width:900}},
 {name:'Mixed farm charts grouped by visual density',charts:[chart('line',3,{time:true,width:'wide'}),chart('bar',2),chart('histogram',15),chart('scatter'),chart('bar',3),chart('boxplot')],metrics:6,options:{width:1120}},
 {name:'Eleven visuals',charts:Array.from({length:11},(_,i)=>chart(['scatter','bar','donut'][i%3])),metrics:7,options:{}},
 {name:'Twenty-four visuals',charts:Array.from({length:24},()=>chart('bar')),metrics:8,options:{}},
 {name:'Old AI empty coordinates compacted',charts:[chart('bar',4,{position:{x:6,y:8,w:6,h:4,page:1}}),chart('pie')],metrics:5,options:{width:1200}}
];
for(const c of cases){const original=structuredClone(c.charts),keys=c.charts.map((_,i)=>'c'+i),metrics=Array.from({length:c.metrics},(_,i)=>'m'+i),tiles=composeDashboard(c.charts,keys,metrics,c.options);assert.deepEqual(c.charts,original);assert.equal(tiles.length,c.charts.length);assert.equal(new Set(tiles.map(t=>t.key)).size,tiles.length);assert.ok(tiles.every(t=>t.page===0&&t.x>=0&&t.x+t.w<=12));assert.ok(tiles.every((t,i)=>tiles.every((b,j)=>i===j||!overlap(t,b))));for(let y=0;y<Math.max(...tiles.map(t=>t.y+t.h));y++)assert.equal(tiles.filter(t=>t.y<=y&&t.y+t.h>y).reduce((sum,t)=>sum+t.w,0),12,`${c.name}: empty columns at row ${y}`);console.log(c.name,tiles.map(t=>[t.key,t.x,t.y,t.w,t.h]));}
assert.ok(chartRows(chart('ranking',100))>=27);console.log('Adaptive chart grouping, complete canvas coverage, no overlaps, and immutable inputs passed.');

assert.notDeepEqual(composeDashboard([chart('line',24,{time:true}),chart('bar'),chart('histogram'),chart('donut')],['a','b','c','d'],[]),composeDashboard(Array.from({length:4},()=>chart('donut')),['a','b','c','d'],[]));
