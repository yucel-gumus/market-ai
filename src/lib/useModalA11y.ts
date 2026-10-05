'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Diyalog pencereleri için klavye davranışı: açılışta odak içeri taşınır, Tab dolaşımı
 * pencere içinde kalır, Escape kapatır ve kapanışta odak açan öğeye geri döner.
 * Kapsayıcıya `tabIndex={-1}` vermek gerekir (hiç odaklanabilir öğe yoksa kapsayıcı odaklanır).
 */
export function useModalA11y<T extends HTMLElement>(isOpen: boolean, onClose?: (() => void) | null) {
  const containerRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  // onClose'u ref üzerinden okuyoruz: aksi halde üst bileşen her render olduğunda
  // (ör. rota verisi geldiğinde) effect yeniden kurulur, odak pencere içinde bir
  // öğeye geri atlar ve kullanıcının Tab ile geldiği yeri kaybederiz.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const node = containerRef.current;
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;

    // Odak pencereye taşınmazsa klavye kullanıcısı arka plandaki düğmede kalır.
    const firstFocusable = node?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? node)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!onCloseRef.current) return;
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );
      if (!items.length) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !node.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
