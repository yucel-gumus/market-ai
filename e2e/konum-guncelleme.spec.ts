import { expect, test } from 'playwright/test';
import { readStoreState, replaceAddress, seedSession, seedStaleSession } from './utils';

const ADDRESS_PLACEHOLDER = 'Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara';

/**
 * Regresyon: seçilen adres ve marketler güncellenemiyordu.
 *
 * Üç yüzü vardı:
 * 1) Anasayfaya dönüldüğünde adres kutusu boşalıyordu (yerel state + store ikiliği),
 *    yani kullanıcı seçimini göremiyor/düzenleyemiyordu.
 * 2) Yeni adres seçilse bile eski market oturumu store'da kalıyordu; rozet eski ilçeyi
 *    ve market sayısını gösteriyor, ürün arama + asistan ESKİ şubelerle çalışıyordu.
 * 3) Tarayıcıda bu şekilde kalmış (uyumsuz) bir oturum, sekmeleri beslemeye devam ediyordu.
 */
test.describe('Konum ve market seçimini güncelleme', () => {
  test('kalıcı seçim anasayfada dolu gelir ve düzenlenebilir', async ({ page }) => {
    await seedSession(page);
    await page.goto('/');

    const input = page.getByPlaceholder(ADDRESS_PLACEHOLDER);
    await expect(input).toHaveValue(/Kirazlıtepe/, { timeout: 20_000 });
    await expect(page.getByText('Seçili Konum:')).toBeVisible();
    await expect(page.getByText('Bulunan Marketler')).toBeVisible();
    await expect(page.locator('header')).toContainText('3 Market');
  });

  test('yeni adres seçilince eski market oturumu ve rozet düşer', async ({ page }) => {
    await seedSession(page);
    await page.goto('/');

    const before = await readStoreState(page);
    const beforeSession = before?.marketSession as { selectedAddress?: { district?: string } } | null;
    expect(beforeSession?.selectedAddress?.district).toBe('Üsküdar');

    const picked = await replaceAddress(page, 'Çukurambar Mahallesi, Çankaya, Ankara');
    expect(picked).toBe(true);

    // Eski şubeler yeni konuma ait değil: oturum düşmeli, aksi halde aramalar eskisini kullanır.
    await expect
      .poll(async () => (await readStoreState(page))?.marketSession, { timeout: 15_000 })
      .toBeNull();

    const after = await readStoreState(page);
    const afterAddress = after?.selectedAddress as { district?: string } | undefined;
    expect(afterAddress?.district).toBe('Çankaya');

    // Rozet artık eski ilçeyi/market sayısını göstermemeli.
    await expect(page.locator('header')).toContainText('Çankaya');
    await expect(page.locator('header')).not.toContainText('Üsküdar');
    await expect(page.locator('header')).not.toContainText('3 Market');
  });

  test('adres temizlenince market oturumu da temizlenir', async ({ page }) => {
    await seedSession(page);
    await page.goto('/');

    const input = page.getByPlaceholder(ADDRESS_PLACEHOLDER);
    await expect(input).toHaveValue(/Kirazlıtepe/, { timeout: 20_000 });

    // "Adresi Temizle" butonu seçimi de düşürmeli.
    await page.getByRole('button', { name: 'Adresi Temizle' }).click();

    await expect
      .poll(async () => (await readStoreState(page))?.marketSession, { timeout: 15_000 })
      .toBeNull();
    await expect(input).toHaveValue('');
  });

  test('uyumsuz (eski) oturum ürün arama sayfasını beslemez', async ({ page }) => {
    await seedStaleSession(page);

    // Adres Bağcılar, oturum ise Üsküdar şubelerini taşıyor: arama yapılmamalı.
    await page.goto('/product-search');
    await expect(page.getByText(/market seçimi geçersiz/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Canlı Ürün Fiyat Arama')).toHaveCount(0);
  });
});
