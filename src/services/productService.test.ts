import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/lib/axios';
import { ProductService, mergeProductPages } from './productService';
vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));
const post = vi.mocked(apiClient.post);
const request = { keywords: 'süt', latitude: 41, longitude: 29, distance: 5, depots: ['a'], size: 50 };
const product = (id: string) => ({ id, title: `Süt ${id}`, productDepotInfoList: [] });
beforeEach(() => { post.mockReset(); });
describe('live API pagination integrity', () => {
  it('collects every page when upstream clamps requested size and omits legacy fields', async () => {
    post.mockResolvedValueOnce({ data: { content: [product('1'), product('2')], numberOfFound: 5, searchResultType: 1, checkedAt: '2026-10-04T12:00:00Z' } });
    post.mockResolvedValueOnce({ data: { content: [product('3'), product('4')], numberOfFound: 5 } });
    post.mockResolvedValueOnce({ data: { content: [product('5')], numberOfFound: 5, facetMap: null } });
    const result = await ProductService.searchAllProducts(request);
    expect(result.content.map(p => p.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(result.content[0].priceCheckedAt).toBe('2026-10-04T12:00:00Z');
    expect(post.mock.calls.map(call => (call[1] as { pages: number }).pages)).toEqual([0, 1, 2]);
  });
  it('does not truncate legitimate searches at 20 pages', async () => {
    post.mockImplementation(async (_url, body) => {
      const page = (body as { pages: number }).pages;
      return { data: { numberOfFound: 525, content: Array.from({ length: 25 }, (_, i) => product(String(page * 25 + i))) } };
    });
    expect((await ProductService.searchAllProducts(request)).content).toHaveLength(525);
    expect(post).toHaveBeenCalledTimes(21);
  });
  it('rejects failed, repeating or prematurely empty pages instead of claiming completion', async () => {
    post.mockResolvedValueOnce({ data: { content: [product('1')], numberOfFound: 2 } }).mockRejectedValueOnce(new Error('Service unavailable'));
    await expect(ProductService.searchAllProducts(request)).rejects.toThrow('Service unavailable');
    post.mockReset().mockResolvedValue({ data: { content: [product('1')], numberOfFound: 2 } });
    await expect(ProductService.searchAllProducts(request)).rejects.toThrow('tekrarladı');
    expect(post).toHaveBeenCalledTimes(2);
    post.mockReset().mockResolvedValueOnce({ data: { content: [product('1')], numberOfFound: 2 } }).mockResolvedValueOnce({ data: { content: [], numberOfFound: 2 } });
    await expect(ProductService.searchAllProducts(request)).rejects.toThrow('1/2');
  });
  it('uses an empty terminal page when no total is supplied', async () => {
    post.mockResolvedValueOnce({ data: { content: [product('1')] } }).mockResolvedValueOnce({ data: { content: [] } });
    expect((await ProductService.searchAllProducts(request)).content).toHaveLength(1);
    expect(post).toHaveBeenCalledTimes(2);
  });
  it('merges duplicate IDs without dropping new branch offers', () => {
    const depot = (id: string) => ({ depotId: id, depotName: id, marketAdi: 'Market', price: 10, unitPrice: '10' });
    expect(mergeProductPages([{ content: [{ ...product('1'), productDepotInfoList: [depot('a')] }] }, { content: [{ ...product('1'), productDepotInfoList: [depot('b')] }] }])[0].productDepotInfoList.map(d => d.depotId)).toEqual(['a', 'b']);
  });
  it('rejects malformed products and respects cancellation', async () => {
    post.mockResolvedValueOnce({ data: { content: 'not an array' } });
    await expect(ProductService.searchAllProducts(request)).rejects.toThrow('geçerli bir ürün listesi');
    const controller = new AbortController(); controller.abort();
    post.mockReset();
    await expect(ProductService.searchAllProducts(request, '/search-products', controller.signal)).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
  it('refreshes exact IDs in batches and uses the same page contract', async () => {
    post.mockImplementation(async (_url, body) => ({ data: { numberOfFound: (body as { identities: string[] }).identities.length, content: (body as { identities: string[] }).identities.map(product) } }));
    const ids = Array.from({ length: 26 }, (_, i) => String(i));
    expect(await ProductService.syncProducts(ids, request)).toHaveLength(26);
    expect(post.mock.calls.every(call => call[0] === '/sync-products')).toBe(true);
    expect(post).toHaveBeenCalledTimes(2);
  });
});
