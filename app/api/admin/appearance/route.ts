
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

import {
  IMAGE_SLOT_KEYS
} from "@/lib/media-slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  message: string,
  status: number
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return errorResponse(
      "Administrator access required.",
      403
    );
  }

  const requestOrigin =
    new URL(request.url).origin;

  const origin =
    request.headers.get("origin");

  if (
    (origin && origin !== requestOrigin) ||
    request.headers.get("sec-fetch-site") ===
      "cross-site"
  ) {
    return errorResponse(
      "Invalid request origin.",
      403
    );
  }

  try {
    const body: unknown =
      await request.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    const data = body as Record<
      string,
      unknown
    >;

    const key = data.key;
    const url = data.url;

    if (
      typeof key !== "string" ||
      !IMAGE_SLOT_KEYS.has(key)
    ) {
      return errorResponse(
        "Invalid image placement.",
        400
      );
    }

    if (
      typeof url !== "string"
    ) {
      return errorResponse(
        "An uploaded image URL is required.",
        400
      );
    }

    const endpoint =
      process.env.SUPABASE_URL
        ?.trim()
        .replace(/\/+$/, "");

    if (!endpoint) {
      return errorResponse(
        "Supabase URL is not configured.",
        503
      );
    }

    const allowedPrefix =
      `${endpoint}/storage/v1/object/public/karma-media/`;

    // Only accept images from our own bucket.
    if (
      !url.startsWith(allowedPrefix)
    ) {
      return errorResponse(
        "Please upload an image using Karma Curated's image uploader.",
        400
      );
    }

    const parsed = new URL(url);
    const expectedOrigin =
      new URL(endpoint).origin;

    if (
      parsed.origin !== expectedOrigin ||
      parsed.search ||
      parsed.hash ||
      !/\.(jpg|jpeg|png|webp)$/i.test(
        parsed.pathname
      )
    ) {
      return errorResponse(
        "Invalid image URL.",
        400
      );
    }

    const item =
      await prisma.siteAsset.upsert({
        where: { key },

        create: {
          key,
          imageUrl: url
        },

        update: {
          imageUrl: url
        }
      });

    return NextResponse.json({
      success: true,
      item
    });

  } catch (error) {
    console.error(
      "Karma appearance update failed",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return errorResponse(
      "Unable to update website appearance.",
      500
    );
  }
}
