import { describe, expect, it } from 'vitest';
import { formatBranchName, isGoodTitleMatch, normalizeString, titleMatchScore } from './stringUtils';

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

describe('formatBranchName', () => {
  it('il/ilçe adı bitişik yazılmışsa ayırır', () => {
    expect(formatBranchName('Atlasüsküdar')).toBe('Atlas Üsküdar');
    expect(formatBranchName('Burhaniyeüsküdar')).toBe('Burhaniye Üsküdar');
    expect(formatBranchName('Küplüceüsküdar')).toBe('Küplüce Üsküdar');
    expect(formatBranchName('Saklambaç Sokküplüce')).toBe('Saklambaç Sok Küplüce');
  });

  it('ayrık yazılmış adlara dokunmaz', () => {
    expect(formatBranchName('Kirazlıtepe Üsküdar')).toBe('Kirazlıtepe Üsküdar');
    expect(formatBranchName('Şok Miniorhun')).toBe('Şok Miniorhun');
    expect(formatBranchName('bim')).toBe('bim');
  });

  it('İstanbul yazımını ve tek harflik şube kodunu düzeltir', () => {
    expect(formatBranchName('Istanbul Çengelköy Kaldırım Mı')).toBe('İstanbul Çengelköy Kaldırım Mı');
    expect(formatBranchName('Kirazlıtepe Üsküdar Istanbul M')).toBe('Kirazlıtepe Üsküdar İstanbul');
  });

  it('fazla boşlukları sadeleştirir ve boş girdiyi korur', () => {
    expect(formatBranchName('  Atlas   Üsküdar  ')).toBe('Atlas Üsküdar');
    expect(formatBranchName('')).toBe('');
  });
});
