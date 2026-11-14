import {
  prisma
} from "@/lib/db";

import {
  DEFAULT_IMAGES,
  IMAGE_SLOT_KEYS
} from "@/lib/media-slots";

import type {
  ImageSlot
} from "@/lib/media-slots";

export async function getAppearance():
  Promise<Record<ImageSlot, string>> {

  const images:
    Record<ImageSlot, string> = {
      ...DEFAULT_IMAGES
    };

  if (!process.env.DATABASE_URL) {
    return images;
  }

  try {
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
        typeof asset.imageUrl === "string" &&
        asset.imageUrl.trim()
      ) {
        images[
          asset.key as ImageSlot
        ] = asset.imageUrl;
      }
    }

    return images;

  } catch (error) {
    console.error(
      "[KARMA] Appearance loading failed:",
      error
    );

    // Appearance is optional content.
    // Default images preserve page display.
    return images;
  }
}
