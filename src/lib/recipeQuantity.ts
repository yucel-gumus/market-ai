import type { Product } from '@/types';
export interface IngredientRequirement { name: string; amount: number; unit: 'g' | 'ml' | 'adet' }

/** Unknown pack sizes stay unknown; no guessed glass/spoon conversion here. */
export function recipePackageQuantity(product: Product, requirement?: IngredientRequirement): number | undefined {
  if (!requirement || !Number.isFinite(requirement.amount) || requirement.amount <= 0) return undefined;
  const raw = (product.refinedVolumeOrWeight || product.title).toLocaleLowerCase('tr-TR');
  const match = raw.match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|gr|gram|g|ml|lt|litre|l|adet)\b/i);
  if (!match) return undefined;
  const amount = Number(match[2].replace(',', '.')) * Number(match[1] ?? 1);
  const label = match[3].toLowerCase();
  const unit = ['kg', 'gr', 'gram', 'g'].includes(label) ? 'g' : label === 'adet' ? 'adet' : 'ml';
  if (unit !== requirement.unit || !Number.isFinite(amount) || amount <= 0) return undefined;
  const canonical = amount * (label === 'kg' || ['lt', 'litre', 'l'].includes(label) ? 1000 : 1);
  const quantity = Math.ceil(requirement.amount / canonical);
  return quantity > 0 && quantity <= 999 ? quantity : undefined;
}
