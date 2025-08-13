import { useQuery } from '@tanstack/react-query';
import { MarketService } from '@/services/marketService';
import { Market, MarketSearchRequest } from '@/types';
import { isApiError, getErrorMessage } from '@/lib/errorUtils';

export const useMarketSearch = (request: MarketSearchRequest | null) => {
  return useQuery<Market[], Error>({
    queryKey: ['markets', request],
    queryFn: () => {
      if (!request) throw new Error('Search request is required');
      return MarketService.searchNearbyMarkets(request);
    },
    
    enabled: Boolean(
      request && 
      request.latitude && 
      request.longitude && 
      request.distance > 0
    ),
    
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    
    retry: (failureCount, error) => {
      if (isApiError(error)) {
        return false;
      }
      return failureCount < 3;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    meta: {
      errorMessage: (error: Error) => getErrorMessage(error)
    }
  });
};

export const useDistanceOptions = () => {
  return MarketService.getDistanceOptions();
};
