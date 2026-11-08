import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sessionUser } from '@/lib/auth';
import { allowRequest,requestIp } from '@/lib/limits';
import { checkoutSchema,errorMessage } from '@/lib/schemas';
import { startPayment } from '@/lib/paychangu';

export async function POST(req:Request) {
  if(!allowRequest(requestIp(req),'checkout',10,10*60*1000)) return NextResponse.json({error:'Too many checkout requests'},{status:429});
  try {
    const {items,customer}=checkoutSchema.parse(await req.json());
    if(items.some(item=>item.kind==='PRODUCT')&&(!customer.address||!customer.city))return NextResponse.json({error:'Shipping address and city required for merchandise'},{status:400});
    // Aggregate identical line items server-side to prevent duplicated lines bypassing stock checks.
    const groups=new Map<string,{kind:'PRODUCT'|'TICKET',id:string,quantity:number,size?:string}>();
    for(const item of items){const k=`${item.kind}:${item.id}:${item.size||''}`;const old=groups.get(k);groups.set(k,{...item,quantity:(old?.quantity||0)+item.quantity});}
    const combined=[...groups.values()];
    if(combined.some(i=>i.quantity>10)) return NextResponse.json({error:'Maximum 10 units per item'},{status:400});
    const lineItems=[] as {kind:'PRODUCT'|'TICKET',catalogId:string,title:string,unitPrice:number,quantity:number,subtotal:number,size?:string}[];
    for(const item of combined){
      const current=item.kind==='PRODUCT' ? await prisma.product.findUnique({where:{id:item.id}}) : await prisma.event.findUnique({where:{id:item.id}});
      if(!current) return NextResponse.json({error:'An item is no longer available'},{status:400});
      if(item.kind==='TICKET' && 'date' in current && current.date <= new Date()) return NextResponse.json({error:'Ticket sales have ended for this event'},{status:400});
      const available=item.kind==='PRODUCT' ? 'stock' in current? current.stock : 0 : 'remaining' in current ? current.remaining : 0;
      if(available<item.quantity) return NextResponse.json({error:`Insufficient availability: ${'name' in current ? current.name : current.title}`},{status:409});
      const price=current.price;
      if(item.kind==='TICKET' && price===0) return NextResponse.json({error:'Free events use RSVP rather than checkout'},{status:400});
      lineItems.push({kind:item.kind,catalogId:current.id,title:'name' in current?current.name:current.title,quantity:item.quantity,unitPrice:price,subtotal:price*item.quantity,size:item.size});
    }
    const inventoryTotals=new Map<string,{kind:'PRODUCT'|'TICKET',id:string,quantity:number}>();
    for(const item of lineItems){const key=`${item.kind}:${item.catalogId}`; const old=inventoryTotals.get(key);inventoryTotals.set(key,{kind:item.kind,id:item.catalogId,quantity:(old?.quantity||0)+item.quantity});}
    for(const item of inventoryTotals.values()) {
      const current=item.kind==='PRODUCT'?await prisma.product.findUnique({where:{id:item.id}}):await prisma.event.findUnique({where:{id:item.id}});
      const available=current&&(item.kind==='PRODUCT' && 'stock' in current?current.stock:'remaining' in current?current.remaining:0);
      if(!current||Number(available)<item.quantity)return NextResponse.json({error:'Combined quantities exceed available inventory'},{status:409});
    }
    const total=lineItems.reduce((s,x)=>s+x.subtotal,0);
    if(!Number.isSafeInteger(total)||total<=0||total>2_147_483_647) return NextResponse.json({error:'Invalid order amount'},{status:400});
    const ref=`KARMA-${randomUUID()}`;
    const user=await sessionUser();
    const order=await prisma.order.create({data:{reference:ref,userId:user?.id??null,name:customer.name,email:customer.email,phone:customer.phone,address:customer.address,city:customer.city,total,items:{create:lineItems}}});
    try {
      const checkoutUrl=await startPayment({reference:ref,amount:total,name:customer.name,email:customer.email});
      await prisma.order.update({where:{id:order.id},data:{paymentLink:checkoutUrl}});
      return NextResponse.json({reference:ref,checkoutUrl},{status:201});
    }catch(e:any){
      await prisma.order.update({where:{id:order.id},data:{status:'FAILED'}});
      return NextResponse.json({error:e?.message||'Unable to initialize payment'},{status:502});
    }
  }catch(e:any){
    if(e?.name==='ZodError') return NextResponse.json({error:errorMessage(e)},{status:400});
    console.error('Checkout failure',e?.message);
    return NextResponse.json({error:'Checkout service temporarily unavailable'},{status:503});
  }
}
