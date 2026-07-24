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
  loading: () => <div className="h-96 bg-[#FFECE8] border border-[#F7A898] rounded-2xl animate-pulse" />
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
    <div className="fixed inset-0 bg-[#2D1E12]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[#FFEBD3] border-[#F7A898] shadow-2xl rounded-3xl">
        <CardHeader className="pb-3 border-b border-[#F7A898]/50 bg-[#FFECE8]">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#9BCEC1] text-[#0E2C24]">
                <Navigation className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[#2D1E12] font-bold font-heading text-lg">Mağaza Rotası & Konum</span>
            </div>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-[#FFB6A6]/40 text-[#4A1E17]"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-6 max-h-[calc(90vh-7rem)] overflow-y-auto">
          {/* Route Summary */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-[#FFECE8] border border-[#F7A898]/60 rounded-2xl">
            <div className="text-center p-2 rounded-xl bg-[#FFEBD3]">
              <div className="text-lg font-bold font-heading text-[#2D1E12]">1</div>
              <div className="text-xs font-semibold text-[#70372D]">Durak</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#FFEBD3]">
              <div className="text-lg font-bold font-heading text-[#0E2C24]">
                {routeInfo ? `${routeInfo.distance} km` : '-- km'}
              </div>
              <div className="text-xs font-semibold text-[#70372D]">Mesafe</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#FFEBD3]">
              <div className="text-lg font-bold font-heading text-[#4A1E17]">
                {routeInfo ? (routeInfo.timeText || `${routeInfo.time} dk`) : '-- dk'}
              </div>
              <div className="text-xs font-semibold text-[#70372D]">Tahmini Süre</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#9BCEC1]/40 border border-[#9BCEC1]">
              <div className="text-lg font-bold font-heading text-[#0E2C24]">₺{selectedStore.price}</div>
              <div className="text-xs font-bold text-[#0E2C24]">Tutar</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Step */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#2D1E12] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
                Mağaza Bilgisi
              </h3>
              
              <SingleRouteStepCard 
                selectedStore={selectedStore}
                routeInfo={routeInfo}
                logoPath={logoPath}
              />
            </div>

            {/* Map */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#2D1E12] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
                Canlı Harita
              </h3>
              
              <div className="h-[380px] rounded-2xl overflow-hidden border border-[#F7A898]/70 shadow-sm">
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
    <Card className="p-4 bg-[#FFECE8] border-[#F7A898]/70 shadow-2xs rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-[#9BCEC1] text-[#0E2C24] text-xs rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0">
            1
          </div>
          {logoPath ? (
            <div className="relative h-7 w-16 shrink-0 flex items-center justify-center bg-[#f5d3b3] p-1 rounded-xl border border-[#F7A898]/60 shadow-2xs">
              <Image
                src={logoPath}
                alt={selectedStore.marketAdi || 'Market'}
                fill
                unoptimized
                className="object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-[#FFEBD3]">
              <Package className="h-4 w-4 text-[#2D1E12]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-[#2D1E12] font-heading truncate">
              {selectedStore.depotName}
            </div>
            <div className="text-xs text-[#70372D] flex items-center gap-1.5 mt-0.5 font-medium">
              {routeInfo && (
                <>
                  <Navigation className="h-3.5 w-3.5 text-[#0E2C24]" />
                  {routeInfo.distance} km
                  <Clock className="h-3.5 w-3.5 ml-1.5 text-[#4A1E17]" />
                  {routeInfo.timeText || `${routeInfo.time} dk`}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-[#0E2C24] bg-[#9BCEC1] px-3 py-1 rounded-xl shrink-0">
          ₺{selectedStore.price}
        </div>
      </div>
      
      <div className="space-y-1.5 p-2.5 rounded-2xl bg-[#FFEBD3] border border-[#F7A898]/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#70372D]">
            <Package className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
            <span className="line-clamp-1 font-bold text-[#2D1E12]">Hedef Mağaza Ürünü</span>
          </div>
          <span className="font-bold text-[#2D1E12]">₺{selectedStore.price}</span>
        </div>
      </div>
    </Card>
  );
}
