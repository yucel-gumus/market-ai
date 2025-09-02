'use client';
import { useState, useEffect } from 'react';
import { ChefHat, Search, CheckCircle, Clock, ShoppingCart, Package, Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { SearchInput } from '@/features/products/components/SearchInput';
import { generateRecipeList, generateCategory, tamurunbul, generateRecipeAndCalorie } from '@/components/llm/requestLLM.js';
import categoriesData from '@/data/categoriesList.json';
import { fetchCategoriesData } from '@/app/api/ai-page/searchByCategories';
import { fetchUrunData } from '@/app/api/ai-page/searchByProductsName';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductSearch } from '@/features/products/hooks/useProductSearch';
import { useDebounce } from 'use-debounce';
import { useShoppingCart } from '@/features/products/hooks/useShoppingCart';
import { useLocalStorageSettings } from '@/features/products/hooks/useLocalStorageSettings';
import { SearchStatsDisplay } from '@/features/products/components/SearchStatsDisplay';
import { ProductDropdown } from '@/features/products/components/ProductDropdown';
import { X, Utensils, Flame, Clock as ClockIcon, Users } from "lucide-react";
import { cn, getMarketLogo } from '@/lib/utils';
import Image from "next/image";
import { ShoppingCartSummary } from '@/features/products/components/ShoppingCartSummary';
import { MultiStoreRouteModal } from '@/features/products/components/MultiStoreRouteModal';
import { RouteModal } from '@/features/products/components/RouteModal';

