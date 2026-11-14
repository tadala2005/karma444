
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

import { useCart } from "./cart-store";
import { money } from "@/lib/format";

import {
  DELIVERY_OPTIONS,
  DELIVERY_DISCLOSURE
} from "@/lib/delivery";

import type { DeliveryMethod } from "@/lib/delivery";
import type { PaymentMode } from "@/lib/commerce";

type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  deliveryOther: string;
  deliveryNotes: string;
  deliveryTermsAccepted: boolean;
};

const initialDetails: CheckoutDetails = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  deliveryMethod: "NONE",
  deliveryOther: "",
  deliveryNotes: "",
  deliveryTermsAccepted: false
};

export function CheckoutForm({
  mode
}: {
  mode: PaymentMode;
}) {
  const items = useCart(state => state.items);

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [form, setForm] =
    useState<CheckoutDetails>(initialDetails);

  const edited = useRef({
    name: false,
    email: false
  });

  const paymentReady = mode !== "disabled";

  const hasMerchandise = items.some(
    item => item.kind === "PRODUCT"
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity,
    0
  );

  
function update<K extends keyof CheckoutDetails>(
  key: K,
  value: CheckoutDetails[K]
) {
  if (key === "name") {
    edited.current.name = true;
  }

  if (key === "email") {
    edited.current.email = true;
  }

  setForm(previous => ({
    ...previous,
    [key]: value
  }));
}


  function changeDeliveryMethod(value: string) {
    if (value === "NONE") {
      update("deliveryMethod", "NONE");
      return;
    }

    const option = DELIVERY_OPTIONS.find(
      entry => entry.value === value
    );

    update(
      "deliveryMethod",
      option?.value ?? "NONE"
    );
  }

  useEffect(() => {
    setMounted(true);

    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
            credentials: "same-origin"
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        const user = data?.user;

        if (!active || !user) return;

        setLoggedIn(true);

        setForm(previous => ({
          ...previous,

          name: edited.current.name
            ? previous.name
            : user.name || "",

          email: edited.current.email
            ? previous.email
            : user.email || ""
        }));

      } catch {
        // Guest checkout remains available.
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) return;

    if (!paymentReady) {
      setError(
        "Online payments are not available yet."
      );
      return;
    }

    if (items.length === 0) {
      setError("Your bag is empty.");
      return;
    }

    if (
      hasMerchandise &&
      (
        form.deliveryMethod === "NONE" ||
        !form.deliveryTermsAccepted
      )
    ) {
      setError(
        "Choose a delivery option and accept the delivery terms."
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const customer = {
        ...form,

        deliveryMethod: hasMerchandise
          ? form.deliveryMethod
          : "NONE",

        deliveryOther: hasMerchandise
          ? form.deliveryOther
          : "",

        deliveryNotes: hasMerchandise
          ? form.deliveryNotes
          : "",

        deliveryTermsAccepted: hasMerchandise
          ? form.deliveryTermsAccepted
          : false
      };

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          credentials: "same-origin",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            customer,

            items: items.map(item => ({
              kind: item.kind,
              id: item.id,
              quantity: item.quantity,
              size: item.size,
              color: item.color
            }))
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Checkout could not be started."
        );
      }

      if (
        typeof result.checkoutUrl !== "string"
      ) {
        throw new Error(
          "The payment provider did not return a checkout URL."
        );
      }

      const destination = new URL(
        result.checkoutUrl
      );

      if (
        destination.protocol !== "https:" ||
        !(
          destination.hostname === "paychangu.com" ||
          destination.hostname.endsWith(
            ".paychangu.com"
          )
        )
      ) {
        throw new Error(
          "Invalid payment destination."
        );
      }

      window.location.assign(
        destination.toString()
      );

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Checkout is unavailable."
      );

      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <main className="main-container page-pad">
        <h1 className="page-title">
          CHECKOUT.
        </h1>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="main-container empty-state">
        <h1>YOUR BAG IS EMPTY.</h1>

        <Link
          className="btn dark"
          href="/shop"
        >
          EXPLORE THE SHOP
        </Link>
      </main>
    );
  }

  return (
    <main className="main-container page-pad">
      <p className="eyebrow">
        KARMA CURATED / CHECKOUT
      </p>

      <h1 className="page-title">
        MAKE IT YOURS
        <span className="accent-dot">.</span>
      </h1>

      {mode === "test" && (
        <div className="error-msg" role="status">
          TEST PAYMENT MODE — do not treat
          test orders as real purchases.
        </div>
      )}

      {!paymentReady && (
        <div
          className="error-msg"
          role="status"
          style={{ marginBottom: 24 }}
        >
          Online payments are not available yet.
          You can prepare your details,
          but cannot submit an order until
          payments are activated.
        </div>
      )}

      <div className="cart-layout">
        <form
          className="checkout-form"
          onSubmit={submit}
        >
          <h2>01 / YOUR DETAILS</h2>

          <p className="subtle">
            {loggedIn
              ? "Your account name and email are prefilled; you can edit them for this order."
              : "No account required. Checkout as a guest."}
          </p>

          <div className="form-grid">
            <label>
              FULL NAME

              <input
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                value={form.name}
                onChange={event =>
                  update(
                    "name",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              EMAIL ADDRESS

              <input
                required
                type="email"
                maxLength={180}
                autoComplete="email"
                value={form.email}
                onChange={event =>
                  update(
                    "email",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              PHONE NUMBER

              <input
                required
                type="tel"
                minLength={7}
                maxLength={24}
                autoComplete="tel"
                placeholder="+265 ..."
                value={form.phone}
                onChange={event =>
                  update(
                    "phone",
                    event.target.value
                  )
                }
              />
            </label>

            {hasMerchandise && (
              <label>
                CITY / TOWN

                <input
                  required
                  maxLength={80}
                  autoComplete="address-level2"
                  placeholder="e.g. Blantyre"
                  value={form.city}
                  onChange={event =>
                    update(
                      "city",
                      event.target.value
                    )
                  }
                />
              </label>
            )}
          </div>

          {hasMerchandise && (
            <section style={{ marginTop: 42 }}>
              <h2>02 / DELIVERY</h2>

              <div className="form-grid">
                <label className="span-two">
                  PREFERRED DELIVERY SERVICE

                  <select
                    required
                    value={form.deliveryMethod}
                    onChange={event =>
                      changeDeliveryMethod(
                        event.currentTarget.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "15px 16px",
                      border: "1px solid #ccc5bd",
                      background: "#fff",
                      color: "#171717",
                      fontSize: 14
                    }}
                  >
                    <option value="NONE">
                      Select delivery or pickup
                    </option>

                    {DELIVERY_OPTIONS.map(
                      option => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {form.deliveryMethod === "OTHER" && (
                  <label className="span-two">
                    NAME OF YOUR COURIER

                    <input
                      required
                      maxLength={100}
                      placeholder="Enter delivery service"
                      value={form.deliveryOther}
                      onChange={event =>
                        update(
                          "deliveryOther",
                          event.target.value
                        )
                      }
                    />
                  </label>
                )}

                {form.deliveryMethod !== "PICKUP" && (
                  <label className="span-two">
                    DELIVERY ADDRESS / LOCATION

                    <textarea
                      required
                      rows={3}
                      maxLength={250}
                      placeholder="Area, street, landmark, or postal branch"
                      value={form.address}
                      onChange={event =>
                        update(
                          "address",
                          event.target.value
                        )
                      }
                    />
                  </label>
                )}

                <label className="span-two">
                  DELIVERY INSTRUCTIONS (OPTIONAL)

                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Preferred branch or special instructions"
                    value={form.deliveryNotes}
                    onChange={event =>
                      update(
                        "deliveryNotes",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div
                className="payment-method"
                style={{
                  marginTop: 22,
                  alignItems: "flex-start"
                }}
              >
                <div>
                  <b>DELIVERY INFORMATION</b>
                  <p>{DELIVERY_DISCLOSURE}</p>
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  marginTop: 16,
                  fontSize: 12,
                  lineHeight: 1.7,
                  letterSpacing: 0
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={
                    form.deliveryTermsAccepted
                  }
                  onChange={event =>
                    update(
                      "deliveryTermsAccepted",
                      event.target.checked
                    )
                  }
                  style={{
                    width: 18,
                    height: 18,
                    flexShrink: 0
                  }}
                />

                I understand that delivery is not
                included in the online total.
                Any delivery fee must be agreed
                separately before dispatch.
              </label>
            </section>
          )}

          <h2 className="payment-heading">
            {hasMerchandise ? "03" : "02"} / PAYMENT
          </h2>

          <div className="payment-method">
            <div className="payment-icon">
              P
            </div>

            <div>
              <b>PAYCHANGU HOSTED CHECKOUT</b>

              <p>
                {paymentReady
                  ? "Continue to the payment provider to complete your purchase."
                  : "Secure online payment will be available after setup."}
              </p>
            </div>

            <ShieldCheck size={22} />
          </div>

          {error && (
            <p
              className="error-msg"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="btn orange fill"
            type="submit"
            disabled={
              busy ||
              !paymentReady ||
              items.length === 0
            }
          >
            {busy
              ? "PREPARING PAYMENT..."
              : mode === "test"
                ? "CONTINUE TO TEST PAYMENT"
                : paymentReady
                  ? "PROCEED TO PAYCHANGU"
                  : "PAYMENTS COMING SOON"}

            <ArrowRight size={18} />
          </button>

          <p className="subtle">
            <LockKeyhole size={13} />
            Orders are confirmed only after
            server-side payment verification.
          </p>
        </form>

        <aside className="checkout-summary">
          <p className="eyebrow">
            YOUR ORDER
          </p>

          <h2>THE DETAILS.</h2>

          {items.map(item => (
            <div
              className="summary-row"
              key={[
                item.kind,
                item.id,
                item.size || "",
                item.color || ""
              ].join("-")}
            >
              <span>
                {item.title} × {item.quantity}

                {(item.size || item.color) && (
                  <small
                    style={{ display: "block" }}
                  >
                    {[
                      item.size,
                      item.color
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </small>
                )}
              </span>

              <b>
                {money(
                  item.unitPrice *
                  item.quantity
                )}
              </b>
            </div>
          ))}

          {hasMerchandise && (
            <div className="summary-row">
              <span>Delivery</span>
              <b>Quoted separately</b>
            </div>
          )}

          <div className="summary-total">
            <span>
              {hasMerchandise
                ? "ITEMS TOTAL"
                : "TOTAL"}
            </span>

            <b>{money(subtotal)}</b>
          </div>

          {hasMerchandise && (
            <p
              className="subtle"
              style={{
                fontSize: 12,
                lineHeight: 1.7
              }}
            >
              The PayChangu amount excludes
              any separately agreed delivery fee.
            </p>
          )}

          <Link
            className="plain-back"
            href="/cart"
          >
            EDIT BAG
          </Link>
        </aside>
      </div>
    </main>
  );
}
