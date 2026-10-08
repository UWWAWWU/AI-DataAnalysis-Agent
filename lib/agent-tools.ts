import type {Row} from './analysis';
export type AgentTool={name:'quality'|'describe'|'aggregate'|'correlation'|'distribution';columns?:string[];groupBy?:string;operation?:'sum'|'mean'|'count'|'distinct';bins?:number};
export function validateAgentTool(value:unknown,names:string[]):AgentTool{
 const t=value as AgentTool;if(!t||!['quality','describe','aggregate','correlation','distribution'].includes(t.name))throw Error('Unsupported analysis tool.');
 if(t.columns!==undefined&&(!Array.isArray(t.columns)||t.columns.length>12||t.columns.some(c=>!names.includes(c))))throw Error('Unknown analysis column.');
 if(t.groupBy&&!names.includes(t.groupBy))throw Error('Unknown grouping column.');
 if(t.name==='aggregate'&&(!t.groupBy||!['sum','mean','count','distinct'].includes(t.operation||'')))throw Error('Aggregation needs a group and operation.');
 if(t.name==='correlation'&&t.columns?.length!==2)throw Error('Correlation needs two numeric columns.');
 if(t.name==='distribution'&&t.columns?.length!==1)throw Error('Distribution needs one numeric column.');
 if(t.bins!==undefined&&(!Number.isInteger(t.bins)||t.bins<2||t.bins>50))throw Error('Invalid distribution bins.');
 if(t.name==='aggregate'&&t.operation!=='count'&&t.columns?.length!==1)throw Error('Aggregation needs one measure column.');
 if(t.name==='aggregate'&&['sum','mean'].includes(t.operation||'')&&/(?:id|code)$|invoice/i.test(t.columns?.[0]||''))throw Error('Identifiers cannot be summed or averaged.');
 return t;
}
const number=(v:unknown)=>v==null||v===''||v instanceof Date?null:typeof v==='number'&&Number.isFinite(v)?v:null;
const quantile=(a:number[],p:number)=>{const i=(a.length-1)*p,l=Math.floor(i);return a[l]+(a[Math.ceil(i)]-a[l])*(i-l)};
export function runAgentTool(rows:Row[],input:AgentTool){
 const names=Object.keys(rows[0]||{}),t=validateAgentTool(input,names),columns=t.columns||names;
 if(t.name==='quality'){
  const seen=new Set<string>();let duplicates=0;for(const r of rows){const key=JSON.stringify(names.map(c=>r[c]??null));if(seen.has(key))duplicates++;seen.add(key)}
  return {rows:rows.length,duplicates,columns:names.map(column=>({column,missing:rows.filter(r=>r[column]==null||r[column]==='').length})),note:'Checks identify review candidates, not permission to delete data.'};
 }
 if(t.name==='describe')return {rows:rows.length,columns:columns.map(column=>{const a=rows.map(r=>number(r[column])).filter((n):n is number=>n!==null).sort((a,b)=>a-b);if(!a.length)return {column,numericCount:0};const mean=a.reduce((s,n)=>s+n,0)/a.length,q1=quantile(a,.25),q3=quantile(a,.75),iqr=q3-q1;return {column,numericCount:a.length,excluded:rows.length-a.length,min:a[0],q1,median:quantile(a,.5),q3,max:a.at(-1),mean,standardDeviation:Math.sqrt(a.reduce((s,n)=>s+(n-mean)**2,0)/a.length),iqrOutlierCandidates:a.filter(n=>n<q1-1.5*iqr||n>q3+1.5*iqr).length}}),note:'Outlier candidates may be valid observations; no source rows were changed.'};
 if(t.name==='aggregate'){
  const groups=new Map<string,{sum:number;count:number;distinct:Set<string>}>();let excluded=0;
  for(const r of rows){const key=String(r[t.groupBy!]??'(missing)'),v=t.operation==='count'?1:t.operation==='distinct'?r[columns[0]]:number(r[columns[0]]);if(v==null||v===''){excluded++;continue}const g=groups.get(key)||{sum:0,count:0,distinct:new Set<string>()};g.count++;if(typeof v==='number')g.sum+=v;if(t.operation==='distinct')g.distinct.add(String(v));groups.set(key,g);if(groups.size>10000)throw Error('Too many groups; choose a lower-cardinality column.');}
  const all=[...groups].map(([category,g])=>({category,count:g.count,value:t.operation==='mean'?g.sum/g.count:t.operation==='sum'?g.sum:t.operation==='distinct'?g.distinct.size:g.count})).sort((a,b)=>b.value-a.value);
  return {rows:rows.length,excluded,groupBy:t.groupBy,measure:columns[0],operation:t.operation,groups:all.slice(0,100),totalGroups:all.length,truncated:all.length>100};
 }
 if(t.name==='correlation'){
  const pairs=rows.map(r=>[number(r[columns[0]]),number(r[columns[1]])]).filter((p):p is [number,number]=>p[0]!==null&&p[1]!==null);if(pairs.length<3)throw Error('At least three complete numeric pairs are needed.');
  const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;let cross=0,xx=0,yy=0;for(const [x,y] of pairs){cross+=(x-mx)*(y-my);xx+=(x-mx)**2;yy+=(y-my)**2;}
  return {columns,pairedRows:pairs.length,excluded:rows.length-pairs.length,pearson:xx&&yy?cross/Math.sqrt(xx*yy):null,note:'Descriptive linear association, not causation. Constant columns have undefined correlation.'};
 }
 const a=rows.map(r=>number(r[columns[0]])).filter((n):n is number=>n!==null).sort((a,b)=>a-b);if(!a.length)throw Error('No numeric observations available.');const bins=t.bins||10,min=a[0],max=a[a.length-1],width=(max-min||1)/bins,counts=Array(bins).fill(0);for(const n of a)counts[Math.min(bins-1,Math.floor((n-min)/width))]++;
 return {column:columns[0],rows:a.length,excluded:rows.length-a.length,bins:counts.map((count,i)=>({from:min+i*width,to:min+(i+1)*width,count})),note:'Equal-width bins; last bin includes the upper boundary.'};
}
