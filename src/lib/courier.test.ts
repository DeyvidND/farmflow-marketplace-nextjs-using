import { describe, it, expect } from 'vitest';
import { courierBlockers, CARRIER_METHODS } from './courier';
import type { CartItem } from '../components/cart/cart-provider';
import type { Product } from './types';

const line = (over: Partial<CartItem>): CartItem => ({
  id: 'x',
  name: 'Продукт',
  price: 1,
  qty: 1,
  ...over,
});

const product = (over: Partial<Product> & { id: string }): Product => ({
  name: over.id,
  slug: null,
  description: null,
  priceStotinki: 100,
  unit: 'бр.',
  weight: null,
  category: null,
  tint: null,
  isActive: true,
  imageUrl: null,
  farmerId: null,
  subcategoryId: null,
  featured: false,
  createdAt: null,
  ...over,
});

describe('CARRIER_METHODS', () => {
  it('contains exactly the carrier-shipping delivery methods', () => {
    expect(CARRIER_METHODS).toEqual(new Set(['econt', 'econt_address', 'courier']));
  });
});

describe('courierBlockers', () => {
  it('is empty for a cart with no fragile products or baskets', () => {
    const items = [line({ id: 'a', name: 'Домати' })];
    const byId = new Map([['a', product({ id: 'a' })]]);
    expect(courierBlockers(items, byId)).toEqual({ fragileNames: [], hasBasket: false });
  });

  it('flags courierDisabled=true product names as fragile', () => {
    const items = [line({ id: 'a', name: 'Яйца' }), line({ id: 'b', name: 'Мляко' })];
    const byId = new Map([
      ['a', product({ id: 'a', courierDisabled: true })],
      ['b', product({ id: 'b', courierDisabled: false })],
    ]);
    expect(courierBlockers(items, byId)).toEqual({ fragileNames: ['Яйца'], hasBasket: false });
  });

  it('flags hasBasket=true when any line is a кошница (category === "bundle")', () => {
    const items = [line({ id: 'a', name: 'Кошница' })];
    const byId = new Map([['a', product({ id: 'a', category: 'bundle' })]]);
    expect(courierBlockers(items, byId)).toEqual({ fragileNames: [], hasBasket: true });
  });

  it('resolves variant line ids by their BASE product id', () => {
    const items = [line({ id: 'a:small', name: 'Мед (малък)' })];
    const byId = new Map([['a', product({ id: 'a', courierDisabled: true })]]);
    expect(courierBlockers(items, byId)).toEqual({ fragileNames: ['Мед (малък)'], hasBasket: false });
  });

  it('ignores cart lines whose product id is not found (deleted/renamed since add)', () => {
    const items = [line({ id: 'missing', name: 'Изчезнал продукт' })];
    const byId = new Map<string, Product>();
    expect(() => courierBlockers(items, byId)).not.toThrow();
    expect(courierBlockers(items, byId)).toEqual({ fragileNames: [], hasBasket: false });
  });

  it('collects multiple fragile names and a basket together', () => {
    const items = [
      line({ id: 'a', name: 'Яйца' }),
      line({ id: 'b', name: 'Кошница' }),
      line({ id: 'c', name: 'Домати' }),
      line({ id: 'd', name: 'Мляко' }),
    ];
    const byId = new Map([
      ['a', product({ id: 'a', courierDisabled: true })],
      ['b', product({ id: 'b', category: 'bundle' })],
      ['c', product({ id: 'c' })],
      ['d', product({ id: 'd', courierDisabled: true })],
    ]);
    expect(courierBlockers(items, byId)).toEqual({
      fragileNames: ['Яйца', 'Мляко'],
      hasBasket: true,
    });
  });
});
