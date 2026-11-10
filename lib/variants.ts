
export type VariantInput = {
  size: string;
  color: string;
  stock: number;
};

export function normalizedVariantKey(
  size: string,
  color: string
) {
  return [
    size.trim().toLowerCase(),
    color.trim().toLowerCase()
  ].join("::");
}

export function uniqueVariants(
  variants: VariantInput[]
) {
  const seen = new Set<string>();

  for (const variant of variants) {
    const key = normalizedVariantKey(
      variant.size,
      variant.color
    );

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
  }

  return true;
}

export function variantStock(
  variants: VariantInput[]
) {
  return variants.reduce(
    (total, variant) => total + variant.stock,
    0
  );
}
