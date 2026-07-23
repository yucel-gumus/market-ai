'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  ChefHat,
  Search,
  CheckCircle,
  Clock,
  ShoppingCart,
  Package,
  RotateCcw,
  ArrowRight,
  X,
  Utensils,
  Flame,
  Clock as ClockIcon,
  Users,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { SEARCH } from '@/constants';
import { useRecipePipeline } from '@/features/ai-chat/hooks/useRecipePipeline';
import { ProductDropdown } from '@/features/products/components/ProductDropdown';
import { SearchInput } from '@/features/products/components/SearchInput';
import { SearchStatsDisplay } from '@/features/products/components/SearchStatsDisplay';
import { ShoppingCartSummary } from '@/features/products/components/ShoppingCartSummary';
import { MultiStoreRouteModal } from '@/features/products/components/MultiStoreRouteModal';
import { RouteModal } from '@/features/products/components/RouteModal';
import { useLocalStorageSettings } from '@/features/products/hooks/useLocalStorageSettings';
import { useProductSearch } from '@/features/products/hooks/useProductSearch';
import { useShoppingCart } from '@/features/products/hooks/useShoppingCart';
import { toErrorMessage } from '@/lib/errorUtils';
import { getMarketLogo } from '@/lib/utils';
import { LlmService, type RecipeWithCaloriesResponse } from '@/services/llmService';
import type { Product, ProductDepotInfo, RouteInfo } from '@/types';
import type { SelectProductsSelection } from '@/services/llmService';

const STEPS = ['input', 'ingredients', 'processing', 'complete'] as const;

function stepIcon(step: string, className = 'w-8 h-8') {
  switch (step) {
    case 'input':
      return <Search className={className} />;
    case 'ingredients':
      return <Package className={className} />;
    case 'processing':
      return <Clock className={className} />;
    case 'complete':
      return <CheckCircle className={className} />;
    default:
      return <Search className={className} />;
  }
}

function stepColor(step: string, current: string) {
  const cur = STEPS.indexOf(current as (typeof STEPS)[number]);
  const idx = STEPS.indexOf(step as (typeof STEPS)[number]);
  if (idx < cur) return 'bg-green-500 text-white';
  if (idx === cur) return 'bg-blue-500 text-white';
  return 'bg-gray-200 text-gray-500';
}

function safeDepot(product: Product) {
  return product.productDepotInfoList?.[0] ?? null;
}

