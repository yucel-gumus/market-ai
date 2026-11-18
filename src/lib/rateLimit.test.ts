import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit } from './rateLimit';

describe('checkRateLimit', () => {
  it('allows requests up to the limit per IP and returns 429 with Retry-After once exceeded', () => {
    const req1 = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });
    const req2 = new NextRequest('http://localhost/api/test', {
      headers: { 'x-real-ip': '203.0.113.20' },
    });

    expect(checkRateLimit(req1, 'test-bucket-limit', 2)).toBeNull();
    expect(checkRateLimit(req1, 'test-bucket-limit', 2)).toBeNull();

    const blocked = checkRateLimit(req1, 'test-bucket-limit', 2);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);

    // Farklı IP bağımsız sayaç taşır
    expect(checkRateLimit(req2, 'test-bucket-limit', 2)).toBeNull();
  });

  it('handles mock requests lacking headers safely without throwing', () => {
    const mockReq = {} as unknown as NextRequest;
    expect(checkRateLimit(mockReq, 'test-bucket-no-headers', 5)).toBeNull();
  });
});
