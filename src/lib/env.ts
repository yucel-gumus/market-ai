/**
 * Server-side env okuma.
 * Yeni isimler (MARKET_API_URL) tercih edilir; NEXT_PUBLIC_* geriye dönük uyumluluk için fallback.
 */
export function getMarketApiUrl(): string | undefined {
  return process.env.MARKET_API_URL || process.env.NEXT_PUBLIC_MARKET_API_URL;
}

export function getAddressApiUrl(): string | undefined {
  return process.env.ADDRESS_API_URL || process.env.NEXT_PUBLIC_ADDRESS_API_URL;
}

export function getPythonApiUrl(): string | undefined {
  return process.env.PYTHON_API_URL || process.env.NEXT_PUBLIC_PYTHON_API_URL;
}

export function getPythonApiKey(): string | undefined {
  return process.env.PYTHON_API_KEY;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
