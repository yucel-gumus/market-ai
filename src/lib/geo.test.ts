import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns ~0 for same point', () => {
    expect(haversineKm(41, 29, 41, 29)).toBe(0);
  });

  it('returns finite distance for nearby points', () => {
    const d = haversineKm(41.0, 29.0, 41.01, 29.01);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(5);
  });

  it('returns Infinity for invalid coords', () => {
    expect(haversineKm(NaN, 0, 0, 0)).toBe(Infinity);
  });
});
