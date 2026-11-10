
import { prisma } from "@/lib/db";

import {
  IMAGE_SLOT_KEYS,
  DEFAULT_IMAGES
} from "@/lib/media-slots";

import type {
  ImageSlot
} from "@/lib/media-slots";

export async function getAppearance() {
  if (!process.env.DATABASE_URL) {
    return { ...DEFAULT_IMAGES };
  }

  const rows = await prisma.siteAsset.findMany();

  const images: Record<ImageSlot, string> = {
    ...DEFAULT_IMAGES
  };

  for (const row of rows) {
    if (IMAGE_SLOT_KEYS.has(row.key)) {
      images[row.key as ImageSlot] = row.imageUrl;
    }
  }

  return images;
}
