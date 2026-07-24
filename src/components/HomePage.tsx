'use client';

import { useState } from 'react';
import { MapPin, Store, Navigation, Search, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULTS } from '@/constants';
import { AddressSearch } from '@/features/address/components/AddressSearch';
import { DistanceSelect } from '@/features/markets/components/DistanceSelect';
import { MarketList } from '@/features/markets/components/MarketList';
import { useMarketSearch } from '@/features/markets/hooks/useMarketSearch';
import { useAppStore } from '@/store/useAppStore';
import { MarketSearchRequest, ParsedAddress } from '@/types';

export default function HomePage() {
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(DEFAULTS.DISTANCE_KM);

  const {
    setSelectedAddress: setStoreAddress,
    setSelectedDistance: setStoreDistance,
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
    refetch: refetchMarkets,
  } = useMarketSearch(marketSearchRequest);

  const handleAddressSelect = (address: ParsedAddress | null) => {
    setSelectedAddress(address);
    setStoreAddress(address);
  };

  const handleDistanceSelect = (distance: number) => {
    setSelectedDistance(distance);
    setStoreDistance(distance);
  };

  const shouldShowMarkets = selectedAddress && selectedDistance > 0;

  return (
    <div className="min-h-screen bg-[#FFEBD3] text-[#2D1E12] py-10 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Minimal Hero Banner Section */}
        <section className="text-center space-y-2 py-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#2D1E12] tracking-tight">
            Yakınınızdaki En Uygun Marketleri <span className="bg-[#9BCEC1] text-[#0E2C24] px-2.5 py-0.5 rounded-xl inline-block">Keşfedin</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#70372D] max-w-xl mx-auto">
            Konumunuzu seçin, istediğiniz mesafedeki zincir ve yerel marketleri anında listeleyin ve yapay zeka ile en uygun fiyatlı alışveriş rotanızı oluşturun.
          </p>
        </section>

        {/* Search & Configuration Stack */}
        <div className="space-y-6">
          {/* Location Selection Card */}
          <Card className="bg-[#FFECE8] border-[#F7A898] shadow-md rounded-3xl overflow-visible relative z-30">
            <CardHeader className="pb-4 border-b border-[#F7A898]/40">
              <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#2D1E12]">
                <div className="p-2.5 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] shadow-2xs">
                  <MapPin className="h-5 w-5 stroke-[2.5]" />
                </div>
                1. Konum Belirleme
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-[#70372D]">
                Market araması yapacağınız adresi girin veya listeden seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                selectedAddress={selectedAddress}
                isLoading={false}
                placeholder="Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara"
              />
            </CardContent>
          </Card>

          {/* Distance Selection Card */}
          {selectedAddress && (
            <Card className="bg-[#FFECE8] border-[#F7A898] shadow-md rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-4 border-b border-[#F7A898]/40">
                <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#2D1E12]">
                  <div className="p-2.5 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] shadow-2xs">
                    <Navigation className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  2. Arama Yarıçapı (Mesafe)
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-[#70372D]">
                  Seçili Konum: <span className="font-bold text-[#2D1E12]">{selectedAddress.neighborhood}, {selectedAddress.district}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DistanceSelect
                  value={selectedDistance}
                  onValueChange={handleDistanceSelect}
                  disabled={isMarketsLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Markets List Section */}
          {shouldShowMarkets && (
            <Card className="bg-[#FFECE8] border-[#F7A898] shadow-lg rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-400">
              <CardHeader className="pb-4 border-b border-[#F7A898]/40">
                <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#2D1E12]">
                  <div className="p-2.5 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] shadow-2xs">
                    <Store className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  Bulunan Marketler
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-[#70372D]">
                  {selectedAddress.neighborhood}, {selectedAddress.district} konumunun <span className="font-bold text-[#0E2C24] bg-[#9BCEC1] px-1.5 py-0.5 rounded-md">{selectedDistance} km</span> yakınındaki marketler
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MarketList
                  markets={markets}
                  distance={selectedDistance}
                  selectedAddress={selectedAddress}
                  isLoading={isMarketsLoading}
                  error={marketsError}
                  onRetry={() => refetchMarkets()}
                />
              </CardContent>
            </Card>
          )}

          {/* Empty State Prompt */}
          {!selectedAddress && (
            <Card className="text-center bg-[#FFECE8] border-[#F7A898] rounded-3xl p-6 shadow-xs">
              <CardContent className="p-8 space-y-4">
                <div className="p-5 rounded-full bg-[#FFEBD3] border border-[#F7A898] w-16 h-16 mx-auto flex items-center justify-center text-[#4A1E17] shadow-2xs">
                  <Search className="h-8 w-8 text-[#0E2C24]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-bold font-heading text-lg text-[#2D1E12]">
                    Aramaya Başlamak İçin Konum Girin
                  </h3>
                  <p className="text-xs font-medium text-[#70372D] leading-relaxed">
                    Yukarıdaki adres arama kutusuna mahalle, ilçe veya adres bilgilerinizi yazarak etrafınızdaki zincir ve yerel marketleri listeleyebilirsiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modern Footer */}
        <footer className="text-center pt-8 pb-12 border-t border-[#F7A898]/40 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#4A1E17]">
            <ShieldCheck className="h-4 w-4 text-[#0E2C24]" />
            <span>MarketAI • Akıllı Alışveriş ve Market Deneyimi</span>
          </div>
          <p className="text-[11px] font-semibold text-[#70372D]">
            60-30-10 Tasarım Sistemi • Next.js 15 • TypeScript • Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
