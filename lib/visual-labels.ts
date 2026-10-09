import type {Chart} from './analysis';
import type {DashboardSpec,Metric} from './dashboard';
export function columnLabel(name:string){return name.replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\bmg L\b/g,'mg/L').replace(/(temperature|temp) C\b/gi,'$1 (°C)').replace(/\bp H\b/g,'pH').replace(/\bPct\b/g,'%').trim();}
const verbs={en:{sum:'Total',mean:'Average',count:'Records',distinct:'Unique'},id:{sum:'Total',mean:'Rata-rata',count:'Baris',distinct:'Unik'}};
export function metricCaption(metric:Metric|undefined,locale:'en'|'id'='en'){
 if(!metric)return '';
 const name=metric.columns.map(columnLabel).join(' × ');
 return metric.operation==='count'?(locale==='id'?'Jumlah baris':'Record count'):`${verbs[locale][metric.operation]} ${name}`;
}
export function kpiCaptions(spec:DashboardSpec|undefined,locale:'en'|'id'='en'){
 const out:Record<string,{caption:string;percent:boolean;decimals?:number}>={};if(!spec)return out;
 const metric=(id?:string)=>spec.metrics.find(m=>m.id===id);
 const described=(m:Metric|undefined)=>{const rules=(m?.rules||[]).map(r=>`${columnLabel(r.column)} ${r.op} ${r.value??''}`.trim());return metricCaption(m,locale)+(rules.length?' ['+rules.join(', ')+']':'');};
 for(const k of spec.kpis){const numerator=metric(k.numerator),denominator=metric(k.denominator),extra=metric(k.denominatorExtra),main=metric(k.metric);const percent=!main&&k.scale===100;
  let caption=main?metricCaption(main,locale):`${described(numerator)} ÷ ${extra?'(':''}${described(denominator)}${extra?' + '+described(extra)+')':''}${k.scale!==undefined&&k.scale!==1?' × '+k.scale:''}`;
  if(main?.columns.some(c=>/bill|amount|price|revenue|sales|^tip$/i.test(c))&&!/[$€£]|usd|idr|eur|gbp/i.test(k.label))caption+='; '+(locale==='id'?'mata uang mengikuti sumber, tidak disebutkan':'source currency not specified');if(main?.columns.length===1&&/^size$|party.?size|people|persons/i.test(main.columns[0]))caption+='; '+(locale==='id'?'orang per kelompok':'people per group');
  const rules=(main?.rules||[]).map(r=>`${columnLabel(r.column)} ${r.op} ${r.value??''}`.trim());
  out[k.label]={decimals:main?.operation==='count'||main?.operation==='distinct'?0:2,caption:caption+(rules.length?' · '+rules.join(', '):''),percent};
 }return out;
}
export function chartMeasure(chart:Chart,locale:'en'|'id'='en'){
 const measure=chart.measureLabel?.[locale]||chart.measureColumns?.map(columnLabel).join(' × ');
 const operation=chart.aggregation as keyof typeof verbs.en;
 return operation==='count'?(locale==='id'?'Jumlah baris':'Record count'):operation&&verbs[locale][operation]?`${verbs[locale][operation]} ${measure||''}`.trim():chart.metricLabel|| (locale==='id'?'Nilai':'Value');
}
export function chartCaption(chart:Chart,locale:'en'|'id'='en'){
 const by=locale==='id'?'menurut':'by',group=chart.time?(locale==='id'?'bulan':'month'):chart.groupLabel?.[locale]||columnLabel(chart.groupColumn||'');
 if(chart.view==='scatter')return `X: ${columnLabel(chart.xColumn||'X')} · Y: ${columnLabel(chart.yColumn||'Y')} · ${locale==='id'?'satu titik = satu observasi':'one point = one observation'}`;
 if(chart.view==='histogram')return `${columnLabel(chart.xColumn||chart.groupColumn||'')} · ${locale==='id'?'jumlah observasi per rentang':'observations per interval'}`;
 if(chart.view==='boxplot')return `${columnLabel(chart.xColumn||'')} ${by} ${group} · ${locale==='id'?'distribusi dan median':'distribution and median'}`;
 const codes=/code|kode|weekday|dayofweek|weathersit|season/i.test(chart.groupColumn||'')&&chart.labels.some(value=>/^\d+$/.test(value)&&!chart.categoryLabels?.values[value]);
 const caption=chart.tableHeaders&&chart.tableHeaders.length>2?chart.tableHeaders.slice(1).map(columnLabel).join(' · ')+` ${by} ${group}`:`${chartMeasure(chart,locale)}${group?' '+by+' '+group:''}`;
 return caption+(codes?(locale==='id'?' · Arti kode tidak tersedia dalam data':' · Code meanings not provided in the data'):'');
}

export function scatterDomain([low,high]:readonly [number,number]):[number,number]{const padding=(high-low||Math.abs(low)||1)*.05;return [low-padding,high+padding];}
