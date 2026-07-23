import { useQuery } from '@tanstack/react-query';
import { SEARCH } from '@/constants';
import { isApiError } from '@/lib/errorUtils';
import { ProductService } from '@/services/productService';
import { SearchSettings, Product } from '@/types';

interface UseProductSearchProps {
  query: string;
  searchSettings: SearchSettings | null;
  enabled?: boolean;
  /** true: tüm sayfalar (AI). false/default: tek sayfa (canlı arama) */
  fetchAllPages?: boolean;
}

export const useProductSearch = ({
  query,
  searchSettings,
  enabled = true,
  fetchAllPages = false,
}: UseProductSearchProps) => {
  return useQuery<Product[], Error>({
    queryKey: [
      'products',
      query,
      searchSettings?.depots,
      fetchAllPages ? 'all' : 'live',
    ],
    queryFn: async () => {
      if (!searchSettings || query.length < SEARCH.MIN_QUERY_LENGTH) {
        return [];
      }

      const base = {
        keywords: query,
        latitude: searchSettings.latitude,
        longitude: searchSettings.longitude,
        distance: searchSettings.distance,
        depots: searchSettings.depots,
      };

      if (fetchAllPages) {
        const response = await ProductService.searchAllProducts({
          ...base,
          size: searchSettings.size,
        });
        return response.content || [];
      }

      return ProductService.searchLivePage(base);
    },
    enabled: Boolean(
      enabled && searchSettings && query.length >= SEARCH.MIN_QUERY_LENGTH
    ),
    staleTime: 60 * 1000,
    gcTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isApiError(error)) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
  });
};
