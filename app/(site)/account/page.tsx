import Link from "next/link";

import {
  sessionUser
} from "@/lib/auth";

import { prisma } from "@/lib/db";

import {
  LogoutButton
} from "@/components/logout-button";

import {
  money,
  dateLabel
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account — Karma Curated"
};

export default async function Page() {
  const user = await sessionUser();

  if (!user) {
    return (
      <main className="main-container empty-state">
        <p className="eyebrow">
          YOUR KARMA / ACCOUNT
        </p>

        <h1>
          GOOD TO SEE
          <br />
          YOU AROUND.
        </h1>

        <p>
          Sign in to view your purchases
          and event reservations.
        </p>

        <div className="inline-links">
          <Link
            href="/login"
            className="btn dark"
          >
            SIGN IN
          </Link>

          <Link
            href="/register"
            className="btn outline"
          >
            JOIN KARMA
          </Link>

          <Link
            href="/shop"
            className="btn outline"
          >
            EXPLORE SHOP
          </Link>
        </div>
      </main>
    );
  }

  const [orders, rsvps] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 30
      }),

      prisma.rsvp.findMany({
        where: {
          userId: user.id
        },
        include: {
          event: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 30
      })
    ]);

  const firstName =
    user.name.trim().split(/\s+/)[0];

  return (
    <main className="main-container page-pad">
      <p className="eyebrow">
        MY KARMA / ACCOUNT
      </p>

      <h1 className="page-title">
        HEY, {firstName.toUpperCase()}
        <span className="accent-dot">.</span>
      </h1>

      <div className="account-head">
        <span>
          {user.email} / {user.role}
        </span>

        <div>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="btn orange"
            >
              ADMIN STUDIO
            </Link>
          )}

          <LogoutButton />
        </div>
      </div>

      <section className="account-panel">
        <h2>YOUR ORDERS</h2>

        {orders.length > 0 ? (
          orders.map(order => (
            <Link
              className="account-row"
              key={order.id}
              href={`/order?ref=${encodeURIComponent(
                order.reference
              )}`}
            >
              <div>
                <strong>
                  {order.reference}
                </strong>

                <small>
                  {dateLabel(order.createdAt)}
                </small>
              </div>

              <div>
                <b>{money(order.total)}</b>

                <span>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div
            style={{
              padding: "30px",
              background: "#fff",
              border: "1px solid #e4e1dc"
            }}
          >
            <p className="subtle">
              No purchases yet.
              Your next favorite piece is waiting.
            </p>

            <div className="inline-links">
              <Link
                href="/shop"
                className="btn dark"
              >
                SHOP THE DROP
              </Link>

              <Link
                href="/events"
                className="btn outline"
              >
                EXPLORE EVENTS
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="account-panel">
        <h2>YOUR RSVPs</h2>

        {rsvps.length > 0 ? (
          rsvps.map(rsvp => (
            <Link
              className="account-row"
              key={rsvp.id}
              href={`/events/${rsvp.event.slug}`}
            >
              <div>
                <strong>
                  {rsvp.event.title}
                </strong>

                <small>
                  {dateLabel(rsvp.event.date)}
                </small>
              </div>

              <span>CONFIRMED</span>
            </Link>
          ))
        ) : (
          <div
            style={{
              padding: "30px",
              background: "#fff",
              border: "1px solid #e4e1dc"
            }}
          >
            <p className="subtle">
              No event reservations yet.
              Discover the next Karma experience.
            </p>

            <Link
              href="/events"
              className="btn orange"
            >
              DISCOVER EVENTS
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
