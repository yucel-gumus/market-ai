import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS, STORAGE_KEYS } from '@/constants';
import { Market, MarketSearchSession, ParsedAddress } from '@/types';

interface AppState {
  selectedAddress: ParsedAddress | null;
  selectedDistance: number;
  marketSession: MarketSearchSession | null;

  setSelectedAddress: (address: ParsedAddress | null) => void;
  setSelectedDistance: (distance: number) => void;
  setMarketSession: (session: MarketSearchSession | null) => void;
  saveMarketSelection: (payload: {
    distance: number;
    selectedAddress: ParsedAddress | null;
    selectedMarkets: Market[];
    totalMarkets: number;
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedAddress: null,
      selectedDistance: DEFAULTS.DISTANCE_KM,
      marketSession: null,

      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setSelectedDistance: (distance) => set({ selectedDistance: distance }),
      setMarketSession: (session) => set({ marketSession: session }),

      saveMarketSelection: ({ distance, selectedAddress, selectedMarkets, totalMarkets }) => {
        const session: MarketSearchSession = {
          distance,
          selectedAddress,
          selectedMarkets,
          timestamp: new Date().toISOString(),
          totalMarkets,
          selectedCount: selectedMarkets.length,
        };
        set({
          marketSession: session,
          selectedAddress,
          selectedDistance: distance,
        });
        // Geriye dönük: clientMarketSearch aynı key'i okur
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEYS.MARKET_SEARCH, JSON.stringify(session));
          } catch {
            /* ignore quota */
          }
        }
      },
    }),
    {
      name: 'market-ai-app',
      partialize: (state) => ({
        selectedAddress: state.selectedAddress,
        selectedDistance: state.selectedDistance,
        marketSession: state.marketSession,
      }),
    }
  )
);
