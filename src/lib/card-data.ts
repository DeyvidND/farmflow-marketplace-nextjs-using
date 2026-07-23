import type { Product } from "./types";

/** Everything ProductCard needs for one product, precomputed server-side. */
export interface CardData {
  product: Product;
  farmerName: string | null;
  farmerSlug: string | null;
  farmerImage: string | null;
  farmerId: string | null;
  bestSeller: boolean;
  remaining: number | null;
  cat: string;
}
