import { describe, expect, it } from 'vitest';
import { buildIngredientMatches, toProduct } from './ingredientSelection';
import type { SelectProductsProduct, SelectProductsSelection } from '@/services/llmService';

const product = (id: string, title: string, price = 10): SelectProductsProduct => ({
  id, title, price, productDepotInfoList: [{ depotId: 'a', depotName: 'A', marketAdi: 'A', price, unitPrice: '10' }],
});
const answer = (
  ingredient: string,
  raw: SelectProductsProduct | null,
  overrides: Partial<SelectProductsSelection> = {},
  alternatives: SelectProductsProduct[] = []
): SelectProductsSelection => ({
  success: true, searchedIngredient: ingredient, matchType: 'direct', reasoning: 'Uygun ürün',
  product: raw, alternatives, ...overrides,
});

describe('toProduct', () => {
  it('rejects missing identity and products without a valid depot price', () => {
    expect(toProduct({ title: 'Domates' })).toBeNull();
    expect(toProduct({ id: 'x', title: 'Domates', productDepotInfoList: [] })).toBeNull();
    expect(toProduct({ id: 'x', title: 'Domates', productDepotInfoList: [{ depotId: 'a', depotName: 'A', marketAdi: 'A', price: 0, unitPrice: '0' }] })).toBeNull();
  });
  it('drops invalid depot prices but keeps the product', () => {
    const result = toProduct({
      id: 'x', title: 'Domates',
      productDepotInfoList: [
        { depotId: 'a', depotName: 'A', marketAdi: 'A', price: 12, unitPrice: '12' },
        { depotId: 'b', depotName: 'B', marketAdi: 'B', price: Number.NaN, unitPrice: '-' },
      ],
    });
    expect(result?.productDepotInfoList.map(d => d.depotId)).toEqual(['a']);
  });
});

describe('buildIngredientMatches (sunucu-taraflı seçim)', () => {
  it('takes the server selection directly, without re-matching by title', () => {
    const matches = buildIngredientMatches(['domates'], [
      answer('domates', product('t2', 'Domates 500 g'), {}, [product('t1', 'Domates 1 kg'), product('t2', 'Domates 500 g')]),
    ]);
    // Başlık birebir eşleşmese de sunucunun doğruladığı kimlik seçilir.
    expect(matches[0].product?.id).toBe('t2');
    expect(matches[0].source).toBe('ai');
    expect(matches[0].candidates.map(c => c.id)).toEqual(['t1', 't2']);
  });
  it('never auto-selects an unsafe answer (failed, alternative match, or identity-less)', () => {
    for (const selection of [
      answer('süt', product('s1', 'Süt 1 l'), { success: false }),
      answer('süt', product('s1', 'Süt 1 l'), { matchType: 'alternative' }),
      answer('süt', { title: 'Süt 1 l' } as SelectProductsProduct),
    ]) {
      expect(buildIngredientMatches(['süt'], [selection])[0].product).toBeUndefined();
    }
  });
  it('keeps unmatched ingredients visible with their alternatives', () => {
    const matches = buildIngredientMatches(['domates', 'süt', 'tuz'], [
      answer('domates', product('t1', 'Domates 1 kg')),
      answer('süt', null, { success: false }, [product('s1', 'Süt 1 l')]),
    ]);
    expect(matches.filter(m => !m.product).map(m => m.ingredient)).toEqual(['süt', 'tuz']);
    expect(matches[1].candidates.map(c => c.id)).toEqual(['s1']);
    expect(matches[2].candidates).toEqual([]);
  });
  it('always exposes the selected product among the candidates', () => {
    // Sunucu seçileni alternatif listesinde göndermezse bile kullanıcı onu görebilmeli.
    const matches = buildIngredientMatches(['süt'], [answer('süt', product('s1', 'Süt 1 l'), {}, [product('s2', 'Süt 2 l')])]);
    expect(matches[0].candidates.map(c => c.id)).toEqual(['s1', 's2']);
  });
});
