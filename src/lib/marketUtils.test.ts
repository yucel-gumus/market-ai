import { describe, expect, it } from 'vitest';
import { getMarketLogo, getStoreTheme } from './marketUtils';

const BASE_LOGO_URL = 'https://marketfiyati.org.tr/assets/images/marketim/logos';

describe('getMarketLogo', () => {
  it('resolves direct API chain slugs to upstream SVG logo URLs', () => {
    for (const slug of ['migros', 'bim', 'a101', 'sok', 'carrefour', 'tarim_kredi', 'hakmar']) {
      expect(getMarketLogo(slug)).toBe(`${BASE_LOGO_URL}/${slug}.svg`);
    }
  });

  it('normalizes Turkish display names, spaced variants, and branch strings', () => {
    expect(getMarketLogo('BİM')).toBe(`${BASE_LOGO_URL}/bim.svg`);
    expect(getMarketLogo('ŞOK Market')).toBe(`${BASE_LOGO_URL}/sok.svg`);
    expect(getMarketLogo('CarrefourSA')).toBe(`${BASE_LOGO_URL}/carrefour.svg`);
    expect(getMarketLogo('Tarım Kredi Kooperatif')).toBe(`${BASE_LOGO_URL}/tarim_kredi.svg`);
    expect(getMarketLogo('Migros - Kadıköy Şubesi')).toBe(`${BASE_LOGO_URL}/migros.svg`);
    expect(getMarketLogo('A 101')).toBe(`${BASE_LOGO_URL}/a101.svg`);
    expect(getMarketLogo('Hakmar Ekspres')).toBe(`${BASE_LOGO_URL}/hakmar.svg`);
  });

  it('returns null for file, other, empty inputs, and unknown multi-word store names', () => {
    expect(getMarketLogo('file')).toBeNull();
    expect(getMarketLogo('FİLE')).toBeNull();
    expect(getMarketLogo('other')).toBeNull();
    expect(getMarketLogo('')).toBeNull();
    expect(getMarketLogo('   ')).toBeNull();
    expect(getMarketLogo(null)).toBeNull();
    expect(getMarketLogo(undefined)).toBeNull();
    expect(getMarketLogo('Yerel Mahalle Bakkalı')).toBeNull();
  });
});

describe('getStoreTheme', () => {
  it('returns İpek Küllü Arduvaz theme metadata for known and fallback brands', () => {
    expect(getStoreTheme('BİM').label).toBe('BİM');
    expect(getStoreTheme('FİLE').label).toBe('FİLE');
    const custom = getStoreTheme('Yerel Market');
    expect(custom.label).toBe('Yerel Market');
    expect(custom.shortCode).toBe('YM');
  });
});