function FoodInput() {
  const [calorieInfo, setCalorieInfo] = useState(null);
  const [isCalorieLoading, setIsCalorieLoading] = useState(false);
  const [calorieError, setCalorieError] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const handleGetRecipeAndCalorie = async () => {
    if (!foodName || !foodName.trim()) return;
    setIsCalorieLoading(true);
    setCalorieError(null);
    setCalorieInfo(null);
    try {
      const data = await generateRecipeAndCalorie(foodName);
      if (data.success) {
        setCalorieInfo(data);
        setShowRecipeModal(true);
      } else {
        setCalorieError(data.message || 'Tarif veya kalori bilgisi bulunamadı.');
      }
    } catch (err) {
      setCalorieError('Bir hata oluştu: ' + err.message);
    } finally {
      setIsCalorieLoading(false);
    }
  };

  const {
    optimization,
    addToCart,
    removeFromCart,
    clearCart,
    generateRoute,
    marketCount
  } = useShoppingCart();

  const {
    searchSettings,
    isLoading: isSettingsLoading,
    error: settingsError
  } = useLocalStorageSettings();

  const [showSingleMap, setShowSingleMap] = useState(false);
  const [showMultiMap, setShowMultiMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [realRouteDistance, setRealRouteDistance] = useState(undefined);
  const [realRouteTime, setRealRouteTime] = useState(undefined);

  const handleShowRoute = (depot) => {
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

  const handleMultiRouteFound = (routeData) => {
    setRealRouteDistance(routeData.distance);
    setRealRouteTime(routeData.time);
  };

  const handleViewMultiRoute = () => {
    setShowMultiMap(true);
  };

  const handleRouteFound = (info) => {
    setRouteInfo(prevInfo => {
      if (!prevInfo || prevInfo.distance !== info.distance || prevInfo.time !== info.time) {
        return info;
      }
      return prevInfo;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 450);

  const router = useRouter();

  const [foodName, setFoodName] = useState('');
  const [currentStep, setCurrentStep] = useState('input');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError
  } = useProductSearch({
    query: debouncedQuery,
    searchSettings: searchSettings
  });

  const [searchResults, setSearchResults] = useState([]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.length >= 2);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const searchStats = {
    totalResults: products.length
  };

  const [results, setResults] = useState({
    missingProducts: [],
    categoryData: null,
    availableProducts: [],
    selectedProducts: [],
    firstSelectedProduct: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoBack = () => {
    router.push('/');
  };

  const gotoProductSearch = () => {
    router.push('/product-search');
  };

  const categoryList = categoriesData.categories.map(c => c.category).join(', ');

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!foodName.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults({
      missingProducts: [],
      categoryData: null,
      availableProducts: [],
      selectedProducts: [],
      firstSelectedProduct: []
    });

    try {
      const recipeData = await generateRecipeList(foodName);
      if (recipeData.success) {
        setRecipe(recipeData);
        setIngredients(recipeData.ingredients);
        setCurrentStep('ingredients');
      } else {
        setError('Malzeme Bulunamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeIngredient = (ingredient) => {
    setIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const confirmIngredients = async () => {
    setIsLoading(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const productResults = await Promise.all(
        ingredients.map(async (ingredient) => {
          const foundProducts = await fetchUrunData(ingredient);
          const exactMatch = foundProducts.filter(
            product => product.title.toLowerCase() === ingredient.toLowerCase()
          );
          return { ingredient, exactMatch };
        })
      );

      const missing = [];
      const firstProducts = [];

      productResults.forEach(({ ingredient, exactMatch }) => {
        if (exactMatch.length > 0) firstProducts.push(...exactMatch);
        if (exactMatch.length === 0) missing.push(ingredient);
      });

      firstProducts.forEach((product) => {
        addToCart(product);
      });

      setResults(prev => ({
        ...prev,
        firstSelectedProduct: firstProducts,
        missingProducts: missing
      }));

      if (missing.length > 0) {
        await findAlternativeProducts(missing);
      } else {
        setCurrentStep('complete');
      }
    } catch (err) {
      setError('Ürün arama sırasında hata: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const findAlternativeProducts = async (missingItems) => {
    try {
      const categoryResult = await generateCategory(missingItems, categoryList);
      setResults(prev => ({ ...prev, categoryData: categoryResult }));

      if (categoryResult.categories?.length > 0) {
        const categoryGroups = categoryResult.categories.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item.ingredient);
          return acc;
        }, {});

        const categoryNames = Object.keys(categoryGroups);
        const categoryProducts = await Promise.all(
          categoryNames.map(name => fetchCategoriesData(name))
        );
        const allProducts = categoryProducts.flatMap(x => x);
        setResults(prev => ({ ...prev, availableProducts: allProducts }));

        await selectBestProducts(allProducts, missingItems);
      }
    } catch (err) {
      setError('Kategori arama sırasında hata: ' + err.message);
    }
  };

  const selectBestProducts = async (products, missingItems) => {
    try {
      const productTitlesAndPrice = products.map(product => ({
        title: product.title,
        price: product.productDepotInfoList[0].price
      }));
      const selectedResult = await tamurunbul(productTitlesAndPrice, missingItems, foodName);
      setSearchResults(selectedResult);

      if (selectedResult) {
        const selectedProductsData = await Promise.all(
          selectedResult.map(async (product) => {
            const productData = await fetchUrunData(product.product.title);
            return productData[0] || null;
          })
        );
        selectedProductsData.filter(Boolean).forEach((product) => {
          addToCart(product);
        });
        setResults(prev => ({ ...prev, selectedProducts: selectedProductsData.filter(Boolean) }));
      }
      setCurrentStep('complete');
    } catch (err) {
      setError('Ürün seçimi sırasında hata: ' + err.message);
    }
  };

  const resetForm = () => {
    setFoodName('');
    clearCart();
    setCurrentStep('input');
    setRecipe(null);
    setIngredients([]);
    setResults({
      missingProducts: [],
      categoryData: null,
      availableProducts: [],
      selectedProducts: [],
      firstSelectedProduct: []
    });
    setError(null);
  };

  const getStepIcon = (step) => {
    const iconClass = "w-8 h-8";
    switch (step) {
      case 'input': return <Search className={iconClass} />;
      case 'ingredients': return <Package className={iconClass} />;
      case 'processing': return <Clock className={iconClass} />;
      case 'complete': return <CheckCircle className={iconClass} />;
      default: return <Search className={iconClass} />;
    }
  };

  const getStepColor = (step, currentStep) => {
    const steps = ['input', 'ingredients', 'processing', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return 'bg-green-500 text-white';
    if (stepIndex === currentIndex) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  useEffect(() => {
    if (clearCart) {
      clearCart();
    }
  }, []);

  const handleAddToCart = (product) => {
    const productName = product.title;
    if (!ingredients.includes(productName)) {
      setIngredients(prev => [...prev, productName]);
    }
  };

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
              onClick={gotoProductSearch}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfa
            </Button>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
            {settingsError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 active:bg-green-700 transition-colors duration-200"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Konumu Sıfırla & Seç</span>
          </Button>
          <Button
            onClick={gotoProductSearch}
            size="sm"
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Ürün Ara</span>
              <div className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
              </div>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-12 h-12 text-orange-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Yemek Tarifi ve Malzeme Bulucu</h1>
          </div>
          <p className="text-gray-600 text-lg">Yemek adını girin, malzemeleri bulalım!</p>
        </div>

        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          {['input', 'ingredients', 'processing', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`rounded-full p-3 transition-all duration-300 ${getStepColor(step, currentStep)}`}>
                {getStepIcon(step)}
              </div>
              {index < 3 && (
                <ArrowRight className="w-6 h-6 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
          {/* Recipe Modal */}
          {showRecipeModal && calorieInfo && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 relative">
                  <button
                    onClick={() => setShowRecipeModal(false)}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <ChefHat className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{calorieInfo.name}</h2>
                      <p className="text-orange-100 text-lg mt-1">{calorieInfo.description}</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-8 bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-yellow-300" />
                      <div>
                        <div className="text-2xl font-bold">{calorieInfo.calories}</div>
                        <div className="text-sm text-orange-100">kcal/porsiyon</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-orange-200" />
                      <div>
                        <div className="text-xl font-semibold">4</div>
                        <div className="text-sm text-orange-100">kişilik</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-6 h-6 text-orange-200" />
                      <div>
                        <div className="text-xl font-semibold">30</div>
                        <div className="text-sm text-orange-100">dakika</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Malzemeler */}
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-r border-green-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-green-500 p-3 rounded-full">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800">Malzemeler</h3>
                      </div>
                      <div className="space-y-3">
                        {calorieInfo.ingredients?.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-4 p-4 bg-white/70 rounded-lg hover:bg-white/90 transition-colors duration-200 hover:shadow-md"
                          >
                            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 font-medium text-lg">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hazırlanışı */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-500 p-3 rounded-full">
                          <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-blue-800">Hazırlanışı</h3>
                      </div>
                      <div className="space-y-4">
                        {calorieInfo.steps?.map((step, idx) => (
                          <div 
                            key={idx} 
                            className="flex gap-4 p-4 bg-white/70 rounded-lg hover:bg-white/90 transition-colors duration-200 hover:shadow-md"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-gray-700 leading-relaxed text-lg">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Besin Değerleri */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-500 p-3 rounded-full">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-purple-800">Besin Değerleri</h3>
                    </div>
                    <div className="bg-white/70 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed text-lg">{calorieInfo.nutrition}</p>
                    </div>
                  </div>
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
              routeSteps={generateRoute(searchSettings.latitude, searchSettings.longitude)}
              searchSettings={searchSettings}
              realRouteDistance={realRouteDistance}
              realRouteTime={realRouteTime}
              onMultiRouteFound={handleMultiRouteFound}
            />
          )}

          {currentStep === 'input' && (
            <div className="text-center">
              <div className="mb-6">
                <ChefHat className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Hangi yemeği yapmak istiyorsunuz?</h2>
                <p className="text-gray-600">Yemek adını girin, size malzeme listesi ve en uygun fiyatları bulalım</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <input
                    type="text"
                    id="foodName"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Lütfen bir yemek adı girin"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors"
                  />
                  <Search className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !foodName.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Malzeme aranıyor...
                    </div>
                  ) : (
                    'Malzeme Bul'
                  )}
                </button>

                <button
                  onClick={handleGetRecipeAndCalorie}
                  disabled={isCalorieLoading || !foodName.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCalorieLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Tarif & Kalori aranıyor...
                    </div>
                  ) : (
                    'Yemek Tarifi ve Kalori Bilgisi Al'
                  )}
                </button>

                {calorieError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4 flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                    {calorieError}
                  </div>
                )}

                {calorieInfo && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowRecipeModal(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto"
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Tarifi Görüntüle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'ingredients' && (
            <div>
              <div className="text-center mb-6">
                <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Malzeme Listesi</h2>
                <p className="text-gray-600">İstemediğiniz malzemeleri çıkarabilirsiniz</p>
              </div>

              <div className="grid gap-3 mb-8">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border-2 border-transparent hover:border-orange-200 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-lg text-gray-700 capitalize">{ingredient}</span>
                    </div>
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl 
                       hover:bg-red-100 hover:scale-105 hover:shadow-md 
                       transition-all duration-200 text-sm font-semibold"
                    >
                      <X size={16} />
                      Ürünü Çıkar
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={confirmIngredients}
                  disabled={isLoading}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      İşleniyor...
                    </div>
                  ) : (
                    'Malzemeleri Onayla'
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 sm:flex-none bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Yeniden Başla
                </button>
              </div>

              <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-blue-600">🔍</span>
                    Ekstra Ürün Ekleme
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
                      onAddToCart={handleAddToCart}
                      onProductAdded={() => {
                        setSearchQuery('');
                        setIsDropdownOpen(false);
                      }}
                      isProductInCart={(productId) =>
                        products.some(p => p.id === productId &&
                          ingredients.some(ing => p.title.toLowerCase() === ing.toLowerCase())
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  <Clock className="w-8 h-8 text-blue-500 absolute top-6 left-6" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Malzemeler kontrol ediliyor...</h2>
                <p className="text-gray-600">Lütfen bekleyin, ürünler aranıyor ve en uygun alternatifler bulunuyor.</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-blue-700 mt-4 font-medium">İşleniyor...</p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div>
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sonuçlar</h2>
                <p className="text-gray-600">Malzemeleriniz için en uygun ürünler bulundu</p>
              </div>

              <div className="space-y-6">
                {optimization && (
                  <ShoppingCartSummary
                    optimization={optimization}
                    onViewRoute={handleViewMultiRoute}
                    onViewSingleRoute={handleShowRoute}
                    onClearCart={clearCart}
                    onRemoveItem={removeFromCart}
                  />
                )}

                {results.firstSelectedProduct.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-xl font-semibold text-green-800">Markette direk bulunan Ürünler</h3>
                    </div>
                    <div className="space-y-3">
                      {results.firstSelectedProduct.map((product, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">{product.title}</h4>
                              <Image
                                src={getMarketLogo(product.productDepotInfoList[0].marketAdi)}
                                alt={`${product.productDepotInfoList[0].marketAdi} logo`}
                                width={32}
                                height={32}
                                className="max-w-8 max-h-8 object-contain"
                              />
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">{product.productDepotInfoList[0].price}₺</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.selectedProducts.length > 0 && searchResults.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <ShoppingCart className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-xl font-semibold text-blue-800">
                        LLM Alternatif Ürünler
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {results.selectedProducts.map((product, index) => {
                        const matched = searchResults.find(
                          (item) => item.product.title === product.title
                        );

                        return (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg shadow-sm border border-blue-100"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-800">{product.title}</h4>

                                {matched && (
                                  <span className="block text-sm text-blue-600">
                                    {matched.reasoning}
                                  </span>
                                )}
                                <Image
                                  src={getMarketLogo(product.productDepotInfoList[0].marketAdi)}
                                  alt={`${product.productDepotInfoList[0].marketAdi} logo`}
                                  width={32}
                                  height={32}
                                  className="max-w-8 max-h-8 object-contain"
                                />
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {product.productDepotInfoList[0].price || "N/A"} ₺
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetForm}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Yeni Malzeme Ara
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodInput;