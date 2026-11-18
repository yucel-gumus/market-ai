'use client';

import { useId, useRef } from 'react';
import { X, Navigation, Clock, MapPin, Package, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreBadge } from '@/components/StoreBadge';
import { RouteStep, SearchSettings } from '@/types';
import { useModalDialog } from '@/lib/useModalDialog';
import { formatBranchName } from '@/lib/stringUtils';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { itemQuantity } from '@/lib/shoppingUtils';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#DBE6DD] border border-[#BCC7D2] rounded-2xl animate-pulse" />
});

/** Araç rotasından gelen durak başına mesafe (km) ve süre (dk). */
export interface RouteLeg { distance: number; time: number }

interface MultiStoreRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeSteps: RouteStep[];
  searchSettings: SearchSettings;
  realRouteDistance?: number; 
  realRouteTime?: number;
  realRouteLegs?: RouteLeg[];
  onMultiRouteFound?: (routeData: { distance: number; time: number; legs?: RouteLeg[] }) => void;
}

export function MultiStoreRouteModal({ 
  isOpen, 
  onClose, 
  routeSteps, 
  searchSettings,
  realRouteDistance,
  realRouteTime,
  realRouteLegs,
  onMultiRouteFound
}: MultiStoreRouteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hasRoute = Boolean(isOpen && routeSteps && routeSteps.length > 0);
  const closeDialog = useModalDialog(dialogRef, hasRoute, onClose);

  // Özet ile durak satırları AYNI hesabı göstermeli: araç rotası varsa toplamlar da
  // durak bacaklarının toplamıdır. Bacak verisi boş/eksikse özet tek başına kullanılır
  // (boş dizi toplamı 0 olduğu için "length" kontrolü şart).
  const hasLegs = Boolean(realRouteLegs?.length);
  const legDistance = hasLegs ? realRouteLegs!.reduce((sum, leg) => sum + leg.distance, 0) : undefined;
  const legTime = hasLegs ? realRouteLegs!.reduce((sum, leg) => sum + leg.time, 0) : undefined;
  const useRealRoute = hasLegs || realRouteDistance !== undefined || realRouteTime !== undefined;
  const totalDistance = legDistance ?? realRouteDistance ?? routeSteps.reduce((sum, step) => sum + (step.distanceFromPrevious || 0), 0);
  const totalTime = legTime ?? realRouteTime ?? routeSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
  const totalCost = routeSteps.reduce(
    (sum, step) => sum + step.items.reduce((itemSum, item) => itemSum + Number(item.selectedDepot.price) * itemQuantity(item), 0),
    0
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="mwg-dialog m-auto w-[calc(100%-2rem)] max-w-6xl rounded-3xl shadow-2xl"
    >
      {hasRoute ? (
        <Card className="w-full max-h-[90vh] overflow-hidden bg-[#EDF3EE] border-[#BCC7D2] rounded-3xl">
          <CardHeader className="pb-3 border-b border-[#BCC7D2] bg-[#DCE3EA]">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EC7D55] text-[#253341]">
                  <Navigation className="h-5 w-5 stroke-[2.5]" />
                </div>
                <span id={titleId} className="text-[#253341] font-bold font-heading text-lg">Çoklu Mağaza Rotası</span>
              </div>
              <Button
                type="button"
                aria-label="Rotayı kapat"
                onClick={closeDialog}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-[#DBE6DD] text-[#253341]"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-6 max-h-[calc(90vh-7rem)] overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Route Summary */}
          <p className="text-xs text-[#3E5164]">{useRealRoute ? 'Mesafe ve süreler araç rotasına (OSRM) göre hesaplanmıştır; aşağıdaki durak değerlerinin toplamı özetle aynıdır.' : 'Araç rotası alınamadı; mesafeler kuş uçuşu, süreler yaklaşık yürüyüş hesabıdır. Durak sırası yaklaşık belirlenir; eve dönüş ve alışveriş süresi dahil değildir.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#DCE3EA] border border-[#BCC7D2] rounded-2xl">
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">{routeSteps.length}</div>
              <div className="text-xs font-semibold text-[#3E5164]">Toplam Durak</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">{totalDistance.toFixed(1)} km</div>
              <div className="text-xs font-semibold text-[#3E5164]">Toplam Mesafe</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EDF3EE]">
              <div className="text-lg font-bold font-heading text-[#253341]">~{Math.round(totalTime)} dk</div>
              <div className="text-xs font-semibold text-[#3E5164]">Tahmini Süre</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#EC7D55]/30 border border-[#EC7D55]">
              <div className="text-lg font-bold font-heading text-[#253341]">₺{totalCost.toFixed(2)}</div>
              <div className="text-xs font-bold text-[#253341]">Toplam Tutar</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Steps */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#253341] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
                Sırasıyla Uğranacak Mağazalar
              </h3>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {routeSteps.map((step, index) => (
                  <RouteStepCard key={index} step={step} leg={realRouteLegs?.[index]} hideEstimate={useRealRoute && !realRouteLegs?.length} />
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#253341] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
                Canlı Rota Haritası
              </h3>
              
              <div className="h-[400px] rounded-2xl overflow-hidden border border-[#BCC7D2] shadow-sm">
                <DynamicMap
                  searchSettings={searchSettings}
                  destinations={routeSteps.map(step => ({
                    latitude: step.coordinates.latitude,
                    longitude: step.coordinates.longitude,
                    name: step.depot.depotName,
                    market: step.marketName
                  }))}
                  showRoute={true}
                  onMultiRouteFound={onMultiRouteFound}
                />
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      ) : null}
    </dialog>
  );
}

interface RouteStepCardProps {
  step: RouteStep;
  /** Araç rotasından gelen bu durağa ait bacak (varsa) */
  leg?: RouteLeg;
  /** Araç rotası var ama bacak bilgisi yok: tahmini gösterme (özet ile çelişmesin) */
  hideEstimate?: boolean;
}

function RouteStepCard({ step, leg, hideEstimate }: RouteStepCardProps) {
  const stepTotal = step.items.reduce((sum, item) => sum + Number(item.selectedDepot.price) * itemQuantity(item), 0);
  const distance = leg?.distance ?? (hideEstimate ? undefined : step.distanceFromPrevious);
  const time = leg?.time ?? (hideEstimate ? undefined : step.estimatedTime);

  return (
    <Card className="p-4 bg-[#DCE3EA] border-[#BCC7D2] shadow-2xs rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-[#EC7D55] text-[#253341] text-xs rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0">
            {step.stepNumber}
          </div>
          <StoreBadge name={step.marketName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-[#253341] font-heading truncate">
              {formatBranchName(step.depot.depotName)}
            </div>
            <div className="text-xs text-[#3E5164] flex items-center gap-1.5 font-medium">
              {distance !== undefined && distance > 0 && (
                <>
                  <Navigation className="h-3 w-3 text-[#AB421C]" />
                  {distance.toFixed(1)} km
                </>
              )}
              {time !== undefined && time > 0 && (
                <>
                  <Clock className="h-3 w-3 ml-1.5 text-[#3E5164]" />
                  {leg ? `${Math.round(time)} dk` : `~${Math.round(time)} dk`}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs font-bold text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-2.5 py-1 rounded-xl shrink-0">
          ₺{stepTotal.toFixed(2)}
        </div>
      </div>
      
      <div className="space-y-2 p-2.5 rounded-2xl bg-[#EDF3EE] border border-[#BCC7D2]/80">
        {step.items.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#3E5164] min-w-0 flex-1">
              <div className="relative h-9 w-9 shrink-0 rounded-xl bg-[#F5F9F5] border border-[#BCC7D2] overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    unoptimized
                    className="object-contain p-0.5"
                  />
                ) : (
                  <Package className="h-4 w-4 text-[#AB421C] stroke-[2]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="line-clamp-1 font-bold text-[#253341]">{item.product.title}</span>
                {item.product.refinedVolumeOrWeight && (
                  <span className="block text-[10px] text-[#3E5164] font-medium">{item.product.refinedVolumeOrWeight}</span>
                )}
              </div>
            </div>
            <span className="font-bold text-[#253341] shrink-0">{itemQuantity(item)} adet · ₺{(Number(item.selectedDepot.price) * itemQuantity(item)).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
