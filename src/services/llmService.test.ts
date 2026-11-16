import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveLlmEndpoint } from './llmService';

const originalDirectUrl = process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalDirectUrl === undefined) {
    delete process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL;
  } else {
    process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL = originalDirectUrl;
  }
});

describe('resolveLlmEndpoint', () => {
  it('keeps relative /ai-page proxy path on SSR, localhost, and Vercel previews', () => {
    delete process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL;
    expect(resolveLlmEndpoint('select-products')).toBe('/ai-page/select-products');

    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    expect(resolveLlmEndpoint('select-products')).toBe('/ai-page/select-products');

    vi.stubGlobal('window', { location: { hostname: 'market-ai-git-preview.vercel.app' } });
    expect(resolveLlmEndpoint('select-products')).toBe('/ai-page/select-products');
  });

  it('routes directly to Cloud Run on production market-ai-coral.vercel.app', () => {
    delete process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL;
    vi.stubGlobal('window', { location: { hostname: 'market-ai-coral.vercel.app' } });

    expect(resolveLlmEndpoint('select-products')).toBe(
      'https://python-backend-270384591051.europe-west3.run.app/api/market-ai/select-products'
    );
    expect(resolveLlmEndpoint('recipe-list')).toBe(
      'https://python-backend-270384591051.europe-west3.run.app/api/market-ai/recipe-list'
    );
    expect(resolveLlmEndpoint('recipe-with-calories')).toBe(
      'https://python-backend-270384591051.europe-west3.run.app/api/market-ai/recipe-with-calories'
    );
  });

  it('honors NEXT_PUBLIC_DIRECT_PYTHON_API_URL override when set', () => {
    process.env.NEXT_PUBLIC_DIRECT_PYTHON_API_URL = 'https://custom-backend.example.com/';
    expect(resolveLlmEndpoint('select-products')).toBe(
      'https://custom-backend.example.com/api/market-ai/select-products'
    );
  });
});
