import { test, expect } from 'playwright/test';
import { selectFirstAddress } from './utils';

/**
 * Masaüstü a11y/rota akışı: adres seç → Kensai ile Devam Et → menemen tarifi →
 * rota diyaloğu açılırsa odak tuzağı + Escape + konsol uyarılarını doğrular.
 * Akış uzun/ağa bağlı olduğundan rota düğmesi görünmezse test 'skipped' işaretlenir.
 */
const ADDRESS = 'Kirazlıtepe Üsküdar';
const FOOD = 'menemen';

test('a11y: rota diyaloğu odak/Escape + konsol uyarıları', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'masaustu-chromium', 'Yalnızca masaüstü projelerde çalışır');

  const warnings: string[] = [];
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 1) Ana sayfa → adres
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 });
  const selected = await selectFirstAddress(page, ADDRESS);
  expect(selected, 'adres önerisi seçilemedi').toBe(true);

  // 2) Market listesi yüklenene kadar bekle, sonra Kensai ile Devam Et
  await expect(page.getByText(/Market Bulundu/).first()).toBeVisible({ timeout: 25_000 });
  const devamBtn = page.getByRole('button', { name: /Kensai ile Devam Et/ }).first();
  await expect(devamBtn).toBeVisible({ timeout: 15_000 });
  await devamBtn.click();

  // 3) ai-chat: tarif adı gir
  await page.waitForURL(/\/ai-chat/, { timeout: 20_000 });
  const foodInput = page.getByPlaceholder(/Mercimek Çorbası/);
  await expect(foodInput).toBeVisible({ timeout: 20_000 });
  await foodInput.fill(FOOD);
  await page.getByRole('button', { name: /1\. Malzeme Listesini Bul/ }).click();

  // 4) Malzeme listesi (25 sn)
  await page.waitForTimeout(25_000);

  // 5) Malzemeleri Onayla (varsa) → fiyat taraması (45 sn)
  const onayla = page.getByRole('button', { name: /Malzemeleri Onayla/ }).first();
  if (await onayla.count()) {
    await onayla.click().catch(() => {});
  }
  await page.waitForTimeout(45_000);

  // 6) Rota düğmesi
  const rotaBtn = page.getByRole('button', { name: /Alışveriş rotasını gör/ }).first();
  const singleRotaBtn = page.getByRole('button', { name: /Tek mağaza rotasını gör/ }).first();
  const rotaVar = (await rotaBtn.count()) > 0 && (await rotaBtn.isVisible().catch(() => false));

  if (!rotaVar) {
    const singleVar = (await singleRotaBtn.count()) > 0 && (await singleRotaBtn.isVisible().catch(() => false));
    console.log(`[a11y-rota] 'Alışveriş rotasını gör' görünmedi. Tek-mağaza düğmesi görünür: ${singleVar}. Konsol uyarıları: ${JSON.stringify(warnings)}`);
    test.skip(true, `Rota düğmesi görünmedi (sepet boş / tek şube / akış uzun). tekMagazaButonu=${singleVar}`);
    return;
  }

  await rotaBtn.click();

  const dialog = page.locator('[role="dialog"][aria-label="Alışveriş rotası"]').first();
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(800); // odak yerleşsin

  const focusInside = await dialog.evaluate((el) => el.contains(document.activeElement));
  const activeTag = await page.evaluate(() => {
    const a = document.activeElement;
    return a ? `${a.tagName}${a.getAttribute('aria-label') ? `[${a.getAttribute('aria-label')}]` : ''}` : 'null';
  });

  await page.keyboard.press('Escape');
  let escapeKapatti = false;
  try {
    await dialog.waitFor({ state: 'hidden', timeout: 8_000 });
    escapeKapatti = true;
  } catch {
    escapeKapatti = false;
  }

  const rotaWarn = warnings.filter((w) => w.includes('[rota]'));
  const prodWarn = warnings.filter((w) => /production use/i.test(w));

  console.log(`[a11y-rota] ${JSON.stringify({
    proje: testInfo.project.name,
    odakDiyalogIcinde: focusInside,
    odakliEleman: activeTag,
    escapeKapatti,
    rotaUyarisiVar: rotaWarn.length > 0,
    productionUseUyarisiVar: prodWarn.length > 0,
    konsolHatalari: consoleErrors,
    tumUyarilar: warnings,
  })}`);

  expect.soft(focusInside, 'açılışta odak diyaloğun içinde değil').toBe(true);
  expect.soft(escapeKapatti, 'Escape rota diyaloğunu kapatmadı').toBe(true);
  expect.soft(rotaWarn.length, "konsolda '[rota]' uyarısı yok").toBeGreaterThan(0);
  // leaflet-routing-machine kaldırıldı: kütüphanenin 'NOT SUITABLE FOR PRODUCTION use' uyarısı
  // konsolda GÖRÜNMEMELİ (harita tek OSRM isteğiyle çiziliyor).
  expect.soft(prodWarn.length, "leaflet 'production use' uyarısı geri gelmiş").toBe(0);
});
