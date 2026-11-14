import {
  NextResponse
} from "next/server";

import {
  prisma
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await Promise.all([
      prisma.user.findFirst({
        select: {
          id: true
        }
      }),

      prisma.product.findFirst({
        select: {
          id: true,
          gallery: true
        }
      }),

      prisma.siteAsset.findFirst({
        select: {
          key: true
        }
      }),

      prisma.productVariant.findFirst({
        select: {
          id: true
        }
      }),

      prisma.order.findFirst({
        select: {
          id: true,
          deliveryMethod: true,
          deliveryTermsAccepted: true
        }
      })
    ]);

    return NextResponse.json(
      {
        service: "karma-curated",
        status: "ok",
        database: "connected",
        schema: "ready"
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    console.error(
      "[KARMA] Health check failed:",
      error
    );

    return NextResponse.json(
      {
        service: "karma-curated",
        status: "unavailable"
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
