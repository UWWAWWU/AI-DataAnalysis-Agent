import {Sandbox} from '@e2b/code-interpreter';
import {checkOrigin,issueTicket} from '@/lib/sandbox-ticket';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 let sandbox:Sandbox|undefined;
 try{
  checkOrigin(request);
  const key=process.env.E2B_API_KEY;if(!key)return Response.json({error:'The analysis service is not configured.'},{status:412});
  const {name,size}=await request.json();
  if(typeof name!=='string'||!Number.isInteger(size)||size<=0||size>40*1024*1024||!/\.(csv|xlsx)$/i.test(name))return Response.json({error:'Upload a CSV or XLSX file up to 40 MB.'},{status:400});
  const isExcel=/\.xlsx$/i.test(name),path='/home/user/input.'+(isExcel?'xlsx':'csv');
  sandbox=await Sandbox.create({apiKey:key,timeoutMs:300000,allowInternetAccess:false,secure:true});
  const uploadUrl=await sandbox.uploadUrl(path,{useSignatureExpiration:180});
  const ticket=issueTicket({id:sandbox.sandboxId,path,isExcel,expires:Date.now()+280000});
  return Response.json({uploadUrl,ticket},{headers:{'Cache-Control':'no-store'}});
 }catch{if(sandbox)await sandbox.kill().catch(()=>{});return Response.json({error:'Could not prepare the file upload. Please retry.'},{status:502})}
}
