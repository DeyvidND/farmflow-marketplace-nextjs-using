import { describe, it, expect } from 'vitest';
import { resolveMapPoints, matchFarmers } from './farmer-map';
import type { Farmer, Product } from './types';

const F = (over: Partial<Farmer> & { id: string; name: string }): Farmer =>
  ({
    role: null,
    bio: null,
    phone: null,
    email: null,
    since: null,
    city: null,
    tint: null,
    imageUrl: null,
    position: 0,
    tier: 1,
    createdAt: null,
    lat: null,
    lng: null,
    ...over,
  }) as Farmer;

const P = (over: Partial<Product> & { id: string; name: string; farmerId: string }): Product =>
  ({
    slug: null,
    description: null,
    priceStotinki: 100,
    unit: 'бр.',
    weight: null,
    category: 'zelenchuci',
    tint: null,
    isActive: true,
    imageUrl: null,
    subcategoryId: null,
    featured: false,
    createdAt: null,
    ...over,
  }) as Product;

describe('resolveMapPoints', () => {
  it('keeps only farmers with both lat and lng set', () => {
    const farmers = [
      F({ id: 'a', name: 'Иван Петров', lat: 42.6, lng: 23.3 }),
      F({ id: 'b', name: 'Без координати' }),
      F({ id: 'c', name: 'Само lat', lat: 42.1 }),
      F({ id: 'd', name: 'Само lng', lng: 23.9 }),
    ];
    const slugs = new Map<string, string>([
      ['a', 'ivan-petrov'],
      ['b', 'bez-koordinati'],
      ['c', 'samo-lat'],
      ['d', 'samo-lng'],
    ]);
    expect(resolveMapPoints(farmers, slugs).map((p) => p.name)).toEqual(['Иван Петров']);
  });

  it('falls back village to empty string when city is null/undefined', () => {
    const farmers = [
      F({ id: 'a', name: 'А', lat: 1, lng: 1, city: null }),
      F({ id: 'b', name: 'Б', lat: 2, lng: 2, city: undefined }),
      F({ id: 'c', name: 'В', lat: 3, lng: 3, city: 'Варна' }),
    ];
    const slugs = new Map<string, string>();
    expect(resolveMapPoints(farmers, slugs).map((p) => p.village)).toEqual(['', '', 'Варна']);
  });

  it('resolves slug from the slug map, null-safe when the farmer is missing from it', () => {
    const farmers = [
      F({ id: 'a', name: 'А', lat: 1, lng: 1 }),
      F({ id: 'b', name: 'Б', lat: 2, lng: 2 }),
    ];
    const slugs = new Map<string, string>([['a', 'a-slug']]);
    const points = resolveMapPoints(farmers, slugs);
    expect(points.find((p) => p.name === 'А')?.slug).toBe('a-slug');
    expect(points.find((p) => p.name === 'Б')?.slug).toBeNull();
  });

  it('maps lat/lng straight through', () => {
    const farmers = [F({ id: 'a', name: 'А', lat: 42.698, lng: 23.319 })];
    const slugs = new Map<string, string>();
    expect(resolveMapPoints(farmers, slugs)[0]).toMatchObject({ lat: 42.698, lng: 23.319 });
  });

  it('returns an empty array for an empty farmer list', () => {
    expect(resolveMapPoints([], new Map())).toEqual([]);
  });
});

describe('matchFarmers', () => {
  const farmers = [
    F({ id: 'a', name: 'Иван Петров', role: 'Зеленчукопроизводител', bio: 'Отглеждам домати от години.' }),
    F({ id: 'b', name: 'Мария Georgieva', role: null, bio: null }),
    F({ id: 'c', name: 'Без продукти', role: null, bio: null }),
  ];
  const products = [
    P({ id: 'p1', name: 'Домати', farmerId: 'a', category: 'zelenchuci' }),
    P({ id: 'p2', name: 'Краставици', farmerId: 'a', category: 'zelenchuci' }),
    P({ id: 'p3', name: 'Мед манов', farmerId: 'b', category: 'med' }),
  ];

  it('with empty q and no cats, matches every farmer', () => {
    expect(matchFarmers(farmers, products, {}).map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('matches by q against a product name, not just the farmer\'s own fields', () => {
    const result = matchFarmers(farmers, products, { q: 'краставиц' });
    expect(result.map((f) => f.id)).toEqual(['a']);
  });

  it('matches by q against the farmer name/role/bio, case-insensitive', () => {
    expect(matchFarmers(farmers, products, { q: 'ИВАН' }).map((f) => f.id)).toEqual(['a']);
    expect(matchFarmers(farmers, products, { q: 'зеленчукопроизводител' }).map((f) => f.id)).toEqual(['a']);
    expect(matchFarmers(farmers, products, { q: 'домати от години' }).map((f) => f.id)).toEqual(['a']);
  });

  it('cats matches when ANY of the farmer\'s products falls in the set (OR semantics)', () => {
    const result = matchFarmers(farmers, products, { cats: new Set(['med']) });
    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('a farmer with no matching products (or no products at all) is excluded once cats is non-empty', () => {
    const result = matchFarmers(farmers, products, { cats: new Set(['bundle']) });
    expect(result).toEqual([]);
  });

  it('combines q and cats with AND — both must match', () => {
    const result = matchFarmers(farmers, products, { q: 'мед', cats: new Set(['zelenchuci']) });
    expect(result).toEqual([]);
    expect(matchFarmers(farmers, products, { q: 'мед', cats: new Set(['med']) }).map((f) => f.id)).toEqual(['b']);
  });
});
