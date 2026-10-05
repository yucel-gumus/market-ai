import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { handleMarketProductSearchRoute, validateMarketProductSearchBody } from './marketApiProxy';
import { MARKET_API_PATHS } from '@/constants';
vi.mock('@/lib/env', () => ({ getMarketApiUrl: () => 'https://api.marketfiyati.org.tr/api/v2', isProduction: () => true }));
const geo = { latitude: 41, longitude: 29, distance: 1, depots: ['a101-a'] };
afterEach(() => { vi.unstubAllGlobals(); });
describe('official API contract forwarding', () => {
  it('uses the V3 root and forwards category arrays and order without requiring a keyword', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ content: [], numberOfFound: 0 })); vi.stubGlobal('fetch', fetch);
    const body = { ...geo, pages: 0, size: 24, main_category: ['Süt'], sub_category: ['UHT Süt'], order: { name: 'offer_unit_price', type: 'asc' } };
    const response = await handleMarketProductSearchRoute(new NextRequest('http://localhost/api/search-by-categories', { method: 'POST', body: JSON.stringify(body) }), MARKET_API_PATHS.SEARCH_BY_CATEGORIES);
    expect(response.status).toBe(200);
    expect(fetch.mock.calls[0][0]).toBe('https://api.marketfiyati.org.tr/api/v3/searchByCategories');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(body);
  });
  it('forwards exact product identities to V1 while rejecting invalid pagination and filters', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ content: [], numberOfFound: 0 })); vi.stubGlobal('fetch', fetch);
    const response = await handleMarketProductSearchRoute(new NextRequest('http://localhost/api/sync-products', { method: 'POST', body: JSON.stringify({ ...geo, identities: ['milk'], identityType: 'id' }) }), MARKET_API_PATHS.LIST_SYNC);
    expect(response.status).toBe(200);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/list/sync');
    expect(validateMarketProductSearchBody({ ...geo, latitude: NaN })).toBeTruthy();
    expect(validateMarketProductSearchBody({ ...geo, pages: -1 })).toBeTruthy();
    expect(validateMarketProductSearchBody({ ...geo, size: 1.5 })).toBeTruthy();
    expect(validateMarketProductSearchBody({ ...geo, size: 101 })).toBeTruthy();
    expect(validateMarketProductSearchBody({ ...geo, size: 100 })).toBeNull();
    expect(validateMarketProductSearchBody({ ...geo, main_category: [42 as unknown as string] })).toBeTruthy();
  });
});
