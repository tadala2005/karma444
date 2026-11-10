
"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  RotateCcw,
  ArrowRight
} from "lucide-react";

import { money } from "@/lib/format";
import { useCart } from "./cart-store";

type Order = {
  reference: string;
  status: string;
  total: number;
  createdAt: string;

  items: {
    id: string;
    title: string;
    quantity: number;
    subtotal: number;
    size?: string;
    color?: string;
  }[];
};

export function OrderStatus({
  reference
}: {
  reference: string;
}) {
  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [verifying, setVerifying] =
    useState(false);

  const firstCheck = useRef(false);
  const clear = useCart(state => state.clear);

  async function load() {
    if (!reference) return;

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(reference)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Order unavailable"
        );
      }

      setOrder(data.order);

      const complete = [
        "PAID",
        "PAID_REVIEW",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED"
      ];

      if (complete.includes(data.order.status)) {
        clear();
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Order unavailable"
      );

    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setVerifying(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payment/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reference
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Verification failed"
        );
      }

      await load();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Verification failed"
      );

    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    void load();
  }, [reference]);

  useEffect(() => {
    if (
      order?.status !== "PENDING" ||
      firstCheck.current
    ) {
      return;
    }

    firstCheck.current = true;

    const timer = setTimeout(
      () => void verify(),
      1200
    );

    return () => clearTimeout(timer);
  }, [order?.status, reference]);

  if (!reference) {
    return (
      <main className="main-container empty-state">
        <h1>ORDER NOT FOUND.</h1>
        <Link
          href="/shop"
          className="btn dark"
        >
          EXPLORE SHOP
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="main-container empty-state">
        <h1>FINDING YOUR ORDER...</h1>
      </main>
    );
  }

  const paidStatuses = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED"
  ];

  return (
    <main className="main-container order-page">
      <p className="eyebrow">
        YOUR ORDER / {reference}
      </p>

      {order ? (
        <>
          <div className="order-hero">
            {paidStatuses.includes(order.status) ? (
              <CheckCircle2 size={46} />
            ) : order.status === "PENDING" ? (
              <Clock3 size={46} />
            ) : (
              <AlertCircle size={46} />
            )}

            <h1>
              {order.status === "PENDING"
                ? "PAYMENT PENDING."
                : order.status === "PAID_REVIEW"
                  ? "PAYMENT RECEIVED."
                  : order.status === "FAILED"
                    ? "PAYMENT NOT COMPLETED."
                    : paidStatuses.includes(order.status)
                      ? "YOUR KARMA IS COMING."
                      : order.status.replace(/_/g, " ")}
            </h1>

            <p>
              {order.status === "PAID_REVIEW"
                ? "Your payment was verified, but stock requires manual review. Do not pay again. Karma Curated will contact you."
                : order.status === "PENDING"
                  ? "We haven't confirmed your payment yet. Use Check Payment to verify."
                  : "Keep your order reference for support and tracking."}
            </p>
          </div>

          <div className="order-receipt">
            <p className="eyebrow">
              ORDER RECEIPT
            </p>

            {order.items.map(item => (
              <div
                className="summary-row"
                key={item.id}
              >
                <span>
                  {item.title}

                  {(item.size || item.color) &&
                    ` (${[
                      item.size,
                      item.color
                    ]
                      .filter(Boolean)
                      .join(" / ")})`}

                  {" × "}
                  {item.quantity}
                </span>

                <b>
                  {money(item.subtotal)}
                </b>
              </div>
            ))}

            <div className="summary-total">
              <span>TOTAL</span>
              <b>{money(order.total)}</b>
            </div>

            <div className="summary-row">
              <span>STATUS</span>
              <b>
                {order.status.replace(/_/g, " ")}
              </b>
            </div>
          </div>

          {["PENDING", "FAILED"].includes(
            order.status
          ) && (
            <button
              type="button"
              className="btn dark"
              disabled={verifying}
              onClick={verify}
            >
              <RotateCcw size={16} />

              {verifying
                ? "VERIFYING..."
                : "CHECK PAYMENT STATUS"}
            </button>
          )}
        </>
      ) : (
        <div className="error-msg">
          {error || "Order unavailable"}
        </div>
      )}

      {error && order && (
        <p className="error-msg">
          {error}
        </p>
      )}

      <Link
        href="/shop"
        className="plain-back"
      >
        EXPLORE MORE
        <ArrowRight size={17} />
      </Link>
    </main>
  );
}
