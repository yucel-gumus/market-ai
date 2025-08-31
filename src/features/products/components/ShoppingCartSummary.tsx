import { ShoppingCart, X, Package, TrendingDown, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedShopping, CartItem, MarketGroup, ProductDepotInfo } from '@/types';
import { getMarketLogo } from '@/lib/utils';
import Image from 'next/image';

interface ShoppingCartSummaryProps {
  optimization: OptimizedShopping;
  onViewRoute: () => void;
  onViewSingleRoute?: (depot: ProductDepotInfo) => void;
  onClearCart: () => void;
  onRemoveItem: (productId: string) => void;
}

export function ShoppingCartSummary({ 
  optimization, 
  onViewRoute, 
  onViewSingleRoute,
  onClearCart, 
  onRemoveItem 
}: ShoppingCartSummaryProps) {
  const { marketGroups, totalCost, marketCount } = optimization;
  const totalItems = marketGroups.reduce((sum, group) => sum + group.items.length, 0);

  const handleSingleRouteClick = () => {
    if (marketCount === 1 && marketGroups.length > 0 && onViewSingleRoute) {
      const singleGroup = marketGroups[0];
      if (singleGroup.items.length > 0) {
        const firstDepot = singleGroup.items[0].selectedDepot;
        onViewSingleRoute(firstDepot);
      }
    }
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">
              Alışveriş Sepeti ({totalItems} ürün)
            </span>
          </div>
          <Button 
            onClick={onClearCart}
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Temizle
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-white/60 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{totalItems}</div>
            <div className="text-xs text-muted-foreground">Ürün</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{marketCount}</div>
            <div className="text-xs text-muted-foreground">Mağaza</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">₺{totalCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Toplam</div>
          </div>
        </div>

        {/* Market Groups */}
        <div className="space-y-3">
          {marketGroups.map((group) => (
            <MarketGroupCard 
              key={group.marketName}
              group={group}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {marketCount > 1 && (
            <Button 
              onClick={onViewRoute}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Alışveriş Rotası
            </Button>
          )}
          
          {marketCount === 1 && (
            <Button 
              onClick={handleSingleRouteClick}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Tek Mağaza - Rotayı Gör
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketGroupCardProps {
  group: MarketGroup;
  onRemoveItem: (productId: string) => void;
}

function MarketGroupCard({ group, onRemoveItem }: MarketGroupCardProps) {
  const marketLogo = getMarketLogo(group.marketName);

  return (
    <div className="p-3 bg-white/40 rounded-lg border border-white/60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {marketLogo && (
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <Image
                src={marketLogo}
                alt={group.marketName}
                width={24}
                height={24}
                className="max-w-6 max-h-6 object-contain rounded"
              />
            </div>
          )}
          <span className="font-medium text-sm">{group.depotInfo.depotName}</span>
          {group.distance && (
            <span className="text-xs text-muted-foreground">
              ({group.distance.toFixed(1)} km)
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-green-600">
          ₺{group.subtotal.toFixed(2)}
        </div>
      </div>
      
      <div className="space-y-1">
        {group.items.map((item: CartItem) => (
          <div key={item.product.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="line-clamp-1">{item.product.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">₺{item.selectedDepot.price}</span>
              <Button
                onClick={() => onRemoveItem(item.product.id)}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
