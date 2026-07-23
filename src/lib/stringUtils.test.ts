import { describe, expect, it } from 'vitest';
import { isGoodTitleMatch, normalizeString, titleMatchScore } from './stringUtils';

describe('titleMatchScore', () => {
  it('scores exact match as 1', () => {
    expect(titleMatchScore('Süt 1L', 'Süt 1L')).toBe(1);
  });

  it('matches partial ingredient names', () => {
    expect(isGoodTitleMatch('Tam Yağlı Süt 1 L', 'süt')).toBe(true);
  });

  it('normalizes Turkish characters', () => {
    expect(normalizeString('ŞOK')).toContain('sok');
  });
});
