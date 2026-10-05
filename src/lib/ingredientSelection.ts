import { validPrice } from '@/lib/shoppingUtils';
import { normalizeString } from '@/lib/stringUtils';
import type { Product } from '@/types';
import type { SelectProductsProduct, SelectProductsSelection } from '@/services/llmService';

export type IngredientMatch = {
  ingredient: string;
  product?: Product;
  candidates: Product[];
  source?: 'ai' | 'manual';
  reasoning?: string;
  requiredAmount?: import('@/lib/recipeQuantity').IngredientRequirement;
  packageQuantity?: number;
};

/**
 * Sunucudan gelen ürünü sepet/ekran modeline çevirir.
 * Kimlik yoksa veya geçerli fiyatlı tek bir depo bile yoksa ürün kabul edilmez —
 * fiyatı doğrulanamayan ürün sepete girmemeli.
 */
export function toProduct(raw?: SelectProductsProduct | null): Product | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id) return null;
  const depotInfoList = (raw.productDepotInfoList ?? []).filter(d => validPrice(d.price) !== null);
  if (!depotInfoList.length) return null;
  return {
    id: raw.id,
    title: raw.title,
    brand: raw.brand,
    imageUrl: raw.imageUrl,
    refinedVolumeOrWeight: raw.refinedVolumeOrWeight,
    main_category: raw.main_category,
    menu_category: raw.menu_category,
    categories: raw.categories,
    productDepotInfoList: depotInfoList,
  };
}

/**
 * Sunucu-taraflı seçim yanıtını ekran modeline çevirir.
 * Ürün arama, seçim ve doğrulama sunucuda yapıldı; istemci YENİDEN eşleştirmez
 * (başlık karşılaştırması gibi kırılgan sezgiler yok).
 */
export function buildIngredientMatches(
  ingredients: string[],
  selections: SelectProductsSelection[]
): IngredientMatch[] {
  return ingredients.map(ingredient => {
    const key = normalizeString(ingredient);
    const answer = selections.find(s => normalizeString(s?.searchedIngredient ?? '') === key);
    const candidates = (answer?.alternatives ?? []).map(toProduct).filter((p): p is Product => p !== null);
    const product =
      answer?.success === true && answer.matchType === 'direct' ? toProduct(answer.product) : null;
    // Seçilen ürün aday listesinde yoksa kullanıcı onu yine de görebilsin.
    if (product && !candidates.some(candidate => candidate.id === product.id)) {
      candidates.unshift(product);
    }
    return product
      ? { ingredient, product, candidates, source: 'ai' as const, reasoning: answer?.reasoning || undefined }
      : { ingredient, candidates };
  });
}