export default function AiChatPage() {
  const router = useRouter();
  const {
    optimization,
    addToCart,
    addManyToCart,
    removeFromCart,
    clearCart,
    generateRoute,
    marketCount,
  } = useShoppingCart();

  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useLocalStorageSettings();

  const pipeline = useRecipePipeline({ addManyToCart, clearCart });

  const [calorieInfo, setCalorieInfo] = useState<RecipeWithCaloriesResponse | null>(null);
  const [isCalorieLoading, setIsCalorieLoading] = useState(false);
  const [calorieError, setCalorieError] = useState<string | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const [showSingleMap, setShowSingleMap] = useState(false);
  const [showMultiMap, setShowMultiMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ProductDepotInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [realRouteDistance, setRealRouteDistance] = useState<number | undefined>();
  const [realRouteTime, setRealRouteTime] = useState<number | undefined>();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 450);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings,
    fetchAllPages: false,
  });

  const handleGetRecipeAndCalorie = async () => {
    if (!pipeline.foodName.trim()) return;
    setIsCalorieLoading(true);
    setCalorieError(null);
    setCalorieInfo(null);
    try {
      const data = await LlmService.generateRecipeAndCalorie(pipeline.foodName);
      if (data.success) {
        setCalorieInfo(data);
        setShowRecipeModal(true);
      } else {
        setCalorieError(data.message || 'Tarif veya kalori bilgisi bulunamadı.');
      }
    } catch (err) {
      setCalorieError(toErrorMessage(err));
    } finally {
      setIsCalorieLoading(false);
    }
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

  const handleRouteFound = useCallback((info: RouteInfo) => {
    setRouteInfo((prev) => {
      if (!prev || prev.distance !== info.distance || prev.time !== info.time) {
        return info;
      }
      return prev;
    });
  }, []);

  const handleAddExtraProduct = (product: Product) => {
    addToCart(product);
    if (!pipeline.ingredients.includes(product.title)) {
      pipeline.setIngredients((prev) => [...prev, product.title]);
    }
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Button>
          <InlineAlert message={settingsError} />
        </div>
      </div>
    );
  }

  const selections = pipeline.searchResults as SelectProductsSelection[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa / Konum
          </Button>
          <Button
            onClick={() => router.push('/product-search')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white hover:from-blue-700 hover:to-purple-700"
          >
            Ürün Ara
          </Button>
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <ChefHat className="mr-3 h-12 w-12 text-orange-500" aria-hidden />
            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              Yemek Tarifi ve Malzeme Bulucu
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Yemek adını girin, malzemeleri bulalım
          </p>
        </div>

        <nav
          className="mb-8 flex items-center justify-center overflow-x-auto"
          aria-label="İlerleme adımları"
        >
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`rounded-full p-3 transition-all duration-300 ${stepColor(step, pipeline.currentStep)}`}
                aria-current={pipeline.currentStep === step ? 'step' : undefined}
              >
                {stepIcon(step)}
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="mx-2 h-6 w-6 text-gray-400" aria-hidden />
              )}
            </div>
          ))}
        </nav>

        {(pipeline.error || uiError) && (
          <InlineAlert
            message={pipeline.error || uiError || ''}
            className="mb-6"
            onDismiss={() => {
              pipeline.setError(null);
              setUiError(null);
            }}
          />
        )}

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          {showRecipeModal && calorieInfo && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="recipe-modal-title"
            >
              <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                  <button
                    type="button"
                    onClick={() => setShowRecipeModal(false)}
                    className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30"
                    aria-label="Kapat"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <div className="mb-4 flex items-center gap-4">
                    <ChefHat className="h-10 w-10" aria-hidden />
                    <div>
                      <h2 id="recipe-modal-title" className="text-3xl font-bold">
                        {calorieInfo.name}
                      </h2>
                      <p className="mt-1 text-lg text-orange-100">
                        {calorieInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 rounded-xl bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <Flame className="h-6 w-6 text-yellow-300" aria-hidden />
                      <div>
                        <div className="text-2xl font-bold">{calorieInfo.calories}</div>
                        <div className="text-sm text-orange-100">kcal/porsiyon</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-orange-200" aria-hidden />
                      <div>
                        <div className="text-xl font-semibold">4</div>
                        <div className="text-sm text-orange-100">kişilik</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-6 w-6 text-orange-200" aria-hidden />
                      <div>
                        <div className="text-xl font-semibold">30</div>
                        <div className="text-sm text-orange-100">dakika</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
                  <div className="grid gap-0 lg:grid-cols-2">
                    <div className="border-r border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-green-800">
                        <Package className="h-6 w-6" /> Malzemeler
                      </h3>
                      <ul className="space-y-2">
                        {calorieInfo.ingredients?.map((item, idx) => (
                          <li
                            key={idx}
                            className="rounded-lg bg-white/70 p-3 text-lg font-medium text-gray-700"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-blue-800">
                        <Utensils className="h-6 w-6" /> Hazırlanışı
                      </h3>
                      <ol className="space-y-3">
                        {calorieInfo.steps?.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex gap-3 rounded-lg bg-white/70 p-3 text-lg text-gray-700"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  {calorieInfo.nutrition && (
                    <div className="border-t border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                      <h3 className="mb-3 text-2xl font-bold text-purple-800">
                        Besin Değerleri
                      </h3>
                      <p className="text-lg leading-relaxed text-gray-700">
                        {calorieInfo.nutrition}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              onMultiRouteFound={(d) => {
                setRealRouteDistance(d.distance);
                setRealRouteTime(d.time);
              }}
            />
          )}

          {pipeline.currentStep === 'input' && (
            <div className="text-center">
              <ChefHat className="mx-auto mb-4 h-20 w-20 text-orange-400" aria-hidden />
              <h2 className="mb-2 text-2xl font-semibold text-gray-800">
                Hangi yemeği yapmak istiyorsunuz?
              </h2>
              <p className="mb-6 text-gray-600">
                Yemek adını girin, malzeme listesi ve uygun fiyatları bulalım
              </p>
              <div className="mx-auto max-w-md">
                <label htmlFor="foodName" className="sr-only">
                  Yemek adı
                </label>
                <div className="relative mb-6">
                  <input
                    type="text"
                    id="foodName"
                    value={pipeline.foodName}
                    onChange={(e) => pipeline.setFoodName(e.target.value)}
                    placeholder="Örn: mercimek çorbası"
                    disabled={pipeline.isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && pipeline.handleSubmit()}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-orange-400 focus:outline-none"
                  />
                  <Search className="absolute right-4 top-4 h-6 w-6 text-gray-400" aria-hidden />
                </div>
                <button
                  type="button"
                  onClick={() => pipeline.handleSubmit()}
                  disabled={pipeline.isLoading || !pipeline.foodName.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-semibold text-white disabled:opacity-50"
                >
                  {pipeline.isLoading ? 'Malzeme aranıyor...' : 'Malzeme Bul'}
                </button>
                <button
                  type="button"
                  onClick={handleGetRecipeAndCalorie}
                  disabled={isCalorieLoading || !pipeline.foodName.trim()}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white disabled:opacity-50"
                >
                  {isCalorieLoading
                    ? 'Tarif & Kalori aranıyor...'
                    : 'Yemek Tarifi ve Kalori Bilgisi Al'}
                </button>
                {calorieError && (
                  <InlineAlert message={calorieError} className="mt-4 text-left" />
                )}
                {calorieInfo && (
                  <button
                    type="button"
                    onClick={() => setShowRecipeModal(true)}
                    className="mx-auto mt-4 flex items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white"
                  >
                    <ChefHat className="mr-2 h-5 w-5" />
                    Tarifi Görüntüle
                  </button>
                )}
              </div>
            </div>
          )}

          {pipeline.currentStep === 'ingredients' && (
            <div>
              <div className="mb-6 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-blue-500" />
                <h2 className="text-2xl font-semibold text-gray-800">Malzeme Listesi</h2>
                <p className="text-gray-600">İstemediğiniz malzemeleri çıkarabilirsiniz</p>
              </div>
              <ul className="mb-8 grid gap-3">
                {pipeline.ingredients.map((ingredient) => (
                  <li
                    key={ingredient}
                    className="flex items-center justify-between rounded-lg border-2 border-transparent bg-gray-50 p-4 hover:border-orange-200"
                  >
                    <span className="text-lg capitalize text-gray-700">{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => pipeline.removeIngredient(ingredient)}
                      className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      <X size={16} /> Çıkar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={pipeline.confirmIngredients}
                  disabled={pipeline.isLoading || pipeline.ingredients.length === 0}
                  className="flex-1 rounded-xl bg-green-500 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {pipeline.isLoading ? 'İşleniyor...' : 'Malzemeleri Onayla'}
                </button>
                <button
                  type="button"
                  onClick={pipeline.resetForm}
                  className="flex items-center justify-center rounded-xl bg-gray-500 py-3 px-6 font-semibold text-white hover:bg-gray-600"
                >
                  <RotateCcw className="mr-2 h-5 w-5" /> Yeniden Başla
                </button>
              </div>

              <Card className="border-0 bg-white/80 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Ekstra Ürün Ekleme</CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchInput
                    value={searchQuery}
                    onChange={(v) => {
                      setSearchQuery(v);
                      setIsDropdownOpen(v.length >= SEARCH.MIN_QUERY_LENGTH);
                    }}
                    onClear={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    isLoading={isProductsLoading}
                  />
                  <SearchStatsDisplay
                    stats={{ totalResults: products.length }}
                    query={searchQuery}
                    isLoading={isProductsLoading}
                    error={productsError?.message}
                  />
                  <ProductDropdown
                    products={products}
                    query={searchQuery}
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    onAddToCart={handleAddExtraProduct}
                    onProductAdded={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    isProductInCart={(id) =>
                      products.some(
                        (p) =>
                          p.id === id &&
                          pipeline.ingredients.some(
                            (ing) => p.title.toLowerCase() === ing.toLowerCase()
                          )
                      )
                    }
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {pipeline.currentStep === 'processing' && (
            <div className="text-center" role="status" aria-live="polite">
              <div className="relative mx-auto mb-4 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <Clock className="absolute left-6 top-6 h-8 w-8 text-blue-500" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-gray-800">
                Malzemeler kontrol ediliyor...
              </h2>
              <p className="text-gray-600">
                Ürünler aranıyor ve en uygun alternatifler bulunuyor
              </p>
            </div>
          )}

          {pipeline.currentStep === 'complete' && (
            <div>
              <div className="mb-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-semibold text-gray-800">Sonuçlar</h2>
              </div>

              {optimization && (
                <ShoppingCartSummary
                  optimization={optimization}
                  onViewRoute={() => setShowMultiMap(true)}
                  onViewSingleRoute={handleShowRoute}
                  onClearCart={clearCart}
                  onRemoveItem={removeFromCart}
                />
              )}

              {pipeline.results.firstSelectedProduct.length > 0 && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-4 text-xl font-semibold text-green-800">
                    Markette bulunan ürünler
                  </h3>
                  <ul className="space-y-3">
                    {pipeline.results.firstSelectedProduct.map((product) => {
                      const depot = safeDepot(product);
                      const logo = depot ? getMarketLogo(depot.marketAdi) : null;
                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between rounded-lg border border-green-100 bg-white p-4"
                        >
                          <div>
                            <h4 className="font-medium text-gray-800">{product.title}</h4>
                            {logo && (
                              <Image
                                src={logo}
                                alt=""
                                width={32}
                                height={32}
                                className="mt-1 object-contain"
                              />
                            )}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {depot?.price ?? '—'}₺
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {pipeline.results.selectedProducts.length > 0 && (
                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-4 flex items-center text-xl font-semibold text-blue-800">
                    <ShoppingCart className="mr-2 h-6 w-6" />
                    LLM alternatif ürünler
                  </h3>
                  <ul className="space-y-3">
                    {pipeline.results.selectedProducts.map((product) => {
                      const depot = safeDepot(product);
                      const logo = depot ? getMarketLogo(depot.marketAdi) : null;
                      const matched = selections.find(
                        (item) => item.product?.title === product.title
                      );
                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between rounded-lg border border-blue-100 bg-white p-4"
                        >
                          <div>
                            <h4 className="font-medium text-gray-800">{product.title}</h4>
                            {matched?.reasoning && (
                              <span className="block text-sm text-blue-600">
                                {matched.reasoning}
                              </span>
                            )}
                            {logo && (
                              <Image
                                src={logo}
                                alt=""
                                width={32}
                                height={32}
                                className="mt-1 object-contain"
                              />
                            )}
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {depot?.price ?? 'N/A'} ₺
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={pipeline.resetForm}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-semibold text-white"
              >
                <Search className="mr-2 h-5 w-5" />
                Yeni Malzeme Ara
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
