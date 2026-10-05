import { describe, expect, it } from 'vitest';
import { formatNutritionValue, isNutritionNote, nutritionLabel } from './nutritionLabels';

describe('nutritionLabel', () => {
  it('bilinen anahtarları Türkçeleştirir', () => {
    expect(nutritionLabel('CARBS')).toBe('Karbonhidrat');
    expect(nutritionLabel('fat')).toBe('Yağ');
    expect(nutritionLabel('protein')).toBe('Protein');
    expect(nutritionLabel('kcal')).toBe('Kalori');
    expect(nutritionLabel('salt')).toBe('Tuz');
  });

  it('bilinmeyen anahtarı okunur biçimde bırakır', () => {
    expect(nutritionLabel('omega_3')).toBe('Omega 3');
    expect(nutritionLabel('Omega')).toBe('Omega');
  });
});

describe('isNutritionNote', () => {
  it('serbest metin alanlarını not sayar', () => {
    expect(isNutritionNote('aciklama')).toBe(true);
    expect(isNutritionNote('degerlendirme')).toBe(true);
    expect(isNutritionNote('protein')).toBe(false);
  });
});

describe('formatNutritionValue', () => {
  it('nesne değerini "[object Object]" olarak göstermez', () => {
    const text = formatNutritionValue({ carbs: '12 g', fat: '4 g' });
    expect(text).toBe('Karbonhidrat: 12 g · Yağ: 4 g');
    expect(text).not.toContain('[object Object]');
  });

  it('dizi ve ilkel değerleri metne çevirir', () => {
    expect(formatNutritionValue(['a', 'b'])).toBe('a, b');
    expect(formatNutritionValue(12)).toBe('12');
    expect(formatNutritionValue(null)).toBe('—');
  });
});
