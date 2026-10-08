import {Sandbox} from '@e2b/code-interpreter';
import {checkOrigin,verifyTicket} from '@/lib/sandbox-ticket';
import {pythonAnalysisProgram,validatePythonEvidence} from '@/lib/agent-python';
export const runtime='nodejs';
export const maxDuration=90;
export async function POST(request:Request){
 let sandbox:Sandbox|undefined;
 try{
  checkOrigin(request);
  const text=await request.text();if(text.length>40000)return Response.json({error:'Python request too large.'},{status:413});
  const body=JSON.parse(text),session=verifyTicket(body.ticket);
  if(typeof body.code!=='string'||!body.code.trim()||body.code.length>20000)throw Error('Invalid Python code.');
  sandbox=await Sandbox.connect(session.id,{apiKey:process.env.E2B_API_KEY});
  const execution=await sandbox.runCode(pythonAnalysisProgram({path:session.path,isExcel:session.isExcel,sheet:String(body.sheet||''),baseDeduplicated:body.baseDeduplicated===true,selection:body.selection||{},dashboard:body.dashboard},body.code),{timeoutMs:60000});
  if(execution.error)return Response.json({error:`${execution.error.name}: ${execution.error.value.slice(0,2000)}`},{status:422});
  const line=execution.logs.stdout.join('\n').split('\n').findLast(s=>s.startsWith('__AGENT_RESULT__'));
  if(!line)throw Error('Python did not return structured evidence.');
  const output=JSON.parse(line.slice('__AGENT_RESULT__'.length));
  return Response.json({result:validatePythonEvidence(output.result,output.rows)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Python analysis failed.'},{status:422})}
 finally{if(sandbox)await sandbox.kill().catch(()=>{})}
}
