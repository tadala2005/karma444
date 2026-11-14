import {
  NextResponse
} from "next/server";

import {
  prisma
} from "@/lib/db";

import {
  sessionUser
} from "@/lib/auth";

type Context = {
  params: Promise<{
    reference: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: Context
) {
  const { reference } = await params;

  if (
    !/^KARMA-[a-f0-9-]{36}$/i.test(
      reference
    )
  ) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const order =
      await prisma.order.findUnique({
        where: {
          reference
        },

        include: {
          items: {
            select: {
              id: true,
              title: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              size: true,
              color: true,
              kind: true
            }
          }
        }
      });

    if (!order) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const user =
      await sessionUser();

    const authorized = Boolean(
      user &&
      (
        order.userId === user.id ||
        user.role === "ADMIN"
      )
    );

    const physical =
      order.items.some(
        item => item.kind === "PRODUCT"
      );

    return NextResponse.json(
      {
        order: {
          reference:
            order.reference,

          status:
            order.status,

          total:
            order.total,

          createdAt:
            order.createdAt,

          items:
            order.items,

          physical,

          deliveryMethod:
            order.deliveryMethod,

          deliveryOther:
            order.deliveryOther,

          deliveryQuotedSeparately:
            physical &&
            order.deliveryMethod !== "PICKUP",

          ...(authorized
            ? {
                email:
                  order.email,

                phone:
                  order.phone,

                city:
                  order.city,

                address:
                  order.address,

                deliveryNotes:
                  order.deliveryNotes
              }
            : {})
        }
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    console.error(
      "[KARMA] Order lookup failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Order lookup is temporarily unavailable."
      },
      { status: 503 }
    );
  }
}
