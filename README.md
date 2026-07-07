# 🛒 Market AI (Akıllı Market Bulucu ve AI Destekli Alışveriş Asistanı)

Market AI, kullanıcının koordinatlarına göre en yakın marketleri listelemeyi, TÜBİTAK BİLGEM’in güncel fiyat verilerini sorgulamayı ve yapay zeka (Gemini AI) desteğiyle yemek tariflerini otomatik alışveriş listelerine dönüştürmeyi sağlayan modern ve ölçeklenebilir bir **Next.js 15 (React 19)** web uygulamasıdır.

---

## 🌟 Öne Çıkan Özellikler

* 📍 **Konum ve Yarıçap Bazlı Arama:** Kullanıcının girdiği adrese göre 1-10 km yarıçapındaki marketleri harita üzerinde listeler.
* 🏷️ **TÜBİTAK BİLGEM Entegrasyonu:** Yakındaki marketler, TÜBİTAK BİLGEM’in `marketfiyati.org.tr` API'si üzerinden güncel ve güvenilir fiyat verileriyle çekilir.
* 🤖 **AI Destekli Reçete & Alışveriş Listesi:** Kullanıcı yapmak istediği yemeğin adını yazar, Gemini AI bu yemeğin tarifini ve gereken malzemeleri çıkarır.
* 🔍 **Semantik Ürün Eşleme & Alternatif Önerileri:**
  * Ajan, yemek malzemelerini marketteki ürünlerle eşleştirir.
  * Eğer bir malzeme o markette bulunmuyorsa, sistem alternatif bir ürün önerir (Örn: *"Çarliston biber bulunamadı, yerine Sivri Biber eklendi"*).
* 🗺️ **Rotasyon ve Harita Görselleştirme:** Seçilen marketlere ait konumlar haritada gösterilir ve `leaflet-routing-machine` ile en uygun rotalar çıkarılır.
* 📊 **Besin ve Kalori Analizi:** Yapay zeka, hazırlanan yemek listesinin kalori bilgilerini ve besin değerlerini detaylandırır.

---

## 🛠️ Teknoloji Stack

* **Frontend:** Next.js 15 (App Router - Turbopack), React 19, TypeScript.
* **Tasarım:** TailwindCSS v4, shadcn/ui, Radix UI Primitives, Lucide Icons, Framer Motion (tw-animate-css).
* **Durum Yönetimi & Veri Çekme:** Zustand (global state), TanStack Query v5 (React Query) ile veri önbellekleme (intelligent caching).
* **Harita ve Lokasyon:** Leaflet, React Leaflet, Leaflet Routing Machine.
* **Yapay Zeka:** `@google/generative-ai` (Gemini API Integration), Python LLM Backend proxy entegrasyonu.
* **İletişim:** Axios tabanlı yapılandırılmış API istemcisi (`apiClient`).

---

## 📂 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (GCP ve TÜBİTAK API proxy geçitleri)
│   │   ├── ai-page/       # Yapay zeka ve reçete proxy uç noktaları
│   │   ├── search-addresses/
│   │   └── search-markets/
│   ├── ai-chat/           # Gemini destekli akıllı sohbet ve alternatif ürün ekranı
│   ├── product-search/    # Ürün arama ve karşılaştırma arayüzü
│   ├── layout.tsx
│   └── page.tsx           # Ana Sayfa (Adres seçimi ve harita)
├── components/            # Yeniden kullanılabilir UI bileşenleri
│   ├── ui/               # shadcn/ui bileşenleri
│   └── DynamicMap.js     # Leaflet harita entegrasyonu
├── features/             # Modüler iş özellikleri (Address, Markets)
├── lib/                  # Axios konfigürasyonu, hata yönetimi ve string araçları
├── services/             # LlmService (AI istekleri) ve Market API servisleri
├── store/                # Zustand global state (konum, sepet ve filtreler)
└── types/                # TypeScript tip tanımları
```

---

## 🔌 API Entegrasyonları ve Proxy Katmanları

Uygulama, CORS engellerini aşmak ve anahtarları güvenli tutmak için Next.js API Routes üzerinden istekleri proxy'ler:

### 1. Reçete Malzeme Listesi Oluşturma
```
POST /api/ai-page/recipe-list
Body: { "recipe_name": string }
```
Gemini AI üzerinden yemeğe ait malzemeleri çıkarır.

### 2. Kalori ve Besin Değeri Hesaplama
```
POST /api/ai-page/recipe-with-calories
Body: { "recipe_name": string }
```
Yemeğe ait kalori bilgilerini ve yapılış adımlarını getirir.

### 3. Akıllı Ürün Seçimi & Eşleme
```
POST /api/ai-page/select-products
Body: {
  "recipe_name": string,
  "ingredients": string[],
  "products": ProductList[]
}
```
Malzemeler ile marketteki ürünleri semantik olarak eşleştirir, eksik ürünlere akıllı alternatifler bulur.

---

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
git clone https://github.com/yucel-gumus/market-ai.git
cd market-ai
npm install
```

### 2. Çevresel Değişkenler
Proje kök dizininde `.env.local` oluşturun:

```env
# TÜBİTAK BİLGEM Market Fiyatı API Uç Noktaları
NEXT_PUBLIC_ADDRESS_API_URL=https://harita.marketfiyati.org.tr/Service/api/v1
NEXT_PUBLIC_MARKET_API_URL=https://api.marketfiyati.org.tr/api/v2

# Python LLM Backend Yapılandırması
NEXT_PUBLIC_PYTHON_API_URL=https://your-python-backend-url.com
PYTHON_API_KEY=your_secure_api_key
```

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde ayağa kalkacaktır.
