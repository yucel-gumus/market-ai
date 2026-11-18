'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULTS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { settingsFromSession } from '@/lib/locationSession';

/**
 * Arama ayarları yalnızca store'daki market oturumundan türetilir (tek kaynak) — ama
 * oturum ekrandaki güncel adres/mesafeyle uyuşmuyorsa GEÇERSİZDİR: kullanıcı adresini
 * değiştirdiyse eski şubelerle arama yapılmaz, "önce seçim yapın" denir.
 */
export const useLocalStorageSettings = () => {
  const marketSession = useAppStore((s) => s.marketSession);
  const selectedAddress = useAppStore((s) => s.selectedAddress);
  const selectedDistance = useAppStore((s) => s.selectedDistance);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }
    return useAppStore.persist.onFinishHydration(() => setIsHydrated(true));
  }, []);

  const searchSettings = useMemo(() => {
    if (!isHydrated) return null;
    return settingsFromSession(marketSession, selectedAddress, selectedDistance, {
      pages: DEFAULTS.PAGE,
      size: DEFAULTS.PAGE_SIZE,
    });
  }, [isHydrated, marketSession, selectedAddress, selectedDistance]);

  const error = useMemo(() => {
    if (!isHydrated || searchSettings) return null;
    return marketSession
      ? 'Seçtiğiniz adres için market seçimi geçersiz. Önce ana sayfadan adres ve market seçiminizi güncelleyiniz.'
      : 'Market verileri bulunamadı. Önce ana sayfadan adres ve market seçimi yapınız.';
  }, [isHydrated, searchSettings, marketSession]);

  return {
    searchSettings,
    isLoading: !isHydrated,
    error,
  };
};
