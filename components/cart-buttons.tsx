"use client";

import {
  useMemo,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  ShoppingBag,
  Check,
  Minus,
  Plus,
  ArrowRight
} from "lucide-react";

import { useCart } from "./cart-store";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  slug: string;
  name?: string;
  title?: string;
  image: string;
  price: number;
  stock?: number;
  remaining?: number;
  category?: string;
};

const SWATCHES: Record<string, string> = {
  BLACK: "#111111",
  WHITE: "#fafafa",
  CREAM: "#e6decc",
  RED: "#a91c2a",
  BLUE: "#214b84",
  NAVY: "#192c44",
  GREEN: "#476549",
  GREY: "#969696",
  GRAY: "#969696",
  BROWN: "#7a4f37",
  PINK: "#efb2bc",
  PURPLE: "#6a508d",
  ORANGE: "#e97527",

  CAMO:
    "linear-gradient(135deg,#444d35 0 24%,#a4a183 25% 43%,#252c1c 44% 69%,#777354 70% 100%)",

  CAMOUFLAGE:
    "linear-gradient(135deg,#444d35 0 24%,#a4a183 25% 43%,#252c1c 44% 69%,#777354 70% 100%)"
};

export function AddToCart({
  item,
  kind = "PRODUCT",
  variants = []
}: {
  item: Product;
  kind?: "PRODUCT" | "TICKET";
  variants?: Variant[];
}) {
  const router = useRouter();

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const add = useCart(state => state.add);
  const cartItems = useCart(state => state.items);

  const sizes = useMemo(
    () => [
      ...new Set(
        variants.map(variant => variant.size)
      )
    ],
    [variants]
  );

  const colors = variants.filter(
    variant => variant.size === size
  );

  const selectedVariant = variants.find(
    variant =>
      variant.size === size &&
      variant.color === color &&
      variant.stock > 0
  );

  const isHeadwear =
    kind === "PRODUCT" &&
    /skull|headwear/i.test(
      `${item.name || ""} ${item.category || ""}`
    );

  const variantsRequired =
    kind === "PRODUCT" &&
    (variants.length > 0 || isHeadwear);

  const alreadyInBag = cartItems
    .filter(
      existing =>
        existing.id === item.id &&
        existing.kind === kind &&
        existing.size === (
          variantsRequired ? size : undefined
        ) &&
        existing.color === (
          variantsRequired ? color : undefined
        )
    )
    .reduce(
      (sum, existing) =>
        sum + existing.quantity,
      0
    );

  const stock =
    kind === "TICKET"
      ? item.remaining ?? 0
      : variantsRequired
        ? selectedVariant?.stock ?? 0
        : item.stock ?? 0;

  const available = Math.max(
    0,
    stock - alreadyInBag
  );

  const hasChoice =
    !variantsRequired ||
    Boolean(selectedVariant);

  const canAdd =
    hasChoice &&
    available >= qty &&
    qty >= 1;

  function chooseSize(value: string) {
    setSize(value);
    setColor("");
    setQty(1);
    setAdded(false);
  }

  function chooseColor(value: string) {
    setColor(value);
    setQty(1);
    setAdded(false);
  }

  function addItem(): boolean {
    if (!canAdd) return false;

    add({
      id: item.id,
      kind,
      slug: item.slug,
      title:
        item.name ||
        item.title ||
        "",
      image: item.image,
      unitPrice: item.price,
      quantity: qty,

      size: variantsRequired
        ? size
        : undefined,

      color: variantsRequired
        ? color
        : undefined
    });

    setAdded(true);

    return true;
  }

  function fastCheckout() {
    if (!addItem()) return;

    // Includes other existing bag items.
    // The entire bag is shown at checkout.
    router.push("/checkout");
  }

  return (
    <div className="purchase-actions">
      {variantsRequired && (
        <>
          <div className="size-picker">
            <span>01 / SELECT YOUR SIZE</span>

            <div>
              {sizes.map(option => {
                const inStock = variants.some(
                  variant =>
                    variant.size === option &&
                    variant.stock > 0
                );

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!inStock}
                    aria-pressed={
                      size === option
                    }
                    className={
                      size === option
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      chooseSize(option)
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="size-picker color-picker">
            <span>02 / SELECT YOUR COLOR</span>

            {!size && (
              <p className="subtle">
                Select your size first.
              </p>
            )}

            <div>
              {colors.map(variant => {
                const swatch =
                  SWATCHES[
                    variant.color.toUpperCase()
                  ] ||
                  (
                    /^#[0-9a-f]{3}([0-9a-f]{3})?$/i
                      .test(variant.color)
                      ? variant.color
                      : "#888888"
                  );

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={
                      variant.stock <= 0
                    }
                    aria-pressed={
                      color === variant.color
                    }
                    className={
                      `color-choice ${
                        color === variant.color
                          ? "selected"
                          : ""
                      }`
                    }
                    onClick={() =>
                      chooseColor(
                        variant.color
                      )
                    }
                  >
                    <i
                      style={{
                        background: swatch
                      }}
                    />

                    {variant.color}

                    {variant.stock <= 0 &&
                      " (SOLD OUT)"}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedVariant && (
            <p className="variant-availability">
              {selectedVariant.stock} available
              {" — "}
              {selectedVariant.size}
              {" / "}
              {selectedVariant.color}
            </p>
          )}
        </>
      )}

      {isHeadwear &&
        variants.length === 0 && (
          <p className="error-msg">
            This product needs size
            and color configuration.
          </p>
        )}

      <div className="purchase-control">
        <div className="quantity-control">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() =>
              setQty(
                Math.max(1, qty - 1)
              )
            }
          >
            <Minus size={16} />
          </button>

          <span>{qty}</span>

          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() =>
              setQty(
                Math.min(
                  10,
                  Math.max(
                    qty,
                    available
                  ),
                  qty + 1
                )
              )
            }
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          disabled={!canAdd}
          className="btn dark grow"
          onClick={addItem}
        >
          {added ? (
            <>
              <Check size={18} />
              ADDED TO BAG
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              {stock > 0
                ? "ADD TO BAG"
                : "UNAVAILABLE"}
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        disabled={!canAdd}
        className="btn orange fill"
        style={{
          width: "100%",
          marginTop: 12
        }}
        onClick={fastCheckout}
      >
        FAST CHECKOUT
        <ArrowRight size={18} />
      </button>

      <p className="subtle">
        {variantsRequired
          ? "Choose your size and color first."
          : "Confirm your selection before payment."}
        {" "}
        Fast checkout includes other items
        already in your bag.
        No account is required.
      </p>
    </div>
  );
}
