import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { createBackendProxyHandler, validateBackendPayload } from './backendProxy';

function mockJsonRequest(rawBody: string): NextRequest {
  return {
    text: async () => rawBody,
  } as unknown as NextRequest;
}

describe('validateBackendPayload', () => {
  it('accepts valid recipe-list and select-products payloads', () => {
    expect(validateBackendPayload('recipe-list', { recipe_name: 'Mercimek Çorbası (4 kişilik)' })).toBeNull();
    expect(
      validateBackendPayload('select-products', {
        recipe_name: 'Menemen',
        ingredients: 'domates, biber, yumurta',
        latitude: 41.0,
        longitude: 29.0,
        distance: 5,
        depots: ['d1', 'd2'],
      })
    ).toBeNull();
  });

  it('rejects invalid recipe names, ingredients, and out-of-range coordinates or distance', () => {
    expect(validateBackendPayload('recipe-list', { recipe_name: 'a' })).not.toBeNull();
    expect(validateBackendPayload('recipe-list', { recipe_name: 'x'.repeat(301) })).not.toBeNull();
    expect(validateBackendPayload('select-products', { recipe_name: 'Menemen', ingredients: '   ' })).not.toBeNull();
    expect(
      validateBackendPayload('select-products', {
        recipe_name: 'Menemen',
        ingredients: ['domates'],
        latitude: 95,
        longitude: 29,
      })
    ).not.toBeNull();
    expect(
      validateBackendPayload('select-products', {
        recipe_name: 'Menemen',
        ingredients: ['domates'],
        distance: 99,
      })
    ).not.toBeNull();
    expect(
      validateBackendPayload('select-products', {
        recipe_name: 'Menemen',
        ingredients: 'domates',
        ingredient_details: [{ name: 'domates', amount: 300, unit: 'g' }],
      })
    ).toBeNull();
    expect(
      validateBackendPayload('select-products', {
        recipe_name: 'Menemen',
        ingredients: 'domates',
        ingredient_details: [{ name: 'domates', amount: -5, unit: 'g' }],
      })
    ).not.toBeNull();
  });
});

describe('createBackendProxyHandler', () => {
  const envCopy = { ...process.env };

  beforeEach(() => {
    process.env.PYTHON_API_URL = 'https://backend.example.com';
    process.env.PYTHON_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...envCopy };
  });

  it('returns 413 for oversized payloads, 400 for non-object or invalid bodies', async () => {
    const handler = createBackendProxyHandler('recipe-list');

    const res413 = await handler(mockJsonRequest('x'.repeat(40_000)));
    expect(res413.status).toBe(413);

    const resArray = await handler(mockJsonRequest('[1, 2, 3]'));
    expect(resArray.status).toBe(400);

    const resShort = await handler(mockJsonRequest(JSON.stringify({ recipe_name: 'x' })));
    expect(resShort.status).toBe(400);
  });

  it('sets Cache-Control: no-store on success and masks upstream errors in production', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, ingredients: ['süt'] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const handler = createBackendProxyHandler('recipe-list');
    const okRes = await handler(mockJsonRequest(JSON.stringify({ recipe_name: 'Sütlaç' })));
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('Cache-Control')).toBe('no-store');

    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:8000')));
    const errRes = await handler(mockJsonRequest(JSON.stringify({ recipe_name: 'Sütlaç' })));
    expect(errRes.status).toBe(502);
    const body = await errRes.json();
    expect(body.error).not.toContain('ECONNREFUSED');
    expect(body.error).toBe('LLM servisine ulaşılamadı');
  });
});
