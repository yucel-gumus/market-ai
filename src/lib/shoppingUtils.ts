import { WALK_MINUTES_PER_KM } from '@/constants';
import { haversineKm } from '@/lib/geo';
import type { Product, ProductDepotInfo, CartItem, OptimizedShopping, MarketGroup, RouteStep, ShoppingMode, ShoppingOption, Market } from '@/types';

export function depotKey(depot: ProductDepotInfo): string {
  // Şube kimliği olmayan kayıtları zincir adıyla birleştirme.
  return depot.depotId || depot.id || `${depot.marketAdi}:${depot.depotName}:${depot.latitude ?? '?'}:${depot.longitude ?? '?'}`;
}

export function validPrice(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function itemQuantity(item: CartItem): number {
  return typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0
    ? item.quantity : 1;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function coordsOf(depot: { latitude?: number; longitude?: number }): { lat: number; lon: number } | null {
  const { latitude: lat, longitude: lon } = depot;
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)
    || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;
  return { lat, lon };
}

export function findOptimalDepot(product: Product, existingCartItems: CartItem[]): ProductDepotInfo | null {
  const valid = (product.productDepotInfoList ?? []).filter(d => validPrice(d.price) !== null);
  if (!valid.length) return null;
  const min = Math.min(...valid.map(d => Number(d.price)));
  const cheapest = valid.filter(d => Number(d.price) === min);
  const existing = new Set(existingCartItems.map(item => depotKey(item.selectedDepot)));
  return cheapest.find(d => existing.has(depotKey(d))) ?? cheapest[0];
}

/**
 * Sepete eklerken ürünü belirli bir şubeye sabitlemeyi dener.
 * Sabitlenen şube geçerli fiyat sunmuyorsa mevcut en-ucuz/sepette-olan
 * tercih davranışına (findOptimalDepot) düşer.
 */
export function pickDepot(product: Product, preferredDepotId: string | undefined, existingCartItems: CartItem[]): ProductDepotInfo | null {
  if (preferredDepotId) {
    const preferred = (product.productDepotInfoList ?? []).find(d => d.depotId === preferredDepotId);
    if (preferred && validPrice(preferred.price) !== null) return preferred;
  }
  return findOptimalDepot(product, existingCartItems);
}

export function cheapestDepotPrice(product: Product): number | null {
  const prices = (product.productDepotInfoList ?? []).map(d => validPrice(d.price)).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function groupItemsByMarket(cartItems: CartItem[]): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const item of cartItems) {
    const key = depotKey(item.selectedDepot);
    if (!groups.has(key)) groups.set(key, {
      depotKey: key, marketName: item.selectedDepot.marketAdi || 'Bilinmeyen market',
      depotInfo: item.selectedDepot, items: [], subtotal: 0,
    });
    const group = groups.get(key)!;
    // Aynı şubenin başka bir ürününde koordinat varsa onu kullan.
    if (!coordsOf(group.depotInfo) && coordsOf(item.selectedDepot)) group.depotInfo = item.selectedDepot;
    group.items.push(item);
    group.subtotal = roundMoney(group.subtotal + (validPrice(item.selectedDepot.price) ?? 0) * itemQuantity(item));
  }
  return [...groups.values()];
}

/** Yaklaşık durak sırası; eksik koordinat için sahte durak üretmez. */
export function optimizeRoute(userLat: number, userLon: number, groups: MarketGroup[]): RouteStep[] {
  if (!coordsOf({ latitude: userLat, longitude: userLon })) return [];
  const unvisited = groups.filter(group => coordsOf(group.depotInfo));
  const route: RouteStep[] = [];
  let lat = userLat;
  let lon = userLon;
  while (unvisited.length) {
    let nearest = 0;
    let distance = Infinity;
    unvisited.forEach((group, index) => {
      const c = coordsOf(group.depotInfo)!;
      const d = haversineKm(lat, lon, c.lat, c.lon);
      if (d < distance) { nearest = index; distance = d; }
    });
    const group = unvisited.splice(nearest, 1)[0];
    const c = coordsOf(group.depotInfo)!;
    route.push({ marketName: group.marketName, depot: group.depotInfo, items: group.items,
      stepNumber: route.length + 1, distanceFromPrevious: distance,
      estimatedTime: distance * WALK_MINUTES_PER_KM,
      coordinates: { latitude: c.lat, longitude: c.lon } });
    lat = c.lat;
    lon = c.lon;
  }
  return route;
}

function makeOption(mode: ShoppingMode, items: CartItem[], origin?: { latitude: number; longitude: number }): ShoppingOption {
  const groups = groupItemsByMarket(items);
  const route = origin ? optimizeRoute(origin.latitude, origin.longitude, groups) : [];
  return {
    mode, items, feasible: true, marketCount: groups.length,
    totalCost: roundMoney(groups.reduce((sum, g) => sum + g.subtotal, 0)),
    estimatedWalkMinutes: route.length === groups.length && groups.length > 0
      ? route.reduce((sum, step) => sum + (step.estimatedTime ?? 0), 0) : undefined,
  };
}

