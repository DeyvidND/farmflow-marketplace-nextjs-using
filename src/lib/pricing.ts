// Pure display-price selection. The server computes every price; this only
// decides which to SHOW. Single source for card + detail + cart.
import type { Product, PublicProductVariant } from './types';

export function variantPriceStotinki(v: PublicProductVariant): number {
  return v.salePriceStotinki ?? v.priceStotinki;
}

export function hasVariants(p: Product): boolean {
  return Array.isArray(p.variants) && p.variants.length > 0;
}

export function cheapestVariant(p: Product): PublicProductVariant | null {
  if (!hasVariants(p)) return null;
  return p.variants!.reduce((min, v) => (variantPriceStotinki(v) < variantPriceStotinki(min) ? v : min));
}

export function allVariantsSoldOut(p: Product): boolean {
  return hasVariants(p) && p.variants!.every((v) => v.soldOut);
}

export interface PriceDisplay {
  headlineStotinki: number;
  compareStotinki: number | null;
  fromPrefix: boolean;
}

/** Headline + optional struck-through compare. Priority: variants (cheapest) →
 *  % promo → legacy compareAt (bundles) → plain. */
export function priceDisplay(p: Product): PriceDisplay {
  if (hasVariants(p)) {
    const cv = cheapestVariant(p)!;
    const sale = cv.salePriceStotinki ?? null;
    return {
      headlineStotinki: sale ?? cv.priceStotinki,
      compareStotinki: sale != null ? cv.priceStotinki : null,
      fromPrefix: p.variants!.length > 1,
    };
  }
  const sale = p.salePriceStotinki ?? null;
  if (sale != null) return { headlineStotinki: sale, compareStotinki: p.priceStotinki, fromPrefix: false };
  if (p.compareAtPriceStotinki != null)
    return { headlineStotinki: p.priceStotinki, compareStotinki: p.compareAtPriceStotinki, fromPrefix: false };
  return { headlineStotinki: p.priceStotinki, compareStotinki: null, fromPrefix: false };
}

export function discountPercent(pd: PriceDisplay): number | null {
  if (pd.compareStotinki == null || pd.compareStotinki <= 0) return null;
  const off = Math.round((1 - pd.headlineStotinki / pd.compareStotinki) * 100);
  return off > 0 ? off : null;
}
