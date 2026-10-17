// Real bundled scikit-learn datasets plus varied synthetic stress cases.
import fs from 'node:fs';import path from 'node:path';import XLSX from 'xlsx';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
process.env.CORPUS_DIR=process.env.CORPUS_SCIENTIFIC_DIR||path.join(process.cwd(),'.tmp','scientific-corpus');const dir=process.env.CORPUS_DIR;fs.mkdirSync(dir,{recursive:true});
const python=String.raw`
from sklearn import datasets
import json,numpy as np
out=[]
for name,loader in [('iris',datasets.load_iris),('wine',datasets.load_wine),('breast-cancer',datasets.load_breast_cancer),('diabetes',datasets.load_diabetes),('digits',datasets.load_digits),('linnerud',datasets.load_linnerud)]:
 b=loader(); names=list(b.feature_names) if hasattr(b,'feature_names') else ['pixel_'+str(i) for i in range(b.data.shape[1])]
 rows=[]
 for i,x in enumerate(b.data):
  if name=='diabetes':group='target-band-'+str(int(b.target[i]//50))
  elif name=='linnerud':group='fitness-group-'+str(i%3)
  else:group=str(b.target_names[int(b.target[i])]) if hasattr(b,'target_names') else 'class-'+str(int(b.target[i]))
  rows.append({'SampleID':'S'+str(i),'Group':group,**{str(n):float(v) for n,v in zip(names,x)}})
 a,bcol=(names[5],names[6]) if name=='digits' else (names[0],names[1])
 out.append({'id':'scientific-'+name,'domain':name,'group':'Group','a':str(a),'b':str(bcol),'date':'','excel':False,'live':False,'source':'scikit-learn bundled load_'+name.replace('-','_'),'rows':rows})
print(json.dumps(out))
`;
const p=spawnSync('python3',['-c',python],{encoding:'utf8',maxBuffer:1e7});assert.equal(p.status,0,p.stderr);const cases=JSON.parse(p.stdout);
const variants=[['nonlinear',i=>({Group:['North','South','West'][i%3],Value:i-50,Other:(i-50)**2})],['nonfinite',i=>({Group:i%2?'A':'B',Value:i%11===0?'Infinity':i%13===0?'-Infinity':i%17===0?'NaN':i,Other:i%2?1:0})],['localized-strings',i=>({Group:['Jakarta','Yogyakarta'][i%2],Value:i%2?'1.234,50':'2,345.67',Other:i})],['scientific-notation',i=>({Group:['1e2','2e2'][i%2],Value:String((i+1)*1e-5),Other:(i+1)*1e6})],['mixed-sign-zero',i=>({Group:['Debit','Credit'][i%2],Value:i%3===0?0:i%2?-i:i,Other:i%5===0?0:i/10})],['timezone-dates',i=>({Group:i%2?'East':'West',Date:'2026-02-'+String(i%27+1).padStart(2,'0')+'T23:30:00+07:00',Value:i,Other:i/2})]];
for(const [name,make] of variants)cases.push({id:'stress-'+name,domain:name,group:'Group',a:name==='localized-strings'?'Other':'Value',b:'Other',date:name==='timezone-dates'?'Date':'',excel:['mixed-sign-zero','scientific-notation'].includes(name),live:false,rows:Array.from({length:120},(_,i)=>({SampleID:'S'+i,...make(i)}))});
for(const c of cases){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet(c.rows),'Data');const target=path.join(dir,c.id+(c.excel?'.xlsx':'.csv'));if(c.excel)XLSX.writeFile(book,target);else fs.writeFileSync(target,XLSX.utils.sheet_to_csv(book.Sheets.Data));}
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(cases.map(({rows,...c})=>({...c,rows:rows.length})),null,2));const suite=await import('./check-diverse-agent-corpus.mjs');suite.corpus.splice(0,suite.corpus.length,...cases);const results=await suite.local();assert.ok(results.every(r=>r.status==='pass'),'Scientific/stress calculation failures');
