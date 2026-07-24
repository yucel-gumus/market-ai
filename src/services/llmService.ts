import { TIMEOUTS_MS } from '@/constants';
import apiClient from '@/lib/axios';

export interface RecipeListResponse {
  success: boolean;
  ingredients: string[];
  message?: string;
}

export interface IngredientCategoryItem {
  ingredient: string;
  category: string;
}

export interface IngredientCategoriesResponse {
  success: boolean;
  categories: IngredientCategoryItem[];
  message?: string;
}

export interface SelectProductsProduct {
  title: string;
  price: number;
}

export interface SelectProductsSelection {
  success: boolean;
  searchedIngredient: string;
  matchType: string;
  reasoning: string;
  product: {
    title: string;
    price: number;
  };
}

export interface SelectProductsResponse {
  success: boolean;
  selections: SelectProductsSelection[];
  message?: string;
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

export class LlmService {
  static async generateRecipeList(recipeName: string): Promise<RecipeListResponse> {
    const { data } = await apiClient.post<RecipeListResponse>(
      '/ai-page/recipe-list',
      { recipe_name: recipeName },
      { timeout: TIMEOUTS_MS.LLM_BACKEND }
    );
    return data;
  }

  static async generateCategory(
    ingredients: string[],
    categoryList: string
  ): Promise<IngredientCategoriesResponse> {
    const { data } = await apiClient.post<IngredientCategoriesResponse>(
      '/ai-page/ingredient-categories',
      {
        ingredients: ingredients.join(', '),
        category_list: categoryList,
      },
      { timeout: TIMEOUTS_MS.LLM_BACKEND }
    );
    return data;
  }

  static async selectProducts(
    products: SelectProductsProduct[],
    ingredients: string[],
    recipeName: string
  ): Promise<SelectProductsResponse> {
    const { data } = await apiClient.post<SelectProductsResponse>(
      '/ai-page/select-products',
      {
        recipe_name: recipeName,
        ingredients: ingredients.join(', '),
        products,
      },
      { timeout: TIMEOUTS_MS.LLM_BACKEND }
    );
    return data;
  }

  static async generateRecipeAndCalorie(
    recipeName: string
  ): Promise<RecipeWithCaloriesResponse> {
    const { data } = await apiClient.post<RecipeWithCaloriesResponse>(
      '/ai-page/recipe-with-calories',
      { recipe_name: recipeName },
      { timeout: TIMEOUTS_MS.LLM_BACKEND }
    );
    return data;
  }
}
