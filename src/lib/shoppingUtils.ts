import { STORAGE_KEYS, WALK_MINUTES_PER_KM } from '@/constants';
import { haversineKm } from '@/lib/geo';
import { logger } from '@/lib/logger';
import {
  Product,
  ProductDepotInfo,
  CartItem,
  OptimizedShopping,
  MarketGroup,
  RouteStep,
} from '@/types';

function getSavedMarketData(): {
  selectedMarkets?: Array<{
    name: string;
    distance: number;
    latitude: number;
    longitude: number;
  }>;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MARKET_SEARCH);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    logger.error('shopping', 'localStorage market data okunamadı', error);
  }
  return null;
}

function coordsOf(depot: ProductDepotInfo): { lat: number; lon: number } | null {
  const lat = depot.latitude;
  const lon = depot.longitude;
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }
  return { lat, lon };
}

/** En ucuz depo; eşit fiyatta sepetteki marketleri tercih et. */
export function findOptimalDepot(
  product: Product,
  existingCartItems: CartItem[]
): ProductDepotInfo | null {
  const depots = product.productDepotInfoList;
  if (!Array.isArray(depots) || depots.length === 0) {
    return null;
  }

  const minPrice = Math.min(...depots.map((d) => Number(d.price) || Infinity));
  if (!Number.isFinite(minPrice)) return null;

  const cheapestDepots = depots.filter((d) => Number(d.price) === minPrice);
  if (cheapestDepots.length === 1) return cheapestDepots[0];

  const existingMarkets = new Set(
    existingCartItems.map((item) => item.selectedDepot.marketAdi)
  );

  for (const depot of cheapestDepots) {
    if (existingMarkets.has(depot.marketAdi)) return depot;
  }

  return cheapestDepots[0] ?? null;
}

export function cheapestDepotPrice(product: Product): number | null {
  const depots = product.productDepotInfoList;
  if (!depots?.length) return null;
  const prices = depots.map((d) => Number(d.price)).filter(Number.isFinite);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function maxDepotPrice(product: Product): number | null {
  const depots = product.productDepotInfoList;
  if (!depots?.length) return null;
  const prices = depots.map((d) => Number(d.price)).filter(Number.isFinite);
  if (!prices.length) return null;
  return Math.max(...prices);
}

export function groupItemsByMarket(cartItems: CartItem[]): MarketGroup[] {
  const marketMap = new Map<string, MarketGroup>();

  cartItems.forEach((item) => {
    const marketName = item.selectedDepot.marketAdi || 'Bilinmeyen market';

    if (!marketMap.has(marketName)) {
      marketMap.set(marketName, {
        marketName,
        depotInfo: item.selectedDepot,
        items: [],
        subtotal: 0,
      });
    }

    const group = marketMap.get(marketName)!;
    group.items.push(item);
    group.subtotal += Number(item.selectedDepot.price) || 0;
  });

  return Array.from(marketMap.values());
}

/**
 * En yakın komşu (nearest-neighbor) rota.
 * userLat/userLon'dan başlar; her adımda mevcut konuma en yakın marketi seçer.
 */
export function optimizeRoute(
  userLat: number,
  userLon: number,
  marketGroups: MarketGroup[]
): RouteStep[] {
  if (marketGroups.length === 0) return [];

  const route: RouteStep[] = [];
  const unvisited = [...marketGroups];
  let curLat = userLat;
  let curLon = userLon;
  let stepNumber = 1;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    unvisited.forEach((group, index) => {
      const c = coordsOf(group.depotInfo);
      if (!c) return;
      const d = haversineKm(curLat, curLon, c.lat, c.lon);
      if (d < minDistance) {
        minDistance = d;
        nearestIndex = index;
      }
    });

    const nearest = unvisited[nearestIndex];
    const c = coordsOf(nearest.depotInfo);
    const lat = c?.lat ?? 0;
    const lon = c?.lon ?? 0;
    const distance =
      c && Number.isFinite(minDistance) && minDistance !== Infinity
        ? minDistance
        : 0;

    route.push({
      marketName: nearest.marketName,
      depot: nearest.depotInfo,
      items: nearest.items,
      stepNumber,
      distanceFromPrevious: distance,
      estimatedTime: Math.round(distance * WALK_MINUTES_PER_KM),
      coordinates: { latitude: lat, longitude: lon },
    });

    curLat = lat;
    curLon = lon;
    unvisited.splice(nearestIndex, 1);
    stepNumber++;
  }

  return route;
}

/** En pahalı depo seçeneğine göre tahmini tasarruf */
export function calculateTotalSavings(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    const max = maxDepotPrice(item.product);
    const selected = Number(item.selectedDepot.price);
    if (max == null || !Number.isFinite(selected)) return sum;
    return sum + Math.max(0, max - selected);
  }, 0);
}

export function calculateOptimization(cartItems: CartItem[]): OptimizedShopping {
  const marketGroups = groupItemsByMarket(cartItems);
  const totalCost = marketGroups.reduce((sum, group) => sum + group.subtotal, 0);
  const totalSavings = calculateTotalSavings(cartItems);

  return {
    marketGroups,
    totalCost,
    marketCount: marketGroups.length,
    totalSavings,
  };
}

export function addDistanceToMarketGroups(
  marketGroups: MarketGroup[],
  userLat?: number,
  userLon?: number
): MarketGroup[] {
  const marketData = getSavedMarketData();

  return marketGroups.map((group) => {
    const c = coordsOf(group.depotInfo);
    let distance = 0;

    if (
      c &&
      typeof userLat === 'number' &&
      typeof userLon === 'number' &&
      Number.isFinite(userLat) &&
      Number.isFinite(userLon)
    ) {
      distance = haversineKm(userLat, userLon, c.lat, c.lon);
    } else if (marketData?.selectedMarkets) {
      const match = marketData.selectedMarkets.find(
        (m) =>
          m.name?.toLowerCase().includes(group.marketName.toLowerCase()) ||
          group.marketName.toLowerCase().includes(m.name?.toLowerCase() || '')
      );
      distance = match?.distance || 0;
    }

    return { ...group, distance };
  });
}