function isBetter(candidate: ShoppingOption, best?: ShoppingOption): boolean {
  if (!best) return true;
  if (candidate.totalCost !== best.totalCost) return candidate.totalCost < best.totalCost;
  if (candidate.marketCount !== best.marketCount) return candidate.marketCount < best.marketCount;
  return (candidate.estimatedWalkMinutes ?? Infinity) < (best.estimatedWalkMinutes ?? Infinity);
}

/** Tek ve iki şube seçeneklerinde bütün şube kombinasyonlarını karşılaştırır. */
export function buildShoppingOptions(items: CartItem[], origin?: { latitude: number; longitude: number }): ShoppingOption[] {
  const depotMaps = items.map(item => {
    const map = new Map<string, ProductDepotInfo>();
    for (const d of item.product.productDepotInfoList ?? []) {
      const price = validPrice(d.price);
      if (price === null) continue;
      const key = depotKey(d);
      if (!map.has(key) || price < Number(map.get(key)!.price)) map.set(key, d);
    }
    return map;
  });
  const keys = [...new Set(depotMaps.flatMap(map => [...map.keys()]))].sort();
  const impossible = (mode: ShoppingMode, reason: string): ShoppingOption => ({
    mode, feasible: false, reason, items: [], totalCost: 0, marketCount: 0,
  });
  if (!items.length || depotMaps.some(map => !map.size)) {
    return (['single', 'two', 'cheapest'] as const).map(mode => impossible(mode, 'Bazı ürünlerde geçerli fiyat bulunamadı.'));
  }
  const candidate = (mode: ShoppingMode, a: string, b?: string): ShoppingOption | undefined => {
    const chosen: CartItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const first = depotMaps[i].get(a);
      const second = b ? depotMaps[i].get(b) : undefined;
      const d = first && second ? (Number(first.price) <= Number(second.price) ? first : second) : first ?? second;
      if (!d) return undefined;
      chosen.push({ ...items[i], quantity: itemQuantity(items[i]), selectedDepot: d });
    }
    return makeOption(mode, chosen, origin);
  };
  let single: ShoppingOption | undefined;
  let two: ShoppingOption | undefined;
  for (const key of keys) {
    const option = candidate('single', key);
    if (option && isBetter(option, single)) single = option;
  }
  if (single) two = { ...single, mode: 'two' };
  for (let a = 0; a < keys.length; a++) {
    for (let b = a + 1; b < keys.length; b++) {
      const option = candidate('two', keys[a], keys[b]);
      if (option && isBetter(option, two)) two = option;
    }
  }
  const cheapestItems: CartItem[] = [];
  for (const item of items) {
    cheapestItems.push({ ...item, quantity: itemQuantity(item), selectedDepot: findOptimalDepot(item.product, cheapestItems)! });
  }
  const cheapest = makeOption('cheapest', cheapestItems, origin);
  // Aynı minimum toplamı sağlayan tek/iki şube varsa daha az durak kullan.
  const cheapestWithFewestStops = two && two.totalCost === cheapest.totalCost && isBetter(two, cheapest)
    ? { ...two, mode: 'cheapest' as const } : cheapest;
  return [
    single ?? impossible('single', 'Seçili şubelerin hiçbiri tüm ürünleri karşılamıyor.'),
    two ?? impossible('two', 'Bu sepet seçili şubelerin en fazla ikisiyle tamamlanamıyor.'),
    cheapestWithFewestStops,
  ];
}

export function calculateOptimization(items: CartItem[], mode: ShoppingMode = 'cheapest',
  origin?: { latitude: number; longitude: number }): OptimizedShopping {
  const options = buildShoppingOptions(items, origin);
  const selected = options.find(option => option.mode === mode && option.feasible) ?? options[2];
  const single = options[0];
  const displayedItems = selected.feasible ? selected.items : items.flatMap(item => {
    const depot = findOptimalDepot(item.product, []);
    return depot ? [{ ...item, selectedDepot: depot }] : [];
  });
  const dates = items.map(item => item.product.priceCheckedAt).filter((date): date is string => !!date && Number.isFinite(Date.parse(date)));
  return {
    totalQuantity: items.reduce((sum, item) => sum + itemQuantity(item), 0),
    unavailableProducts: items.filter(item => cheapestDepotPrice(item.product) === null).map(item => item.product),
    marketGroups: groupItemsByMarket(displayedItems), totalCost: selected.totalCost, marketCount: selected.marketCount,
    mode: selected.mode, options, singleStoreCost: single.feasible ? single.totalCost : undefined,
    totalSavings: single.feasible ? roundMoney(Math.max(0, single.totalCost - selected.totalCost)) : undefined,
    extraWalkMinutes: single.feasible && single.estimatedWalkMinutes !== undefined && selected.estimatedWalkMinutes !== undefined
      ? selected.estimatedWalkMinutes - single.estimatedWalkMinutes : undefined,
    oldestPriceCheck: dates.length ? dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0] : undefined,
    hasUnknownPriceChecks: dates.length !== items.length,
  };
}

export function enrichProductDepots(product: Product, markets: Market[]): Product {
  return { ...product, productDepotInfoList: (product.productDepotInfoList ?? []).map(depot => {
    const match = markets.find(m => m.id === depotKey(depot));
    return match && !coordsOf(depot) ? { ...depot, latitude: match.latitude, longitude: match.longitude } : depot;
  }) };
}
