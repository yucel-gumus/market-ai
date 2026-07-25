'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Store, Map, List, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { DEFAULTS } from '@/constants';
import { useMarketFiltering } from '@/features/markets/hooks/useMarketFiltering';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Market, ParsedAddress } from '@/types';
import { MarketFilter } from './MarketFilter';
import { MarketCard } from './MarketCard';
import { LoadingState, ErrorState, EmptyState } from './MarketListStates';

const MarketMap = dynamic(() => import('@/components/MarketMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-[#FFECE8] border border-[#F7A898] rounded-2xl"
      style={{ height: '400px', width: '100%' }}
      role="status"
      aria-label="Harita yükleniyor"
    >
      <div className="text-center text-sm font-semibold text-[#70372D]">Harita yükleniyor...</div>
    </div>
  ),
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
  distance = DEFAULTS.DISTANCE_KM,
  selectedAddress = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: MarketListProps) {
  const router = useRouter();
  const saveMarketSelection = useAppStore((s) => s.saveMarketSelection);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    markets: filteredMarkets,
    uniqueBrands,
    selectedBrands,
    hiddenMarkets,
    toggleBrand,
    toggleMarket,
    visibleCount,
  } = useMarketFiltering(markets);

  const handleMarkerClick = (market: Market) => {
    toggleMarket(market);
  };

  const getSelectedMarkets = (): Market[] =>
    filteredMarkets.filter((market) => {
      const marketKey =
        market.id ||
        `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
      return !hiddenMarkets.has(marketKey);
    });

  const handleSaveAndNavigate = (destination: '/ai-chat' | '/product-search') => {
    setSaveError(null);
    const selectedMarkets = getSelectedMarkets();

    if (selectedMarkets.length === 0) {
      setSaveError('Devam etmek için en az bir market seçin.');
      return;
    }

    try {
      saveMarketSelection({
        distance,
        selectedAddress,
        selectedMarkets,
        totalMarkets: markets.length,
      });
      router.push(destination);
    } catch {
      setSaveError('Veriler kaydedilirken bir hata oluştu.');
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
    <div className={cn('w-full space-y-4', className)}>
      <MarketFilter
        uniqueBrands={uniqueBrands}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
      />

      <div className="flex items-center justify-between bg-[#FFECE8] p-3 rounded-2xl border border-[#F7A898]/70 shadow-2xs">
        <div className="flex items-center gap-2 text-sm text-[#2D1E12]">
          <Store className="h-5 w-5 text-[#9BCEC1] stroke-[2.5]" aria-hidden />
          <span className="font-bold">{markets.length} Market Bulundu</span>
          <span className="text-xs bg-[#9BCEC1] text-[#0E2C24] font-bold px-2 py-0.5 rounded-lg ml-1">
            {visibleCount} seçili
          </span>
        </div>

        <div
          className="flex rounded-xl bg-[#FFEBD3] p-1 border border-[#F7A898]/50"
          role="group"
          aria-label="Görünüm modu"
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
              viewMode === 'list'
                ? 'bg-[#9BCEC1] text-[#0E2C24] shadow-xs'
                : 'text-[#70372D] hover:bg-[#FFB6A6]/30'
            )}
          >
            <List className="h-4 w-4" />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
              viewMode === 'map'
                ? 'bg-[#9BCEC1] text-[#0E2C24] shadow-xs'
                : 'text-[#70372D] hover:bg-[#FFB6A6]/30'
            )}
          >
            <Map className="h-4 w-4" />
            Harita
          </button>
        </div>
      </div>

      {saveError && (
        <InlineAlert
          message={saveError}
          className="mb-3"
          onDismiss={() => setSaveError(null)}
        />
      )}

      {visibleCount > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => handleSaveAndNavigate('/ai-chat')}
            className="bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] font-bold h-12 rounded-2xl shadow-sm text-sm"
          >
            <span>Kensai ile Devam Et ({visibleCount} Market)</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSaveAndNavigate('/product-search')}
            className="bg-[#FFB6A6] text-[#4A1E17] hover:bg-[#FA9E8B] font-bold h-12 rounded-2xl shadow-2xs text-sm"
          >
            <span>Ürün Aramaya Git ({visibleCount} Market)</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : (
        <InlineAlert
          variant="warning"
          message="Devam etmek için en az bir market seçmelisiniz."
          role="status"
        />
      )}

      {viewMode === 'map' ? (
        <div className="space-y-3">
          <MarketMap
            userLocation={selectedAddress}
            markets={filteredMarkets}
            hiddenMarkets={hiddenMarkets}
            onMarkerClick={handleMarkerClick}
          />
          <p className="text-center text-xs font-semibold text-[#70372D]">
            Haritada marker ikonlarına tıklayarak marketleri seçebilir veya filtreleyebilirsiniz
          </p>
        </div>
      ) : (
        <div className="h-96 space-y-3 overflow-y-auto pr-2">
          {filteredMarkets.map((market, index) => {
            const marketKey =
              market.id ||
              `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
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
