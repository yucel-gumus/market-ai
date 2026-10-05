/** Uygulama geneli sabitler — magic number ve hardcode tekrarı yok. */

export const STORAGE_KEYS = {
  SHOPPING_CART: 'shopping-cart',
} as const;

export const DEFAULTS = {
  DISTANCE_KM: 5,
  PAGE_SIZE: 24,
  /** API üst sınırı: size 1–100 arası olmalı, fazlası 400 döner. */
  MAX_PAGE_SIZE: 100,
  PAGE: 0,
  /** Harita fallback merkezi (İstanbul) */
  MAP_CENTER: { lat: 41.0082, lng: 28.9784 },
  MAP_ZOOM: 13,
  MAP_MIN_ZOOM: 10,
  MAP_MAX_ZOOM: 18,
  /** OSM tile provider üst zoom (map maxZoom'tan bir kademe yüksek) */
  TILE_MAX_ZOOM: 19,
} as const;

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  ADDRESS_RESULT_LIMIT: 10,
  /** Canlı arama: tek sayfa (hızlı UX) */
  LIVE_PAGE_SIZE: 24,
  /** Ürün başlığı eşlemede minimum skor (0–1) */
  TITLE_MATCH_THRESHOLD: 0.45,
} as const;

export const DISTANCE = {
  MIN_KM: 1,
  MAX_KM: 10,
  OPTIONS: [
    { value: 1, label: '1 km' },
    { value: 2, label: '2 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' },
    { value: 7, label: '7 km' },
    { value: 10, label: '10 km' },
  ],
} as const;

export const TIMEOUTS_MS = {
  API_CLIENT: 20_000,
  MARKET_API: 15_000,
  MARKET_NEAREST: 10_000,
  ADDRESS_API: 8_000,
  LLM_BACKEND: 60_000,
} as const;

export const CACHE_HEADERS = {
  SHORT: 'public, s-maxage=30, stale-while-revalidate=60',
  MEDIUM: 'public, s-maxage=60, stale-while-revalidate=120',
} as const;

/** WAF (Radware) tarayıcı-benzeri başlık ister; özel UA + Referer'sız istekler bağlantı düşmesiyle engellenir. */
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
export const MARKET_REFERER = 'https://marketfiyati.org.tr/';
export const MARKET_ORIGIN = 'https://marketfiyati.org.tr';
export const ACCEPT_LANGUAGE = 'tr-TR,tr;q=0.9,en;q=0.8';

export const EARTH_RADIUS_KM = 6371;

/** Yaya yaklaşık süre: dakika / km */
export const WALK_MINUTES_PER_KM = 12;

export const LEAFLET = {
  ICON_RETINA:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  ICON: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  SHADOW:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  OSRM_SERVICE: 'https://router.project-osrm.org/route/v1',
} as const;

export const MARKET_API_PATHS = {
  SEARCH: 'v2/search',
  SEARCH_BY_CATEGORIES: 'v3/searchByCategories',
  NEAREST: 'v2/nearest',
  LIST_SYNC: 'v1/list/sync',
  CATEGORIES: 'v3/info/categories',
} as const;

/** Upstream hata detayının client'a yansıma üst sınırı (prod'da kapalı) */
export const UPSTREAM_ERROR_DETAIL_MAX = 500;
