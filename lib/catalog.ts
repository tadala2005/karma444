import { prisma } from '@/lib/db';
import { demoArtists, demoArticles, demoEvents, demoProducts } from './demo';
// When the database is not configured, serve clearly labeled illustrative content.
// When a real database IS configured, propagate DB errors rather than silently
// impersonating live catalogue stock or events with sample inventory.
export async function artists() {
  if (!process.env.DATABASE_URL) return demoArtists;
  return prisma.artist.findMany({orderBy:[{featured:'desc'},{createdAt:'desc'}]});
}
export async function articles() {
  if (!process.env.DATABASE_URL) return demoArticles;
  return prisma.article.findMany({orderBy:[{featured:'desc'},{publishedAt:'desc'}]});
}
export async function events() {
  if (!process.env.DATABASE_URL) return demoEvents;
  return prisma.event.findMany({orderBy:{date:'asc'}});
}
export async function products() {
  if (!process.env.DATABASE_URL) return demoProducts;
  return prisma.product.findMany({orderBy:[{featured:'desc'},{createdAt:'desc'}]});
}
export async function artist(slug:string) { return (await artists()).find(x=>x.slug===slug); }
export async function article(slug:string) { return (await articles()).find(x=>x.slug===slug); }
export async function event(slug:string) { return (await events()).find(x=>x.slug===slug); }
export async function product(slug:string) { return (await products()).find(x=>x.slug===slug); }
