
import { products } from "@/lib/catalog";
import { getAppearance } from "@/lib/appearance";
import { ShopGrid } from "@/components/shop-grid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Drop — Karma Curated"
};

export default async function Page() {
  const [items, visuals] = await Promise.all([
    products(),
    getAppearance()
  ]);

  return (
    <main>
      <section className="shop-banner">
        <div className="main-container">
          <div>
            <p className="eyebrow light">
              KARMA CURATED / THE DROP
            </p>

            <h1>
              WEAR
              <br />
              YOUR
              <br />
              <em>KARMA.</em>
            </h1>

            <p>
              Statement pieces for the
              people defining their own culture.
            </p>
          </div>

          <div className="shop-banner-art">
            <img
              src={visuals.shopHero}
              alt="Karma Curated merchandise campaign"
            />
          </div>
        </div>
      </section>

      <section className="main-container section-block">
        <div className="subheading-row">
          <span>THE COLLECTION</span>
          <span>{items.length} PIECES</span>
        </div>

        <ShopGrid products={items} />
      </section>
    </main>
  );
}
