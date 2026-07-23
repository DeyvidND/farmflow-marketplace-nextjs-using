// Server-side storefront data fetch. One round trip via /bootstrap; Next caches
// + revalidates so repeated renders within the window are free.
import { PUBLIC_BASE } from './config';
import type { Article, Bootstrap, PublicOrderSummary, ReviewSummary, Storefront } from './types';

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

/* ---- Secondary public reads (same degrade-to-empty contract as getCatalog) ---- */

async function getJson<T>(path: string, fallback: T, revalidate = 300): Promise<T> {
  try {
    const res = await fetch(`${PUBLIC_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

/** Published articles, newest-first (API owns the ordering). */
export const getArticles = () => getJson<Article[]>('/articles', []);

/** One article by slug, or null when unpublished/missing. */
export const getArticle = (slug: string) =>
  getJson<Article | null>(`/articles/${encodeURIComponent(slug)}`, null);

/** Storefront review roll-up ({average, count, reviews}). */
export const getReviews = () =>
  getJson<ReviewSummary>('/reviews', { average: 0, count: 0, reviews: [] });

/** Public order recap (UUID-gated). Never cached — the shopper is watching a
 *  status that changes; null covers bad ids and network failures alike. */
export async function getPublicOrder(id: string): Promise<PublicOrderSummary | null> {
  try {
    const res = await fetch(`${PUBLIC_BASE}/orders/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as PublicOrderSummary;
  } catch {
    return null;
  }
}
