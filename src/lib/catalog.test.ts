import { describe, it, expect } from 'vitest';
import { recent, sortByTier, catIdOf, categoriesFrom } from './catalog';
import type { Product, Subcategory } from './types';

const P = (id: string, createdAt: string | null, isActive = true) =>
  ({ id, createdAt, isActive }) as any;

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Продукт',
  slug: 'produkt',
  description: null,
  priceStotinki: 500,
  unit: 'бр.',
  weight: null,
  category: 'zelenchuci',
  tint: null,
  isActive: true,
  imageUrl: null,
  farmerId: null,
  subcategoryId: null,
  featured: false,
  createdAt: null,
  ...overrides,
});

const subcat = (overrides: Partial<Subcategory> = {}): Subcategory => ({
  id: 'sub1',
  name: 'Зеленчуци',
  description: null,
  tint: null,
  imageUrl: null,
  position: 0,
  createdAt: null,
  ...overrides,
});

describe('recent', () => {
  const now = new Date('2026-07-11T00:00:00Z');
  it('keeps only items inside the window, newest first', () => {
    const items = [
      P('old', '2026-06-01T00:00:00Z'),
      P('fresh', '2026-07-10T00:00:00Z'),
      P('mid', '2026-07-05T00:00:00Z'),
    ];
    expect(recent(items, 14, 1, now).map((p) => p.id)).toEqual(['fresh', 'mid']);
  });
  it('tops up to `min` with newest overall when the window is empty', () => {
    const items = [P('a', '2026-01-01T00:00:00Z'), P('b', '2026-02-01T00:00:00Z')];
    expect(recent(items, 14, 2, now).map((p) => p.id)).toEqual(['b', 'a']);
  });
  it('drops inactive items', () => {
    const items = [P('x', '2026-07-10T00:00:00Z', false), P('y', '2026-07-10T00:00:00Z')];
    expect(recent(items, 14, 8, now).map((p) => p.id)).toEqual(['y']);
  });
});

describe('sortByTier', () => {
  it('sorts tier desc, stable within a tier', () => {
    const fs = [
      { id: 'a', tier: 1, position: 0 },
      { id: 'b', tier: 3, position: 5 },
      { id: 'c', tier: 2, position: 1 },
    ] as any[];
    expect(sortByTier(fs).map((f) => f.id)).toEqual(['b', 'c', 'a']);
  });
  it('breaks tier ties by position asc', () => {
    const fs = [
      { id: 'a', tier: 2, position: 3 },
      { id: 'b', tier: 2, position: 1 },
    ] as any[];
    expect(sortByTier(fs).map((f) => f.id)).toEqual(['b', 'a']);
  });
});

describe('catIdOf — Кошници', () => {
  it('groups a bundle under "bundle" in free-text taxonomy mode (multiSubcat=false)', () => {
    const p = product({ category: 'bundle', subcategoryId: null });
    expect(catIdOf(p, false)).toBe('bundle');
  });

  it('groups a bundle under "bundle" in subcategory taxonomy mode, regardless of its subcategoryId', () => {
    // A basket is identified by category, not by whatever subcategory tree id it
    // happens to carry — it must NOT group under that subcategory.
    const p = product({ category: 'bundle', subcategoryId: 'sub1' });
    expect(catIdOf(p, true)).toBe('bundle');
  });
});

describe('categoriesFrom — Кошници (multiSubcat branch)', () => {
  const subcats = [subcat({ id: 'sub1', name: 'Зеленчуци' })];

  it('excludes bundles from the subcategory count they happen to carry', () => {
    const products = [
      product({ id: 'p1', category: 'zelenchuci', subcategoryId: 'sub1' }),
      // Same subcategoryId as p1, but it's a basket — must not inflate sub1's count.
      product({ id: 'p2', category: 'bundle', subcategoryId: 'sub1' }),
    ];
    const cats = categoriesFrom(products, subcats, true);
    const sub1 = cats.find((c) => c.id === 'sub1');
    expect(sub1?.count).toBe(1);
  });

  it('appends a synthetic "Кошници" category, counting every bundle regardless of subcategoryId', () => {
    const products = [
      product({ id: 'p1', category: 'zelenchuci', subcategoryId: 'sub1' }),
      product({ id: 'p2', category: 'bundle', subcategoryId: 'sub1' }),
      product({ id: 'p3', category: 'bundle', subcategoryId: null }),
    ];
    const cats = categoriesFrom(products, subcats, true);
    const bundleCat = cats.find((c) => c.id === 'bundle');
    expect(bundleCat).toMatchObject({
      id: 'bundle',
      name: 'Кошници',
      desc: 'Готови кошници с продукти от няколко фермери, на обща цена.',
      count: 2,
    });
  });

  it('does not append the synthetic "Кошници" category when there are no bundles', () => {
    const products = [product({ id: 'p1', category: 'zelenchuci', subcategoryId: 'sub1' })];
    const cats = categoriesFrom(products, subcats, true);
    expect(cats.find((c) => c.id === 'bundle')).toBeUndefined();
  });
});
