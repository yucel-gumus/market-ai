# 🛒 Market AI

[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://market-ai-coral.vercel.app)
[![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-python--backend-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

`marketfiyati.org.tr` verisiyle çalışan tarif → malzeme → ürün eşleştirme ve market karşılaştırma
uygulaması.

---

## Ne yapar

Market AI, kullanıcıdan bir tarif isteği (ör. *"4 kişilik bütçe dostu akşam yemeği"*) alır; **FastAPI**
tabanlı Python backend (`python_backend`) üzerinde çalışan bir LLM ile tarifi malzeme listesine
böler, her malzeme için `marketfiyati.org.tr` kataloğundan **gerçek ürün adayları** toplar ve seçilen
şubelerdeki fiyatlara göre en ucuz sepeti/kombinasyonu hesaplar. Serbest ürün arama, adres ve market
arama, çoklu mağaza için yaklaşık araç rotası (OSRM) hesaplama özellikleri de vardır. Fiyat ve stok
bilgisi **yalnızca üst kaynak API'den** gelir; uygulama kendi fiyat verisini üretmez.

---

## Mimari

```
        Tarayıcı (React 19 / Next.js 15 App Router)
                     │
                     ▼
   Next.js sunucu-taraflı proxy rotaları (/src/app/api/**)
        │                                    │
        │ (market / adres arama)             │ (LLM işlemleri)
        ▼                                    ▼
  marketfiyati.org.tr API'leri        FastAPI backend (Cloud Run, europe-west3)
                                             │
                                             ▼
                                 Google Gemini + ürün seçim orkestrasyonu
```

- **Next.js App Router + Vercel proxy rotaları → FastAPI/Cloud Run.** Tarayıcı, `marketfiyati.org.tr`
  API'sine ve Python backend'e **doğrudan** gitmez. Tüm çağrılar Next.js sunucu rotalarından geçer
  (`src/app/api/**`), böylece API anahtarları istemci paketine sızmaz.
  - Market/adres proxy'leri: `src/lib/marketApiProxy.ts`
  - LLM proxy'leri: `src/lib/backendProxy.ts` (backend'e `X-API-Key` başlığıyla gider)
  - İstemciye bakan ürün arama/sayfalama: `src/services/productService.ts`
- **Sunucu-taraflı ürün seçimi.** Ürün arama, sayfalama ve aday seçimi istemcide değil sunucuda
  yürür; istemci yalnızca doğrulanmış sonuçları gösterir.
- **"Agent yargılar, kod doğrular".** LLM (agent) uygun ürünü adaylar arasından seçer; ancak seçimin
  gerçekten aday listesinde bulunduğu, kimlik/başlık/malzeme ilişkisinin tutarlı olduğu **kod
  tarafında** doğrulanır. Model hata verdiğinde ucuz ürün otomatik seçilmez; kullanıcıya aday ürünler
  sunulur. (Denetim noktaları: `src/lib/ingredientSelection.ts`,
  `python_backend/app/services/market_orchestrator.py`.)

---

## Kurulum ve yerel çalıştırma

```bash
npm install
```

Kök dizinde `.env.local` oluşturun (`.env.example` şablonundan türetilebilir):

```dotenv
# Yerel Python backend
PYTHON_API_URL=http://localhost:8000
PYTHON_API_KEY=<backend'in istemci API anahtarı>

# Market ve adres arama (sunucu-taraflı)
MARKET_API_URL=https://api.marketfiyati.org.tr/api
ADDRESS_API_URL=https://harita.marketfiyati.org.tr/Service/api/v1

# Rota servisi (opsiyonel; yalnızca demo sunucudan farklı bir örnek için)
# NEXT_PUBLIC_OSRM_BASE_URL=https://osrm.sizin-alaniniz/route/v1
```

Ardından geliştirme sunucusunu başlatın:

```bash
npm run dev
# http://localhost:3000
```

Bu depo yalnızca Next.js arayüzünü ve proxy rotalarını içerir. Python backend ayrı çalıştırılır;
model sağlayıcısı ve anahtarları backend tarafında yapılandırılır. Next.js tek başına tarif üretemez.

---

## Ortam değişkenleri

Tüm değişkenler **koddan** doğrulanmıştır (okuma noktaları tabloda).

| Değişken | Zorunlu | Nerede okunur | Açıklama |
|---|---|---|---|
| `PYTHON_API_URL` | Evet (LLM özellikleri için) | `src/lib/env.ts` → `getPythonApiUrl` | FastAPI backend taban URL'i. Sunucu-taraflı; istemciye gitmez. `NEXT_PUBLIC_PYTHON_API_URL` yoksa fallback olarak kullanılır. Yerel: `http://localhost:8000`. |
| `PYTHON_API_KEY` | Evet | `src/lib/env.ts` → `getPythonApiKey` | Backend'e `X-API-Key` başlığı olarak gönderilen istemci anahtarı. Yalnızca sunucu-taraflı okunur; **asla** `NEXT_PUBLIC_` önekiyle tanımlanmamalıdır. |
| `MARKET_API_URL` | Evet (arama için) | `src/lib/env.ts` → `getMarketApiUrl` | Market/ürün API taban adresi. `NEXT_PUBLIC_MARKET_API_URL` fallback'i vardır. |
| `ADDRESS_API_URL` | Evet (adres/market arama için) | `src/lib/env.ts` → `getAddressApiUrl` | Adres ve harita API taban adresi. `NEXT_PUBLIC_ADDRESS_API_URL` fallback'i vardır. |
| `NEXT_PUBLIC_OSRM_BASE_URL` | Hayır | `src/constants/index.ts` (`LEAFLET.OSRM_SERVICE`) | Araç rotası hesaplayan OSRM servis adresi. **Varsayılan**, OSRM'in genel demo sunucusudur (`https://router.project-osrm.org/route/v1`) ve **üretim trafiği için uygun değildir / garanti vermez.** Üretimde kendi OSRM örneğinizi veya ücretli bir servisi bu değişkenle bağlayın. Demo sunucu kullanılırken konsola uyarı yazılır (`src/components/DynamicMap.jsx`). |
| `NEXT_PUBLIC_MARKET_API_URL` | Hayır | `src/lib/env.ts` (fallback) | Geriye dönük uyumluluk alias'ı; yalnızca `MARKET_API_URL` tanımsızsa kullanılır. |
| `NEXT_PUBLIC_ADDRESS_API_URL` | Hayır | `src/lib/env.ts` (fallback) | Geriye dönük uyumluluk alias'ı; yalnızca `ADDRESS_API_URL` tanımsızsa kullanılır. |
| `NEXT_PUBLIC_PYTHON_API_URL` | Hayır | `src/lib/env.ts` (fallback) | Geriye dönük uyumluluk alias'ı; yalnızca `PYTHON_API_URL` tanımsızsa kullanılır. İstemci paketine gömülür (URL; anahtar değil). |
| `MARKET_LIVE_TEST` | Hayır | `src/services/marketApi.live.test.ts` | `1` yapıldığında canlı market API'sine karşı testleri açar (`npm run test:live`). |
| `MARKET_LIVE_BASE_URL` | Hayır | `src/services/marketApi.live.test.ts` | Canlı testlerin hedef taban URL'ini geçersiz kılar. |
| `UI_TEST_BASE_URL` | Hayır | `scripts/verify-shopping-ui.cjs` | UI doğrulama betiğinin hedef adresini geçersiz kılar (varsayılan `http://localhost:3016`; canlıya karşı çalıştırmak için dağıtım adresine ayarlayın). |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | Hayır | `scripts/verify-shopping-ui.cjs` | Chromium yürütülebilir dosyasının yolu (özel kurulumlar için). |
| `NODE_ENV` | Hayır | `src/lib/env.ts` → `isProduction` | Üretimde hata mesajlarının ayrıntısını kısıtlar. |

> `.env*` dosyaları `.gitignore` ile hariç tutulur (`.env.example` hariç); gerçek sırlar repoya girmez.

---

## Komutlar

`package.json`'dan doğrulanmıştır:

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu (`next dev --turbopack`). |
| `npm run build` | Üretim derlemesi (`next build`). |
| `npm run start` | Derlenmiş uygulamayı sunar (`next start`). |
| `npm run lint` | ESLint denetimi (`next lint`). |
| `npm run test` | Birim testleri (Vitest, tek çalıştırma). Kapsam: `src/**/*.{test,spec}.{ts,tsx}` (`vitest.config.ts`). |
| `npm run test:watch` | Vitest'i izleme modunda çalıştırır. |
| `npm run test:ui` | `scripts/verify-shopping-ui.cjs` — Playwright ile uçtan uca arayüz doğrulaması (gerektiğinde dev sunucusunu 3016 portunda kendi başlatır; hedef `UI_TEST_BASE_URL` ile değiştirilir). |
| `npm run test:live` | `MARKET_LIVE_TEST=1` ile canlı market API'sine karşı testler (`src/services/marketApi.live.test.ts`). |
| `npm run test:backend` | `scripts/verify-backend-contract.cjs` — Python backend'in ürün seçim sözleşmesini doğrular (`PYTHON_API_URL` + `PYTHON_API_KEY` gerekir). |
| `npm run test:e2e` | `playwright test` — tarayıcı regresyon paketi (`playwright.config.ts` + `e2e/`). Varsayılan hedef **canlı** üretim sitesidir; `E2E_BASE_URL=http://localhost:3000` ile yerele çevrilir. |

Tarayıcı testleri için bir kez `npx playwright install chromium webkit` çalıştırın.

### E2E paketi (`e2e/`)

Üç projede koşar: `masaustu-chromium`, `mobil-390x844` (Chromium) ve `mobil-webkit` (Safari motoru).

| Spec | Neyi doğrular |
|---|---|
| `duman.spec.ts` | Üç sayfa (`/`, `/ai-chat`, `/product-search`) yüklenir; görünür `h1`/`h2` var; **yatay taşma yok**; konsol/`pageerror` hatası yok. Her koşuda ekran görüntüsü alır. |
| `mobil.tarif-ekrani.spec.ts` | 390×844'te tarif/kişi sayısı ekranı ve sepet yerleşimi. |
| `a11y-rota.spec.ts` | Rota diyaloğu açılınca odak **içine** taşınır, `Escape` kapatır; konsolda kendi `[rota]` OSRM-demo uyarımız **var**, kaldırılan `leaflet-routing-machine`'ın "production use" uyarısı **yok**. |

`seedSession()` yardımcı fonksiyonu, anasayfada adres/market seçmeden açılan sayfaların gerçek
 yerleşimini ölçebilmek için zustand persist kaydını (`market-ai-app`) localStorage'a tohumlar.

---

## Yayına alma

### Frontend — Vercel

`git push` sonrası Vercel otomatik olarak production dağıtımını yapar (`market-ai-coral.vercel.app`).
Ortam değişkenleri Vercel proje ayarlarından tanımlanır.

### Backend — Cloud Run

`python_backend` deposu için:

```bash
gcloud run deploy python-backend \
  --source . \
  --region europe-west3 \
  --project agenticai-500618
```

> Frontend ve backend birlikte güncellenmelidir. Backend'deki seçim sözleşmesi değiştiyse önce yeni
> backend sürümünü yayımlayıp `npm run test:backend` ile doğrulayın, sonra frontend'i dağıtın.

---

## Bilinen sınırlar

- **Ürün önbelleği boş sonuçları önbelleklemez.** Tarif malzemesi için yapılan hatırlama (recall)
  aramasında bir sorgu **boş** dönerse sonuç geçerli kabul edilmez; sıradaki sorgu (sadeleştirilmiş
  ad → katalog eş adı → kategori araması) denenir. Boş bir sonuç "nihai cevap" olarak kilitlenmez
  (`python_backend/app/services/market_orchestrator.py` → `recall`).
- **Tarif adı ≠ katalog adı.** Kullanıcının/LLM'in ürettiği malzeme adı, `marketfiyati.org.tr`
  kataloğundaki ürün adıyla birebir örtüşmeyebilir. Eşleştirme katmanlı kurallarla yapılır (tam ad →
  sadeleştirilmiş ad → katalog eş adı → kategori) ve her katmanda kabul ölçütü her zaman **tam ad**
  uygunluğudur; kurallar `app/services/ingredient_rules.json` içinde tutulur.
- **Fiyat/stok yalnızca üst kaynak API'den.** Uygulama fiyat veya stok tahmini üretmez; mağazanın
  güncel fiyatını/stok durumunu garanti etmez. Fiyatların kontrol zamanı kullanıcıya gösterilir.
- **Rota servisi demo sunucu uyarısı.** `NEXT_PUBLIC_OSRM_BASE_URL` ayarlanmazsa OSRM'in **demo**
  sunucusu kullanılır; bu sunucu üretim trafiği için uygun değildir ve garanti vermez.

---

## Mimari kararı notları

- **Arama + seçim sunucu tarafında.** Ürün arama, sayfalama ve aday seçimi Next.js API rotalarında
  ve Python backend'de yürür; istemci yalnızca doğrulanmış sonucu görür. API anahtarları istemci
  paketine sızmaz.
- **Şube dışı ürün önerilir, ikame edilmez.** Seçili şubelerde bir malzeme bulunamazsa, aynı yarıçap
  içindeki **başka bir şubede** varsa kullanıcıya "başka şubede var" olarak sunulur
  (`status: "outside_branches"`); bu ürün sepete kendiliğinden eklenmez, kullanıcı onayı istenir.
  Rastgele/ikame ürün eklenmez (`market_orchestrator.py`).
- **Boş arama sonucu asla önbelleğe alınmaz.** Boş bir hatırlama sonucu geçerli cevap sayılmaz ve
  sıradaki eşleştirme katmanı denenir; "bulunamadı" durumu yalnızca tüm katmanlar tükendiğinde
  raporlanır.
- **Konsolidasyon planları (`plans: {single, two}`) sunucuda KESİN hesaplanır.** Tek/iki şube modları,
  sepetteki ürünlerin depo listelerine bakınca neredeyse hep "imkânsız" çıkıyordu (her ürün 1-4 şubede).
  Backend artık aday havuzundan **alternatif ürün seçerek** k=1 ve k=2 için gerçek plan üretir
  (`market_orchestrator.build_plans`). `delta`, plan toplamının **kullanıcının o anki sepetine** göre
  farkıdır (konsolidasyonun kazancı/maliyeti dürüst görünsün diye); `switches` kalem bazında değişen
  ürünlerdir. "Planı uygula" ürünleri ikame eder ve şubeleri sabitler (`setItemDepot`), böylece
  istemci tarafındaki `buildShoppingOptions` modları gerçekten mümkün hale gelir. Uygulanabilir plan
  yoksa mod dürüstçe "bu sepet seçili şubelerle tamamlanamıyor" der.
- **Backend ayarları Firestore'dan gelir ve ortam değişkenlerini EZER.** `get_settings()`,
  `FIRESTORE_CONFIG_ENABLED` açıkken `system_config/llm` dokümanındaki alanları ortam değişkenlerinin
  üstüne yazar (`app/core/config.py`). Sonuç: `CLIENT_API_KEYS` / `ADMIN_API_KEYS` gibi değerleri
  döndürürken **Firestore dokümanı** güncellenmelidir; Cloud Run env'ini değiştirmek tek başına
  etkisizdir. Değişiklikten sonra `UPDATE_TS` env değişkenini güncelleyip yeni revizyon alın
  (`@lru_cache`'li ayarlar ancak o zaman tazelenir).

---

## Proje dizin yapısı

```
market-ai/
├── next.config.ts
├── package.json
├── vitest.config.ts
├── scripts/                  # test:ui ve test:backend doğrulama betikleri
├── docs/                     # yayın hazırlığı ve API denetim dokümanları
└── src/
    ├── app/
    │   ├── page.tsx              # Ana sayfa
    │   ├── product-search/       # Ürün arama sayfası
    │   ├── ai-chat/              # AI tarif sayfası
    │   └── api/                  # Market, ürün ve AI proxy rotaları
    ├── features/
    │   ├── products/             # Ürün arama, sepet ve rota özellikleri
    │   ├── markets/              # Market filtreleri ve kartları
    │   ├── address/              # Adres arama ve konum ayrıştırma
    │   └── ai-chat/              # Tarif hattı
    ├── components/               # Harita, Navbar ve temel UI bileşenleri
    ├── lib/                      # Coğrafi hesaplamalar, proxy'ler ve yardımcılar
    ├── services/                 # API istemcileri (productService, marketService)
    └── store/                    # Global Zustand state'i
```

---

## Ek dokümantasyon

- [Yayın hazırlığı ve sürüm bağımlılığı](docs/RELEASE_READINESS.md)
- [API denetimi ve endpoint envanteri](docs/TUBITAK_API_AUDIT.md)
