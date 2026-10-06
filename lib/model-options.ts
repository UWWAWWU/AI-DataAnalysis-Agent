export type ListedModel={name:string;displayName?:string;supportedGenerationMethods?:string[]};
// UI ordering follows the user's AI Studio reference. IDs always come from the API catalog.
export function analysisModels(catalog:ListedModel[]){
 const order=['3.8-flash','3.7-flash','3.5-flash-lite','3.6-flash','3.5-flash','3.1-flash-lite','3.1-pro'];
 const available=catalog.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace(/^models\//,''));
 return order.flatMap(name=>{const base='gemini-'+name;const id=available.includes(base)?base:available.filter(id=>new RegExp('^'+base.replaceAll('.','\\.')+'-preview(?:-\\d{2}-\\d{2})?$').test(id)).sort().at(-1);if(!id)return [];const label=name.replace('-flash-lite',' Flash Lite').replace('-flash',' Flash').replace('-pro',' Pro');return [{id,label:label+(id.includes('-preview')?' · Preview':'')}]});
}
