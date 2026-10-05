import { DEFAULTS } from '@/constants';
import apiClient from '@/lib/axios';
import type { ProductSearchRequest, ProductSearchResponse, Product } from '@/types';

export type ProductEndpoint = '/search-products' | '/search-by-categories' | '/sync-products';
export type ProductQuery = Omit<ProductSearchRequest, 'pages'>;

/** A duplicate ID can carry additional branch offers on another page. */
export function mergeProductPages(pages: ProductSearchResponse[]): Product[] {
  const products = new Map<string, Product>();
  for (const page of pages) for (const product of page.content) {
    const existing = products.get(product.id);
    if (!existing) { products.set(product.id, product); continue; }
    const depots = new Map(existing.productDepotInfoList.map(d => [d.depotId, d]));
    for (const depot of product.productDepotInfoList) depots.set(depot.depotId, depot);
    products.set(product.id, { ...existing, ...product, productDepotInfoList: [...depots.values()] });
  }
  return [...products.values()];
}

/** Never infer completion from requested size: upstream can clamp it. */
export function nextProductPage(pages: ProductSearchResponse[]): number | undefined {
  const last = pages.at(-1);
  if (!last) return 0;
  const found = pages.map(p => p.numberOfFound).filter((n): n is number => typeof n === 'number');
  const total = found.length ? Math.max(...found) : undefined;
  const uniqueCount = mergeProductPages(pages).length;
  if (!last.content.length) {
    if (total !== undefined && uniqueCount < total) throw new Error(`Arama tamamlanamadı: ${uniqueCount}/${total} ürün alındı. Tekrar deneyin.`);
    return undefined;
  }
  if (total !== undefined && uniqueCount >= total) return undefined;
  if (pages.length > 1 && uniqueCount === mergeProductPages(pages.slice(0, -1)).length) {
    throw new Error('Market servisi aynı ürün sayfasını tekrarladı. Arama tamamlanamadı; tekrar deneyin.');
  }
  // Retain compatibility with older controlled integrations without relying on these fields.
  if (total === undefined && typeof last.totalPages === 'number' && pages.length >= last.totalPages) return undefined;
  return pages.length;
}

export class ProductService {
  static async searchProducts(request: ProductSearchRequest | Record<string, unknown>, endpoint: ProductEndpoint = '/search-products', signal?: AbortSignal): Promise<ProductSearchResponse> {
    const { data } = await apiClient.post<ProductSearchResponse>(endpoint, {
      ...request, pages: request.pages ?? DEFAULTS.PAGE, size: request.size ?? DEFAULTS.PAGE_SIZE,
    }, { signal });
    if (data && 'success' in data && (data as { success?: boolean }).success === false) throw new Error((data as { error?: string }).error || 'Ürün arama başarısız');
    if (!data || !Array.isArray(data.content) || data.content.some(p => !p || typeof p.id !== 'string' || !p.id || typeof p.title !== 'string' || !Array.isArray(p.productDepotInfoList))) {
      throw new Error('Market servisi geçerli bir ürün listesi döndürmedi.');
    }
    if (data.numberOfFound !== undefined && (!Number.isSafeInteger(data.numberOfFound) || data.numberOfFound < 0)) throw new Error('Market servisi geçersiz sonuç sayısı döndürdü.');
    return { ...data, content: data.content.map(product => ({ ...product, priceCheckedAt: data.checkedAt })) };
  }

  static async searchAllProducts(request: ProductQuery | Record<string, unknown>, endpoint: ProductEndpoint = '/search-products', signal?: AbortSignal): Promise<ProductSearchResponse> {
    const pages: ProductSearchResponse[] = [];
    let page: number | undefined = 0;
    while (page !== undefined) {
      signal?.throwIfAborted();
      pages.push(await this.searchProducts({ ...request, pages: page }, endpoint, signal));
      page = nextProductPage(pages);
    }
    const last = pages.at(-1)!;
    return { ...last, numberOfFound: Math.max(...pages.map(p => p.numberOfFound ?? 0), mergeProductPages(pages).length), content: mergeProductPages(pages) };
  }

  static async syncProducts(ids: string[], settings: Pick<ProductSearchRequest, 'latitude' | 'longitude' | 'distance' | 'depots'>): Promise<Product[]> {
    const products: Product[] = [];
    // Small exact-ID batches respect the observed upstream page size and avoid title search.
    for (let offset = 0; offset < ids.length; offset += DEFAULTS.PAGE_SIZE) {
      const identities = [...new Set(ids.slice(offset, offset + DEFAULTS.PAGE_SIZE))];
      const response = await this.searchAllProducts({ ...settings, identities, identityType: 'id', size: DEFAULTS.PAGE_SIZE }, '/sync-products');
      products.push(...response.content.filter(p => identities.includes(p.id)));
    }
    return products;
  }
}
