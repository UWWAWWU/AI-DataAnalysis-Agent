// Preserve rendered point counts as evidence without sending row-level coordinates.
export function aiContextReplacer(key:string,value:unknown){
 if(key==='points')return undefined;
 if(value&&typeof value==='object'&&!Array.isArray(value)&&Array.isArray((value as {points?:unknown}).points)){
  const chart=value as {points:unknown[]};return {...chart,pointCount:chart.points.length};
 }
 return value;
}
