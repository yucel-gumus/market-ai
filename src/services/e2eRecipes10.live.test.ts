import { describe, it, expect } from 'vitest';

/**
 * Release gate: 10 farklı tarif — gerçek Gemini + gerçek marketfiyati + sunucu-taraflı seçim.
 *   MARKET_LIVE_TEST=1 MARKET_LIVE_BASE_URL=http://localhost:3000 npx vitest run src/services/e2eRecipes10.live.test.ts
 * Not: arama/seçim artık sunucuda; bu kapı Next proxy'si üzerinden gerçek akışı çalıştırır.
 * Kapsamlı ölçüm (55 tarif) Python tarafındadır: python_backend/scripts/recipe_harness.py
 */
const BASE = process.env.MARKET_LIVE_BASE_URL || 'http://localhost:3000';

const RECIPES = [
  'mercimek çorbası', 'karnıyarık', 'tavuk sote', 'kısır', 'sütlaç',
  'menemen', 'izgara köfte', 'browni', 'sebzeli makarna', 'çoban salatası',
];

type Selection = {
  success: boolean;
  searchedIngredient: string;
  matchType: string;
  product?: { id?: string; price?: number; title?: string; productDepotInfoList?: Array<{ depotId?: string }> } | null;
};

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

describe.skipIf(process.env.MARKET_LIVE_TEST !== '1')('E2E 10 tarif — sunucu-taraflı seçim', () => {
  it('her tarifte kimlikli ve fiyatlı ürünler seçer, boşlukları raporlar', async () => {
    const geo = { latitude: 41.0265, longitude: 29.0154, distance: 3 };
    const mk = await proxy('/search-markets', geo).catch(() => null);
    const depots: string[] | undefined = (mk?.data ?? []).slice(0, 10).map((m: { id: string }) => m.id);
    if (!depots?.length) console.log('uyarı: şube listesi alınamadı; arama konuma bırakıldı');

    const identityless: string[] = [];
    const lines: string[] = [];
    let total = 0, matched = 0, priceOk = 0, recipesOk = 0;

    for (const recipe of RECIPES) {
      const list = await proxy('/recipe-list', { recipe_name: recipe });
      const ingredients: string[] = (list.ingredients ?? []).slice(0, 12);
      expect(ingredients.length).toBeGreaterThan(2);

      const result = await proxy('/select-products', {
        recipe_name: `${recipe} (4 kişilik)`,
        ingredients: ingredients.join(', '),
        ...geo,
        ...(depots?.length ? { depots } : {}),
      });
      const selections = (result.selections ?? []) as Selection[];
      const ok = selections.filter(s => s.success);
      for (const s of ok) {
        if (!s.product?.id) identityless.push(`${recipe} :: ${s.searchedIngredient}`);
        if ((s.product?.price ?? 0) > 0) priceOk++;
      }
      total += selections.length;
      matched += ok.length;
      if (ok.length > 0) recipesOk++;
      lines.push(
        `\n### ${recipe}  malzeme=${selections.length} seçim=${ok.length}\n    ` +
        selections.map(s => `${s.searchedIngredient}→${s.product?.id ?? 'YOK'} ${s.product?.price ?? '-'} TL`).join('\n    ')
      );
    }

    console.log(lines.join('\n'));
    const rate = matched / total;
    console.log(`\n===== ÖZET =====\ntarif: ${recipesOk}/${RECIPES.length}\nmalzeme: ${matched}/${total} (${Math.round(100 * rate)}%)\nfiyatı olan seçim: ${priceOk}\nkimliksiz seçim: ${identityless.length}`);

    // Sözleşme: başarılı her seçim gerçek bir ürün kimliği ve pozitif fiyat taşır.
    expect(identityless).toEqual([]);
    expect(priceOk).toBe(matched);
    expect(recipesOk).toBe(RECIPES.length);
    expect(rate).toBeGreaterThan(0.6);
  }, 900_000);
});
