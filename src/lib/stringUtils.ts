import { SEARCH } from '@/constants';

export function normalizeString(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}

export function safeIncludes(text?: string, searchTerm?: string): boolean {
  if (!text || !searchTerm) return false;
  return normalizeString(text).includes(normalizeString(searchTerm));
}

export function generateKey(text: string, fallback: string | number = ''): string {
  return normalizeString(text) || fallback.toString();
}

/**
 * Ürün başlığı ile aranan kelime arasındaki token eşleşme skoru (0–1).
 */
export function titleMatchScore(productTitle: string, query: string): number {
  const a = normalizeString(productTitle);
  const b = normalizeString(query);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tokensB = b.split(/\s+/).filter((t) => t.length > 1);
  if (tokensB.length === 0) return 0;

  let hits = 0;
  for (const t of tokensB) {
    if (tokensA.has(t) || [...tokensA].some((x) => x.includes(t) || t.includes(x))) {
      hits++;
    }
  }
  return hits / tokensB.length;
}

export function isGoodTitleMatch(productTitle: string, query: string): boolean {
  return titleMatchScore(productTitle, query) >= SEARCH.TITLE_MATCH_THRESHOLD;
}
