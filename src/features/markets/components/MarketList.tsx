'use client';

import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Market } from '@/types';
import { useMarketFiltering } from '@/features/markets/hooks/useMarketFiltering';
import { MarketFilter } from './MarketFilter';
import { MarketCard } from './MarketCard';
import { LoadingState, ErrorState, EmptyState } from './MarketListStates';

interface MarketListProps {
  markets: Market[];
  distance?: number;
  address?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function MarketList({ 
  markets, 
  distance = 5,
  address = '',
  isLoading = false,
  error = null,
  onRetry,
  className
}: MarketListProps) {
  const router = useRouter();
  const {
    uniqueBrands,
    selectedBrands,
    hiddenMarkets,
    filteredMarkets,
    selectedMarketsCount,
    toggleBrand,
    toggleMarket
  } = useMarketFiltering(markets);

  const handleSaveAndNavigate = () => {
    try {
      const selectedMarkets = filteredMarkets
        .filter(market => {
          const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
          return !hiddenMarkets.has(marketKey);
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
        address,
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

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <span>{markets.length} market bulundu</span>
          <span className="text-xs">({selectedMarketsCount} seçili)</span>
        </div>
        
        {selectedMarketsCount > 0 && (
          <Button 
            onClick={handleSaveAndNavigate}
            size="sm" 
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Kaydet ve Devam Et</span>
              <div className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
                {selectedMarketsCount}
              </div>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
          </Button>
        )}
      </div>

      <div className="h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredMarkets.map((market, index) => {
          const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
          const isIndividualMarketSelected = !hiddenMarkets.has(marketKey);
          
          return (
            <MarketCard
              key={`${market.id}-${index}`}
              market={market}
              isVisible={isIndividualMarketSelected}
              onToggleMarket={toggleMarket}
            />
          );
        })}
      </div>
    </div>
  );
}