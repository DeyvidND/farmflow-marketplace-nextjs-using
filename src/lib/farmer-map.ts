// Pure point-resolution for the Карта (farmer map) page. No React/DOM here —
// keep this trivially unit-testable, per docs/superpowers/plans task 7.
import type { Farmer } from './types';

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
