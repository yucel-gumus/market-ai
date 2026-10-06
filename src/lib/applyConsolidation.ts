import type { ConsolidationPlan, Product } from '@/types';

/** Sepetteki malzeme başına mevcut seçim (plan uygulanırken karşılaştırma için). */
export interface CurrentIngredientPick {
  ingredient: string;
  product?: Product;
  /** Sepetteki adet; plan ürünü değiştiriyorsa korunur. */
  quantity?: number;
}

export interface CartChanges {
  /** Sepetten çıkarılacak ürün kimlikleri (plan farklı ürün seçtiyse). */
  removes: string[];
  /** Sepete eklenecek ürünler; şube plandan sabitlenir. */
  adds: { product: Product; depotId: string; quantity: number }[];
  /** Ürün aynı kalıp yalnızca şube sabitlenecekse. */
  depotUpdates: { productId: string; depotId: string }[];
  /** Kullanıcıya gösterilecek ürün değişimleri. */
  switches: { ingredient: string; fromTitle?: string; toTitle?: string }[];
  /** Planın kapsadığı ürün kimlikleri (tariftten eklenenler takibi için). */
  productIds: string[];
}

/**
 * Konsolidasyon planını sepette uygulanacak değişikliklere çevirir (saf fonksiyon).
 * Kural: plan farklı bir ürün seçtiyse eski ürün çıkarılır ve yenisi sabitlenmiş şubeyle eklenir;
 * ürün aynıysa yalnızca şube sabitlenir. Adet, sepetteki mevcut değerden korunur.
 */
export function planCartChanges(plan: ConsolidationPlan, current: CurrentIngredientPick[]): CartChanges {
  const changes: CartChanges = { removes: [], adds: [], depotUpdates: [], switches: [], productIds: [] };
  for (const item of plan.items) {
    const found = current.find(entry => entry.ingredient === item.ingredient);
    if (!found) continue;
    const sameProduct = found.product?.id === item.product.id;
    if (found.product && !sameProduct) {
      changes.removes.push(found.product.id);
      changes.switches.push({ ingredient: item.ingredient, fromTitle: found.product.title, toTitle: item.product.title });
    }
    if (sameProduct) {
      changes.depotUpdates.push({ productId: item.product.id, depotId: item.depotId });
    } else {
      const quantity = found.quantity && found.quantity > 0 ? found.quantity : 1;
      changes.adds.push({ product: item.product, depotId: item.depotId, quantity });
    }
    changes.productIds.push(item.product.id);
  }
  return changes;
}
