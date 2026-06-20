import apiClient from '@/lib/axios';
import { ProductSearchRequest, ProductSearchResponse } from '@/types';

export class ProductService {

  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    const { data } = await apiClient.post<ProductSearchResponse>('/search-products', {
      ...request,
      pages: request.pages ?? 0,
      size: request.size ?? 50,
    });

    if (data && typeof data === 'object' && 'success' in data && (data as { success?: boolean }).success === false) {
      const err = data as { error?: string };
      throw new Error(err.error || 'Ürün arama başarısız');
    }

    return data;
  }

  static async searchAllProducts(request: Omit<ProductSearchRequest, 'pages'>): Promise<ProductSearchResponse> {
    const allProducts = [];
    let currentPage = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      const pageRequest: ProductSearchRequest = {
        ...request,
        pages: currentPage,
        size: request.size ?? 50,
      };

      const pageData = await this.searchProducts(pageRequest);

      if (!pageData.content || pageData.content.length === 0) {
        hasMorePages = false;
      } else {
        allProducts.push(...pageData.content);
        currentPage++;
      }
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