
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

import {
  IMAGE_SLOT_KEYS
} from "@/lib/media-slots";

import {
  imageUrl
} from "@/lib/schemas";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const { key, url } = await req.json();

    if (
      typeof key !== "string" ||
      !IMAGE_SLOT_KEYS.has(key)
    ) {
      return NextResponse.json(
        { error: "Invalid image location" },
        { status: 400 }
      );
    }

    const validatedUrl = imageUrl.parse(url);

    const item = await prisma.siteAsset.upsert({
      where: { key },

      create: {
        key,
        imageUrl: validatedUrl
      },

      update: {
        imageUrl: validatedUrl
      }
    });

    return NextResponse.json({ item });

  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save the image"
      },
      { status: 400 }
    );
  }
}
