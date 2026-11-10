
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

import {
  artistSchema,
  articleSchema,
  eventSchema,
  productSchema,
  errorMessage
} from "@/lib/schemas";

import {
  normalizedVariantKey,
  variantStock
} from "@/lib/variants";

type Context = {
  params: Promise<{
    resource: string;
    id: string;
  }>;
};

async function edit(
  resource: string,
  id: string,
  data: any
) {
  switch (resource) {
    case "artists":
      return prisma.artist.update({
        where: { id },
        data: artistSchema.parse(data)
      });

    case "articles":
      return prisma.article.update({
        where: { id },
        data: articleSchema.parse(data)
      });

    case "products": {
      const {
        variants,
        ...values
      } = productSchema.parse(data);

      return prisma.$transaction(async tx => {
        const product = await tx.product.findUnique({
          where: { id },
          include: { variants: true }
        });

        if (!product) {
          throw new Error("NOT_FOUND");
        }

        const incoming = new Set(
          variants.map(v =>
            normalizedVariantKey(v.size, v.color)
          )
        );

        for (const existing of product.variants) {
          const key = normalizedVariantKey(
            existing.size,
            existing.color
          );

          if (!incoming.has(key)) {
            await tx.productVariant.update({
              where: { id: existing.id },
              data: {
                active: false,
                stock: 0
              }
            });
          }
        }

        for (const variant of variants) {
          const existing = product.variants.find(
            v =>
              normalizedVariantKey(
                v.size,
                v.color
              ) === normalizedVariantKey(
                variant.size,
                variant.color
              )
          );

          if (existing) {
            await tx.productVariant.update({
              where: { id: existing.id },
              data: {
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
                active: true
              }
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                ...variant,
                active: true
              }
            });
          }
        }

        return tx.product.update({
          where: { id },
          data: {
            ...values,
            stock: variants.length
              ? variantStock(variants)
              : values.stock
          }
        });

      }, {
        isolationLevel: "Serializable"
      });
    }

    case "events": {
      const value = eventSchema.parse(data);

      const event = await prisma.event.findUnique({
        where: { id }
      });

      if (!event) {
        throw new Error("NOT_FOUND");
      }

      const sold = event.capacity - event.remaining;

      if (value.capacity < sold) {
        throw new Error("CAPACITY");
      }

      return prisma.event.update({
        where: { id },
        data: {
          ...value,
          date: new Date(value.date),
          remaining: value.capacity - sold
        }
      });
    }

    default:
      throw new Error("NOT_FOUND");
  }
}

export async function PATCH(
  req: Request,
  { params }: Context
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { resource, id } = await params;

  try {
    const item = await edit(
      resource,
      id,
      await req.json()
    );

    return NextResponse.json({ item });

  } catch (error: any) {
    const message =
      error?.message === "CAPACITY"
        ? "Capacity cannot be lower than tickets already committed"
        : error?.name === "ZodError"
          ? errorMessage(error)
          : error?.code === "P2002"
            ? "Duplicate slug or variant"
            : error?.message === "NOT_FOUND"
              ? "Entry not found"
              : "Update failed";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: Context
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { resource, id } = await params;

  try {
    switch (resource) {
      case "artists":
        await prisma.artist.delete({
          where: { id }
        });
        break;

      case "articles":
        await prisma.article.delete({
          where: { id }
        });
        break;

      case "products": {
        const count = await prisma.orderItem.count({
          where: {
            catalogId: id,
            kind: "PRODUCT"
          }
        });

        if (count) {
          return NextResponse.json(
            {
              error:
                "Cannot delete a product with existing orders. Set its stock to zero instead."
            },
            { status: 409 }
          );
        }

        await prisma.product.delete({
          where: { id }
        });
        break;
      }

      case "events": {
        const count = await prisma.orderItem.count({
          where: {
            catalogId: id,
            kind: "TICKET"
          }
        });

        const rsvps = await prisma.rsvp.count({
          where: { eventId: id }
        });

        if (count || rsvps) {
          return NextResponse.json(
            {
              error:
                "Cannot delete an event with tickets or RSVPs."
            },
            { status: 409 }
          );
        }

        await prisma.event.delete({
          where: { id }
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
    }

    return NextResponse.json({ ok: true });

  } catch {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 400 }
    );
  }
}
