import {
  randomUUID
} from "node:crypto";

import {
  NextResponse
} from "next/server";

import { prisma } from "@/lib/db";
import { sessionUser } from "@/lib/auth";

import {
  allowRequest,
  requestIp
} from "@/lib/limits";

import {
  checkoutSchema,
  errorMessage
} from "@/lib/schemas";

import {
  paymentsEnabled
} from "@/lib/commerce";

import {
  startPayment
} from "@/lib/paychangu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Group = {
  kind: "PRODUCT" | "TICKET";
  id: string;
  quantity: number;
  size?: string;
  color?: string;
};

type OrderLine = {
  kind: "PRODUCT" | "TICKET";
  catalogId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  size?: string;
  color?: string;
  variantId?: string;
};

function fail(
  message: string,
  status: number
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

function validOrigin(req: Request): boolean {
  const expected =
    process.env.NEXT_PUBLIC_APP_URL;

  const origin =
    req.headers.get("origin");

  if (!expected || !origin) {
    return false;
  }

  try {
    return (
      new URL(origin).origin ===
      new URL(expected).origin
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!paymentsEnabled()) {
    return fail(
      "Online payment is not available yet.",
      503
    );
  }

  if (!validOrigin(req)) {
    return fail(
      "Invalid checkout origin.",
      403
    );
  }

  if (
    !allowRequest(
      requestIp(req),
      "checkout",
      10,
      10 * 60_000
    )
  ) {
    return fail(
      "Too many checkout attempts.",
      429
    );
  }

  try {
    const { items, customer } =
      checkoutSchema.parse(
        await req.json()
      );

    const grouped =
      new Map<string, Group>();

    for (const item of items) {
      const key = [
        item.kind,
        item.id,
        item.size?.trim().toLowerCase() || "",
        item.color?.trim().toLowerCase() || ""
      ].join(":");

      const previous = grouped.get(key);

      grouped.set(key, {
        ...item,

        quantity:
          item.quantity +
          (previous?.quantity || 0)
      });
    }

    const combined = [
      ...grouped.values()
    ];

    if (
      combined.some(
        item => item.quantity > 10
      )
    ) {
      return fail(
        "Maximum 10 units per size and color.",
        400
      );
    }

    const lineItems: OrderLine[] = [];

    for (const item of combined) {
      if (item.kind === "PRODUCT") {
        const product =
          await prisma.product.findUnique({
            where: {
              id: item.id
            },
            include: {
              variants: {
                where: {
                  active: true
                }
              }
            }
          });

        if (!product) {
          return fail(
            "A product is unavailable.",
            400
          );
        }

        if (
          !Number.isSafeInteger(
            product.price
          ) ||
          product.price <= 0
        ) {
          return fail(
            "This product cannot be purchased.",
            400
          );
        }

        if (product.variants.length > 0) {
          const selected =
            product.variants.find(
              variant =>
                variant.size
                  .trim()
                  .toLowerCase() ===
                  item.size
                    ?.trim()
                    .toLowerCase() &&
                variant.color
                  .trim()
                  .toLowerCase() ===
                  item.color
                    ?.trim()
                    .toLowerCase()
            );

          if (!selected) {
            return fail(
              `Choose a valid size and color for ${product.name}.`,
              400
            );
          }

          if (
            selected.stock <
            item.quantity
          ) {
            return fail(
              `Insufficient stock: ${product.name} / ${selected.size} / ${selected.color}.`,
              409
            );
          }

          lineItems.push({
            kind: "PRODUCT",
            catalogId: product.id,
            title: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal:
              product.price *
              item.quantity,
            size: selected.size,
            color: selected.color,
            variantId: selected.id
          });

        } else {
          const headwear =
            /skull|headwear/i.test(
              `${product.name} ${product.category}`
            );

          if (headwear) {
            return fail(
              `${product.name} needs size/color configuration.`,
              400
            );
          }

          if (
            item.size ||
            item.color
          ) {
            return fail(
              "This product has no selectable variants.",
              400
            );
          }

          if (
            product.stock <
            item.quantity
          ) {
            return fail(
              `Insufficient stock: ${product.name}.`,
              409
            );
          }

          lineItems.push({
            kind: "PRODUCT",
            catalogId: product.id,
            title: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal:
              product.price *
              item.quantity
          });
        }

      } else {
        if (
          item.size ||
          item.color
        ) {
          return fail(
            "Event tickets do not use size or color.",
            400
          );
        }

        const event =
          await prisma.event.findUnique({
            where: {
              id: item.id
            }
          });

        if (!event) {
          return fail(
            "Event not found.",
            400
          );
        }

        if (
          event.date <= new Date()
        ) {
          return fail(
            "Ticket sales have ended.",
            400
          );
        }

        if (event.price <= 0) {
          return fail(
            "Free events use RSVP registration.",
            400
          );
        }

        if (
          event.remaining <
          item.quantity
        ) {
          return fail(
            "Insufficient tickets.",
            409
          );
        }

        lineItems.push({
          kind: "TICKET",
          catalogId: event.id,
          title: event.title,
          unitPrice: event.price,
          quantity: item.quantity,
          subtotal:
            event.price *
            item.quantity
        });
      }
    }

    // Recheck combined quantity across
    // all variants of the same product
    // or tickets for the same event.
    const totals = new Map<
      string,
      {
        kind: "PRODUCT" | "TICKET";
        id: string;
        quantity: number;
      }
    >();

    for (const line of lineItems) {
      const key = [
        line.kind,
        line.catalogId
      ].join(":");

      const previous = totals.get(key);

      totals.set(key, {
        kind: line.kind,
        id: line.catalogId,

        quantity:
          line.quantity +
          (previous?.quantity || 0)
      });
    }

    for (const entry of totals.values()) {
      const available =
        entry.kind === "PRODUCT"
          ? (
              await prisma.product.findUnique({
                where: {
                  id: entry.id
                },
                select: {
                  stock: true
                }
              })
            )?.stock
          : (
              await prisma.event.findUnique({
                where: {
                  id: entry.id
                },
                select: {
                  remaining: true
                }
              })
            )?.remaining;

      if (
        available === undefined ||
        available < entry.quantity
      ) {
        return fail(
          "Combined quantity exceeds availability.",
          409
        );
      }
    }

    const total = lineItems.reduce(
      (sum, line) =>
        sum + line.subtotal,
      0
    );

    if (
      !Number.isSafeInteger(total) ||
      total <= 0 ||
      total > 2147483647
    ) {
      return fail(
        "Invalid order total.",
        400
      );
    }

    const physical = lineItems.some(
      line => line.kind === "PRODUCT"
    );

    const reference =
      `KARMA-${randomUUID()}`;

    const user = await sessionUser();

    // Guest checkout:
    // userId may legitimately be null.
    const order =
      await prisma.order.create({
        data: {
          reference,
          userId: user?.id ?? null,

          name: customer.name,
          email: customer.email,
          phone: customer.phone,

          address: physical
            ? customer.address
            : "",

          city: physical
            ? customer.city
            : "",

          deliveryMethod: physical
            ? customer.deliveryMethod
            : "NONE",

          deliveryOther:
            physical &&
            customer.deliveryMethod === "OTHER"
              ? customer.deliveryOther
              : null,

          deliveryNotes:
            physical &&
            customer.deliveryNotes
              ? customer.deliveryNotes
              : null,

          deliveryTermsAccepted:
            physical
              ? customer.deliveryTermsAccepted
              : false,

          total,

          items: {
            create: lineItems
          }
        }
      });

    let checkoutUrl: string;

    try {
      checkoutUrl = await startPayment({
        reference,
        amount: total,
        name: customer.name,
        email: customer.email
      });

    } catch (caught) {
      console.error(
        "[KARMA] Payment initialization failed:",
        caught
      );

      await prisma.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING"
        },
        data: {
          status: "FAILED"
        }
      });

      return fail(
        "Payment could not start. No successful payment has been confirmed.",
        502
      );
    }

    // If this update fails, leave the
    // order pending for later reconciliation.
    // Do not falsely mark an initialized
    // payment session as failed.
    try {
      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          paymentLink: checkoutUrl
        }
      });

    } catch (caught) {
      console.error(
        "[KARMA] Payment link persistence failed:",
        caught
      );

      return fail(
        "Checkout could not be completed. Contact support before attempting another payment.",
        503
      );
    }

    return NextResponse.json(
      {
        reference,
        checkoutUrl
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (caught) {
    if (
      caught instanceof Error &&
      caught.name === "ZodError"
    ) {
      return fail(
        errorMessage(caught),
        400
      );
    }

    console.error(
      "[KARMA] Checkout failed:",
      caught
    );

    return fail(
      "Checkout is temporarily unavailable.",
      503
    );
  }
}
