export const DELIVERY_OPTIONS = [
  {
    value: "CTS",
    label: "CTS Courier"
  },
  {
    value: "SPEED",
    label: "Speed Courier"
  },
  {
    value: "POST_OFFICE",
    label: "Malawi Post Office / Posts Courier"
  },
  {
    value: "SMART_DELIVERY",
    label: "Smart Deliveries"
  },
  {
    value: "OTHER",
    label: "Other delivery service"
  },
  {
    value: "PICKUP",
    label: "Collection / pickup"
  }
] as const;

export type DeliveryMethod =
  | "NONE"
  | (typeof DELIVERY_OPTIONS)[number]["value"];

export function deliveryLabel(
  method: string,
  other?: string | null
): string {
  if (method === "NONE") {
    return "Not applicable";
  }

  if (method === "OTHER") {
    return other?.trim()
      ? `Other: ${other.trim()}`
      : "Other delivery service";
  }

  return DELIVERY_OPTIONS.find(
    option => option.value === method
  )?.label ?? "Unrecognized preference";
}

export function containsMerchandise(
  items: readonly {
    kind: "PRODUCT" | "TICKET";
  }[]
): boolean {
  return items.some(
    item => item.kind === "PRODUCT"
  );
}

export const DELIVERY_DISCLOSURE =
  "Delivery costs are not included in the online payment. " +
  "Your selected courier is a preference, not a confirmed booking. " +
  "Karma Curated will confirm availability and any delivery fee " +
  "with you before dispatch. Collection arrangements are also " +
  "subject to confirmation.";
