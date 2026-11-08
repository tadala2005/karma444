import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
export async function GET(req:Request,{params}:{params:Promise<{reference:string}>}){
  const {reference}=await params;
  if(!/^KARMA-[a-f0-9-]{36}$/i.test(reference)) return NextResponse.json({error:'Not found'},{status:404});
  try{
    const order=await prisma.order.findUnique({where:{reference},include:{items:{select:{id:true,title:true,quantity:true,unitPrice:true,subtotal:true,size:true,kind:true}}}});
    if(!order) return NextResponse.json({error:'Not found'},{status:404});
    // A random unguessable reference is shared with the guest checkout. Never expose sensitive contact data in lookup.
    const user=await sessionUser();
    return NextResponse.json({order:{reference:order.reference,status:order.status,total:order.total,createdAt:order.createdAt,items:order.items,...(user&&(order.userId===user.id||user.role==='ADMIN')?{email:order.email,city:order.city}:{} )}});
  } catch { return NextResponse.json({error:'Order lookup unavailable'},{status:503}); }
}
