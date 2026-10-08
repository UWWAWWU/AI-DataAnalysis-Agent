import {validateSpec,type DashboardSpec,type Metric} from './dashboard';
export type DashboardAddition={metrics:Metric[];charts:DashboardSpec['charts']};
export type FilterChange={country?:string;from?:string;to?:string};
/** Apply a delta without accepting model rewrites of existing definitions. */
export function appendDashboard(current:DashboardSpec,raw:unknown,columns?:string[]):DashboardSpec{
 const addition=raw as DashboardAddition;
 if(!addition||!Array.isArray(addition.metrics)||!Array.isArray(addition.charts)||!addition.charts.length)throw Error('A chart addition must contain metrics and at least one chart.');
 const next=structuredClone(current),mapping=new Map<string,string>();
 for(const metric of addition.metrics){
  const same=next.metrics.find(m=>JSON.stringify({...m,id:''})===JSON.stringify({...metric,id:''}));
  if(same){mapping.set(metric.id,same.id);continue;}
  let id=metric.id;while(next.metrics.some(m=>m.id===id))id+='_added';mapping.set(metric.id,id);next.metrics.push({...metric,id});
 }
 for(const chart of addition.charts){const added={...chart,metric:mapping.get(chart.metric)||chart.metric,...(chart.tableMetrics?{tableMetrics:chart.tableMetrics.map(id=>mapping.get(id)||id)}:{})};
  if(next.charts.some(c=>JSON.stringify({...c,position:undefined})===JSON.stringify({...added,position:undefined})))continue;
  if(next.charts.some(c=>c.title===added.title))throw Error('The new chart needs a distinct title. Existing charts cannot be replaced by an addition.');
  next.charts.push(added);
 }
 return validateSpec(next,columns);
}
export function validateFilterChange(raw:unknown,scope:{countries?:string[];months?:string[]},spec:DashboardSpec):FilterChange{
 if(!raw||typeof raw!=='object')throw Error('Filter changes are required.');const input=raw as Record<string,unknown>,next:FilterChange={};
 for(const key of Object.keys(input)){if(!['country','from','to'].includes(key)||typeof input[key]!=='string')throw Error('Invalid filter change.');const value=input[key] as string;
 if(key==='country'&&value&&(!spec.countryColumn||!scope.countries?.includes(value)))throw Error('The requested category is not available.');
 if(key!=='country'&&value&&(!spec.dateColumn||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)))throw Error('Use a valid month for the date filter.');
 next[key as keyof FilterChange]=value;}
 if(!Object.keys(next).length||next.from&&next.to&&next.from>next.to)throw Error('Invalid date range.');return next;
}
export const DASHBOARD_ACTION_INSTRUCTIONS=`For changing the active selection ONLY, return action "filter", filterChanges:{from?:"YYYY-MM",to?:"YYYY-MM",country?:exact category}. For one month set both from and to. Empty strings clear a filter. Use available months/categories from summary.profile. Never change chart titles to simulate filtering. For ADDING charts return action "append", dashboardAddition:{metrics:[{id,operation,columns,rules}],charts:[{title,metric,groupBy,time,limit,view,width,xColumn?,yColumn?,bins?,tableMetrics?}]}. Return ONLY requested new charts and their needed new metrics; existing metric IDs may be referenced. The app preserves all existing KPIs, charts, titles and filter columns, recalculates with Python, and arranges the canvas. Do not rebuild the dashboard or ask about unrelated thresholds for an addition. Total harvest by zone is sum of harvest_kg grouped by zone, using bar; it needs no thresholds. For ordinary bar/ranking charts use metric plus groupBy. Histogram needs count metric and a numeric xColumn; scatter needs numeric xColumn and yColumn; boxplot needs numeric xColumn. Do not return action update for adding a chart or changing selection. Optional risk alerts and domain thresholds must never block standard aggregates. For changing calculations or multiple measures of exactly one existing chart, return action "revise", targetChart:exact existing title, dashboardAddition with ONLY the replacement chart and required new metrics. Preserve all unrelated charts and KPIs. For table requests with several measures, use tableMetrics containing the metric IDs to display, with groupBy as the row key. `;
/** Resolve an explicit single-month selection without regenerating an analysis. */
export function requestedMonthFilter(question:string):FilterChange|undefined{
 if(!/\bfilter\b|\bonly\b|hanya/i.test(question)||/\badd\b|tambah|\bwhat\b|\bwhy\b|\bhow\b|can I|explain|bagaimana|apakah|kenapa|mengapa|(?:do not|don't|jangan) filter/i.test(question))return;
 const names=['january','february','march','april','may','june','july','august','september','october','november','december'];
 const aliases=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
 const iso=question.match(/\b(\d{4}-(?:0[1-9]|1[0-2]))\b/g);if(iso?.length===1)return {from:iso[0],to:iso[0]};if(iso?.length)return;
 const year=question.match(/\b(20\d{2})\b/g);if(year?.length!==1)return;
 const found=names.map((name,i)=>new RegExp(`\\b(?:${name}|${aliases[i]})\\b`,'i').test(question)?i:-1).filter(i=>i>=0);if(found.length!==1)return;
 const month=year[0]+'-'+String(found[0]+1).padStart(2,'0');return {from:month,to:month};
}
/** Exact-column aggregate additions are executable without another exploration plan. */
export function requestedAggregateAddition(question:string,columns:{name:string;type:string}[],language:'en'|'id'='en'):DashboardAddition|undefined{
 if(!/\badd\b|tambah/i.test(question)||!/chart|plot|grafik|visual/i.test(question)||/(?:do not|don't|jangan) (?:add|tambah)|\bwhat\b|\bwhy\b|\bhow\b|can I|explain|bagaimana|apakah|kenapa|mengapa/i.test(question))return;
 const escape=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const group=columns.filter(c=>new RegExp(`(?:\\bby|\\bper|berdasarkan)\\s+${escape(c.name)}(?:\\b|$)`,'i').test(question));if(group.length!==1)return;
 const split=question.split(/\bby\b|\bper\b|berdasarkan/i)[0];const measures=columns.filter(c=>c.type==='number'&&!/(?:^|_)id$/i.test(c.name)&&new RegExp(`\\b${escape(c.name)}\\b`,'i').test(split));if(measures.length!==1)return;
 const operation=/average|mean|rata.rata/i.test(split)?'mean':/total|sum|jumlah/i.test(split)?'sum':undefined;if(!operation)return;
 const view=/horizontal/i.test(question)?'ranking':'bar';
 const measure=measures[0].name,key='added_'+operation+'_'+measure;
 const title=`${operation==='sum'?(language==='id'?'Total':'Total'):(language==='id'?'Rata-rata':'Average')} ${measure} ${language==='id'?'berdasarkan':'by'} ${group[0].name}`;
 return {metrics:[{id:key,operation,columns:[measure],rules:[]}],charts:[{title,view,width:'standard',metric:key,groupBy:group[0].name,time:false,limit:100}]};
}
export function reviseDashboard(current:DashboardSpec,title:string,addition:DashboardAddition,columns?:string[]):DashboardSpec{
 const index=current.charts.findIndex(c=>c.title===title);if(index<0||current.charts.filter(c=>c.title===title).length!==1||addition.charts.length!==1)throw Error('Identify exactly one existing chart to revise.');
 const base=structuredClone(current);base.charts.splice(index,1);const next=appendDashboard(base,addition,columns);const revised=next.charts.pop()!;next.charts.splice(index,0,revised);return next;
}
