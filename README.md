# 🛒 Market AI - Smart Grocery Price Optimizer & Recipe Planner

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS_Map-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Recipe_%26_Price_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Portfolio](https://img.shields.io/badge/Portfolio-yucelgumus.dev-2563EB?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.yucelgumus.dev/)

> Farklı market zincirleri arasındaki ürün fiyatlarını karşılaştıran, en ekonomik sepeti oluşturan, **Google Gemini AI** ile kullanıcı hedeflerine göre yemek tarifleri & kalori hesaplamaları yapan ve en uygun market alışveriş rotasını haritada optimize eden akıllı alışveriş asistanı.

---

## 🌟 Öne Çıkan Özellikler

- 💰 **Çoklu Market Fiyat Karşılaştırması:** Aynı ürünün farklı marketlerdeki (A101, BİM, ŞOK, Migros, Carrefour vb.) anlık fiyatlarını ve stok durumlarını kıyaslama.
- 🍳 **Yapay Zeka Destekli Tarif & Kalori Planlayıcı (`AI Recipe Pipeline`):** *"4 kişilik bütçe dostu ve 500 kalorilik akşam yemeği"* gibi isteklerle anında malzeme listesi ve tarif üretimi.
- 🛍️ **Akıllı Alışveriş Sepeti Optimizasyonu:** Sepetteki ürünleri en uygun fiyatlı marketlere paylaştırarak maksimum tasarruf sağlama (`useShoppingCart.ts`).
- 🗺️ **Çoklu Mağaza Rota Planlama (Multi-Store Route):** Sepetteki ürünlerin bulunduğu marketlere en kısa sürüş/yürüme rotasını harita üzerinde çizme (`MultiStoreRouteModal.tsx`).
- 📍 **Konum & Mesafe Filtreleme:** Kullanıcının mevcut adresine veya seçtiği konuma göre en yakın mağazaları filtreleme.

---

## 🏗️ Mimari & Modül Hiyerarşisi

```mermaid
graph TD
    User([Kullanıcı]) --> Search[Ürün & Adres Arama]
    User --> AIChat[AI Tarif & Menü Asistanı]
    AIChat --> RecipeRoute[/api/ai-page/recipe-with-calories/]
    RecipeRoute --> Gemini[Google Gemini AI]
    Search --> MarketAPI[Market & Ürün Arama API'leri]
    MarketAPI --> Cart[Akıllı Sepet Yöneticisi]
    Cart --> RouteModal[Çoklu Mağaza Rota Optimizasyonu]
    RouteModal --> LeafletMap[İnteraktif Leaflet Haritası]
```

| Özellik Grubu | İlgili Dizin / Dosya | Açıklama |
| :--- | :--- | :--- |
| **Ürün & Sepet** | `src/features/products/` | Ürün arama, filtreler, sepet özeti ve açılır menüler |
| **Market & Rota** | `src/features/markets/` | Market kartları, mesafe seçimi ve harita markerları |
| **Yapay Zeka** | `src/features/ai-chat/` | Gemini tarif hattı ve kalori hesaplayıcı |
| **Harita** | `src/components/MarketMap.js` | Dinamik Leaflet market ve rota haritası |

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Node.js**: v18.18+ veya v20+
- **Google Gemini API Key**

### Kurulum

```bash
git clone https://github.com/yucel-gumus/market-ai.git
cd market-ai

npm install
```

### Ortam Değişkenleri (`.env.local`)

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Çalıştırma

```bash
npm run dev
```

Uygulamaya tarayıcınızdan `http://localhost:3000` adresinden erişebilirsiniz.

---

## 📂 Proje Dizin Yapısı

```
market-ai/
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── src/
    ├── app/
    │   ├── page.tsx                    # Ana sayfa
    │   ├── product-search/             # Ürün arama sayfası
    │   ├── ai-chat/                    # Yapay zeka tarif sayfası
    │   └── api/                        # Market, ürün ve AI endpoint'leri
    ├── features/
    │   ├── products/                   # Ürün özellikleri ve sepet kancaları
    │   ├── markets/                    # Market filtreleri ve kartları
    │   ├── address/                    # Adres arama ve konum ayrıştırma
    │   └── ai-chat/                    # Gemini tarif akışı
    ├── components/                     # Harita, Navbar ve temel UI bileşenleri
    ├── lib/                            # Coğrafi hesaplamalar, proxy ve yardımcılar
    └── store/                          # Global Zustand state'i
```

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

## 👨‍💻 Geliştirici & İletişim

**Yücel Gümüş** - Full Stack Developer

- 🌐 **Web Sitesi / Portfolyo:** [yucelgumus.dev](https://www.yucelgumus.dev/)
- 💼 **LinkedIn:** [linkedin.com/in/yucel-gumus](https://www.linkedin.com/in/yucel-gumus/)
- 🐙 **GitHub:** [@yucel-gumus](https://github.com/yucel-gumus)

<p align="left">
  <a href="https://www.yucelgumus.dev/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Developed%20by-Yücel%20Gümüş-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Yücel Gümüş Portfolio" />
  </a>
</p>
