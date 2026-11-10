
"use client";

import {
  useEffect,
  useState
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

import { useCart } from "./cart-store";
import { money } from "@/lib/format";

export function CheckoutForm() {
  const items = useCart(state => state.items);

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Blantyre"
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = items.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity,
    0
  );

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            customer: form,

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Checkout failed"
        );
      }

      window.location.assign(
        data.checkoutUrl
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Payment could not start"
      );

      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="main-container page-pad">
        <h1 className="page-title">
          CHECKOUT.
        </h1>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="main-container empty-state">
        <h1>
          YOUR BAG IS EMPTY.
        </h1>

        <Link
          href="/shop"
          className="btn dark"
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  return (
    <main className="main-container page-pad">
      <p className="eyebrow">
        CHECKOUT / SECURE PAYMENT
      </p>

      <h1 className="page-title">
        MAKE IT YOURS
        <span className="accent-dot">.</span>
      </h1>

      <div className="cart-layout">
        <form
          onSubmit={submit}
          className="checkout-form"
        >
          <h2>01 / YOUR DETAILS</h2>

          <div className="form-grid">
            <label>
              FULL NAME
              <input
                required
                minLength={2}
                value={form.name}
                onChange={event =>
                  setForm({
                    ...form,
                    name: event.target.value
                  })
                }
              />
            </label>

            <label>
              EMAIL ADDRESS
              <input
                required
                type="email"
                value={form.email}
                onChange={event =>
                  setForm({
                    ...form,
                    email: event.target.value
                  })
                }
              />
            </label>

            <label>
              PHONE NUMBER
              <input
                required
                value={form.phone}
                onChange={event =>
                  setForm({
                    ...form,
                    phone: event.target.value
                  })
                }
              />
            </label>

            <label>
              CITY
              <input
                value={form.city}
                onChange={event =>
                  setForm({
                    ...form,
                    city: event.target.value
                  })
                }
              />
            </label>

            <label className="span-two">
              DELIVERY ADDRESS
              <textarea
                rows={3}
                value={form.address}
                onChange={event =>
                  setForm({
                    ...form,
                    address: event.target.value
                  })
                }
              />
            </label>
          </div>

          <h2 className="payment-heading">
            02 / PAYMENT
          </h2>

          <div className="payment-method">
            <div className="payment-icon">
              P
            </div>

            <div>
              <b>
                PAYCHANGU SECURE CHECKOUT
              </b>

              <p>
                Complete your payment on
                PayChangu's secure payment page.
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
            disabled={busy}
          >
            {busy
              ? "CREATING YOUR PAYMENT..."
              : "PROCEED TO PAYCHANGU"}

            <ArrowRight size={18} />
          </button>

          <p className="subtle">
            <LockKeyhole size={13} />
            Order confirmation requires
            verified payment.
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
                {item.title}
                {" × "}
                {item.quantity}

                {(item.size || item.color) && (
                  <small style={{
                    display: "block"
                  }}>
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

          <div className="summary-total">
            <span>YOU PAY</span>
            <b>{money(total)}</b>
          </div>

          <Link
            href="/cart"
            className="plain-back"
          >
            EDIT BAG
          </Link>
        </aside>
      </div>
    </main>
  );
}
