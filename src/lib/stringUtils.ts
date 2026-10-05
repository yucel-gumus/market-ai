import { SEARCH } from '@/constants';

export function normalizeString(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
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

/**
 * Upstream şube adları ham geliyor: "Atlasüsküdar", "Şok Miniorhun", "Capıtol Mm Migros",
 * "Istanbul Çengelköy Kaldırım Mı". Okunur hale getirmek için yalnızca güvenli, geri
 * döndürülebilir düzeltmeler yapılır (ad uydurulmaz).
 */
const KNOWN_PLACES = [
  'üsküdar', 'kadıköy', 'ümraniye', 'ataşehir', 'maltepe', 'kartal', 'pendik', 'tuzla',
  'sancaktepe', 'sultanbeyli', 'çekmeköy', 'beykoz', 'sarıyer', 'beşiktaş', 'şişli',
  'kağıthane', 'eyüpsultan', 'beyoğlu', 'fatih', 'zeytinburnu', 'bakırköy', 'bahçelievler',
  'küçükçekmece', 'bağcılar', 'esenler', 'güngören', 'bayrampaşa', 'gaziosmanpaşa',
  'sultangazi', 'esenyurt', 'avcılar', 'büyükçekmece', 'beylikdüzü', 'silivri', 'arnavutköy',
  'başakşehir', 'çatalca', 'şile', 'adalar', 'küplüce', 'istanbul', 'ankara', 'izmir', 'bursa', 'kocaeli',
];

export function formatBranchName(name: string): string {
  let formatted = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!formatted) return formatted;
  // İl/ilçe adı önceki kelimeye bitişik yazılmışsa ayır: "Atlasüsküdar" -> "Atlas Üsküdar"
  for (const place of KNOWN_PLACES) {
    const pattern = new RegExp(`([^\\s])(${place})\\b`, 'giu');
    formatted = formatted.replace(pattern, (_match, before: string, found: string) =>
      `${before} ${found.charAt(0).toLocaleUpperCase('tr-TR')}${found.slice(1).toLocaleLowerCase('tr-TR')}`
    );
  }
  // Büyük harfle yazılmış İstanbul ve tek harflik artık kodları düzelt.
  formatted = formatted
    .replace(/\bIstanbul\b/giu, 'İstanbul')
    .replace(/([İi]stanbul)\s+[Mm](\s|$)/gu, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
  return formatted;
}
