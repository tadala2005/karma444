import { NextResponse } from 'next/server';
import { sessionUser } from '@/lib/auth';
export async function GET(){ return NextResponse.json({user:await sessionUser()}); }
