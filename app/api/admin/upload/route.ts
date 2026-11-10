
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { allowRequest, requestIp } from "@/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * KARMA CURATED
 * Secure admin media upload endpoint.
 *
 * POST /api/admin/upload
 *
 * Supported:
 * - JPEG
 * - PNG
 * - WebP
 *
 * Destination:
 * Supabase Storage / karma-media
 */

const BUCKET = "karma-media";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function jsonError(
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

/**
 * Verify the actual file signature rather than
 * trusting the browser-provided MIME type.
 */
function isValidImage(
  bytes: Uint8Array,
  mimeType: string
): boolean {
  if (bytes.length < 12) {
    return false;
  }

  if (mimeType === "image/jpeg") {
    return (
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    const signature = [
      137, 80, 78, 71, 13, 10, 26, 10
    ];

    return signature.every(
      (value, index) =>
        bytes[index] === value
    );
  }

  if (mimeType === "image/webp") {
    const riff = String.fromCharCode(
      ...bytes.subarray(0, 4)
    );

    const webp = String.fromCharCode(
      ...bytes.subarray(8, 12)
    );

    return (
      riff === "RIFF" &&
      webp === "WEBP"
    );
  }

  return false;
}

/**
 * Read environment configuration.
 *
 * Supports current Supabase secret API keys
 * and legacy service-role JWT keys.
 */
function getStorageConfig() {
  const url = process.env.SUPABASE_URL
    ?.trim()
    .replace(/\/+$/, "");

  const secret = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  if (!url || !secret) {
    return null;
  }

  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(
      url
    )
  ) {
    return null;
  }

  return {
    url,
    secret
  };
}

/**
 * Build secure Supabase request headers.
 */
function getUploadHeaders(
  secret: string,
  contentType: string
): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: secret,
    "Content-Type": contentType,
    "x-upsert": "false",
    "cache-control": "3600"
  };

  /*
   * Legacy service-role keys are JWTs.
   * New sb_secret_ keys are NOT JWTs
   * and must not be sent as Bearer tokens.
   */
  if (secret.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${secret}`;
  }

  return headers;
}

/**
 * POST /api/admin/upload
 */
export async function POST(request: Request) {
  // 1. Authenticate administrator.
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return jsonError(
        "Administrator access required.",
        403
      );
    }
  } catch {
    return jsonError(
      "Unable to verify administrator session.",
      503
    );
  }

  // 2. Apply rate limiting.
  const ip = requestIp(request);

  if (
    !allowRequest(
      ip,
      "media-upload",
      20,
      60_000
    )
  ) {
    return jsonError(
      "Too many uploads. Please try again shortly.",
      429
    );
  }

  // 3. Reject cross-origin browser requests.
  const origin = request.headers.get("origin");

  const requestOrigin = new URL(
    request.url
  ).origin;

  if (
    origin &&
    origin !== requestOrigin
  ) {
    return jsonError(
      "Invalid request origin.",
      403
    );
  }

  if (
    request.headers.get("sec-fetch-site") ===
    "cross-site"
  ) {
    return jsonError(
      "Cross-site uploads are not allowed.",
      403
    );
  }

  // 4. Check storage configuration.
  const config = getStorageConfig();

  if (!config) {
    return jsonError(
      "Supabase Storage is not configured. Check SUPABASE_URL and SUPABASE_SECRET_KEY.",
      503
    );
  }

  try {
    // 5. Read uploaded form.
    const formData = await request.formData();

    const uploaded = formData.get("file");

    if (!(uploaded instanceof File)) {
      return jsonError(
        "Please select an image to upload.",
        400
      );
    }

    const file = uploaded;

    // 6. Verify MIME type.
    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return jsonError(
        "Unsupported image format. Use JPG, PNG or WebP.",
        400
      );
    }

    // 7. Validate file size.
    if (file.size <= 0) {
      return jsonError(
        "The selected image is empty.",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        "Image exceeds 4 MB. Please upload a smaller image.",
        413
      );
    }

    // 8. Read the file once as an ArrayBuffer.
    const arrayBuffer = await file.arrayBuffer();

    // 9. Validate actual image signature.
    const bytes = new Uint8Array(arrayBuffer);

    if (!isValidImage(bytes, file.type)) {
      return jsonError(
        "Invalid or unsupported image file.",
        400
      );
    }

    // 10. Generate a collision-resistant filename.
    const month = new Date()
      .toISOString()
      .slice(0, 7);

    const filename = [
      randomUUID(),
      extension
    ].join(".");

    const storagePath = [
      "uploads",
      month,
      filename
    ].join("/");

    // 11. Prepare Supabase upload destination.
    const uploadUrl =
      `${config.url}/storage/v1/object/` +
      `${BUCKET}/${storagePath}`;

    // 12. Upload the validated ArrayBuffer.
    const response = await fetch(uploadUrl, {
      method: "POST",

      headers: getUploadHeaders(
        config.secret,
        file.type
      ),

      body: arrayBuffer,

      cache: "no-store",

      signal: AbortSignal.timeout(25000)
    });

    // 13. Handle provider errors.
    if (!response.ok) {
      let providerMessage = "";

      try {
        const errorData: unknown =
          await response.json();

        if (
          errorData &&
          typeof errorData === "object"
        ) {
          const data = errorData as Record<
            string,
            unknown
          >;

          providerMessage = String(
            data.message ||
            data.error ||
            data.statusCode ||
            ""
          );
        }
      } catch {
        providerMessage = "";
      }

      console.error(
        "[KARMA MEDIA] Supabase upload failed",
        {
          status: response.status,
          message: providerMessage
        }
      );

      if (response.status === 401) {
        return jsonError(
          "Supabase authentication failed. Verify the server secret key.",
          502
        );
      }

      if (response.status === 403) {
        return jsonError(
          "Supabase denied the upload. Check storage permissions.",
          502
        );
      }

      if (response.status === 404) {
        return jsonError(
          "Storage bucket karma-media was not found.",
          502
        );
      }

      if (response.status === 413) {
        return jsonError(
          "Supabase rejected the image size.",
          413
        );
      }

      return jsonError(
        "Image upload failed. Check Supabase Storage configuration.",
        502
      );
    }

    // 14. Build the public image URL.
    const publicUrl =
      `${config.url}/storage/v1/object/public/` +
      `${BUCKET}/${storagePath}`;

    // 15. Preserve the response format expected
    // by the existing MediaUpload component.
    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        path: storagePath,
        bucket: BUCKET
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "TimeoutError"
    ) {
      return jsonError(
        "Image upload timed out. Please try again.",
        504
      );
    }

    console.error(
      "[KARMA MEDIA] Upload error:",
      error instanceof Error
        ? error.message
        : "Unknown upload error"
    );

    return jsonError(
      "Unable to upload the image. Please try again.",
      500
    );
  }
}
