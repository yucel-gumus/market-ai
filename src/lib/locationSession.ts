import type { Market, MarketSearchSession, ParsedAddress, SearchSettings } from '@/types';

/** Koordinat karşılaştırmasında kayan nokta gürültüsünü yut. */
const COORD_EPSILON = 1e-6;

type Coords = { latitude: number; longitude: number } | null | undefined;

export function isSameLocation(a: Coords, b: Coords): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.latitude - b.latitude) < COORD_EPSILON &&
    Math.abs(a.longitude - b.longitude) < COORD_EPSILON
  );
}

/**
 * Kayıtlı market oturumu ekrandaki seçimle hâlâ uyuşuyor mu?
 *
 * Adres veya yarıçap değiştiyse kayıtlı şubeler artık o konuma ait değildir; oturum
 * geçersizdir ve uygulama (ürün arama + asistan) onu kullanmamalıdır. Bu kontrol
 * olmadan kullanıcı yeni adres seçse bile eski şubelerle arama yapılıyordu.
 */
export function sessionMatchesSelection(
  session: MarketSearchSession | null | undefined,
  address: ParsedAddress | null | undefined,
  distance: number | null | undefined,
): boolean {
  if (!session || !address) return false;
  if (typeof distance !== 'number' || !Number.isFinite(distance)) return false;
  if (!session.selectedMarkets?.length) return false;
  if (!isSameLocation(session.selectedAddress, address)) return false;
  return session.distance === distance;
}

/**
 * Kayıtlı seçime göre gizlenmesi gereken market anahtarları: kullanıcının seçtiği
 * listede olmayan her şube seçili değildir. Anasayfaya dönüldüğünde seçimin
 * SIFIRLANMAMASI, görünüp düzenlenebilmesi için kullanılır.
 */
export function hiddenKeysForPreselection(
  markets: Market[],
  preselectedKeys: string[],
  keyOf: (market: Market) => string,
): Set<string> {
  const preselected = new Set(preselectedKeys);
  const keys = markets.map(keyOf);
  // Kayıtlı seçim bu listeyle hiç örtüşmüyorsa (şube kimlikleri değişmiş/tutarsız veri)
  // hiçbir şeyi gizlemeyiz: tüm listeyi "seçili değil" göstermek kullanıcıyı seçimsiz bırakırdı.
  if (!keys.some((key) => preselected.has(key))) return new Set();
  return new Set(keys.filter((key) => !preselected.has(key)));
}

/**
 * Kayıtlı oturumdan arama ayarlarını türetir; oturum ekrandaki seçimle uyuşmuyorsa null.
 * null → arama yapılmaz, kullanıcı "önce adres ve market seçin" mesajını görür. Aksi halde
 * eski konumun şubeleriyle sessizce arama yapılırdı.
 */
export function settingsFromSession(
  session: MarketSearchSession | null | undefined,
  address: ParsedAddress | null | undefined,
  distance: number | null | undefined,
  defaults: { pages: number; size: number },
): SearchSettings | null {
  if (!sessionMatchesSelection(session, address, distance)) return null;
  const current = session!;
  return {
    latitude: current.selectedAddress!.latitude,
    longitude: current.selectedAddress!.longitude,
    distance: current.distance,
    pages: defaults.pages,
    size: defaults.size,
    depots: current.selectedMarkets.map((market) => market.id),
    selectedMarkets: current.selectedMarkets,
  };
}
