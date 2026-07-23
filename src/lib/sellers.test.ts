import { describe, it, expect } from 'vitest';
import { distinctSellers } from './sellers';
import type { CartItem } from '../components/cart/cart-provider';

const line = (over: Partial<CartItem>): CartItem => ({
  id: 'x',
  name: 'Продукт',
  price: 1,
  qty: 1,
  ...over,
});

describe('distinctSellers', () => {
  it('dedups multiple lines from the same farmer', () => {
    const items = [
      line({ id: 'a', farmerId: 'f1', farmerName: 'Иван' }),
      line({ id: 'b', farmerId: 'f1', farmerName: 'Иван' }),
    ];
    expect(distinctSellers(items)).toEqual([{ id: 'f1', name: 'Иван' }]);
  });

  it('returns one entry per distinct farmer, in first-seen order', () => {
    const items = [
      line({ id: 'a', farmerId: 'f1', farmerName: 'Иван' }),
      line({ id: 'b', farmerId: 'f2', farmerName: 'Мария' }),
    ];
    expect(distinctSellers(items)).toEqual([
      { id: 'f1', name: 'Иван' },
      { id: 'f2', name: 'Мария' },
    ]);
  });

  it('skips unstamped lines (no farmerId)', () => {
    const items = [line({ id: 'a' }), line({ id: 'b', farmerId: 'f1', farmerName: 'Иван' })];
    expect(distinctSellers(items)).toEqual([{ id: 'f1', name: 'Иван' }]);
  });

  it('returns empty when no lines are stamped', () => {
    expect(distinctSellers([line({ id: 'a' })])).toEqual([]);
  });
});
