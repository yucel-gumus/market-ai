'use client';

import { useRouter } from 'next/navigation';
import { Store, Map, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Market, ParsedAddress } from '@/types';
import { useMarketFiltering } from '@/features/markets/hooks/useMarketFiltering';
import { MarketFilter } from './MarketFilter';
import { MarketCard } from './MarketCard';
import { LoadingState, ErrorState, EmptyState } from './MarketListStates';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const MarketMap = dynamic(() => import('@/components/MarketMap'), {
  ssr: false,
  loading: () => (
    <div 
      className="flex items-center justify-center bg-gray-100 rounded-lg" 
      style={{ height: '400px', width: '100%' }}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">🗺️</div>
        <div className="text-sm text-gray-600">Harita yükleniyor...</div>
      </div>
    </div>
  )
});

interface MarketListProps {
  markets: Market[];
  distance?: number;
  selectedAddress?: ParsedAddress | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function MarketList({ 
  markets, 
  distance = 5,
  selectedAddress = null,
  isLoading = false,
  error = null,
  onRetry,
  className
}: MarketListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const {
    markets: filteredMarkets,
    uniqueBrands,
    selectedBrands,
    hiddenMarkets,
    toggleBrand,
    toggleMarket,
    visibleCount
  } = useMarketFiltering(markets);

  const handleMarkerClick = (market: Market) => {
    // Haritada marker'a tıklandığında o market'i toggle et
    toggleMarket(market);
  };

  const handleSaveAndNavigate = () => {
    try {
      // Sadece görünür olan marketleri al (brand filtresi geçmiş VE gizlenmemiş)
      const selectedMarkets = filteredMarkets
        .filter(market => {
          const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
          return !hiddenMarkets.has(marketKey); // Gizli marketleri hariç tut
        })
        .map(market => ({
          id: market.id,
          name: market.name,
          address: market.address,
          distance: market.distance,
          latitude: market.latitude,
          longitude: market.longitude
        }));

      const marketData = {
        distance,
        selectedAddress: selectedAddress ? {
          fullAddress: selectedAddress.fullAddress,
          street: selectedAddress.street,
          neighborhood: selectedAddress.neighborhood,
          district: selectedAddress.district,
          city: selectedAddress.city,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude
        } : null,
        selectedMarkets,
        timestamp: new Date().toISOString(),
        totalMarkets: markets.length,
        selectedCount: selectedMarkets.length
      };

      localStorage.setItem('marketSearchData', JSON.stringify(marketData));
      router.push('/ai-chat');
    } catch {
      alert('Veriler kaydedilirken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} className={className} />;
  }

  if (markets.length === 0) {
    return <EmptyState className={className} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <MarketFilter 
        uniqueBrands={uniqueBrands}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4" />
          <span>{markets.length} market bulundu</span>
          <span className="text-xs">({visibleCount} seçili)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === 'list' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === 'map' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Map className="h-4 w-4" />
              Harita
            </button>
          </div>
        </div>
      </div>

      {visibleCount > 0 && (
        <Button 
          onClick={handleSaveAndNavigate}
          size="sm" 
          className="w-full mb-4 relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out group"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Kaydet ve Devam Et</span>
            <div className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
              {visibleCount}
            </div>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
        </Button>
      )}

      {viewMode === 'map' ? (
        <div className="space-y-4">
          <MarketMap
            userLocation={selectedAddress}
            markets={filteredMarkets}
            hiddenMarkets={hiddenMarkets}
            onMarkerClick={handleMarkerClick}
          />
          <div className="text-xs text-gray-500 text-center">
            💡 Haritada marker&apos;lara tıklayarak marketleri seçebilir/kaldırabilirsiniz
          </div>
        </div>
      ) : (
        <div className="h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {filteredMarkets.map((market, index) => {
            const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
            const isVisible = !hiddenMarkets.has(marketKey);
            
            return (
              <MarketCard
                key={`${market.id}-${index}`}
                market={market}
                isVisible={isVisible}
                onToggleMarket={toggleMarket}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}