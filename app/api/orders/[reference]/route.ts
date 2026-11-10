
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sessionUser } from "@/lib/auth";

type Context = {
  params: Promise<{ reference: string }>;
};

export async function GET(
  _req: Request,
  { params }: Context
) {
  const { reference } = await params;

  if (
    !/^KARMA-[a-f0-9-]{36}$/i.test(reference)
  ) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { reference },

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

    const user = await sessionUser();

    const authorized =
      user &&
      (
        order.userId === user.id ||
        user.role === "ADMIN"
      );

    return NextResponse.json({
      order: {
        reference: order.reference,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items,

        ...(authorized
          ? {
              email: order.email,
              city: order.city
            }
          : {})
      }
    });

  } catch {
    return NextResponse.json(
      {
        error: "Order lookup unavailable"
      },
      { status: 503 }
    );
  }
}
