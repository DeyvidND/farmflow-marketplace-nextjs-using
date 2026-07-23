// Pure "companion product" rule math over CartItem[]. A companion product
// (requiresCompanion) can't be ordered alone — it needs OTHER products in
// the cart: either any single other product, or other products totaling a
// minimum euro amount.
import type { CartItem } from '../components/cart/cart-provider';
import { eur } from './money';

/** Sum of euro-cents across lines whose BASE product id (the part before any
 *  ":variantId" suffix) differs from `excludeId`. Each line is rounded to
 *  cents BEFORE summing — summing float euros first drifts
 *  (0.01 + 4.02 + 0.47 = 4.4999999999999996) and can wrongly fail an
 *  exact-threshold comparison. */
export function otherProductsStotinki(items: CartItem[], excludeId: string): number {
  return items
    .filter((o) => o.id.split(':')[0] !== excludeId)
    .reduce((sum, o) => sum + Math.round(o.price * 100) * o.qty, 0);
}

/** `minStotinki` > 0 → other lines must total at least that much.
 *  null/absent/0 → any single other-product line suffices. */
export function companionSatisfied(
  productId: string,
  minStotinki: number | null | undefined,
  items: CartItem[],
): boolean {
  if (minStotinki && minStotinki > 0) {
    return otherProductsStotinki(items, productId) >= minStotinki;
  }
  return items.some((o) => o.id.split(':')[0] !== productId);
}

/** Cart lines flagged `requiresCompanion` whose rule isn't yet satisfied. */
export function unsatisfiedCompanions(items: CartItem[]): CartItem[] {
  return items.filter((item) => {
    if (!item.requiresCompanion) return false;
    const productId = item.id.split(':')[0];
    return !companionSatisfied(productId, item.companionMinStotinki, items);
  });
}

/** Euros still needed to satisfy a threshold rule; 0 once satisfied (and
 *  always 0 under the "any other product" rule — there's no amount to close). */
export function companionShortfall(
  productId: string,
  minStotinki: number | null | undefined,
  items: CartItem[],
): number {
  if (!minStotinki || minStotinki <= 0) return 0;
  const have = otherProductsStotinki(items, productId);
  return have >= minStotinki ? 0 : (minStotinki - have) / 100;
}

/** User-facing nudge for an unsatisfied companion line. */
export function companionMessage(item: CartItem): string {
  const min = item.companionMinStotinki;
  if (min && min > 0) {
    return `„${item.name}“ не се продава самостоятелно — добавете други продукти на обща стойност поне ${eur(min)}.`;
  }
  return `„${item.name}“ не се продава самостоятелно — добавете още един продукт по избор.`;
}
