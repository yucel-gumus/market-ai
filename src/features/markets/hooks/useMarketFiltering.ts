'use client';

import { useState, useEffect, useMemo } from 'react';
import { Market } from '@/types';

export function useMarketFiltering(markets: Market[]) {
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [hiddenMarkets, setHiddenMarkets] = useState<Set<string>>(new Set());

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    markets.forEach(market => {
      const normalizedName = market.name.toLowerCase().trim();
      if (normalizedName.includes('bim')) brands.add('bim');
      else if (normalizedName.includes('a101') || normalizedName.includes('a 101')) brands.add('a101');
      else if (normalizedName.includes('migros')) brands.add('migros');
      else if (normalizedName.includes('carrefour')) brands.add('carrefour');
      else if (normalizedName.includes('sok') || normalizedName.includes('şok')) brands.add('sok');
      else if (normalizedName.includes('tarım kredi') || normalizedName.includes('tarim kredi') || normalizedName.includes('tarim_kredi') || normalizedName.includes('tarımkredi')) brands.add('tarim_kredi');
      else brands.add('other');
    });
    return Array.from(brands);
  }, [markets]);

  useEffect(() => {
    setSelectedBrands(new Set(uniqueBrands));
  }, [uniqueBrands]);

  const filteredMarkets = useMemo(() => {
    return markets.filter(market => {
      const normalizedName = market.name.toLowerCase().trim();
      if (normalizedName.includes('bim')) return selectedBrands.has('bim');
      if (normalizedName.includes('a101') || normalizedName.includes('a 101')) return selectedBrands.has('a101');
      if (normalizedName.includes('migros')) return selectedBrands.has('migros');
      if (normalizedName.includes('carrefour')) return selectedBrands.has('carrefour');
      if (normalizedName.includes('sok') || normalizedName.includes('şok')) return selectedBrands.has('sok');
      if (normalizedName.includes('tarım kredi') || normalizedName.includes('tarim kredi') || normalizedName.includes('tarim_kredi') || normalizedName.includes('tarımkredi')) return selectedBrands.has('tarim_kredi');
      return selectedBrands.has('other');
    });
  }, [markets, selectedBrands]);

  const selectedMarketsCount = useMemo(() => {
    return filteredMarkets.filter(market => {
      const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
      return !hiddenMarkets.has(marketKey);
    }).length;
  }, [filteredMarkets, hiddenMarkets]);

  const toggleBrand = (brand: string) => {
    const newSelectedBrands = new Set(selectedBrands);
    if (newSelectedBrands.has(brand)) {
      newSelectedBrands.delete(brand);
    } else {
      newSelectedBrands.add(brand);
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

  return {
    uniqueBrands,
    selectedBrands,
    hiddenMarkets,
    filteredMarkets,
    selectedMarketsCount,
    toggleBrand,
    toggleMarket
  };
}
