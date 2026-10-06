import { test, expect } from 'playwright/test';
import fs from 'node:fs';
import { SCREENSHOT_DIR, selectFirstAddress } from './utils';

/**
 * Mobil tarif ekranı ölçümü: ana sayfada adres seç → market listesi yüklensin.
 * Bu spec ÖLÇÜM raporlar; expect ile başarısız olmaz (yalnızca sayfa hiç
 * yüklenmezse başarısız olur). Yalnızca 'mobil-*' projelerinde çalışır.
 */
const ADDRESS = 'Kirazlıtepe Üsküdar';

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test('mobil ölçüm: adres → market listesi düzeni', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobil'), 'Yalnızca mobil projelerde çalışır');

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 });

  const selected = await selectFirstAddress(page, ADDRESS);
  console.log(`[mobil-olcum] adres onei secildi: ${selected}`);

  let marketLoaded = false;
  try {
    await page.getByText(/Market Bulundu/).first().waitFor({ state: 'visible', timeout: 20_000 });
    marketLoaded = true;
  } catch {
    marketLoaded = false;
  }

  // Ölçümler
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    yatayTasma: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));

  const checkboxStats = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('[role="checkbox"]'));
    const withLabel = all.filter((el) => {
      const label = el.getAttribute('aria-label');
      return label !== null && label.trim().length > 0;
    });
    return { toplam: all.length, ariaLabelVar: withLabel.length };
  });

  const devamBtn = page.getByRole('button', { name: /Kensai ile Devam Et/ }).first();
  let devamInfo: Record<string, unknown> = { bulundu: false };
  if (await devamBtn.count()) {
    const box = await devamBtn.boundingBox().catch(() => null);
    const vp = page.viewportSize();
    devamInfo = {
      bulundu: true,
      boundingBox: box,
      viewport: vp,
      viewportIcinde: Boolean(box && vp && box.y >= 0 && box.y + box.height <= vp.height),
    };
  }

  const shot = `${SCREENSHOT_DIR}/${testInfo.project.name}-tarif-ekrani.png`;
  await page.screenshot({ path: shot, fullPage: true });

  console.log(`[mobil-olcum] ${JSON.stringify({
    proje: testInfo.project.name,
    adres: ADDRESS,
    adresSecildi: selected,
    marketListesiYuklendi: marketLoaded,
    yatayTasma: overflow.yatayTasma,
    scrollWidth: overflow.scrollWidth,
    innerWidth: overflow.innerWidth,
    checkbox: checkboxStats,
    devamButonu: devamInfo,
    ekranGoruntusu: shot,
  })}`);
});
