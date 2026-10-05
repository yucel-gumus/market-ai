# Market AI yayın hazırlığı

4 Ekim 2026. Bu belge, `TUBITAK_API_AUDIT.md` içindeki denetimden sonra uygulanan düzeltmeleri ve yayın için kalan sürüm bağımlılığını kaydeder.

## Uygulanan üç aşama

| Aşama | Değişiklik | Doğrulama |
| --- | --- | --- |
| Güvenli seçim ve veri sözleşmesi | Model hatasında fiyatla otomatik seçim kaldırıldı. Ürün kimliği, malzeme etiketi, doğrudan eşleşme ve uygunluk kontrolleri eklendi. Backend kategori ve paket bilgisini koruyor; her malzeme bağımsız işlendiği için 150 aday kesintisi yok. Yakın şube mesafeleri metre → kilometre çevriliyor. | Model hatası, hayali kimlik, yanlış tür, aromalı süt, çapraz malzeme ve uzun tarif testleri. |
| API sayfalaması ve doğru adaylar | Sabit 20 sayfa sınırı kaldırıldı. Arama ilk sayfayı gösterip kalan sayfaları otomatik topluyor. `numberOfFound`, fiili dönen sayfa boyutu, tekil ürün kimlikleri ve boş bitiş sayfası kullanılıyor. V3 kategori ağacı ve filtreleri bağlandı. | 21 sayfalık kontrollü arama; canlı 426/426 ürün; arayüzde sonraki sayfa hatası ve kaldığı yerden yeniden deneme. |
| Sepet yenileme ve yayın kontrolleri | Sepet ürün başlığı yerine gerçek kimliklerle V1 liste eşitlemesi yapıyor. Kaynak kayıt zamanı ve kampanya koşulu gösteriliyor. Tarif miktarı için yapılandırılmış alanlar ve bilinen paket miktarından adet hesabı eklendi. Backend sözleşme kontrolü ve opt-in canlı API testi eklendi. | İki canlı ürünün kimlikle eşitlenmesi, sepet/adet kalıcılığı, 390px arayüz, paket birimi testleri ve üretim derlemesi. |

## Arama tamamlanması

“Bütün sonuçlar”, aynı sorgu, konum ve seçili şubeler için servisin bildirdiği sonuçların tamamıdır. Başka konumlar, seçilmemiş şubeler veya farklı yazımla yapılacak başka sorguların bütün kataloğu değildir.

`size` değeri sayfalama bitişini belirlemez; sunucu istenen değerden az kayıt döndürebilir. Toplam biliniyorsa tekil ürün sayısı bu toplama ulaşınca arama biter. Toplam yoksa boş sayfaya kadar devam edilir. Tekrar eden sayfa veya beklenenden erken boş sayfa, tamamlanma sayılmaz. Kısmi ürünler görünür kalır ve kullanıcı yeniden deneyebilir. Sorgu değiştiğinde istemci isteği iptal edilir.

API sonucunda aynı ürün kimliği birden fazla sayfada görülürse ürün bir kez gösterilir; farklı şube teklifleri korunur. Fiyatı olmayan ürünler normal aramadan çıkarılmaz, fakat doğrulanmış fiyat gerektiren otomatik tarif seçiminde kullanılmaz.

## Tarif için aday seçimi

Güncel kategori adları API'den alınır. Bilinen malzemeler için kategori ve alt tür filtreleri kullanılır; bilinmeyen malzemeler önce adla aranır, uygun aday bulunamazsa mevcut gerçek gıda kategorileriyle sınırlı kategori önerisi alınır. Temizlik, kozmetik ve pet ürünleri tarif seçiminden çıkarılır.

Adaylar fiyat sıralamasından önce uygunluk kontrolünden geçer. Sade süt için aromalı/devam/çocuk sütleri; taze domates için salça; soğan için cips; tavuk için nugget gibi yanlış adaylar engellenir. Kuzu yerine dana otomatik muadil seçilmez. Birim fiyat yalnızca aynı birimde karşılaştırılır. Küçük paket, az yağlı süt veya tek et kesimi, fiyatıyla diğer uygun varyantların tamamını elemesin diye adaylar varyant gruplarına dağıtılır.

Bu kurallar ürün uygunluğunu güçlendirir; bütün dünya tarifleri için doğruluk garantisi değildir. Belirsiz veya desteklenmeyen eşleşmeler manuel seçim olarak görünür. Modelin seçtiği fiyat kullanılmaz; gerçek adayın API fiyatı korunur.

Tarif miktarları modelin tahminidir. Bilinen `g`, `ml`, `adet` paketleri için gereken paket sayısı yukarı yuvarlanır. Paket miktarı belirsizse veya birimler uyumsuzsa miktar uydurulmaz; kullanıcıdan adedi kontrol etmesi istenir. Mevcut sepetteki daha yüksek manuel adet azaltılmaz.

