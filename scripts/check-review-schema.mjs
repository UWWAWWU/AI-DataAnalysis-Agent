import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/cleaning-recommendations.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {recommendationResponseSchema,validateRecommendations,recommendationGuidance,recommendationTreatments}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const findings=[{id:'missing:oxygen',kind:'missing',numeric:true,column:'oxygen',count:2},{id:'outlier:temperature',kind:'outlier',numeric:true,column:'temperature',count:1}];
const items=findings.map(f=>({id:f.id,recommended:'keep',reason:'Missing meaning or error status is unknown.',impact:'The source observations are retained.',assumption:'Descriptive analysis reports uncertainty.'}));
const schema=recommendationResponseSchema(findings);
assert.deepEqual(recommendationTreatments(findings[0]),['keep','remove','median','mean']);
assert.deepEqual(recommendationTreatments(findings[1]),['keep','remove']);
assert.ok(recommendationGuidance(findings).includes(JSON.stringify({id:findings[1].id,allowed:['keep','remove']})));
assert.deepEqual(schema.properties.recommendations.items.properties.id.enum,findings.map(f=>f.id));
assert.equal(schema.properties.recommendations.minItems,2);assert.equal(schema.properties.recommendations.maxItems,2);
assert.deepEqual(validateRecommendations({recommendations:items},findings),items);
for(const [change,message] of [[{id:'invented'},'exact supplied finding ID'],[{recommended:'median'},'unsupported for this finding'],[{reason:''},'nonempty strings']]){
 const invalid=items.map(x=>({...x}));Object.assign(invalid[1],change);
 assert.throws(()=>validateRecommendations({recommendations:invalid},findings),new RegExp(message));
}
assert.throws(()=>validateRecommendations({recommendations:[items[0],items[0]]},findings),/must be unique/);
assert.equal(recommendationResponseSchema([]).properties.recommendations.maxItems,0);
console.log('Review schemas constrain IDs/counts; validators distinguish unknown IDs, duplicates, unsupported treatments and missing explanations.');
