'use client';
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

let mapInstanceCounter = 0;

if (typeof window !== 'undefined') {
  import('leaflet-routing-machine');
}

if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const MapWrapper = ({ 
  center, 
  selectedStore, 
  onRouteFound,
  searchSettings 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const instanceId = useRef(++mapInstanceCounter);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapElement = mapRef.current;
    if (!mapElement || mapElement._leaflet_id) {
      return; 
    }

    const map = L.map(mapElement, {
      center: center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const userIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const storeIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const userMarker = L.marker([searchSettings.latitude, searchSettings.longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>📍 Konumunuz</strong>');

    let storeMarker = null;
    if (selectedStore.latitude && selectedStore.longitude) {
      storeMarker = L.marker([selectedStore.latitude, selectedStore.longitude], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>🏪 ${selectedStore.depotName}</strong><br/>
            <span>${selectedStore.marketAdi?.toUpperCase()}</span><br/>
            <span>💰 ${selectedStore.price} ₺</span>
          </div>
        `);
    }

    let routingControl = null;
    if (selectedStore.latitude && selectedStore.longitude && window.L && window.L.Routing) {
      try {
        routingControl = L.Routing.control({
          waypoints: [
            L.latLng(searchSettings.latitude, searchSettings.longitude),
            L.latLng(selectedStore.latitude, selectedStore.longitude)
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null,
          lineOptions: {
            styles: [{ color: '#3388ff', weight: 4, opacity: 0.7 }]
          },
          show: false,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          })
        }).addTo(map);

        routingControl.on('routesfound', function(e) {
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

        routingControl.on('routingerror', function() {
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
      } catch (error) {
        console.warn('Routing control error:', error);
      }
    }

    mapInstanceRef.current = {
      map,
      userMarker,
      storeMarker,
      routingControl
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
        const { map, routingControl, userMarker, storeMarker } = mapInstanceRef.current;
        
        try {
          if (routingControl) {
            routingControl.off();
            if (map.hasLayer && map.hasLayer(routingControl)) {
              map.removeControl(routingControl);
            }
          }
          
          if (userMarker && map.hasLayer && map.hasLayer(userMarker)) {
            map.removeLayer(userMarker);
          }
          if (storeMarker && map.hasLayer && map.hasLayer(storeMarker)) {
            map.removeLayer(storeMarker);
          }
          
          map.off();
          
          if (map && typeof map.remove === 'function') {
            map.remove();
          }
          
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
  }, [center, selectedStore?.depotName, selectedStore?.latitude, selectedStore?.longitude, selectedStore?.marketAdi, selectedStore?.price, searchSettings.latitude, searchSettings.longitude, onRouteFound]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '400px', width: '100%' }}
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
    return <div className="map-loading">🗺️ Harita yükleniyor...</div>;
  }

  return <MapWrapper {...props} />;
};

export default DynamicMap;
