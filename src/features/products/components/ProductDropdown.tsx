'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Package, Store, Ruler, Search, ArrowRight, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { cn, getMarketLogo } from '@/lib/utils';
import { generateKey } from '@/lib/stringUtils';
import { Button } from '@/components/ui/button';

interface ProductDropdownProps {
  products: Product[];
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onProductAdded?: () => void; // Yeni prop: ürün sepete eklendikten sonra çağrılacak
  isProductInCart?: (productId: string) => boolean;
  isLoading?: boolean;
  className?: string;
}

export function ProductDropdown({
  products,
  query,
  isOpen,
  onClose,
  onSelectProduct,
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
  onClick: () => void;
  onAddToCart?: (product: Product) => void;
  onProductAdded?: () => void;
  isInCart: boolean;
}

function ProductDropdownItem({ product, onClick, onAddToCart, onProductAdded, isInCart }: ProductDropdownItemProps) {
  const cheapestDepot = product.productDepotInfoList?.reduce((min, depot) => 
    parseFloat(depot.price.toString()) < parseFloat(min.price.toString()) ? depot : min
  );
  
  const logoPath = cheapestDepot ? getMarketLogo(cheapestDepot.marketAdi || '') : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
    onProductAdded?.(); // Ürün sepete eklendikten sonra callback'i çağır
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div 
        className="flex-1 space-y-2 cursor-pointer"
        onClick={onClick}
      >
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
            <span className="font-medium text-green-600">{cheapestDepot?.price || 'N/A'} ₺</span>
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
                  width={20}
                  height={20}
                  className="object-contain rounded"
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
      
      <div className="flex items-center gap-2 ml-4">
        {onAddToCart && (
          <Button
            onClick={handleAddToCart}
            size="sm"
            variant={isInCart ? "secondary" : "default"}
            className="h-8 px-3 text-xs"
          >
            {isInCart ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Sepette
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Sepete Ekle
              </>
            )}
          </Button>
        )}
        <ArrowRight 
          className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-pointer"
          onClick={onClick}
        />
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

function getUniqueProducts(products: Product[], query?: string): Product[] {
  const seen = new Set<string>();
  
  const uniqueProducts = products
    .filter((product, index) => {
      const key = generateKey(product.title, index);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Sıralama mantığı: önce tam eşleşenler, sonra alfabetik
  return uniqueProducts.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const searchQuery = query ? query.toLowerCase().trim() : '';

    if (searchQuery) {
      // Tam eşleşme kontrolü
      const aExactMatch = aTitle === searchQuery;
      const bExactMatch = bTitle === searchQuery;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // İkisi de tam eşleşme değilse, başlangıç eşleşmesi kontrol et
      const aStartsWith = aTitle.startsWith(searchQuery);
      const bStartsWith = bTitle.startsWith(searchQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // İkisi de aynı kategorideyse (tam eşleşme/başlangıç eşleşme/normal), alfabetik sırala
      return aTitle.localeCompare(bTitle, 'tr');
    }

    // Query yoksa sadece alfabetik sıralama
    return aTitle.localeCompare(bTitle, 'tr');
  });
}
