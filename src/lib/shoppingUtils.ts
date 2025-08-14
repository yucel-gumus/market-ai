import { Product, ProductDepotInfo, CartItem, OptimizedShopping, MarketGroup, RouteStep } from '@/types';

/**
 * Haversine formula to calculate distance between two points
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Find optimal depot for a product considering existing cart items
 */
export function findOptimalDepot(
  product: Product,
  existingCartItems: CartItem[]
): ProductDepotInfo {
  // Get all depots with minimum price
  const minPrice = Math.min(...product.productDepotInfoList.map(depot => depot.price));
  const cheapestDepots = product.productDepotInfoList.filter(depot => depot.price === minPrice);
  
  // If only one cheapest option, return it
  if (cheapestDepots.length === 1) {
    return cheapestDepots[0];
  }
  
  // If multiple options with same price, prefer markets already in cart
  const existingMarkets = new Set(existingCartItems.map(item => item.selectedDepot.marketAdi));
  
  for (const depot of cheapestDepots) {
    if (existingMarkets.has(depot.marketAdi)) {
      return depot;
    }
  }
  
  // If no match, return the first cheapest option
  return cheapestDepots[0];
}

/**
 * Group cart items by market and calculate totals
 */
export function groupItemsByMarket(cartItems: CartItem[]): MarketGroup[] {
  const marketMap = new Map<string, MarketGroup>();
  
  cartItems.forEach(item => {
    const marketName = item.selectedDepot.marketAdi;
    
    if (!marketMap.has(marketName)) {
      marketMap.set(marketName, {
        marketName,
        depotInfo: item.selectedDepot,
        items: [],
        subtotal: 0
      });
    }
    
    const group = marketMap.get(marketName)!;
    group.items.push(item);
    group.subtotal += item.selectedDepot.price;
  });
  
  return Array.from(marketMap.values());
}

/**
 * Optimize shopping route using greedy nearest neighbor algorithm
 */
export function optimizeRoute(
  userLat: number,
  userLon: number,
  marketGroups: MarketGroup[]
): RouteStep[] {
  if (marketGroups.length === 0) return [];
  if (marketGroups.length === 1) {
    return [{
      marketName: marketGroups[0].marketName,
      depot: marketGroups[0].depotInfo,
      items: marketGroups[0].items,
      stepNumber: 1,
      coordinates: {
        latitude: marketGroups[0].depotInfo.latitude || 0,
        longitude: marketGroups[0].depotInfo.longitude || 0
      }
    }];
  }
  
  const route: RouteStep[] = [];
  const unvisited = [...marketGroups];
  let currentLat = userLat;
  let currentLon = userLon;
  let stepNumber = 1;
  
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    // Find nearest unvisited market
    unvisited.forEach((group, index) => {
      const lat = group.depotInfo.latitude || 0;
      const lon = group.depotInfo.longitude || 0;
      const distance = calculateDistance(currentLat, currentLon, lat, lon);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    const nearestMarket = unvisited[nearestIndex];
    const lat = nearestMarket.depotInfo.latitude || 0;
    const lon = nearestMarket.depotInfo.longitude || 0;
    
    route.push({
      marketName: nearestMarket.marketName,
      depot: nearestMarket.depotInfo,
      items: nearestMarket.items,
      stepNumber,
      distanceFromPrevious: stepNumber === 1 ? minDistance : minDistance,
      estimatedTime: Math.round(minDistance * 2), // Rough estimate: 2 min per km
      coordinates: {
        latitude: lat,
        longitude: lon
      }
    });
    
    // Update current position and remove visited market
    currentLat = lat;
    currentLon = lon;
    unvisited.splice(nearestIndex, 1);
    stepNumber++;
  }
  
  return route;
}

/**
 * Calculate total optimization statistics
 */
export function calculateOptimization(cartItems: CartItem[]): OptimizedShopping {
  const marketGroups = groupItemsByMarket(cartItems);
  const totalCost = marketGroups.reduce((sum, group) => sum + group.subtotal, 0);
  
  return {
    marketGroups,
    totalCost,
    marketCount: marketGroups.length
  };
}

/**
 * Add distance information to market groups
 */
export function addDistanceToMarketGroups(
  marketGroups: MarketGroup[],
  userLat: number,
  userLon: number
): MarketGroup[] {
  return marketGroups.map(group => ({
    ...group,
    distance: calculateDistance(
      userLat,
      userLon,
      group.depotInfo.latitude || 0,
      group.depotInfo.longitude || 0
    )
  }));
}
