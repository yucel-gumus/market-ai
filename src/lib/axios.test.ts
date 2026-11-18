import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { ApiClientError } from './axios';

describe('fetch-backed apiClient', () => {
  const originalBaseUrl = apiClient.defaults.baseURL;

  beforeEach(() => {
    apiClient.defaults.baseURL = '/api';
  });

  afterEach(() => {
    apiClient.defaults.baseURL = originalBaseUrl;
    vi.unstubAllGlobals();
  });

  it('builds relative GET URLs with query parameters and omits baseURL for absolute URLs', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const getRes = await apiClient.get<{ ok: boolean }>('/search-addresses', {
      params: { words: 'üsküdar', empty: undefined },
    });
    expect(getRes.data).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/search-addresses?words=%C3%BCsk%C3%BCdar');

    apiClient.defaults.baseURL = 'http://localhost:3116/api';
    await apiClient.post('/search-products', { keywords: 'süt' });
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3116/api/search-products');

    await apiClient.post('https://backend.example.com/api/market-ai/recipe-list', { recipe_name: 'çorba' });
    expect(fetchMock.mock.calls[2][0]).toBe('https://backend.example.com/api/market-ai/recipe-list');
  });

  it('throws ApiClientError with extracted server message and isNetworkError=false on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Geçersiz oturum' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      )
    );

    await expect(apiClient.post('/search-markets', {})).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Geçersiz oturum',
      status: 400,
      isNetworkError: false,
    });
  });

  it('throws ApiClientError with isNetworkError=true on transport failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    let caught: unknown;
    try {
      await apiClient.post('/search-markets', {});
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiClientError);
    expect((caught as ApiClientError).isNetworkError).toBe(true);
    expect((caught as ApiClientError).status).toBe('No status');
  });

  it('rethrows cancellation without wrapping in ApiClientError when caller signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn());

    let caught: unknown;
    try {
      await apiClient.post('/search-products', {}, { signal: controller.signal });
    } catch (err) {
      caught = err;
    }

    expect(caught).not.toBeInstanceOf(ApiClientError);
  });
});
