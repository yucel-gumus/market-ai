'use client';

import Image from 'next/image';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getMarketLogo, type MarketBrand } from '@/lib/marketUtils';

interface MarketFilterProps {
  uniqueBrands: MarketBrand[];
  selectedBrands: Set<MarketBrand>;
  onToggleBrand: (brand: MarketBrand) => void;
}

export function MarketFilter({ uniqueBrands, selectedBrands, onToggleBrand }: MarketFilterProps) {
  if (uniqueBrands.length === 0) return null;

  return (
    <Card className="mb-4 bg-[#FFECE8] border-[#F7A898]/70 shadow-2xs">
      <CardContent className="p-4">
        <h3 className="font-bold text-xs font-heading text-[#2D1E12] uppercase tracking-wider mb-3">
          Market Filtrele
        </h3>
        <div className="flex flex-wrap gap-2.5 items-center">
          {uniqueBrands.map((brand) => {
            const isSelected = selectedBrands.has(brand);
            const logoPath = getMarketLogo(brand);
            return (
              <button
                key={brand}
                type="button"
                onClick={() => onToggleBrand(brand)}
                aria-label={brand}
                className={cn(
                  "flex items-center justify-center h-12 px-4 py-2 rounded-xl border transition-all duration-200 hover:scale-105 relative cursor-pointer min-w-[72px]",
                  isSelected
                    ? "bg-[#f5d3b3] border-[#2D1E12] border-2 shadow-sm"
                    : "bg-[#f5d3b3]/40 border-[#F7A898]/40 opacity-50 hover:opacity-90 hover:bg-[#f5d3b3]/70"
                )}
              >
                {logoPath ? (
                  <div className="relative h-7 w-14 flex items-center justify-center">
                    <Image
                      src={logoPath}
                      alt={brand}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Store className="h-5 w-5 text-[#70372D]" />
                )}
                {isSelected && (
                  <div className="w-2.5 h-2.5 bg-[#0E2C24] rounded-full animate-pulse absolute -top-1 -right-1 ring-2 ring-[#9BCEC1]" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
