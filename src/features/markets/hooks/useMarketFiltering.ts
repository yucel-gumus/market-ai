'use client';

import { useState, useEffect, useMemo } from 'react';
import { Market } from '@/types';
import { detectMarketBrand, type MarketBrand } from '@/lib/marketUtils';

export function useMarketFiltering(markets: Market[]) {
  const [selectedBrands, setSelectedBrands] = useState<Set<MarketBrand>>(new Set());
  const [hiddenMarkets, setHiddenMarkets] = useState<Set<string>>(new Set());

  const uniqueBrands = useMemo(() => {
    const brands = new Set<MarketBrand>();
    markets.forEach(market => {
      brands.add(detectMarketBrand(market.name));
    });
    return Array.from(brands);
  }, [markets]);

  useEffect(() => {
    setSelectedBrands(new Set(uniqueBrands));
  }, [uniqueBrands]);

  const filteredMarkets = useMemo(() => {
    return markets.filter(market => {
      const brand = detectMarketBrand(market.name);
      return selectedBrands.has(brand);
    });
  }, [markets, selectedBrands]);

  const visibleMarkets = useMemo(() => {
    return filteredMarkets.filter(market => {
      const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
      return !hiddenMarkets.has(marketKey);
    });
  }, [filteredMarkets, hiddenMarkets]);

  const toggleBrand = (brand: MarketBrand) => {
    const newSelectedBrands = new Set(selectedBrands);
    if (newSelectedBrands.has(brand)) {
      newSelectedBrands.delete(brand);
    } else {
      newSelectedBrands.add(brand);
      
      const newHiddenMarkets = new Set(hiddenMarkets);
      markets.forEach(market => {
        if (detectMarketBrand(market.name) === brand) {
          const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
          newHiddenMarkets.delete(marketKey);
        }
      });
      setHiddenMarkets(newHiddenMarkets);
    }
    setSelectedBrands(newSelectedBrands);
  };

  const toggleMarket = (market: Market) => {
    const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
    const newHiddenMarkets = new Set(hiddenMarkets);
    
    if (newHiddenMarkets.has(marketKey)) {
      newHiddenMarkets.delete(marketKey);
    } else {
      newHiddenMarkets.add(marketKey);
    }
    
    setHiddenMarkets(newHiddenMarkets);
  };

  const hideMarket = (marketId: string) => {
    setHiddenMarkets(prev => new Set([...prev, marketId]));
  };

  const showMarket = (marketId: string) => {
    setHiddenMarkets(prev => {
      const newSet = new Set(prev);
      newSet.delete(marketId);
      return newSet;
    });
  };

  const resetFilters = () => {
    setSelectedBrands(new Set(uniqueBrands));
    setHiddenMarkets(new Set());
  };

  return {
    markets: filteredMarkets,
    uniqueBrands,
    selectedBrands,
    hiddenMarkets,
    toggleBrand,
    toggleMarket,
    hideMarket,
    showMarket,
    resetFilters,
    hiddenMarketsCount: hiddenMarkets.size,
    totalFilteredCount: filteredMarkets.length,
    visibleCount: visibleMarkets.length,
    originalCount: markets.length,
  };
}
