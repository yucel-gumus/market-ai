const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');

const base = process.env.UI_TEST_BASE_URL || 'http://localhost:3016';
const server = process.env.UI_TEST_BASE_URL ? null : spawn('npm', ['run', 'dev', '--', '--port', '3016'], { stdio: 'ignore', detached: process.platform !== 'win32' });
const depot = (id, price) => ({ depotId: id, depotName: `Şube ${id}`, marketAdi: id === 'C' ? 'BİM' : 'Migros', price, unitPrice: `${price} TL`, latitude: 41 + ({ A: .01, B: .02, C: .03 }[id]), longitude: 29 });
const products = [
  { id: 'tomato', title: 'Domates 1 kg', productDepotInfoList: [depot('A', 10), depot('B', 14), depot('C', 20)] },
  { id: 'milk', title: 'Süt 1 l', productDepotInfoList: [depot('A', 20), depot('B', 10), depot('C', 20)] },
  { id: 'rice', title: 'Pirinç 1 kg', productDepotInfoList: [depot('A', 20), depot('B', 20), depot('C', 10)] },
];
const session = { distance: 5, selectedAddress: { fullAddress: 'Test adresi', district: 'Kadıköy', latitude: 41, longitude: 29 },
  selectedMarkets: ['A', 'B', 'C'].map(id => ({ id, name: `Şube ${id}`, address: 'Test adresi', distance: 1, latitude: depot(id, 10).latitude, longitude: 29 })) };
const cart = products.map(product => ({ product, selectedDepot: product.productDepotInfoList[0], addedAt: '2026-10-01T10:00:00Z' }));

