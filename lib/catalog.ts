import {
  prisma
} from "@/lib/db";

import {
  demoArtists,
  demoArticles,
  demoEvents,
  demoProducts
} from "./demo";

function hasDatabase(): boolean {
  return Boolean(
    process.env.DATABASE_URL
  );
}

function sampleProducts() {
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

export async function artists() {
  if (!hasDatabase()) {
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
  if (!hasDatabase()) {
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
  if (!hasDatabase()) {
    return demoEvents;
  }

  return prisma.event.findMany({
    orderBy: {
      date: "asc"
    }
  });
}

export async function products() {
  if (!hasDatabase()) {
    return sampleProducts();
  }

  return prisma.product.findMany({
    include: {
      variants: {
        where: {
          active: true
        }
      }
    },

    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" }
    ]
  });
}

export async function artist(
  slug: string
) {
  if (!hasDatabase()) {
    return demoArtists.find(
      item => item.slug === slug
    ) ?? null;
  }

  return prisma.artist.findUnique({
    where: {
      slug
    }
  });
}

export async function article(
  slug: string
) {
  if (!hasDatabase()) {
    return demoArticles.find(
      item => item.slug === slug
    ) ?? null;
  }

  return prisma.article.findUnique({
    where: {
      slug
    }
  });
}

export async function event(
  slug: string
) {
  if (!hasDatabase()) {
    return demoEvents.find(
      item => item.slug === slug
    ) ?? null;
  }

  return prisma.event.findUnique({
    where: {
      slug
    }
  });
}

export async function product(
  slug: string
) {
  if (!hasDatabase()) {
    return sampleProducts().find(
      item => item.slug === slug
    ) ?? null;
  }

  return prisma.product.findUnique({
    where: {
      slug
    },

    include: {
      variants: {
        where: {
          active: true
        }
      }
    }
  });
}
