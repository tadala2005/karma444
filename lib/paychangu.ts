import {
  validWebhookSignature as checkWebhook,
  paymentMatchesOrder,
  isSuccessfulPayment,
  isFailedPayment
} from "./paychangu-core";

import {
  prisma
} from "./db";

import {
  paymentMode
} from "./commerce";

const API = "https://api.paychangu.com";

export class PaymentError extends Error {}

class OutOfStock extends Error {}

function secretKey(): string {
  const key =
    process.env.PAYCHANGU_SECRET_KEY?.trim();

  if (!key) {
    throw new PaymentError(
      "Payment provider is not configured."
    );
  }

  return key;
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
        Authorization:
          `Bearer ${secretKey()}`,

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

  let result: any;

  try {
    result = await response.json();
  } catch {
    throw new PaymentError(
      "Invalid payment provider response."
    );
  }

  if (
    !response.ok ||
    result?.status !== "success"
  ) {
    throw new PaymentError(
      "Payment provider request failed."
    );
  }

  return result;
}

export async function startPayment(args: {
  reference: string;
  amount: number;
  email: string;
  name: string;
}): Promise<string> {
  const mode = paymentMode();

  if (mode === "disabled") {
    throw new PaymentError(
      "Online payments are disabled."
    );
  }

  if (
    !Number.isSafeInteger(args.amount) ||
    args.amount <= 0
  ) {
    throw new PaymentError(
      "Invalid payment amount."
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL!;

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
        `${baseUrl}/api/paychangu/callback`,

      return_url:
        `${baseUrl}/order?ref=${encodeURIComponent(
          args.reference
        )}`,

      customization: {
        title: "Karma Curated",
        description:
          "Merchandise and event tickets"
      },

      meta: {
        order_reference: args.reference
      }
    }
  );

  const returnedMode =
    data?.data?.data?.mode;

  if (
    returnedMode &&
    returnedMode !== mode
  ) {
    throw new PaymentError(
      "Payment environment mismatch."
    );
  }

  const checkoutUrl =
    data?.data?.checkout_url;

  if (
    typeof checkoutUrl !== "string"
  ) {
    throw new PaymentError(
      "Checkout URL missing."
    );
  }

  let url: URL;

  try {
    url = new URL(checkoutUrl);
  } catch {
    throw new PaymentError(
      "Invalid checkout URL."
    );
  }

  if (
    url.protocol !== "https:" ||
    !(
      url.hostname === "paychangu.com" ||
      url.hostname.endsWith(".paychangu.com")
    )
  ) {
    throw new PaymentError(
      "Unexpected checkout destination."
    );
  }

  return url.toString();
}

export type Verification = {
  status: string;
  tx_ref: string;
  amount: number;
  currency: string;
  mode: string;
  reference?: string;
};

export async function verifyProviderPayment(
  reference: string
): Promise<Verification> {
  if (
    !/^KARMA-[a-f0-9-]{36}$/i.test(reference)
  ) {
    throw new PaymentError(
      "Invalid order reference."
    );
  }

  const result = await apiRequest(
    `/verify-payment/${encodeURIComponent(
      reference
    )}`,
    "GET"
  );

  const data = result?.data;

  if (
    !data ||
    typeof data.tx_ref !== "string"
  ) {
    throw new PaymentError(
      "Malformed verification response."
    );
  }

  const expectedMode =
    process.env.PAYCHANGU_MODE;

  if (
    expectedMode !== "test" &&
    expectedMode !== "live"
  ) {
    throw new PaymentError(
      "Payment environment not configured."
    );
  }

  if (
    data.mode !== expectedMode
  ) {
    throw new PaymentError(
      "Payment environment mismatch."
    );
  }

  return {
    status:
      String(data.status).toLowerCase(),

    tx_ref:
      data.tx_ref,

    amount:
      Number(data.amount),

    currency:
      String(data.currency),

    mode:
      String(data.mode),

    reference:
      typeof data.reference === "string"
        ? data.reference
        : undefined
  };
}

export function validWebhookSignature(
  raw: string,
  received: string | null
): boolean {
  return checkWebhook(
    raw,
    received,
    process.env.PAYCHANGU_WEBHOOK_SECRET
  );
}

