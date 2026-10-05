# Market Fiyatı API ve ürün seçimi denetimi

Bu belge düzeltmelerden önceki denetim anlık görüntüsüdür. Uygulanan değişiklikler ve güncel yayın durumu için [yayın hazırlığı](RELEASE_READINESS.md) belgesine bakın.

Denetim tarihi: 4 Ekim 2026. Kapsam: Market AI frontend'i ve `/Volumes/hayabusa/github_projelerim/python_backend` içindeki Market AI servisi; TÜBİTAK BİLGEM Market Fiyatı ve onun kullandığı adres servisleri. TÜBİTAK'ın diğer projelerine ait bütün API'lerin envanteri değildir.

## Sonuç

Mevcut entegrasyon temel ürün ve şube verilerini alabiliyor. Ancak doğru tarif ürününü güvenilir biçimde seçtiği söylenemez. Canlı arama çok geniş adaylar getiriyor, adaylar uygunluk kontrolünden önce paket fiyatıyla daraltılıyor ve Python backend model hatasını otomatik bir ürün seçimine çeviriyor. Frontend'in gerçek aday kontrolü, yanlış ama gerçek bir ürünün sepete eklenmesini engellemiyor.

Modelin gerçek başarı yüzdesi ölçülmedi. Yerel Python HTTP servisine bağlantı kurulamadı; backend kaynak kodu incelendi ve aynı seçim sınıfı kontrollü model hatalarıyla çevrimdışı çalıştırıldı. Harici Gemini çağrısı yapılmadı.

## Kaynaklar ve doğrulama yöntemi

