import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {z} from 'zod';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return NextResponse.json({error:'Forbidden'},{status:403});
 const {id}=await params;
 try{
  const {status}=z.object({status:z.enum(['PROCESSING','SHIPPED','DELIVERED'])}).parse(await req.json());
  const order=await prisma.order.findUnique({where:{id}});
  if(!order || !['PAID','PROCESSING','SHIPPED'].includes(order.status))return NextResponse.json({error:'Only confirmed paid orders can advance to fulfillment'},{status:409});
  const from={PAID:['PROCESSING'],PROCESSING:['SHIPPED'],SHIPPED:['DELIVERED']} as Record<string,string[]>;
  if(!from[order.status].includes(status))return NextResponse.json({error:'Invalid status transition'},{status:409});
  const result=await prisma.order.updateMany({where:{id,status:order.status},data:{status}});
  if(!result.count)return NextResponse.json({error:'Status changed; refresh'},{status:409});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Invalid request'},{status:400});}
}
