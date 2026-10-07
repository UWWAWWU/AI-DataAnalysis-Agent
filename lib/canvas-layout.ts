import type {Chart} from './analysis';
export type Tile={key:string;x:number;y:number;w:number;h:number;page:number};
export type KpiPlacement='auto'|'horizontal'|'sidebar'|'grouped';
export const overlap=(a:Tile,b:Tile)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
/** Pack every visual into the same canvas; pages from older plans are ignored. */
export function placeTiles(requested:Tile[]):Tile[]{
 const placed:Tile[]=[];
 for(const item of requested){
  const tile={...item,w:Math.max(2,Math.min(12,Math.round(item.w))),h:Math.max(1,Math.round(item.h)),x:Math.max(0,Math.round(item.x)),y:Math.max(0,Math.round(item.y)),page:0};
  tile.x=Math.min(tile.x,12-tile.w);
  if(placed.some(p=>overlap(p,tile))){
   let found=false;const bottom=Math.max(0,...placed.map(p=>p.y+p.h));
   for(let y=0;!found&&y<=bottom;y++)for(let x=0;!found&&x<=12-tile.w;x++){
    const candidate={...tile,x,y};if(!placed.some(p=>overlap(p,candidate))){Object.assign(tile,candidate);found=true}
   }
  }
  placed.push(tile);
 }
 return placed;
}
export function chartRows(chart:Pick<Chart,'view'|'labels'|'sampled'|'title'>,view=chart.view||'ranking',count=chart.labels.length){
 const baseline=['pie','donut','treemap','histogram'].includes(view)||(view==='bar'&&count<=7)?4:5;
 const content=view==='ranking'?Math.ceil((count*23+190)/92):view==='table'?Math.ceil((Math.min(count,10)*30+220)/92):baseline;
 return Math.max(baseline,content,chart.title.length>65?6:0);
}
/** Semantic rows use all available columns. AI sizes are hints; empty coordinates never create holes. */
export function composeDashboard(charts:Chart[],keys:string[],metrics:string[],options:{width?:number;layout?:string;kpiPlacement?:KpiPlacement;minimums?:Record<string,number>;editing?:boolean}={}):Tile[]{
 const width=options.width||1200,tiles:Tile[]=[];let y=0;
 const queue=charts.map((chart,i)=>({chart,key:keys[i]}));
 const compact=(c:Chart)=>['pie','donut','treemap','histogram'].includes(c.view||'')||(c.view==='bar'&&c.labels.length<=7);
 const detailed=(c:Chart)=>c.time||['scatter','table','boxplot'].includes(c.view||'')||(c.labels.length>12&&c.view!=='histogram')||(c.view==='histogram'&&c.labels.length>20);
 const row=(items:typeof queue,widths:number[],x=0,start=y,minH=0)=>{
  const h=Math.max(minH,...items.map(({chart,key})=>Math.max(chartRows(chart),chart.position?.h||0,options.minimums?.[key]||0)+(options.editing?1:0)));
  items.forEach(({key},i)=>{tiles.push({key,x,y:start,w:widths[i],h,page:0});x+=widths[i]});return start+h;
 };
 const metricHeight=(label:string,w:number)=>Math.max(1,Math.ceil((Math.ceil(label.length/Math.max(12,(width*w/12-32)/6))*14+50)/92));
 const metricRows=()=>{
  if(!metrics.length)return;
  const max=options.kpiPlacement==='grouped'?4:width>=1150?6:4;
  const groups=Math.ceil(metrics.length/max),perRow=Math.ceil(metrics.length/groups);
  for(let i=0;i<metrics.length;i+=perRow){const labels=metrics.slice(i,i+perRow),widths=labels.map((_,j)=>Math.floor(12/labels.length)+(j<12%labels.length?1:0)),h=Math.max(...labels.map((label,j)=>metricHeight(label,widths[j])));let x=0;labels.forEach((label,j)=>{const w=widths[j];tiles.push({key:`kpi:${label}`,x,y,w,h,page:0});x+=w});y+=h}
 };
 const sidebar=queue.length>0&&metrics.length>0&&(options.kpiPlacement==='sidebar'||(options.kpiPlacement!=='horizontal'&&options.kpiPlacement!=='grouped'&&metrics.length>=4&&metrics.length<=6&&!charts.some(c=>c.time)&&charts.some(c=>c.view==='scatter')));
 if(sidebar){
  const index=queue.findIndex(({chart})=>chart.view==='scatter');const [primary]=queue.splice(Math.max(0,index),1);
  const metricHeights=metrics.map(label=>metricHeight(label,3)),total=metricHeights.reduce((a,b)=>a+b,0);
  const h=Math.max(total,chartRows(primary.chart),options.minimums?.[primary.key]||0)+(options.editing?1:0);let cursor=0;
  metrics.forEach((label,i)=>{const start=cursor;cursor+=metricHeights[i];tiles.push({key:`kpi:${label}`,x:0,y:Math.floor(start*h/total),w:3,h:Math.floor(cursor*h/total)-Math.floor(start*h/total),page:0})});
  y=row([primary],[9],3,0,h);
 }else if(options.layout==='charts-first'&&queue.length){y=row([queue.shift()!],[12]);metricRows()}else metricRows();
 while(queue.length){
  const first=queue[0];
  if(chartRows(first.chart)>9||first.chart.time||first.chart.width==='wide'||(first.chart.position?.w||0)>=8||first.chart.view==='table'){
   const companion=queue.findIndex((item,i)=>i>0&&compact(item.chart)&&!item.chart.time);
   if(companion>0&&queue.length<=3&&chartRows(first.chart)<=9&&first.chart.view!=='table'&&width>=1000&&first.chart.labels.length<=18){queue.shift();const [other]=queue.splice(companion-1,1);y=row([first,other],[8,4])}
   else y=row([queue.shift()!],[12]);
  }else{
   const small=queue.filter(({chart})=>compact(chart)&&!detailed(chart));
   const n=width>=1300&&small.length>=4&&compact(first.chart)?4:small.length>=3&&compact(first.chart)?3:queue.length>=2?2:1;
   const items=n>=3?small.slice(0,n):queue.slice(0,n);
   for(const item of items)queue.splice(queue.indexOf(item),1);
   let widths=n===4?[3,3,3,3]:n===3?[4,4,4]:n===1?[12]:detailed(items[0].chart)&&!detailed(items[1].chart)?[7,5]:!detailed(items[0].chart)&&detailed(items[1].chart)?[5,7]:[6,6];
   if(n===2&&items[0].chart.position?.w&&items[1].chart.position?.w&&items[0].chart.position.w+items[1].chart.position.w===12)widths=items.map(({chart})=>chart.position!.w);
   y=row(items,widths);
  }
 }
 return tiles;
}
