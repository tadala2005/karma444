import { NextRequest,NextResponse } from 'next/server';
import { reconcileOrder } from '@/lib/paychangu';
import { allowRequest,requestIp } from '@/lib/limits';
export async function POST(req:NextRequest){
  if(!allowRequest(requestIp(req),'verify',15,5*60*1000)) return NextResponse.json({error:'Too many requests'},{status:429});
  try {
    const {reference}=await req.json();
    if(typeof reference!=='string'||!/^KARMA-[a-f0-9-]{36}$/i.test(reference)) return NextResponse.json({error:'Invalid reference'},{status:400});
    const order=await reconcileOrder(reference);
    return NextResponse.json({status:order.status,reference:order.reference});
  }catch { return NextResponse.json({error:'Verification not available yet. Check back shortly.'},{status:503}); }
}
