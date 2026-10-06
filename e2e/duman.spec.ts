import { test, expect } from 'playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SCREENSHOT_DIR, seedSession } from './utils';

/**
 * Duman testi: her sayfayı yükler, düzen/konsol/başlık sağlığını ölçer.
 * CANLI siteye karşı çalışır. Konsolda yalnızca 'error' tipi ve yakalanmayan
 * pageerror başarısız sayılır; console.warn SAYILMAZ.
 */
const PAGES = [
  { name: 'ana-sayfa', url: '/' },
  { name: 'ai-chat', url: '/ai-chat' },
  { name: 'urun-arama', url: '/product-search' },
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

for (const { name, url } of PAGES) {
  test(`duman: ${name} yüklenir, taşma yok, hata yok`, async ({ page }, testInfo) => {
    await seedSession(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Ana içerik/başlık yerleşsin: kısa ve dayanıklı bekleme.
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    const h1h2 = await page.locator('h1:visible, h2:visible').count();
    const title = await page.title();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: doc.scrollWidth > window.innerWidth + 1,
      };
    });

    const shot = path.join(SCREENSHOT_DIR, `${testInfo.project.name}-${name}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    const metrics = {
      proje: testInfo.project.name,
      sayfa: name,
      url,
      visibleH1H2: h1h2,
      title,
      scrollWidth: overflow.scrollWidth,
      innerWidth: overflow.innerWidth,
      yatayTasma: overflow.hasHorizontalOverflow,
      konsolHatalari: consoleErrors,
      sayfaHatalari: pageErrors,
      ekranGoruntusu: shot,
    };
    console.log(`[duman] ${JSON.stringify(metrics)}`);

    expect.soft(h1h2, `${name}: görünür h1/h2 bulunamadı`).toBeGreaterThan(0);
    expect.soft(title.trim().length, `${name}: sayfa başlığı boş`).toBeGreaterThan(0);
    expect.soft(overflow.hasHorizontalOverflow, `${name}: yatay taşma var (scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth})`).toBe(false);
    expect.soft(consoleErrors, `${name}: konsol 'error' mesajları`).toEqual([]);
    expect.soft(pageErrors, `${name}: yakalanmayan pageerror`).toEqual([]);
  });
}
