'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
          role="status"
          aria-label="Yükleniyor"
        />
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="container mx-auto max-w-2xl pt-16">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Button>
          <Button
            onClick={() => router.push('/ai-chat')}
            className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-white shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Yapay Zekaya Sor</span>
          </Button>
        </div>

        {uiError && (
          <InlineAlert
            message={uiError}
            className="mb-4"
            onDismiss={() => setUiError(null)}
          />
        )}

        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              Canlı Ürün Arama
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ürün adı yazın; ilk sonuç sayfası anında gelir
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {optimization && (
          <ShoppingCartSummary
            optimization={optimization}
            onViewRoute={handleViewMultiRoute}
            onViewSingleRoute={handleShowRoute}
            onClearCart={clearCart}
            onRemoveItem={removeFromCart}
          />
        )}

        <SearchTips />

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
