import Link from "next/link";

import {
  redirect
} from "next/navigation";

import {
  requireAdmin
} from "@/lib/auth";

import { prisma } from "@/lib/db";

import {
  dateLabel,
  money
} from "@/lib/format";

import {
  deliveryLabel
} from "@/lib/delivery";

import {
  AdminOrderAction
} from "@/components/admin-operations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Delivery Management — Karma Curated"
};

export default async function Page() {
  const user = await requireAdmin();

  if (!user) {
    redirect(
      "/login?next=/admin/deliveries"
    );
  }

  const orders =
    await prisma.order.findMany({
      where: {
        deliveryMethod: {
          not: "NONE"
        }
      },

      include: {
        items: true
      },

      orderBy: {
        createdAt: "desc"
      },

      take: 100
    });

  return (
    <main className="main-container page-pad admin-page">
      <p className="eyebrow">
        KARMA CURATED / FULFILLMENT
      </p>

      <h1 className="page-title">
        DELIVERIES
        <span className="accent-dot">.</span>
      </h1>

      <p className="admin-intro">
        Review customer delivery preferences,
        confirm courier availability,
        agree delivery fees and manage fulfillment.
        A selected courier is not an automatic
        dispatch booking.
      </p>

      <div className="inline-links">
        <Link
          href="/admin"
          className="btn dark"
        >
          BACK TO CONTROL ROOM
        </Link>
      </div>

      <section className="admin-table-section">
        <h2>DELIVERY ORDERS</h2>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>DELIVERY</th>
                <th>ITEMS</th>
                <th>PAYMENT / ORDER</th>
                <th>FULFILLMENT</th>
              </tr>
            </thead>

            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.reference}</strong>

                    <br />

                    <small>
                      {dateLabel(order.createdAt)}
                    </small>
                  </td>

                  <td>
                    <strong>{order.name}</strong>

                    <br />

                    <small>{order.email}</small>

                    <br />

                    <small>{order.phone}</small>
                  </td>

                  <td>
                    <strong>
                      {deliveryLabel(
                        order.deliveryMethod,
                        order.deliveryOther
                      )}
                    </strong>

                    <br />

                    <small>{order.city}</small>

                    <br />

                    <small>{order.address}</small>

                    {order.deliveryNotes && (
                      <p
                        style={{
                          fontSize: 11,
                          marginTop: 8,
                          maxWidth: 240
                        }}
                      >
                        {order.deliveryNotes}
                      </p>
                    )}
                  </td>

                  <td>
                    {order.items.map(item => (
                      <small
                        key={item.id}
                        style={{
                          display: "block",
                          marginBottom: 7
                        }}
                      >
                        {item.quantity} × {item.title}
                        {item.size || item.color
                          ? ` — ${[
                              item.size,
                              item.color
                            ]
                              .filter(Boolean)
                              .join(" / ")}`
                          : ""}
                      </small>
                    ))}
                  </td>

                  <td>
                    <b>{money(order.total)}</b>

                    <br />

                    <small>{order.status}</small>

                    <br />

                    <small>
                      Delivery not included
                      in online total
                    </small>
                  </td>

                  <td>
                    <AdminOrderAction
                      id={order.id}
                      status={order.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <p className="subtle">
            No merchandise delivery
            preferences have been recorded yet.
          </p>
        )}
      </section>
    </main>
  );
}
