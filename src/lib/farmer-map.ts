// Pure point-resolution + filtering for the Карта (farmer map) page. No
// React/DOM here — keep this trivially unit-testable, per
// docs/superpowers/plans task 7.
import type { Farmer, Product } from './types';
import { catIdOf } from './catalog';

export interface MapPoint {
  name: string;
  village: string;
  lat: number;
  lng: number;
  slug: string | null;
}

/** Farmers with a known farm location, mapped to renderable map points.
 *  Farmers without both `lat` and `lng` have no pin — no fallback geocoding
 *  or name-matching, just a filter. `slugs` is `farmerSlugMap(farmers)`. */
export function resolveMapPoints(farmers: Farmer[], slugs: Map<string, string>): MapPoint[] {
  return farmers
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({
      name: f.name,
      village: f.city ?? '',
      lat: f.lat as number,
      lng: f.lng as number,
      slug: slugs.get(f.id) ?? null,
    }));
}

export interface FarmerFilter {
  /** Free-text query — matches the farmer's name/role/bio OR any of their
   *  product names (case-insensitive, `toLocaleLowerCase('bg')`). Empty/blank
   *  = no text filter. */
  q?: string;
  /** Category ids (see `catIdOf`) — a farmer matches when ANY of their own
   *  products falls in ANY of these categories (OR semantics). Empty/undefined
   *  set = no category filter. */
  cats?: Set<string>;
  /** Passed straight through to `catIdOf` when resolving `cats` — mirrors the
   *  storefront's `multiSubcat` flag. */
  multiSubcat?: boolean;
}

/** Farmers matching a search query and/or a set of product categories, derived
 *  entirely from the farmer's own product list — no separate per-farmer
 *  category data exists. Empty `q` + empty/absent `cats` matches every farmer. */
export function matchFarmers(farmers: Farmer[], products: Product[], filter: FarmerFilter = {}): Farmer[] {
  const { q = '', cats, multiSubcat = false } = filter;
  const nq = q.trim().toLocaleLowerCase('bg');

  const byFarmer = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.farmerId) continue;
    const list = byFarmer.get(p.farmerId);
    if (list) list.push(p);
    else byFarmer.set(p.farmerId, [p]);
  }

  return farmers.filter((f) => {
    const own = byFarmer.get(f.id) ?? [];

    if (cats && cats.size > 0) {
      const inCategory = own.some((p) => cats.has(catIdOf(p, multiSubcat)));
      if (!inCategory) return false;
    }

    if (nq) {
      const haystack = [f.name, f.role, f.bio, ...own.map((p) => p.name)]
        .filter((v): v is string => !!v)
        .join(' ')
        .toLocaleLowerCase('bg');
      if (!haystack.includes(nq)) return false;
    }

    return true;
  });
}
