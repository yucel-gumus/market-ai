import { useQuery } from '@tanstack/react-query';
import { MarketService } from '@/services/marketService';
import { MarketSearchRequest, Market } from '@/types';

export const useMarketSearch = (request: MarketSearchRequest | null) => {
  return useQuery<Market[], Error>({
    queryKey: ['markets', request],
    
    queryFn: () => request ? MarketService.searchNearbyMarkets(request) : Promise.resolve([]),
    
    enabled: Boolean(
      request && 
      request.latitude && 
      request.longitude && 
      request.distance > 0
    ),
    
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    
    retry: (failureCount, error) => {
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
export const getMarketSearchQueryKey = (searchRequest: MarketSearchRequest | null) => 
  ['markets', searchRequest];
export const useDistanceOptions = () => {
  return MarketService.getDistanceOptions();
};
