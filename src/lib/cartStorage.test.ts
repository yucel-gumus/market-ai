import { describe, expect, it } from 'vitest';
import { restoreCart } from './cartStorage';
const product = { id: 'p', title: 'Süt', productDepotInfoList: [{ depotId: 'a', depotName: 'A', marketAdi: 'A', price: 10, unitPrice: '10' }] };
describe('cart migration', () => {
  it('restores an old cart with one unit without inventing a price check time', () => {
    const [item] = restoreCart([{ product, addedAt: '2026-10-01T10:00:00Z' }]);
    expect(item.quantity).toBe(1);
    expect(item.product.priceCheckedAt).toBeUndefined();
    expect(item.addedAt.toISOString()).toBe('2026-10-01T10:00:00.000Z');
  });
  it('rejects corrupted and invalid-price entries', () => {
    expect(restoreCart({})).toEqual([]);
    expect(restoreCart([null, {}, { product: { ...product, productDepotInfoList: [{ price: -1 }] } }])).toEqual([]);
  });
});
