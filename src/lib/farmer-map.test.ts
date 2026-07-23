import { describe, it, expect } from 'vitest';
import { resolveMapPoints } from './farmer-map';
import type { Farmer } from './types';

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
