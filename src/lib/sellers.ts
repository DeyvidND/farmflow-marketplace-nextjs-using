// Pure seller-dedup over CartItem[]. Cart lines are stamped with the
// selling farmer at add-time; lines without a stamp (e.g. added before this
// feature shipped, or on a single-farmer storefront that never stamps) are
// skipped rather than surfaced as an "unknown" seller.
import type { CartItem } from '../components/cart/cart-provider';

export function distinctSellers(items: CartItem[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!item.farmerId) continue;
    if (!seen.has(item.farmerId)) seen.set(item.farmerId, item.farmerName ?? '');
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}
