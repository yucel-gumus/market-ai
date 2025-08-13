import { useState, useEffect } from 'react';
import { SearchSettings } from '@/types';
import { safeIncludes } from '@/lib/stringUtils';

/**
 * localStorage'dan marketSearchData verilerini çeken hook
 */
export const useLocalStorageSettings = () => {
  const [searchSettings, setSearchSettings] = useState<SearchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const marketSearchData = localStorage.getItem('marketSearchData');
      
      if (!marketSearchData) {
        setError('Market verileri bulunamadı. Önce ana sayfadan adres ve market seçimi yapınız.');
        return;
      }

      const data = JSON.parse(marketSearchData);
      
      if (!data.selectedAddress || !data.selectedMarkets) {
        setError('Eksik veri. Önce ana sayfadan adres ve market seçimi yapınız.');
        return;
      }

      const settings: SearchSettings = {
        latitude: data.selectedAddress.latitude,
        longitude: data.selectedAddress.longitude,
        distance: data.distance || 5,
        pages: 0,
        size: 50,
        depots: data.selectedMarkets.map((market: { id: string }) => market.id),
        selectedMarkets: data.selectedMarkets
      };

      setSearchSettings(settings);
    } catch (err) {
      console.error('LocalStorage okuma hatası:', err);
      setError('Veri okuma hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Market ID'sine göre mesafe bilgisi getirir
   */
  const getMarketDistance = (marketId: string): number | null => {
    if (!searchSettings) return null;
    
    // Önce depotId ile eşleştir
    const market = searchSettings.selectedMarkets.find(m => m.id === marketId);
    return market ? market.distance : null;
  };

  /**
   * Market adına göre mesafe bilgisi getirir (fallback)
   */
  const getMarketDistanceByName = (depotName: string): number | null => {
    if (!searchSettings || !depotName) return null;
    
    const market = searchSettings.selectedMarkets.find(m => 
      safeIncludes(depotName, m.address)
    );
    
    return market ? market.distance : null;
  };

  return {
    searchSettings,
    isLoading,
    error,
    getMarketDistance,
    getMarketDistanceByName
  };
};
