import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {z} from 'zod';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const {id}=await params;const {status}=z.object({status:z.enum(['NEW','CONTACTED','CLOSED'])}).parse(await req.json());
  await prisma.booking.update({where:{id},data:{status}});return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Unable to update enquiry'},{status:400});}
}
