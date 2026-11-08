import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { issueSession } from '@/lib/auth';
import { allowRequest, requestIp } from '@/lib/limits';
import { errorMessage, registerSchema } from '@/lib/schemas';

export async function POST(req:Request) {
  if(!allowRequest(requestIp(req),'register',5,15*60*1000)) return NextResponse.json({error:'Too many attempts'}, {status:429});
  try {
    const fields=registerSchema.parse(await req.json());
    const user=await prisma.user.create({data:{name:fields.name,email:fields.email,passwordHash:await bcrypt.hash(fields.password,12)}});
    await issueSession(user.id);
    return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role}},{status:201});
  }catch(e:any){
    if(e?.code==='P2002') return NextResponse.json({error:'Email already registered'},{status:409});
    if(e?.name==='ZodError') return NextResponse.json({error:errorMessage(e)},{status:400});
    console.error('registration error',e?.message);
    return NextResponse.json({error:'Registration unavailable'},{status:503});
  }
}
