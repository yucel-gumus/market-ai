import { X, Navigation, Clock, MapPin, Package, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RouteStep, SearchSettings } from '@/types';
import { getMarketLogo } from '@/lib/utils';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#FFECE8] border border-[#F7A898] rounded-2xl animate-pulse" />
});

interface MultiStoreRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeSteps: RouteStep[];
  searchSettings: SearchSettings;
  realRouteDistance?: number; 
  realRouteTime?: number;
  onMultiRouteFound?: (routeData: { distance: number; time: number }) => void;
}

export function MultiStoreRouteModal({ 
  isOpen, 
  onClose, 
  routeSteps, 
  searchSettings,
  realRouteDistance,
  realRouteTime,
  onMultiRouteFound
}: MultiStoreRouteModalProps) {
  if (!isOpen || !routeSteps || routeSteps.length === 0) return null;

  const totalDistance = realRouteDistance || routeSteps.reduce((sum, step) => sum + (step.distanceFromPrevious || 0), 0);
  const totalTime = realRouteTime || routeSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
  const totalCost = routeSteps.reduce(
    (sum, step) => sum + step.items.reduce((itemSum, item) => itemSum + item.selectedDepot.price, 0), 
    0
  );

  return (
    <div className="fixed inset-0 bg-[#2D1E12]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-[#FFEBD3] border-[#F7A898] shadow-2xl rounded-3xl">
        <CardHeader className="pb-3 border-b border-[#F7A898]/50 bg-[#FFECE8]">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#9BCEC1] text-[#0E2C24]">
                <Navigation className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[#2D1E12] font-bold font-heading text-lg">Optimum Çoklu Mağaza Rotası</span>
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
              <div className="text-lg font-bold font-heading text-[#2D1E12]">{routeSteps.length}</div>
              <div className="text-xs font-semibold text-[#70372D]">Toplam Durak</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#FFEBD3]">
              <div className="text-lg font-bold font-heading text-[#0E2C24]">{totalDistance.toFixed(1)} km</div>
              <div className="text-xs font-semibold text-[#70372D]">Toplam Mesafe</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#FFEBD3]">
              <div className="text-lg font-bold font-heading text-[#4A1E17]">~{Math.round(totalTime)} dk</div>
              <div className="text-xs font-semibold text-[#70372D]">Tahmini Süre</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#9BCEC1]/40 border border-[#9BCEC1]">
              <div className="text-lg font-bold font-heading text-[#0E2C24]">₺{totalCost.toFixed(2)}</div>
              <div className="text-xs font-bold text-[#0E2C24]">Toplam Tutar</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Steps */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#2D1E12] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
                Sırasıyla Uğranacak Mağazalar
              </h3>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {routeSteps.map((step, index) => (
                  <RouteStepCard key={index} step={step} />
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading text-sm text-[#2D1E12] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
                Canlı Rota Haritası
              </h3>
              
              <div className="h-[400px] rounded-2xl overflow-hidden border border-[#F7A898]/70 shadow-sm">
                <DynamicMap
                  center={[searchSettings.latitude, searchSettings.longitude]}
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
    </div>
  );
}

interface RouteStepCardProps {
  step: RouteStep;
}

function RouteStepCard({ step }: RouteStepCardProps) {
  const marketLogo = getMarketLogo(step.marketName);
  const stepTotal = step.items.reduce((sum, item) => sum + item.selectedDepot.price, 0);

  return (
    <Card className="p-4 bg-[#FFECE8] border-[#F7A898]/70 shadow-2xs rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-[#9BCEC1] text-[#0E2C24] text-xs rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0">
            {step.stepNumber}
          </div>
          {marketLogo ? (
            <div className="relative h-7 w-16 shrink-0 flex items-center justify-center bg-[#f5d3b3] p-1 rounded-xl border border-[#F7A898]/60 shadow-2xs">
              <Image
                src={marketLogo}
                alt={step.marketName}
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
              {step.depot.depotName}
            </div>
            <div className="text-xs text-[#70372D] flex items-center gap-1.5 font-medium">
              {step.distanceFromPrevious && (
                <>
                  <Navigation className="h-3 w-3 text-[#0E2C24]" />
                  {step.distanceFromPrevious.toFixed(1)} km
                </>
              )}
              {step.estimatedTime && (
                <>
                  <Clock className="h-3 w-3 ml-1.5 text-[#4A1E17]" />
                  ~{Math.round(step.estimatedTime)} dk
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs font-bold text-[#0E2C24] bg-[#9BCEC1] px-2.5 py-1 rounded-xl shrink-0">
          ₺{stepTotal.toFixed(2)}
        </div>
      </div>
      
      <div className="space-y-2 p-2.5 rounded-2xl bg-[#FFEBD3] border border-[#F7A898]/40">
        {step.items.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#70372D] min-w-0 flex-1">
              <div className="relative h-9 w-9 shrink-0 rounded-xl bg-white border border-[#F7A898]/40 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    unoptimized
                    className="object-contain p-0.5"
                  />
                ) : (
                  <Package className="h-4 w-4 text-[#9BCEC1] stroke-[2]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="line-clamp-1 font-bold text-[#2D1E12]">{item.product.title}</span>
                {item.product.refinedVolumeOrWeight && (
                  <span className="block text-[10px] text-[#70372D] font-medium">{item.product.refinedVolumeOrWeight}</span>
                )}
              </div>
            </div>
            <span className="font-bold text-[#2D1E12] shrink-0">₺{item.selectedDepot.price}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
