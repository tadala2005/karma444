// Pure, independently testable payment checks. These MUST run on the server.
import {createHmac,timingSafeEqual} from 'node:crypto';
export type VerifiedPayment={status:string;tx_ref:string;amount:number;currency:string};
export function validWebhookSignature(raw:string,received:string|null,secret?:string){
 if(!secret||!received)return false;
 const computed=createHmac('sha256',secret).update(raw,'utf8').digest();
 const clean=received.replace(/^sha256=/i,'').trim();
 if(!/^[0-9a-f]{64}$/i.test(clean))return false;
 const provided=Buffer.from(clean,'hex');
 return provided.length===computed.length&&timingSafeEqual(computed,provided);
}
export function paymentMatchesOrder(result:VerifiedPayment,reference:string,total:number){
 return result.tx_ref===reference&&result.currency==='MWK'&&
 Number.isSafeInteger(result.amount)&&Number.isSafeInteger(total)&&total>0&&result.amount>=total;
}
export function isSuccessfulPayment(status:string){return ['success','successful'].includes(status.toLowerCase())}
export function isFailedPayment(status:string){return ['failed','cancelled','canceled'].includes(status.toLowerCase())}
