import { describe, expect, it } from 'vitest';
import { branchForProduct } from './branchSelection';
import type { ParsedAddress, Product, ProductDepotInfo } from '@/types';

const depot = (over: Partial<ProductDepotInfo> = {}): ProductDepotInfo =>
  ({ depotId: 'sok-1', depotName: 'Kirazlıtepe', marketAdi: 'sok', price: 29.9, ...over }) as ProductDepotInfo;

const product = (depots: ProductDepotInfo[]): Product =>
  ({ id: 'p1', title: 'Kuru Soğan Dökme 1 Kg', productDepotInfoList: depots }) as Product;

const address: ParsedAddress = {
  fullAddress: 'Kirazlıtepe, Üsküdar, İstanbul', street: '', neighborhood: 'Kirazlıtepe',
  district: 'Üsküdar', city: 'İstanbul', latitude: 41.0264, longitude: 29.043,
  additionalInfo: '',
};

describe('branchForProduct', () => {
  it('şube eklemez — ürün kullanıcının seçtiği markette zaten varsa', () => {
    expect(branchForProduct(product([depot({ depotId: 'bim-1653' })]), ['bim-1653', 'a101-1'])).toBeNull();
  });

  it('seçili marketlerde olmayan ürün için taşıyan şubeyi üretir', () => {
    const branch = branchForProduct(product([depot()]), ['bim-1653', 'a101-1'], address);
    expect(branch?.id).toBe('sok-1');
    expect(branch?.brand).toBe('sok');
    expect(branch?.distance).toBeGreaterThanOrEqual(0);
  });

  it('adres yoksa mesafeyi 0 bırakır (uydurmaz)', () => {
    expect(branchForProduct(product([depot()]), ['bim-1653'])?.distance).toBe(0);
  });

  it('geçerli fiyatı olmayan depoyu market saymaz', () => {
    expect(branchForProduct(product([depot({ price: 0 })]), ['bim-1653'])).toBeNull();
    expect(branchForProduct(product([depot({ price: NaN })]), ['bim-1653'])).toBeNull();
  });

  it('depo listesi boşsa null döner', () => {
    expect(branchForProduct(product([]), ['bim-1653'], address)).toBeNull();
  });
});
