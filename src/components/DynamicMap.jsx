'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { DEFAULTS, LEAFLET } from '@/constants';
import { addOsmTileLayer, ensureLeafletDefaultIcons } from '@/lib/leafletSetup';
import { coordsOf } from '@/lib/shoppingUtils';

function popup(title, detail) {
  const element = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = detail;
  element.append(heading, text);
  return element;
}

/**
 * @param {{selectedStore?: import('@/types').ProductDepotInfo | null,
 * destinations?: Array<{latitude: number, longitude: number, name?: string, market?: string}>,
 * showRoute?: boolean, onRouteFound?: (info: import('@/types').RouteInfo) => void,
 * onMultiRouteFound?: (info: {distance: number, time: number, legs?: Array<{distance: number, time: number}>}) => void,
 * searchSettings: import('@/types').SearchSettings}} props
 */
export default function DynamicMap({ selectedStore, destinations = [], showRoute = false,
  onRouteFound, onMultiRouteFound, searchSettings }) {
  const container = useRef(null);
  const callbacks = useRef({ onRouteFound, onMultiRouteFound });
  callbacks.current = { onRouteFound, onMultiRouteFound };
  const [error, setError] = useState(null);
  const latitude = searchSettings?.latitude;
  const longitude = searchSettings?.longitude;
  // Sabit değerler: fiyat/süre callback'i sonrası aynı haritayı yeniden oluşturma.
  const destinationKey = JSON.stringify(destinations.map(d => ({ latitude: d.latitude, longitude: d.longitude, name: d.name, market: d.market })));
  const storeKey = selectedStore ? JSON.stringify({ latitude: selectedStore.latitude, longitude: selectedStore.longitude,
    depotName: selectedStore.depotName, marketAdi: selectedStore.marketAdi }) : '';

  useEffect(() => {
    if (!container.current || !coordsOf({ latitude, longitude })) return;
    let disposed = false;
    let map;
    let control;
    setError(null);
    async function initialize() {
      try {
        await import('leaflet-routing-machine');
        if (disposed) return;
        ensureLeafletDefaultIcons();
        map = L.map(container.current, { center: [latitude, longitude], zoom: DEFAULTS.MAP_ZOOM });
        addOsmTileLayer(map);
        const start = L.marker([latitude, longitude]).addTo(map).bindPopup(popup('Konumunuz', 'Başlangıç noktası'));
        const store = storeKey ? JSON.parse(storeKey) : null;
        const stops = store ? [{ ...store, name: store.depotName, market: store.marketAdi }] : JSON.parse(destinationKey);
        const validStops = stops.filter(stop => coordsOf(stop));
        const markers = validStops.map((stop, index) => L.marker([stop.latitude, stop.longitude], {
          icon: L.divIcon({ html: `<div style="background:#9BCEC1;color:#0E2C24;border:2px solid #0E2C24;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold">${index + 1}</div>`, iconSize: [30, 30], className: 'shopping-stop' }),
        }).addTo(map).bindPopup(popup(stop.name || 'Mağaza', stop.market || '')));
        const bounds = L.featureGroup([start, ...markers]).getBounds();
        if (markers.length) map.fitBounds(bounds.pad(0.15));
        if (validStops.length !== stops.length) { setError('Bazı şubelerin konumu doğrulanamadı.'); return; }
        if (!showRoute || !validStops.length) return;
        control = L.Routing.control({
          waypoints: [L.latLng(latitude, longitude), ...validStops.map(stop => L.latLng(stop.latitude, stop.longitude))],
          routeWhileDragging: false, addWaypoints: false, draggableWaypoints: false, createMarker: () => null, show: false,
          lineOptions: { styles: [{ color: '#0E2C24', weight: 5, opacity: 0.85 }], extendToWaypoints: true, missingRouteTolerance: 0 },
          router: L.Routing.osrmv1({ serviceUrl: LEAFLET.OSRM_SERVICE }),
        });
        control.on('routesfound', event => {
          if (disposed || !event.routes?.length) return;
          const route = event.routes[0];
          const { totalDistance, totalTime } = route.summary;
          const distance = totalDistance / 1000;
          const time = totalTime / 60;
          if (store) {
            callbacks.current.onRouteFound?.({ distance: distance.toFixed(1), time: Math.round(time), timeText: `${Math.round(time)} dakika`, routeType: 'Arabayla' });
            return;
          }
          // Durak başına mesafe/süre özetle AYNI kaynaktan gelmeli. Kütüphanenin dönüştürdüğü
          // rotada güvenilir bacak verisi yok (waypointIndices yanıltıcı), bu yüzden bacaklar
          // doğrudan OSRM'den, haritanın kullandığı sırayla istenir. Başarısız olursa yalnızca
          // özet gösterilir; durak satırlarında tahmin gösterilmez (karışıklık olmasın).
          const ordered = [L.latLng(latitude, longitude), ...validStops.map(stop => L.latLng(stop.latitude, stop.longitude))];
          const coords = ordered.map(point => `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`).join(';');
          fetch(`${LEAFLET.OSRM_SERVICE}/driving/${coords}?overview=false&steps=false`)
            .then(response => response.json())
            .then(data => {
              if (disposed) return;
              const received = data?.routes?.[0];
              if (!received) { callbacks.current.onMultiRouteFound?.({ distance, time }); return; }
              const legs = (received.legs || []).map(leg => ({ distance: leg.distance / 1000, time: leg.duration / 60 }));
              callbacks.current.onMultiRouteFound?.({
                distance: received.distance / 1000,
                time: received.duration / 60,
                legs: legs.length ? legs : undefined,
              });
            })
            .catch(() => { if (!disposed) callbacks.current.onMultiRouteFound?.({ distance, time }); });
        });
        control.on('routingerror', () => {
          if (disposed) return;
          setError('Araç rotası alınamadı. Durak konumları haritada gösteriliyor.');
          if (store) callbacks.current.onRouteFound?.({ distance: '—', time: '—', timeText: 'Hesaplanamadı', routeType: 'Arabayla', error: 'Rota alınamadı' });
        });
        control.addTo(map);
      } catch {
        if (!disposed) setError('Harita veya rota servisi yüklenemedi.');
      }
    }
    initialize();
    return () => { disposed = true; control?.off(); map?.remove(); };
  }, [latitude, longitude, destinationKey, storeKey, showRoute]);

  return <div className="relative h-full min-h-[380px] w-full">
    <div ref={container} className="h-full min-h-[380px] w-full" aria-label="Alışveriş durakları haritası" />
    {error && <p role="status" className="absolute bottom-7 left-2 right-2 z-[1000] rounded-lg bg-[#FFEBD3] p-2 text-xs">{error}</p>}
  </div>;
}
