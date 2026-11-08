import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {allowRequest,requestIp} from '@/lib/limits';
import {bookingSchema,errorMessage} from '@/lib/schemas';
export async function POST(req:Request){
  if(!allowRequest(requestIp(req),'bookings',5,10*60*1000))return NextResponse.json({error:'Too many requests'},{status:429});
  try{
    const fields=bookingSchema.parse(await req.json());
    await prisma.booking.create({data:fields});
    return NextResponse.json({message:'Your enquiry has been received by Karma.'},{status:201});
  }catch(e:any){
    if(e?.name==='ZodError')return NextResponse.json({error:errorMessage(e)},{status:400});
    return NextResponse.json({error:'Could not submit request'},{status:503});
  }
}
