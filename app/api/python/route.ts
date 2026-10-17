import {Sandbox} from '@e2b/code-interpreter';
import {validateSpec} from '@/lib/dashboard';
import {CUBE_PYTHON} from '@/lib/dashboard-python';
import {checkOrigin,verifyTicket} from '@/lib/sandbox-ticket';
export const runtime='nodejs';
export const maxDuration=180;
export async function GET(){return Response.json({configured:Boolean(process.env.E2B_API_KEY)})}
export async function DELETE(request:Request){try{checkOrigin(request);const session=verifyTicket((await request.json()).ticket);await Sandbox.kill(session.id,{apiKey:process.env.E2B_API_KEY});return Response.json({closed:true})}catch{return Response.json({closed:false},{status:400})}}
export async function POST(request:Request){
 let sandbox:Sandbox|undefined;let keepAlive=false;
 try{
  checkOrigin(request);
  const text=await request.text();if(text.length>120000)return Response.json({error:'The analysis request is too large.'},{status:413});
  const body=JSON.parse(text),session=verifyTicket(body.ticket),spec=validateSpec(body.dashboard);
  sandbox=await Sandbox.connect(session.id,{apiKey:process.env.E2B_API_KEY});
  const config=JSON.stringify(JSON.stringify({path:session.path,isExcel:session.isExcel,sheet:String(body.sheet||''),baseDeduplicated:body.baseDeduplicated===true}));
  const prelude=`import pandas as pd, numpy as np, json, os\nconfig = json.loads(${config})\nassert 0 < os.path.getsize(config['path']) <= 40*1024*1024, 'Invalid dataset size'\n`;
  const execution=await sandbox.runCode((prelude+'\n'+CUBE_PYTHON).replace('__SPEC__',JSON.stringify(JSON.stringify(spec))),{timeoutMs:90000});
  if(execution.error)return Response.json({error:'Could not prepare the interactive dashboard data.',executionError:{name:execution.error.name,message:execution.error.value.slice(0,1500)}},{status:422});
  const cubeUrl=await sandbox.downloadUrl('/home/user/dashboard.json',{useSignatureExpiration:90});keepAlive=true;
  return Response.json({cubeUrl,execution:{engine:'Python',status:'succeeded',rowCheck:true}},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'The dashboard calculation could not finish. Please retry.',code:'PYTHON_EXECUTION'},{status:502})}
 finally{if(sandbox&&!keepAlive)await sandbox.kill().catch(()=>{})}
}
