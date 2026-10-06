'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Market } from '@/types';
import { detectMarketBrand, marketKey, type MarketBrand } from '@/lib/marketUtils';
import { hiddenKeysForPreselection } from '@/lib/locationSession';

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

  useEffect(() => {
    setSelectedBrands(new Set(uniqueBrands));
  }, [uniqueBrands]);

  // Kurulum imzası: aynı liste + aynı kayıtlı seçim için tekrar uygulanmaz; aksi halde
  // react-query yeniden çektiğinde kullanıcının o an yaptığı değişiklikler ezilirdi.
  const marketSignature = useMemo(() => markets.map(marketKey).join('|'), [markets]);
  const preselectionSignature = preselectedKeys ? [...preselectedKeys].sort().join('|') : '';
  const appliedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!preselectedKeys || markets.length === 0) return;
    const signature = `${preselectionSignature}::${marketSignature}`;
    if (appliedSignatureRef.current === signature) return;
    appliedSignatureRef.current = signature;
    setHiddenMarkets(hiddenKeysForPreselection(markets, preselectedKeys, marketKey));
  }, [preselectedKeys, preselectionSignature, marketSignature, markets]);

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
    appliedSignatureRef.current = null;
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
