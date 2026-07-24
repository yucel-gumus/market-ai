'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { SearchInput } from '@/features/products/components/SearchInput';
import { SearchStatsDisplay } from '@/features/products/components/SearchStatsDisplay';
import { ProductDropdown } from '@/features/products/components/ProductDropdown';
import { ShoppingCartSummary } from '@/features/products/components/ShoppingCartSummary';
import { RouteModal } from '@/features/products/components/RouteModal';
import { MultiStoreRouteModal } from '@/features/products/components/MultiStoreRouteModal';
import { ErrorDisplay, SearchErrorDisplay } from '@/features/products/components/ErrorDisplay';
import { SearchTips } from '@/features/products/components/SearchTips';
import { useLocalStorageSettings } from '@/features/products/hooks/useLocalStorageSettings';
import { useProductSearch } from '@/features/products/hooks/useProductSearch';
import { useShoppingCart } from '@/features/products/hooks/useShoppingCart';
import { useDebounce } from 'use-debounce';
import { SEARCH } from '@/constants';
import { ProductDepotInfo, RouteInfo, SearchStats } from '@/types';

export default function ProductSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSingleMap, setShowSingleMap] = useState(false);
  const [showMultiMap, setShowMultiMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ProductDepotInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [realRouteDistance, setRealRouteDistance] = useState<number | undefined>(undefined);
  const [realRouteTime, setRealRouteTime] = useState<number | undefined>(undefined);
  const [uiError, setUiError] = useState<string | null>(null);

  const [debouncedQuery] = useDebounce(searchQuery, 450);

  const {
    optimization,
    addToCart,
    removeFromCart,
    clearCart,
    generateRoute,
    isProductInCart,
    marketCount,
  } = useShoppingCart();

  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useLocalStorageSettings();

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings,
    fetchAllPages: false,
  });

  const searchStats: SearchStats = {
    totalResults: products.length,
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.length >= SEARCH.MIN_QUERY_LENGTH);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleShowRoute = (depot: ProductDepotInfo) => {
    if (!depot.latitude || !depot.longitude) {
      setUiError('Mağaza konumu bulunamadı.');
      return;
    }
    setSelectedStore(depot);
    setShowSingleMap(true);
    setRouteInfo(null);
  };

  const handleCloseMap = () => {
    setShowSingleMap(false);
    setShowMultiMap(false);
    setSelectedStore(null);
    setRouteInfo(null);
    setRealRouteDistance(undefined);
    setRealRouteTime(undefined);
  };

  const handleMultiRouteFound = (routeData: { distance: number; time: number }) => {
    setRealRouteDistance(routeData.distance);
    setRealRouteTime(routeData.time);
  };

  const handleViewMultiRoute = () => setShowMultiMap(true);

  const handleRouteFound = useCallback((info: RouteInfo) => {
    setRouteInfo((prevInfo) => {
      if (
        !prevInfo ||
        prevInfo.distance !== info.distance ||
        prevInfo.time !== info.time
      ) {
        return info;
      }
      return prevInfo;
    });
  }, []);

  if (isSettingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFEBD3]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-[#9BCEC1] border-t-transparent"
            role="status"
            aria-label="Yükleniyor"
          />
          <span className="text-sm font-bold text-[#4A1E17]">Ayarlar Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-[#FFEBD3] p-4">
        <div className="container mx-auto max-w-2xl pt-16">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-[#FFECE8] text-[#4A1E17] border-[#F7A898]"
            >
              <Home className="h-4 w-4" />
              Ana Sayfa
            </Button>
          </div>
          <ErrorDisplay error={settingsError} onGoHome={() => router.push('/')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFEBD3] text-[#2D1E12] py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">

        {uiError && (
          <InlineAlert
            message={uiError}
            className="mb-4"
            onDismiss={() => setUiError(null)}
          />
        )}

        {/* Live Search Section */}
        <Card className="bg-[#FFECE8] border-[#F7A898] shadow-md rounded-3xl overflow-visible">
          <CardHeader className="pb-4 border-b border-[#F7A898]/40">
            <CardTitle className="flex items-center gap-3 text-lg font-bold font-heading text-[#2D1E12]">
              <div className="p-2.5 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] shadow-2xs">
                <Search className="h-5 w-5 stroke-[2.5]" />
              </div>
              Canlı Ürün Fiyat Arama
            </CardTitle>
            <p className="text-xs font-semibold text-[#70372D]">
              Marketlerde satılan ürünlerin adını yazın; fiyat ve stok alternatifleri anında listelensin
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
                isLoading={isProductsLoading}
              />

              <SearchStatsDisplay
                stats={searchStats}
                query={searchQuery}
                isLoading={isProductsLoading}
                error={productsError?.message}
              />

              {productsError && (
                <SearchErrorDisplay error={productsError.message} />
              )}

              <ProductDropdown
                products={products}
                query={searchQuery}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                onAddToCart={addToCart}
                onProductAdded={handleClearSearch}
                isProductInCart={isProductInCart}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart Summary */}
        {optimization && (
          <ShoppingCartSummary
            optimization={optimization}
            onViewRoute={handleViewMultiRoute}
            onViewSingleRoute={handleShowRoute}
            onClearCart={clearCart}
            onRemoveItem={removeFromCart}
          />
        )}

        {/* Tips Section */}
        <SearchTips />

        {/* Modals */}
        {searchSettings && (
          <RouteModal
            isOpen={showSingleMap}
            selectedStore={selectedStore}
            routeInfo={routeInfo}
            searchSettings={searchSettings}
            onClose={handleCloseMap}
            onRouteFound={handleRouteFound}
          />
        )}

        {searchSettings && optimization && marketCount > 1 && (
          <MultiStoreRouteModal
            isOpen={showMultiMap}
            onClose={handleCloseMap}
            routeSteps={generateRoute(
              searchSettings.latitude,
              searchSettings.longitude
            )}
            searchSettings={searchSettings}
            realRouteDistance={realRouteDistance}
            realRouteTime={realRouteTime}
            onMultiRouteFound={handleMultiRouteFound}
          />
        )}
      </div>
    </div>
  );
}
