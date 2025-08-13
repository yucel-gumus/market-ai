/**
 * String Normalization Utilities
 * Centralized string processing functions
 */

/**
 * Normalize string for comparison (lowercase, trim)
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Check if normalized string includes any of the search terms
 */
export function includesAny(text: string, searchTerms: string[]): boolean {
  const normalized = normalizeString(text);
  return searchTerms.some(term => normalized.includes(normalizeString(term)));
}

/**
 * Safe string comparison with null/undefined handling
 */
export function safeIncludes(text?: string, searchTerm?: string): boolean {
  if (!text || !searchTerm) return false;
  return normalizeString(text).includes(normalizeString(searchTerm));
}

/**
 * Generate unique key from string (for React keys)
 */
export function generateKey(text: string, fallback: string | number = ''): string {
  return normalizeString(text) || fallback.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
