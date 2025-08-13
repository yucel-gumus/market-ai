import { ProductSearchRequest, ProductSearchResponse } from '@/types';

export class ProductService {
  /**
   * Ürün arama API'si
   */
  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    const response = await fetch('https://api.marketfiyati.org.tr/api/v2/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Birden fazla sayfa için tüm ürünleri arar
   */
  static async searchAllProducts(request: Omit<ProductSearchRequest, 'pages'>): Promise<ProductSearchResponse> {
    const allProducts = [];
    let currentPage = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      const pageRequest: ProductSearchRequest = {
        ...request,
        pages: currentPage
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
      size: allProducts.length
    };
  }
}
