import { describe, it, expect } from 'vitest';
import {
  otherProductsStotinki,
  companionSatisfied,
  companionShortfall,
  unsatisfiedCompanions,
  companionMessage,
} from './companion';
import type { CartItem } from '../components/cart/cart-provider';

const line = (over: Partial<CartItem>): CartItem => ({
  id: 'x',
  name: 'Продукт',
  price: 1,
  qty: 1,
  ...over,
});

describe('otherProductsStotinki', () => {
  it('rounds each line to cents before summing (float-drift regression)', () => {
    // 0.01 + 4.02 + 0.47 as raw floats = 4.4999999999999996 → *100 rounds to
    // 449.999... and would wrongly fail a >=450 comparison. Rounding each
    // line to cents first (1 + 402 + 47 = 450) fixes it.
    const items = [
      line({ id: 'a', price: 0.01 }),
      line({ id: 'b', price: 4.02 }),
      line({ id: 'c', price: 0.47 }),
    ];
    expect(otherProductsStotinki(items, 'companion')).toBe(450);
  });

  it('excludes variant lines of the flagged product by BASE id, not the raw line id', () => {
    const items = [
      line({ id: 'flagged:small', price: 3, qty: 2 }), // same product, different variant
      line({ id: 'flagged:large', price: 5 }),
      line({ id: 'other', price: 2 }),
    ];
    expect(otherProductsStotinki(items, 'flagged')).toBe(200); // only "other" counts
  });

  it('multiplies by quantity', () => {
    const items = [line({ id: 'other', price: 1.5, qty: 3 })];
    expect(otherProductsStotinki(items, 'flagged')).toBe(450);
  });
});

describe('companionSatisfied', () => {
  it('threshold rule: satisfied once other lines total >= min (float-rounding regression)', () => {
    const items = [
      line({ id: 'a', price: 0.01 }),
      line({ id: 'b', price: 4.02 }),
      line({ id: 'c', price: 0.47 }),
    ];
    expect(companionSatisfied('companion', 450, items)).toBe(true);
  });

  it('threshold rule: unsatisfied when below the min', () => {
    const items = [line({ id: 'a', price: 1 })];
    expect(companionSatisfied('companion', 450, items)).toBe(false);
  });

  it('null min: any single other-product line satisfies', () => {
    const items = [line({ id: 'other', price: 0.01 })];
    expect(companionSatisfied('flagged', null, items)).toBe(true);
  });

  it('zero min: any single other-product line satisfies', () => {
    const items = [line({ id: 'other', price: 0.01 })];
    expect(companionSatisfied('flagged', 0, items)).toBe(true);
  });

  it('null min: extra units/variants of the SAME product do not count', () => {
    const items = [line({ id: 'flagged:small', price: 3 }), line({ id: 'flagged:large', price: 5 })];
    expect(companionSatisfied('flagged', null, items)).toBe(false);
  });
});

describe('companionShortfall', () => {
  it('is 0 once satisfied', () => {
    const items = [line({ id: 'other', price: 5 })];
    expect(companionShortfall('flagged', 450, items)).toBe(0);
  });

  it('is the remaining euros needed under a threshold', () => {
    const items = [line({ id: 'other', price: 2 })]; // 200 stotinki have
    expect(companionShortfall('flagged', 450, items)).toBe(2.5); // (450-200)/100
  });

  it('is 0 for the "any other product" rule even when unsatisfied', () => {
    expect(companionShortfall('flagged', null, [])).toBe(0);
  });
});

describe('unsatisfiedCompanions', () => {
  it('returns only requiresCompanion lines whose rule is unmet', () => {
    const items = [
      line({ id: 'flagged', requiresCompanion: true, companionMinStotinki: 450 }),
      line({ id: 'other', price: 1 }),
    ];
    expect(unsatisfiedCompanions(items).map((i) => i.id)).toEqual(['flagged']);
  });

  it('drops a companion line once its rule is satisfied', () => {
    const items = [
      line({ id: 'flagged', requiresCompanion: true, companionMinStotinki: 450 }),
      line({ id: 'other', price: 5 }),
    ];
    expect(unsatisfiedCompanions(items)).toEqual([]);
  });

  it('ignores lines not flagged requiresCompanion', () => {
    const items = [line({ id: 'plain' })];
    expect(unsatisfiedCompanions(items)).toEqual([]);
  });
});

describe('companionMessage', () => {
  it('threshold copy includes the formatted euro minimum', () => {
    const item = line({ name: 'Мед', requiresCompanion: true, companionMinStotinki: 450 });
    expect(companionMessage(item)).toBe(
      '„Мед“ не се продава самостоятелно — добавете други продукти на обща стойност поне 4,50 €.',
    );
  });

  it('generic copy when there is no minimum', () => {
    const item = line({ name: 'Мед', requiresCompanion: true, companionMinStotinki: null });
    expect(companionMessage(item)).toBe(
      '„Мед“ не се продава самостоятелно — добавете още един продукт по избор.',
    );
  });
});
