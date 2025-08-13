
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Feature components
import { SearchInput } from '@/features/products/components/SearchInput';
import { SearchStatsDisplay } from '@/features/products/components/SearchStatsDisplay';
import { ProductDropdown } from '@/features/products/components/ProductDropdown';
import { SelectedProductDisplay } from '@/features/products/components/SelectedProductDisplay';
import { RouteModal } from '@/features/products/components/RouteModal';
import { ErrorDisplay, SearchErrorDisplay } from '@/features/products/components/ErrorDisplay';
import { SearchTips } from '@/features/products/components/SearchTips';

// Hooks
import { useLocalStorageSettings } from '@/features/products/hooks/useLocalStorageSettings';
import { useProductSearch } from '@/features/products/hooks/useProductSearch';
import { useDebounce } from '@/hooks/useDebounce';

// Types
import { Product, ProductDepotInfo, RouteInfo, SearchStats } from '@/types';

export default function ProductSearchPage() {
  const router = useRouter();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ProductDepotInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  
  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Custom hooks
  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
    getMarketDistance,
    getMarketDistanceByName
  } = useLocalStorageSettings();

  // Product search hook
  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings: searchSettings
  });

  // Search stats
  const searchStats: SearchStats = {
    totalResults: products.length
  };

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.length >= 2);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setIsDropdownOpen(false);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.title);
    setIsDropdownOpen(false);
  };

  const handleShowRoute = (depot: ProductDepotInfo) => {
    if (!depot.latitude || !depot.longitude) {
      alert('Mağaza konumu bulunamadı!');
      return;
    }
    setSelectedStore(depot);
    setShowMap(true);
    setRouteInfo(null);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedStore(null);
    setRouteInfo(null);
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
    router.push('/');
  };

  // Loading state
  if (isSettingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
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
            variant="outline"
            size="sm"
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
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
                onSelectProduct={handleProductSelect}
                isLoading={isProductsLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected Product */}
        {selectedProduct && searchSettings && (
          <SelectedProductDisplay
            product={selectedProduct}
            onClear={() => setSelectedProduct(null)}
            onShowRoute={handleShowRoute}
            getMarketDistance={getMarketDistance}
            getMarketDistanceByName={getMarketDistanceByName}
          />
        )}

        {/* Search Tips */}
        <SearchTips />

        {/* Route Modal */}
        {searchSettings && (
          <RouteModal
            isOpen={showMap}
            selectedStore={selectedStore}
            routeInfo={routeInfo}
            searchSettings={searchSettings}
            onClose={handleCloseMap}
            onRouteFound={handleRouteFound}
          />
        )}
      </div>
    </div>
  );
}