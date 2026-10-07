export type Tile={key:string;x:number;y:number;w:number;h:number;page:number};
export const overlap=(a:Tile,b:Tile)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
/** Pack every visual into the same canvas; pages from older plans are ignored. */
export function placeTiles(requested:Tile[]):Tile[]{
 const placed:Tile[]=[];
 for(const item of requested){
  const tile={...item,w:Math.max(2,Math.min(12,Math.round(item.w))),h:Math.max(1,Math.min(12,Math.round(item.h))),x:Math.max(0,Math.round(item.x)),y:Math.max(0,Math.round(item.y)),page:0};
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
