import Link from "next/link";

import {
  redirect
} from "next/navigation";

import {
  requireAdmin
} from "@/lib/auth";

import {
  prisma
} from "@/lib/db";

import {
  getAppearance
} from "@/lib/appearance";

import {
  AdminPanel
} from "@/components/admin-panel";

import {
  AdminBookingAction,
  AdminOrderAction
} from "@/components/admin-operations";

import {
  dateLabel,
  money
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Karma Curated / Control Room"
};

export default async function Page() {
  const user = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const [
    products,
    artists,
    articles,
    events,
    orders,
    bookings,
    appearance,
    productCount,
    artistCount,
    articleCount,
    eventCount,
    orderCount,
    newBookingCount
  ] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: {
          where: {
            active: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 200
    }),

    prisma.artist.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 200
    }),

    prisma.article.findMany({
      orderBy: {
        publishedAt: "desc"
      },
      take: 200
    }),

    prisma.event.findMany({
      orderBy: {
        date: "desc"
      },
      take: 200
    }),

    prisma.order.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 30,
      include: {
        items: true
      }
    }),

    prisma.booking.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    }),

    getAppearance(),

    prisma.product.count(),
    prisma.artist.count(),
    prisma.article.count(),
    prisma.event.count(),
    prisma.order.count(),

    prisma.booking.count({
      where: {
        status: "NEW"
      }
    })
  ]);

  function serialize(
    rows: any[]
  ) {
    return rows.map(row => ({
      ...row,

      date:
        row.date?.toISOString?.(),

      createdAt:
        row.createdAt?.toISOString?.(),

      publishedAt:
        row.publishedAt?.toISOString?.()
    }));
  }

  const stats = [
    ["PRODUCTS", productCount],
    ["ARTISTS", artistCount],
    ["STORIES", articleCount],
    ["EVENTS", eventCount],
    ["ORDERS", orderCount],
    ["NEW BRIEFS", newBookingCount]
  ] as const;

  return (
    <main className="main-container page-pad admin-page">
      <p className="eyebrow">
        KARMA CURATED / INTERNAL
      </p>

      <h1 className="page-title">
        THE CONTROL ROOM
        <span className="accent-dot">.</span>
      </h1>

      <p className="admin-intro">
        Manage website imagery, artists,
        editorial, events, merchandise,
        orders and creative enquiries.
      </p>

      <div
        className="inline-links"
        style={{
          marginBottom: 36
        }}
      >
        <Link
          href="/admin/deliveries"
          className="btn orange"
        >
          DELIVERY MANAGEMENT
        </Link>

        <Link
          href="/shop"
          className="btn outline"
        >
          VIEW SHOP
        </Link>
      </div>

      <div className="admin-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>

      <AdminPanel
        data={{
          products: serialize(products),
          artists: serialize(artists),
          articles: serialize(articles),
          events: serialize(events)
        }}
        appearance={appearance}
      />

      <section className="admin-table-section">
        <p className="eyebrow">
          TRANSACTIONS
        </p>

        <h2>RECENT ORDERS.</h2>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>REFERENCE</th>
                <th>CUSTOMER</th>
                <th>VALUE</th>
                <th>STATUS</th>
                <th>FULFILLMENT</th>
              </tr>
            </thead>

            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <small>
                      {dateLabel(
                        order.createdAt
                      )}
                    </small>

                    <div>
                      {order.reference}
                    </div>
                  </td>

                  <td>
                    {order.name}

                    <br />

                    <small>
                      {order.email}
                    </small>

                    {order.items.map(item => (
                      <small
                        key={item.id}
                        style={{
                          display: "block",
                          marginTop: 4
                        }}
                      >
                        {item.quantity} × {item.title}

                        {item.size || item.color
                          ? ` · ${[
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
                    {money(order.total)}
                  </td>

                  <td>
                    {order.status}
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
          <p>No orders yet.</p>
        )}
      </section>

      <section className="admin-table-section">
        <p className="eyebrow">
          CREATIVE WORK
        </p>

        <h2>CAMPAIGN ENQUIRIES.</h2>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>RECEIVED</th>
                <th>CONTACT</th>
                <th>SERVICE</th>
                <th>BRIEF</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    {dateLabel(
                      booking.createdAt
                    )}
                  </td>

                  <td>
                    {booking.name}

                    <br />

                    <small>
                      {booking.email}
                    </small>
                  </td>

                  <td>
                    {booking.service}

                    <br />

                    <small>
                      {booking.budget}
                    </small>
                  </td>

                  <td className="brief-cell">
                    {booking.brief}
                  </td>

                  <td>
                    <AdminBookingAction
                      id={booking.id}
                      status={booking.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <p>No enquiries yet.</p>
        )}
      </section>
    </main>
  );
}
