
import { prisma } from "@/lib/db";

import {
  demoArtists,
  demoArticles,
  demoEvents,
  demoProducts
} from "./demo";

export async function artists() {
  if (!process.env.DATABASE_URL) {
    return demoArtists;
  }

  return prisma.artist.findMany({
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" }
    ]
  });
}

export async function articles() {
  if (!process.env.DATABASE_URL) {
    return demoArticles;
  }

  return prisma.article.findMany({
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" }
    ]
  });
}

export async function events() {
  if (!process.env.DATABASE_URL) {
    return demoEvents;
  }

  return prisma.event.findMany({
    orderBy: { date: "asc" }
  });
}

export async function products() {
  if (!process.env.DATABASE_URL) {
    return demoProducts.map(product => ({
      ...product,
      gallery: [] as string[],
      variants: [] as {
        id: string;
        size: string;
        color: string;
        stock: number;
      }[]
    }));
  }

  return prisma.product.findMany({
    include: {
      variants: {
        where: { active: true }
      }
    },
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" }
    ]
  });
}

export async function artist(slug: string) {
  return (await artists()).find(
    entry => entry.slug === slug
  );
}

export async function article(slug: string) {
  return (await articles()).find(
    entry => entry.slug === slug
  );
}

export async function event(slug: string) {
  return (await events()).find(
    entry => entry.slug === slug
  );
}

export async function product(slug: string) {
  return (await products()).find(
    entry => entry.slug === slug
  );
}
