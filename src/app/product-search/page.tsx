'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { useRouteModals } from '@/features/products/hooks/useRouteModals';
import { useShoppingCart } from '@/features/products/hooks/useShoppingCart';
import { SEARCH } from '@/constants';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { SearchStats } from '@/types';

export default function ProductSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 450);

  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useLocalStorageSettings();

  const {
    optimization,
    mode, setMode, updateQuantity, refreshPrices, isRefreshing, refreshMessage,
    addToCart,
    removeFromCart,
    clearCart,
    generateRoute,
    isProductInCart,
    marketCount,
  } = useShoppingCart(searchSettings);

  const {
    showSingleMap,
    showMultiMap,
    selectedStore,
    routeInfo,
    realRouteDistance,
    realRouteTime,
    realRouteLegs,
    openSingleRoute,
    openMultiRoute,
    closeMaps,
    handleRouteFound,
    handleMultiRouteFound,
  } = useRouteModals(optimization, setUiError);

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
    totalResults, loadedResults, isComplete, isFetching: isSearchFetching, retrySearch,
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings,
  });

  const searchStats: SearchStats = {
    totalResults, loadedResults, complete: isComplete, loadingMore: isSearchFetching,
  };

  // Debounce penceresinde "sonuç bulunamadı" denmemeli (bkz. ai-chat): arama sürüyor sayılır.
  const isSearchBusy = searchQuery.trim() !== debouncedQuery.trim() || isProductsLoading || isSearchFetching;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.trim().length >= SEARCH.MIN_QUERY_LENGTH);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  if (isSettingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDF3EE]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-[#EC7D55] border-t-transparent"
            role="status"
            aria-label="Yükleniyor"
          />
          <span className="text-sm font-bold text-[#253341]">Ayarlar Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-[#EDF3EE] p-4">
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
    <div className="min-h-screen bg-gradient-to-b from-[#EDF3EE] via-[#DBE6DD]/50 to-[#DCE3EA]/40 text-[#253341] py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">

        {uiError && (
          <InlineAlert
            message={uiError}
            className="mb-4"
            onDismiss={() => setUiError(null)}
          />
        )}

        {/* Live Search Section */}
        <Card className="bg-[#DCE3EA] border-[#BCC7D2] shadow-md rounded-3xl overflow-visible">
          <CardHeader className="pb-4 border-b border-[#BCC7D2]/80">
            <h1 className="flex items-center gap-3 leading-snug font-bold font-heading text-lg text-[#253341]">
              <div className="p-2.5 rounded-2xl bg-[#EC7D55] text-[#253341] shadow-2xs">
                <Search className="h-5 w-5 stroke-[2.5]" />
              </div>
              Canlı Ürün Fiyat Arama
            </h1>
            <p className="text-xs font-semibold text-[#3E5164]">
              Ürün adını yazın. Seçili şubelerdeki tüm sonuçlar sayfa sayfa yüklenir.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <SearchInput
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(searchQuery.trim().length >= SEARCH.MIN_QUERY_LENGTH)}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
                isLoading={isSearchBusy}
              />

              <SearchStatsDisplay
                stats={searchStats}
                query={searchQuery}
                isLoading={isSearchBusy}
                error={productsError?.message}
              />
              {productsError && <Button type="button" onClick={() => { setIsDropdownOpen(true); void retrySearch(); }}>Aramayı yeniden dene</Button>}

              {productsError && (
                <SearchErrorDisplay error={productsError.message} />
              )}

              <ProductDropdown
                products={products}
                isLoading={isSearchBusy}
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
            mode={mode}
            onModeChange={setMode}
            onQuantityChange={updateQuantity}
            onRefreshPrices={refreshPrices}
            isRefreshing={isRefreshing}
            refreshMessage={refreshMessage}
            onViewRoute={openMultiRoute}
            onViewSingleRoute={openSingleRoute}
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
            totalCost={optimization?.totalCost}
            routeInfo={routeInfo}
            searchSettings={searchSettings}
            onClose={closeMaps}
            onRouteFound={handleRouteFound}
          />
        )}

        {searchSettings && optimization && marketCount > 1 && (
          <MultiStoreRouteModal
            isOpen={showMultiMap}
            onClose={closeMaps}
            routeSteps={generateRoute(
              searchSettings.latitude,
              searchSettings.longitude
            )}
            searchSettings={searchSettings}
            realRouteDistance={realRouteDistance}
            realRouteTime={realRouteTime}
            realRouteLegs={realRouteLegs}
            onMultiRouteFound={handleMultiRouteFound}
          />
        )}
      </div>
    </div>
  );
}
