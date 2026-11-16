'use client';

import { MapPin, Store, Navigation, Search, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressSearch } from '@/features/address/components/AddressSearch';
import { DistanceSelect } from '@/features/markets/components/DistanceSelect';
import { MarketList } from '@/features/markets/components/MarketList';
import { useMarketSearch } from '@/features/markets/hooks/useMarketSearch';
import { useAppStore } from '@/store/useAppStore';
import { marketKey } from '@/lib/marketUtils';
import { sessionMatchesSelection } from '@/lib/locationSession';
import { MarketSearchRequest, ParsedAddress } from '@/types';

export default function HomePage() {
  // Seçim TEK kaynaktan (persist edilen store) okunur: anasayfaya dönüldüğünde
  // adres/mesafe kaybolmasın, düzenlenebilsin. Yerel state + store ikiliği, eski
  // seçimin ekranda ve aramalarda donmasına yol açıyordu.
  const selectedAddress = useAppStore((s) => s.selectedAddress);
  const selectedDistance = useAppStore((s) => s.selectedDistance);
  const marketSession = useAppStore((s) => s.marketSession);
  const setStoreAddress = useAppStore((s) => s.setSelectedAddress);
  const setStoreDistance = useAppStore((s) => s.setSelectedDistance);
  const setMarketSession = useAppStore((s) => s.setMarketSession);

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

  // Kayıtlı oturum ekrandaki adres/mesafeyle uyuşuyorsa seçim hâlâ geçerlidir.
  const sessionIsCurrent = sessionMatchesSelection(marketSession, selectedAddress, selectedDistance);

  const handleAddressSelect = (address: ParsedAddress | null) => {
    setStoreAddress(address);
    // Adres değiştiyse eski şubeler o konuma ait değil: oturum düşer, kullanıcı
    // yeni adres için market seçer. Aksi halde ürün arama/asistan eski şubeleri kullanırdı.
    if (!sessionMatchesSelection(useAppStore.getState().marketSession, address, selectedDistance)) {
      setMarketSession(null);
    }
  };

  const handleDistanceSelect = (distance: number) => {
    setStoreDistance(distance);
    if (!sessionMatchesSelection(useAppStore.getState().marketSession, selectedAddress, distance)) {
      setMarketSession(null);
    }
  };

  const shouldShowMarkets = selectedAddress && selectedDistance > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDF3EE] via-[#DBE6DD]/55 to-[#DCE3EA]/45 text-[#253341] py-10 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Minimal Hero Banner Section */}
        <section className="text-center space-y-2.5 py-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#253341] tracking-tight">
            Yakınınızdaki En Uygun Marketleri{' '}
            <span className="bg-[#EC7D55] text-[#253341] px-2.5 py-0.5 rounded-xl inline-block shadow-2xs">
              Keşfedin
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#3E5164] max-w-xl mx-auto">
            Konumunuzu seçin, istediğiniz mesafedeki zincir ve yerel marketleri anında listeleyin ve yapay zeka ile en uygun fiyatlı alışveriş rotanızı oluşturun.
          </p>
        </section>

        {/* Search & Configuration Stack */}
        <div className="space-y-6">
          {/* Location Selection Card */}
          <Card className="bg-[#DCE3EA] border-[#BCC7D2] shadow-md rounded-3xl overflow-visible relative z-30">
            <CardHeader className="pb-4 border-b border-[#BCC7D2]/70">
              <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#253341]">
                <div className="p-2.5 rounded-2xl bg-[#EC7D55] text-[#253341] shadow-2xs">
                  <MapPin className="h-5 w-5 stroke-[2.5]" />
                </div>
                1. Konum Belirleme
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-[#3E5164]">
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
            <Card className="bg-[#DCE3EA] border-[#BCC7D2] shadow-md rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-4 border-b border-[#BCC7D2]/70">
                <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#253341]">
                  <div className="p-2.5 rounded-2xl bg-[#DBE6DD] border border-[#BCC7D2] text-[#253341] shadow-2xs">
                    <Navigation className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  2. Arama Yarıçapı (Mesafe)
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-[#3E5164]">
                  Seçili Konum: <span className="font-bold text-[#253341]">{selectedAddress.neighborhood}, {selectedAddress.district}</span>
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
            <Card className="bg-[#DCE3EA] border-[#BCC7D2] shadow-lg rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-400">
              <CardHeader className="pb-4 border-b border-[#BCC7D2]/70">
                <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#253341]">
                  <div className="p-2.5 rounded-2xl bg-[#EC7D55] text-[#253341] shadow-2xs">
                    <Store className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  Bulunan Marketler
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-[#3E5164]">
                  {selectedAddress.neighborhood}, {selectedAddress.district} konumunun <span className="font-bold text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-1.5 py-0.5 rounded-md">{selectedDistance} km</span> yakınındaki marketler
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MarketList
                  markets={markets}
                  distance={selectedDistance}
                  selectedAddress={selectedAddress}
                  preselectedMarketKeys={
                    sessionIsCurrent ? marketSession!.selectedMarkets.map(marketKey) : null
                  }
                  isLoading={isMarketsLoading}
                  error={marketsError}
                  onRetry={() => refetchMarkets()}
                />
              </CardContent>
            </Card>
          )}

          {/* Empty State Prompt */}
          {!selectedAddress && (
            <Card className="text-center bg-[#DCE3EA] border-[#BCC7D2] rounded-3xl p-6 shadow-xs">
              <CardContent className="p-8 space-y-4">
                <div className="p-5 rounded-full bg-[#EDF3EE] border border-[#BCC7D2] w-16 h-16 mx-auto flex items-center justify-center text-[#253341] shadow-2xs">
                  <Search className="h-8 w-8 text-[#AB421C]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-bold font-heading text-lg text-[#253341]">
                    Aramaya Başlamak İçin Konum Girin
                  </h3>
                  <p className="text-xs font-medium text-[#3E5164] leading-relaxed">
                    Yukarıdaki adres arama kutusuna mahalle, ilçe veya adres bilgilerinizi yazarak etrafınızdaki zincir ve yerel marketleri listeleyebilirsiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modern Footer */}
        <footer className="text-center pt-8 pb-12 border-t border-[#BCC7D2]/80 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#253341]">
            <ShieldCheck className="h-4 w-4 text-[#AB421C]" />
            <span>MarketAI • Akıllı Alışveriş ve Market Deneyimi</span>
          </div>
          <p className="text-[11px] font-semibold text-[#3E5164]">
            Konumunuza en yakın marketler, gerçek fiyatlar ve tarifinize göre akıllı sepet.
          </p>
        </footer>
      </div>
    </div>
  );
}
