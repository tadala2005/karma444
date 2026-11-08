import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const COOKIE = 'karma_session';
const secret = () => {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET must be configured (minimum 32 characters)');
  return new TextEncoder().encode(raw);
};

export async function sessionUser() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret(), { issuer: 'karma-app', audience: 'karma-users' });
    if (typeof payload.sub !== 'string') return null;
    return await prisma.user.findUnique({where:{id:payload.sub}, select:{id:true, name:true, email:true, role:true}});
  } catch { return null; }
}

export async function issueSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(userId)
    .setIssuedAt().setIssuer('karma-app').setAudience('karma-users').setExpirationTime('7d').sign(secret());
  (await cookies()).set(COOKIE, token, {httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:60*60*24*7});
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function requireAdmin() {
  const user=await sessionUser();
  if (!user || user.role!=='ADMIN') return null;
  return user;
}