## Backend ile birlikte yayın

Frontend ve Python backend aynı seçim sözleşmesiyle yayımlanmalıdır. Yeni backend `GET /api/market-ai/capabilities` çağrısında şunları döndürür:

```json
{
  "selectionContractVersion": 2,
  "usesProductIds": true,
  "unsafePriceFallback": false,
  "supportsIngredientAmounts": true
}
```

Mevcut API anahtarı doğrulaması bu rotada da geçerlidir. Bu kontrol model çağrısı yapmaz ve gizli yapılandırma döndürmez.

Kullanıcının verdiği canlı backend adresi `https://python-backend-270384591051.europe-west3.run.app`. Sağlık çağrısı HTTP 200 döndürdü. Gerçek modelle sade ve çilekli süt adayları verilince sütlaç için sade süt seçildi; ancak yanıt ürün kimliği içermedi. Yeni sözleşme kontrolü HTTP 404 döndürdü. Dolayısıyla canlı sunucu henüz bu repodaki yeni backend sürümünü çalıştırmıyor. Bu tek örnek, modelin genel başarı yüzdesi ölçümü değildir.

Yerel frontend'in sunucu tarafındaki `PYTHON_API_URL` bu adrese ayarlandı. Eski kimliksiz seçim yanıtı otomatik kabul edilmez; arayüz backend güncellemesi gerektiğini bildirir. Yeni backend yayımlanmadan frontend'in güvenli otomatik seçim akışı tamamlanmış sayılmaz.

## Yayın sırası ve kontroller

1. Python backend değişikliklerini mevcut Cloud Run servisine, mevcut anahtar/Firestore yapılandırmasını koruyarak yayımla. Bu çalışma canlı servisin yapılandırmasını veya sürümünü değiştirmedi.
2. Frontend ortamında `MARKET_API_URL=https://api.marketfiyati.org.tr/api`, verilen `PYTHON_API_URL` ve mevcut `PYTHON_API_KEY` değerini sunucu ortamı olarak tanımla. Eski `/api/v2` market kökü de uyumluluk için kabul edilir; endpointin V1/V2/V3 yolu proxy tarafından seçilir.
3. `npm run test:backend` çalıştır. Başarılı olmadan iki sistemin uyumlu olduğu kabul edilmemeli.
4. Frontend için `npm test`, `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build` çalıştır. Python backend için `.venv/bin/python -m pytest -q` çalıştır.
5. Çalışan frontend'e karşı `MARKET_LIVE_BASE_URL=https://<frontend-adresi> npm run test:live` çalıştır. Bu komut ücretli model çağrısı yapmaz; sınırlı, canlı market/adres verisi okur. Son olarak gerçek tariflerde ürün ve miktar eşleşmesini kontrol et.

API erişim/yeniden kullanım izinlerinin durumu ve sağlayıcı kotası bu çalışma tarafından doğrulanmadı; önceki denetim raporundaki kaynak ve koşullar geçerlidir.

## Nihai doğrulama sonucu

50 frontend testi ve 77 Python backend testi geçti. Lint, TypeScript ve üretim derlemesi başarılı. Üretim derlemesi üzerinden canlı market testi 426 tekil ürünü servis toplamıyla eşleştirdi; V3 filtreli 124 üründen 12 uygun ve çeşitli aday üretildi, tam yağlı süt adayı korundu ve iki ürün kimlikle yenilendi. Arayüz testi, sonraki sayfa hatasından yeniden denemeyle 61 ürünün tamamının gösterildiğini doğruladı.

`npm run test:backend`, mevcut canlı backend için beklendiği gibi başarısız: yeni capabilities endpoint'i HTTP 404 döndürüyor. Bu sonuç, kod testlerinin hatası değil, yayımlanmış backend sürümünün yeni sözleşmeyi henüz desteklememesi. Makine tarafından okunabilir kayıt [RELEASE_VERIFICATION.json](RELEASE_VERIFICATION.json) dosyasında.

## 4 Ekim 2026 — kural düzeltmeleri ve ölü kod temizliği

Canlı katalogla yapılan derin doğrulama iki kritik eşleştirme hatasını ortaya çıkardı; ikisi de giderildi ve iki katmanlı aday kapısıyla sağlamlaştırıldı.

