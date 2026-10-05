import { it, expect, vi } from 'vitest';
import apiClient from '@/lib/axios';
import { MarketService } from './marketService';
vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));
it('converts all nearest API distances from meters, including branches closer than 100m', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true, data: [
    { id: 'near', marketName: 'A', sellerName: 'Near', distance: 94.132562, location: { lat: 41, lon: 29 } },
    { id: 'far', marketName: 'B', sellerName: 'Far', distance: 116.878, location: { lat: 41, lon: 29 } },
  ] } });
  const markets = await MarketService.searchNearbyMarkets({ latitude: 41, longitude: 29, distance: 1 });
  expect(markets.map(m => m.id)).toEqual(['near', 'far']);
  expect(markets[0].distance).toBeCloseTo(.094132562);
});
