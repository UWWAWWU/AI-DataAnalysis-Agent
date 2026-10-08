import ts from 'typescript';
import fs from 'node:fs/promises';
const source=await fs.readFile('lib/analysis.ts','utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
await fs.writeFile('public/engine.js',output.outputText);
await fs.writeFile('public/category-labels.js',ts.transpileModule(await fs.readFile('lib/category-labels.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
await fs.copyFile('node_modules/xlsx/dist/xlsx.full.min.js','public/xlsx.full.min.js');

const dashboard=await fs.readFile('lib/dashboard.ts','utf8');
await fs.writeFile('public/dashboard-engine.js',ts.transpileModule(dashboard,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);

const review=await fs.readFile('lib/data-review.ts','utf8');
await fs.writeFile('public/review-engine.js',ts.transpileModule(review,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);

await fs.writeFile("public/presentation-engine.js",ts.transpileModule(await fs.readFile("lib/presentation-patch.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
await fs.writeFile('public/preparation-engine.js',ts.transpileModule(await fs.readFile('lib/data-preparation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);

await fs.writeFile('public/session-store.js',ts.transpileModule(await fs.readFile('lib/session-store.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
await import('./build-interactive.mjs');
