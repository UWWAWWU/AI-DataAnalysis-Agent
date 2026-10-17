import {agentAllowedActions,type AgentRun} from './analysis-agent';
/** Short protocol guidance precedes domain instructions to avoid phase confusion. */
export function agentStageInstruction(run:AgentRun|undefined,language:'en'|'id'){
 const allowed=agentAllowedActions(run);
 const example={action:'tool',purpose:language==='id'?'Memeriksa kualitas data sebelum memilih analisis.':'Inspect data quality before choosing an analysis.',tool:{name:'quality'}};
 return `CURRENT RESPONSE CONTRACT: choose exactly one action from ${JSON.stringify(allowed)}. Return one flat JSON object. The action is a protocol token, not an activity name: never use inspect, inspect_data, plan, compute_dashboard or analyze. A tool request has {action:"tool",purpose:string,tool:{name:...}}. Format example only: ${JSON.stringify(example)}. Choose the tool appropriate to the analytical question; the example does not dictate the investigation. ${allowed.includes('dashboard')?'For action dashboard, plan must be a plan OBJECT containing the validated dashboard specification, never an array or string.':'For this request a successful investigation is required first: return action tool and omit plan, evidenceIds and limitations.'} ${allowed.includes('finish')?'Finish cites actual successful tool evidence and the latest dashboard evidence.':'Completion is not available yet.'} `;
}
