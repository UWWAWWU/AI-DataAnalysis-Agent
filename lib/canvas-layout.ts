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
/** Choose row groupings by chart shape and density, within a fixed presentation area. */
export function composeDashboard(charts:Chart[],keys:string[],_metrics:string[],options:{width?:number;height?:number;layout?:string;kpiPlacement?:KpiPlacement;minimums?:Record<string,number>;editing?:boolean}={}):Tile[]{
 if(!charts.length)return [];
 const width=options.width||1552,height=options.height||650,n=charts.length;
 const aspect=(c:Chart)=>c.view==='scatter'||c.view==='boxplot'?1.55:c.view==='ranking'?Math.max(.8,2.2-c.labels.length*.05):c.view==='table'?1.8:c.time?c.labels.length>8?2.8:1.8:['pie','donut'].includes(c.view||'')?1.25:2;
 const variants:Record<number,number[][]>={1:[[12]],2:[[6,6],[7,5],[5,7],[8,4],[4,8]],3:[[4,4,4],[6,3,3],[3,6,3],[3,3,6]],4:[[3,3,3,3]]};
 let best:{cost:number;groups:{start:number;widths:number[]}[]}|undefined;
 for(let rows=1;rows<=n;rows++){
  if(n>rows*4)continue;
  const h=(height-(rows-1)*12)/rows;
  const memo=new Map<string,{cost:number;groups:{start:number;widths:number[]}[]}|null>();
  const solve=(start:number,left:number):{cost:number;groups:{start:number;widths:number[]}[]}|null=>{
   if(!left)return start===n?{cost:0,groups:[]}:null;
   const key=start+':'+left;if(memo.has(key))return memo.get(key)!;
   let result:{cost:number;groups:{start:number;widths:number[]}[]}|null=null;
   for(let size=1;size<=4&&start+size<=n;size++){
    const remaining=n-start-size;if(remaining<left-1||remaining>(left-1)*4)continue;
    const tail=solve(start+size,left-1);if(!tail)continue;
    for(const widths of variants[size]){
     let cost=tail.cost;
     widths.forEach((w,i)=>{const c=charts[start+i],panelW=(width+12)*w/12-12;cost+=Math.log(panelW/h/aspect(c))**2;cost+=Math.max(0,140-h)/100;cost+=c.title.length>55&&w<=3?.35:0;});
     if(!result||cost<result.cost)result={cost,groups:[{start,widths},...tail.groups]};
    }
   }memo.set(key,result);return result;
  };
  const candidate=solve(0,rows);if(candidate&&(!best||candidate.cost<best.cost))best=candidate;
 }
 return best!.groups.flatMap(({start,widths},y)=>{let x=0;return widths.map((w,i)=>{const tile={key:keys[start+i],x,y,w,h:1,page:0};x+=w;return tile})});
}
