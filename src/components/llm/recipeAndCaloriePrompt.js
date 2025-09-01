// LLM için yemek tarifi ve kalori bilgisi prompt'unu fonksiyon olarak export et
export default function recipeAndCaloriePrompt(recipeName) {
  return `
Aşağıda kullanıcıdan gelen bir yemek adı var. Lütfen bu yemek için:
- En uygun ve geleneksel yemek tarifini (malzeme listesi ve adım adım hazırlanışı ile)
- Ortalama kalori bilgisini (kcal cinsinden, porsiyon başı)
- Kısa bir besin değeri özeti
-Besin yoğunluğu veya sağlık özeti (ör: yüksek proteinli, düşük karbonhidratlı)
Türkçe ve sade bir şekilde, JSON formatında döndür. Örnek çıktı:
{
  "success": true,
  "name": "Yemek Adı",
  "description": "Kısa açıklama",
  "ingredients": ["malzeme1", "malzeme2", ...],
  "steps": ["adım1", "adım2", ...],
  "calories": 350,
  "nutrition": "Protein, karbonhidrat, yağ oranı vb."
}
Kullanıcıdan gelen yemek adı: ${recipeName}
`;
}
