import { NextRequest } from 'next/server';
import { MARKET_API_PATHS } from '@/constants';
import { handleMarketProductSearchRoute } from '@/lib/marketApiProxy';

export async function POST(request: NextRequest) {
  return handleMarketProductSearchRoute(
    request,
    MARKET_API_PATHS.SEARCH_BY_CATEGORIES,
    { includeMenuCategory: true }
  );
}
