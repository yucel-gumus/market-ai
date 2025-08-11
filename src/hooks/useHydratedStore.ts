'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
export const useHydratedStore = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return { isHydrated };
};

export const useSelectedAddressSafe = () => {
  const { isHydrated } = useHydratedStore();
  const selectedAddress = useAppStore((state) => state.selectedAddress);
  
  if (!isHydrated) {
    return null;
  }
  
  return selectedAddress;
};
export const useSelectedDistanceSafe = () => {
  const { isHydrated } = useHydratedStore();
  const selectedDistance = useAppStore((state) => state.selectedDistance);
  
  if (!isHydrated) {
    return 5;
  }
  
  return selectedDistance;
};
export const useLoadingStatesSafe = () => {
  const { isHydrated } = useHydratedStore();
  const loadingStates = useAppStore((state) => ({
    isLoadingAddresses: state.isLoadingAddresses,
    isLoadingMarkets: state.isLoadingMarkets,
  }));
  
  if (!isHydrated) {
    return {
      isLoadingAddresses: false,
      isLoadingMarkets: false,
    };
  }
  
  return loadingStates;
};
