'use client';

import Image from 'next/image';
import { X, MapPin, Store, Navigation, Clock, Route } from 'lucide-react';
import { ProductDepotInfo, RouteInfo, SearchSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarketLogo } from '@/lib/utils';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
      <div className="text-center space-y-2">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
        <p className="text-muted-foreground">Harita yükleniyor...</p>
      </div>
    </div>
  )
});

interface RouteModalProps {
  isOpen: boolean;
  selectedStore: ProductDepotInfo | null;
  routeInfo: RouteInfo | null;
  searchSettings: SearchSettings;
  onClose: () => void;
  onRouteFound: (info: RouteInfo) => void;
}

export function RouteModal({
  isOpen,
  selectedStore,
  routeInfo,
  searchSettings,
  onClose,
  onRouteFound
}: RouteModalProps) {
  if (!isOpen || !selectedStore) {
    return null;
  }

  const logoPath = getMarketLogo(selectedStore.marketAdi || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-8 bg-background rounded-lg shadow-2xl border overflow-hidden">
        <Card className="h-full border-0 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedStore.depotName} - Yol Tarifi
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-2">
                    {logoPath ? (
                      <div className="flex items-center gap-2">
                        <Image
                          src={logoPath}
                          alt={selectedStore.marketAdi || 'Market'}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="text-xs font-medium">
                          {selectedStore.marketAdi?.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        <span>{selectedStore.marketAdi?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{selectedStore.price} ₺</span>
                  </div>
                </div>
              </div>
            </CardTitle>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          {routeInfo && (
            <RouteInfoDisplay routeInfo={routeInfo} />
          )}

          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full min-h-96">
              <DynamicMap
                center={[searchSettings.latitude, searchSettings.longitude]}
                userCoords={{
                  lat: searchSettings.latitude,
                  lng: searchSettings.longitude
                }}
                selectedStore={selectedStore}
                onRouteFound={onRouteFound}
                searchSettings={searchSettings}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface RouteInfoDisplayProps {
  routeInfo: RouteInfo;
}

function RouteInfoDisplay({ routeInfo }: RouteInfoDisplayProps) {
  return (
    <div className="px-6 py-4 border-b bg-muted/20">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-blue-600">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">{routeInfo.distance} km</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            {routeInfo.timeText || `${routeInfo.time} dk`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-purple-600">
          <Route className="h-4 w-4" />
          <span className="font-medium">{routeInfo.routeType || 'Arabayla'}</span>
        </div>
        {routeInfo.error && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-xs">⚠️ {routeInfo.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
