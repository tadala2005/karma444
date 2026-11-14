import {
  test
} from "node:test";

import {
  strict as assert
} from "node:assert";

import {
  createHmac
} from "node:crypto";

import {
  validWebhookSignature,
  paymentMatchesOrder,
  isSuccessfulPayment,
  isFailedPayment
} from "../lib/paychangu-core";

test(
  "Accepts valid webhook HMAC-SHA256",
  () => {
    const raw = JSON.stringify({
      event_type:
        "checkout.payment",
      status:
        "success",
      tx_ref:
        "KARMA-TEST"
    });

    const secret =
      "test-webhook-secret";

    const signature =
      createHmac(
        "sha256",
        secret
      )
        .update(raw)
        .digest("hex");

    assert.equal(
      validWebhookSignature(
        raw,
        signature,
        secret
      ),
      true
    );

    assert.equal(
      validWebhookSignature(
        raw,
        `sha256=${signature}`,
        secret
      ),
      true
    );

    assert.equal(
      validWebhookSignature(
        raw.replace(
          "success",
          "failed"
        ),
        signature,
        secret
      ),
      false
    );

    assert.equal(
      validWebhookSignature(
        raw,
        signature + "0",
        secret
      ),
      false
    );
  }
);

test(
  "Rejects missing webhook secret",
  () => {
    assert.equal(
      validWebhookSignature(
        "{}",
        "abcd",
        undefined
      ),
      false
    );
  }
);

test(
  "Requires exact reference, amount and currency",
  () => {
    const payment = {
      tx_ref: "KARMA-TEST",
      amount: 15000,
      currency: "MWK",
      status: "success"
    };

    assert.equal(
      paymentMatchesOrder(
        payment,
        payment.tx_ref,
        15000
      ),
      true
    );

    assert.equal(
      paymentMatchesOrder(
        payment,
        "OTHER-REFERENCE",
        15000
      ),
      false
    );

    assert.equal(
      paymentMatchesOrder(
        {
          ...payment,
          currency: "USD"
        },
        payment.tx_ref,
        15000
      ),
      false
    );

    assert.equal(
      paymentMatchesOrder(
        {
          ...payment,
          amount: 14999
        },
        payment.tx_ref,
        15000
      ),
      false
    );

    assert.equal(
      paymentMatchesOrder(
        {
          ...payment,
          amount: 15001
        },
        payment.tx_ref,
        15000
      ),
      false
    );

    assert.equal(
      paymentMatchesOrder(
        {
          ...payment,
          amount: NaN
        },
        payment.tx_ref,
        15000
      ),
      false
    );
  }
);

test(
  "Payment statuses cannot be confused",
  () => {
    assert.equal(
      isSuccessfulPayment("success"),
      true
    );

    assert.equal(
      isSuccessfulPayment("pending"),
      false
    );

    assert.equal(
      isSuccessfulPayment("failed"),
      false
    );

    assert.equal(
      isFailedPayment("cancelled"),
      true
    );

    assert.equal(
      isFailedPayment("pending"),
      false
    );
  }
);
