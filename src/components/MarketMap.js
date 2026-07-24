'use client';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULTS } from '@/constants';
import { addOsmTileLayer, ensureLeafletDefaultIcons } from '@/lib/leafletSetup';
import { injectMapMarkerStyles } from '@/lib/mapMarkers';
import { getMarketLogo, detectMarketBrand } from '@/lib/marketUtils';

let mapInstanceCounter = 0;

if (typeof window !== 'undefined') {
  ensureLeafletDefaultIcons();
  injectMapMarkerStyles();
}

const MapWrapper = ({ userLocation, markets, hiddenMarkets = new Set(), onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const instanceId = useRef(++mapInstanceCounter);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement || mapInstanceRef.current || mapElement._leaflet_id) return;

    const map = L.map(mapElement, {
      center: userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [DEFAULTS.MAP_CENTER.lat, DEFAULTS.MAP_CENTER.lng],
      zoom: DEFAULTS.MAP_ZOOM,
      minZoom: DEFAULTS.MAP_MIN_ZOOM,
      maxZoom: DEFAULTS.MAP_MAX_ZOOM,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });

    addOsmTileLayer(map);

    let userMarker = null;
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            background: #9BCEC1;
            color: #0E2C24;
            border: 3px solid #0E2C24;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(14, 44, 36, 0.3);
          ">📍</div>
        `,
        className: 'custom-user-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px; background: #FFECE8; border-radius: 12px; font-family: sans-serif;">
            <div style="font-size: 18px; margin-bottom: 4px;">📍</div>
            <div style="font-weight: bold; color: #2D1E12; margin-bottom: 2px;">Konumunuz</div>
            <div style="font-size: 12px; color: #70372D; font-weight: 500;">${userLocation.fullAddress || 'Seçilen konum'}</div>
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
      if (!mapInstance) return;
      const { map, userMarker, markers } = mapInstance;
      try {
        if (markers) markers.forEach((m) => map.removeLayer(m));
        if (userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker);
        map.off();
        if (typeof map.remove === 'function') map.remove();
        if (mapElement._leaflet_id) delete mapElement._leaflet_id;
      } catch (error) {
        console.warn('Map cleanup error:', error);
      } finally {
        mapInstanceRef.current = null;
      }
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
            width: 44px; height: 44px;
            background: #FFECE8;
            border: 3px solid ${isHidden ? '#F7A898' : '#9BCEC1'};
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            opacity: ${isHidden ? '0.5' : '1'};
            transform: ${isHidden ? 'scale(0.85)' : 'scale(1)'};
            transition: all 0.2s ease; cursor: pointer;
          ">
            ${marketLogo ? `<img src="${marketLogo}" alt="${brandName}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px;"
              onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\"color: #4A1E17; font-size: 18px; font-weight: bold;\\">🏪</div>';">`
            : `<div style="color: #4A1E17; font-size: 18px; font-weight: bold;">🏪</div>`}
          </div>
        `,
        className: 'custom-market-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
      });

      const marker = L.marker([market.latitude, market.longitude], { icon, opacity: isHidden ? 0.6 : 1.0 }).addTo(map);

      const brandLogo = marketLogo ? `<img src="${marketLogo}" alt="${brandName}" style="width: 36px; height: 36px; object-fit: contain; margin-bottom: 6px; border-radius: 6px;">` : '';

      marker.bindPopup(`
        <div style="text-align: center; min-width: 200px; padding: 10px; background: #FFEBD3; border-radius: 14px; font-family: sans-serif;">
          ${brandLogo}
          <div style="font-weight: 800; font-size: 15px; margin-bottom: 2px; color: #2D1E12;">${brandName.toUpperCase()}</div>
          <div style="margin-bottom: 4px; font-size: 13px; color: #4A1E17; font-weight: 600;">${market.name}</div>
          <div style="margin-bottom: 8px; font-size: 11px; color: #70372D; line-height: 1.3;">${market.address}</div>
          <div style="
            background: #9BCEC1;
            color: #0E2C24; padding: 5px 12px; border-radius: 12px;
            font-weight: bold; font-size: 11px; display: inline-block;
            margin-bottom: 6px; shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">📍 ${market.distance} km uzaklıkta</div>
          ${isHidden ? '<div style="margin-top: 6px; font-size: 10px; color: #4A1E17; font-weight: 700; background: #FFB6A6; padding: 3px 8px; border-radius: 10px; display: inline-block;">❌ Filtrelenmiş</div>'
          : '<div style="margin-top: 6px; font-size: 10px; color: #0E2C24; font-weight: 700; background: #9BCEC1; padding: 3px 8px; border-radius: 10px; display: inline-block;">✅ Seçilmiş</div>'}
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
      style={{ height: '400px', width: '100%', borderRadius: '16px', border: '1px solid #F7A898' }}
      data-map-instance={instanceId.current}
    />
  );
};

const MarketMap = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center bg-[#FFECE8] border border-[#F7A898] rounded-2xl" style={{ height: '400px', width: '100%' }}>
        <div className="text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm font-bold text-[#70372D]">Harita yükleniyor...</div>
        </div>
      </div>
    );
  }

  return <MapWrapper {...props} />;
};

export default MarketMap;
