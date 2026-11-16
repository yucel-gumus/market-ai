import { TIMEOUTS_MS } from '@/constants';
import apiClient from '@/lib/axios';

export interface RecipeListResponse {
  success: boolean;
  ingredients: string[];
  ingredientDetails?: import('@/lib/recipeQuantity').IngredientRequirement[];
  message?: string;
}

export interface SelectProductsProduct {
  id?: string;
  title: string;
  price?: number;
  brand?: string;
  imageUrl?: string;
  refinedVolumeOrWeight?: string;
  main_category?: string;
  menu_category?: string;
  categories?: string[];
  productDepotInfoList?: import('@/types').ProductDepotInfo[];
  market?: string;
  depotName?: string;
}

export interface SelectProductsSelection {
  success: boolean;
  searchedIngredient: string;
  matchType: string;
  reasoning: string;
  product?: SelectProductsProduct | null;
  /** Kullanıcı ürünü değiştirmek isterse seçebileceği doğrulanmış adaylar. */
  alternatives?: SelectProductsProduct[];
}

export interface SelectProductsSummary {
  total?: number;
  selected?: number;
  unresolved?: string[];
  match_rate?: number;
  basket_total?: number;
  markets?: Record<string, number>;
  single_market_totals?: Record<string, number>;
  cheapest_single_market?: { market: string; total: number } | null;
  closest_market?: { market: string; covered: number; total: number; missing: string[]; partial_total?: number } | null;
}

export interface SelectProductsResponse {
  success: boolean;
  selections: SelectProductsSelection[];
  message?: string;
  summary?: SelectProductsSummary | null;
  /** Backend'in malzeme başına alternatif ürün seçenekleriyle ürettiği konsolidasyon planları. */
  plans?: import('@/types').ConsolidationPlans;
}

export interface RecipeWithCaloriesResponse {
  success: boolean;
  name?: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  calories?: number;
  nutrition?: string | Record<string, unknown>;
  message?: string;
}

export type LlmOperation = 'recipe-list' | 'select-products' | 'recipe-with-calories';

const PRODUCTION_VERCEL_HOSTS = new Set(['market-ai-coral.vercel.app']);
const DIRECT_PYTHON_BACKEND_URL = 'https://python-backend-270384591051.europe-west3.run.app';

export function resolveLlmEndpoint(operation: LlmOperation): string {
  const configured = process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL?.trim();
  if (configured) {
    return `${configured.replace(/\/+$/, '')}/api/market-ai/${operation}`;
  }
  if (typeof window !== 'undefined' && PRODUCTION_VERCEL_HOSTS.has(window.location.hostname)) {
    return `${DIRECT_PYTHON_BACKEND_URL}/api/market-ai/${operation}`;
  }
  return `/ai-page/${operation}`;
}

export class LlmService {
  static async generateRecipeList(recipeName: string, signal?: AbortSignal): Promise<RecipeListResponse> {
    const { data } = await apiClient.post<RecipeListResponse>(
      resolveLlmEndpoint('recipe-list'),
      { recipe_name: recipeName },
      { timeout: TIMEOUTS_MS.LLM_BACKEND, signal }
    );
    return data;
  }

  /**
   * Ürünleri SUNUCU bulur ve seçer; istemci aday ürün göndermez.
   * Konum verilirse o bölgedeki marketler kullanılır.
   */
  static async selectProducts(
    ingredients: string[],
    recipeName: string,
    location?: { latitude: number; longitude: number; distance?: number; depots?: string[] },
    signal?: AbortSignal
  ): Promise<SelectProductsResponse> {
    const { data } = await apiClient.post<SelectProductsResponse>(
      resolveLlmEndpoint('select-products'),
      {
        recipe_name: recipeName,
        ingredients: ingredients.join(', '),
        ...(location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              distance: location.distance,
              depots: location.depots,
            }
          : {}),
      },
      { timeout: TIMEOUTS_MS.LLM_BACKEND, signal }
    );
    return data;
  }

  static async generateRecipeAndCalorie(
    recipeName: string,
    signal?: AbortSignal
  ): Promise<RecipeWithCaloriesResponse> {
    const { data } = await apiClient.post<RecipeWithCaloriesResponse>(
      resolveLlmEndpoint('recipe-with-calories'),
      { recipe_name: recipeName },
      { timeout: TIMEOUTS_MS.LLM_BACKEND, signal }
    );
    return data;
  }
}
