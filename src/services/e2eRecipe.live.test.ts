import { describe, it, expect } from 'vitest';
import apiClient from '@/lib/axios';
import type { Market } from '@/types';

/**
 * Release gate: gerçek Gemini + gerçek marketfiyati + sunucu-taraflı seçim sözleşmesi.
 *   MARKET_LIVE_TEST=1 MARKET_LIVE_BASE_URL=http://localhost:3000 npx vitest run src/services/e2eRecipe.live.test.ts
 * Model çağrısı yapar (ücretli). Varsayılan olarak atlanır.
 */
const BASE = process.env.MARKET_LIVE_BASE_URL || 'http://localhost:3000';

const proxy = async (path: string, body: unknown) => {
  const res = await fetch(`${BASE}/api/ai-page${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
};

describe.skipIf(process.env.MARKET_LIVE_TEST !== '1')('E2E tarif → sunucu-taraflı seçim', () => {
  it('seçili şubelerden fiyatlı ürünler seçer ve şube dışına çıkmaz', async () => {
    apiClient.defaults.baseURL = `${BASE}/api`;
    const geo = { latitude: 41.0265, longitude: 29.0154, distance: 3 };
    const { data } = await apiClient.post<{ success: boolean; data: Market[] }>('/search-markets', geo);
    const depots = data.data.slice(0, 10).map(m => m.id);
    expect(depots.length).toBeGreaterThan(0);

    const recipe = 'mercimek çorbası';
    const list = await proxy('/recipe-list', { recipe_name: recipe });
    const ingredients: string[] = (list.ingredients ?? []).slice(0, 8);
    expect(ingredients.length).toBeGreaterThan(2);

    const result = await proxy('/select-products', {
      recipe_name: `${recipe} (4 kişilik)`,
      ingredients: ingredients.join(', '),
      ...geo,
      depots,
    });
    const selections = result.selections as Array<{
      success: boolean; searchedIngredient: string; product?: { id?: string; price?: number; productDepotInfoList?: Array<{ depotId?: string }> } | null;
    }>;
    const chosen = selections.filter(s => s.success);
    console.log('\nSEÇİMLER:');
    for (const s of selections) {
      console.log(`  ${s.searchedIngredient} → [${s.product?.id}] ${s.product?.price} TL`);
    }

    // Her başarılı seçim gerçek kimlik ve fiyat taşımalı.
    expect(chosen.length).toBeGreaterThan(0);
    expect(chosen.every(s => typeof s.product?.id === 'string' && s.product.id.length > 0)).toBe(true);
    expect(chosen.every(s => (s.product?.price ?? 0) > 0)).toBe(true);
    // Ürünler yalnızca kullanıcının seçtiği şubelerden gelmeli.
    const outside = chosen.flatMap(s => (s.product?.productDepotInfoList ?? []).map(d => d.depotId))
      .filter(id => id && !depots.includes(id));
    expect(outside).toEqual([]);
  }, 300_000);
});
