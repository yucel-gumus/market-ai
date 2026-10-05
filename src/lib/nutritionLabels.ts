/** Besin değeri anahtarlarını kullanıcıya dönük Türkçe etiketlere çevirir (AI yanıtı İngilizce anahtar dönebiliyor). */

const LABELS: Record<string, string> = {
  calories: 'Kalori', kalori: 'Kalori', kcal: 'Kalori',
  protein: 'Protein',
  fat: 'Yağ', yag: 'Yağ', fats: 'Yağ',
  carbs: 'Karbonhidrat', carb: 'Karbonhidrat', carbohydrate: 'Karbonhidrat', karbonhidrat: 'Karbonhidrat',
  fiber: 'Lif', lif: 'Lif', fibre: 'Lif',
  sugar: 'Şeker', seker: 'Şeker', sugars: 'Şeker',
  salt: 'Tuz', tuz: 'Tuz', sodium: 'Sodyum', sodyum: 'Sodyum',
  saturated_fat: 'Doymuş yağ', saturatedfat: 'Doymuş yağ', doymus_yag: 'Doymuş yağ',
  cholesterol: 'Kolesterol', kolesterol: 'Kolesterol',
  potassium: 'Potasyum', potasyum: 'Potasyum',
  calcium: 'Kalsiyum', kalsiyum: 'Kalsiyum', iron: 'Demir', demir: 'Demir',
  vitamins: 'Vitaminler', vitamin: 'Vitaminler', minerals: 'Mineraller', mineral: 'Mineraller',
  porsiyon: 'Porsiyon', serving: 'Porsiyon', serving_size: 'Porsiyon',
  water: 'Su', su: 'Su',
};

/** Serbest metin/anlatım alanları: tablo yerine not olarak gösterilir. */
const NOTE_KEYS = ['aciklama', 'summary', 'detail', 'note', 'degerlendirme', 'yorum', 'advice'];

export function nutritionLabel(key: string): string {
  const normalized = key.trim().toLowerCase().replace(/\s+/g, '_');
  const known = LABELS[normalized];
  if (known) return known;
  const spaced = key.trim().replace(/_/g, ' ');
  return spaced.charAt(0).toLocaleUpperCase('tr-TR') + spaced.slice(1);
}

export function isNutritionNote(key: string): boolean {
  return NOTE_KEYS.includes(key.trim().toLowerCase());
}

/** Değer nesne/array gelirse düz metne indirger; "[object Object]" gösterilmez. */
export function formatNutritionValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.map(v => formatNutritionValue(v)).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${nutritionLabel(k)}: ${formatNutritionValue(v)}`)
      .join(' · ');
  }
  return String(value);
}
