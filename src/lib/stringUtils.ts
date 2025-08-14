
export function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

export function safeIncludes(text?: string, searchTerm?: string): boolean {
  if (!text || !searchTerm) return false;
  return normalizeString(text).includes(normalizeString(searchTerm));
}

export function generateKey(text: string, fallback: string | number = ''): string {
  return normalizeString(text) || fallback.toString();
}
