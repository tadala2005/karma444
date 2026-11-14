import { z } from "zod";
import { uniqueVariants } from "./variants";

export const email = z.string()
  .trim()
  .email()
  .max(180)
  .toLowerCase();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(10).max(128)
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1)
});

export const deliveryMethodSchema = z.enum([
  "NONE",
  "CTS",
  "SPEED",
  "POST_OFFICE",
  "SMART_DELIVERY",
  "OTHER",
  "PICKUP"
]);

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  phone: z.string().trim().min(7).max(24),
  address: z.string().trim().max(250).default(""),
  city: z.string().trim().max(80).default(""),

  deliveryMethod: deliveryMethodSchema
    .default("NONE"),

  deliveryOther: z.string()
    .trim()
    .max(100)
    .default(""),

  deliveryNotes: z.string()
    .trim()
    .max(500)
    .default(""),

  deliveryTermsAccepted: z.boolean()
    .default(false)
});

export const checkoutSchema = z.object({
  customer: customerSchema,

  items: z.array(
    z.object({
      kind: z.enum(["PRODUCT", "TICKET"]),
      id: z.string().min(1),
      quantity: z.number().int().min(1).max(10),

      size: z.string()
        .trim()
        .max(36)
        .optional(),

      color: z.string()
        .trim()
        .max(50)
        .optional()
    })
  ).min(1).max(25)
}).superRefine((data, ctx) => {
  const physical = data.items.some(
    item => item.kind === "PRODUCT"
  );

  if (physical) {
    if (
      data.customer.deliveryMethod === "NONE"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "deliveryMethod"],
        message: "Choose a delivery or pickup option"
      });
    }

    if (!data.customer.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "city"],
        message: "Enter your city"
      });
    }

    if (
      !data.customer.address &&
      !["PICKUP"].includes(
        data.customer.deliveryMethod
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "address"],
        message: "Enter a delivery address"
      });
    }

    if (
      data.customer.deliveryMethod === "OTHER" &&
      !data.customer.deliveryOther
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "deliveryOther"],
        message: "Enter the courier name"
      });
    }

    if (!data.customer.deliveryTermsAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "deliveryTermsAccepted"],
        message: "Confirm the delivery terms"
      });
    }
  } else if (
    data.customer.deliveryMethod !== "NONE"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customer", "deliveryMethod"],
      message: "Tickets do not require delivery"
    });
  }
});

export const rsvpSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  email
});

export const bookingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  service: z.string().min(2).max(100),
  budget: z.string().max(100).optional(),
  brief: z.string().trim().min(15).max(4000)
});

export const imageUrl = z.string()
  .url()
  .refine(
    url => url.startsWith("https://"),
    "Use an HTTPS image URL"
  );

export const artistSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  bio: z.string().min(20),
  genre: z.string().max(100),
  city: z.string().max(100),
  image: imageUrl,
  instagram: z.string().url().optional()
    .or(z.literal("")),
  spotify: z.string().url().optional()
    .or(z.literal("")),
  featured: z.boolean().default(false)
});

export const articleSchema = z.object({
  title: z.string().min(5).max(180),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(15).max(400),
  body: z.string().min(50),
  image: imageUrl,
  category: z.string().max(80),
  author: z.string().max(100),
  featured: z.boolean().default(false)
});

export const eventSchema = z.object({
  title: z.string().min(5).max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  summary: z.string().min(20),
  image: imageUrl,
  venue: z.string().min(2),
  city: z.string().min(2),
  date: z.string().datetime(),
  price: z.number().int().min(0).max(50000000),
  capacity: z.number().int().min(1).max(100000),
  featured: z.boolean().default(false)
});

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).max(36),
  color: z.string().trim().min(1).max(50),
  stock: z.number().int().min(0).max(100000)
});

export const productSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(15),
  image: imageUrl,
  gallery: z.array(imageUrl).max(10).default([]),
  category: z.string().trim().min(2),
  price: z.number().int().min(1).max(50000000),
  stock: z.number().int().min(0).max(100000),
  featured: z.boolean().default(false),

  variants: z.array(productVariantSchema)
    .max(100)
    .default([])
}).superRefine((product, ctx) => {
  if (!uniqueVariants(product.variants)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message: "Duplicate size/color combination"
    });
  }

  const isHeadwear = /skull|headwear/i.test(
    `${product.name} ${product.category}`
  );

  if (
    isHeadwear &&
    !product.variants.length
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message:
        "Skullcaps require size and color options"
    });
  }

  const total = product.variants.reduce(
    (sum, variant) =>
      sum + variant.stock,
    0
  );

  if (total > 100000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message: "Total variant stock exceeds limit"
    });
  }
});

export function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.errors
      .map(
        issue =>
          `${issue.path.join(".")}: ${issue.message}`
      )
      .join("; ");
  }

  return "Request could not be completed";
}
