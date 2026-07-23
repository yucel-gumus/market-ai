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
    depotId: partial.depotId ?? 'd1',
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
    expect(opt.totalSavings).toBe(20);
    expect(opt.marketCount).toBe(1);
  });
});
