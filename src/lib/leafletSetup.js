import L from 'leaflet';
import { DEFAULTS, LEAFLET } from '@/constants';

let iconsConfigured = false;

/** Leaflet varsayılan marker ikonlarını bir kez yapılandır */
export function ensureLeafletDefaultIcons() {
  if (typeof window === 'undefined' || iconsConfigured) return;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: LEAFLET.ICON_RETINA,
    iconUrl: LEAFLET.ICON,
    shadowUrl: LEAFLET.SHADOW,
  });
  iconsConfigured = true;
}

/**
 * OpenStreetMap tile layer ekler.
 * @param {import('leaflet').Map} map
 * @param {Record<string, unknown>} [options]
 */
export function addOsmTileLayer(map, options = {}) {
  return L.tileLayer(LEAFLET.TILE_URL, {
    attribution: '',
    maxZoom: DEFAULTS.TILE_MAX_ZOOM,
    ...options,
  }).addTo(map);
}
