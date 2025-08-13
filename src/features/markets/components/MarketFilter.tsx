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
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Market Seç</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {uniqueBrands.map((brand) => {
            const isSelected = selectedBrands.has(brand);
            const logoPath = getMarketLogo(brand);
            return (
              <button
                key={brand}
                onClick={() => onToggleBrand(brand)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 hover:scale-105 relative",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <div className="mb-2 p-2 rounded-full bg-muted">
                  {logoPath ? (
                    <Image
                      src={logoPath}
                      alt={brand}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {getMarketDisplayName(brand)}
                </span>
                {isSelected && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