- [Resmî sık sorulan sorular](https://marketfiyati.org.tr/sikca-sorulan-sorular): veri sıklığı, şube fiyatları ve filtreleme özellikleri.
- [Resmî kullanım koşulları](https://marketfiyati.org.tr/kullanim-kosullari): erişim ve yeniden kullanımın koşulları.
- [Resmî uygulamanın servis tanımları](https://marketfiyati.org.tr/main.366ff1e92fe58c2d.js): uygulama sürümü 3.3.11 sırasında kullanılan HTTP çağrıları.
- [Resmî arama ve filtre arayüzü](https://marketfiyati.org.tr/841.07c513613c1b6807.js): filtre alanları, sıralama ve arama türü enum'u.
- [Resmî ürün ayrıntı arayüzü](https://marketfiyati.org.tr/400.ae68c4ffd195d800.js): ürün kimliği, benzer ürün ve fiyat geçmişi.
- [Resmî liste arayüzü](https://marketfiyati.org.tr/771.3119d05a3fe5fc60.js): liste eşitleme, alternatif ürün ve PDF.

Bu envanter resmî web uygulamasının gözlenen HTTP sözleşmesidir. Kamuya açık, sürüm garantisi veren bir geliştirici dokümanı, SLA veya kota bilgisi doğrulanamadı. Bugün çalışan bir çağrı gelecekte aynı sözleşmeyi koruyacağını garanti etmez. Arayüzdeki bir servis tanımı da çağrının hâlâ çalıştığını tek başına kanıtlamaz.

Canlı denemeler kullanıcı konumuyla değil, Kadıköy için genel bir test noktasıyla yapıldı: `latitude=40.9905`, `longitude=29.0283`, `distance=1`. Yakın şube çağrısı 25 şube döndürdü; ürün sorgularında bunların gerçek `id` değerleri `depots` olarak kullanıldı. Sayımlar ve fiyatlar bu konum, şube kümesi ve tarihin anlık görüntüsüdür. Tüm ürün kataloğu ve resmî uygulama kaynakları repoya kopyalanmadı.

## API adresleri ve ortak kurallar

Ürün ve market servislerinin kökü `https://api.marketfiyati.org.tr/api`; adres servisinin kökü `https://harita.marketfiyati.org.tr/Service/api/v1`.

JSON POST isteklerinde `Content-Type: application/json` ve `Accept: application/json` kullanılır. Canlı denemelerde projenin `User-Agent: MarketAI/1.0` başlığıyla yanıt alındı. Sürüm endpoint düzeyindedir: bütün çağrıları tek bir V2 köküne eklemek V1/V3 servisleri için yeterli değildir.

- `latitude` enlem, `longitude` boylamdır. İstekte `distance` kilometredir; `nearest` yanıtında `distance` metredir.
- `depots` şube kimliklerinin dizisidir; zincir adları değildir. Zincir filtresi ayrı `market_names` alanıdır.
- `pages` sıfırdan başlar. `size` istenen sayfa büyüklüğüdür; sunucunun bunu aynen uyguladığını varsayma. `size:50` canlı aramalarda 25 kayıt döndürdü; `size:24` 24 kayıt döndürdü. 25'in kalıcı resmî limit olduğu doğrulanmadı.
- Arama yanıtları gözlenen şekliyle `{numberOfFound, searchResultType, content, facetMap}` içerir. `totalPages`, `totalElements`, `number`, `size` alanları gözlenen yanıtlarda yoktu. `facetMap` bazı çağrılarda `null` olabilir.
- Resmî arama enum'u `1=NORMAL`, `2=HALF_FUZZY`, `3=FUZZY`. Kimlikle/listeyle aramalarda `0` da görüldü; bunun genel arama anlamı doğrulanmadı. `NORMAL` tarife uygunluk garantisi değildir.

## Endpoint envanteri

Aşağıdaki yollar ürün API köküne göre verilmiştir. “Canlı” HTTP 200 ve yanıt içeriğinin incelendiğini; “arayüz” yalnızca resmî istemcide kullanımın görüldüğünü belirtir.

| Yöntem ve yol | Amaç ve istek alanları | Yanıt ve denetim durumu | Projedeki durum |
| --- | --- | --- | --- |
| POST `/v2/nearest` | `latitude`, `longitude`, `distance` | Şube dizisi: `id`, `sellerName`, `marketName`, `location:{lat,lon}`, metre cinsinden `distance`. Canlı: 25 şube. | Kullanılıyor; metre dönüşümünde hata var. |
| POST `/v2/search` | `keywords`, `pages`, `size`, konum, `depots`; aşağıdaki filtreler | Ortak arama yanıtı. Canlı: `süt` için 426 farklı ürün. | Kullanılıyor; ek filtreler proxy'de aktarılmıyor. |
| POST `/v2/searchByCategories` | Eski sözleşme: `keywords:"Süt"`, `menuCategory:false`, konum, `depots`, sayfalama | Canlı: 198 sonuç. | Kullanılıyor ve hâlâ çalışıyor. Resmî güncel kategori araması V3 kullanıyor; V2'nin kaldırıldığına dair kanıt yok. |
| GET `/v3/info/categories` | Gövde yok | `{content:[...]}` kategori ağacı; düğümler `id,parentId,name,children`. Canlı: 9 kök, toplam 674 düğüm, 3 seviye. | Frontend kullanmıyor. Python'da sınıf var fakat seçim/kategori akışında çağrısı bulunmadı. |
| POST `/v3/searchByCategories` | `menu_category`, `main_category`, `sub_category` alanlarında kategori adlarının dizileri; konum, şube ve sayfalama | Canlı: `main_category:["Süt"]` 198; ayrıca `sub_category:["UHT Süt"]` 75. | Entegrasyon yok. |
| POST `/v2/searchByIdentity` | `identity:"0ZL5"`, `identityType:"id"`, konum, `depots`, `pages:0,size:1` | Canlı: verilen ürün kimliği için tek ürün. | Yok. Barkod için kullanılacak `identityType` değeri doğrulanmadı; tahmin edilmemeli. |
| POST `/v2/searchSimilarProduct` | `id`, `keywords`, konum, `depots`, sayfalama | Canlı: benzer ürünler. | Yok. Benzerlik, tarifte birbirinin yerine kullanılabilme garantisi değil. |
| POST `/v2/searchAlternative` | `id`, `keywords`, `marketName` zincir adı, ilgili `depots`, konum, sayfalama | Canlı: çilekli süt için kakaolu alternatifler de geldi. | Yok. Muadil kontrolü ve kullanıcının değiştirme tercihi gerekir. |
| POST `/v3/price-history` | `uniqueId` ürün kimliği, `depots` şube kimlikleri | Canlı: `{name:market,series:[{name:tarih,value:fiyat}]}` kayıtlarından oluşan dizi. | Yok. Fiyat geçmişi özelliği için kullanılabilir. |
| POST `/v1/list/sync` | `identities:["0ZL5","1YG9"]`, `identityType:"id"`, konum, `depots`, `pages:0,size:2` | Canlı: iki bilinen ürünün güncel şube teklifleri. | Yok. Sepet yenilemede başlık aramasına tercih edilebilir; büyük listelerde sayfalama/bölme ayrıca doğrulanmalı. |
| POST `/v1/list/generate-pdf` | Resmî liste modelinden `total`, `products`, `marketNames`, `location`, `date` | Arayüz: PDF blob. Canlı PDF üretimi denenmedi. `products` ham arama sonucu değil, aşağıda açıklanan liste modelidir. | Yok; zorunlu değil. |
| GET `/v1/store` | Eski market listesi tanımı | Canlı: HTTP 500, “No static resource”. | Kullanılmıyor; yeni entegrasyon için güvenilmemeli. |
| GET `/v1/categories` | Eski istemcide mağaza/zincir listesiyle ilişkili tanım | Canlı: HTTP 500, “No static resource”. V3 kategori ağacıyla karıştırma. | Kullanılmıyor. |
| POST `/v1/store` | İstemcide servis tanımı var; çalışan çağrı ve gövdesi doğrulanamadı | Yalnızca arayüz; canlı denenmedi. | Kullanılmıyor; sözleşmesi bilinmiyor. |

Adres servisinde GET `/AutoSuggestion/Search?words=Kadıköy` canlı olarak çalıştı. Sonuçlar tuple dizileridir: `[0]` tam adres, `[3]` yol, `[4]` mahalle, `[5]` ilçe, `[6]` il, `[7]` boylam, `[8]` enlem. Projedeki koordinat sırası doğru. GET `/ReverseGeocode?Lat=40.9905&Lon=29.0283` de canlı olarak çalıştı; `Il_Adi`, `Ilce_Adi`, `Mahalle_Adi`, `Yol_Adi`, `KapiNo` gibi adres alanları döndürdü. Bu çağrı projede kullanılmıyor; GPS veya harita pini için okunabilir adres üretmekte kullanılabilir.

PDF çağrısında resmî istemci ürünleri ortak ürün kimliğiyle grupluyor: `commonId,title,image,quantity` yanında zincir anahtarlarıyla fiyat/şube ayrıntıları taşıyor. `total` girdileri toplam fiyat, indirimsiz fiyat, zincir/şube ve toplam miktar bilgileri içeriyor. Tam PDF gövdesi bir geliştirici sözleşmesiyle doğrulanmadığından doğrudan ham ürün dizisi gönderilmesi önerilmiyor.

## Kategori ve filtrelerin doğru kullanımı

V3 ağacında kök `menu_category`, ikinci seviye `main_category`, üçüncü seviye `sub_category` ile ilişkilidir. İsteklerde gözlenen değerler düğüm kimliği değil, tam kategori adıdır. Ağaçtaki kimlikler uygulama içi seçimlerin izlenmesine yardımcı olur.

Süt örneğinde doğru yol `Süt Ürünleri ve Kahvaltılık → Süt → UHT Süt` olabilir. Süt altında ayrıca `Pastörize Süt`, `Aromalı Süt`, `Laktozsuz Süt`, `Organik Süt`, `Proteinli Süt` var. `Sade Süt` diye bir alt kategori bu ağaçta bulunmadı; bu tahmini filtre 0 sonuç verdi. Sütlacın ihtiyaçlarına göre UHT veya pastörize sade süt adayları kullanılabilir; yağ oranı ve özel beslenme tercihleri ayrıca doğrulanmalıdır.

Resmî filtre oluşturucusunda gözlenen alanlar:

| Alan | Değer şekli ve kullanım |
| --- | --- |
| `menu_category`, `main_category`, `sub_category` | İlgili seviyenin tam kategori adlarından oluşan diziler. |
| `market_names` | Zincir adları dizisi; şube seçimi için `depots` da kullanılır. |
| `brand` | Marka adları dizisi. |
| `refined_quantity_unit` | Resmî `facetMap` değerlerinden seçilen miktar/adet etiketleri dizisi. |
| `refined_volume_weight` | Resmî `facetMap` değerlerinden seçilen ağırlık/hacim etiketleri dizisi. Ürün alanı `refinedVolumeOrWeight` ile istek alanı aynı isimde değildir. |
| `offer_price`, `offer_discount` | Resmî arayüzün facet değerlerine dayalı fiyat/indirim filtre dizileri. Rastgele aralık biçimi varsayılmamalı. Arayüz `price_range` seçimlerini `offer_price` ile birleştiriyor. |
| `order` | `{name:"lowest_price",type:"asc"}` veya `desc`; birim fiyat için `name:"offer_unit_price"`. Birim fiyat sıralaması canlı UHT sorgusunda denendi. |

Örnek doğrulanmış kategori gövdesi:

```json
{
  "latitude": 40.9905,
  "longitude": 29.0283,
  "distance": 1,
  "depots": ["a101-E437"],
  "pages": 0,
  "size": 24,
  "main_category": ["Süt"],
  "sub_category": ["UHT Süt"],
  "order": {"name": "offer_unit_price", "type": "asc"}
}
```

Bu örnek alanların doğrulanmış biçimini gösterir; belirli bir şubede belirli bir ürünün bulunacağını garanti etmez. Sıralama, önce ürün uygunluğu belirlendikten sonra anlamlıdır. Örneğin az yağlı süt, tam yağlı süt isteyen bir tarifin otomatik eşdeğeri değildir.

## Canlı veride ürün seçimi sorunu

`keywords:"süt"` sorgusunun 426 ürününün tamamı, sıfırdan başlayan 18 dolu sayfa ve bir boş bitiş sayfasıyla toplandı; ürün kimlikleri tekilleştirilince de 426 kayıt bulundu. Paket fiyatına göre en ucuz 25 ürün seçildiğinde:

- 19 ürünün ana kategorisi `Süt` idi; bunların içinde aromalı ve küçük paketli sütler vardı.
- 4 ürün `Kek`, 1 ürün `Gofret`, 1 ürün `Diğer Süt Ürünleri` kategorisindeydi.
- Bu 25 aday içinde 1 litrelik sade süt yoktu.
- Tüm arama sonucunda süt içeren kekler ve bebek devam sütlerinin yanında `Dove Hindistan Cevizi Yağı Ve Badem Sütü Özlü Sıvı Sabun 450 Ml` de vardı. Sadece kelime araması gıda filtresi sağlamıyor.

Aynı şube kümesinde V3 `Süt → UHT Süt` filtresi 75 sonuç verdi. Birim fiyat sıralamasıyla litre başına fiyatı düşük 1 litrelik sütler ilk sonuçlara geldi. Bu, kategori ve birim fiyat alanlarının aday kalitesini iyileştirebildiğine ilişkin canlı bir karşılaştırmadır; model başarı oranı ölçümü değildir.

## Kod denetimi bulguları

### P1 Model hatası otomatik ve başarılı ürün seçimine çevriliyor

Backend: `app/services/market_ai_service.py:329`.

Model hata verdiğinde veya JSON çıktısı kabul edilmediğinde servis, malzeme için paket fiyatı en ucuz adayı seçip `success:true`, `matchType:"direct"` döndürüyor. Kategori, tarif uygunluğu ve miktar kontrolü yok. Kontrollü model hatası altında sütlaç için çilekli süt 19 TL, sade süt 40 TL adayları verildi; servis çilekli sütü başarılı seçim olarak döndürdü. Frontend, bu ürün gerçekten aday olduğu için kabul etti.

Malzemeye ait aday yoksa backend tüm ürünlere dönüyor (`or products`); frontend'in malzeme etiket kontrolü bu çapraz malzeme seçimini reddedebilir, fakat aynı malzemeyle etiketlenmiş yanlış adayları reddetmez.

Gereken davranış: model hatasında malzemeyi çözümlenemedi olarak döndürmek, otomatik sepete eklememek ve adayları kullanıcıya göstermek. Deterministik seçim yapılacaksa önce bağımsız uygunluk doğrulaması gerekir; model hatası gerçek AI başarısı gibi raporlanmamalı.

### P1 Fiyat sıralaması doğru ürünleri model görmeden eliyor

Frontend: `src/features/ai-chat/hooks/useRecipePipeline.ts:69`.

Kategori doğrulanmadan paket fiyatıyla sıralanan adaylar malzeme başına 25'e kesiliyor. Canlı süt örneğinde modelin önüne kek ve gofret gelebilir; uygun 1 litrelik sade sütler elenir. Kategori alternatifi yalnızca hiç sonuç yoksa çalışıyor; yanlış sonuç dolu bir arama daraltılmıyor.

Gereken davranış: malzeme normalizasyonu ve kategori/alt tür filtrelemesi → uygunluk kontrolü → miktar/birim karşılaştırması → dengeli aday seçimi → model seçimi. Paket fiyatı ucuzluğu bu sıranın başına konmamalı.

### P1 Backend kategori ayrıntısını siliyor ve sonraki malzemeleri kesiyor

Backend: `app/services/market_ai_service.py:304`.

Router `menu_category` ve `categories` bilgilerini servise iletiyor; orchestrator bunları kompakt model girdisinden çıkarıyor. Prompt bu alanları incelemeyi emretse bile gerçek ürün girdisinde bulunmuyorlar. `main_category:"Süt"`, aromalı ve sade sütü ayırmaya yetmiyor.

Ayrıca `products[:150]` bütün listeyi tek kesimde sınırlıyor. Frontend adayları malzeme sırasıyla 25'er grupladığında ilk altı malzeme 150 kotayı doldurabilir; yedinci malzemenin adayları modele hiç ulaşmaz. 175 sentetik adayla yedinci grubun prompt'ta olmadığı yeniden üretildi.

Gereken davranış: tüm malzemelere aday kotası ayırmak, gerçek kategori ayrıntısını, ürün kimliğini, paket miktarını ve birim fiyatı taşımak. Sessiz kesmek yerine sınır durumunu görünür kılmak.

### P1 Şube mesafesinin birimi yanlış dönüştürülüyor

Frontend: `src/services/marketService.ts:106`.

API'nin döndürdüğü `94.13256234112819` metre, uygulamada `94.13256234112819` km olarak kalıyor. Doğrusu yaklaşık `0.09413256` km. Kod yalnızca 100'den büyük değerleri 1000'e bölüyor; 100 metreden yakın şubeler uzak görünebilir ve sıralama bozulur. Gerçek nearest yanıtıyla mevcut metod çalıştırılarak hata doğrulandı.

Gereken davranış: bu endpoint'in tüm geçerli mesafelerini metre kabul edip tek bir dönüşüm yapmak; gösterim yuvarlamasını veri dönüşümünden ayırmak.

### P2 Yeni filtreler proxy'de kayboluyor

Frontend: `src/lib/marketApiProxy.ts:209`.

Proxy yalnızca `keywords,pages,size,latitude,longitude,distance,depots,menuCategory` alanlarını iletir. V3 kategori alanları, marka, ağırlık/hacim, indirim ve sıralama alanları iletilmez. Kategori endpointinde keyword zorunluluğu da V3'ün kategorili, keywordsüz kullanımına uymaz. Frontend'e filtre eklemek tek başına bu sorunu çözmez.

Gereken davranış: endpoint sürümüne göre açık istek tipleri, doğrulanmış filtre listesi ve sınırlı değer doğrulaması. Her endpoint için doğru sürüm yolunu seçmek.

### P2 Ürün kimliği ve miktar seçimin parçası değil

Frontend `src/services/llmService.ts`, backend `app/models/market_ai.py` ve seçim prompt'u.

Model girdisinde ürün `id` ve miktar/birim fiyat alanları yok; seçim başlıkla yapılıyor. Aynı başlıklı farklı kimlikleri frontend güvenli biçimde reddediyor, fakat kimlik bazlı sözleşme daha net olur. `matchType` ve gerekçe doğruluğu bağımsız olarak kontrol edilmiyor; prompt yakın muadile izin verirken frontend muadili kullanıcı tercihine bağlamıyor. Kuzu bulunmadığında dana otomatik seçilebilir.

Tarif prompt'u ayrıca miktarları açıkça yasaklıyor ve standart tek porsiyondan söz ediyor. Frontend'in “4 kişilik” metni bu çelişkiyi ortadan kaldırmıyor. Paket adetleri elle ayarlanabiliyor, fakat tarif miktarından kaç paket alınacağı hesaplanmıyor. Vanilya, kakao ve sirke gibi bazı tarifin gerekli malzemeleri de prompt tarafından tamamen dışlanıyor; örneğin kakaolu tarif için liste eksik olabilir.

Gereken davranış: tarif malzemesi için yapılandırılmış `name,amount,unit,servings` bilgisi; seçimde `productId`, doğrudan/alternatif ayrımı ve çözümlenemedi durumu. Yakın muadil önerisini açık tercih gerektiren ayrı sonuç olarak göstermek.

### P2 Yanıt ve sayfalama tipleri gerçek sözleşmeye uymuyor

Frontend: `src/types/index.ts:98`, `src/services/productService.ts:45`.

`ProductSearchResponse` canlı yanıtta olmayan sayfalama alanlarını zorunlu sayıyor; `numberOfFound`, `searchResultType`, `facetMap` bilgilerini modellemiyor. Tüm sayfalar fonksiyonu bu bilgileri nihai sonucunda da kaybediyor. Boş sayfaya kadar gitmesi canlı 426 ürün örneğinde çalışabiliyor, ancak varsayılan `size:50` gerçekte 25 kayıt döndürdüğünden istek sayısı varsayılandan yüksek. `MAX_PAGES:20`, bu gözlem altında yaklaşık 500 kayda denk gelir; tam sınırda gerçek son sayfa ile “daha fazla sonuç var” ayrımını yapmadan hata döndürür.

Canlı ürün araması tek sayfa gösterir; toplam bulunan ürün sayısı ve sonraki sayfalar kullanıcıya sunulmaz. Testler çoğunlukla `totalPages` içeren mock yanıtlar kullanıyor; gerçek yanıt şekliyle ek sözleşme testi gerekli.

### P2 Sepet yenileme kimlik araması yerine başlık arıyor

Frontend: `src/features/products/hooks/useShoppingCart.ts:78`.

Her ürünün başlığıyla tüm sonuç sayfaları aranıp sonunda aynı `id` bulunuyor. Bu, tam ürün kimliğini bildiğimiz halde arama belirsizliği ve fazladan istek yaratıyor. Canlı doğrulanan `/v1/list/sync` bilinen kimlikleri toplu yenileyebilir; tek ürün için `/v2/searchByIdentity` var. Çok ürünlü listelerde endpointin fiili sayfa sınırına göre bölmek ve eksik kimlikleri açıkça işaretlemek gerekir.

### P2 Kaynak zamanı ve kampanya koşulları eksik

Canlı şube tekliflerinde `unitPriceValue`, `indexTime`, `discount`, `discountRatio`, `promotionText` var; projedeki teklif tipi bunları kapsamıyor. `priceCheckedAt` bizim son kontrol zamanımızdır, kaynağın güncelleme zamanı değildir; mevcut yorum bu ayrımı doğru yapıyor. Örnekte `indexTime:"04.10.2026 10:28"` görüldü; bu bir kaynak indeks zamanıdır, kesin raf fiyatı değişim zamanı diye sunulmamalı.

Resmî FAQ verilerin günlük yayımlandığını ve şube raf fiyatları ile sanal market fiyatlarının farklılaşabildiğini söylüyor. İncelenen ürün teklifleri gerçek zamanlı stok miktarı sağlamıyor. “Anlık stok kesin var” veya “mağazada kesin aynı fiyat” iddiası desteklenmez. Kampanya metni varsa karşılaştırmada koşulları görünür olmalı.

### P3 Dinamik kategori yöneticisi akışa bağlı değil

Frontend'deki 24 sabit kategori adından 23'ü canlı ağaçta bulundu; `Hazır Gıda` birebir bulunmadı. Python'daki `DynamicCategoryManager` V3 ağacını çekebiliyor, ancak bu sınıfın aktif kategori/ürün seçimi akışında çağrısı bulunmadı. Cache süresi de yok; hata halinde fallback süreç ömrü boyunca kalabiliyor. Sınıfın varlığı dinamik kategori entegrasyonunun çalıştığı anlamına gelmiyor.

## Doğru kullanılan parçalar

V2 yakın şube ve ürün çağrıları canlı çalışıyor. Adres tuple'ındaki boylam/enlem sırası doğru. Şube `id` değerleri `depots` olarak kullanılıyor; tek şube testinde dönen tekliflerin tamamı istenen şubeye aitti. Sunucu proxy'si timeout ve hata yanıtı sağlıyor. Frontend hayali başlıkları, başka malzemeye etiketli adayları ve belirsiz aynı başlıkları reddediyor; sepet şube kimliklerini koruyor. Bu kontroller ürün varlığını ve şube ilişkisini doğruluyor, tarif uygunluğunu doğrulamıyor.

## Kullanım izni ve operasyonel sınırlar

Ücretsiz tüketici hizmeti olması, üçüncü taraf uygulama ve veri yeniden kullanımı için otomatik lisans anlamına gelmiyor. Resmî kullanım koşulları erişimin izin/lisans sayılmayacağını ve yeniden kullanım için yazılı izin şartlarını belirtiyor. Bu denetim projenin izin durumunu doğrulamadı; varsa TÜBİTAK ile yapılan izin/anlaşma kontrol edilmeli. Bu, projenin kesin olarak hukuka aykırı olduğuna dair bir sonuç değildir.

Kota ve destek sözleşmesi doğrulanmadığından sınırları tahmin edip yoğun istek planlamak doğru olmaz. Üretimde dar sorgular, bilinen kimlikle yenileme, kontrollü eşzamanlılık, hata görünürlüğü ve sözleşme değişimini izleyen küçük testler gerekir. Erişim engelleri aşılmamalıdır.

## Üç aşamalı düzeltme sırası

1. **Yanlış otomatik seçimi durdur:** Backend'in model hatası fallback'ini çözümlenemedi sonucuna çevir; malzeme başına aday dengesi kur; kategori ayrıntısını koru; mesafe birimini düzelt; gerçek API yanıtıyla sözleşme testlerini ekle.
2. **Ürün uygunluğunu yapılandır:** Dinamik V3 kategori ağacı ve doğrulanmış filtreleri proxy'ye bağla; malzeme/alt tür uygunluğunu fiyat sıralamasından önce kontrol et; ürün kimliği, miktar ve birim fiyatı seçim sözleşmesine ekle; muadilleri ayrı göster.
3. **Canlı kaliteyi ölç ve veriyi yenile:** Kimlikle sepet eşitleme, kaynak indeks zamanı ve kampanya görünürlüğü ekle. Sütlaç, köfte, karnıyarık ve kakaolu kek gibi örneklerle insan tarafından etiketlenmiş bir veri kümesinde doğru seçim, yanlış seçim, çözümlenemedi ve eksik malzeme oranlarını ayrı ölç. Model hatası, boş aday, uzun tarif ve belirsiz ürün kimliği senaryolarını da kapsa.

Denetimde uygulama veya backend'in çalışma davranışı değiştirilmedi. Bulgular canlı API çağrıları, kaynak incelemesi ve kontrollü çevrimdışı yeniden üretimle elde edildi. Önceki mock tabanlı 32 frontend testinin geçmesi bu ürün uygunluğu sorunlarının çözüldüğü anlamına gelmez.
