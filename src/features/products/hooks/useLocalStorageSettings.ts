'use client';

import { useEffect, useState } from 'react';
import { DEFAULTS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { Market, SearchSettings } from '@/types';

function sessionToSettings(data: {
  selectedAddress?: { latitude: number; longitude: number } | null;
  selectedMarkets?: Market[];
  distance?: number;
}): SearchSettings | null {
  if (!data.selectedAddress || !data.selectedMarkets?.length) return null;

  return {
    latitude: data.selectedAddress.latitude,
    longitude: data.selectedAddress.longitude,
    distance: data.distance || DEFAULTS.DISTANCE_KM,
    pages: DEFAULTS.PAGE,
    size: DEFAULTS.PAGE_SIZE,
    depots: data.selectedMarkets.map((m) => m.id),
    selectedMarkets: data.selectedMarkets,
  };
}

/** Arama ayarları yalnızca store'daki market oturumundan türetilir (tek kaynak). */
export const useLocalStorageSettings = () => {
  const marketSession = useAppStore((s) => s.marketSession);
  const [searchSettings, setSearchSettings] = useState<SearchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = marketSession ? sessionToSettings(marketSession) : null;
    setSearchSettings(settings);
    setError(
      settings
        ? null
        : marketSession
          ? 'Eksik veri. Önce ana sayfadan adres ve market seçimi yapınız.'
          : 'Market verileri bulunamadı. Önce ana sayfadan adres ve market seçimi yapınız.'
    );
    setIsLoading(false);
  }, [marketSession]);

  return {
    searchSettings,
    isLoading,
    error,
  };
};
