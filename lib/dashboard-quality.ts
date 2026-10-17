import type {Result} from './analysis';
/** Observable checks, supplied to the model after actual computation. */
export function assessDashboard(result:Result|undefined){
 const issues:string[]=[],seen=new Set<string>();
 if(!result||!Array.isArray(result.charts))return {issues:['No computed dashboard'],observations:0};
 for(const chart of result.charts){
  const signature=JSON.stringify([chart.groupColumn,chart.measureColumns,chart.metricRules,chart.tableHeaders,chart.aggregation,chart.view,chart.xColumn,chart.yColumn,chart.time]);
  if(chart.groupColumn&&chart.measureColumns&&seen.has(signature))issues.push('Repeated analytical view: '+chart.title);seen.add(signature);
  if(chart.view==='scatter'&&(!chart.xColumn||!chart.yColumn))issues.push('Missing numeric axes: '+chart.title);
  if(chart.aggregation==='sum'&&!chart.time)issues.push('Explain totals using observation counts or mean comparisons: '+chart.title);
  if(chart.view==='area'&&!chart.time)issues.push('Use ordered bars for independent group comparisons: '+chart.title);
  if(chart.aggregation==='mean'&&!chart.time&&!Object.keys(chart.groupCounts||{}).length)issues.push('Missing observation counts for a mean comparison: '+chart.title);
  if(chart.sampled)issues.push('Disclose sampling: '+chart.title);
  if(chart.groupCounts&&Object.values(chart.groupCounts).some(n=>n<10))issues.push('Small groups; show observation counts: '+chart.title);
 }
 if(result.charts.length>8)issues.push('Canvas is dense; prioritize distinct questions and readable labels.');
 return {issues,observations:result.rows,chartCount:result.charts.length,kpiCount:Object.keys(result.kpis).length};
}
