import { NextResponse } from 'next/server';
import { validWebhookSignature, reconcileOrder } from '@/lib/paychangu';
export async function POST(req:Request){
  const raw=await req.text();
  if(!validWebhookSignature(raw,req.headers.get('signature'))) return NextResponse.json({error:'Invalid signature'},{status:401});
  let payload:any;
  try{payload=JSON.parse(raw);}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
  const reference=payload?.tx_ref || payload?.data?.tx_ref || payload?.data?.data?.tx_ref;
  if(typeof reference!=='string' || !/^KARMA-[a-f0-9-]{36}$/i.test(reference)) return NextResponse.json({ok:true});
  try { await reconcileOrder(reference); return NextResponse.json({ok:true}); }
  catch(e:any){console.error('Webhook reconciliation failed',e?.message);return NextResponse.json({error:'Could not reconcile'},{status:503});}
}
