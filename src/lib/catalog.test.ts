import { describe, it, expect } from 'vitest';
import { recent, sortByTier } from './catalog';

const P = (id: string, createdAt: string | null, isActive = true) =>
  ({ id, createdAt, isActive }) as any;

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
