import {createHmac,timingSafeEqual} from 'node:crypto';
type Ticket={id:string;path:string;isExcel:boolean;expires:number};
function signature(body:string){const key=process.env.E2B_API_KEY;if(!key)throw Error('Analysis service is not configured.');return createHmac('sha256',key).update(body).digest('base64url')}
export function issueTicket(data:Ticket){const body=Buffer.from(JSON.stringify(data)).toString('base64url');return body+'.'+signature(body)}
export function verifyTicket(token:unknown):Ticket{
 if(typeof token!=='string'||token.length>2000)throw Error('Invalid analysis session.');
 const [body,sig,...rest]=token.split('.');const expected=Buffer.from(signature(body));const actual=Buffer.from(sig||'');
 if(rest.length||actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('Invalid analysis session.');
 const data=JSON.parse(Buffer.from(body,'base64url').toString()) as Ticket;
 if(!data.id||data.expires<Date.now()||!['/home/user/input.csv','/home/user/input.xlsx'].includes(data.path))throw Error('Analysis session expired. Please retry.');
 return data;
}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw Error('Invalid request origin.')}
