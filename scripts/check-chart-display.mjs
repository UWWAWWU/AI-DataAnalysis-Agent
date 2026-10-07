import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const src=ts.transpileModule(fs.readFileSync('lib/chart-display.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {chartDisplay,categoryColor,histogram}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const scatter={title:'Bill vs tip',view:'scatter',labels:[],values:[],xColumn:'bill',yColumn:'tip',points:[{x:10,y:1,group:'Sun'},{x:30,y:5,group:'Sun'},{x:20,y:3,group:'Sat'}]};const original=JSON.stringify(scatter);
assert.equal(chartDisplay(scatter,'scatter').options[0],'scatter');assert.equal(chartDisplay(scatter,'bar').options.length,11);
assert.deepEqual(chartDisplay(scatter,'bar').data,[{name:'Sun',value:3},{name:'Sat',value:3}]);assert.deepEqual(chartDisplay(scatter,'pie').data,[{name:'Sun',value:2},{name:'Sat',value:1}]);assert.equal(chartDisplay(scatter,'histogram').data.reduce((s,d)=>s+d.value,0),3);assert.deepEqual(chartDisplay(scatter,'boxplot').boxes[0],{name:'Sun',low:1,q1:2,median:3,q3:4,high:5});assert.equal(JSON.stringify(scatter),original);
const box={title:'Tip by day',view:'boxplot',labels:[],values:[],boxes:[{name:'Sun',low:1,q1:2,median:3,q3:4,high:5}]};assert.deepEqual(chartDisplay(box,'bar').data,[{name:'Sun',value:3}]);assert.ok(!chartDisplay(box,'bar').options.includes('scatter'));
const agg={title:'By day',view:'ranking',labels:['Sun','Sat'],values:[10,-5]};assert.equal(chartDisplay(agg,'bar').options[0],'ranking');assert.ok(!chartDisplay(agg,'bar').options.includes('pie'));assert.ok(!chartDisplay(agg,'bar').options.includes('boxplot'));
assert.equal(histogram([5,5,5],4).reduce((s,d)=>s+d.value,0),3);assert.equal(categoryColor('Sun'),categoryColor(' SUN '));assert.ok(new Set(['Sun','Sat','Thur','Fri'].map(categoryColor)).size>=3);
console.log('Adaptive chart display checks passed: AI default, 11 paired-data views, group means/counts, histogram totals, quartiles, negative values, stable colors and immutable inputs.');

const many={...scatter,points:Array.from({length:30},(_,i)=>({x:i,y:i*2,group:String(i)}))};assert.equal(chartDisplay(many,"bar").data.length,10);assert.equal(chartDisplay({...scatter,view:"histogram",labels:["0 — 10","10 — 20"],values:[1,2]},"bar").data[1].value,2);

assert.notEqual(categoryColor("Lunch"),categoryColor("Dinner"));