(async () => {
  let browser;
  try {
    for (let i = 0; i < 90; i++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    context.setDefaultTimeout(15000);
    await context.addInitScript(({ session, cart }) => {
      if (localStorage.getItem('qa-seeded')) return;
      localStorage.setItem('marketSearchData', JSON.stringify(session));
      localStorage.setItem('market-ai-app', JSON.stringify({ state: { marketSession: session, selectedAddress: session.selectedAddress }, version: 0 }));
      localStorage.setItem('shopping-cart', JSON.stringify(cart));
      localStorage.setItem('qa-seeded', 'true');
    }, { session, cart });
    const aiFails = true;
    let pageFailure = true;
    const paginationRequests = [];
    let failedPriceProduct = ''; 
    const expectedServings = '6 kişilik';
    await context.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      const body = route.request().postDataJSON() ?? {};
      if (path.includes('market-categories')) return route.fulfill({ json: { content: [{ id: 1, parentId: null, name: 'Meyve ve Sebze', children: [{ id: 2, parentId: 1, name: 'Sebze', children: [] }] }, { id: 3, parentId: null, name: 'Süt Ürünleri ve Kahvaltılık', children: [{ id: 4, parentId: 3, name: 'Süt', children: [{ id: 5, parentId: 4, name: 'UHT Süt', children: [] }] }] }] } });
      if (path.includes('recipe-list')) {
        assert.ok(body.recipe_name.includes(expectedServings));
        return route.fulfill({ json: { success: true, ingredients: ['domates', 'süt'] } });
      }
      if (path.includes('select-products')) return aiFails
        ? route.fulfill({ status: 502, json: { success: false, error: 'Test AI failure' } })
        : route.fulfill({ json: { success: true, selections: [{ success: true, searchedIngredient: 'domates', product: { title: 'Domates 1 kg', price: 10 }, reasoning: 'Test' }] } });
      if (path.includes('ingredient-categories')) return route.fulfill({ json: { success: true, categories: [] } });
      if (path.includes('search-products') && body.keywords === 'sayfalama') {
        paginationRequests.push(body.pages);
        if (body.pages === 1 && pageFailure) { pageFailure = false; return route.fulfill({ status: 503, json: { success: false, error: 'Geçici sayfa hatası' } }); }
        const content = Array.from({ length: Math.max(0, Math.min(24, 61 - body.pages * 24)) }, (_, i) => ({ ...products[0], id: `page-${body.pages * 24 + i}`, title: `Sayfalama ürün ${body.pages * 24 + i}` }));
        return route.fulfill({ json: { content, numberOfFound: 61, searchResultType: 1 } });
      }
      if (path.includes('sync-products')) {
        const content = products.filter(p => body.identities.includes(p.id) && p.title.toLocaleLowerCase('tr-TR') !== failedPriceProduct);
        return route.fulfill({ json: { content, numberOfFound: content.length, checkedAt: new Date().toISOString() } });
      }
      const keyword = (body.keywords ?? '').toLocaleLowerCase('tr-TR');
      if (failedPriceProduct && keyword === failedPriceProduct) return route.fulfill({ status: 503, json: { success: false, error: 'Test price service failure' } });
      const content = products.filter(p => p.title.toLocaleLowerCase('tr-TR').includes(keyword));
      return route.fulfill({ json: { content, numberOfFound: content.length, searchResultType: 1, facetMap: null, checkedAt: new Date().toISOString() } });
    });
    let routeRequests = 0;
    await context.route('**/router.project-osrm.org/**', async route => {
      routeRequests++;
      const coordinates = new URL(route.request().url()).pathname.split('/').pop().split(';').map(pair => pair.split(',').map(Number));
      let geometry = ''; let lastLat = 0; let lastLng = 0;
      const encode = delta => { let value = delta < 0 ? ~(delta << 1) : delta << 1; let result = ''; while (value >= 32) { result += String.fromCharCode((32 | (value & 31)) + 63); value >>= 5; } return result + String.fromCharCode(value + 63); };
      for (const [lng, lat] of coordinates) { const a = Math.round(lat * 100000); const b = Math.round(lng * 100000); geometry += encode(a - lastLat) + encode(b - lastLng); lastLat = a; lastLng = b; }
      await route.fulfill({ json: { code: 'Ok', waypoints: coordinates.map(location => ({ location, name: 'Test' })), routes: [{ geometry, distance: 3000, duration: 600, legs: coordinates.slice(1).map(() => ({ distance: 1000, duration: 200, summary: '', steps: [] })) }] } });
    });
    await context.route('**/*.tile.openstreetmap.org/**', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrated|server rendered/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${base}/product-search`);
    console.log('Checking initial cart hydration');
    await page.getByText('Alışveriş Sepeti (3 adet)', { exact: true }).waitFor();
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('shopping-cart')))).length, 3);
    console.log('Checking shopping modes');
    await page.getByRole('radio', { name: 'Tek mağaza', exact: true }).check();
    assert.equal(await page.getByRole('radio', { name: 'Tek mağaza', exact: true }).isChecked(), true);
    // Cheapest complete single branch B: 14 + 10 + 20 = 44.
    assert.ok((await page.locator('dl').innerText()).includes('44,00'));
    await page.getByRole('radio', { name: 'En fazla iki mağaza', exact: true }).check();
    assert.ok((await page.locator('dl').innerText()).includes('34,00'));
    await page.getByRole('radio', { name: 'Ürün toplamı en düşük', exact: true }).check();
    assert.ok((await page.locator('dl').innerText()).includes('30,00'));
    await page.getByRole('spinbutton', { name: 'Domates 1 kg adet', exact: true }).fill('3');
    await page.getByText('Alışveriş Sepeti (5 adet)', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('Alışveriş Sepeti (5 adet)', { exact: true }).waitFor();
    assert.equal(await page.getByRole('spinbutton', { name: 'Domates 1 kg adet', exact: true }).inputValue(), '3');
    await page.getByRole('button', { name: 'Fiyatları yeniden kontrol et', exact: true }).click();
    await page.getByText('Sepetteki tüm ürünlerin fiyatları yeniden kontrol edildi.', { exact: true }).waitFor();
    assert.equal(await page.getByText('Bazı ürünlerin kontrol zamanı bilinmiyor.', { exact: false }).count(), 0);
    const previousMilkCheck = await page.evaluate(() => JSON.parse(localStorage.getItem('shopping-cart')).find(item => item.product.id === 'milk').product.priceCheckedAt);
    failedPriceProduct = 'süt 1 l';
    await page.getByRole('button', { name: 'Fiyatları yeniden kontrol et', exact: true }).click();
    await page.getByText('1 ürünün fiyatı doğrulanamadı;', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('shopping-cart')).find(item => item.product.id === 'milk').product.priceCheckedAt), previousMilkCheck);
    failedPriceProduct = '';
    await fs.mkdir('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/cart-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Cart has horizontal overflow at 390px');
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: 'test-results/cart-mobile.png', fullPage: true, animations: 'disabled' });
    console.log('Cart, persistence, refresh and mobile checks passed');
    await page.getByRole('button', { name: 'Alışveriş rotasını gör', exact: true }).click();
    await page.getByText('Gösterilen süre araç rotasına aittir.', { exact: false }).waitFor();
    assert.equal(routeRequests, 1, 'Route callback recreated the map');
    await page.getByRole('button', { name: 'Rotayı kapat', exact: true }).click();
    console.log('Checking progressive pagination and retry after a later-page failure');
    await page.getByPlaceholder('Ürün adı yazın... (Örn: Süt, Zeytin, Mercimek)').fill('sayfalama');
    await page.getByRole('button', { name: 'Aramayı yeniden dene', exact: true }).waitFor();
    assert.equal(await page.getByText('Tüm sonuçlar yüklendi', { exact: false }).count(), 0);
    await page.getByRole('button', { name: 'Aramayı yeniden dene', exact: true }).click();
    await page.getByText('Tüm sonuçlar yüklendi', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Sayfalama ürün .*sepete ekle/ }).count(), 61);
    assert.deepEqual(paginationRequests, [0, 1, 1, 2]);
    console.log('Checking recipe failure and manual selection');
    await page.goto(`${base}/ai-chat`);
    await page.getByPlaceholder('Örn: Mercimek Çorbası, Tavuk Sote, Lazanya').fill('Test yemek');
    await page.getByRole('spinbutton', { name: 'Kişi sayısı', exact: true }).fill('6');
    await page.getByRole('button', { name: '1. Malzeme Listesini Bul', exact: true }).click();
    await page.getByRole('button', { name: 'Malzemeleri Onayla & Marketleri Tara', exact: true }).click();
    await page.getByText('Tamamlanması gereken malzemeler (2)', { exact: true }).waitFor();
    // Existing manual basket must survive AI failure and new recipe input.
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('shopping-cart')))).length, 3);
    await page.getByRole('combobox', { name: 'domates için ürün seç', exact: true }).selectOption('tomato');
    await page.getByText('Tamamlanması gereken malzemeler (1)', { exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'süt için ürün seç', exact: true }).selectOption('milk');
    await page.getByText('Alışveriş Sepeti (5 adet)', { exact: true }).waitFor();
    assert.equal(await page.getByText('Tamamlanması gereken malzemeler', { exact: false }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'AI page has horizontal overflow at 390px');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: 'test-results/recipe-mobile.png', fullPage: true, animations: 'disabled' });
    // Changing the selected branches must not optimize against a previous location's shops.
    await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('marketSearchData'));
      session.selectedMarkets = [{ id: 'Z', name: 'Yeni şube', latitude: 42, longitude: 30, distance: 1 }];
      localStorage.setItem('marketSearchData', JSON.stringify(session));
      localStorage.setItem('market-ai-app', JSON.stringify({ state: { marketSession: session }, version: 0 }));
    });
    await page.goto(`${base}/product-search`);
    await page.getByText('Bu ürünlerin seçili şubelerde geçerli fiyatı yok.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('radio', { name: 'Tek mağaza', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Alışveriş rotasını gör', exact: true }).isDisabled(), true);
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('shopping-cart')))).length, 3);
    assert.deepEqual(errors, []);
    console.log('UI passed: modes, quantity persistence, price refresh, AI failure, per-ingredient manual selection, existing cart preservation, 390px layout.');
  } finally { await browser?.close(); if (server?.pid) { if (process.platform === 'win32') spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); else { try { process.kill(-server.pid, 'SIGTERM'); } catch {} } } }
})().catch(error => { console.error(error); process.exitCode = 1; });