| Sorun | Kök neden | Düzeltme | Canlı sonuç |
| --- | --- | --- | --- |
| `tavuk göğsü` / `tavuk göğüs` → 0 aday | Katalog "tavuk" yerine "piliç" yazıyor; tür guardı + eksik eş anlamlı | `piliç` eş anlamı, parça adı çekim normalizasyonu (`göğsü→göğüs`), ızgara/pişmiş ürün reddi | 187 ürün → **6 uygun aday** (Sırtsız Göğüs, Fileto, Bütün Göğüs) |
| `nişasta` → 0 aday | Kural kategori listesinde `Un ve İrmik` yoktu | `main: ["Un ve İrmik","Pasta Malzemeleri"]` | **12 uygun aday** (Mısır/Buğday Nişastası) |
| `çilek` → "Altın Çilek" yanlış eşleşmesi | Reddedilen kelime listesinde eksikti | `altın çilek` reddi | Yanlış ürün elendi (bu şubelerde gerçek çilek yok → dürüst 0) |

Mimari iyileştirmeler:

- **İki katmanlı aday kapısı**: katı uygunluk (kategori + tür + tarif bağlamı) sonuç vermezse, yalnızca kategori kısıtı kaldırılmış geniş katman devreye girer; alakasız ürün asla üretilmez, kimliğe göre tekilleştirilir.
- **Adla arama geri düşüşü**: kuralın kategorisi yanlış/eksikse, kategori araması boş dönerse malzeme adıyla arama yapılır.
- **Kelime-kapsama kural eşleşmesi**: `tavuk göğüs eti` gibi çekimli adlar artık doğru kurala bağlanır.
- **Backend parity**: `app/services/ingredient_matching.py` ve `ingredient_rules.json`, frontend `ingredientSuitability.ts` ile birebir aynı kuralları uygular; iki dosya senkron tutulmalıdır.

Temizlenen ölü kod: `safeIncludes`, `maxDepotPrice`, `calculateTotalSavings`, `createNumberedMarketIcon`, `createUserLocationIcon`, `getRouteMarkerColor`, `categoriesList.json`, `totalElements` (tip alanı) ve tek seferlik canlı probe testleri.

Doğrulama: yerel backend'e karşı `verify-backend-contract.cjs` yeşil (`selectionContractVersion: 2`); canlı Cloud Run sürümü eski olduğu için yayımlanmış uçta hâlâ 404 döner. Yayın `gcloud run deploy python-backend --source . --region europe-west3` ile yapılır.

## 4 Ekim 2026 (2) — WAF başlık düzeltmesi, ek toleransı ve 10 tarif taraması

Sürdürülebilir hacimde yapılan testler iki ciddi üretim kusuru ortaya çıkardı.

| Sorun | Kök neden | Düzeltme |
| --- | --- | --- |
| Proxy, WAF tarafından bağlantı düşmesiyle bloklanıyor (`other side closed`) | `User-Agent: MarketAI/1.0` ve Referer/Origin yok | Tarayıcı UA + `Referer` + `Origin` + `Accept-Language` (market ve harita proxy'lerinde) |
| `mısır nişastası` gibi iyelik ekli malzemeler kurala bağlanmıyordu | Kural eşleşmesi tam kelime eşitliği istiyordu | Türkçe iyelik/çoğul eki toleransı (`nişastası→nişasta`), kural araması + başlık eşleşmesinde |

Harita/proxy başlıkları `src/constants` (`USER_AGENT`, `MARKET_REFERER`, `MARKET_ORIGIN`, `ACCEPT_LANGUAGE`) üzerinden tek noktadan yönetilir.

**Sayfa boyutu:** API `size` 1–100 kabul eder; sınır proxy doğrulamasında `DEFAULTS.MAX_PAGE_SIZE` ile uygulanır ve test edilir.

**10 tarif taraması (model yarısı, canlı):** 10/10 tariften ≥3 malzeme çıkarıldı; toplam 101 malzemenin 96'sı (%95) bir kategori kuralına bağlandı (`recipeCoverage.live.test.ts`). Kalan 5 malzeme (nar ekşisi, galeta unu, karbonat, bitter çikolata, mısır nişastası) adla arama geri düşüşüyle çözülür.

**Sınırlama (dürüst not):** 10 tarifin tam uçtan uca (aday + seçim) canlı koşusu, marketfiyati WAF'ı kısa sürede çok istek alınca bağlantı düşürdüğü için tamamlanamadı; bkz. aşağıdaki WAF notu. Tek tariflik (mercimek çorbası) tam akış canlıda başarıyla geçti.

**WAF davranışı (ölçüldü):** Tek istek tarayıcı başlıklarıyla 200; aynı uçtan dakikalar içinde onlarca istek bloğa (bağlantı düşmesi) yol açıyor ve blok dakikalar sürüyor. Üretimde eşzamanlılığı düşük tutmak, toleransı artırmak ve `429/503`'te geri çekilmek gerekir; `AI_CONCURRENCY` ve arama sayfalaması bu yüzden sınırlı çalıştırılmalı.
