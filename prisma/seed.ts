import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { demoArtists, demoArticles, demoEvents, demoProducts } from '../lib/demo';

const prisma = new PrismaClient();
async function main() {
  // Never publish fictitious events or products to a live catalogue by default.
  // Explicitly opt into placeholder content only in a disposable staging database.
  if (process.env.SEED_DEMO_CONTENT === 'true') {
    for (const a of demoArtists) { const {id, ...data}=a; await prisma.artist.upsert({where:{slug:data.slug}, update:{}, create:data}); }
    for (const a of demoArticles) { const {id, ...data}=a; await prisma.article.upsert({where:{slug:data.slug}, update:{}, create:data}); }
    for (const a of demoEvents) { const {id, ...data}=a; await prisma.event.upsert({where:{slug:data.slug}, update:{}, create:data}); }
    for (const p of demoProducts) { const {id, ...data}=p; await prisma.product.upsert({where:{slug:data.slug}, update:{}, create:data}); }
    console.log('Sample catalogue created; use only in staging.');
  } else {
    console.log('Sample catalogue skipped. Publish real content at /admin.');
  }
  const email=process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const pwd=process.env.SEED_ADMIN_PASSWORD;
  if (email && pwd && pwd.length>=12) {
    const passwordHash=await bcrypt.hash(pwd,12);
    await prisma.user.upsert({where:{email},update:{role:'ADMIN'},create:{email,name:'Karma Admin',passwordHash,role:'ADMIN'}});
    console.log('Admin account provisioned:',email);
  } else console.log('Admin not provisioned. Set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD (12+ characters) and rerun.');

}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
