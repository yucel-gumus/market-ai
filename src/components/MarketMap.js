'use client';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULTS } from '@/constants';
import { addOsmTileLayer, ensureLeafletDefaultIcons } from '@/lib/leafletSetup';
import { getMarketLogo, getStoreTheme, marketKey } from '@/lib/marketUtils';

let mapInstanceCounter = 0;

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

if (typeof window !== 'undefined') {
  ensureLeafletDefaultIcons();
}

const MapWrapper = ({ userLocation, markets, hiddenMarkets = new Set(), onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
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
            background: #253341;
            color: #F5F9F5;
            border: 3px solid #EC7D55;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(37, 51, 65, 0.35);
          ">📍</div>
        `,
        className: 'custom-user-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px; background: #DCE3EA; border-radius: 12px; font-family: sans-serif;">
            <div style="font-size: 16px; margin-bottom: 4px;">📍</div>
            <div style="font-weight: bold; color: #253341; margin-bottom: 2px;">Konumunuz</div>
            <div style="font-size: 12px; color: #3E5164; font-weight: 500;">${escapeHtml(userLocation.fullAddress || 'Seçilen konum')}</div>
          </div>
        `);
    }

    mapInstanceRef.current = {
      map,
      userMarker,
      markers: new Map(),
      lastMarketSetSignature: null,
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

    const activeKeys = new Set();
    markets.forEach((market) => {
      if (market.latitude && market.longitude) {
        activeKeys.add(marketKey(market));
      }
    });

    for (const [key, existingMarker] of markers.entries()) {
      if (!activeKeys.has(key)) {
        if (map.hasLayer(existingMarker)) map.removeLayer(existingMarker);
        markers.delete(key);
      }
    }

    markets.forEach((market) => {
      if (!market.latitude || !market.longitude) return;

      const marketKeyValue = marketKey(market);
      const isHidden = hiddenMarkets.has(marketKeyValue);
      const theme = getStoreTheme(market.brand || market.name);
      const rawLogo =
        typeof market.logo === 'string' &&
        (market.logo.startsWith('https://marketfiyati.org.tr/') ||
          market.logo.startsWith('https://cdn.marketfiyati.org.tr/'))
          ? market.logo
          : getMarketLogo(market.brand || market.name);

      const pinBg = rawLogo ? (isHidden ? '#DCE3EA' : '#F5F9F5') : (isHidden ? '#DCE3EA' : theme.bg);
      const pinColor = rawLogo ? '#253341' : (isHidden ? '#3E5164' : theme.text);
      const pinBorder = isHidden
        ? '#BCC7D2'
        : rawLogo
          ? '#3E5164'
          : (theme.border === theme.bg ? '#EC7D55' : theme.border);
      const pinContent = rawLogo
        ? `<img src="${escapeHtml(rawLogo)}" alt="${escapeHtml(theme.label)}" width="28" height="28" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" /><span style="display: none;">${escapeHtml(theme.shortCode)}</span>`
        : escapeHtml(theme.shortCode);

      const icon = L.divIcon({
        html: `
          <div style="
            width: 44px; height: 44px;
            background: ${pinBg};
            color: ${pinColor};
            border: 3px solid ${pinBorder};
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 10px rgba(37, 51, 65, 0.22);
            opacity: ${isHidden ? '0.6' : '1'};
            transform: ${isHidden ? 'scale(0.85)' : 'scale(1)'};
            font-size: 11px; font-weight: 800; letter-spacing: -0.02em;
            transition: all 0.2s ease; cursor: pointer;
          ">
            ${pinContent}
          </div>
        `,
        className: 'custom-market-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
      });

      const popupBrandHtml = rawLogo
        ? `<div style="display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border-radius: 10px; background: #F5F9F5; border: 1px solid #BCC7D2; margin-bottom: 6px;"><img src="${escapeHtml(rawLogo)}" alt="${escapeHtml(theme.label)}" width="56" height="24" style="width: 56px; height: 24px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" /><span style="display: none; color: #253341; font-weight: 800; font-size: 12px;">${escapeHtml(theme.label)}</span></div>`
        : `<div style="display: inline-block; padding: 4px 10px; border-radius: 10px; background: ${theme.bg}; color: ${theme.text}; border: 1px solid ${theme.border}; font-weight: 800; font-size: 12px; margin-bottom: 6px;">${escapeHtml(theme.label)}</div>`;

      const popupHtml = `
        <div style="text-align: center; min-width: 200px; padding: 10px; background: #EDF3EE; border-radius: 14px; font-family: sans-serif;">
          ${popupBrandHtml}
          <div style="margin-bottom: 4px; font-size: 13px; color: #253341; font-weight: 700;">${escapeHtml(market.name)}</div>
          <div style="margin-bottom: 8px; font-size: 11px; color: #3E5164; line-height: 1.3;">${escapeHtml(market.address)}</div>
          <div style="
            background: #DBE6DD; border: 1px solid #BCC7D2;
            color: #253341; padding: 5px 12px; border-radius: 12px;
            font-weight: bold; font-size: 11px; display: inline-block;
            margin-bottom: 6px; box-shadow: 0 2px 4px rgba(37, 51, 65, 0.12);
          ">📍 ${escapeHtml(market.distance)} km uzaklıkta</div>
          ${isHidden ? '<div style="margin-top: 6px; font-size: 10px; color: #253341; font-weight: 700; background: #F2A488; padding: 3px 8px; border-radius: 10px; display: inline-block;">Filtrelenmiş</div>'
          : '<div style="margin-top: 6px; font-size: 10px; color: #253341; font-weight: 700; background: #EC7D55; padding: 3px 8px; border-radius: 10px; display: inline-block;">Seçilmiş</div>'}
        </div>
      `;

      const existing = markers.get(marketKeyValue);
      if (existing) {
        existing._marketData = market;
        existing.setLatLng([market.latitude, market.longitude]);
        existing.setIcon(icon);
        existing.setOpacity(isHidden ? 0.6 : 1.0);
        existing.setPopupContent(popupHtml);
      } else {
        const marker = L.marker([market.latitude, market.longitude], { icon, opacity: isHidden ? 0.6 : 1.0 }).addTo(map);
        marker._marketData = market;
        marker.bindPopup(popupHtml);
        marker.on('click', () => onMarkerClickRef.current?.(marker._marketData));
        markers.set(marketKeyValue, marker);
      }
    });

    const marketSetSignature = [...activeKeys].join('|');
    if (mapInstanceRef.current.lastMarketSetSignature !== marketSetSignature) {
      const visibleMarkers = [];
      if (userLocation) visibleMarkers.push([userLocation.latitude, userLocation.longitude]);
      markets.forEach(market => {
        if (market.latitude && market.longitude) {
          const key = marketKey(market);
          if (!hiddenMarkets.has(key)) visibleMarkers.push([market.latitude, market.longitude]);
        }
      });
      if (visibleMarkers.length > 1) {
        try {
          map.fitBounds(L.latLngBounds(visibleMarkers).pad(0.1));
        } catch (error) { console.warn('Error fitting bounds:', error); }
      }
      mapInstanceRef.current.lastMarketSetSignature = marketSetSignature;
    }

  }, [markets, hiddenMarkets, userLocation]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '400px', width: '100%', borderRadius: '16px', border: '1px solid #BCC7D2' }}
      data-map-instance={instanceId.current}
    />
  );
};

const MarketMap = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center bg-[#EDF3EE] border border-[#BCC7D2] rounded-2xl" style={{ height: '400px', width: '100%' }}>
        <div className="text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm font-bold text-[#3E5164]">Harita yükleniyor...</div>
        </div>
      </div>
    );
  }

  return <MapWrapper {...props} />;
};

export default MarketMap;
