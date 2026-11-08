import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {artistSchema,articleSchema,eventSchema,productSchema,errorMessage} from '@/lib/schemas';
import {allowRequest,requestIp} from '@/lib/limits';
export async function POST(req:Request,{params}:{params:Promise<{resource:string}>}){
  if(!await requireAdmin())return NextResponse.json({error:'Forbidden'},{status:403});
  if(!allowRequest(requestIp(req),'admin',60,60000))return NextResponse.json({error:'Too many requests'},{status:429});
  const {resource}=await params;
  try{
    const body=await req.json();
    let item;
    switch(resource){
      case 'artists':item=await prisma.artist.create({data:artistSchema.parse(body)});break;
      case 'articles':item=await prisma.article.create({data:articleSchema.parse(body)});break;
      case 'products':item=await prisma.product.create({data:productSchema.parse(body)});break;
      case 'events':{const data=eventSchema.parse(body);item=await prisma.event.create({data:{...data,date:new Date(data.date),remaining:data.capacity}});break;}
      default:return NextResponse.json({error:'Resource not found'},{status:404});
    }
    return NextResponse.json({item},{status:201});
  }catch(e:any){
    if(e?.code==='P2002')return NextResponse.json({error:'Slug already exists'},{status:409});
    if(e?.name==='ZodError')return NextResponse.json({error:errorMessage(e)},{status:400});
    return NextResponse.json({error:'Could not save content'},{status:503});
  }
}
