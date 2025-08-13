
export type MarketBrand = 'bim' | 'a101' | 'migros' | 'carrefour' | 'sok' | 'tarim_kredi' | 'other';

export function detectMarketBrand(marketName: string): MarketBrand {
  const normalizedName = marketName.toLowerCase().trim();
  
  if (normalizedName.includes('bim')) return 'bim';
  if (normalizedName.includes('a101') || normalizedName.includes('a 101')) return 'a101';
  if (normalizedName.includes('migros')) return 'migros';
  if (normalizedName.includes('carrefour')) return 'carrefour';
  if (normalizedName.includes('sok') || normalizedName.includes('şok')) return 'sok';
  if (normalizedName.includes('tarım kredi') || 
      normalizedName.includes('tarim kredi') || 
      normalizedName.includes('tarim_kredi') || 
      normalizedName.includes('tarımkredi')) return 'tarim_kredi';
  
  return 'other';
}

export function getMarketLogo(marketName: string): string | null {
  const brand = detectMarketBrand(marketName);
  
  const logoMap: Record<MarketBrand, string | null> = {
    'bim': '/bim.svg',
    'a101': '/a101.svg', 
    'migros': '/migros.svg',
    'carrefour': '/carrefour.svg',
    'sok': '/sok.svg',
    'tarim_kredi': '/tarim_kredi.svg',
    'other': null
  };

  return logoMap[brand];
}

export function getMarketDisplayName(brand: MarketBrand): string {
  const displayNames: Record<MarketBrand, string> = {
    'bim': 'BİM',
    'a101': 'A101',
    'migros': 'Migros',
    'carrefour': 'Carrefour',
    'sok': 'ŞOK',
    'tarim_kredi': 'Tarım Kredi',
    'other': 'Diğer'
  };

  return displayNames[brand];
}

export function getAllMarketBrands(): MarketBrand[] {
  return ['bim', 'a101', 'migros', 'carrefour', 'sok', 'tarim_kredi', 'other'];
}
