import { create } from 'zustand';
import { ParsedAddress } from '@/types';

interface AppState {
  selectedAddress: ParsedAddress | null;
  selectedDistance: number;
  isLoadingAddresses: boolean;
  isLoadingMarkets: boolean;
  
  setSelectedAddress: (address: ParsedAddress | null) => void;
  setSelectedDistance: (distance: number) => void;
  setLoadingAddresses: (loading: boolean) => void;
  setLoadingMarkets: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedAddress: null,
  selectedDistance: 5,
  isLoadingAddresses: false,
  isLoadingMarkets: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setSelectedAddress: (address: ParsedAddress | null) => {
    set({ selectedAddress: address });
  },

  setSelectedDistance: (distance: number) => {
    set({ selectedDistance: distance });
  },

  setLoadingAddresses: (loading: boolean) => {
    set({ isLoadingAddresses: loading });
  },

  setLoadingMarkets: (loading: boolean) => {
    set({ isLoadingMarkets: loading });
  },

  reset: () => {
    set(initialState);
  },
}));


export const useSelectedAddress = () => useAppStore((state) => state.selectedAddress);

export const useSelectedDistance = () => useAppStore((state) => state.selectedDistance);

export const useLoadingStates = () => useAppStore((state) => ({
  isLoadingAddresses: state.isLoadingAddresses,
  isLoadingMarkets: state.isLoadingMarkets,
}));

export const useAddressActions = () => useAppStore((state) => ({
  setSelectedAddress: state.setSelectedAddress,
  setLoadingAddresses: state.setLoadingAddresses,
}));

export const useMarketActions = () => useAppStore((state) => ({
  setSelectedDistance: state.setSelectedDistance,
  setLoadingMarkets: state.setLoadingMarkets,
}));

export const useAppActions = () => useAppStore((state) => ({
  setSelectedAddress: state.setSelectedAddress,
  setSelectedDistance: state.setSelectedDistance,
  setLoadingAddresses: state.setLoadingAddresses,
  setLoadingMarkets: state.setLoadingMarkets,
  reset: state.reset,
}));
