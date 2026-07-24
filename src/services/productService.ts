import { DEFAULTS, SEARCH } from '@/constants';
import apiClient from '@/lib/axios';
import { ProductSearchRequest, ProductSearchResponse, Product } from '@/types';

export class ProductService {
  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    const { data } = await apiClient.post<ProductSearchResponse>('/search-products', {
      ...request,
      pages: request.pages ?? DEFAULTS.PAGE,
      size: request.size ?? DEFAULTS.PAGE_SIZE,
    });

    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      (data as { success?: boolean }).success === false
    ) {
      const err = data as { error?: string };
      throw new Error(err.error || 'Ürün arama başarısız');
    }

    return data;
  }

  /** Canlı arama: tek sayfa (hızlı) */
  static async searchLivePage(
    request: Omit<ProductSearchRequest, 'pages' | 'size'> & { size?: number }
  ): Promise<Product[]> {
    const pageData = await this.searchProducts({
      ...request,
      pages: DEFAULTS.PAGE,
      size: request.size ?? SEARCH.LIVE_PAGE_SIZE,
    });
    return pageData.content || [];
  }

  /** Tüm sayfalar — API'den veri gelmeyene kadar (content = []) */
  static async searchAllProducts(
    request: Omit<ProductSearchRequest, 'pages'>
  ): Promise<ProductSearchResponse> {
    const allProducts: Product[] = [];
    let currentPage = 0;
    const size = request.size ?? DEFAULTS.PAGE_SIZE;

    while (true) {
      const pageData = await this.searchProducts({
        ...request,
        pages: currentPage,
        size,
      });

      if (!pageData.content || pageData.content.length === 0) {
        break;
      }
      allProducts.push(...pageData.content);
      currentPage++;
    }

    return {
      content: allProducts,
      totalElements: allProducts.length,
      totalPages: currentPage,
      number: 0,
      size: allProducts.length,
    };
  }
}
