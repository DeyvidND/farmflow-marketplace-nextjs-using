// Server-side storefront data fetch. One round trip via /bootstrap; Next caches
// + revalidates so repeated renders within the window are free.
import { PUBLIC_BASE } from './config';
import type { Bootstrap, Storefront } from './types';

export const FALLBACK_STOREFRONT: Storefront = {
  name: 'Фермерски пазари',
  slug: 'marketplace-demo',
  phone: null,
  email: null,
  deliveryEnabled: false,
  multiFarmer: true,
  multiSubcat: true,
  delivery: { freeThresholdStotinki: 0, addressFeeStotinki: 490, econtFeeStotinki: 350, econtAddressFeeStotinki: 590 },
  faviconUrl: null,
  themeColor: '#33603E',
  contact: null,
};

const EMPTY: Bootstrap = {
  storefront: FALLBACK_STOREFRONT,
  products: [],
  farmers: [],
  subcategories: [],
  productOfWeek: null,
  farmerOfWeek: null,
  availability: [],
  bestSellerIds: [],
};

/** The full storefront bootstrap (storefront + products + farmers + subcats +
 *  productOfWeek + farmerOfWeek + availability + bestSellerIds). Degrades to an
 *  empty catalog on any network/parse failure so the page still renders its
 *  empty states. */
export async function getCatalog(): Promise<Bootstrap> {
  try {
    const res = await fetch(`${PUBLIC_BASE}/bootstrap`, { next: { revalidate: 60 } });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as Partial<Bootstrap>;
    return {
      storefront: data.storefront ?? FALLBACK_STOREFRONT,
      products: data.products ?? [],
      // `tier` defaults to 1 for cached/pre-deploy bootstrap responses that
      // predate the tier column — keeps sortByTier() stable instead of NaN.
      farmers: (data.farmers ?? []).map((f) => ({ ...f, tier: f.tier ?? 1 })),
      subcategories: data.subcategories ?? [],
      productOfWeek: data.productOfWeek ?? null,
      farmerOfWeek: data.farmerOfWeek ?? null,
      availability: data.availability ?? [],
      bestSellerIds: data.bestSellerIds ?? [],
    };
  } catch {
    return EMPTY;
  }
}
