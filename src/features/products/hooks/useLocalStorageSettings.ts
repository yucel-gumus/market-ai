'use client';

import { useEffect, useState } from 'react';
import { DEFAULTS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { settingsFromSession } from '@/lib/locationSession';
import { SearchSettings } from '@/types';

/**
 * Arama ayarları yalnızca store'daki market oturumundan türetilir (tek kaynak) — ama
 * oturum ekrandaki güncel adres/mesafeyle uyuşmuyorsa GEÇERSİZDİR: kullanıcı adresini
 * değiştirdiyse eski şubelerle arama yapılmaz, "önce seçim yapın" denir.
 */
export const useLocalStorageSettings = () => {
  const marketSession = useAppStore((s) => s.marketSession);
  const selectedAddress = useAppStore((s) => s.selectedAddress);
  const selectedDistance = useAppStore((s) => s.selectedDistance);
  const [searchSettings, setSearchSettings] = useState<SearchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = settingsFromSession(marketSession, selectedAddress, selectedDistance, {
      pages: DEFAULTS.PAGE,
      size: DEFAULTS.PAGE_SIZE,
    });
    setSearchSettings(settings);
    setError(
      settings
        ? null
        : marketSession
          ? 'Seçtiğiniz adres için market seçimi geçersiz. Önce ana sayfadan adres ve market seçiminizi güncelleyiniz.'
          : 'Market verileri bulunamadı. Önce ana sayfadan adres ve market seçimi yapınız.'
    );
    setIsLoading(false);
  }, [marketSession, selectedAddress, selectedDistance]);

  return {
    searchSettings,
    isLoading,
    error,
  };
};
