'use client';

import { useCallback, useState } from 'react';
import categoriesData from '@/data/categoriesList.json';
import { SEARCH } from '@/constants';
import {
  fetchCategoriesData,
  fetchUrunData,
  getCheapestDepotPrice,
} from '@/lib/clientMarketSearch';
import { toErrorMessage } from '@/lib/errorUtils';
import { withConcurrency } from '@/lib/utils';
import { LlmService } from '@/services/llmService';
import type { Product } from '@/types';

export type PipelineStep = 'input' | 'ingredients' | 'processing' | 'complete';

export type PipelineResults = {
  missingProducts: string[];
  categoryData: unknown;
  availableProducts: Product[];
  selectedProducts: Product[];
  firstSelectedProduct: Product[];
};

const emptyResults = (): PipelineResults => ({
  missingProducts: [],
  categoryData: null,
  availableProducts: [],
  selectedProducts: [],
  firstSelectedProduct: [],
});

interface UseRecipePipelineOptions {
  addManyToCart: (products: Product[]) => void;
  clearCart: () => void;
}

type TaggedProduct = Product & { targetIngredient?: string };

/** Malzeme başına AI'ya gönderilecek maksimum aday ürün sayısı */
const CANDIDATES_PER_INGREDIENT = 25;

export function useRecipePipeline({ addManyToCart, clearCart }: UseRecipePipelineOptions) {
  const [foodName, setFoodName] = useState('');
  const [currentStep, setCurrentStep] = useState<PipelineStep>('input');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<{ ingredients: string[] } | null>(null);
  const [results, setResults] = useState<PipelineResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<unknown[]>([]);

  const categoryList = categoriesData.categories.join(', ');

  const resetForm = useCallback(() => {
    setFoodName('');
    clearCart();
    setCurrentStep('input');
    setRecipe(null);
    setIngredients([]);
    setResults(emptyResults());
    setError(null);
    setSearchResults([]);
  }, [clearCart]);

  const removeIngredient = useCallback((ingredient: string) => {
    setIngredients((prev) => prev.filter((item) => item !== ingredient));
  }, []);

  const handleSubmit = useCallback(
    async (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
      if (!foodName.trim()) return;

      setIsLoading(true);
      setError(null);
      setResults(emptyResults());
      clearCart();

      try {
        const recipeData = await LlmService.generateRecipeList(foodName);
        if (recipeData.success) {
          setRecipe(recipeData);
          setIngredients(recipeData.ingredients);
          setCurrentStep('ingredients');
        } else {
          setError('Malzeme bulunamadı');
        }
      } catch (err) {
        setError(toErrorMessage(err, 'Malzeme listesi alınamadı'));
      } finally {
        setIsLoading(false);
      }
    },
    [foodName, clearCart]
  );

  const selectBestProducts = useCallback(
    async (candidateProducts: TaggedProduct[], targetIngredients: string[], recipeName: string) => {
      try {
        const uniqueTitles = new Set<string>();
        const productTitlesAndPrice: import('@/services/llmService').SelectProductsProduct[] = [];

        for (const product of candidateProducts) {
          const price = getCheapestDepotPrice(product);
          if (price == null || uniqueTitles.has(product.title)) continue;
          uniqueTitles.add(product.title);
          productTitlesAndPrice.push({
            title: product.title,
            price,
            ingredient: product.targetIngredient,
            main_category: product.main_category,
            menu_category: product.menu_category,
            categories: product.categories,
          });
        }
        if (productTitlesAndPrice.length === 0) {
          setCurrentStep('complete');
          return;
        }

        // Python Backend AI: Tüm ham ürünler arasından en uygun ürünleri AI seçsin
        const selectedResponse = await LlmService.selectProducts(
          productTitlesAndPrice,
          targetIngredients,
          recipeName
        );
        const selectedResult = selectedResponse.selections || [];

        setSearchResults((prev) => [...(Array.isArray(prev) ? prev : []), ...selectedResult]);

        // AI'nın seçtiği ürünleri bellekteki candidateProducts'tan anında eşleştir
        let selectedProductsData: Product[] = [];
        if (selectedResult.length > 0) {
          selectedProductsData = selectedResult
            .map((sel) => {
              const matchedTitle = sel.product?.title;
              const foundProduct =
                candidateProducts.find((p) => p.title === matchedTitle) ||
                candidateProducts.find((p) => p.targetIngredient === sel.searchedIngredient);
              return foundProduct || null;
            })
            .filter((p): p is Product => Boolean(p && p.productDepotInfoList?.length));
        }

        // Güvenli Alternatif: Eğer AI boş dönerse aday ürünleri doğrudan kullan
        if (selectedProductsData.length === 0 && candidateProducts.length > 0) {
          selectedProductsData = candidateProducts.slice(0, targetIngredients.length);
        }

        if (selectedProductsData.length) {
          addManyToCart(selectedProductsData);
        }
        setResults((prev) => ({
          ...prev,
          selectedProducts: [...prev.selectedProducts, ...selectedProductsData],
        }));
        setCurrentStep('complete');
      } catch (err) {
        console.error('❌ [MarketAI LLM Error]:', err);
        if (candidateProducts.length > 0) {
          const fallbackList = candidateProducts.slice(0, targetIngredients.length);
          addManyToCart(fallbackList);
          setResults((prev) => ({
            ...prev,
            selectedProducts: [...prev.selectedProducts, ...fallbackList],
          }));
        }
        setCurrentStep('complete');
      }
    },
    [addManyToCart]
  );

  const findAlternativeProducts = useCallback(
    async (missingItems: string[], name: string) => {
      try {
        const categoryResult = await LlmService.generateCategory(
          missingItems,
          categoryList
        );
        setResults((prev) => ({ ...prev, categoryData: categoryResult }));

        if (categoryResult.categories?.length) {
          const categoryNames = [
            ...new Set(categoryResult.categories.map((c) => c.category)),
          ];

          const categoryProducts = await withConcurrency(
            SEARCH.AI_CONCURRENCY,
            categoryNames.map((cat) => () => fetchCategoriesData(cat))
          );
          const allProducts = categoryProducts.flat().filter(
            (p): p is Product => Boolean(p?.productDepotInfoList?.length)
          );
          setResults((prev) => ({ ...prev, availableProducts: allProducts }));
          await selectBestProducts(allProducts, missingItems, name);
        } else {
          setCurrentStep('complete');
        }
      } catch (err) {
        setError(toErrorMessage(err, 'Kategori arama sırasında hata'));
        setCurrentStep('complete');
      }
    },
    [categoryList, selectBestProducts]
  );

  function getRefinedSearchQuery(ingredient: string): string[] {
    const queries = [ingredient];
    const lower = ingredient.toLowerCase().trim();

    if (lower.endsWith(' eti') && lower.length > 5) {
      queries.push(lower.replace(/\s+eti$/, ''));
    }
    return queries;
  }

  const confirmIngredients = useCallback(async () => {
    setIsLoading(true);
    setCurrentStep('processing');
    setError(null);

    try {
      // 1. Market API'den her malzeme için arama yap (akıllı sorgu türetme ile)
      const productResults = await withConcurrency(
        SEARCH.AI_CONCURRENCY,
        ingredients.map(
          (ingredient) => async () => {
            const queries = getRefinedSearchQuery(ingredient);
            const allFound: Product[] = [];

            for (const q of queries) {
              const found = await fetchUrunData(q);
              const valid = (found as Product[]).filter(
                (p) => p?.title && p.productDepotInfoList?.length
              );
              allFound.push(...valid);
            }

            const seen = new Set<string>();
            const rawProducts = allFound.filter((p) => {
              const key = p.id || p.title;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return {
              ingredient,
              products: rawProducts,
            };
          }
        )
      );

      const candidateProducts: TaggedProduct[] = [];
      const missing: string[] = [];

      productResults.forEach(({ ingredient, products }) => {
        if (products.length > 0) {
          // Fiyata göre sırala (en ucuz önce) ve ham adayları doğrudan Multi-Agent sistemine gönder
          const sorted = [...products].sort((a, b) => {
            const pa = getCheapestDepotPrice(a) ?? Infinity;
            const pb = getCheapestDepotPrice(b) ?? Infinity;
            return pa - pb;
          });
          const tagged = sorted.slice(0, CANDIDATES_PER_INGREDIENT).map((p) => ({
            ...p,
            targetIngredient: ingredient,
          }));
          candidateProducts.push(...tagged);

        } else {
          missing.push(ingredient);
        }
      });

      // 2. Tüm etiketli ham market ürünlerini doğrudan Python AI backend'e gönder
      if (candidateProducts.length > 0) {
        await selectBestProducts(candidateProducts, ingredients, foodName);
      }

      // 3. Eğer eksik kalan malzeme varsa kategoriye göre AI alternatif arasın
      if (missing.length > 0) {
        await findAlternativeProducts(missing, foodName);
      } else if (candidateProducts.length === 0) {
        setCurrentStep('complete');
      }
    } catch (err) {
      setError(toErrorMessage(err, 'Ürün arama sırasında hata'));
      setCurrentStep('complete');
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, foodName, findAlternativeProducts, selectBestProducts]);

  return {
    foodName,
    setFoodName,
    currentStep,
    ingredients,
    setIngredients,
    recipe,
    results,
    isLoading,
    error,
    setError,
    searchResults,
    handleSubmit,
    confirmIngredients,
    removeIngredient,
    resetForm,
  };
}
