const string={type:'string'};
const strings={type:'array',items:string};
const object=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:'object',properties,required});
const array=(items:unknown)=>({type:'array',items});
const rule=object({column:string,op:{type:'string',enum:['gt','ge','lt','le','eq','ne','prefix','notPrefix','notEmpty']},value:{anyOf:[string,{type:'number'}]}},['column','op']);
export const PLAN_SCHEMA=object({title:string,objective:string,steps:strings,assumptions:strings,questions:strings,dashboard:object({layout:{type:'string',enum:['kpi-first','charts-first']},countryColumn:string,dateColumn:string,metrics:array(object({id:string,operation:{type:'string',enum:['sum','mean','count','distinct']},columns:strings,rules:array(rule)})),kpis:array(object({label:string,metric:string,numerator:string,denominator:string,denominatorExtra:string,scale:{type:'number'}},['label'])),charts:array(object({view:{type:'string',enum:['area','line','bar','ranking','table']},width:{type:'string',enum:['wide','standard']},title:string,metric:string,groupBy:string,time:{type:'boolean'},limit:{type:'integer'}}))})});
export class AIResponseError extends Error{constructor(public code:string,message:string){super(message)}}
export function parseAIResponse(response:any){
 const candidate=response?.candidates?.[0];
 if(response?.promptFeedback?.blockReason||candidate?.finishReason==='SAFETY')throw new AIResponseError('AI_BLOCKED','The AI service blocked this request. Try a different analysis request.');
 if(candidate?.finishReason==='MAX_TOKENS')throw new AIResponseError('AI_TRUNCATED','The AI response reached its output limit. Please retry the analysis.');
 const text=candidate?.content?.parts?.filter((part:any)=>!part.thought).map((part:any)=>part.text||'').join('\n').trim();
 if(!text)throw new AIResponseError('AI_EMPTY','The AI service returned an empty response. Please retry.');
 try{return JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''))}catch{throw new AIResponseError('AI_JSON','The AI response was incomplete or had an invalid format. Please retry.');}
}
const reviewRule=object({column:string,op:{type:'string',enum:['eq','ne','gt','ge','lt','le','contains','missing','notMissing']},value:{anyOf:[string,{type:'number'}]}},['column','op']);
const narrative={headline:string,observations:array(object({text:string,factIds:strings})),limitations:strings};
export const CHAT_SCHEMA=object({action:{type:'string',enum:['answer','update','review','presentation']},...narrative,review:object({operation:{type:'string',enum:['inspect','remove_duplicates','remove_matching']},scope:{type:'string',enum:['all','active']},selection:object({kind:{type:'string',enum:['duplicates','rows']},rules:array(reviewRule)})}),chartChanges:array(object({chartTitle:string,view:{type:'string',enum:['area','line','bar','ranking','table']},width:{type:'string',enum:['wide','standard']},limit:{type:'integer'}},['chartTitle']))},['action','headline','observations','limitations']);
export const INSIGHT_SCHEMA=object({action:{type:'string',enum:['answer']},...narrative});
