import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SEARCH } from '@/constants';
import { ProductService, mergeProductPages, nextProductPage } from '@/services/productService';
import type { SearchSettings } from '@/types';

interface Props { query: string; searchSettings: SearchSettings | null; enabled?: boolean }

export const useProductSearch = ({ query, searchSettings, enabled = true }: Props) => {
  const active = Boolean(enabled && searchSettings && query.trim().length >= SEARCH.MIN_QUERY_LENGTH);
  const result = useInfiniteQuery({
    queryKey: ['products', query.trim(), searchSettings?.depots, searchSettings?.latitude, searchSettings?.longitude, searchSettings?.distance],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => ProductService.searchProducts({
      keywords: query.trim(), latitude: searchSettings!.latitude, longitude: searchSettings!.longitude,
      distance: searchSettings!.distance, depots: searchSettings!.depots, pages: pageParam, size: SEARCH.LIVE_PAGE_SIZE,
    }, '/search-products', signal),
    getNextPageParam: (_last, pages) => {
      // Expose inconsistent/repeating pagination as a recoverable visible error below.
      try { return nextProductPage(pages); } catch { return undefined; }
    },
    enabled: active, staleTime: 60_000, gcTime: 120_000, retry: false, refetchOnWindowFocus: false,
  });
  const pages = result.data?.pages;
  const products = useMemo(() => mergeProductPages(pages ?? []), [pages]);
  let paginationError: Error | null = null;
  try { if (pages) nextProductPage(pages); } catch (error) { paginationError = error as Error; }
  const { hasNextPage, isFetching, isError, fetchNextPage } = result;
  useEffect(() => {
    if (active && hasNextPage && !isFetching && !isError) void fetchNextPage();
  }, [active, hasNextPage, isFetching, isError, fetchNextPage]);
  const totalResults = pages?.reduce((max, page) => Math.max(max, page.numberOfFound ?? 0), products.length) ?? 0;
  return { ...result, data: products, totalResults, loadedResults: products.length,
    isComplete: active && result.isSuccess && !result.isFetching && !result.hasNextPage && !paginationError,
    error: paginationError ?? result.error,
    retrySearch: () => result.isFetchNextPageError ? result.fetchNextPage() : result.refetch(),
  };
};
