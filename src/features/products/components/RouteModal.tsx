'use client';

import { X, MapPin, Navigation, Clock, Package, Car } from 'lucide-react';
import { ProductDepotInfo, RouteInfo, SearchSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreBadge } from '@/components/StoreBadge';
import { useModalA11y } from '@/lib/useModalA11y';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#DBE6DD] border border-[#BCC7D2] rounded-2xl animate-pulse" />
});

interface RouteModalProps {
  isOpen: boolean;
  selectedStore: ProductDepotInfo | null;
  totalCost?: number;
  routeInfo: RouteInfo | null;
  searchSettings: SearchSettings;
  onClose: () => void;
  onRouteFound: (info: RouteInfo) => void;
}

export function RouteModal({
  isOpen,
  selectedStore,
  totalCost,
  routeInfo,
  searchSettings,
  onClose,
  onRouteFound
}: RouteModalProps) {
  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, onClose);
  if (!isOpen || !selectedStore) {
    return null;
  }

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Alışveriş rotası" className="fixed inset-0 bg-[#253341]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 outline-none">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[#EDF3EE] border-[#BCC7D2] shadow-2xl rounded-3xl">
        <CardHeader className="pb-3 border-b border-[#BCC7D2] bg-[#DCE3EA]">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EC7D55] text-[#253341]">
                <Navigation className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[#253341] font-bold font-heading text-lg">Mağaza Rotası & Konum</span>
            </div>
            <Button 
              aria-label="Rotayı kapat"
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-[#DBE6DD] text-[#253341]"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-6 max-h-[calc(90vh-7rem)] overflow-y-auto">
          {/* Route Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#DCE3EA] border border-[#BCC7D2] rounded-2xl">
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">1</div>
              <div className="text-xs font-semibold text-[#3E5164]">Durak</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">
                {routeInfo ? `${routeInfo.distance} km` : '-- km'}
              </div>
              <div className="text-xs font-semibold text-[#3E5164]">Mesafe</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">
                {routeInfo ? (routeInfo.timeText || `${routeInfo.time} dk`) : '-- dk'}
              </div>
              <div className="text-xs font-semibold text-[#3E5164]">Tahmini Süre</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EC7D55]/30 border border-[#EC7D55]">
              <div className="text-lg font-bold font-heading text-[#253341]">{totalCost !== undefined ? `₺${totalCost.toFixed(2)}` : '—'}</div>
              <div className="text-xs font-bold text-[#253341]">Sepet toplamı</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Step */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#253341] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
                Mağaza Bilgisi
              </h3>
              
              <SingleRouteStepCard 
                selectedStore={selectedStore}
                routeInfo={routeInfo}
              />
            </div>

            {/* Map */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#253341] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
                Canlı Harita
              </h3>
              
              <div className="h-[380px] rounded-2xl overflow-hidden border border-[#BCC7D2] shadow-sm">
                <DynamicMap
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
}

function SingleRouteStepCard({ selectedStore, routeInfo }: SingleRouteStepCardProps) {
  return (
    <Card className="p-4 bg-[#DCE3EA] border-[#BCC7D2] shadow-2xs rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-[#EC7D55] text-[#253341] text-xs rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0">
            1
          </div>
          <StoreBadge name={selectedStore.marketAdi || selectedStore.depotName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-[#253341] font-heading truncate">
              {selectedStore.depotName}
            </div>
            <div className="text-xs text-[#3E5164] flex items-center gap-1.5 mt-0.5 font-medium">
              {routeInfo && (
                <>
                  <Navigation className="h-3.5 w-3.5 text-[#AB421C]" />
                  {routeInfo.distance} km
                  <Clock className="h-3.5 w-3.5 ml-1.5 text-[#3E5164]" />
                  {routeInfo.timeText || `${routeInfo.time} dk`}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-3 py-1 rounded-xl shrink-0">
          ₺{selectedStore.price}
        </div>
      </div>
      
      <div className="space-y-1.5 p-2.5 rounded-2xl bg-[#EDF3EE] border border-[#BCC7D2]/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#3E5164]">
            <Package className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
            <span className="line-clamp-1 font-bold text-[#253341]">Hedef Mağaza Ürünü</span>
          </div>
          <span className="font-bold text-[#253341]">₺{selectedStore.price}</span>
        </div>
      </div>
    </Card>
  );
}
