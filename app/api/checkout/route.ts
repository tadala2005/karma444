
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

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

import { startPayment } from "@/lib/paychangu";

export async function POST(req: Request) {
  if (
    !allowRequest(
      requestIp(req),
      "checkout",
      10,
      10 * 60_000
    )
  ) {
    return NextResponse.json(
      { error: "Too many checkout requests" },
      { status: 429 }
    );
  }

  try {
    const {
      items,
      customer
    } = checkoutSchema.parse(
      await req.json()
    );

    if (
      items.some(item => item.kind === "PRODUCT") &&
      (!customer.address || !customer.city)
    ) {
      return NextResponse.json(
        {
          error:
            "Delivery address and city are required"
        },
        { status: 400 }
      );
    }

    type Group = {
      kind: "PRODUCT" | "TICKET";
      id: string;
      quantity: number;
      size?: string;
      color?: string;
    };

    const grouped = new Map<string, Group>();

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

    const combined = [...grouped.values()];

    if (
      combined.some(
        item => item.quantity > 10
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum 10 units per size/color combination"
        },
        { status: 400 }
      );
    }

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

    const lineItems: OrderLine[] = [];

    for (const item of combined) {
      if (item.kind === "PRODUCT") {
        const product = await prisma.product.findUnique({
          where: { id: item.id },
          include: {
            variants: {
              where: { active: true }
            }
          }
        });

        if (!product) {
          return NextResponse.json(
            { error: "Product unavailable" },
            { status: 400 }
          );
        }

        if (product.variants.length > 0) {
          const selected = product.variants.find(
            variant =>
              variant.size.toLowerCase() ===
                item.size?.toLowerCase() &&
              variant.color.toLowerCase() ===
                item.color?.toLowerCase()
          );

          if (!selected) {
            return NextResponse.json(
              {
                error:
                  `Select an available size and color for ${product.name}`
              },
              { status: 400 }
            );
          }

          if (
            selected.stock < item.quantity
          ) {
            return NextResponse.json(
              {
                error:
                  `Insufficient stock: ${product.name} / ${selected.size} / ${selected.color}`
              },
              { status: 409 }
            );
          }

          lineItems.push({
            kind: "PRODUCT",
            catalogId: product.id,
            title: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal:
              product.price * item.quantity,
            size: selected.size,
            color: selected.color,
            variantId: selected.id
          });

        } else {
          const headwear = /skull|headwear/i.test(
            `${product.name} ${product.category}`
          );

          if (headwear) {
            return NextResponse.json(
              {
                error:
                  `${product.name} needs size/color configuration`
              },
              { status: 400 }
            );
          }

          if (item.size || item.color) {
            return NextResponse.json(
              {
                error:
                  "This product has no selectable variants"
              },
              { status: 400 }
            );
          }

          if (
            product.stock < item.quantity
          ) {
            return NextResponse.json(
              {
                error:
                  `Insufficient stock: ${product.name}`
              },
              { status: 409 }
            );
          }

          lineItems.push({
            kind: "PRODUCT",
            catalogId: product.id,
            title: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal:
              product.price * item.quantity
          });
        }

      } else {
        if (item.size || item.color) {
          return NextResponse.json(
            {
              error:
                "Event tickets do not use size/color"
            },
            { status: 400 }
          );
        }

        const event = await prisma.event.findUnique({
          where: { id: item.id }
        });

        if (!event) {
          return NextResponse.json(
            { error: "Event not found" },
            { status: 400 }
          );
        }

        if (event.date <= new Date()) {
          return NextResponse.json(
            {
              error:
                "Ticket sales have ended"
            },
            { status: 400 }
          );
        }

        if (event.price === 0) {
          return NextResponse.json(
            {
              error:
                "Free events use RSVP"
            },
            { status: 400 }
          );
        }

        if (
          event.remaining < item.quantity
        ) {
          return NextResponse.json(
            {
              error:
                "Insufficient tickets"
            },
            { status: 409 }
          );
        }

        lineItems.push({
          kind: "TICKET",
          catalogId: event.id,
          title: event.title,
          unitPrice: event.price,
          quantity: item.quantity,
          subtotal:
            event.price * item.quantity
        });
      }
    }

    // Check combined stock for each product/event.
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
                where: { id: entry.id },
                select: { stock: true }
              })
            )?.stock
          : (
              await prisma.event.findUnique({
                where: { id: entry.id },
                select: { remaining: true }
              })
            )?.remaining;

      if (
        available === undefined ||
        available < entry.quantity
      ) {
        return NextResponse.json(
          {
            error:
              "Combined order quantity exceeds available stock"
          },
          { status: 409 }
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
      return NextResponse.json(
        { error: "Invalid order total" },
        { status: 400 }
      );
    }

    const reference =
      `KARMA-${randomUUID()}`;

    const user = await sessionUser();

    const order = await prisma.order.create({
      data: {
        reference,
        userId: user?.id ?? null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        total,

        items: {
          create: lineItems
        }
      }
    });

    try {
      const checkoutUrl = await startPayment({
        reference,
        amount: total,
        name: customer.name,
        email: customer.email
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentLink: checkoutUrl }
      });

      return NextResponse.json(
        {
          reference,
          checkoutUrl
        },
        { status: 201 }
      );

    } catch (error: any) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" }
      });

      return NextResponse.json(
        {
          error:
            error?.message ||
            "Unable to initialize payment"
        },
        { status: 502 }
      );
    }

  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: errorMessage(error) },
        { status: 400 }
      );
    }

    console.error(
      "Checkout error",
      error?.message
    );

    return NextResponse.json(
      { error: "Checkout unavailable" },
      { status: 503 }
    );
  }
}
