import { ShoppingCart, Package, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { coordsOf, itemQuantity, validPrice } from '@/lib/shoppingUtils';
import type { OptimizedShopping, MarketGroup, ProductDepotInfo, ShoppingMode } from '@/types';
import { getMarketLogo } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  optimization: OptimizedShopping;
  mode: ShoppingMode;
  onModeChange: (mode: ShoppingMode) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  refreshMessage: string | null;
  onViewRoute: () => void;
  onViewSingleRoute?: (depot: ProductDepotInfo) => void;
  onClearCart: () => void;
  onRemoveItem: (id: string) => void;
}

const money = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
const labels: Record<ShoppingMode, string> = { single: 'Tek mağaza', two: 'En fazla iki mağaza', cheapest: 'Ürün toplamı en düşük' };
const dateLabel = (date: string) => new Date(date).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' });

export function ShoppingCartSummary({ optimization, mode, onModeChange, onQuantityChange, onRefreshPrices,
  isRefreshing, refreshMessage, onViewRoute, onViewSingleRoute, onClearCart, onRemoveItem }: Props) {
  const { marketGroups, totalCost, marketCount, options = [], singleStoreCost, totalSavings,
    extraWalkMinutes, oldestPriceCheck, hasUnknownPriceChecks, unavailableProducts = [] } = optimization;
  const count = optimization.totalQuantity ?? marketGroups.reduce((sum, group) => sum + group.items.reduce((n, item) => n + itemQuantity(item), 0), 0);
  const routeAvailable = !unavailableProducts.length && marketGroups.length > 0 && marketGroups.every(group => coordsOf(group.depotInfo));
  const stale = oldestPriceCheck && Date.now() - Date.parse(oldestPriceCheck) > 30 * 60 * 1000;
  return (
    <Card className="mb-6 border-[#F7A898] bg-[#FFECE8] shadow-md rounded-2xl">
      <CardHeader className="pb-3 border-b border-[#F7A898]/40">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[#2D1E12] font-bold text-lg"><ShoppingCart className="h-5 w-5" /> Alışveriş Sepeti ({count} adet)</span>
          <Button onClick={onClearCart} variant="ghost" size="sm">Sepeti temizle</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {unavailableProducts.length > 0 && <div role="alert" className="rounded-xl border border-[#F7A898] p-3 space-y-2 text-sm">
          <p>Bu ürünlerin seçili şubelerde geçerli fiyatı yok. Fiyatları yeniden kontrol edin veya sepetten çıkarın; tam sepet karşılaştırması henüz yapılamıyor.</p>
          {unavailableProducts.map(product => <div key={product.id} className="flex flex-wrap justify-between gap-2"><span>{product.title}</span><Button size="sm" variant="ghost" onClick={() => onRemoveItem(product.id)}>Çıkar</Button></div>)}
        </div>}
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Nasıl alışveriş yapmak istersiniz?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map(option => (
              <label key={option.mode} className={`rounded-xl border p-3 text-sm ${option.feasible ? 'cursor-pointer' : 'opacity-70'} ${optimization.mode === option.mode ? 'border-[#0E2C24] bg-[#9BCEC1]/40' : 'border-[#F7A898] bg-[#FFEBD3]'}`}>
                <span className="flex items-center gap-2 font-bold">
                  <input aria-label={labels[option.mode]} type="radio" name="shopping-mode" value={option.mode} checked={optimization.mode === option.mode} disabled={!option.feasible} onChange={() => onModeChange(option.mode)} />
                  {labels[option.mode]}
                </span>
                {option.feasible ? <span className="mt-2 block">
                  {money(option.totalCost)} · {option.marketCount} şube
                  <span className="block text-xs mt-1">{option.estimatedWalkMinutes !== undefined ? `Yaklaşık ${Math.round(option.estimatedWalkMinutes)} dk yürüyüş` : 'Yol süresi hesaplanamadı'}</span>
                </span> : <span className="block mt-2 text-xs">{option.reason}</span>}
              </label>
            ))}
          </div>
        </fieldset>
        {mode !== optimization.mode && <p role="status" className="text-sm text-[#70372D]">Seçtiğiniz mağaza sınırı bu sepeti karşılamıyor. Tüm ürünleri koruyan en düşük ürün toplamı gösteriliyor.</p>}
        <p className="text-xs text-[#70372D]">Seçenekler aynı ürünleri ve adetleri karşılaştırır. Yol ve zaman maliyeti ürün toplamına dahil değildir. Yürüyüş süreleri kuş uçuşu mesafeye göre yaklaşık hesaplanır; eve dönüş ve mağazada geçirilen süre dahil değildir.</p>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#FFEBD3] p-3 sm:grid-cols-4">
          <Stat title="Seçilen sepet" value={unavailableProducts.length ? 'Yenileme gerekli' : money(totalCost)} />
          <Stat title="Uğranacak şube" value={unavailableProducts.length ? 'Belirlenemedi' : String(marketCount)} />
          <Stat title="En ucuz tek şube" value={singleStoreCost !== undefined ? money(singleStoreCost) : 'Tam sepet yok'} />
          <Stat title="Tek şubeye göre fark" value={totalSavings !== undefined ? money(totalSavings) : 'Karşılaştırılamıyor'} />
        </dl>
        {extraWalkMinutes !== undefined && <p className="text-sm">Tek şubeye göre yaklaşık {Math.round(Math.abs(extraWalkMinutes))} dk {extraWalkMinutes >= 0 ? 'ek' : 'daha az'} yürüyüş.</p>}
        {singleStoreCost === undefined && <p className="text-xs text-[#70372D]">Aynı ürünlerin tamamı tek şubede bulunamadığı için tasarruf tutarı hesaplanmadı.</p>}
        <div className="rounded-xl border border-[#F7A898]/60 bg-[#FFEBD3] p-3 space-y-2">
          <p className="text-xs">{oldestPriceCheck ? `Sepetteki en eski fiyat kontrolü: ${dateLabel(oldestPriceCheck)} (Türkiye saati).` : 'Fiyat kontrol zamanı bilinmiyor.'}</p>
          {(stale || hasUnknownPriceChecks) && <p className="text-xs font-bold text-[#70372D]">{hasUnknownPriceChecks ? 'Bazı ürünlerin kontrol zamanı bilinmiyor. ' : ''}{stale ? 'Sepette 30 dakikadan eski fiyat kayıtları var. ' : ''}Alışverişten önce fiyatları yeniden kontrol edin.</p>}
          <p className="text-xs text-[#70372D]">Kontrol zamanı, fiyatın market servisinden alındığı zamandır. Mağazadaki güncel fiyat ve stok için garanti vermez.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRefreshPrices} disabled={isRefreshing}>{isRefreshing ? 'Fiyatlar kontrol ediliyor…' : 'Fiyatları yeniden kontrol et'}</Button>
          {refreshMessage && <p role="status" className="text-xs">{refreshMessage}</p>}
        </div>
        <p className="text-xs text-[#70372D]">Adet, satın alınacak paket veya ürün sayısıdır. Tarifin gramajından gereken paket sayısı otomatik hesaplanmaz.</p>
        <div className="space-y-3">{marketGroups.map(group => <MarketGroupCard key={group.depotKey} group={group} onRemoveItem={onRemoveItem} onQuantityChange={onQuantityChange} />)}</div>
        {!routeAvailable && <p role="status" className="text-sm text-[#70372D]">{unavailableProducts.length ? 'Tüm ürünlerin seçili şubelerdeki fiyatları doğrulanana kadar rota gösterilemiyor.' : 'Bazı şubelerin konumu bulunamadı. Tüm duraklar doğrulanana kadar alışveriş rotası gösterilemiyor.'}</p>}
        <Button disabled={!routeAvailable || (marketCount === 1 && !onViewSingleRoute)} onClick={() => marketCount === 1 ? onViewSingleRoute?.(marketGroups[0].depotInfo) : onViewRoute()} className="w-full bg-[#9BCEC1] text-[#0E2C24] hover:bg-[#83BEB0] rounded-xl">
          <MapPin className="h-4 w-4 mr-2" />{marketCount === 1 ? 'Tek mağaza rotasını gör' : 'Alışveriş rotasını gör'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="text-center min-w-0"><dd className="font-bold text-[#0E2C24] break-words">{value}</dd><dt className="text-xs text-[#70372D] mt-1">{title}</dt></div>;
}

function MarketGroupCard({ group, onRemoveItem, onQuantityChange }: {
  group: MarketGroup; onRemoveItem: (id: string) => void; onQuantityChange: (id: string, quantity: number) => void;
}) {
  const logo = getMarketLogo(group.marketName);
  return <div className="p-3 sm:p-4 bg-[#FFEBD3] rounded-2xl border border-[#F7A898]/60 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {logo && <Image src={logo} alt={group.marketName} width={48} height={24} unoptimized />}
        <span className="text-sm font-bold break-words">{group.depotInfo.depotName || group.marketName}</span>
      </div>
      <span className="text-sm font-bold text-[#0E2C24]">{money(group.subtotal)}</span>
    </div>
    {group.items.map(item => <div key={item.product.id} className="rounded-xl border border-[#F7A898]/40 p-3 bg-[#FFECE8] space-y-2">
      <div className="flex items-start gap-2">
        <Package className="h-4 w-4 shrink-0 mt-0.5" /><span className="text-sm font-bold break-words">{item.product.title}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs">Adet
          <input aria-label={`${item.product.title} adet`} type="number" min={1} max={999} step={1} value={itemQuantity(item)} onChange={e => onQuantityChange(item.product.id, Number(e.target.value))} className="w-20 rounded-lg border border-[#F7A898] bg-[#FFEBD3] p-2 text-sm" />
        </label>
        <span className="text-xs">{money(validPrice(item.selectedDepot.price) ?? 0)} / adet · <strong>{money((validPrice(item.selectedDepot.price) ?? 0) * itemQuantity(item))}</strong></span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(item.product.id)} aria-label={`${item.product.title} sepetten çıkar`}>Çıkar</Button>
      </div>
      {item.selectedDepot.indexTime && <p className="text-[11px] text-[#70372D]">Kaynak kayıt zamanı: {item.selectedDepot.indexTime}</p>}
      {item.selectedDepot.promotionText && <p className="text-xs font-medium">Kampanya koşulu: {item.selectedDepot.promotionText}</p>}
      {item.product.priceCheckedAt && Number.isFinite(Date.parse(item.product.priceCheckedAt)) && <p className="text-[11px] text-[#70372D]">Fiyat kontrolü: {dateLabel(item.product.priceCheckedAt)}</p>}
    </div>)}
  </div>;
}
