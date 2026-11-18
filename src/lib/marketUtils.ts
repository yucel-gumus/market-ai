import type { Market } from '@/types';
import { normalizeString } from './stringUtils';

export type MarketBrand = string;

export interface StoreTheme {
  id: string;
  label: string;
  shortCode: string;
  bg: string;
  text: string;
  border: string;
}

const STORE_THEMES: Record<string, StoreTheme> = {
  migros: {
    id: 'migros',
    label: 'Migros',
    shortCode: 'MG',
    bg: '#EC7D55',
    text: '#253341',
    border: '#AB421C',
  },
  bim: {
    id: 'bim',
    label: 'BİM',
    shortCode: 'BİM',
    bg: '#253341',
    text: '#F5F9F5',
    border: '#3E5164',
  },
  a101: {
    id: 'a101',
    label: 'A101',
    shortCode: 'A101',
    bg: '#3E5164',
    text: '#F5F9F5',
    border: '#253341',
  },
  sok: {
    id: 'sok',
    label: 'ŞOK',
    shortCode: 'ŞOK',
    bg: '#F2A488',
    text: '#253341',
    border: '#EC7D55',
  },
  carrefour: {
    id: 'carrefour',
    label: 'CarrefourSA',
    shortCode: 'CF',
    bg: '#DCE3EA',
    text: '#253341',
    border: '#3E5164',
  },
  tarim_kredi: {
    id: 'tarim_kredi',
    label: 'Tarım Kredi',
    shortCode: 'TK',
    bg: '#DBE6DD',
    text: '#253341',
    border: '#3E5164',
  },
  hakmar: {
    id: 'hakmar',
    label: 'Hakmar',
    shortCode: 'HK',
    bg: '#AB421C',
    text: '#F5F9F5',
    border: '#253341',
  },
  file: {
    id: 'file',
    label: 'FİLE',
    shortCode: 'FİLE',
    bg: '#F5F9F5',
    text: '#253341',
    border: '#3E5164',
  },
};

const FALLBACK_SHADES: ReadonlyArray<Pick<StoreTheme, 'bg' | 'text' | 'border'>> = [
  { bg: '#DCE3EA', text: '#253341', border: '#BCC7D2' },
  { bg: '#DBE6DD', text: '#253341', border: '#3E5164' },
  { bg: '#3E5164', text: '#F5F9F5', border: '#253341' },
  { bg: '#F2A488', text: '#253341', border: '#AB421C' },
];

function matchBrandKey(normalized: string): string | null {
  if (!normalized) return null;
  if (normalized.includes('migros')) return 'migros';
  if (normalized === 'bim' || normalized.startsWith('bim ')) return 'bim';
  if (normalized.includes('a101') || normalized.includes('a 101')) return 'a101';
  if (
    normalized === 'sok' ||
    normalized.startsWith('sok ') ||
    normalized.includes('sokmarket') ||
    normalized.includes('sok market')
  ) {
    return 'sok';
  }
  if (normalized.includes('carrefour')) return 'carrefour';
  if (normalized.includes('tarim') && normalized.includes('kredi')) return 'tarim_kredi';
  if (normalized.includes('hakmar')) return 'hakmar';
  if (normalized === 'file' || normalized.startsWith('file ')) return 'file';
  return null;
}

function hashKey(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Bir marketin seçim kimliği. API bazı şubelerde `id` döndürmediği için ad + konumdan
 * türetilen yedeğe düşülür. Liste, harita, filtre ve kayıtlı oturum AYNI fonksiyonu
 * kullanmalı: farklı yerde üretilen anahtar, seçimin kaybolması/donması demek.
 */
export function marketKey(market: Market): string {
  if (market.id) return market.id;
  return `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
}

/**
 * API'den gelen market adını (migros, bim, a101, sok, carrefour, tarim_kredi, hakmar)
 * veya Türkçe şube/görünen adını Upstream CDN SVG logosuna dönüştürür.
 * `file` için upstream HTML SPA fallback döndüğünden `null` döner.
 */
export function getMarketLogo(marketName?: string | null): string | null {
  if (!marketName || typeof marketName !== 'string') return null;
  const raw = marketName.trim();
  if (!raw) return null;

  const normalized = normalizeString(raw).replace(/_/g, ' ');
  const matched = matchBrandKey(normalized);
  if (matched) {
    return matched === 'file'
      ? null
      : `https://marketfiyati.org.tr/assets/images/marketim/logos/${matched}.svg`;
  }

  const slug = raw.toLowerCase();
  if (/^[a-z0-9_]+$/.test(slug) && slug !== 'other' && slug !== 'file') {
    return `https://marketfiyati.org.tr/assets/images/marketim/logos/${slug}.svg`;
  }

  return null;
}

export function detectMarketBrand(marketName?: string | null): string {
  if (!marketName || typeof marketName !== 'string') return 'other';
  return marketName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

/**
 * Maps every market brand strictly to the 10-hex İpek Küllü Arduvaz palette
 * with readable text label and compact monogram so zero foreign brand hues appear.
 */
export function getStoreTheme(marketName?: string | null): StoreTheme {
  const raw = typeof marketName === 'string' ? marketName.trim() : '';
  const normalized = normalizeString(raw).replace(/_/g, ' ');
  const matched = matchBrandKey(normalized);
  if (matched) return STORE_THEMES[matched];

  const cleanLabel = raw ? raw.replace(/_/g, ' ') : 'Market';
  const words = cleanLabel.split(/\s+/).filter(Boolean);
  const shortCode = words.length > 1
    ? `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toLocaleUpperCase('tr-TR')
    : cleanLabel.slice(0, 3).toLocaleUpperCase('tr-TR');
  const shade = FALLBACK_SHADES[hashKey(normalized || 'market') % FALLBACK_SHADES.length];

  return {
    id: normalized || 'other',
    label: cleanLabel,
    shortCode: shortCode || 'MK',
    ...shade,
  };
}
