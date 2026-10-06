'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Market } from '@/types';
import { detectMarketBrand, marketKey, type MarketBrand } from '@/lib/marketUtils';
import { brandsFromPreselectedMarkets, hiddenKeysForPreselection } from '@/lib/locationSession';

/**
 * @param preselectedKeys Kayıtlı oturumdaki seçili şubelerin anahtarları. Verilirse
 *   liste yüklendiğinde seçim bu hâle kurulur (kullanıcı anasayfaya döndüğünde
 *   seçiminin sıfırlanmaması, görünüp düzenlenebilmesi için).
 */
export function useMarketFiltering(markets: Market[], preselectedKeys?: string[] | null) {
  const [selectedBrands, setSelectedBrands] = useState<Set<MarketBrand>>(new Set());
  const [hiddenMarkets, setHiddenMarkets] = useState<Set<string>>(new Set());

  const uniqueBrands = useMemo(() => {
    const brands = new Set<MarketBrand>();
    markets.forEach(market => {
      brands.add(detectMarketBrand(market.name));
    });
    return Array.from(brands);
  }, [markets]);

  // Marka satırı ve şube seçimi TEK imzayla kurulur: aynı liste + aynı kayıtlı seçim için
  // tekrar uygulanmaz; aksi halde her yeniden çekmede/sayfaya dönüşte kullanıcının filtre
  // seçimi "hepsi aktif" hâline sıfırlanırdı.
  const marketSignature = useMemo(() => markets.map(marketKey).join('|'), [markets]);
  const preselectionSignature = preselectedKeys ? [...preselectedKeys].sort().join('|') : '';
  const seedSignature = `${preselectionSignature}::${marketSignature}`;
  const appliedSeedRef = useRef<string | null>(null);

  useEffect(() => {
    if (markets.length === 0) return;
    if (appliedSeedRef.current === seedSignature) return;
    appliedSeedRef.current = seedSignature;

    const preselected = preselectedKeys ?? [];
    setHiddenMarkets(hiddenKeysForPreselection(markets, preselected, marketKey));
    const brands = brandsFromPreselectedMarkets(markets, preselected, marketKey, detectMarketBrand);
    setSelectedBrands(brands ?? new Set(uniqueBrands));
  }, [markets, seedSignature, preselectedKeys, uniqueBrands]);

  const filteredMarkets = useMemo(() => {
    return markets.filter(market => {
      const brand = detectMarketBrand(market.name);
      return selectedBrands.has(brand);
    });
  }, [markets, selectedBrands]);

  const visibleMarkets = useMemo(() => {
    return filteredMarkets.filter(market => !hiddenMarkets.has(marketKey(market)));
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
          newHiddenMarkets.delete(marketKey(market));
        }
      });
      setHiddenMarkets(newHiddenMarkets);
    }
    setSelectedBrands(newSelectedBrands);
  };

  const toggleMarket = (market: Market) => {
    const key = marketKey(market);
    setHiddenMarkets(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
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
    appliedSeedRef.current = null;
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
