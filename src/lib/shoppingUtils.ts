import { Product, ProductDepotInfo, CartItem, OptimizedShopping, MarketGroup, RouteStep } from '@/types';

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


function findMarketDistance(marketName: string, latitude?: number, longitude?: number): number {
  const marketData = getSavedMarketData();
  if (!marketData?.selectedMarkets) return 0;

  let market = marketData.selectedMarkets.find((m) => 
    m.name?.toLowerCase().includes(marketName.toLowerCase()) ||
    marketName.toLowerCase().includes(m.name?.toLowerCase())
  );

  if (!market && latitude && longitude) {
    market = marketData.selectedMarkets.find((m) => 
      Math.abs(m.latitude - latitude) < 0.001 && 
      Math.abs(m.longitude - longitude) < 0.001
    );
  }

  return market?.distance || 0;
}


export function findOptimalDepot(
  product: Product,
  existingCartItems: CartItem[]
): ProductDepotInfo {
  const minPrice = Math.min(...product.productDepotInfoList.map(depot => depot.price));
  const cheapestDepots = product.productDepotInfoList.filter(depot => depot.price === minPrice);
  
  if (cheapestDepots.length === 1) {
    return cheapestDepots[0];
  }
  
  const existingMarkets = new Set(existingCartItems.map(item => item.selectedDepot.marketAdi));
  
  for (const depot of cheapestDepots) {
    if (existingMarkets.has(depot.marketAdi)) {
      return depot;
    }
  }
  
  return cheapestDepots[0];
}


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
      estimatedTime: Math.round(distance * 2),
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
      estimatedTime: Math.round(distance * 2), 
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

export function calculateOptimization(cartItems: CartItem[]): OptimizedShopping {
  const marketGroups = groupItemsByMarket(cartItems);
  const totalCost = marketGroups.reduce((sum, group) => sum + group.subtotal, 0);
  
  return {
    marketGroups,
    totalCost,
    marketCount: marketGroups.length
  };
}

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
