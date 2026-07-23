'use client';

import { useCallback, useState } from 'react';
import categoriesData from '@/data/categoriesList.json';
import { SEARCH } from '@/constants';
import {
  fetchCategoriesData,
  fetchUrunData,
  filterProductsByIngredient,
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
    async (products: Product[], missingItems: string[], name: string) => {
      try {
        const productTitlesAndPrice = products
          .map((product) => {
            const price = getCheapestDepotPrice(product);
            if (price == null) return null;
            return { title: product.title, price };
          })
          .filter((x): x is { title: string; price: number } => x != null);

        if (productTitlesAndPrice.length === 0) {
          setCurrentStep('complete');
          return;
        }

        const selectedResponse = await LlmService.selectProducts(
          productTitlesAndPrice,
          missingItems,
          name
        );
        const selectedResult = selectedResponse.selections || [];
        setSearchResults(selectedResult);

        const selectedProductsData = (
          await withConcurrency(
            SEARCH.AI_CONCURRENCY,
            selectedResult.map(
              (sel) => () =>
                fetchUrunData(sel.product?.title || '').then((list) => list[0] || null)
            )
          )
        ).filter((p): p is Product => Boolean(p && p.productDepotInfoList?.length));

        if (selectedProductsData.length) {
          addManyToCart(selectedProductsData);
        }
        setResults((prev) => ({
          ...prev,
          selectedProducts: selectedProductsData,
        }));
        setCurrentStep('complete');
      } catch (err) {
        setError(toErrorMessage(err, 'Ürün seçimi sırasında hata'));
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

  const confirmIngredients = useCallback(async () => {
    setIsLoading(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const productResults = await withConcurrency(
        SEARCH.AI_CONCURRENCY,
        ingredients.map(
          (ingredient) => () =>
            fetchUrunData(ingredient).then((found) => ({
              ingredient,
              matches: filterProductsByIngredient(found as Product[], ingredient),
            }))
        )
      );

      const missing: string[] = [];
      const firstProducts: Product[] = [];

      productResults.forEach(({ ingredient, matches }) => {
        const valid = (matches as Product[]).filter(
          (p) => p.productDepotInfoList?.length
        );
        if (valid.length > 0) {
          firstProducts.push(valid[0]);
        } else {
          missing.push(ingredient);
        }
      });

      if (firstProducts.length) {
        addManyToCart(firstProducts);
      }

      setResults((prev) => ({
        ...prev,
        firstSelectedProduct: firstProducts,
        missingProducts: missing,
      }));

      if (missing.length > 0) {
        await findAlternativeProducts(missing, foodName);
      } else {
        setCurrentStep('complete');
      }
    } catch (err) {
      setError(toErrorMessage(err, 'Ürün arama sırasında hata'));
      setCurrentStep('complete');
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, foodName, addManyToCart, findAlternativeProducts]);

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
