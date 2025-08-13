
export function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

export function includesAny(text: string, searchTerms: string[]): boolean {
  const normalized = normalizeString(text);
  return searchTerms.some(term => normalized.includes(normalizeString(term)));
}

export function safeIncludes(text?: string, searchTerm?: string): boolean {
  if (!text || !searchTerm) return false;
  return normalizeString(text).includes(normalizeString(searchTerm));
}

export function generateKey(text: string, fallback: string | number = ''): string {
  return normalizeString(text) || fallback.toString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
