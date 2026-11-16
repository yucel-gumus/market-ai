'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Package, Store, Ruler, Search, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { findOptimalDepot } from '@/lib/shoppingUtils';
import { generateKey } from '@/lib/stringUtils';
import { Button } from '@/components/ui/button';
import { StoreBadge } from '@/components/StoreBadge';

interface ProductDropdownProps {
  products: Product[];
  isLoading?: boolean;
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
  isLoading = false,
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
        "absolute top-full left-0 right-0 z-50 mt-2 bg-[#DCE3EA] border border-[#BCC7D2] rounded-2xl shadow-xl max-h-96 overflow-hidden",
        className
      )}
    >
      <div className="sticky top-0 px-4 py-2.5 bg-[#EDF3EE] border-b border-[#BCC7D2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#AB421C] stroke-[2.5]" />
          <span className="text-xs font-bold font-heading text-[#253341]">
            Bulunan Ürünler ({uniqueProducts.length})
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#BCC7D2]/60">
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
          isLoading ? <p role="status" className="p-4 text-sm text-[#3E5164]">Ürünler yükleniyor…</p> : <NoResultsMessage query={query} />
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
  const cheapestDepot = findOptimalDepot(product, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cheapestDepot) return;
    onAddToCart?.(product);
    onProductAdded?.();
  };

  return (
    <div className="flex items-center justify-between p-3.5 bg-[#EDF3EE]/65 hover:bg-[#DBE6DD] transition-colors gap-3.5 border-b border-[#BCC7D2]/60 last:border-0">
      {/* Ürün Görseli */}
      <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-[#F5F9F5] border border-[#BCC7D2] overflow-hidden flex items-center justify-center p-1.5 shadow-2xs">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            unoptimized
            className="object-contain p-1"
          />
        ) : (
          <Package className="h-7 w-7 text-[#3E5164]/50" />
        )}
      </div>

      {/* Ürün Detayları */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {product.brand && (
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#253341] bg-[#DCE3EA] border border-[#BCC7D2] px-2 py-0.5 rounded-md">
              {product.brand}
            </span>
          )}
          <h4 className="font-bold text-sm text-[#253341] line-clamp-1">
            {product.title}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#3E5164]">
          <div className="flex items-center gap-1 font-medium">
            <Ruler className="h-3.5 w-3.5 text-[#3E5164]" />
            <span>{product.refinedVolumeOrWeight || 'Belirtilmemiş'}</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <Store className="h-3.5 w-3.5 text-[#3E5164]" />
            <span>{depots.length} Mağaza</span>
          </div>
          <span className="font-bold bg-[#DBE6DD] border border-[#BCC7D2] text-[#253341] px-2 py-0.5 rounded-md shadow-2xs text-xs">
            {cheapestDepot ? `₺${cheapestDepot.price}` : 'Fiyat yok'}
          </span>
          {cheapestDepot?.unitPrice && (
            <span className="text-[11px] text-[#3E5164] font-medium">
              ({cheapestDepot.unitPrice})
            </span>
          )}
        </div>
        
        {/* En Uygun Market Rozeti */}
        {cheapestDepot && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-[#3E5164] font-semibold shrink-0">
              En uygun:
            </span>
            <StoreBadge name={cheapestDepot.marketAdi} size="xs" />
          </div>
        )}
      </div>
      
      {/* Sepete Ekle / Çıkar */}
      <div className="flex items-center gap-2 shrink-0">
        {onAddToCart && (
          <Button
            disabled={!cheapestDepot}
            aria-label={`${product.title} ${isInCart ? "bir adet daha ekle" : "sepete ekle"}`}
            onClick={handleAddToCart}
            size="sm"
            variant={isInCart ? "secondary" : "default"}
            className={cn(
              "h-8 px-3 text-xs font-bold rounded-xl shadow-2xs",
              isInCart
                ? "bg-[#F2A488] text-[#253341] hover:bg-[#EC7D55]"
                : "bg-[#EC7D55] text-[#253341] hover:bg-[#AB421C] hover:text-[#F5F9F5]"
            )}
          >
            {isInCart ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />
                +1 adet
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
      <Search className="h-10 w-10 text-[#AB421C] mb-3" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#253341]">
          &quot;<span className="text-[#AB421C]">{query}</span>&quot; için ürün bulunamadı
        </p>
        <p className="text-xs font-medium text-[#3E5164]">
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
      const key = product.id || generateKey(product.title, index);
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
