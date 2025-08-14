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

// Helper functions for multi-store routing
function getMarkerColor(index) {
  const colors = ['#ff4757', '#2ed573', '#ffa502', '#3742fa', '#f1c40f', '#e67e22'];
  return colors[index % colors.length];
}

function createCustomIcon(color, number) {
  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${number}</div>`,
    iconSize: [30, 30],
    className: 'custom-div-icon'
  });
}

const MapWrapper = ({ 
  center, 
  selectedStore, 
  destinations = [],
  showRoute = false,
  onRouteFound,
  onMultiRouteFound, // Multi-destination routing için callback
  searchSettings 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const instanceId = useRef(++mapInstanceCounter);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !searchSettings || 
        typeof searchSettings.latitude === 'undefined' || typeof searchSettings.longitude === 'undefined') {
      return;
    }

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
      attribution: '',
      maxZoom: 19
    }).addTo(map);

    // User marker icon
    const userIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Store marker icon
    const storeIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const userMarker = L.marker([searchSettings.latitude, searchSettings.longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>📍 Konumunuz</strong>');

    // Initialize routing controls
    let routingControl = null;
    let singleRouting = null;

    // Add destinations markers if provided (multi-store mode)
    let destinationMarkers = [];
    if (destinations && Array.isArray(destinations) && destinations.length > 0 && showRoute) {
      destinations.forEach((destination, index) => {
        if (!destination || typeof destination.latitude === 'undefined' || typeof destination.longitude === 'undefined') {
          console.warn('Invalid destination data:', destination);
          return;
        }
        
        const markerColor = getMarkerColor(index);
        const destinationIcon = createCustomIcon(markerColor, index + 1);
        
        const marker = L.marker([destination.latitude, destination.longitude], { 
          icon: destinationIcon 
        })
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>🏪 ${destination.name || 'Mağaza'}</strong><br/>
              <span>${(destination.market || '').toUpperCase()}</span><br/>
              <span>Durak ${index + 1}</span>
            </div>
          `);
        
        destinationMarkers.push(marker);
      });
      
      // Multi-destination routing
      if (showRoute && destinations && destinations.length > 0 && window.L && window.L.Routing) {
      try {
        if (map && map._leaflet_id) { // Ensure map is still valid
          // Console'a konumları yazdır
          console.log('🏠 Benim Konumum:', {
            latitude: searchSettings.latitude,
            longitude: searchSettings.longitude
          });
          
          console.log('🏪 Seçilen Marketler:');
          destinations.forEach((dest, index) => {
            console.log(`${index + 1}. ${dest.name} (${dest.market}):`, {
              latitude: dest.latitude,
              longitude: dest.longitude
            });
          });

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
              styles: [{ color: '#3388ff', weight: 4, opacity: 0.7 }]
            },
            show: false,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
          });

          // Add event listeners
          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            if (routes && routes.length > 0) {
              const route = routes[0];
              const distance = (route.summary.totalDistance / 1000); // Convert to km
              const time = Math.round(route.summary.totalTime / 60); // Convert to minutes
              
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

          // Fit bounds to show all markers
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

    if (selectedStore && selectedStore.latitude && selectedStore.longitude && window.L && window.L.Routing) {
      try {
        if (map && map._leaflet_id) { // Ensure map is still valid
          // Console'a tek mağaza konumunu yazdır
          console.log('🏠 Benim Konumum (Tek Mağaza):', {
            latitude: searchSettings.latitude,
            longitude: searchSettings.longitude
          });
          
          console.log('🏪 Seçilen Mağaza:', {
            name: selectedStore.depotName,
            market: selectedStore.marketAdi,
            latitude: selectedStore.latitude,
            longitude: selectedStore.longitude,
            price: selectedStore.price
          });

          singleRouting = L.Routing.control({
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
          // Clean up routing controls with better error handling
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
          
          // Clean up destination markers
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
          
          const mapElement = document.getElementById(mapId);
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
