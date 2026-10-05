'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

let demoWarningShown = false;

/**
 * OSRM'in herkese açık demo sunucusu üretim için değildir (kullanım politikası sınırlı ve
 * zaman zaman erişilemez). Kendi örneğinizi veya ücretli bir yönlendirme servisini
 * NEXT_PUBLIC_OSRM_BASE_URL ile bağlayana kadar durumu gizlemiyoruz.
 */
function warnIfDemoServer() {
  if (!LEAFLET.OSRM_SERVICE.includes('//router.project-osrm.org') || demoWarningShown) return;
  demoWarningShown = true;
  console.warn('[rota] OSRM demo sunucusu kullanılıyor. Üretim için NEXT_PUBLIC_OSRM_BASE_URL ile kendi OSRM örneğinizi veya ücretli bir servisi bağlayın.');
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
    const controller = new AbortController();
    setError(null);

    try {
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
      const layers = [start, ...markers];
      if (markers.length) map.fitBounds(L.featureGroup(layers).getBounds().pad(0.15));
      if (validStops.length !== stops.length) { setError('Bazı şubelerin konumu doğrulanamadı.'); return; }
      if (!showRoute || !validStops.length) return;

      // Özet ve durak başına değerler TEK kaynaktan gelir: haritanın çizdiği rota ile
      // durak satırları aynı OSRM yanıtından beslenir. Ayrı bir yönlendirme kütüphanesi
      // kullanılmıyor (ikinci bir istek ve tutarsız bacak verisi üretmiyordu).
      warnIfDemoServer();
      const ordered = [L.latLng(latitude, longitude), ...validStops.map(stop => L.latLng(stop.latitude, stop.longitude))];
      const coords = ordered.map(point => `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`).join(';');
      fetch(`${LEAFLET.OSRM_SERVICE}/driving/${coords}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal })
        .then(response => response.json())
        .then(data => {
          if (disposed) return;
          const route = data?.routes?.[0];
          if (!route) throw new Error('Rota döndürülmedi.');
          if (route.geometry) {
            layers.push(L.geoJSON(route.geometry, { style: { color: '#0E2C24', weight: 5, opacity: 0.85 } }).addTo(map));
            map.fitBounds(L.featureGroup(layers).getBounds().pad(0.15));
          }
          const distance = route.distance / 1000;
          const time = route.duration / 60;
          const legs = (route.legs || []).map(leg => ({ distance: leg.distance / 1000, time: leg.duration / 60 }));
          if (store) {
            callbacks.current.onRouteFound?.({ distance: distance.toFixed(1), time: Math.round(time), timeText: `${Math.round(time)} dakika`, routeType: 'Arabayla' });
            return;
          }
          callbacks.current.onMultiRouteFound?.({ distance, time, legs: legs.length ? legs : undefined });
        })
        .catch(() => {
          if (disposed) return;
          // Sessizce yanlış süre göstermektense: özet yok, durak satırlarında tahmin gösterilmez.
          setError('Araç rotası alınamadı. Durak konumları haritada gösteriliyor.');
          if (store) callbacks.current.onRouteFound?.({ distance: '—', time: '—', timeText: 'Hesaplanamadı', routeType: 'Arabayla', error: 'Rota alınamadı' });
        });
    } catch {
      setError('Harita veya rota servisi yüklenemedi.');
    }

    return () => { disposed = true; controller.abort(); map?.remove(); };
  }, [latitude, longitude, destinationKey, storeKey, showRoute]);

  return <div className="relative h-full min-h-[380px] w-full">
    <div ref={container} className="h-full min-h-[380px] w-full" aria-label="Alışveriş durakları haritası" />
    {error && <p role="status" className="absolute bottom-7 left-2 right-2 z-[1000] rounded-lg bg-[#FFEBD3] p-2 text-xs">{error}</p>}
  </div>;
}
