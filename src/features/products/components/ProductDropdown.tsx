'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Package, Store, Ruler, Search, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { cn, getMarketLogo } from '@/lib/utils';
import { generateKey } from '@/lib/stringUtils';

interface ProductDropdownProps {
  products: Product[];
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductDropdown({
  products,
  query,
  isOpen,
  onClose,
  onSelectProduct,
  className
}: ProductDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;
  const uniqueProducts = getUniqueProducts(products);

  return (
    <div 
      ref={dropdownRef} 
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden",
        className
      )}
    >
      <div className="sticky top-0 px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Bulunan Ürünler ({uniqueProducts.length})
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {uniqueProducts.length > 0 ? (
          <div className="divide-y divide-border">
            {uniqueProducts.map((product, index) => (
              <ProductDropdownItem
                key={`${product.id}-${index}`}
                product={product}
                onClick={() => onSelectProduct(product)}
              />
            ))}
          </div>
        ) : (
          <NoResultsMessage query={query} />
        )}
      </div>
    </div>
  );
}

interface ProductDropdownItemProps {
  product: Product;
  onClick: () => void;
}

function ProductDropdownItem({ product, onClick }: ProductDropdownItemProps) {
  const cheapestDepot = product.productDepotInfoList?.reduce((min, depot) => 
    parseFloat(depot.price.toString()) < parseFloat(min.price.toString()) ? depot : min
  );
  
  const logoPath = cheapestDepot ? getMarketLogo(cheapestDepot.marketAdi || '') : null;

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 space-y-2">
        <div className="font-medium text-foreground line-clamp-2">
          {product.title}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            <span>{product.refinedVolumeOrWeight || 'Belirtilmemiş'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            <span>{product.productDepotInfoList?.length || 0} mağaza</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{cheapestDepot?.price || 'N/A'} ₺</span>
          </div>
        </div>
        
        {/* En ucuz mağaza logosu */}
        {cheapestDepot && (
          <div className="flex items-center gap-2">
            {logoPath ? (
              <>
                <Image
                  src={logoPath}
                  alt={cheapestDepot.marketAdi || 'Market'}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="text-xs text-green-600 font-medium">
                  En ucuz: {cheapestDepot.marketAdi}
                </span>
              </>
            ) : (
              <span className="text-xs text-green-600 font-medium">
                En ucuz: {cheapestDepot.marketAdi}
              </span>
            )}
          </div>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
    </div>
  );
}

interface NoResultsMessageProps {
  query: string;
}

function NoResultsMessage({ query }: NoResultsMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          &quot;<span className="font-semibold">{query}</span>&quot; için sonuç bulunamadı
        </p>
        <p className="text-xs text-muted-foreground">
          Farklı bir arama terimi deneyin
        </p>
      </div>
    </div>
  );
}
function getUniqueProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  
  return products
    .filter((product, index) => {
      const key = generateKey(product.title, index);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => 
      a.title.localeCompare(b.title, 'tr', { 
        sensitivity: 'base', 
        ignorePunctuation: true 
      })
    );
}
