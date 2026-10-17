import ts from 'typescript';import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const code=ts.transpileModule(fs.readFileSync('lib/report-export.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={};new Function('require','exports',code)(createRequire(import.meta.url),module);
assert.equal(module.reportFilename('Online Retail.xlsx','pdf'),'report_Online Retail.pdf');assert.equal(module.reportFilename('sales.csv','csv'),'report_sales.csv');assert.equal(module.reportFilename('../unsafe.xlsx','json'),'report_.._unsafe.json');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAF0lEQVR4nGP8//8/AymAiSTVoxpopQEAMWADD3qy2BsAAAAASUVORK5CYII=';
const doc=module.buildReportPDF(image);assert.equal(doc.getNumberOfPages(),1);assert.ok(Math.abs(doc.internal.pageSize.getWidth()/doc.internal.pageSize.getHeight()-16/9)<1e-8);console.log('Report naming and one-page 16:9 dashboard PDF passed.');
