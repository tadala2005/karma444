import { NextRequest, NextResponse } from 'next/server';
import { reconcileOrder } from '@/lib/paychangu';
export async function GET(req:NextRequest){
  const ref=req.nextUrl.searchParams.get('tx_ref');
  if(ref && /^KARMA-[a-f0-9-]{36}$/i.test(ref)) {
    try { await reconcileOrder(ref); } catch(e:any) { console.error('PayChangu return verification:',e?.message); }
  }
  const target=new URL('/order',req.nextUrl.origin);
  if(ref && /^KARMA-[a-f0-9-]{36}$/i.test(ref)) target.searchParams.set('ref',ref);
  return NextResponse.redirect(target,303);
}
// Some PayChangu integrations post the return payload. The signed webhook handles backend updates.
export async function POST(req:NextRequest){
  const form=await req.formData().catch(()=>null);
  const ref=String(form?.get('tx_ref')||'');
  const url=new URL('/api/paychangu/callback',req.nextUrl.origin);
  if(/^KARMA-[a-f0-9-]{36}$/i.test(ref)) url.searchParams.set('tx_ref',ref);
  return NextResponse.redirect(url,303);
}
