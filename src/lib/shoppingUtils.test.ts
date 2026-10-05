import { describe, expect, it } from 'vitest';
import {
  calculateOptimization,
  findOptimalDepot,
  optimizeRoute,
  groupItemsByMarket,
} from './shoppingUtils';
import type { CartItem, Product, ProductDepotInfo } from '@/types';

function depot(
  partial: Partial<ProductDepotInfo> & Pick<ProductDepotInfo, 'marketAdi' | 'price'>
): ProductDepotInfo {
  return {
    depotId: partial.depotId ?? partial.marketAdi,
    depotName: partial.depotName ?? 'Depot',
    unitPrice: partial.unitPrice ?? '1',
    latitude: partial.latitude,
    longitude: partial.longitude,
    ...partial,
  };
}

function product(
  id: string,
  depots: ProductDepotInfo[]
): Product {
  return {
    id,
    title: `Product ${id}`,
    productDepotInfoList: depots,
  };
}

function cartItem(p: Product, d: ProductDepotInfo): CartItem {
  return { product: p, selectedDepot: d, addedAt: new Date() };
}

describe('findOptimalDepot', () => {
  it('returns null for empty depot list', () => {
    expect(findOptimalDepot(product('1', []), [])).toBeNull();
  });

  it('picks cheapest depot', () => {
    const p = product('1', [
      depot({ marketAdi: 'A', price: 20 }),
      depot({ marketAdi: 'B', price: 10 }),
    ]);
    expect(findOptimalDepot(p, [])?.marketAdi).toBe('B');
  });

  it('prefers market already in cart when prices equal', () => {
    const dA = depot({ marketAdi: 'A', price: 10 });
    const dB = depot({ marketAdi: 'B', price: 10 });
    const p = product('2', [dA, dB]);
    const existing = [cartItem(product('x', [dA]), dA)];
    expect(findOptimalDepot(p, existing)?.marketAdi).toBe('A');
  });
});

describe('optimizeRoute', () => {
  it('orders markets by nearest-neighbor from user', () => {
    const far = depot({
      marketAdi: 'Far',
      price: 1,
      latitude: 41.1,
      longitude: 29.1,
    });
    const near = depot({
      marketAdi: 'Near',
      price: 1,
      latitude: 41.01,
      longitude: 28.99,
    });

    const groups = groupItemsByMarket([
      cartItem(product('1', [far]), far),
      cartItem(product('2', [near]), near),
    ]);

    const route = optimizeRoute(41.0, 29.0, groups);
    expect(route).toHaveLength(2);
    expect(route[0].marketName).toBe('Near');
    expect(route[1].marketName).toBe('Far');
    expect(route[0].distanceFromPrevious).toBeGreaterThan(0);
  });
});

describe('calculateOptimization', () => {
  it('computes total cost and savings', () => {
    const cheap = depot({ marketAdi: 'A', price: 10 });
    const expensiveOption = depot({ marketAdi: 'B', price: 30 });
    const p = product('1', [cheap, expensiveOption]);
    const opt = calculateOptimization([cartItem(p, cheap)]);
    expect(opt.totalCost).toBe(10);
    expect(opt.totalSavings).toBe(0);
    expect(opt.singleStoreCost).toBe(10);
    expect(opt.marketCount).toBe(1);
  });
});

