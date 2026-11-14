import {
  test
} from "node:test";

import {
  strict as assert
} from "node:assert";

import {
  DELIVERY_OPTIONS,
  deliveryLabel,
  containsMerchandise
} from "../lib/delivery";

import {
  checkoutSchema
} from "../lib/schemas";

const baseCustomer = {
  name: "Test Customer",
  email: "customer@example.com",
  phone: "+265991234567",
  city: "Blantyre",
  address: "City Centre",
  deliveryMethod: "CTS",
  deliveryOther: "",
  deliveryNotes: "",
  deliveryTermsAccepted: true
};

const productItem = {
  kind: "PRODUCT" as const,
  id: "test-product",
  quantity: 1
};

const ticketItem = {
  kind: "TICKET" as const,
  id: "test-ticket",
  quantity: 1
};

test(
  "All requested delivery providers exist",
  () => {
    const values =
      DELIVERY_OPTIONS.map(
        option => option.value
      );

    assert.deepEqual(
      values,
      [
        "CTS",
        "SPEED",
        "POST_OFFICE",
        "SMART_DELIVERY",
        "OTHER",
        "PICKUP"
      ]
    );
  }
);

test(
  "Custom courier name is displayed",
  () => {
    assert.equal(
      deliveryLabel(
        "OTHER",
        "Customer Courier"
      ),
      "Other: Customer Courier"
    );
  }
);

test(
  "Physical orders require delivery terms",
  () => {
    const result =
      checkoutSchema.safeParse({
        customer: {
          ...baseCustomer,
          deliveryTermsAccepted: false
        },
        items: [productItem]
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "Courier delivery requires an address",
  () => {
    const result =
      checkoutSchema.safeParse({
        customer: {
          ...baseCustomer,
          address: ""
        },
        items: [productItem]
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "Collection does not require a delivery address",
  () => {
    const result =
      checkoutSchema.safeParse({
        customer: {
          ...baseCustomer,
          deliveryMethod: "PICKUP",
          address: ""
        },
        items: [productItem]
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "Other courier requires the courier name",
  () => {
    const result =
      checkoutSchema.safeParse({
        customer: {
          ...baseCustomer,
          deliveryMethod: "OTHER",
          deliveryOther: ""
        },
        items: [productItem]
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "Ticket-only orders do not require delivery",
  () => {
    const result =
      checkoutSchema.safeParse({
        customer: {
          ...baseCustomer,
          deliveryMethod: "NONE",
          deliveryTermsAccepted: false,
          city: "",
          address: ""
        },
        items: [ticketItem]
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "Merchandise detection is accurate",
  () => {
    assert.equal(
      containsMerchandise(
        [ticketItem]
      ),
      false
    );

    assert.equal(
      containsMerchandise(
        [
          ticketItem,
          productItem
        ]
      ),
      true
    );
  }
);
