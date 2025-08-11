'use client';

import Image from 'next/image';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MarketFilterProps {
  uniqueBrands: string[];
  selectedBrands: Set<string>;
  onToggleBrand: (brand: string) => void;
}

function getBrandLogo(brand: string): string | null {
  const logoMap: Record<string, string> = {
    'bim': '/bim.svg',
    'a101': '/a101.svg',
    'migros': '/migros.svg',
    'carrefour': '/carrefour.svg',
    'sok': '/sok.svg',
    'tarim_kredi': '/tarim_kredi.svg',
  };
  return logoMap[brand] || null;
}

function getBrandDisplayName(brand: string): string {
  const nameMap: Record<string, string> = {
    'bim': 'BİM',
    'a101': 'A101',
    'migros': 'Migros',
    'carrefour': 'CarrefourSA',
    'sok': 'ŞOK',
    'tarim_kredi': 'Tarım Kredi',
    'other': 'Diğer'
  };
  return nameMap[brand] || brand;
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
            return (
              <button
                key={brand}
                onClick={() => onToggleBrand(brand)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                  isSelected 
                    ? "border-primary bg-primary/10 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  {getBrandLogo(brand) ? (
                    <Image
                      src={getBrandLogo(brand)!}
                      alt={`${brand} logo`}
                      width={32}
                      height={32}
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
                  {getBrandDisplayName(brand)}
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
