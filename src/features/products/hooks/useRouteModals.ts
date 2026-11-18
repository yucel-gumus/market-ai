'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RouteLeg } from '@/features/products/components/MultiStoreRouteModal';
import { coordsOf } from '@/lib/shoppingUtils';
import type { OptimizedShopping, ProductDepotInfo, RouteInfo } from '@/types';

/** Tek şube ve çoklu-durak rota modal durumlarını ve sıfırlamalarını merkezileştirir. */
export function useRouteModals(
  optimization: OptimizedShopping | null,
  onError: (message: string) => void
) {
  const [showSingleMap, setShowSingleMap] = useState(false);
  const [showMultiMap, setShowMultiMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ProductDepotInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [realRouteDistance, setRealRouteDistance] = useState<number | undefined>();
  const [realRouteTime, setRealRouteTime] = useState<number | undefined>();
  const [realRouteLegs, setRealRouteLegs] = useState<RouteLeg[] | undefined>();

  useEffect(() => {
    setShowSingleMap(false);
    setShowMultiMap(false);
    setSelectedStore(null);
    setRealRouteDistance(undefined);
    setRealRouteTime(undefined);
    setRealRouteLegs(undefined);
  }, [optimization]);

  const openSingleRoute = useCallback(
    (depot: ProductDepotInfo) => {
      if (!coordsOf(depot)) {
        onError('Mağaza konumu bulunamadı.');
        return;
      }
      setSelectedStore(depot);
      setShowSingleMap(true);
      setRouteInfo(null);
    },
    [onError]
  );

  const openMultiRoute = useCallback(() => setShowMultiMap(true), []);

  const closeMaps = useCallback(() => {
    setShowSingleMap(false);
    setShowMultiMap(false);
    setSelectedStore(null);
    setRouteInfo(null);
    setRealRouteDistance(undefined);
    setRealRouteTime(undefined);
  }, []);

  const handleRouteFound = useCallback((info: RouteInfo) => {
    setRouteInfo((prev) =>
      !prev || prev.distance !== info.distance || prev.time !== info.time ? info : prev
    );
  }, []);

  const handleMultiRouteFound = useCallback(
    (routeData: { distance: number; time: number; legs?: RouteLeg[] }) => {
      setRealRouteDistance(routeData.distance);
      setRealRouteTime(routeData.time);
      setRealRouteLegs(routeData.legs);
    },
    []
  );

  return {
    showSingleMap,
    showMultiMap,
    selectedStore,
    routeInfo,
    realRouteDistance,
    realRouteTime,
    realRouteLegs,
    openSingleRoute,
    openMultiRoute,
    closeMaps,
    handleRouteFound,
    handleMultiRouteFound,
  };
}
