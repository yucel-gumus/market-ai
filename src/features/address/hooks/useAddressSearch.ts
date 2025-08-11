import { useQuery } from '@tanstack/react-query';
import { AddressService } from '@/services/addressService';
import { ParsedAddress } from '@/types';

export const useAddressSearch = (query: string) => {
  return useQuery<ParsedAddress[], Error>({
    queryKey: ['addresses', query],
    
    queryFn: () => AddressService.searchAddresses(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    
    retry: (failureCount, error) => {
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    
    refetchOnReconnect: false,
  });
};

export const getAddressSearchQueryKey = (query: string) => ['addresses', query];
