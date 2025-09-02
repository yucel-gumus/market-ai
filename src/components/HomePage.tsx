'use client';

import { useEffect, useState } from 'react';
// ...existing code...
import { MapPin, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressSearch } from '@/features/address/components/AddressSearch';
import { DistanceSelect } from '@/features/markets/components/DistanceSelect';
import { MarketList } from '@/features/markets/components/MarketList';
import { useMarketSearch } from '@/features/markets/hooks/useMarketSearch';
import { useAppStore } from '@/store/useAppStore';
import { MarketSearchRequest, ParsedAddress } from '@/types';

export default function HomePage() {
  // ...existing code...
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(5);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(false);

  const { 
    setSelectedAddress: setStoreAddress, 
    setSelectedDistance: setStoreDistance
  } = useAppStore();

  const marketSearchRequest: MarketSearchRequest | null = selectedAddress
    ? {
        distance: selectedDistance,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      }
    : null;

  const { 
    data: markets = [], 
    isLoading: isMarketsLoading, 
    error: marketsError,
    refetch: refetchMarkets 
  } = useMarketSearch(marketSearchRequest);

  useEffect(() => {
    setIsLoadingMarkets(isMarketsLoading);
  }, [isMarketsLoading]);

  const handleAddressSelect = (address: ParsedAddress | null) => {
    setSelectedAddress(address);
    setStoreAddress(address);
  // ...existing code...
  };

  const handleDistanceSelect = (distance: number) => {
    setSelectedDistance(distance);
    setStoreDistance(distance);
  // ...existing code...
  };

  const shouldShowMarkets = selectedAddress && selectedDistance > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              MarketAI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Yakınınızdaki marketleri kolayca bulun. Adresinizi girin, mesafeyi seçin ve 
            size en yakın marketlerin listesini görün.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Konum Seçimi
              </CardTitle>
              <CardDescription>
                Marketleri aramak istediğiniz adresi girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                selectedAddress={selectedAddress}
                isLoading={false}
                placeholder="Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara"
              />
            </CardContent>
          </Card>

          {selectedAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Mesafe Seçimi
                </CardTitle>
                <CardDescription>
                  Seçilen konum: {selectedAddress.neighborhood}, {selectedAddress.district}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DistanceSelect
                  value={selectedDistance}
                  onValueChange={handleDistanceSelect}
                  disabled={isLoadingMarkets}
                />
              </CardContent>
            </Card>
          )}

          {shouldShowMarkets && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Yakındaki Marketler
                </CardTitle>
                <CardDescription>
                  {selectedAddress.neighborhood}, {selectedAddress.district} konumunun { }
                  {selectedDistance} km yakınındaki marketler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketList
                  markets={markets}
                  distance={selectedDistance}
                  selectedAddress={selectedAddress}
                  isLoading={isLoadingMarkets}
                  error={marketsError}
                  onRetry={() => refetchMarkets()}
                />
              </CardContent>
            </Card>
          )}

          {!selectedAddress && (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted/20">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Başlamak için konum seçin
                    </h3>
                    <p className="text-sm">
                      Yukarıdaki arama alanını kullanarak bir adres arayın ve 
                      yakınınızdaki marketleri keşfedin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <footer className="text-center mt-16 pb-8">
          <div className="text-sm text-muted-foreground">
            <p>
              MarketAI - Modern teknoloji ile market bulma deneyimi
            </p>
            <p className="mt-1">
              Next.js 15 • TypeScript • Tailwind CSS • shadcn/ui
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
