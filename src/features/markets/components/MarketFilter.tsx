'use client';

import { Check, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getStoreTheme, type MarketBrand } from '@/lib/marketUtils';

interface MarketFilterProps {
  uniqueBrands: MarketBrand[];
  selectedBrands: Set<MarketBrand>;
  onToggleBrand: (brand: MarketBrand) => void;
}

export function MarketFilter({ uniqueBrands, selectedBrands, onToggleBrand }: MarketFilterProps) {
  if (uniqueBrands.length === 0) return null;

  return (
    <Card className="mb-4 bg-[#EDF3EE] border-[#BCC7D2] shadow-2xs">
      <CardContent className="p-4">
        <h3 className="font-bold text-xs font-heading text-[#253341] uppercase tracking-wider mb-3">
          Market Filtrele
        </h3>
        <div className="flex flex-wrap gap-2.5 items-center">
          {uniqueBrands.map((brand) => {
            const isSelected = selectedBrands.has(brand);
            const theme = getStoreTheme(brand);
            return (
              <button
                key={brand}
                type="button"
                onClick={() => onToggleBrand(brand)}
                aria-label={brand}
                aria-pressed={isSelected}
                data-brand={brand}
                className={cn(
                  "flex items-center gap-2 h-11 px-3.5 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.03] relative cursor-pointer",
                  isSelected
                    ? "bg-[#DCE3EA] border-[#253341] border-2 shadow-sm text-[#253341]"
                    : "bg-[#F5F9F5]/75 border-[#BCC7D2] text-[#3E5164] opacity-60 hover:opacity-95 hover:bg-[#DBE6DD]"
                )}
              >
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg border text-[10px] font-extrabold shrink-0"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                >
                  {theme.shortCode ? (
                    <span>{theme.shortCode.slice(0, 2)}</span>
                  ) : (
                    <Store className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <span className="text-xs font-bold font-heading tracking-tight whitespace-nowrap">
                  {theme.label}
                </span>
                {isSelected && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#EC7D55] text-[#253341] ring-2 ring-[#EDF3EE] ml-0.5">
                    <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
