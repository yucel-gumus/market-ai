import { defineConfig, devices } from 'playwright/test';

/**
 * market-ai E2E yapılandırması.
 * NOT: Bu spec'ler CANLI siteye (Vercel production) karşı çalışır; ağa bağlıdır.
 * Yerel bir hedefe çalıştırmak için: E2E_BASE_URL=http://localhost:3000 npx playwright test
 */
const BASE_URL = process.env.E2E_BASE_URL || 'https://market-ai-coral.vercel.app';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: 'list',
  fullyParallel: false,
  workers: 2,
  use: {
    baseURL: BASE_URL,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'masaustu-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobil-390x844',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'mobil-webkit',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
