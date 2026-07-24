'use client';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { DEFAULTS, LEAFLET } from '@/constants';
import { addOsmTileLayer, ensureLeafletDefaultIcons } from '@/lib/leafletSetup';
import { getMarketLogo } from '@/lib/utils';

let mapInstanceCounter = 0;

if (typeof window !== 'undefined') {
  import('leaflet-routing-machine');
  ensureLeafletDefaultIcons();
}

function getMarkerColor() {
  return '#9BCEC1';
}

function createCustomIcon(color, number, marketName = '') {
  const marketLogo = getMarketLogo(marketName);
  
  return L.divIcon({
    html: marketLogo 
      ? `<div style="
          background-color: #FFECE8; 
          color: #0E2C24; 
          border-radius: 50%; 
          width: 36px; 
          height: 36px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 10px; 
          border: 3px solid #9BCEC1; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            background-color: #9BCEC1;
            color: #0E2C24;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #0E2C24;
          ">${number}</div>
          <img src="${marketLogo}" 
               alt="${marketName}" 
               style="width: 22px; height: 22px; object-fit: contain; border-radius: 50%;" />
        </div>`
      : `<div style="
          background-color: #9BCEC1; 
          color: #0E2C24; 
          border-radius: 50%; 
          width: 36px; 
          height: 36px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 14px; 
          border: 2px solid #0E2C24; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        ">${number}</div>`,
    iconSize: [36, 36],
    className: 'custom-div-icon'
  });
}

