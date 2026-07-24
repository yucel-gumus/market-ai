export type MarketBrand = string;

/**
 * API'den gelen market adını (bim, a101, sok, migros, carrefour, hakmar, tarim_kredi, file vb.)
 * doğrudan Upstream CDN SVG logosuna dönüştürür.
 * https://marketfiyati.org.tr/assets/images/marketim/logos/{marketName}.svg
 */
export function getMarketLogo(marketName?: string | null): string | null {
  if (!marketName || typeof marketName !== 'string') return null;
  const cleanName = marketName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  if (!cleanName) return null;
  return `https://marketfiyati.org.tr/assets/images/marketim/logos/${cleanName}.svg`;
}

export function detectMarketBrand(marketName?: string | null): string {
  if (!marketName || typeof marketName !== 'string') return 'other';
  return marketName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}
