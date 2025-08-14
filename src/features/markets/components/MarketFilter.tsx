'use client';

import Image from 'next/image';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getMarketLogo, getMarketDisplayName, type MarketBrand } from '@/lib/marketUtils';

interface MarketFilterProps {
  uniqueBrands: MarketBrand[];
  selectedBrands: Set<MarketBrand>;
  onToggleBrand: (brand: MarketBrand) => void;
}

export function MarketFilter({ uniqueBrands, selectedBrands, onToggleBrand }: MarketFilterProps) {
  if (uniqueBrands.length === 0) return null;

  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <h3 className="font-semibold text-xs text-foreground mb-3">Market Seç</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {uniqueBrands.map((brand) => {
            const isSelected = selectedBrands.has(brand);
            const logoPath = getMarketLogo(brand);
            return (
              <button
                key={brand}
                onClick={() => onToggleBrand(brand)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-105 relative",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <div className="mb-1 p-1.5 rounded-full bg-muted">
                  {logoPath ? (
                    <Image
                      src={logoPath}
                      alt={brand}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  ) : (
                    <Store className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {getMarketDisplayName(brand)}
                </span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
