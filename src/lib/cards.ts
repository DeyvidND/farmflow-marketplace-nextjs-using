import type { Bootstrap, Product } from "./types";
import type { CardData } from "./card-data";
import { catIdOf } from "./catalog";
import { farmerSlugMap } from "./farmer-slug";

/** Precompute ProductCard data for a set of products from a bootstrap. */
export function toCards(boot: Bootstrap, products: Product[]): CardData[] {
  const sf = boot.storefront;
  const showFarmers = sf.multiFarmer;
  const slugs = farmerSlugMap(boot.farmers);
  const byId = new Map(boot.farmers.map((f) => [f.id, f]));
  const availMap = new Map((boot.availability ?? []).map((w) => [w.productId, w.remaining]));
  const best = new Set(boot.bestSellerIds ?? []);

  return products.map((p) => {
    const f = p.farmerId ? byId.get(p.farmerId) : null;
    return {
      product: p,
      farmerName: showFarmers ? f?.name ?? null : null,
      farmerSlug: showFarmers && p.farmerId ? slugs.get(p.farmerId) ?? null : null,
      farmerImage: showFarmers ? f?.images?.[0] ?? f?.imageUrl ?? null : null,
      farmerId: showFarmers ? p.farmerId : null,
      bestSeller: best.has(p.id),
      remaining: availMap.has(p.id) ? availMap.get(p.id) ?? null : null,
      cat: catIdOf(p, sf.multiSubcat),
    };
  });
}
