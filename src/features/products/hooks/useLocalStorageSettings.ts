'use client';

import { useEffect, useState } from 'react';
import { DEFAULTS, STORAGE_KEYS } from '@/constants';
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

export const useLocalStorageSettings = () => {
  const marketSession = useAppStore((s) => s.marketSession);
  const [searchSettings, setSearchSettings] = useState<SearchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1) Zustand session
      if (marketSession) {
        const settings = sessionToSettings(marketSession);
        if (settings) {
          setSearchSettings(settings);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      // 2) Legacy localStorage
      const raw = localStorage.getItem(STORAGE_KEYS.MARKET_SEARCH);
      if (!raw) {
        setError(
          'Market verileri bulunamadı. Önce ana sayfadan adres ve market seçimi yapınız.'
        );
        setSearchSettings(null);
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(raw);
      const settings = sessionToSettings(data);
      if (!settings) {
        setError('Eksik veri. Önce ana sayfadan adres ve market seçimi yapınız.');
        setSearchSettings(null);
      } else {
        setSearchSettings(settings);
        setError(null);
      }
    } catch {
      setError('Veri okuma hatası oluştu.');
      setSearchSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [marketSession]);

  return {
    searchSettings,
    isLoading,
    error,
  };
};
