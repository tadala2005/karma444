import {
  NextResponse
} from "next/server";

import {
  prisma
} from "@/lib/db";

import {
  reconcileOrder
} from "@/lib/paychangu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret =
    process.env.CRON_SECRET;

  if (
    !secret ||
    req.headers.get("authorization") !==
      `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (
    !process.env.PAYCHANGU_SECRET_KEY ||
    !process.env.PAYCHANGU_MODE
  ) {
    return NextResponse.json({
      ok: true,
      skipped: "Provider not configured"
    });
  }

  try {
    const orders =
      await prisma.order.findMany({
        where: {
          status: {
            in: [
              "PENDING",
              "FAILED"
            ]
          },

          createdAt: {
            lt: new Date(
              Date.now() - 5 * 60 * 1000
            )
          },

          paymentLink: {
            not: null
          }
        },

        orderBy: {
          createdAt: "desc"
        },

        select: {
          reference: true
        },

        take: 20
      });

    let reconciled = 0;
    let unresolved = 0;

    for (const order of orders) {
      try {
        await reconcileOrder(
          order.reference
        );

        reconciled++;

      } catch (error) {
        unresolved++;

        console.error(
          "[KARMA] Scheduled reconciliation:",
          order.reference,
          error
        );
      }
    }

    return NextResponse.json({
      ok: true,
      checked: orders.length,
      reconciled,
      unresolved
    });

  } catch (error) {
    console.error(
      "[KARMA] Scheduled job failed:",
      error
    );

    return NextResponse.json(
      { error: "Reconciliation unavailable" },
      { status: 503 }
    );
  }
}
