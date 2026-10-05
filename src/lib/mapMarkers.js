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
