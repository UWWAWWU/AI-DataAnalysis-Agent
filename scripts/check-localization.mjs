import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const module=async p=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {protectText,restoreText,translationBatches}=await module('lib/localization.ts');
const input='Quantity: 244 at 2010-12-01 08:26. Total: 4,827.77. Use `df["Quantity"]` and https://example.com/123.';
const protectedText=protectText(input,['Quantity']);assert.equal(restoreText(protectedText.text,protectedText),input);
assert.throws(()=>restoreText(protectedText.text+' 999',protectedText));assert.throws(()=>restoreText(protectedText.text.replace('⟦P0⟧',''),protectedText));assert.throws(()=>restoreText(protectedText.text+' ⟦P0⟧',protectedText));
assert.equal(restoreText(protectedText.text.replace('Total:','Jumlah:'),protectedText),input.replace('Total:','Jumlah:'));
assert.deepEqual(translationBatches(['a','b','a','c'],2),[['a','b'],['c']]);
const {analysisModels}=await module('lib/model-options.ts');const model=id=>({name:'models/'+id,supportedGenerationMethods:['generateContent']});
assert.deepEqual(analysisModels(['gemini-3.1-pro-preview','gemini-3.8-flash','gemini-3.8-flash-preview','gemini-3.7-flash','gemini-3.8-flash-tts','gemini-3.1-flash-image','gemini-3.9-flash'].map(model)).map(m=>m.id),['gemini-3.9-flash','gemini-3.8-flash','gemini-3.7-flash','gemini-3.1-pro-preview']);
assert.equal(analysisModels([model('gemini-3.1-flash-lite')])[0].label,'Gemini 3.1 Flash Lite');
const app=fs.readFileSync('app/analyst.tsx','utf8');assert.doesNotMatch(app,/lt\(m.text\)/);assert.match(app,/<Markdown text=\{m.text\}/);assert.match(app,/title:lt\(c.title\)/);assert.match(app,/\[lt\(k\),v\]/);assert.match(app,/insightFacts\(null, localizedResult,locale\)/);
const api=fs.readFileSync('app/api/ai/route.ts','utf8');assert.doesNotMatch(api,/replyLanguage\(question/);assert.match(api,/body.language==='id'\?'id':'en'/);
console.log('Localization preserves numbers, timestamps, columns and code; model ordering and display language checks passed.');

assert.equal(analysisModels([{name:'models/gemini-2.5-flash',supportedGenerationMethods:['generateContent']}]).length,0);
