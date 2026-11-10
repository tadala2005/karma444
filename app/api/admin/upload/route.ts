
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import {
  allowRequest,
  requestIp
} from "@/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "karma-media";
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES:
  Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

function errorResponse(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status }
  );
}

function validImageSignature(
  data: Uint8Array,
  type: string
): boolean {
  if (data.length < 12) {
    return false;
  }

  if (type === "image/jpeg") {
    return (
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff
    );
  }

  if (type === "image/png") {
    const png = [
      137, 80, 78, 71, 13, 10, 26, 10
    ];

    return png.every(
      (byte, index) =>
        data[index] === byte
    );
  }

  if (type === "image/webp") {
    const riff = String.fromCharCode(
      ...data.subarray(0, 4)
    );

    const webp = String.fromCharCode(
      ...data.subarray(8, 12)
    );

    return (
      riff === "RIFF" &&
      webp === "WEBP"
    );
  }

  return false;
}

function storageConfig() {
  const endpoint =
    process.env.SUPABASE_URL
      ?.trim()
      .replace(/\/+$/, "");

  const secret = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  if (!endpoint || !secret) {
    return null;
  }

  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(
      endpoint
    )
  ) {
    return null;
  }

  return { endpoint, secret };
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return errorResponse(
      "Administrator access required.",
      403
    );
  }

  if (
    !allowRequest(
      requestIp(request),
      "media-upload",
      20,
      60_000
    )
  ) {
    return errorResponse(
      "Too many uploads. Try again shortly.",
      429
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
      "Cross-origin uploads are not allowed.",
      403
    );
  }

  const config = storageConfig();

  if (!config) {
    return errorResponse(
      "Supabase Storage credentials are missing.",
      503
    );
  }

  const contentLength = Number(
    request.headers.get("content-length") || 0
  );

  if (
    contentLength >
    MAX_FILE_SIZE + 200_000
  ) {
    return errorResponse(
      "Upload exceeds the 4 MB image limit.",
      413
    );
  }

  try {
    const form = await request.formData();

    const file = form.get("file");

    if (!(file instanceof File)) {
      return errorResponse(
        "Select an image.",
        400
      );
    }

    const extension =
      ALLOWED_TYPES[file.type];

    if (!extension) {
      return errorResponse(
        "Only JPG, PNG and WebP are allowed.",
        400
      );
    }

    if (
      file.size === 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return errorResponse(
        "Image must be between 1 byte and 4 MB.",
        413
      );
    }

    const buffer =
      await file.arrayBuffer();

    const bytes =
      new Uint8Array(buffer);

    if (
      !validImageSignature(
        bytes,
        file.type
      )
    ) {
      return errorResponse(
        "The selected file is not a valid supported image.",
        400
      );
    }

    const month =
      new Date().toISOString().slice(0, 7);

    const filename =
      `${randomUUID()}.${extension}`;

    const path =
      `uploads/${month}/${filename}`;

    const headers: Record<string, string> = {
      apikey: config.secret,
      "Content-Type": file.type,
      "x-upsert": "false",
      "cache-control": "3600"
    };

    // Only legacy JWT service-role keys
    // should be used as Bearer tokens.
    if (
      config.secret.startsWith("eyJ")
    ) {
      headers.Authorization =
        `Bearer ${config.secret}`;
    }

    const response = await fetch(
      `${config.endpoint}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers,
        body: buffer,
        cache: "no-store",
        signal: AbortSignal.timeout(25_000)
      }
    );

    if (!response.ok) {
      console.error(
        "Supabase image upload failed",
        response.status,
        await response.text()
      );

      return errorResponse(
        "Supabase rejected the image. Check the bucket and server credentials.",
        502
      );
    }

    const url =
      `${config.endpoint}/storage/v1/object/public/${BUCKET}/${path}`;

    return NextResponse.json(
      {
        success: true,
        url,
        path,
        bucket: BUCKET
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(
      "Karma media upload error",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return errorResponse(
      "Image upload failed. Please retry.",
      500
    );
  }
}
