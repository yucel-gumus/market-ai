import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/services/productService';
import { SearchSettings, Product } from '@/types';

interface UseProductSearchProps {
  query: string;
  searchSettings: SearchSettings | null;
  enabled?: boolean;
}
export const useProductSearch = ({ 
  query, 
  searchSettings, 
  enabled = true 
}: UseProductSearchProps) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', query, searchSettings?.depots],
    
    queryFn: async () => {
      if (!searchSettings || query.length < 2) {
        return [];
      }

      const response = await ProductService.searchAllProducts({
        keywords: query,
        size: searchSettings.size,
        latitude: searchSettings.latitude,
        longitude: searchSettings.longitude,
        distance: searchSettings.distance,
        depots: searchSettings.depots
      });

      return response.content || [];
    },
    
    enabled: Boolean(
      enabled && 
      searchSettings && 
      query.length >= 2
    ),
    
  staleTime: 60 * 1000, 
  gcTime: 2 * 60 * 1000,
    
    retry: (failureCount, error) => {
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  refetchOnWindowFocus: false,
  });
};

export const getProductSearchQueryKey = (query: string, depots?: string[]) => 
  ['products', query, depots];