describe('shopping scenarios', () => {
  it('keeps two branches of the same chain separate', () => {
    const a = depot({ marketAdi: 'Migros', depotId: 'm1', price: 10 });
    const b = depot({ marketAdi: 'Migros', depotId: 'm2', price: 20 });
    const opt = calculateOptimization([cartItem(product('1', [a]), a), cartItem(product('2', [b]), b)]);
    expect(opt.marketCount).toBe(2);
    expect(opt.marketGroups.map(g => g.depotKey)).toEqual(['m1', 'm2']);
    expect(opt.singleStoreCost).toBeUndefined();
    expect(opt.totalSavings).toBeUndefined();
  });

  it('compares an identical basket with quantity against its cheapest complete single branch', () => {
    const a1 = depot({ marketAdi: 'A', price: 10 });
    const b1 = depot({ marketAdi: 'B', price: 15 });
    const a2 = depot({ marketAdi: 'A', price: 30 });
    const b2 = depot({ marketAdi: 'B', price: 10 });
    const items = [{ ...cartItem(product('1', [a1, b1]), a1), quantity: 3 }, cartItem(product('2', [a2, b2]), b2)];
    const opt = calculateOptimization(items);
    expect(opt.totalCost).toBe(40);
    expect(opt.singleStoreCost).toBe(55);
    expect(opt.totalSavings).toBe(15);
    const single = calculateOptimization(items, 'single');
    expect(single.totalCost).toBe(55);
    expect(single.marketCount).toBe(1);
    expect(single.marketGroups[0].depotKey).toBe('B');
  });

  it('finds the best pair rather than only retaining independently cheapest depots', () => {
    const p1 = product('1', [depot({ marketAdi: 'A', price: 1 }), depot({ marketAdi: 'B', price: 4 })]);
    const p2 = product('2', [depot({ marketAdi: 'B', price: 1 }), depot({ marketAdi: 'A', price: 3 })]);
    const p3 = product('3', [depot({ marketAdi: 'C', price: 1 }), depot({ marketAdi: 'B', price: 2 })]);
    const items = [p1, p2, p3].map(p => cartItem(p, p.productDepotInfoList[0]));
    const opt = calculateOptimization(items, 'two');
    expect(opt.totalCost).toBe(4);
    expect(opt.marketCount).toBe(2);
    expect(opt.options?.find(o => o.mode === 'cheapest')?.totalCost).toBe(3);
    expect(opt.options?.find(o => o.mode === 'single')?.totalCost).toBe(7);
  });

  it('does not drop items to meet an impossible store limit', () => {
    const items = ['A', 'B', 'C'].map((name, i) => {
      const d = depot({ marketAdi: name, price: 10 });
      return cartItem(product(String(i), [d]), d);
    });
    const opt = calculateOptimization(items, 'two');
    expect(opt.mode).toBe('cheapest');
    expect(opt.marketCount).toBe(3);
    expect(opt.options?.find(o => o.mode === 'two')?.feasible).toBe(false);
    expect(opt.totalCost).toBe(30);
  });

  it('does not generate a (0, 0) destination for missing coordinates', () => {
    const d = depot({ marketAdi: 'A', price: 10 });
    expect(optimizeRoute(41, 29, groupItemsByMarket([cartItem(product('1', [d]), d)]))).toEqual([]);
  });

  it('rejects zero, negative and missing prices', () => {
    const p = product('1', [depot({ marketAdi: 'A', price: -1 }), depot({ marketAdi: 'B', price: 0 }), depot({ marketAdi: 'C', price: NaN })]);
    expect(findOptimalDepot(p, [])).toBeNull();
  });

  it('uses the oldest known price check and flags legacy records', () => {
    const d = depot({ marketAdi: 'A', price: 10 });
    const a = { ...product('1', [d]), priceCheckedAt: '2026-10-01T12:00:00Z' };
    const b = { ...product('2', [d]), priceCheckedAt: '2026-10-01T10:00:00Z' };
    const c = product('3', [d]);
    const opt = calculateOptimization([a, b, c].map(p => cartItem(p, d)));
    expect(opt.oldestPriceCheck).toBe(b.priceCheckedAt);
    expect(opt.hasUnknownPriceChecks).toBe(true);
  });

  it('calculates additional travel only when both baskets have all coordinates', () => {
    const a1 = depot({ marketAdi: 'A', price: 10, latitude: 41.01, longitude: 29 });
    const b1 = depot({ marketAdi: 'B', price: 15, latitude: 41.1, longitude: 29 });
    const a2 = { ...a1, price: 20 };
    const b2 = { ...b1, price: 5 };
    const items = [cartItem(product('1', [a1, b1]), a1), cartItem(product('2', [a2, b2]), b2)];
    const opt = calculateOptimization(items, 'two', { latitude: 41, longitude: 29 });
    expect(opt.extraWalkMinutes).toBeCloseTo(0, 8); // B alone costs 20; same endpoint as A then B.
    const unknown = items.map(item => ({ ...item, product: { ...item.product, productDepotInfoList: item.product.productDepotInfoList.map(d => ({ ...d, latitude: undefined })) } }));
    expect(calculateOptimization(unknown, 'two', { latitude: 41, longitude: 29 }).extraWalkMinutes).toBeUndefined();
  });
});

describe('bounded-store optimizer versus exhaustive assignments', () => {
  it('matches the independent minimum for single, two and unrestricted stores', () => {
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let scenario = 0; scenario < 20; scenario++) {
      const items = Array.from({ length: 4 }, (_, index) => {
        const depots = ['A', 'B', 'C', 'D'].filter(() => random() > .25)
          .map(name => depot({ marketAdi: name, price: Math.floor(random() * 30) + 1 }));
        if (!depots.length) depots.push(depot({ marketAdi: 'A', price: 10 }));
        return { ...cartItem(product(String(index), depots), depots[0]), quantity: index + 1 };
      });
      const minimum: Record<number, number> = { 1: Infinity, 2: Infinity, 4: Infinity };
      const enumerate = (index: number, total: number, stores: Set<string>) => {
        if (index === items.length) {
          for (const limit of [1, 2, 4]) if (stores.size <= limit) minimum[limit] = Math.min(minimum[limit], total);
          return;
        }
        for (const d of items[index].product.productDepotInfoList) {
          enumerate(index + 1, total + d.price * items[index].quantity, new Set([...stores, d.depotId]));
        }
      };
      enumerate(0, 0, new Set());
      const options = calculateOptimization(items).options!;
      for (const [index, limit] of [1, 2, 4].entries()) {
        expect(options[index].feasible).toBe(Number.isFinite(minimum[limit]));
        if (options[index].feasible) {
          expect(options[index].totalCost).toBe(minimum[limit]);
          expect(options[index].items).toHaveLength(items.length);
          expect(options[index].marketCount).toBeLessThanOrEqual(limit);
        }
      }
    }
  });
});
