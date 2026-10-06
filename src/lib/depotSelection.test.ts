import { describe, expect, it } from 'vitest';
import { pickDepot } from './shoppingUtils';
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

function product(id: string, depots: ProductDepotInfo[]): Product {
  return { id, title: `Product ${id}`, productDepotInfoList: depots };
}

function cartItem(p: Product, d: ProductDepotInfo): CartItem {
  return { product: p, selectedDepot: d, addedAt: new Date() };
}

describe('pickDepot', () => {
  it('sabitlenen şube geçerliyse onu seçer', () => {
    const cheap = depot({ marketAdi: 'A', depotId: 'a', price: 10 });
    const pinned = depot({ marketAdi: 'B', depotId: 'b', price: 30 });
    const p = product('1', [cheap, pinned]);
    // Sabitlenen daha pahalı olsa bile tercih edilir.
    expect(pickDepot(p, 'b', [])?.depotId).toBe('b');
  });

  it('sabitlenen şube yoksa en ucuzu seçer', () => {
    const cheap = depot({ marketAdi: 'A', depotId: 'a', price: 10 });
    const expensive = depot({ marketAdi: 'B', depotId: 'b', price: 30 });
    const p = product('1', [cheap, expensive]);
    expect(pickDepot(p, 'yok', [])?.depotId).toBe('a');
    expect(pickDepot(p, undefined, [])?.depotId).toBe('a');
  });

  it('eşit fiyatta sepette zaten olan depoyu tercih eder', () => {
    const dA = depot({ marketAdi: 'A', depotId: 'a', price: 10 });
    const dB = depot({ marketAdi: 'B', depotId: 'b', price: 10 });
    const p = product('2', [dA, dB]);
    const existing = [cartItem(product('x', [dB]), dB)];
    // Sabitleme yokken mevcut davranış korunur: sepetteki B seçilir.
    expect(pickDepot(p, undefined, existing)?.depotId).toBe('b');
  });

  it('fiyatı geçersiz şubeyi asla seçmez', () => {
    const zero = depot({ marketAdi: 'A', depotId: 'a', price: 0 });
    const nan = depot({ marketAdi: 'B', depotId: 'b', price: NaN });
    const valid = depot({ marketAdi: 'C', depotId: 'c', price: 15 });
    const p = product('1', [zero, nan, valid]);
    // Geçersiz fiyatlı şube sabitlense bile ona düşmez, geçerli en ucuzu seçer.
    expect(pickDepot(p, 'a', [])?.depotId).toBe('c');
    expect(pickDepot(p, 'b', [])?.depotId).toBe('c');
  });

  it('ürünün hiç geçerli deposu yoksa null döner', () => {
    const p = product('1', [depot({ marketAdi: 'A', depotId: 'a', price: -1 }), depot({ marketAdi: 'B', depotId: 'b', price: NaN })]);
    expect(pickDepot(p, 'a', [])).toBeNull();
    expect(pickDepot(p, undefined, [])).toBeNull();
  });
});
