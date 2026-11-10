
import {
  product,
  products
} from "@/lib/catalog";

import { notFound } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  PackageCheck,
  ShieldCheck
} from "lucide-react";

import { money } from "@/lib/format";
import { ProductCard } from "@/components/ui";
import { AddToCart } from "@/components/cart-buttons";
import { ProductGallery } from "@/components/product-gallery";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await product(slug);

  if (!item) {
    notFound();
  }

  const related = (await products())
    .filter(other => other.slug !== item.slug)
    .slice(0, 3);

  return (
    <main className="main-container page-pad">
      <Link
        href="/shop"
        className="eyebrow"
      >
        <ArrowLeft size={15} />
        BACK TO THE DROP
      </Link>

      <section className="product-detail">
        <ProductGallery
          name={item.name}
          image={item.image}
          gallery={item.gallery || []}
        />

        <div className="product-info">
          <p className="eyebrow">
            KARMA CURATED /
            {" "}
            {item.category.toUpperCase()}
          </p>

          <h1>{item.name}</h1>
          <h2>{money(item.price)}</h2>

          <p className="product-description">
            {item.description}
          </p>

          <div className="product-divider" />

          <AddToCart
            item={item}
            variants={item.variants || []}
          />

          <div className="product-benefits">
            <p>
              <PackageCheck size={20} />
              Local delivery and collection
              arranged after purchase
            </p>

            <p>
              <ShieldCheck size={20} />
              Secure payment via PayChangu
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-block">
          <p className="eyebrow">
            COMPLETE THE LOOK
          </p>

          <h2 className="section-title">
            MORE FROM THE DROP.
          </h2>

          <div className="product-grid">
            {related.map(other => (
              <ProductCard
                key={other.slug}
                product={other}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
