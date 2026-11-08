import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { issueSession } from '@/lib/auth';
import { allowRequest, requestIp } from '@/lib/limits';
import { loginSchema } from '@/lib/schemas';
export async function POST(req:Request) {
  if(!allowRequest(requestIp(req),'login',10,15*60*1000)) return NextResponse.json({error:'Too many attempts'}, {status:429});
  try{
    const {email,password}=loginSchema.parse(await req.json());
    const user=await prisma.user.findUnique({where:{email}});
    if(!user || !(await bcrypt.compare(password,user.passwordHash))) return NextResponse.json({error:'Incorrect email or password'},{status:401});
    await issueSession(user.id);
    return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  }catch(e:any){
    if(e?.name==='ZodError') return NextResponse.json({error:'Valid email and password required'},{status:400});
    return NextResponse.json({error:'Login temporarily unavailable'},{status:503});
  }
}
