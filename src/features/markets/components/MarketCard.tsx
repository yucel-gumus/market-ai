'use client';

import Image from 'next/image';
import { Store, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Market } from '@/types';
import { MarketService } from '@/services/marketService';

interface MarketCardProps {
  market: Market;
  isVisible: boolean;
  onToggleMarket: (market: Market) => void;
}

function getMarketLogo(marketName: string): string | null {
  const normalizedName = marketName.toLowerCase().trim();
  
  const logoMap: Record<string, string> = {
    'bim': '/bim.svg',
    'a101': '/a101.svg',
    'a 101': '/a101.svg',
    'migros': '/migros.svg',
    'carrefour': '/carrefour.svg',
    'carrefoursa': '/carrefour.svg',
    'sok': '/sok.svg',
    'şok': '/sok.svg',
    'tarım kredi': '/tarim_kredi.svg',
    'tarim kredi': '/tarim_kredi.svg',
    'tarim_kredi': '/tarim_kredi.svg',
    'tarımkredi': '/tarim_kredi.svg',
  };

  if (logoMap[normalizedName]) {
    return logoMap[normalizedName];
  }

  for (const [key, value] of Object.entries(logoMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
}
export function MarketCard({ market, isVisible, onToggleMarket }: MarketCardProps) {
  const marketKey = market.id || `${market.name}-${market.address}-${market.latitude}-${market.longitude}`;

  return (
    <Card className={cn(
      "transition-all duration-300",
      isVisible 
        ? "hover:shadow-md opacity-100" 
        : "opacity-50 blur-[1px] hover:opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center pt-2">
            <Checkbox
              id={`market-${marketKey}`}
              checked={isVisible}
              onCheckedChange={() => onToggleMarket(market)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-center">
                {getMarketLogo(market.name) ? (
                  <div className="h-8 w-8 relative">
                    <Image
                      src={getMarketLogo(market.name)!}
                      alt={`${market.name} logo`}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Store className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground break-words">
                    {market.address}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {MarketService.formatDistance(market.distance)}
                  </span>
                  <span className="text-xs text-muted-foreground">uzaklıkta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
