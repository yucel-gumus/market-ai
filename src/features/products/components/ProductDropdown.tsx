'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Package, Store, Ruler, Search, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { cn, getMarketLogo } from '@/lib/utils';
import { generateKey } from '@/lib/stringUtils';
import { Button } from '@/components/ui/button';

interface ProductDropdownProps {
  products: Product[];
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onProductAdded?: () => void; 
  isProductInCart?: (productId: string) => boolean;
  className?: string;
}

export function ProductDropdown({
  products,
  query,
  isOpen,
  onClose,
  onAddToCart,
  onProductAdded,
  isProductInCart,
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
  const uniqueProducts = getUniqueProducts(products, query);

  return (
    <div 
      ref={dropdownRef} 
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-2 bg-[#FFECE8] border border-[#F7A898] rounded-2xl shadow-xl max-h-96 overflow-hidden",
        className
      )}
    >
      <div className="sticky top-0 px-4 py-2.5 bg-[#FFEBD3] border-b border-[#F7A898]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#9BCEC1] stroke-[2.5]" />
          <span className="text-xs font-bold font-heading text-[#2D1E12]">
            Bulunan Ürünler ({uniqueProducts.length})
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#F7A898]/30">
        {uniqueProducts.length > 0 ? (
          <div>
            {uniqueProducts.map((product, index) => (
              <ProductDropdownItem
                key={`${product.id}-${index}`}
                product={product}
                onAddToCart={onAddToCart}
                onProductAdded={onProductAdded}
                isInCart={isProductInCart?.(product.id) || false}
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
  onAddToCart?: (product: Product) => void;
  onProductAdded?: () => void;
  isInCart: boolean;
}

function ProductDropdownItem({ product, onAddToCart, onProductAdded, isInCart }: ProductDropdownItemProps) {
  const depots = product.productDepotInfoList ?? [];
  const cheapestDepot = depots.length
    ? depots.reduce((min, depot) =>
        parseFloat(depot.price.toString()) < parseFloat(min.price.toString())
          ? depot
          : min
      )
    : undefined;
  
  const cheapestLogoPath = cheapestDepot ? getMarketLogo(cheapestDepot.marketAdi || '') : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
    onProductAdded?.();
  };

  return (
    <div className="flex items-center justify-between p-3.5 hover:bg-[#FFEBD3]/60 transition-colors gap-3.5 border-b border-[#F7A898]/30 last:border-0">
      {/* Ürün Görseli */}
      <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-white border border-[#F7A898]/50 overflow-hidden flex items-center justify-center p-1.5 shadow-2xs">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            unoptimized
            className="object-contain p-1"
          />
        ) : (
          <Package className="h-7 w-7 text-[#70372D]/40" />
        )}
      </div>

      {/* Ürün Detayları */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {product.brand && (
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#4A1E17] bg-[#FFECE8] border border-[#F7A898]/50 px-2 py-0.5 rounded-md">
              {product.brand}
            </span>
          )}
          <h4 className="font-bold text-sm text-[#2D1E12] line-clamp-1">
            {product.title}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#70372D]">
          <div className="flex items-center gap-1 font-medium">
            <Ruler className="h-3.5 w-3.5 text-[#0E2C24]" />
            <span>{product.refinedVolumeOrWeight || 'Belirtilmemiş'}</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <Store className="h-3.5 w-3.5 text-[#0E2C24]" />
            <span>{depots.length} Mağaza</span>
          </div>
          <span className="font-bold bg-[#9BCEC1] text-[#0E2C24] px-2 py-0.5 rounded-md shadow-2xs text-xs">
            ₺{cheapestDepot?.price || 'N/A'}
          </span>
          {cheapestDepot?.unitPrice && (
            <span className="text-[11px] text-[#70372D] font-medium">
              ({cheapestDepot.unitPrice})
            </span>
          )}
        </div>
        
        {/* En Uygun Market Rozeti */}
        {cheapestDepot && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-[#4A1E17] font-semibold shrink-0">
              En uygun:
            </span>
            {cheapestLogoPath ? (
              <div className="relative h-5.5 w-12 shrink-0 flex items-center justify-center bg-[#FFEBD3] p-1 rounded-lg border border-[#F7A898]/60 shadow-2xs">
                <Image
                  src={cheapestLogoPath}
                  alt={cheapestDepot.marketAdi || 'Market'}
                  fill
                  unoptimized
                  className="object-contain p-0.5"
                />
              </div>
            ) : (
              <span className="text-xs font-bold text-[#2D1E12]">{cheapestDepot.marketAdi}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Sepete Ekle / Çıkar */}
      <div className="flex items-center gap-2 shrink-0">
        {onAddToCart && (
          <Button
            onClick={handleAddToCart}
            size="sm"
            variant={isInCart ? "secondary" : "default"}
            className={cn(
              "h-8 px-3 text-xs font-bold rounded-xl shadow-2xs",
              isInCart
                ? "bg-[#FFB6A6] text-[#4A1E17] hover:bg-[#FA9E8B]"
                : "bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0]"
            )}
          >
            {isInCart ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />
                Sepette
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1 stroke-[3]" />
                Ekle
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

interface NoResultsMessageProps {
  query: string;
}

function NoResultsMessage({ query }: NoResultsMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Search className="h-10 w-10 text-[#FFB6A6] mb-3" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#2D1E12]">
          &quot;<span className="text-[#4A1E17]">{query}</span>&quot; için ürün bulunamadı
        </p>
        <p className="text-xs font-medium text-[#70372D]">
          Farklı veya daha genel bir kelime ile arayabilirsiniz
        </p>
      </div>
    </div>
  );
}

function getUniqueProducts(products: Product[], query?: string): Product[] {
  const seen = new Set<string>();
  
  const uniqueProducts = products
    .filter((product, index) => {
      const key = generateKey(product.title, index);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return uniqueProducts.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const searchQuery = query ? query.toLowerCase().trim() : '';

    if (searchQuery) {
      const aExactMatch = aTitle === searchQuery;
      const bExactMatch = bTitle === searchQuery;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      const aStartsWith = aTitle.startsWith(searchQuery);
      const bStartsWith = bTitle.startsWith(searchQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return aTitle.localeCompare(bTitle, 'tr');
    }

    return aTitle.localeCompare(bTitle, 'tr');
  });
}
