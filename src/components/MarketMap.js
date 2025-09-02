'use client';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarketLogo, detectMarketBrand } from '@/lib/marketUtils';

let mapInstanceCounter = 0;

if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  const style = document.createElement('style');
  style.textContent = `
    .custom-market-marker {
      background: transparent !important;
      border: none !important;
    }
    .custom-market-marker:hover div {
      transform: scale(1.15) !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
    }
    .custom-user-marker {
      background: transparent !important;
      border: none !important;
    }
    .custom-user-marker:hover div {
      transform: scale(1.05) !important;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  if (!document.head.querySelector('style[data-market-map]')) {
    style.setAttribute('data-market-map', 'true');
    document.head.appendChild(style);
  }
}

const MapWrapper = ({ userLocation, markets, hiddenMarkets = new Set(), onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const instanceId = useRef(++mapInstanceCounter);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapElement = mapRef.current;
    if (!mapElement || mapElement._leaflet_id) return;

    const map = L.map(mapElement, {
      center: userLocation ? [userLocation.latitude, userLocation.longitude] : [41.0082, 28.9784],
      zoom: 13,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(map);

    let userMarker = null;
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            width: 50px; height: 50px;
            background: linear-gradient(45deg, #3B82F6, #1E40AF);
            border: 3px solid white; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); position: relative;
          ">
            <div style="color: white; font-size: 20px; font-weight: bold;">📍</div>
            <div style="
              position: absolute; top: -5px; right: -5px;
              width: 16px; height: 16px; background: #10B981;
              border: 2px solid white; border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          </div>
        `,
        className: 'custom-user-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
      });

      userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <div style="font-size: 18px; margin-bottom: 8px;">📍</div>
            <div style="font-weight: bold; color: #1F2937; margin-bottom: 4px;">Konumunuz</div>
            <div style="font-size: 12px; color: #6B7280;">${userLocation.fullAddress || 'Seçilen konum'}</div>
          </div>
        `);
    }

    mapInstanceRef.current = {
      map,
      userMarker,
      markers: new Map()
    };

    map.on('error', (e) => console.warn('Map error:', e));

    setTimeout(() => {
      if (map && mapInstanceRef.current) {
        try { map.invalidateSize(); } catch (error) { console.warn('Map invalidateSize error:', error); }
      }
    }, 100);

    return () => {
      const mapInstance = mapInstanceRef.current;
      const mapRefCurrent = mapRef.current;
      if (!mapInstance) return;
      const { map, userMarker, markers } = mapInstance;
      try {
        if (markers) markers.forEach(m => map.removeLayer(m));
        if (userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker);
        map.off();
        if (typeof map.remove === 'function') map.remove();
        if (mapRefCurrent && mapRefCurrent._leaflet_id) delete mapRefCurrent._leaflet_id;
      } catch (error) { console.warn('Map cleanup error:', error); } finally { mapInstanceRef.current = null; }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markets) return;
    const { map, markers } = mapInstanceRef.current;

    if (markers) {
      markers.forEach(marker => {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      });
      markers.clear();
    }

    markets.forEach((market) => {
      if (!market.latitude || !market.longitude) return;

      const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
      const isHidden = hiddenMarkets.has(marketKey);
      const marketLogo = market.logo || getMarketLogo(market.name);
      const brandName = market.brand || detectMarketBrand(market.name);

      const icon = L.divIcon({
        html: `
          <div style="
            width: 45px; height: 45px;
            background: white;
            border: 3px solid ${isHidden ? '#9CA3AF' : '#DC2626'};
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            opacity: ${isHidden ? '0.6' : '1'};
            transform: ${isHidden ? 'scale(0.85)' : 'scale(1)'};
            transition: all 0.2s ease; cursor: pointer;
          ">
            ${marketLogo ? `<img src="${marketLogo}" alt="${brandName}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;"
              onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\"color: #DC2626; font-size: 18px; font-weight: bold;\\">🏪</div>';">`
            : `<div style="color: #DC2626; font-size: 18px; font-weight: bold;">🏪</div>`}
          </div>
        `,
        className: 'custom-market-marker',
        iconSize: [45, 45],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
      });

      const marker = L.marker([market.latitude, market.longitude], { icon, opacity: isHidden ? 0.7 : 1.0 }).addTo(map);

      const brandLogo = marketLogo ? `<img src="${marketLogo}" alt="${brandName}" style="width: 40px; height: 40px; object-fit: contain; margin-bottom: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">` : '';

      marker.bindPopup(`
        <div style="text-align: center; min-width: 220px; padding: 12px;">
          ${brandLogo}
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #1F2937;">${brandName.toUpperCase()}</div>
          <div style="margin-bottom: 6px; font-size: 14px; color: #374151; font-weight: 500;">${market.name}</div>
          <div style="margin-bottom: 10px; font-size: 12px; color: #6B7280; line-height: 1.4;">${market.address}</div>
          <div style="
            background: linear-gradient(45deg, #10B981, #059669);
            color: white; padding: 6px 14px; border-radius: 20px;
            font-weight: bold; font-size: 12px; display: inline-block;
            margin-bottom: 8px; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          ">📍 ${market.distance} km uzaklıkta</div>
          ${isHidden ? '<div style="margin-top: 8px; font-size: 11px; color: #EF4444; font-weight: 600; background: #FEE2E2; padding: 4px 8px; border-radius: 12px; display: inline-block;">❌ Filtrelenmiş</div>'
          : '<div style="margin-top: 8px; font-size: 11px; color: #10B981; font-weight: 600; background: #DCFCE7; padding: 4px 8px; border-radius: 12px; display: inline-block;">✅ Seçilmiş</div>'}
        </div>
      `);

      if (onMarkerClick) marker.on('click', () => onMarkerClick(market));

      markers.set(marketKey, marker);
    });

    if (!mapInstanceRef.current.hasFitted) {
      const visibleMarkers = [];
      if (userLocation) visibleMarkers.push([userLocation.latitude, userLocation.longitude]);
      markets.forEach(market => {
        if (market.latitude && market.longitude) {
          const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
          if (!hiddenMarkets.has(marketKey)) visibleMarkers.push([market.latitude, market.longitude]);
        }
      });
      if (visibleMarkers.length > 1) {
        try {
          const group = new L.featureGroup(visibleMarkers.map(coord => L.marker(coord)));
          map.fitBounds(group.getBounds().pad(0.1));
        } catch (error) { console.warn('Error fitting bounds:', error); }
      }
      mapInstanceRef.current.hasFitted = true;
    }

  }, [markets, hiddenMarkets, onMarkerClick, userLocation]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      data-map-instance={instanceId.current}
    />
  );
};

const MarketMap = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: '400px', width: '100%' }}>
        <div className="text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm text-gray-600">Harita yükleniyor...</div>
        </div>
      </div>
    );
  }

  return <MapWrapper {...props} />;
};

export default MarketMap;
