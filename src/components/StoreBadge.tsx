'use client';

import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoreTheme } from '@/lib/marketUtils';

interface StoreBadgeProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StoreBadgeProps['size']>, string> = {
  xs: 'px-2 py-0.5 text-[11px] gap-1 rounded-lg',
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
  md: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl min-w-[4.25rem] justify-center',
};

const ICON_SIZES: Record<NonNullable<StoreBadgeProps['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-3.5 w-3.5',
};

/**
 * Renders a store brand badge strictly within the İpek Küllü Arduvaz 10-hex scale
 * using brand name text, store icon, and deterministic shade differentiation.
 */
export function StoreBadge({
  name,
  size = 'sm',
  showIcon = true,
  className,
}: StoreBadgeProps) {
  const theme = getStoreTheme(name);

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold font-heading tracking-tight border shadow-2xs shrink-0 whitespace-nowrap',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        borderColor: theme.border,
      }}
    >
      {showIcon && <Store className={cn(ICON_SIZES[size], 'shrink-0')} aria-hidden />}
      <span>{theme.label}</span>
    </span>
  );
}
