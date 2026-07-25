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
  Package,
  RotateCcw,
  ArrowRight,
  X,
  Utensils,
  Flame,
  Clock as ClockIcon,
  Users,
  Home,
  Sparkles,
  Store,
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

function stepIcon(step: string, className = 'w-6 h-6') {
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
  if (idx < cur) return 'bg-[#FFB6A6] text-[#4A1E17] shadow-xs';
  if (idx === cur) return 'bg-[#9BCEC1] text-[#0E2C24] ring-4 ring-[#9BCEC1]/40 shadow-sm';
  return 'bg-[#FFECE8] text-[#70372D] border border-[#F7A898]/50';
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 bg-[#FFECE8] text-[#4A1E17] border-[#F7A898]"
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
    <div className="min-h-screen bg-[#FFEBD3] text-[#2D1E12] py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">

        {/* Hero Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-[#FFECE8] border border-[#F7A898] text-[#4A1E17] shadow-2xs mb-2">
            <ChefHat className="h-10 w-10 text-[#0E2C24] stroke-[2.2]" aria-hidden />
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-[#2D1E12] sm:text-4xl tracking-tight">
            Yemek Tarifi ve Malzeme Asistanı
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#70372D] max-w-lg mx-auto">
            Hangi yemeği yapmak istediğinizi yazın; malzeme listesini hazırlayıp en yakın ve uygun market fiyatlarını çıkaralım.
          </p>
        </div>

        {/* Stepper Navigation */}
        <nav
          className="flex items-center justify-center gap-2 p-2 bg-[#FFECE8] border border-[#F7A898]/60 rounded-2xl shadow-2xs overflow-x-auto"
          aria-label="İlerleme adımları"
        >
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div
                className={`rounded-xl p-2.5 transition-all duration-300 ${stepColor(step, pipeline.currentStep)}`}
                aria-current={pipeline.currentStep === step ? 'step' : undefined}
              >
                {stepIcon(step)}
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-[#F7A898]" aria-hidden />
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

        {/* Main Process Card */}
        <Card className="bg-[#FFECE8] border-[#F7A898] shadow-md rounded-3xl p-4 sm:p-6">
          <CardContent className="pt-2">
            {/* Modal for Recipe Details & Calories */}
            {showRecipeModal && calorieInfo && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1E12]/60 p-4 backdrop-blur-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="recipe-modal-title"
              >
                <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-[#FFEBD3] border border-[#F7A898] shadow-2xl">
                  <div className="relative bg-[#FFECE8] p-6 border-b border-[#F7A898]/60 text-[#2D1E12]">
                    <button
                      type="button"
                      onClick={() => setShowRecipeModal(false)}
                      className="absolute right-4 top-4 rounded-full bg-[#FFEBD3] p-2 text-[#4A1E17] hover:bg-[#FFB6A6]/40 transition-colors"
                      aria-label="Kapat"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#9BCEC1] text-[#0E2C24]">
                        <ChefHat className="h-8 w-8 stroke-[2.5]" aria-hidden />
                      </div>
                      <div>
                        <h2 id="recipe-modal-title" className="text-2xl font-bold font-heading text-[#2D1E12]">
                          {calorieInfo.name}
                        </h2>
                        <p className="mt-0.5 text-xs font-semibold text-[#70372D]">
                          {calorieInfo.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FFEBD3] p-3.5 border border-[#F7A898]/50">
                      <div className="flex items-center gap-2.5">
                        <Flame className="h-5 w-5 text-[#4A1E17]" aria-hidden />
                        <div>
                          <div className="text-lg font-bold font-heading text-[#2D1E12]">{calorieInfo.calories}</div>
                          <div className="text-[11px] font-semibold text-[#70372D]">kcal/porsiyon</div>
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#F7A898]/40" />
                      <div className="flex items-center gap-2.5">
                        <Users className="h-5 w-5 text-[#0E2C24]" aria-hidden />
                        <div>
                          <div className="text-base font-bold text-[#2D1E12]">4 Kişilik</div>
                          <div className="text-[11px] font-semibold text-[#70372D]">Standart porsiyon</div>
                        </div>
                      </div>
                      <div className="h-6 w-px bg-[#F7A898]/40" />
                      <div className="flex items-center gap-2.5">
                        <ClockIcon className="h-5 w-5 text-[#0E2C24]" aria-hidden />
                        <div>
                          <div className="text-base font-bold text-[#2D1E12]">~30 Dakika</div>
                          <div className="text-[11px] font-semibold text-[#70372D]">Hazırlık süresi</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[calc(90vh-220px)] overflow-y-auto p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#F7A898]/60 bg-[#FFECE8] p-5 space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-bold font-heading text-[#2D1E12]">
                          <Package className="h-5 w-5 text-[#9BCEC1] stroke-[2.5]" /> Gerekli Malzemeler
                        </h3>
                        <ul className="space-y-2">
                          {calorieInfo.ingredients?.map((item, idx) => (
                            <li
                              key={idx}
                              className="rounded-xl bg-[#FFEBD3] p-3 text-sm font-semibold text-[#2D1E12] border border-[#F7A898]/40 flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#9BCEC1]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-[#F7A898]/60 bg-[#FFECE8] p-5 space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-bold font-heading text-[#2D1E12]">
                          <Utensils className="h-5 w-5 text-[#9BCEC1] stroke-[2.5]" /> Hazırlanışı
                        </h3>
                        <ol className="space-y-3">
                          {calorieInfo.steps?.map((step, idx) => (
                            <li
                              key={idx}
                              className="flex gap-3 rounded-xl bg-[#FFEBD3] p-3 text-sm font-medium text-[#2D1E12] border border-[#F7A898]/40"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#9BCEC1] text-xs font-bold text-[#0E2C24]">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {calorieInfo.nutrition && (
                      <div className="rounded-2xl border border-[#F7A898]/60 bg-[#FFECE8] p-5 space-y-3">
                        <h3 className="text-lg font-bold font-heading text-[#2D1E12]">
                          Besin Değerleri ve Diyetisyen Değerlendirmesi
                        </h3>
                        {typeof calorieInfo.nutrition === 'object' && calorieInfo.nutrition !== null ? (
                          <div className="space-y-3">
                            <div className="grid gap-2 sm:grid-cols-3">
                              {Object.entries(calorieInfo.nutrition as Record<string, unknown>)
                                .filter(([key]) => !['aciklama', 'summary', 'detail', 'note', 'degerlendirme'].includes(key.toLowerCase()))
                                .map(([key, val]) => (
                                  <div
                                    key={key}
                                    className="rounded-xl bg-[#FFEBD3] p-3 border border-[#F7A898]/40"
                                  >
                                    <span className="text-xs font-bold uppercase text-[#70372D] block mb-1">
                                      {key}
                                    </span>
                                    <span className="text-xs font-medium text-[#2D1E12] leading-snug block">
                                      {String(val)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            {Object.entries(calorieInfo.nutrition as Record<string, unknown>)
                              .filter(([key]) => ['aciklama', 'summary', 'detail', 'note', 'degerlendirme'].includes(key.toLowerCase()))
                              .map(([key, val]) => (
                                <div key={key} className="rounded-xl bg-white/70 p-3.5 border border-[#F7A898]/40">
                                  <span className="text-xs font-bold text-[#0E2C24] block mb-1">
                                    💡 Beslenme ve Diyet Notu:
                                  </span>
                                  <p className="text-xs font-medium leading-relaxed text-[#2D1E12]">
                                    {String(val)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium leading-relaxed text-[#70372D]">
                            {String(calorieInfo.nutrition)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modals for Routes */}
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

            {/* STEP 1: INPUT */}
            {pipeline.currentStep === 'input' && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#FFEBD3] border border-[#F7A898] flex items-center justify-center text-[#4A1E17] shadow-2xs">
                  <ChefHat className="h-10 w-10 text-[#0E2C24] stroke-[2.2]" aria-hidden />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold font-heading text-[#2D1E12]">
                    Hangi yemeği hazırlamak istiyorsunuz?
                  </h2>
                  <p className="text-xs font-semibold text-[#70372D]">
                    Yemek adını yazın; malzeme listesini çıkaralım ve çevrenizdeki marketlerden fiyat araştırması yapalım.
                  </p>
                </div>

                <div className="mx-auto max-w-md space-y-4 text-left">
                  <div className="relative">
                    <input
                      type="text"
                      id="foodName"
                      value={pipeline.foodName}
                      onChange={(e) => pipeline.setFoodName(e.target.value)}
                      placeholder="Örn: Mercimek Çorbası, Tavuk Sote, Lazanya"
                      disabled={pipeline.isLoading}
                      onKeyDown={(e) => e.key === 'Enter' && pipeline.handleSubmit()}
                      className="w-full rounded-2xl border-2 border-[#F7A898] bg-[#FFEBD3] px-4 py-3.5 text-base font-semibold text-[#2D1E12] placeholder:text-[#854B41]/60 focus:border-[#9BCEC1] focus:outline-none shadow-xs"
                    />
                    <Search className="absolute right-4 top-4 h-5 w-5 text-[#70372D]" aria-hidden />
                  </div>

                  <div className="grid gap-3">
                    <Button
                      type="button"
                      onClick={() => pipeline.handleSubmit()}
                      disabled={pipeline.isLoading || !pipeline.foodName.trim()}
                      className="w-full h-12 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] text-base font-bold shadow-sm"
                    >
                      {pipeline.isLoading ? 'Malzemeler Aranıyor...' : '1. Malzeme Listesini Bul'}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGetRecipeAndCalorie}
                      disabled={isCalorieLoading || !pipeline.foodName.trim()}
                      className="w-full h-12 rounded-2xl bg-[#FFB6A6] text-[#4A1E17] hover:bg-[#FA9E8B] text-sm font-bold shadow-2xs"
                    >
                      {isCalorieLoading
                        ? 'Tarif & Kalori Hazırlanıyor...'
                        : '2. Yemek Tarifi ve Kalori Detayı Al'}
                    </Button>
                  </div>

                  {calorieError && (
                    <InlineAlert message={calorieError} className="mt-4" />
                  )}

                  {calorieInfo && (
                    <Button
                      type="button"
                      onClick={() => setShowRecipeModal(true)}
                      className="w-full h-11 rounded-2xl bg-[#FFEBD3] text-[#2D1E12] border border-[#F7A898] hover:bg-[#FFECE8] font-bold text-sm"
                    >
                      <ChefHat className="mr-2 h-4 w-4 text-[#0E2C24]" />
                      Hazırlanan Tarifi Görüntüle
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: INGREDIENTS */}
            {pipeline.currentStep === 'ingredients' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <div className="p-3 rounded-full bg-[#FFEBD3] border border-[#F7A898] w-14 h-14 mx-auto flex items-center justify-center text-[#0E2C24] mb-2">
                    <Package className="h-7 w-7 stroke-[2.5]" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-[#2D1E12]">Tespit Edilen Malzemeler</h2>
                  <p className="text-xs font-semibold text-[#70372D]">
                    Evinizde olan veya almak istemediğiniz malzemeleri listeden çıkarabilirsiniz
                  </p>
                </div>

                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {pipeline.ingredients.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="flex items-center justify-between rounded-2xl border border-[#F7A898]/60 bg-[#FFEBD3] p-3.5 shadow-2xs"
                    >
                      <span className="text-sm font-bold capitalize text-[#2D1E12]">{ingredient}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => pipeline.removeIngredient(ingredient)}
                        className="h-8 px-3 rounded-xl bg-[#FFB6A6]/40 text-[#4A1E17] hover:bg-[#FFB6A6] text-xs font-bold"
                      >
                        <X size={14} className="mr-1" /> Çıkar
                      </Button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                  <Button
                    type="button"
                    onClick={pipeline.confirmIngredients}
                    disabled={pipeline.isLoading || pipeline.ingredients.length === 0}
                    className="flex-1 h-12 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] font-bold text-sm shadow-sm"
                  >
                    {pipeline.isLoading ? 'Fiyatlar Aranıyor...' : 'Malzemeleri Onayla & Marketleri Tara'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={pipeline.resetForm}
                    className="h-12 rounded-2xl bg-[#FFEBD3] text-[#4A1E17] border-[#F7A898] font-bold text-sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Yeniden Başla
                  </Button>
                </div>

                {/* Extra Product Search */}
                <Card className="border border-[#F7A898]/70 bg-[#FFEBD3] rounded-2xl mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold font-heading text-[#2D1E12]">
                      Ekstra Ürün Veya İçecek Ekle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: PROCESSING */}
            {pipeline.currentStep === 'processing' && (
              <div className="text-center space-y-4 py-8" role="status" aria-live="polite">
                <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[#F7A898]" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#9BCEC1] border-t-transparent" />
                  <Clock className="h-8 w-8 text-[#0E2C24]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-heading text-[#2D1E12]">
                    En Uygun Fiyatlar Hesaplanıyor...
                  </h2>
                  <p className="text-xs font-semibold text-[#70372D]">
                    Seçili marketlerdeki stoklar kontrol ediliyor ve en düşük maliyetli kombinasyon oluşturuluyor
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: COMPLETE */}
            {pipeline.currentStep === 'complete' && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <div className="p-3 rounded-full bg-[#9BCEC1] text-[#0E2C24] w-14 h-14 mx-auto flex items-center justify-center mb-2 shadow-xs">
                    <CheckCircle className="h-8 w-8 stroke-[2.5]" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-[#2D1E12]">Analiz Tamamlandı</h2>
                  <p className="text-xs font-semibold text-[#70372D]">
                    Market bazlı en hesaplı sepet dağılımınız aşağıda listelenmiştir
                  </p>
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
                  <div className="rounded-2xl border border-[#F7A898]/70 bg-[#FFEBD3] p-5 space-y-3">
                    <h3 className="text-base font-bold font-heading text-[#2D1E12]">
                      Marketlerde Bulunan Birincil Malzemeler
                    </h3>
                    <ul className="space-y-2.5">
                      {pipeline.results.firstSelectedProduct.map((product) => {
                        const depot = safeDepot(product);
                        const logo = depot ? getMarketLogo(depot.marketAdi) : null;
                        return (
                          <li
                            key={product.id}
                            className="flex items-center justify-between rounded-xl border border-[#F7A898]/40 bg-[#FFECE8] p-3"
                          >
                            <div className="flex items-center gap-3">
                              {logo ? (
                                <div className="relative h-6 w-14 shrink-0 flex items-center justify-center bg-[#FFEBD3] p-1 rounded-lg border border-[#F7A898]/50 shadow-2xs">
                                  <Image
                                    src={logo}
                                    alt={depot?.marketAdi || ''}
                                    fill
                                    unoptimized
                                    className="object-contain p-0.5"
                                  />
                                </div>
                              ) : (
                                <Store className="h-5 w-5 text-[#0E2C24]" />
                              )}
                              <div>
                                <h4 className="font-bold text-sm text-[#2D1E12]">{product.title}</h4>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-[#0E2C24] bg-[#9BCEC1] px-2.5 py-1 rounded-lg">
                              {depot?.price ?? '—'} ₺
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {pipeline.results.selectedProducts.length > 0 && (
                  <div className="rounded-2xl border border-[#F7A898]/70 bg-[#FFEBD3] p-5 space-y-3">
                    <h3 className="flex items-center text-base font-bold font-heading text-[#2D1E12]">
                      <Sparkles className="mr-2 h-5 w-5 text-[#0E2C24] stroke-[2.5]" />
                      KENSAI Önerili  Ürünler
                    </h3>
                    <ul className="space-y-2.5">
                      {pipeline.results.selectedProducts.map((product) => {
                        const depot = safeDepot(product);
                        const logo = depot ? getMarketLogo(depot.marketAdi) : null;
                        const matched = selections.find(
                          (item) => item.product?.title === product.title
                        );
                        return (
                          <li
                            key={product.id}
                            className="flex items-center justify-between rounded-xl border border-[#F7A898]/40 bg-[#FFECE8] p-3"
                          >
                            <div className="flex items-center gap-3">
                              {logo ? (
                                <div className="relative h-6 w-14 shrink-0 flex items-center justify-center bg-[#FFEBD3] p-1 rounded-lg border border-[#F7A898]/50 shadow-2xs">
                                  <Image
                                    src={logo}
                                    alt={depot?.marketAdi || ''}
                                    fill
                                    unoptimized
                                    className="object-contain p-0.5"
                                  />
                                </div>
                              ) : (
                                <Store className="h-5 w-5 text-[#0E2C24]" />
                              )}
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-sm text-[#2D1E12]">{product.title}</h4>
                                {matched?.reasoning && (
                                  <span className="block text-xs font-semibold text-[#4A1E17]">
                                    Öneri Sebebi: {matched.reasoning}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-[#0E2C24] bg-[#9BCEC1] px-2.5 py-1 rounded-lg">
                              {depot?.price ?? 'N/A'} ₺
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={pipeline.resetForm}
                  className="w-full h-12 rounded-2xl bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] font-bold text-sm shadow-sm"
                >
                  <Search className="mr-2 h-4 w-4 stroke-[2.5]" />
                  Yeni Yemek Tarifi veya Malzeme Ara
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
