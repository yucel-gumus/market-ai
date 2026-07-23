'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Store, Map, List } from 'lucide-react';
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
      className="flex items-center justify-center bg-gray-100 rounded-lg"
      style={{ height: '400px', width: '100%' }}
      role="status"
      aria-label="Harita yükleniyor"
    >
      <div className="text-center text-sm text-gray-600">Harita yükleniyor...</div>
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
    <div className={cn('w-full', className)}>
      <MarketFilter
        uniqueBrands={uniqueBrands}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4" aria-hidden />
          <span>{markets.length} market bulundu</span>
          <span className="text-xs">({visibleCount} seçili)</span>
        </div>

        <div
          className="flex rounded-lg bg-gray-100 p-1"
          role="group"
          aria-label="Görünüm modu"
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
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
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'map'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
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
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => handleSaveAndNavigate('/ai-chat')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white hover:from-blue-700 hover:to-purple-700"
          >
            Kaydet → AI Asistan ({visibleCount})
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSaveAndNavigate('/product-search')}
          >
            Kaydet → Ürün Arama ({visibleCount})
          </Button>
        </div>
      ) : (
        <InlineAlert
          variant="warning"
          message="Devam etmek için listeden en az bir market seçin."
          className="mb-4"
          role="status"
        />
      )}

      {viewMode === 'map' ? (
        <div className="space-y-4">
          <MarketMap
            userLocation={selectedAddress}
            markets={filteredMarkets}
            hiddenMarkets={hiddenMarkets}
            onMarkerClick={handleMarkerClick}
          />
          <p className="text-center text-xs text-gray-500">
            Haritada işaretçilere tıklayarak marketleri seçebilir veya kaldırabilirsiniz
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
