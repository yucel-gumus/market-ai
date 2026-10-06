import { describe, expect, it } from 'vitest';
import { planCartChanges } from '@/lib/applyConsolidation';
import type { ConsolidationPlan, Product } from '@/types';

const product = (id: string, title: string): Product => ({ id, title, productDepotInfoList: [] });

const plan = (items: { ingredient: string; product: Product; depotId: string }[]): ConsolidationPlan => ({
  branches: [{ depotId: 'd-1', marketAdi: 'bim' }], total: 100, delta: 5,
  items: items.map(item => ({ ...item, price: 10 })),
  switches: [],
});

describe('planCartChanges', () => {
  it('aynı ürün başka şubedeyse yalnızca şubeyi sabitler', () => {
    const p = product('p-1', 'Soğan 1 Kg');
    const changes = planCartChanges(plan([{ ingredient: 'kuru soğan', product: p, depotId: 'd-9' }]),
      [{ ingredient: 'kuru soğan', product: p, quantity: 2 }]);
    expect(changes.depotUpdates).toEqual([{ productId: 'p-1', depotId: 'd-9' }]);
    expect(changes.adds).toEqual([]);
    expect(changes.removes).toEqual([]);
  });

  it('farklı ürün seçildiyse eskiyi çıkarır, yenisini adetle ekler ve değişimi bildirir', () => {
    const changes = planCartChanges(plan([{ ingredient: 'tavuk göğsü', product: product('p-2', 'Piliç Göğüs'), depotId: 'd-3' }]),
      [{ ingredient: 'tavuk göğsü', product: product('p-1', 'Tavuk But'), quantity: 3 }]);
    expect(changes.removes).toEqual(['p-1']);
    expect(changes.adds).toEqual([{ product: expect.objectContaining({ id: 'p-2' }), depotId: 'd-3', quantity: 3 }]);
    expect(changes.switches).toEqual([{ ingredient: 'tavuk göğsü', fromTitle: 'Tavuk But', toTitle: 'Piliç Göğüs' }]);
  });

  it('sepette adet yoksa 1 kabul eder', () => {
    const changes = planCartChanges(plan([{ ingredient: 'tuz', product: product('p-5', 'Tuz'), depotId: 'd-1' }]), [{ ingredient: 'tuz' }]);
    expect(changes.adds[0].quantity).toBe(1);
    expect(changes.removes).toEqual([]);
  });

  it('sepette karşılığı olmayan plan kalemini atlar', () => {
    const changes = planCartChanges(plan([{ ingredient: 'yok', product: product('p-9', 'Yok'), depotId: 'd-1' }]), []);
    expect(changes).toEqual({ removes: [], adds: [], depotUpdates: [], switches: [], productIds: [] });
  });

  it('plan kapsamındaki ürün kimliklerini döndürür', () => {
    const changes = planCartChanges(plan([
      { ingredient: 'a', product: product('p-1', 'A'), depotId: 'd-1' },
      { ingredient: 'b', product: product('p-2', 'B'), depotId: 'd-1' },
    ]), [{ ingredient: 'a', product: product('p-1', 'A') }, { ingredient: 'b', product: product('p-7', 'B eski') }]);
    expect(changes.productIds).toEqual(['p-1', 'p-2']);
    expect(changes.removes).toEqual(['p-7']);
  });
});
