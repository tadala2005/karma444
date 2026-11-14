import {
  CartPage
} from "@/components/cart-page";

import {
  paymentMode
} from "@/lib/commerce";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Bag — Karma Curated"
};

export default function Page() {
  return (
    <CartPage mode={paymentMode()} />
  );
}
