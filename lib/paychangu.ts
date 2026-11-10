
import {
  validWebhookSignature as checkWebhook,
  paymentMatchesOrder,
  isSuccessfulPayment,
  isFailedPayment
} from "./paychangu-core";

import { prisma } from "./db";

const API = "https://api.paychangu.com";

export class PaymentError extends Error {}

function key() {
  const value =
    process.env.PAYCHANGU_SECRET_KEY;

  if (!value) {
    throw new PaymentError(
      "PayChangu is not configured"
    );
  }

  return value;
}

async function apiRequest(
  path: string,
  method: "GET" | "POST",
  body?: unknown
) {
  const response = await fetch(
    `${API}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${key()}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: body
        ? JSON.stringify(body)
        : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000)
    }
  );

  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new PaymentError(
      "Invalid payment-provider response"
    );
  }

  if (
    !response.ok ||
    data?.status !== "success"
  ) {
    throw new PaymentError(
      data?.message ||
      "Payment provider could not process the request"
    );
  }

  return data;
}

export async function startPayment(args: {
  reference: string;
  amount: number;
  email: string;
  name: string;
}) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL;

  if (
    !base ||
    !/^https?:\/\//.test(base)
  ) {
    throw new PaymentError(
      "NEXT_PUBLIC_APP_URL is not configured"
    );
  }

  const names = args.name
    .trim()
    .split(/\s+/);

  const data = await apiRequest(
    "/payment",
    "POST",
    {
      tx_ref: args.reference,
      amount: String(args.amount),
      currency: "MWK",
      email: args.email,
      first_name: names[0],
      last_name:
        names.slice(1).join(" "),

      callback_url:
        `${base}/api/paychangu/callback`,

      return_url:
        `${base}/order?ref=${encodeURIComponent(args.reference)}`,

      customization: {
        title: "Karma Curated Checkout",
        description:
          "Karma Curated merchandise and event tickets"
      },

      meta: {
        order_reference: args.reference
      }
    }
  );

  const checkoutUrl =
    data?.data?.checkout_url;

  if (
    typeof checkoutUrl !== "string" ||
    !/^https:\/\/([a-z0-9-]+\.)*paychangu\.com\//i.test(
      checkoutUrl
    )
  ) {
    throw new PaymentError(
      "Unexpected payment link"
    );
  }

  return checkoutUrl;
}

export type Verification = {
  status: string;
  tx_ref: string;
  amount: number;
  currency: string;
  reference?: string;
};

export async function verifyProviderPayment(
  reference: string
): Promise<Verification> {
  if (
    !/^[a-zA-Z0-9_-]{8,128}$/.test(reference)
  ) {
    throw new PaymentError(
      "Invalid reference"
    );
  }

  const result = await apiRequest(
    `/verify-payment/${encodeURIComponent(reference)}`,
    "GET"
  );

  const data = result?.data;

  if (
    !data ||
    typeof data.tx_ref !== "string"
  ) {
    throw new PaymentError(
      "Malformed payment verification"
    );
  }

  return {
    status:
      String(data.status).toLowerCase(),
    tx_ref: data.tx_ref,
    amount: Number(data.amount),
    currency: String(data.currency),
    reference: data.reference
  };
}

export function validWebhookSignature(
  raw: string,
  received: string | null
) {
  return checkWebhook(
    raw,
    received,
    process.env.PAYCHANGU_WEBHOOK_SECRET
  );
}

class OutOfStock extends Error {}

export async function reconcileOrder(
  reference: string
) {
  const existing = await prisma.order.findUnique({
    where: { reference },
    include: { items: true }
  });

  if (!existing) {
    throw new PaymentError(
      "Order not found"
    );
  }

  if (
    !["PENDING", "FAILED"].includes(
      existing.status
    )
  ) {
    return existing;
  }

  const payment =
    await verifyProviderPayment(reference);

  if (
    payment.tx_ref !== existing.reference
  ) {
    throw new PaymentError(
      "Payment reference mismatch"
    );
  }

  if (
    isSuccessfulPayment(payment.status) &&
    !paymentMatchesOrder(
      payment,
      existing.reference,
      existing.total
    )
  ) {
    throw new PaymentError(
      "Payment amount or currency mismatch"
    );
  }

  if (isSuccessfulPayment(payment.status)) {
    try {
      return await prisma.$transaction(
        async tx => {
          const current =
            await tx.order.findUnique({
              where: { reference },
              include: { items: true }
            });

          if (!current) {
            throw new PaymentError(
              "Order unavailable"
            );
          }

          if (
            !["PENDING", "FAILED"].includes(
              current.status
            )
          ) {
            return current;
          }

          for (const item of current.items) {
            if (
              item.kind === "PRODUCT" &&
              item.variantId
            ) {
              const selected =
                await tx.productVariant.updateMany({
                  where: {
                    id: item.variantId,
                    productId: item.catalogId,
                    active: true,
                    stock: {
                      gte: item.quantity
                    }
                  },

                  data: {
                    stock: {
                      decrement: item.quantity
                    }
                  }
                });

              if (selected.count !== 1) {
                throw new OutOfStock(
                  "Selected size/color sold out"
                );
              }
            }

            if (item.kind === "PRODUCT") {
              const result =
                await tx.product.updateMany({
                  where: {
                    id: item.catalogId,
                    stock: {
                      gte: item.quantity
                    }
                  },

                  data: {
                    stock: {
                      decrement: item.quantity
                    }
                  }
                });

              if (result.count !== 1) {
                throw new OutOfStock(
                  "Insufficient product stock"
                );
              }

            } else {
              const result =
                await tx.event.updateMany({
                  where: {
                    id: item.catalogId,
                    remaining: {
                      gte: item.quantity
                    }
                  },

                  data: {
                    remaining: {
                      decrement: item.quantity
                    }
                  }
                });

              if (result.count !== 1) {
                throw new OutOfStock(
                  "Insufficient event capacity"
                );
              }
            }
          }

          return tx.order.update({
            where: { reference },
            data: {
              status: "PAID",
              providerRef:
                payment.reference || null
            }
          });

        },
        {
          isolationLevel: "Serializable",
          timeout: 15000
        }
      );

    } catch (error) {
      if (error instanceof OutOfStock) {
        // Keep the successful payment recorded.
        // A human must resolve the stock shortage.
        await prisma.order.updateMany({
          where: {
            reference,
            status: {
              in: ["PENDING", "FAILED"]
            }
          },

          data: {
            status: "PAID_REVIEW",
            providerRef:
              payment.reference || null
          }
        });

        return prisma.order.findUniqueOrThrow({
          where: { reference }
        });
      }

      throw error;
    }
  }

  if (isFailedPayment(payment.status)) {
    await prisma.order.updateMany({
      where: {
        reference,
        status: "PENDING"
      },

      data: {
        status: "FAILED"
      }
    });

    return prisma.order.findUniqueOrThrow({
      where: { reference }
    });
  }

  return existing;
}
