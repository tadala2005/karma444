
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import {
  allowRequest,
  requestIp
} from "@/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET = "karma-media";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function signatureMatches(
  bytes: Uint8Array,
  mime: string
): boolean {
  if (mime === "image/jpeg") {
    return (
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mime === "image/png") {
    const signature = [
      137, 80, 78, 71, 13, 10, 26, 10
    ];

    return signature.every(
      (byte, i) => bytes[i] === byte
    );
  }

  if (mime === "image/webp") {
    const prefix = String.fromCharCode(
      ...bytes.slice(0, 4)
    );

    const format = String.fromCharCode(
      ...bytes.slice(8, 12)
    );

    return (
      prefix === "RIFF" &&
      format === "WEBP"
    );
  }

  return false;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Administrator access required" },
      { status: 403 }
    );
  }

  if (
    !allowRequest(
      requestIp(req),
      "media-upload",
      20,
      60_000
    )
  ) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      { status: 429 }
    );
  }

  const origin = req.headers.get("origin");

  if (
    origin &&
    origin !== new URL(req.url).origin
  ) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    );
  }

  const endpoint = process.env.SUPABASE_URL
    ?.replace(/\/$/, "");

  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !endpoint ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(
      endpoint
    ) ||
    !secret
  ) {
    return NextResponse.json(
      {
        error:
          "Supabase Storage is not configured"
      },
      { status: 503 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Select an image" },
        { status: 400 }
      );
    }

    const extension = MIME_EXT[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG and WebP images are supported"
        },
        { status: 400 }
      );
    }

    if (
      file.size === 0 ||
      file.size > MAX_BYTES
    ) {
      return NextResponse.json(
        {
          error:
            "Image must be smaller than 4 MB"
        },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(
      await file.arrayBuffer()
    );

    if (!signatureMatches(bytes, file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format"
        },
        { status: 400 }
      );
    }

    const month = new Date()
      .toISOString()
      .slice(0, 7);

    const filename =
      `${randomUUID()}.${extension}`;

    const path =
      `uploads/${month}/${filename}`;

    const headers: Record<string, string> = {
      apikey: secret,
      "Content-Type": file.type,
      "x-upsert": "false"
    };

    if (secret.startsWith("eyJ")) {
      headers.Authorization = `Bearer ${secret}`;
    }

    const result = await fetch(
      `${endpoint}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers,
        body: bytes,
        cache: "no-store"
      }
    );

    if (!result.ok) {
      console.error(
        "Storage upload failed:",
        result.status
      );

      return NextResponse.json(
        {
          error:
            "Upload failed. Check your Supabase Storage settings."
        },
        { status: 502 }
      );
    }

    const url =
      `${endpoint}/storage/v1/object/public/${BUCKET}/${path}`;

    return NextResponse.json(
      {
        url,
        path
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(
      "Image upload error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}
