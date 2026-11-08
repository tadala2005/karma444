import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {sessionUser} from '@/lib/auth';
import {rsvpSchema,errorMessage} from '@/lib/schemas';
import {allowRequest,requestIp} from '@/lib/limits';
export async function POST(req:Request){
  if(!allowRequest(requestIp(req),'rsvp',10,10*60*1000))return NextResponse.json({error:'Too many requests'},{status:429});
  try{
    const fields=rsvpSchema.parse(await req.json());
    const event=await prisma.event.findUnique({where:{id:fields.eventId}});
    if(!event||event.price!==0||event.date<=new Date())return NextResponse.json({error:'RSVP not available'},{status:400});
    const user=await sessionUser();
    const rsvp=await prisma.$transaction(async tx=>{
      if(await tx.rsvp.findUnique({where:{eventId_email:{eventId:fields.eventId,email:fields.email}}}))throw new Error('ALREADY_RSVP');
      const seat=await tx.event.updateMany({where:{id:event.id,remaining:{gte:1}},data:{remaining:{decrement:1}}});
      if(!seat.count)throw new Error('SOLD_OUT');
      return tx.rsvp.create({data:{eventId:event.id,email:fields.email,name:fields.name,userId:user?.id??null}});
    },{isolationLevel:'Serializable'});
    return NextResponse.json({id:rsvp.id,message:'Your RSVP has been saved'},{status:201});
  }catch(e:any){
    if(e?.message==='ALREADY_RSVP'||e?.code==='P2002')return NextResponse.json({error:'This email has already RSVP’d'},{status:409});
    if(e?.message==='SOLD_OUT')return NextResponse.json({error:'No spaces left'},{status:409});
    if(e?.name==='ZodError')return NextResponse.json({error:errorMessage(e)},{status:400});
    return NextResponse.json({error:'Could not save RSVP'},{status:503});
  }
}
