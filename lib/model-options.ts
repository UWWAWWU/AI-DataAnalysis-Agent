export type ListedModel={name:string;displayName?:string;supportedGenerationMethods?:string[]};
// Discover text-analysis models from the provider catalog; never invent IDs.
export function analysisModels(catalog:ListedModel[]){
 const matches=catalog.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).flatMap(m=>{
  const id=m.name.replace(/^models\//,'');
  const parts=/^gemini-(\d+)\.(\d+)-(flash-lite|flash|pro)(-preview(?:-\d{2}-\d{2})?)?$/.exec(id);
  return parts?[{id,major:Number(parts[1]),minor:Number(parts[2]),tier:parts[3],preview:Boolean(parts[4])}]:[];
 });
 const seen=new Set<string>();
 return matches.sort((a,b)=>b.major-a.major||b.minor-a.minor||['flash','pro','flash-lite'].indexOf(a.tier)-['flash','pro','flash-lite'].indexOf(b.tier)||Number(a.preview)-Number(b.preview)||b.id.localeCompare(a.id)).filter(m=>{const family=`${m.major}.${m.minor}-${m.tier}`;if(seen.has(family))return false;seen.add(family);return true}).map(m=>({id:m.id,label:`Gemini ${m.major}.${m.minor} ${m.tier==='flash-lite'?'Flash Lite':m.tier==='flash'?'Flash':'Pro'}${m.preview?' · Preview':''}`}));
}
