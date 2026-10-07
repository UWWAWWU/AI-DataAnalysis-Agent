// Scatter coordinates are row-level values. Keep them in the dashboard, outside AI context.
export function aiContextReplacer(key:string,value:unknown){return key==='points'?undefined:value;}
