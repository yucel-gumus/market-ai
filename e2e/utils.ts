import type { Page } from 'playwright/test';

export const SCREENSHOT_DIR = '/Users/hayabusa/.hermes/cache/scratch/dogfood-marketai/mobil';

/** Persist edilen zustand store anahtarı (src/store/useAppStore.ts). */
export const STORE_KEY = 'market-ai-app';

/**
 * Anasayfada adres + market seçimi yapmadan /ai-chat ve /product-search sayfaları
 * "market verisi bulunamadı" hatası gösterir. Gerçek sayfa yerleşimini ölçmek için
 * zustand persist localStorage kaydını önceden tohumluyoruz.
 */
export async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const latitude = 41.0122;
    const longitude = 29.0117;
    const address = {
      latitude,
      longitude,
      neighborhood: 'Kirazlıtepe',
      district: 'Üsküdar',
    };
    const markets = [
      { id: 'seed-1', name: 'Migros', address: 'Kirazlıtepe Mah. Üsküdar', latitude, longitude, distance: 0.4 },
      { id: 'seed-2', name: 'BİM', address: 'Kirazlıtepe Mah. Üsküdar', latitude: latitude + 0.001, longitude: longitude + 0.001, distance: 0.6 },
      { id: 'seed-3', name: 'A101', address: 'Kirazlıtepe Mah. Üsküdar', latitude: latitude - 0.001, longitude: longitude - 0.001, distance: 0.9 },
    ];
    const session = {
      distance: 3,
      selectedAddress: address,
      selectedMarkets: markets,
      timestamp: new Date().toISOString(),
      totalMarkets: 3,
      selectedCount: 3,
    };
    try {
      localStorage.setItem(
        'market-ai-app',
        JSON.stringify({
          state: { selectedAddress: address, selectedDistance: 3, marketSession: session },
          version: 0,
        }),
      );
    } catch {
      /* localStorage erişilemezse sessiz geç */
    }
  });
}

/**
 * Ana sayfadaki adres kutusuna metin yazar ve açılan öneri listesinden ilkini seçer.
 * @returns öneri bulunup seçildiyse true, aksi halde false.
 */
export async function selectFirstAddress(page: Page, text: string): Promise<boolean> {
  const input = page.getByPlaceholder('Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara');
  await input.waitFor({ state: 'visible', timeout: 20_000 });

  const suggestion = page.locator('[data-address-option]').first();

  // React hidrasyonu tamamlanmadan yazılan girdi onChange'i tetiklemez; bu yüzden
  // birkaç kez dene (ilk deneme çoğu zaman hidrasyon yarışına takılır).
  for (let attempt = 1; attempt <= 4; attempt++) {
    await input.click();
    await input.fill('');
    await input.fill(text);
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 8_000 });
      await suggestion.click();
      return true;
    } catch {
      await page.waitForTimeout(700);
    }
  }
  return false;
}

/**
 * Kutuyu BOŞALTMDAN yeni adres yazar ve öneriden ilkini seçer. `selectFirstAddress`'ten
 * farkı: araya boş değer girmediği için "adres temizlendi" yolu değil, gerçek
 * "adres değiştirildi" yolu tetiklenir.
 */
export async function replaceAddress(page: Page, text: string): Promise<boolean> {
  const input = page.getByPlaceholder('Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara');
  await input.waitFor({ state: 'visible', timeout: 20_000 });

  const suggestion = page.locator('[data-address-option]').first();

  for (let attempt = 1; attempt <= 4; attempt++) {
    await input.click();
    await input.fill(text);
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 8_000 });
      await suggestion.click();
      return true;
    } catch {
      await page.waitForTimeout(700);
    }
  }
  return false;
}

/** Persist edilen store'un okunabilir hâli. */
export async function readStoreState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw).state as Record<string, unknown>) : null;
  }, STORE_KEY);
}
