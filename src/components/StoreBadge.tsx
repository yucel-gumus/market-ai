'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarketLogo, getStoreTheme } from '@/lib/marketUtils';

interface StoreBadgeProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md';
  lowPriority?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StoreBadgeProps['size']>, string> = {
  xs: 'px-2 py-0.5 text-[11px] gap-1 rounded-lg',
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
  md: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl min-w-[4.25rem] justify-center',
};

const LOGO_BOX_CLASSES: Record<NonNullable<StoreBadgeProps['size']>, string> = {
  xs: 'h-6 w-14 p-1 rounded-lg',
  sm: 'h-8 w-16 p-1 rounded-xl',
  md: 'h-12 w-16 p-1.5 rounded-xl',
};

const ICON_SIZES: Record<NonNullable<StoreBadgeProps['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-3.5 w-3.5',
};

/**
 * Renders original store SVG logo inside an İpek Küllü Arduvaz container,
 * falling back to the 10-hex palette badge when no upstream logo exists or fails to load.
 */
export function StoreBadge({
  name,
  size = 'sm',
  lowPriority = false,
  className,
}: StoreBadgeProps) {
  const theme = getStoreTheme(name);
  const logoUrl = getMarketLogo(name);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);

  if (showLogo && logoUrl) {
    return (
      <span
        title={theme.label}
        className={cn(
          'relative inline-flex items-center justify-center shrink-0 bg-[#F5F9F5] border border-[#BCC7D2] shadow-2xs overflow-hidden',
          LOGO_BOX_CLASSES[size],
          className,
        )}
      >
        <Image
          src={logoUrl}
          alt={theme.label}
          fill
          unoptimized
          {...(lowPriority ? { fetchPriority: 'low' as const } : {})}
          onError={() => setFailedLogoUrl(logoUrl)}
          className="object-contain p-0.5"
        />
      </span>
    );
  }

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
      <Store className={cn(ICON_SIZES[size], 'shrink-0')} aria-hidden />
      <span>{theme.label}</span>
    </span>
  );
}
