function getMarketData() {
  if (typeof window === 'undefined') {
    return { selectedAddress: null, selectedMarkets: [], distance: 5 };
  }

  const rawData = localStorage.getItem('marketSearchData');
  if (!rawData) return { selectedAddress: null, selectedMarkets: [], distance: 5 };

  try {
    return JSON.parse(rawData);
  } catch (e) {
    console.error('Veri JSON formatında değil:', e);
    return { selectedAddress: null, selectedMarkets: [], distance: 5 };
  }
}

function buildRequestConfig(malzeme, page) {
  const parsedData = getMarketData();
  return {
    latitude: parsedData?.selectedAddress?.latitude ?? 0,
    longitude: parsedData?.selectedAddress?.longitude ?? 0,
    distance: parsedData?.distance ?? 5,
    size: 50,
    pages: page,
    menuCategory: false,
    depots: parsedData?.selectedMarkets?.map((m) => m.id) ?? [],
    keywords: malzeme,
  };
}

async function fetchCategoriesData(malzeme) {
  const allProducts = [];
  let currentPage = 0;

  try {
    while (true) {
      const response = await fetch('/api/search-by-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildRequestConfig(malzeme, currentPage)),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const result = await response.json();
      if (result?.success === false) {
        throw new Error(result.error || 'Kategori arama başarısız');
      }

      const content = result.content || [];

      if (content.length === 0) {
        break;
      }

      allProducts.push(...content);
      currentPage++;
    }

    return allProducts;
  } catch (error) {
    console.error('Market API hatası:', error);
    return allProducts;
  }
}

export { fetchCategoriesData };