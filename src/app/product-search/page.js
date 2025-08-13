
'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import './productSearch.css';
const DynamicMap = dynamic(() => import('../../components/DynamicMap'), {
  ssr: false,
  loading: () => <div className="map-loading">🗺️ Harita yükleniyor...</div>
});

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchStats, setSearchStats] = useState({ totalResults: 0, searchTime: 0 });
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchSettings, setSearchSettings] = useState(null);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  
  // localStorage'dan marketSearchData verisini çek
  const getSearchSettings = () => {
    const marketSearchData = localStorage.getItem('marketSearchData');
    const data = JSON.parse(marketSearchData);
    
    return {
      latitude: data.selectedAddress.latitude,
      longitude: data.selectedAddress.longitude,
      distance: data.distance,
      pages: 0,
      size: 50,
      depots: data.selectedMarkets.map(market => market.id),
      selectedMarkets: data.selectedMarkets // Market mesafe bilgileri için
    };
  };

  // Client-side'da searchSettings'i yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchSettings(getSearchSettings());
    }
  }, []);

  // Market ID'sine göre mesafe bul
  const getMarketDistance = (depot) => {
    if (!searchSettings) return null;
    
    // Önce depot.depotId ile deneyeceğiz (API'de id değil depotId var)
    let market = searchSettings.selectedMarkets.find(m => m.id === depot.depotId);
    
    if (!market) {
      // Eğer bulamazsa depot objesi içindeki başka alanları deneyelim
      // Market adı + address kombinasyonu ile deneyelim
      market = searchSettings.selectedMarkets.find(m => 
        depot.depotName && depot.depotName.toLowerCase().includes(m.address?.toLowerCase())
      );
    }
    
    return market ? market.distance : null;
  };

  const showStoreRoute = (depot) => {
    if (!depot.latitude || !depot.longitude) {
      alert('Mağaza konumu bulunamadı!');
      return;
    }
    setSelectedStore(depot);
    setShowMap(true);
    setRouteInfo(null);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedStore(null);
    setRouteInfo(null);
  };

  const handleRouteFound = React.useCallback((info) => {
    setRouteInfo(prevInfo => {
      if (!prevInfo || 
          prevInfo.distance !== info.distance || 
          prevInfo.time !== info.time) {
        return info;
      }
      return prevInfo;
    });
  }, []);

  const searchProducts = async (query) => {
    if (query.length < 2 || !searchSettings) {
      setProducts([]);
      setIsDropdownOpen(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const startTime = Date.now();
    try {
      let allProducts = [];
      let currentPage = 0;
      let hasMorePages = true;
      while (hasMorePages) {
        const requestData = {
          keywords: query, pages: currentPage, size: searchSettings.size,
          latitude: searchSettings.latitude, longitude: searchSettings.longitude,
          distance: searchSettings.distance, depots: searchSettings.depots
        };
        const response = await fetch('https://api.marketfiyati.org.tr/api/v2/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(requestData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        if (!data.content || data.content.length === 0) {
          hasMorePages = false;
        } else {
          allProducts = [...allProducts, ...data.content];
          currentPage++;
        }
      }
      const searchTime = Date.now() - startTime;
      setProducts(allProducts);
      setSearchStats({ totalResults: allProducts.length, searchTime, pagesSearched: currentPage });
      setIsDropdownOpen(true);
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setIsDropdownOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { searchProducts(value); }, 300);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchQuery(product.title);
    setIsDropdownOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery(''); setProducts([]); setSelectedProduct(null);
    setIsDropdownOpen(false); setError(null); searchInputRef.current?.focus();
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const getUniqueProducts = (products) => {
    const seen = new Set();
    return products.filter(product => {
      const key = product.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base', ignorePunctuation: true }));
  };

  const uniqueProducts = getUniqueProducts(products);

  return (
    <div className="product-search">
       <div className="search-container">
        <div className="search-header">
          <h1 className="search-title">
            <span className="title-icon">🔍</span>
            Canlı Ürün Arama
          </h1>
          <p className="search-subtitle">
            Ürün adı yazın, anında sonuçları görün
          </p>
        </div>

        <div className="search-input-section">
          <div className="search-input-wrapper" ref={dropdownRef}>
            <div className="input-container">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Ürün adı yazın... (en az 2 karakter)"
                className="search-input"
                autoComplete="off"
              />
              
              <div className="input-actions">
                {isLoading && (
                  <div className="loading-spinner">⏳</div>
                )}
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="clear-btn"
                    title="Temizle"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {searchQuery.length >= 2 && !isLoading && !error && (
              <div className="search-stats">
                <span className="stats-item">
                  📊 {searchStats.totalResults} sonuç
                </span>
                <span className="stats-item">
                  ⚡ {searchStats.searchTime}ms
                </span>
                <span className="stats-item">
                  🎯 {uniqueProducts.length} benzersiz ürün
                </span>
                <span className="stats-item">
                  📄 {searchStats.pagesSearched || 0} sayfa tarandı
                </span>
              </div>
            )}

            {error && ( <div className="error-message"> ❌ Hata: {error} </div> )}

            {isDropdownOpen && uniqueProducts.length > 0 && (
              <div className="dropdown-results">
                <div className="dropdown-header">
                  <span>Bulunan Ürünler ({uniqueProducts.length})</span>
                </div>
                <div className="dropdown-list">
                  {uniqueProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="dropdown-item" onClick={() => handleProductSelect(product)}>
                      <div className="product-info">
                        <div className="product-title">{product.title}</div>
                        <div className="product-details">
                          <span className="product-volume">
                            📏 {product.refinedVolumeOrWeight || 'Belirtilmemiş'}
                          </span>
                          <span className="product-stores">
                            🏪 {product.productDepotInfoList?.length || 0} mağaza
                          </span>
                          <span className="product-price">
                            💰 {product.productDepotInfoList?.[0]?.price || 'N/A'} ₺
                          </span>
                        </div>
                      </div>
                      <div className="select-arrow">→</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isDropdownOpen && uniqueProducts.length === 0 && searchQuery.length >= 2 && !isLoading && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <div className="no-results-text">
                  "<strong>{searchQuery}</strong>" için sonuç bulunamadı
                </div>
                <div className="no-results-hint">
                  Farklı bir arama terimi deneyin
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedProduct && (
          <div className="selected-product">
            <div className="selected-header">
              <h3>✅ Seçilen Ürün</h3>
              <button onClick={() => setSelectedProduct(null)} className="deselect-btn">
                ✕
              </button>
            </div>
            <div className="selected-content">
              <div className="selected-title">{selectedProduct.title}</div>
              <div className="selected-details">
                <div className="detail-item">
                  <span className="detail-label">📏 Ölçü:</span>
                  <span className="detail-value">
                    {selectedProduct.refinedVolumeOrWeight || 'Belirtilmemiş'}
                  </span>
                </div>
              </div>
              {selectedProduct.productDepotInfoList && selectedProduct.productDepotInfoList.length > 0 && (
                <div className="store-list">
                  <h4 className="store-list-title">🏬 Mevcut Mağazalar:</h4>
                  <div className="stores-grid">
                    {selectedProduct.productDepotInfoList
                      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                      .map((depot, index) => {
                        const distance = getMarketDistance(depot);
                        return (
                          <div key={index} className="store-item">
                            <div className="store-header">
                              <span className="store-name">
                                🏪 {depot.depotName}
                              </span>
                              <span className="store-market">
                                {depot.marketAdi?.toUpperCase() || 'N/A'}
                              </span>
                            </div>
                            <div className="store-details">
                              <span className="store-price">
                                💰 {depot.price} ₺
                              </span>
                              <span className="store-distance">
                                📍 {distance ? `~${(distance / 1000).toFixed(1)} km (kuş uçuşu)` : 'Mesafe bilinmiyor'}
                              </span>
                            </div>
                            <div className="store-actions">
                              <button onClick={() => showStoreRoute(depot)} className="route-btn" disabled={!depot.latitude || !depot.longitude}>
                                🗺️ Rota Göster
                              </button>
                            </div>
                            {index === 0 && (
                              <div className="cheapest-badge">
                                🏆 En Ucuz
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="search-tips">
          <h4>💡 Arama İpuçları</h4>
          <ul>
            <li>En az 2 karakter yazın</li>
            <li>Ürün adını tam olarak yazmaya gerek yok</li>
            <li>Sonuçlar otomatik olarak güncellenir</li>
            <li>Dropdown'dan ürün seçebilirsiniz</li>
          </ul>
        </div>
      </div>

      {showMap && selectedStore && searchSettings && (
        <div className="map-modal">
          <div className="map-container">
            <div className="map-header">
              <div className="map-title">
                <h3>🗺️ {selectedStore.depotName} - Yol Tarifi</h3>
                <div className="map-info">
                  <span>🏪 {selectedStore.marketAdi?.toUpperCase()}</span>
                  <span>💰 {selectedStore.price} ₺</span>
                </div>
              </div>
              <button onClick={closeMap} className="map-close-btn">✕</button>
            </div>
            
            {routeInfo && (
              <div className="route-info">
                <div className="route-stats">
                  <span className="route-distance">📏 {routeInfo.distance} km</span>
                  <span className="route-time">⏱️ {routeInfo.timeText || `${routeInfo.time} dk`}</span>
                  <span className="route-type">🚗 {routeInfo.routeType || 'Arabayla'}</span>
                  {routeInfo.error && (
                    <span className="route-error">⚠️ {routeInfo.error}</span>
                  )}
                </div>
              </div>
            )}

            <div className="map-content">
              <DynamicMap
                center={[searchSettings.latitude, searchSettings.longitude]}
                userCoords={{
                  lat: searchSettings.latitude,
                  lng: searchSettings.longitude
                }}
                selectedStore={selectedStore}
                onRouteFound={handleRouteFound}
                searchSettings={searchSettings}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;