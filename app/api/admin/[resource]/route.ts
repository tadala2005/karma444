
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

import { variantStock } from "@/lib/variants";

import {
  allowRequest,
  requestIp
} from "@/lib/limits";

type Context = {
  params: Promise<{ resource: string }>;
};

export async function POST(
  req: Request,
  { params }: Context
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  if (
    !allowRequest(
      requestIp(req),
      "admin",
      60,
      60000
    )
  ) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { resource } = await params;

  try {
    const body = await req.json();
    let item;

    switch (resource) {
      case "artists":
        item = await prisma.artist.create({
          data: artistSchema.parse(body)
        });
        break;

      case "articles":
        item = await prisma.article.create({
          data: articleSchema.parse(body)
        });
        break;

      case "products": {
        const {
          variants,
          ...data
        } = productSchema.parse(body);

        item = await prisma.product.create({
          data: {
            ...data,
            stock: variants.length
              ? variantStock(variants)
              : data.stock,

            variants: {
              create: variants
            }
          }
        });

        break;
      }

      case "events": {
        const data = eventSchema.parse(body);

        item = await prisma.event.create({
          data: {
            ...data,
            date: new Date(data.date),
            remaining: data.capacity
          }
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
    }

    return NextResponse.json(
      { item },
      { status: 201 }
    );

  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug or variant already exists" },
        { status: 409 }
      );
    }

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: errorMessage(error) },
        { status: 400 }
      );
    }

    console.error(
      "Admin create failed",
      error?.message
    );

    return NextResponse.json(
      { error: "Could not save content" },
      { status: 503 }
    );
  }
}
