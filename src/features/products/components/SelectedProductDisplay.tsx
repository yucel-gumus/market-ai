'use client';

import Image from 'next/image';
import { Package, Store, Ruler, X, MapPin, Trophy, Navigation } from 'lucide-react';
import { Product, ProductDepotInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarketLogo } from '@/lib/utils';

interface SelectedProductDisplayProps {
  product: Product;
  onClear: () => void;
  onShowRoute: (depot: ProductDepotInfo) => void;
  getMarketDistance: (marketId: string) => number | null;
  getMarketDistanceByName: (depotName: string) => number | null;
}

export function SelectedProductDisplay({
  product,
  onClear,
  onShowRoute,
  getMarketDistance,
  getMarketDistanceByName
}: SelectedProductDisplayProps) {
  return (
    <Card className="mb-6 border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            <span className="text-green-700 dark:text-green-300">Seçilen Ürün</span>
          </div>
          <Button 
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-lg line-clamp-2">
            {product.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ölçü:</span>
            <span className="font-medium">
              {product.refinedVolumeOrWeight || 'Belirtilmemiş'}
            </span>
          </div>
        </div>

        {product.productDepotInfoList && product.productDepotInfoList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Mevcut Mağazalar ({product.productDepotInfoList.length})</h4>
            </div>
            <div className="grid gap-3">
              {product.productDepotInfoList
                .sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()))
                .map((depot, index) => (
                  <StoreItem
                    key={index}
                    depot={depot}
                    index={index}
                    onShowRoute={() => onShowRoute(depot)}
                    getMarketDistance={getMarketDistance}
                    getMarketDistanceByName={getMarketDistanceByName}
                  />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StoreItemProps {
  depot: ProductDepotInfo;
  index: number;
  onShowRoute: () => void;
  getMarketDistance: (marketId: string) => number | null;
  getMarketDistanceByName: (depotName: string) => number | null;
}

function StoreItem({ 
  depot, 
  index, 
  onShowRoute, 
  getMarketDistance,
  getMarketDistanceByName 
}: StoreItemProps) {
  const distance = getMarketDistance(depot.depotId) || 
                  getMarketDistanceByName(depot.depotName);
  
  const logoPath = getMarketLogo(depot.marketAdi || '');

  return (
    <Card className={`relative p-4 ${index === 0 ? 'ring-2 ring-green-200 bg-green-50/30' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-foreground">
                {depot.depotName}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {logoPath ? (
                <div className="flex items-center gap-2">
                  <Image
                    src={logoPath}
                    alt={depot.marketAdi || 'Market'}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {depot.marketAdi?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              ) : (
                <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {depot.marketAdi?.toUpperCase() || 'N/A'}
                </div>
              )}
            </div>
          </div>

          {index === 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
              <Trophy className="h-3 w-3" />
              En Ucuz
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-muted-foreground">Fiyat</span>
              <p className="font-semibold text-green-600">{depot.price} ₺</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Mesafe</span>
              <p className="font-medium text-foreground text-xs">
                {distance ? `~${(distance / 1000).toFixed(1)} km (kuş uçuşu)` : 'Bilinmiyor'}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onShowRoute}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!depot.latitude || !depot.longitude}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Rota Göster
        </Button>
      </div>
    </Card>
  );
}
