
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const [debouncedQuery] = useDebounce(searchQuery, 450);

  const {
    optimization,
    addToCart,
    removeFromCart,
    clearCart,
    generateRoute,
    isProductInCart,
    marketCount
  } = useShoppingCart();
  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError
  } = useLocalStorageSettings();
  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings: searchSettings
  });
  const searchStats: SearchStats = {
    totalResults: products.length
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.length >= 2);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleShowRoute = (depot: ProductDepotInfo) => {
    if (!depot.latitude || !depot.longitude) {
      alert('Mağaza konumu bulunamadı!');
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

  const handleViewMultiRoute = () => {
    setShowMultiMap(true);
  };

  const handleRouteFound = useCallback((info: RouteInfo) => {
    setRouteInfo(prevInfo => {
      if (!prevInfo ||
        prevInfo.distance !== info.distance ||
        prevInfo.time !== info.time) {
        return info;
      }
      return prevInfo;
    });
  }, []);

  const handleGoHome = () => {
    router.push('/ai-chat');
  };

  useEffect(() => {
    if (clearCart) {
      clearCart();
    }
  }, [clearCart]);
  
  if (isSettingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="container mx-auto max-w-2xl pt-16">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfa
            </Button>
          </div>

          <ErrorDisplay
            error={settingsError}
            onGoHome={handleGoHome}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2 rounded-2xl border border-gray-300 
             bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
             px-4 py-2 text-white shadow-md transition-all duration-300 
             hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Yapay Zekaya Sor</span>
          </Button>

        </div>

        {/* Main Search Card */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="text-blue-600">🔍</span>
              Canlı Ürün Arama
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Ürün adı yazın, anında sonuçları görün
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

        {/* Search Tips */}
        <SearchTips />

        {/* Single Product Route Modal */}
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

        {/* Multi Store Route Modal */}
        {searchSettings && optimization && marketCount > 1 && (
          <MultiStoreRouteModal
            isOpen={showMultiMap}
            onClose={handleCloseMap}
            routeSteps={generateRoute(searchSettings.latitude, searchSettings.longitude)}
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