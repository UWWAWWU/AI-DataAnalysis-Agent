import type {Chart} from './analysis';
export const PLOT_TYPES=['bar','ranking','line','area','table','pie','donut','treemap','histogram','scatter','boxplot'] as const;
export type PlotType=typeof PLOT_TYPES[number];
export function categoryColor(name:string){let hash=2166136261;for(const c of name.normalize('NFKC').trim().toLowerCase())hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return `hsl(${hash%360}, 52%, 46%)`;}
export type SeriesDatum={name:string;value:number};
export type Box={name:string;low:number;q1:number;median:number;q3:number;high:number};
export function histogram(numbers:number[],bins=10):SeriesDatum[]{if(!numbers.length)return [];let low=Infinity,high=-Infinity;for(const n of numbers){low=Math.min(low,n);high=Math.max(high,n)}if(low===high){low-=.5;high+=.5}const step=(high-low)/bins;const data=Array.from({length:bins},(_,i)=>({name:`${Number((low+step*i).toPrecision(5))} — ${Number((low+step*(i+1)).toPrecision(5))}`,value:0}));for(const n of numbers)data[Math.min(bins-1,Math.max(0,Math.floor((n-low)/step)))].value++;return data;}
function boxes(points:NonNullable<Chart['points']>,paired:boolean):Box[]{const groups=new Map<string,number[]>();for(const p of points){const name=p.group||'All',v=paired?p.y!:p.x;const a=groups.get(name)||[];a.push(v);groups.set(name,a)}return [...groups].map(([name,a])=>{a.sort((x,y)=>x-y);const q=(p:number)=>{const i=(a.length-1)*p,l=Math.floor(i);return a[l]+(a[Math.ceil(i)]-a[l])*(i-l)};return {name,low:a[0],q1:q(.25),median:q(.5),q3:q(.75),high:a.at(-1)!}});}
function groupPoints(points:NonNullable<Chart['points']>){const names=[...new Set(points.map(p=>p.group||'All'))];if(names.length<=20||!names.every(n=>n.trim()&&Number.isFinite(Number(n))))return points;const numbers=names.map(Number);let low=Infinity,high=-Infinity;for(const n of numbers){low=Math.min(low,n);high=Math.max(high,n)}const step=(high-low||1)/10;return points.map(p=>{const i=Math.min(9,Math.max(0,Math.floor((Number(p.group)-low)/step)));return {...p,group:`${Number((low+i*step).toPrecision(5))} — ${Number((low+(i+1)*step).toPrecision(5))}`}})}
export function chartDisplay(chart:Chart,view:string){
 const original=chart.view||(chart.time?'area':'ranking');const points=(chart.points||[]).filter(p=>Number.isFinite(p.x)&&(p.y===undefined||Number.isFinite(p.y)));const paired=points.length>0&&points.every(p=>p.y!==undefined);let raw=chart.labels.map((name,i)=>({name,value:chart.values[i]}));
 if(!raw.length&&chart.boxes?.length)raw=chart.boxes.map(b=>({name:b.name,value:b.median}));
 const additive=raw.length>0&&raw.every(d=>d.value>=0)&&raw.some(d=>d.value>0);
 const options=new Set<string>(['bar','ranking','line','area','table']);
 if((additive&&original!=='boxplot')||points.length)for(const type of ['pie','donut','treemap'])options.add(type);
 if(points.length){options.add('histogram');options.add('boxplot')}
 if(paired)options.add('scatter');
 if(original==='histogram')options.add('histogram');if(original==='boxplot')options.add('boxplot');if(original==='scatter')options.add('scatter');
 const grouped=groupPoints(points);
 let data=raw;let meaning=original==='boxplot'&&view!==original&&view!=='table'&&!points.length?'medians':'original';let boxData=chart.boxes||[];
 const composed=['pie','donut','treemap'].includes(view);
 if(points.length&&view!==original&&view!=='table'&&view!=='scatter'&&(original!=='histogram'||view==='boxplot')){
  if(view==='histogram'){data=histogram(points.map(p=>p.x));meaning='distribution'}
  else if(view==='boxplot'){boxData=boxes(grouped,paired);meaning='quartiles'}
  else {const groups=new Map<string,{sum:number;count:number}>();for(const p of grouped){const name=p.group||'All',g=groups.get(name)||{sum:0,count:0};g.sum+=paired?p.y!:p.x;g.count++;groups.set(name,g)}data=[...groups].map(([name,g])=>({name,value:composed?g.count:g.sum/g.count}));meaning=composed?'counts':'means'}
 }
 return {original,options:[original,...PLOT_TYPES.filter(v=>v!==original&&options.has(v))],data,points,paired,boxes:boxData,meaning};
}
