import { describe, it, expect } from 'vitest';
import apiClient from '@/lib/axios';
import { ProductService } from './productService';
import type { Market, ProductSearchResponse } from '@/types';

// Explicit opt-in: default unit tests never depend on public upstream availability.
describe.skipIf(process.env.MARKET_LIVE_TEST !== '1')('live Market Fiyatı via application proxy', () => {
  it('collects all declared products and synchronizes exact IDs', async () => {
    apiClient.defaults.baseURL = `${process.env.MARKET_LIVE_BASE_URL || 'http://localhost:3000'}/api`;
    const geo = { latitude: 40.9905, longitude: 29.0283, distance: 1 };
    const { data } = await apiClient.post<{ success: boolean; data: Market[] }>('/search-markets', geo);
    expect(data.success).toBe(true);
    const depots = data.data.map(m => m.id);
    const request = { ...geo, depots, keywords: 'süt', size: 24 };

    const response: ProductSearchResponse = await ProductService.searchAllProducts(request);
    expect(response.content.length).toBe(response.numberOfFound);
    expect(new Set(response.content.map(p => p.id)).size).toBe(response.content.length);

    const synced = await ProductService.syncProducts(response.content.slice(0, 2).map(p => p.id), request);
    expect(synced.map(p => p.id).sort()).toEqual(response.content.slice(0, 2).map(p => p.id).sort());
    console.log(JSON.stringify({ totalProducts: response.content.length, synchronized: synced.length }));
  }, 120_000);
});
