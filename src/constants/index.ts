/** Uygulama geneli sabitler — magic number ve hardcode tekrarı yok. */

export const STORAGE_KEYS = {
  MARKET_SEARCH: 'marketSearchData',
  SHOPPING_CART: 'shopping-cart',
} as const;

export const DEFAULTS = {
  DISTANCE_KM: 5,
  PAGE_SIZE: 50,
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
  LIVE_PAGE_SIZE: 30,
  /** Tüm sayfaları çekerken üst sınır (sonsuz döngü koruması) */
  MAX_PAGES: 20,
  /** AI malzeme/kategori aramalarında eşzamanlı istek limiti */
  AI_CONCURRENCY: 4,
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
  API_CLIENT: 10_000,
  MARKET_API: 15_000,
  MARKET_NEAREST: 10_000,
  ADDRESS_API: 8_000,
  LLM_BACKEND: 60_000,
} as const;

export const CACHE_HEADERS = {
  SHORT: 'public, s-maxage=30, stale-while-revalidate=60',
  MEDIUM: 'public, s-maxage=60, stale-while-revalidate=120',
} as const;

export const USER_AGENT = 'MarketAI/1.0';

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
  SEARCH: 'search',
  SEARCH_BY_CATEGORIES: 'searchByCategories',
  NEAREST: 'nearest',
} as const;

/** Upstream hata detayının client'a yansıma üst sınırı (prod'da kapalı) */
export const UPSTREAM_ERROR_DETAIL_MAX = 500;
