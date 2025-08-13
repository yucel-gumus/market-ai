import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Market adına göre uygun SVG logo path'ini döndürür
 */
export function getMarketLogo(marketName: string): string | null {
  const normalizedName = marketName.toLowerCase().trim();
  
  const logoMap: Record<string, string> = {
    'bim': '/bim.svg',
    'a101': '/a101.svg',
    'a 101': '/a101.svg',
    'migros': '/migros.svg',
    'carrefour': '/carrefour.svg',
    'carrefoursa': '/carrefour.svg',
    'sok': '/sok.svg',
    'şok': '/sok.svg',
    'tarım kredi': '/tarim_kredi.svg',
    'tarim kredi': '/tarim_kredi.svg',
    'tarim_kredi': '/tarim_kredi.svg',
    'tarımkredi': '/tarim_kredi.svg',
  };

  if (logoMap[normalizedName]) {
    return logoMap[normalizedName];
  }

  for (const [key, value] of Object.entries(logoMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
}
