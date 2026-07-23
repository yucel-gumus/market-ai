import L from 'leaflet';
import { getMarketLogo } from '@/lib/marketUtils';

const ROUTE_COLORS = ['#ff4757', '#2ed573', '#ffa502', '#3742fa', '#f1c40f', '#e67e22'];

export function getRouteMarkerColor(index) {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export function createNumberedMarketIcon(color, number, marketName = '') {
  const marketLogo = getMarketLogo(marketName);

  return L.divIcon({
    html: marketLogo
      ? `<div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        ">
          <img src="${marketLogo}" alt="" width="18" height="18" style="border-radius:50%;object-fit:contain;background:white;" />
          <span style="position:absolute;bottom:-4px;right:-4px;background:#111;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;border:1px solid white;">${number}</span>
        </div>`
      : `<div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 13px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${number}</div>`,
    className: 'custom-route-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

export function createUserLocationIcon() {
  return L.divIcon({
    html: `
      <div style="
        width: 50px; height: 50px;
        background: linear-gradient(45deg, #3B82F6, #1E40AF);
        border: 3px solid white; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); position: relative;
      ">
        <div style="color: white; font-size: 20px; font-weight: bold;" aria-hidden="true">📍</div>
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
    popupAnchor: [0, -25],
  });
}

export function injectMapMarkerStyles() {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector('style[data-market-map]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-market-map', 'true');
  style.textContent = `
    .custom-market-marker, .custom-user-marker, .custom-route-marker {
      background: transparent !important;
      border: none !important;
    }
    .custom-market-marker:hover div,
    .custom-user-marker:hover div {
      transform: scale(1.1) !important;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
