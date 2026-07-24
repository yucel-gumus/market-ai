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
  const { marketGroups, totalCost, marketCount, totalSavings = 0 } = optimization;
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
    <Card className="mb-6 border-[#F7A898] bg-[#FFECE8] shadow-md rounded-2xl">
      <CardHeader className="pb-3 border-b border-[#F7A898]/40">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#9BCEC1] text-[#0E2C24]">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="text-[#2D1E12] font-bold font-heading text-lg">
              Alışveriş Sepeti ({totalItems} Ürün)
            </span>
          </div>
          <Button
            onClick={onClearCart}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-bold text-[#4A1E17] hover:bg-[#FFB6A6]/40 hover:text-[#2D1E12] rounded-xl"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Sepeti Temizle
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#FFEBD3] p-3.5 border border-[#F7A898]/50 sm:grid-cols-4">
          <div className="text-center p-2 rounded-lg bg-[#FFECE8]">
            <div className="text-xl font-bold font-heading text-[#2D1E12]">{totalItems}</div>
            <div className="text-xs font-semibold text-[#70372D]">Toplam Ürün</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#FFECE8]">
            <div className="text-xl font-bold font-heading text-[#2D1E12]">{marketCount}</div>
            <div className="text-xs font-semibold text-[#70372D]">Uğranacak Mağaza</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#FFECE8]">
            <div className="text-xl font-bold font-heading text-[#0E2C24]">₺{totalCost.toFixed(2)}</div>
            <div className="text-xs font-semibold text-[#70372D]">Toplam Tutar</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#9BCEC1]/40 border border-[#9BCEC1]">
            <div className="text-xl font-bold font-heading text-[#0E2C24]">
              ₺{totalSavings.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-[#0E2C24]">Tahmini Tasarruf</div>
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
        <div className="flex gap-3 pt-2">
          {marketCount > 1 && (
            <Button
              onClick={onViewRoute}
              className="flex-1 bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] font-bold h-12 rounded-2xl shadow-sm text-sm"
            >
              <MapPin className="h-5 w-5 mr-2 stroke-[2.5]" />
              Optimum Alışveriş Rotasını Gör
            </Button>
          )}

          {marketCount === 1 && (
            <Button
              onClick={handleSingleRouteClick}
              className="flex-1 bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] font-bold h-12 rounded-2xl shadow-sm text-sm"
            >
              <TrendingDown className="h-5 w-5 mr-2 stroke-[2.5]" />
              Tek Mağaza Rotasını Gör
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
    <div className="p-4 bg-[#FFEBD3] rounded-2xl border border-[#F7A898]/60 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Market SVG Logosu Rozeti */}
          {marketLogo ? (
            <div className="relative h-7 w-16 shrink-0 flex items-center justify-center bg-[#f5d3b3] p-1 rounded-xl border border-[#F7A898]/60 shadow-2xs">
              <Image
                src={marketLogo}
                alt={group.marketName}
                fill
                unoptimized
                className="object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-[#FFECE8] text-[#2D1E12]">
              <Package className="h-4 w-4" />
            </div>
          )}
          <span className="font-bold text-sm text-[#2D1E12] font-heading truncate">
            {group.depotInfo.depotName}
          </span>
          {group.distance && (
            <span className="text-xs font-semibold text-[#70372D] shrink-0">
              ({group.distance.toFixed(1)} km)
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-[#0E2C24] bg-[#9BCEC1] px-3 py-1 rounded-xl shadow-2xs shrink-0">
          ₺{group.subtotal.toFixed(2)}
        </div>
      </div>

      <div className="space-y-2">
        {group.items.map((item: CartItem) => (
          <div
            key={item.product.id}
            className="flex items-center justify-between rounded-xl border border-[#F7A898]/40 p-2.5 shadow-2xs bg-[#FFECE8] gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Ürün Görseli */}
              <div className="relative h-11 w-11 shrink-0 rounded-xl bg-white border border-[#F7A898]/50 overflow-hidden flex items-center justify-center p-1 shadow-2xs">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    unoptimized
                    className="object-contain p-0.5"
                  />
                ) : (
                  <Package className="h-5 w-5 text-[#9BCEC1] stroke-[2]" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="line-clamp-1 text-xs font-bold text-[#2D1E12]">
                  {item.product.title}
                </span>
                {item.product.refinedVolumeOrWeight && (
                  <span className="block text-[11px] text-[#70372D] font-medium">
                    {item.product.refinedVolumeOrWeight}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#0E2C24]">
                ₺{item.selectedDepot.price}
              </span>
              <Button
                type="button"
                onClick={() => onRemoveItem(item.product.id)}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-[#4A1E17] hover:bg-[#FFB6A6]/40 rounded-lg"
              >
                Çıkar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
