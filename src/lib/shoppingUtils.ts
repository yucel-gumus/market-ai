import { Product, ProductDepotInfo, CartItem, OptimizedShopping, MarketGroup, RouteStep } from '@/types';

/**
 * Get saved market data from localStorage
 */
function getSavedMarketData(): { selectedMarkets?: Array<{ name: string; distance: number; latitude: number; longitude: number; }> } | null {
  try {
    const saved = localStorage.getItem('marketSearchData');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading market data from localStorage:', error);
  }
  return null;
}

/**
 * Find distance for a market from saved data
 */
function findMarketDistance(marketName: string, latitude?: number, longitude?: number): number {
  const marketData = getSavedMarketData();
  if (!marketData?.selectedMarkets) return 0;

  // Try to find market by name first
  let market = marketData.selectedMarkets.find((m) => 
    m.name?.toLowerCase().includes(marketName.toLowerCase()) ||
    marketName.toLowerCase().includes(m.name?.toLowerCase())
  );

  // If not found by name, try to find by coordinates
  if (!market && latitude && longitude) {
    market = marketData.selectedMarkets.find((m) => 
      Math.abs(m.latitude - latitude) < 0.001 && 
      Math.abs(m.longitude - longitude) < 0.001
    );
  }

  return market?.distance || 0;
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
 * Optimize shopping route using saved market distances
 */
export function optimizeRoute(
  userLat: number,
  userLon: number,
  marketGroups: MarketGroup[]
): RouteStep[] {
  if (marketGroups.length === 0) return [];
  if (marketGroups.length === 1) {
    const distance = findMarketDistance(
      marketGroups[0].marketName,
      marketGroups[0].depotInfo.latitude,
      marketGroups[0].depotInfo.longitude
    );
    
    return [{
      marketName: marketGroups[0].marketName,
      depot: marketGroups[0].depotInfo,
      items: marketGroups[0].items,
      stepNumber: 1,
      distanceFromPrevious: distance,
      estimatedTime: Math.round(distance * 2), // 2 min per km estimate
      coordinates: {
        latitude: marketGroups[0].depotInfo.latitude || 0,
        longitude: marketGroups[0].depotInfo.longitude || 0
      }
    }];
  }
  
  const route: RouteStep[] = [];
  const unvisited = [...marketGroups];
  let stepNumber = 1;
  
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    // Find nearest unvisited market using saved distances
    unvisited.forEach((group, index) => {
      const distance = findMarketDistance(
        group.marketName,
        group.depotInfo.latitude,
        group.depotInfo.longitude
      );
      
      if (distance > 0 && distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    const nearestMarket = unvisited[nearestIndex];
    const lat = nearestMarket.depotInfo.latitude || 0;
    const lon = nearestMarket.depotInfo.longitude || 0;
    const distance = findMarketDistance(
      nearestMarket.marketName,
      lat,
      lon
    );
    
    route.push({
      marketName: nearestMarket.marketName,
      depot: nearestMarket.depotInfo,
      items: nearestMarket.items,
      stepNumber,
      distanceFromPrevious: distance,
      estimatedTime: Math.round(distance * 2), // Rough estimate: 2 min per km
      coordinates: {
        latitude: lat,
        longitude: lon
      }
    });
    
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
 * Add distance information to market groups using saved data
 */
export function addDistanceToMarketGroups(
  marketGroups: MarketGroup[]
): MarketGroup[] {
  return marketGroups.map(group => ({
    ...group,
    distance: findMarketDistance(
      group.marketName,
      group.depotInfo.latitude,
      group.depotInfo.longitude
    )
  }));
}
