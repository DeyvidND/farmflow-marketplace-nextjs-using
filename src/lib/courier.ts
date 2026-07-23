// Pure courier-shipping blocker rules over cart items. A "blocker" is a
// reason a cart can't ship by an external carrier (Еконт/Спиди) and must
// stay pickup/local-delivery only: баскети/кошници (category === 'bundle')
// can't be boxed by a carrier, and individual products the farmer flagged
// fragile/perishable (courierDisabled) can't survive transit.
//
// Entirely dormant today: nothing in the checkout UI offers a carrier
// method yet (see CARRIER_METHODS below and src/lib/config.ts). This exists
// so the day a carrier method is wired into checkout, the blocker math is
// already correct and tested.
import type { CartItem } from '../components/cart/cart-provider';
import type { Product } from './types';

/** Delivery methods that hand the parcel to an external carrier rather than
 *  the farmer's own pickup/local delivery. Checked against the checkout
 *  form's selected method (typed loosely as `string` by callers so this can
 *  light up without widening that form's own method union). */
export const CARRIER_METHODS = new Set(['econt', 'econt_address', 'courier']);

export interface CourierBlockers {
  /** Names of cart lines whose product is flagged courierDisabled (the
   *  farmer marked it too fragile/perishable to ship by carrier). */
  fragileNames: string[];
  /** True when any cart line is a кошница (bundle) — carriers can't box one. */
  hasBasket: boolean;
}

/** Computes why (if at all) a cart can't ship by courier. Cart line ids may
 *  carry a ":variantId" suffix (see CartItem) — resolved by the BASE product
 *  id. Lines whose product isn't found in `productById` (deleted/renamed
 *  since it was added to the cart) are ignored rather than treated as
 *  blockers or thrown on. */
export function courierBlockers(items: CartItem[], productById: Map<string, Product>): CourierBlockers {
  const fragileNames: string[] = [];
  let hasBasket = false;

  for (const item of items) {
    const productId = item.id.split(':')[0];
    const product = productById.get(productId);
    if (!product) continue;

    if (product.category === 'bundle') hasBasket = true;
    if (product.courierDisabled === true) fragileNames.push(item.name);
  }

  return { fragileNames, hasBasket };
}
