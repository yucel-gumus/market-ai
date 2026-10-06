import { expect, test } from 'playwright/test';
import { readStoreState, replaceAddress, seedSession } from './utils';

const ADDRESS_PLACEHOLDER = 'Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara';

/**
 * Regresyon: seçilen adres ve marketler güncellenemiyordu.
 *
 * İki yüzü vardı:
 * 1) Anasayfaya dönüldüğünde adres kutusu boşalıyordu (yerel state + store ikiliği),
 *    yani kullanıcı seçimini göremiyor/düzenleyemiyordu.
 * 2) Yeni adres seçilse bile eski market oturumu store'da kalıyordu; ürün arama ve
 *    asistan ESKİ şubelerle çalışmaya devam ediyordu.
 */
test.describe('Konum ve market seçimini güncelleme', () => {
  test('kalıcı seçim anasayfada dolu gelir ve düzenlenebilir', async ({ page }) => {
    await seedSession(page);
    await page.goto('/');

    const input = page.getByPlaceholder(ADDRESS_PLACEHOLDER);
    await expect(input).toHaveValue(/Kirazlıtepe/, { timeout: 20_000 });
    await expect(page.getByText('Seçili Konum:')).toBeVisible();
    await expect(page.getByText('Bulunan Marketler')).toBeVisible();
  });

  test('yeni adres seçilince eski market oturumu düşer', async ({ page }) => {
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
});
