export type PaymentMode =
  | "disabled"
  | "test"
  | "live";

export function paymentMode(): PaymentMode {
  if (
    process.env.PAYCHANGU_ENABLED !== "true"
  ) {
    return "disabled";
  }

  const mode = process.env.PAYCHANGU_MODE;

  if (
    mode !== "test" &&
    mode !== "live"
  ) {
    return "disabled";
  }

  const secretKey =
    process.env.PAYCHANGU_SECRET_KEY?.trim();

  const webhookSecret =
    process.env.PAYCHANGU_WEBHOOK_SECRET?.trim();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (
    !secretKey ||
    !webhookSecret ||
    !baseUrl
  ) {
    return "disabled";
  }

  try {
    const url = new URL(baseUrl);

    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return "disabled";
    }
  } catch {
    return "disabled";
  }

  return mode;
}

export function paymentsEnabled(): boolean {
  return paymentMode() !== "disabled";
}
