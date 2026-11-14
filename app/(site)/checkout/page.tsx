import { CheckoutForm } from "@/components/checkout-form";
import { paymentMode } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Karma Curated"
};

export default function Page() {
  return (
    <CheckoutForm mode={paymentMode()} />
  );
}