function isTransactionConflict(
  error: unknown
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function reconcileOrder(
  reference: string
) {
  const existing =
    await prisma.order.findUnique({
      where: {
        reference
      },
      include: {
        items: true
      }
    });

  if (!existing) {
    throw new PaymentError(
      "Order not found."
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
    payment.tx_ref !==
    existing.reference
  ) {
    throw new PaymentError(
      "Transaction reference mismatch."
    );
  }

  if (
    isSuccessfulPayment(payment.status)
  ) {
    // A successful payment must always
    // match the correct reference,
    // amount and currency.
    if (
      payment.currency !== "MWK" ||
      !Number.isSafeInteger(
        payment.amount
      )
    ) {
      throw new PaymentError(
        "Payment currency or amount invalid."
      );
    }

    // An overpayment is real money,
    // but requires human review/refund.
    if (
      payment.amount > existing.total
    ) {
      await prisma.order.updateMany({
        where: {
          reference,
          status: {
            in: [
              "PENDING",
              "FAILED"
            ]
          }
        },

        data: {
          status: "PAID_REVIEW",
          providerRef:
            payment.reference || null
        }
      });

      return prisma.order.findUniqueOrThrow({
        where: {
          reference
        }
      });
    }

    if (
      !paymentMatchesOrder(
        payment,
        existing.reference,
        existing.total
      )
    ) {
      throw new PaymentError(
        "Payment does not match the order."
      );
    }

    for (
      let attempt = 0;
      attempt < 3;
      attempt++
    ) {
      try {
        return await prisma.$transaction(
          async tx => {
            const current =
              await tx.order.findUnique({
                where: {
                  reference
                },
                include: {
                  items: true
                }
              });

            if (!current) {
              throw new PaymentError(
                "Order unavailable."
              );
            }

            // Idempotent reconciliation:
            // an already completed order
            // must not deduct stock again.
            if (
              ![
                "PENDING",
                "FAILED"
              ].includes(current.status)
            ) {
              return current;
            }

            for (
              const item of current.items
            ) {
              if (
                item.kind === "PRODUCT" &&
                item.variantId
              ) {
                const variant =
                  await tx.productVariant.updateMany({
                    where: {
                      id: item.variantId,
                      productId:
                        item.catalogId,
                      active: true,

                      stock: {
                        gte: item.quantity
                      }
                    },

                    data: {
                      stock: {
                        decrement:
                          item.quantity
                      }
                    }
                  });

                if (
                  variant.count !== 1
                ) {
                  throw new OutOfStock(
                    "Variant sold out."
                  );
                }
              }

              if (
                item.kind === "PRODUCT"
              ) {
                const product =
                  await tx.product.updateMany({
                    where: {
                      id: item.catalogId,

                      stock: {
                        gte: item.quantity
                      }
                    },

                    data: {
                      stock: {
                        decrement:
                          item.quantity
                      }
                    }
                  });

                if (
                  product.count !== 1
                ) {
                  throw new OutOfStock(
                    "Product stock exhausted."
                  );
                }

              } else {
                const event =
                  await tx.event.updateMany({
                    where: {
                      id: item.catalogId,

                      remaining: {
                        gte: item.quantity
                      }
                    },

                    data: {
                      remaining: {
                        decrement:
                          item.quantity
                      }
                    }
                  });

                if (
                  event.count !== 1
                ) {
                  throw new OutOfStock(
                    "Event capacity exhausted."
                  );
                }
              }
            }

            return tx.order.update({
              where: {
                reference
              },

              data: {
                status: "PAID",
                providerRef:
                  payment.reference || null
              }
            });
          },

          {
            isolationLevel:
              "Serializable",

            timeout: 15000
          }
        );

      } catch (error) {
        if (
          error instanceof OutOfStock
        ) {
          // No inventory deduction is
          // committed when the transaction
          // throws. Preserve the paid
          // order for manual resolution.
          await prisma.order.updateMany({
            where: {
              reference,
              status: {
                in: [
                  "PENDING",
                  "FAILED"
                ]
              }
            },

            data: {
              status: "PAID_REVIEW",
              providerRef:
                payment.reference || null
            }
          });

          return prisma.order.findUniqueOrThrow({
            where: {
              reference
            }
          });
        }

        if (
          isTransactionConflict(error) &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }
  }

  if (
    isFailedPayment(payment.status)
  ) {
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
      where: {
        reference
      }
    });
  }

  // Pending or unknown status:
  // Never assume successful payment.
  return existing;
}
