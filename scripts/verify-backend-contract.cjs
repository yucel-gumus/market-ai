const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
(async () => {
  const base = process.env.PYTHON_API_URL || process.env.NEXT_PUBLIC_PYTHON_API_URL;
  const key = process.env.PYTHON_API_KEY;
  if (!base || !key) throw new Error('PYTHON_API_URL ve PYTHON_API_KEY gerekli.');
  const response = await fetch(`${base.replace(/\/$/, '')}/api/market-ai/capabilities`, {
    headers: { Accept: 'application/json', 'X-API-Key': key }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Backend seçim sözleşmesi doğrulanamadı (HTTP ${response.status}). Yeni Python backend sürümünü yayımlayın.`);
  const data = await response.json();
  if (data.selectionContractVersion !== 2 || data.usesProductIds !== true || data.unsafePriceFallback !== false || data.supportsIngredientAmounts !== true) {
    throw new Error('Backend gerekli güvenli seçim sözleşmesini desteklemiyor.');
  }
  console.log('Backend contract v2 ready: product IDs, no unsafe fallback, ingredient quantities.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
