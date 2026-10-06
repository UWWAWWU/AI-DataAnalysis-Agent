import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/reply-language.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {replyLanguage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(replyLanguage('Jelaskan setiap KPI. Gunakan bahasa Indonesia.','en'),'id');
assert.equal(replyLanguage('Jelaskan artinya dalam bahasa Indonesia.','en'),'id');
assert.equal(replyLanguage('Answer in English.','id'),'en');
assert.equal(replyLanguage('Use Indonesian.','en'),'id');
assert.equal(replyLanguage('Gunakan bahasa Inggris, lalu jawab dalam bahasa Indonesia.','en'),'id');
assert.equal(replyLanguage('Jangan gunakan bahasa Inggris.','id'),'id');
assert.equal(replyLanguage('Explain the KPI.','id',false),'id');
console.log('Explicit reply language, preference fallback, and negation checks passed.');

assert.equal(replyLanguage('Tampilkan baris yang identik pada seluruh kolom. Jangan hapus dahulu.','en'),'id');
assert.equal(replyLanguage('Ubah hanya grafik tren bulanan menjadi line chart','en'),'id');
assert.equal(replyLanguage('Show duplicate rows. Do not delete yet.','id'),'en');
assert.equal(replyLanguage('Ubah grafik. Answer in English.','id'),'en');
