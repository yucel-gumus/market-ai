'use client';

import Image from 'next/image';
import { X, MapPin, Navigation, Clock, Package, Car } from 'lucide-react';
import { ProductDepotInfo, RouteInfo, SearchSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarketLogo } from '@/lib/utils';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-8xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span>Alışveriş Rotası</span>
            </div>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Route Summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">1</div>
              <div className="text-xs text-muted-foreground">Durak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {routeInfo ? `${routeInfo.distance} km` : '-- km'}
              </div>
              <div className="text-xs text-muted-foreground">Mesafe</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {routeInfo ? (routeInfo.timeText || `${routeInfo.time} dk`) : '-- dk'}
              </div>
              <div className="text-xs text-muted-foreground">Süre</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">₺{selectedStore.price}</div>
              <div className="text-xs text-muted-foreground">Toplam</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Step */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Rota Adımları
              </h3>
              
              <SingleRouteStepCard 
                selectedStore={selectedStore}
                routeInfo={routeInfo}
                logoPath={logoPath}
              />
            </div>

            {/* Map */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Harita
              </h3>
              
              <div className="h-[450px] rounded-lg overflow-hidden">
                <DynamicMap
                  center={[searchSettings.latitude, searchSettings.longitude]}
                  userCoords={{
                    lat: searchSettings.latitude,
                    lng: searchSettings.longitude
                  }}
                  selectedStore={selectedStore}
                  onRouteFound={onRouteFound}
                  searchSettings={searchSettings}
                  showRoute={true}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SingleRouteStepCardProps {
  selectedStore: ProductDepotInfo;
  routeInfo: RouteInfo | null;
  logoPath: string | null;
}

function SingleRouteStepCard({ selectedStore, routeInfo, logoPath }: SingleRouteStepCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            1
          </div>
          {logoPath && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <Image
                src={logoPath}
                alt={selectedStore.marketAdi || 'Market'}
                width={20}
                height={20}
                className="max-w-5 max-h-5 object-contain rounded"
              />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{selectedStore.depotName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {routeInfo && (
                <>
                  <Navigation className="h-3 w-3" />
                  {routeInfo.distance} km
                  <Clock className="h-3 w-3 ml-2" />
                  {routeInfo.timeText || `${routeInfo.time} dk`}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-green-600">
          ₺{selectedStore.price}
        </div>
      </div>
      
      <div className="space-y-1 ml-8">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="line-clamp-1">Tek mağaza alışverişi</span>
          </div>
          <span className="font-medium">₺{selectedStore.price}</span>
        </div>
      </div>
    </Card>
  );
}
