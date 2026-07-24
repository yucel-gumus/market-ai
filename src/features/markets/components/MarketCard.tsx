'use client';

import Image from 'next/image';
import { Navigation, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, getMarketLogo } from '@/lib/utils';
import { Market } from '@/types';
import { MarketService } from '@/services/marketService';

interface MarketCardProps {
  market: Market;
  isVisible: boolean;
  onToggleMarket: (market: Market) => void;
}

export function MarketCard({ market, isVisible, onToggleMarket }: MarketCardProps) {
  const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;
  const logoUrl = getMarketLogo(market.name);

  return (
    <Card className={cn(
      "transition-all duration-200 border-[#F7A898]/70 bg-[#FFECE8]",
      isVisible 
        ? "shadow-xs opacity-100 ring-2 ring-[#9BCEC1]/40" 
        : "opacity-60 blur-[0.5px] hover:opacity-90"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center">
            <Checkbox
              id={`market-${marketKey}`}
              checked={isVisible}
              onCheckedChange={() => onToggleMarket(market)}
            />
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* SVG Logo Rozeti — Sadece Canlı SVG Logo */}
              <div className="p-2 rounded-xl bg-[#FFEBD3] border border-[#F7A898]/60 flex items-center justify-center shrink-0 w-16 h-12 relative shadow-2xs">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={market.name}
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                ) : (
                  <Store className="h-6 w-6 text-[#0E2C24]" />
                )}
              </div>
              
              {/* Şube Adı & Mesafe */}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#2D1E12] font-heading leading-tight truncate">
                  {market.address}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <Navigation className="h-3 w-3 text-[#0E2C24] shrink-0" />
                  <span className="text-xs font-bold bg-[#9BCEC1] text-[#0E2C24] px-2 py-0.5 rounded-md shadow-2xs">
                    {MarketService.formatDistance(market.distance)}
                  </span>
                  <span className="text-xs text-[#70372D] font-medium">mesafede</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
