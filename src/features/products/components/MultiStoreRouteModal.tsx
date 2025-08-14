import { X, Navigation, Clock, MapPin, Package, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RouteStep, SearchSettings } from '@/types';
import { getMarketLogo } from '@/lib/utils';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/DynamicMap.jsx'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
});

interface MultiStoreRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeSteps: RouteStep[];
  searchSettings: SearchSettings;
  realRouteDistance?: number; // Gerçek rota mesafesi (km)
  realRouteTime?: number; // Gerçek rota süresi (dakika)
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

  // Gerçek rota bilgisi varsa onu kullan, yoksa kuş uçuşu hesaplama yap
  const totalDistance = realRouteDistance || routeSteps.reduce((sum, step) => sum + (step.distanceFromPrevious || 0), 0);
  const totalTime = realRouteTime || routeSteps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
  const totalCost = routeSteps.reduce(
    (sum, step) => sum + step.items.reduce((itemSum, item) => itemSum + item.selectedDepot.price, 0), 
    0
  );

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
              <div className="text-lg font-bold text-blue-600">{routeSteps.length}</div>
              <div className="text-xs text-muted-foreground">Durak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{totalDistance.toFixed(1)} km</div>
              <div className="text-xs text-muted-foreground">Mesafe</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">~{Math.round(totalTime)} dk</div>
              <div className="text-xs text-muted-foreground">Süre</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">₺{totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Toplam</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Rota Adımları
              </h3>
              
              {routeSteps.map((step, index) => (
                <RouteStepCard key={index} step={step} />
              ))}
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
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {step.stepNumber}
          </div>
          {marketLogo && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <Image
                src={marketLogo}
                alt={step.marketName}
                width={20}
                height={20}
                className="max-w-5 max-h-5 object-contain rounded"
              />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{step.depot.depotName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {step.distanceFromPrevious && (
                <>
                  <Navigation className="h-3 w-3" />
                  {step.distanceFromPrevious.toFixed(1)} km
                </>
              )}
              {step.estimatedTime && (
                <>
                  <Clock className="h-3 w-3 ml-2" />
                  ~{Math.round(step.estimatedTime)} dk
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-green-600">
          ₺{stepTotal.toFixed(2)}
        </div>
      </div>
      
      <div className="space-y-1 ml-8">
        {step.items.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="line-clamp-1">{item.product.title}</span>
            </div>
            <span className="font-medium">₺{item.selectedDepot.price}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
