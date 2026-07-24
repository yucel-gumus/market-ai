import { DEFAULTS, SEARCH, STORAGE_KEYS } from '@/constants';
import { logger } from '@/lib/logger';
import type { Product } from '@/types';

type MarketSearchStorage = {
  selectedAddress?: { latitude?: number; longitude?: number } | null;
  selectedMarkets?: Array<{ id: string }>;
  distance?: number;
};

function getMarketData(): MarketSearchStorage {
  if (typeof window === 'undefined') {
    return {
      selectedAddress: null,
      selectedMarkets: [],
      distance: DEFAULTS.DISTANCE_KM,
    };
  }

  const rawData = localStorage.getItem(STORAGE_KEYS.MARKET_SEARCH);
  if (!rawData) {
    return {
      selectedAddress: null,
      selectedMarkets: [],
      distance: DEFAULTS.DISTANCE_KM,
    };
  }

  try {
    return JSON.parse(rawData) as MarketSearchStorage;
  } catch (e) {
    logger.error('clientMarketSearch', 'Veri JSON formatında değil', e);
    return {
      selectedAddress: null,
      selectedMarkets: [],
      distance: DEFAULTS.DISTANCE_KM,
    };
  }
}

function buildRequestConfig(
  keywords: string,
  page: number,
  options: { menuCategory?: boolean } = {}
) {
  const parsedData = getMarketData();
  const config: Record<string, unknown> = {
    latitude: parsedData?.selectedAddress?.latitude ?? 0,
    longitude: parsedData?.selectedAddress?.longitude ?? 0,
    distance: parsedData?.distance ?? DEFAULTS.DISTANCE_KM,
    size: DEFAULTS.PAGE_SIZE,
    pages: page,
    depots: parsedData?.selectedMarkets?.map((m) => m.id) ?? [],
    keywords,
  };

  if (options.menuCategory !== undefined) {
    config.menuCategory = options.menuCategory;
  }

  return config;
}

async function fetchAllProductPages(
  keywords: string,
  endpoint: '/api/search-products' | '/api/search-by-categories',
  options: { menuCategory?: boolean } = {}
): Promise<Product[]> {
  const allProducts: Product[] = [];
  let currentPage = 0;

  try {
    while (true) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildRequestConfig(keywords, currentPage, options)),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const result = await response.json();
      if (result?.success === false) {
        throw new Error(result.error || 'Arama başarısız');
      }

      const content: Product[] = result.content || [];
      if (content.length === 0) break;

      allProducts.push(...content);
      currentPage++;
    }

    return allProducts;
  } catch (error) {
    logger.error('clientMarketSearch', 'Market API hatası', error);
    return allProducts;
  }
}

/** Ürün adı ile tüm sayfaları çeker (üst sınırlı) */
export function fetchUrunData(keywords: string) {
  return fetchAllProductPages(keywords, '/api/search-products');
}

/** Kategori anahtar kelimesi ile tüm sayfaları çeker */
export function fetchCategoriesData(keywords: string) {
  return fetchAllProductPages(keywords, '/api/search-by-categories', {
    menuCategory: false,
  });
}

export function getCheapestDepotPrice(product: Product): number | null {
  const list = product.productDepotInfoList;
  if (!list?.length) return null;
  const prices = list.map((d) => Number(d.price)).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
}

