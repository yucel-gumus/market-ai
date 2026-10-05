import { findOptimalDepot, itemQuantity, validPrice } from '@/lib/shoppingUtils';
import type { CartItem, Product, ProductDepotInfo } from '@/types';

function validDepot(value: unknown): value is ProductDepotInfo {
  if (!value || typeof value !== 'object') return false;
  const depot = value as ProductDepotInfo;
  return typeof depot.marketAdi === 'string' && typeof depot.depotName === 'string'
    && typeof depot.depotId === 'string' && validPrice(depot.price) !== null;
}

/** Eski miktarsız sepetleri taşır; bozuk localStorage kayıtlarını atlar. */
export function restoreCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const product = raw.product as Product | undefined;
    if (!product || typeof product.id !== 'string' || !product.id || typeof product.title !== 'string'
      || !Array.isArray(product.productDepotInfoList)) continue;
    const cleanProduct = { ...product, productDepotInfoList: product.productDepotInfoList.filter(validDepot) };
    const depot = findOptimalDepot(cleanProduct, items);
    if (!depot) continue;
    const date = new Date(raw.addedAt);
    const item: CartItem = { product: cleanProduct, selectedDepot: depot,
      quantity: itemQuantity(raw), addedAt: Number.isFinite(date.getTime()) ? date : new Date() };
    const existing = items.findIndex(i => i.product.id === product.id);
    if (existing >= 0) items[existing] = item;
    else items.push(item);
  }
  return items;
}
