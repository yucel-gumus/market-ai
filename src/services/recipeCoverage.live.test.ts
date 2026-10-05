import { describe, it, expect } from 'vitest';

/**
 * Model yarısı: 10 tarif için AI malzeme çıkarımı (market API'sine dokunmaz).
 *   MARKET_LIVE_TEST=1 MARKET_LIVE_BASE_URL=http://localhost:3015 npx vitest run src/services/recipeCoverage.live.test.ts
 * Not: malzeme→ürün eşleşmesi artık sunucuda; kapsama ölçümü Python harness'ında
 * (python_backend/scripts/recipe_harness.py, 55 tarif).
 */
const BASE = process.env.MARKET_LIVE_BASE_URL ?? '';

const RECIPES = [
  'mercimek çorbası', 'karnıyarık', 'tavuk sote', 'kısır', 'sütlaç',
  'menemen', 'izgara köfte', 'browni', 'sebzeli makarna', 'çoban salatası',
];

describe.skipIf(process.env.MARKET_LIVE_TEST !== '1' || !BASE)('tarif malzeme çıkarımı', () => {
  it('10 tarif için alışverişe uygun malzeme listesi üretir', async () => {
    const lines: string[] = [];
    let total = 0, recipesOk = 0;
    for (const recipe of RECIPES) {
      const res = await fetch(`${BASE}/api/ai-page/recipe-list`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_name: recipe }), signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`${recipe} → HTTP ${res.status}`);
      const ingredients: string[] = ((await res.json()).ingredients ?? []).slice(0, 15);
      if (ingredients.length >= 3) recipesOk++;
      total += ingredients.length;
      lines.push(`\n### ${recipe} (${ingredients.length})\n    ${ingredients.join(', ')}`);
    }
    console.log(lines.join('\n'));
    console.log(`\n===== ÖZET =====\ntarif: ${recipesOk}/${RECIPES.length} (≥3 malzeme)\nmalzeme: ${total}`);
    expect(recipesOk).toBe(RECIPES.length);
  }, 300_000);
});