const MapWrapper = ({ 
  center, 
  selectedStore, 
  destinations = [],
  showRoute = false,
  onRouteFound,
  onMultiRouteFound, 
  searchSettings 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const instanceId = useRef(++mapInstanceCounter);
  const mapId = useRef(`map-${instanceId.current}`);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !searchSettings || 
        typeof searchSettings.latitude === 'undefined' || typeof searchSettings.longitude === 'undefined') {
      return;
    }

    const mapElement = mapRef.current;
    if (!mapElement || mapElement._leaflet_id) {
      return; 
    }

    mapElement.id = mapId.current;

    const map = L.map(mapElement, {
      center: center,
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

    const userIcon = L.divIcon({
      html: `<div style="
        background-color: #9BCEC1; 
        color: #0E2C24; 
        border-radius: 50%; 
        width: 34px; 
        height: 34px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 16px; 
        border: 3px solid #0E2C24; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      ">📍</div>`,
      iconSize: [34, 34],
      className: 'user-location-marker'
    });

    const storeIcon = L.divIcon({
      html: `<div style="
        background-color: #FFB6A6; 
        color: #4A1E17; 
        border-radius: 50%; 
        width: 34px; 
        height: 34px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 16px; 
        border: 3px solid #4A1E17; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      ">🏪</div>`,
      iconSize: [34, 34],
      className: 'store-location-marker'
    });

    const userMarker = L.marker([searchSettings.latitude, searchSettings.longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 6px; font-family: sans-serif;">
          <strong style="color: #2D1E12;">📍 Konumunuz</strong><br/>
          <span style="color: #0E2C24; font-weight: 600; font-size: 12px;">Başlangıç Noktası</span>
        </div>
      `);

    let routingControl = null;
    let singleRouting = null;

    let destinationMarkers = [];
    if (destinations && Array.isArray(destinations) && destinations.length > 0 && showRoute) {
      destinations.forEach((destination, index) => {
        if (!destination || typeof destination.latitude === 'undefined' || typeof destination.longitude === 'undefined') {
          return;
        }
        
        const markerColor = getMarkerColor();
        const destinationIcon = createCustomIcon(markerColor, index + 1, destination.market || '');
        
        const marker = L.marker([destination.latitude, destination.longitude], { 
          icon: destinationIcon 
        })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 6px; font-family: sans-serif;">
              <strong style="color: #2D1E12;">🏪 ${destination.name || 'Mağaza'}</strong><br/>
              <span style="color: #4A1E17; font-weight: 600;">${(destination.market || '').toUpperCase()}</span><br/>
              <span style="color: #0E2C24; font-size: 11px;">Durak ${index + 1}</span>
            </div>
          `);
        
        destinationMarkers.push(marker);
      });
      
      if (showRoute && destinations && destinations.length > 0 && window.L && window.L.Routing) {
      try {
        if (map && map._leaflet_id) { 
          
          const waypoints = [
            L.latLng(searchSettings.latitude, searchSettings.longitude),
            ...destinations.map(dest => L.latLng(dest.latitude, dest.longitude))
          ];

          routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: () => null,
            lineOptions: {
              styles: [{ color: '#9BCEC1', weight: 5, opacity: 0.9 }]
            },
            show: false,
            router: L.Routing.osrmv1({
              serviceUrl: LEAFLET.OSRM_SERVICE
            })
          });

          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            if (routes && routes.length > 0) {
              const route = routes[0];
              const distance = (route.summary.totalDistance / 1000); 
              const time = Math.round(route.summary.totalTime / 60);
              
              if (onMultiRouteFound) {
                onMultiRouteFound({
                  distance: distance,
                  time: time,
                  totalDistance: distance,
                  totalTime: time
                });
              }
            }
          });

          routingControl.on('routingerror', function(e) {
            console.warn('Routing error:', e);
          });

          if (map && map._leaflet_id && typeof routingControl.addTo === 'function') {
            routingControl.addTo(map);
          }

          const group = new L.featureGroup([userMarker, ...destinationMarkers]);
          if (group.getBounds().isValid()) {
            map.fitBounds(group.getBounds().pad(0.1));
          }
        }
      } catch (error) {
        console.warn('Multi-route error:', error);
        routingControl = null;
      }
    }
    }

    let storeMarker = null;
    if (selectedStore && selectedStore.latitude && selectedStore.longitude) {
      const marketLogo = getMarketLogo(selectedStore.marketAdi || '');
      
      const storeIconWithLogo = L.divIcon({
        html: marketLogo 
          ? `<div style="
              background-color: #FFB6A6; 
              color: #4A1E17; 
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              font-size: 12px; 
              border: 3px solid #4A1E17; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              position: relative;
            ">
              <img src="${marketLogo}" 
                   alt="${selectedStore.marketAdi}" 
                   style="width: 24px; height: 24px; object-fit: contain; border-radius: 50%;" />
            </div>`
          : `<div style="
              background-color: #FFB6A6; 
              color: #4A1E17; 
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              font-size: 16px; 
              border: 3px solid #4A1E17; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            ">🏪</div>`,
        iconSize: [40, 40],
        className: 'store-location-marker-with-logo'
      });
      
      storeMarker = L.marker([selectedStore.latitude, selectedStore.longitude], { icon: storeIconWithLogo })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; font-family: sans-serif; padding: 6px;">
            <strong style="color: #2D1E12;">🏪 ${selectedStore.depotName}</strong><br/>
            <span style="color: #4A1E17; font-weight: 700;">${selectedStore.marketAdi?.toUpperCase()}</span><br/>
            <span style="color: #0E2C24; font-weight: 700; background: #9BCEC1; padding: 2px 8px; border-radius: 8px; display: inline-block; margin-top: 4px;">💰 ${selectedStore.price} ₺</span>
          </div>
        `);
    }

    if (selectedStore && selectedStore.latitude && selectedStore.longitude && window.L && window.L.Routing) {
      try {
        if (map && map._leaflet_id) { 

          singleRouting = L.Routing.control({
            waypoints: [
              L.latLng(searchSettings.latitude, searchSettings.longitude),
              L.latLng(selectedStore.latitude, selectedStore.longitude)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: () => null,
            lineOptions: {
              styles: [{ color: '#9BCEC1', weight: 5, opacity: 0.9 }]
            },
            show: false,
            router: L.Routing.osrmv1({
              serviceUrl: LEAFLET.OSRM_SERVICE
            })
          });

          singleRouting.on('routesfound', function(e) {
            const routes = e.routes;
            if (routes && routes.length > 0) {
              const route = routes[0];
              const distance = (route.summary.totalDistance / 1000).toFixed(1);
              const time = Math.round(route.summary.totalTime / 60);
              
              if (onRouteFound) {
                onRouteFound({
                  distance: distance,
                  time: time,
                  timeText: `${time} dakika`,
                  routeType: 'Arabayla'
                });
              }
            }
          });

          singleRouting.on('routingerror', function() {
            if (onRouteFound) {
              onRouteFound({
                distance: 'N/A',
                time: 'N/A',
                timeText: 'Hesaplanamadı',
                routeType: 'Arabayla',
                error: 'Rota hesaplanamadı'
              });
            }
          });

          if (map && map._leaflet_id && typeof singleRouting.addTo === 'function') {
            singleRouting.addTo(map);
          }
        }
      } catch (error) {
        console.warn('Routing control error:', error);
        singleRouting = null;
      }
    }

    mapInstanceRef.current = {
      map,
      userMarker,
      storeMarker,
      destinationMarkers,
      routingControl,
      singleRouting
    };

    map.on('error', function(e) {
      console.warn('Map error:', e);
    });

    setTimeout(() => {
      if (map && mapInstanceRef.current) {
        try {
          map.invalidateSize();
        } catch (error) {
          console.warn('Map invalidateSize error:', error);
        }
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        const { map, routingControl, singleRouting, userMarker, storeMarker, destinationMarkers } = mapInstanceRef.current;
        
        try {
          if (routingControl && map && map._leaflet_id) {
            try {
              routingControl.off();
              if (map.hasLayer && map.hasLayer(routingControl)) {
                map.removeControl(routingControl);
              }
            } catch (err) {
              console.warn('Error removing routing control:', err);
            }
          }

          if (singleRouting && map && map._leaflet_id) {
            try {
              singleRouting.off();
              if (map.hasLayer && map.hasLayer(singleRouting)) {
                map.removeControl(singleRouting);
              }
            } catch (err) {
              console.warn('Error removing single routing:', err);
            }
          }
          
          if (userMarker && map && map.hasLayer && map.hasLayer(userMarker)) {
            map.removeLayer(userMarker);
          }
          if (storeMarker && map && map.hasLayer && map.hasLayer(storeMarker)) {
            map.removeLayer(storeMarker);
          }
          
          if (destinationMarkers && Array.isArray(destinationMarkers)) {
            destinationMarkers.forEach(marker => {
              if (marker && map && map.hasLayer && map.hasLayer(marker)) {
                map.removeLayer(marker);
              }
            });
          }
          
          if (map && map._leaflet_id) {
            map.off();
            
            if (typeof map.remove === 'function') {
              map.remove();
            }
          }
          
          const mapElement = document.getElementById(mapId.current);
          if (mapElement && mapElement._leaflet_id) {
            delete mapElement._leaflet_id;
          }
          
        } catch (error) {
          console.warn('Map cleanup error:', error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
    };
  }, [center, selectedStore?.depotName, selectedStore?.latitude, selectedStore?.longitude, selectedStore?.marketAdi, selectedStore?.price, searchSettings?.latitude, searchSettings?.longitude, onRouteFound, onMultiRouteFound, destinations, showRoute]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '400px', width: '100%', borderRadius: '16px', border: '1px solid #F7A898' }}
      data-map-instance={instanceId.current}
    />
  );
};

const DynamicMap = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8 text-center text-sm font-bold text-[#70372D] bg-[#FFECE8] border border-[#F7A898] rounded-2xl">🗺️ Harita yükleniyor...</div>;
  }

  return <MapWrapper {...props} />;
};

export default DynamicMap;
