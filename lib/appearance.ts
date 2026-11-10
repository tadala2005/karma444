
import { prisma } from "@/lib/db";

import {
  DEFAULT_IMAGES,
  IMAGE_SLOT_KEYS
} from "@/lib/media-slots";

import type {
  ImageSlot
} from "@/lib/media-slots";

export async function getAppearance():
  Promise<Record<ImageSlot, string>> {

  const images: Record<ImageSlot, string> = {
    ...DEFAULT_IMAGES
  };

  if (!process.env.DATABASE_URL) {
    return images;
  }

  const assets =
    await prisma.siteAsset.findMany({
      select: {
        key: true,
        imageUrl: true
      }
    });

  for (const asset of assets) {
    if (
      IMAGE_SLOT_KEYS.has(asset.key) &&
      asset.imageUrl
    ) {
      images[asset.key as ImageSlot] =
        asset.imageUrl;
    }
  }

  return images;
}
