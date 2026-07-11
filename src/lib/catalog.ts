// Shapes flat backend data into the farmer → category → product structure.
import type { Product, Subcategory, CoverCrop, Farmer } from './types';

export interface Category {
  id: string;
  name: string;
  desc: string;
  icon: string; // lucide icon name (see lib/icon-map)
  imageUrl: string | null;
  coverCrop: CoverCrop | null;
  count: number;
}

const BUNDLE_LABEL = 'Сезонни пакети';
const catLabel = (raw: string) => (raw === 'bundle' ? BUNDLE_LABEL : raw);

/** Best-effort lucide icon by category name. */
export function iconForCategory(name: string | null | undefined): string {
  const n = (name || '').toLowerCase();
  if (/плод|зелен|fruit|produce|овощ/.test(n)) return 'apple';
  if (/млеч|сирен|dairy|мляко/.test(n)) return 'milk';
  if (/мед|honey|пчел/.test(n)) return 'droplet';
  if (/мес|meat|колбас/.test(n)) return 'beef';
  if (/ядк|орех|бадем|nut|лешник/.test(n)) return 'nut';
  if (/слад|сироп|jam|конфитюр|зимнин|буркан|преработ|изкушен|десерт|печиво/.test(n)) return 'cookie';
  return 'sprout';
}

export function catIdOf(p: Product, multiSubcat: boolean): string {
  return (multiSubcat ? p.subcategoryId : p.category) || '';
}

export function categoriesFrom(products: Product[], subcats: Subcategory[], multiSubcat: boolean): Category[] {
  if (multiSubcat && subcats.length) {
    return subcats.map((s) => ({
      id: s.id,
      name: s.name,
      desc: s.description || 'Продукти от тази категория, директно от фермера.',
      icon: iconForCategory(s.name),
      imageUrl: s.imageUrl,
      coverCrop: s.coverCrop ?? null,
      count: products.filter((p) => p.subcategoryId === s.id).length,
    }));
  }
  const seen = new Map<string, number>();
  for (const p of products) {
    const key = p.category || '';
    if (!key) continue;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  return [...seen.entries()].map(([id, count]) => ({
    id,
    name: catLabel(id),
    desc: 'Свежи продукти от местните фермери.',
    icon: iconForCategory(catLabel(id)),
    imageUrl: null,
    coverCrop: null,
    count,
  }));
}

/** Featured first (admin ★), then newest, capped at n. */
export function featured(products: Product[], n: number): Product[] {
  const active = products.filter((p) => p.isActive !== false);
  const stars = active.filter((p) => p.featured);
  const rest = active.filter((p) => !p.featured);
  return [...stars, ...rest].slice(0, n);
}

/** Items created within `days`, newest-first; topped up to `min` with the newest
 *  overall when the window is sparse. `now` is injectable for tests. */
export function recent<T extends { createdAt: string | null; isActive?: boolean | null }>(
  items: T[],
  days = 14,
  min = 8,
  now: Date = new Date(),
): T[] {
  const active = items.filter((p) => p.isActive !== false);
  const byNew = [...active].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
  const cutoff = now.getTime() - days * 86_400_000;
  const inWindow = byNew.filter((p) => new Date(p.createdAt ?? 0).getTime() >= cutoff);
  if (inWindow.length >= min) return inWindow;
  // Top up with the newest items that aren't already in the window, preserving order.
  const seen = new Set(inWindow.map((p) => (p as { id?: string }).id));
  return [...inWindow, ...byNew.filter((p) => !seen.has((p as { id?: string }).id))].slice(
    0,
    Math.max(min, inWindow.length),
  );
}

/** Farmers ranked for the marketplace: tier DESC (3 on top, 1 at the bottom),
 *  then position ASC. Stable. */
export function sortByTier<T extends Pick<Farmer, 'tier' | 'position'>>(farmers: T[]): T[] {
  return [...farmers].sort((a, b) => b.tier - a.tier || a.position - b.position);
}

/** True when the item was created within `days` (for the „Ново" card badge). */
export function isRecent(createdAt: string | null, days = 14, now: Date = new Date()): boolean {
  if (!createdAt) return false;
  return new Date(createdAt).getTime() >= now.getTime() - days * 86_400_000;
}
