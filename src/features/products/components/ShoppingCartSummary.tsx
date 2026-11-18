import { useState } from 'react';
import { ShoppingCart, Package, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreBadge } from '@/components/StoreBadge';
import { coordsOf, itemQuantity, validPrice } from '@/lib/shoppingUtils';
import type { ConsolidationPlan, ConsolidationPlans, OptimizedShopping, MarketGroup, ProductDepotInfo, ShoppingMode } from '@/types';
import { formatBranchName } from '@/lib/stringUtils';

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
  /** Bu tarif akışında sepete eklenen ürünlerin kimlikleri (mevcut sepetten ayırmak için). */
  recipeProductIds?: string[];
  /** Sunucunun tek/iki şube planları: sepeti değiştirerek uygulanır (ürün ikamesi + şube sabitleme). */
  plans?: ConsolidationPlans | null;
  onApplyPlan?: (plan: ConsolidationPlan) => void;
}

const money = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
const labels: Record<ShoppingMode, string> = { single: 'Tek mağaza', two: 'En fazla iki mağaza', cheapest: 'Ürün toplamı en düşük' };
const dateLabel = (date: string) => new Date(date).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' });

export function ShoppingCartSummary({ optimization, mode, onModeChange, onQuantityChange, onRefreshPrices,
  isRefreshing, refreshMessage, onViewRoute, onViewSingleRoute, onClearCart, onRemoveItem, recipeProductIds = [],
  plans = null, onApplyPlan }: Props) {
  const { marketGroups, totalCost, marketCount, options = [], singleStoreCost, totalSavings,
    extraWalkMinutes, oldestPriceCheck, hasUnknownPriceChecks, unavailableProducts = [] } = optimization;
  const count = optimization.totalQuantity ?? marketGroups.reduce((sum, group) => sum + group.items.reduce((n, item) => n + itemQuantity(item), 0), 0);
  // Uygulanan planın kartı ekranda kalmaz: aksi hâlde "4 ürün değişir" yazısı,
  // karışık sepetlerde (mod hâlâ mümkün görünmediği için) uygulandıktan sonra da kalıyordu.
  const [trackedPlans, setTrackedPlans] = useState(plans);
  const [appliedPlanModes, setAppliedPlanModes] = useState<Record<string, boolean>>({});
  if (trackedPlans !== plans) {
    setTrackedPlans(plans);
    setAppliedPlanModes({});
  }
  const planModes = (['single', 'two'] as const).filter(planMode => plans?.[planMode]
    && !options.find(option => option.mode === planMode)?.feasible
    && !appliedPlanModes[planMode]);
  // Plan yalnızca bu tarifin malzemelerini kapsar; sepette başka ürünler varsa bunu söyle.
  const cartItemCount = marketGroups.reduce((total, group) => total + group.items.length, 0);
  const planScope = recipeProductIds.length > 0 && recipeProductIds.length < cartItemCount
    ? ' (bu tarifin malzemeleri için)'
    : '';
  const routeAvailable = !unavailableProducts.length && marketGroups.length > 0 && marketGroups.every(group => coordsOf(group.depotInfo));
  const stale = oldestPriceCheck && Date.now() - Date.parse(oldestPriceCheck) > 30 * 60 * 1000;
  // Tariften gelen kalemler ile kullanıcının önceden sepette olan kalemleri ayrı gösterilir;
  // aksi halde "sepet 15 ürün / 9 şube" görünüp tarifle ilişkisi anlaşılmıyor.
  const recipeIds = new Set(recipeProductIds);
  const recipeItemCount = marketGroups.reduce((sum, group) => sum + group.items.filter(item => recipeIds.has(item.product.id)).reduce((n, item) => n + itemQuantity(item), 0), 0);
  const recipeCost = marketGroups.reduce((sum, group) => sum + group.items.filter(item => recipeIds.has(item.product.id)).reduce((n, item) => n + Number(item.selectedDepot.price) * itemQuantity(item), 0), 0);
  const hasRecipeSplit = recipeItemCount > 0 && recipeItemCount < count;
  return (
    <Card className="mb-6 border-[#BCC7D2] bg-[#DCE3EA] shadow-md rounded-2xl">
      <CardHeader className="pb-3 border-b border-[#BCC7D2]/80">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[#253341] font-bold text-lg"><ShoppingCart className="h-5 w-5 text-[#AB421C]" /> Alışveriş Sepeti ({count} adet)</span>
          <Button onClick={onClearCart} variant="ghost" size="sm">Sepeti temizle</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {hasRecipeSplit && (
          <p role="status" className="rounded-xl bg-[#DBE6DD] border border-[#BCC7D2] p-3 text-xs font-semibold text-[#253341]">
            Bu tarif için eklenen: {recipeItemCount} adet · {money(recipeCost)}. Sepetin tamamı: {count} adet · {money(totalCost)}.
          </p>
        )}
        {unavailableProducts.length > 0 && <div role="alert" className="rounded-xl border border-[#AB421C] bg-[#F2A488]/30 p-3 space-y-2 text-sm text-[#253341]">
          <p>Bu ürünlerin seçili şubelerde geçerli fiyatı yok. Fiyatları yeniden kontrol edin veya sepetten çıkarın; tam sepet karşılaştırması henüz yapılamıyor.</p>
          {unavailableProducts.map(product => <div key={product.id} className="flex flex-wrap justify-between gap-2"><span>{product.title}</span><Button size="sm" variant="ghost" onClick={() => onRemoveItem(product.id)}>Çıkar</Button></div>)}
        </div>}
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-[#253341]">Nasıl alışveriş yapmak istersiniz?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map(option => (
              <label key={option.mode} className={`rounded-xl border p-3 text-sm transition-colors ${option.feasible ? 'cursor-pointer' : 'opacity-70'} ${optimization.mode === option.mode ? 'border-[#EC7D55] bg-[#F2A488]/30 ring-1 ring-[#EC7D55]' : 'border-[#BCC7D2] bg-[#EDF3EE] hover:bg-[#DBE6DD]'}`}>
                <span className="flex items-center gap-2 font-bold text-[#253341]">
                  <input aria-label={labels[option.mode]} type="radio" name="shopping-mode" value={option.mode} checked={optimization.mode === option.mode} disabled={!option.feasible} onChange={() => onModeChange(option.mode)} className="accent-[#AB421C]" />
                  {labels[option.mode]}
                </span>
                {option.feasible ? <span className="mt-2 block text-[#253341]">
                  {money(option.totalCost)} · {option.marketCount} şube
                  <span className="block text-xs text-[#3E5164] mt-1">{option.estimatedWalkMinutes !== undefined ? `Yaklaşık ${Math.round(option.estimatedWalkMinutes)} dk yürüyüş` : 'Yol süresi hesaplanamadı'}</span>
                </span> : <span className="block mt-2 text-xs text-[#3E5164]">{option.reason}</span>}
              </label>
            ))}
          </div>
        </fieldset>
        {mode !== optimization.mode && <p role="status" className="text-sm text-[#3E5164]">Seçtiğiniz mağaza sınırı bu sepeti karşılamıyor. Tüm ürünleri koruyan en düşük ürün toplamı gösteriliyor.</p>}
        <p className="text-xs text-[#3E5164]">Seçenekler aynı ürünleri ve adetleri karşılaştırır. Yol ve zaman maliyeti ürün toplamına dahil değildir. Yürüyüş süreleri kuş uçuşu mesafeye göre yaklaşık hesaplanır; eve dönüş ve mağazada geçirilen süre dahil değildir.</p>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#EDF3EE] border border-[#BCC7D2] p-3 sm:grid-cols-4">
          <Stat title="Seçilen sepet" value={unavailableProducts.length ? 'Yenileme gerekli' : money(totalCost)} />
          <Stat title="Uğranacak şube" value={unavailableProducts.length ? 'Belirlenemedi' : String(marketCount)} />
          <Stat title="En ucuz tek şube" value={singleStoreCost !== undefined ? money(singleStoreCost) : 'Tam sepet yok'} />
          <Stat title="Tek şubeye göre fark" value={totalSavings !== undefined ? money(totalSavings) : 'Hesaplanamadı'} />
        </dl>
        {planModes.map(planMode => {
          const plan = plans![planMode]!;
          const branchLabel = plan.branches.map(branch => branch.marketAdi || branch.depotName || branch.depotId).join(' + ');
          const sign = plan.delta > 0 ? '+' : '−';
          return (
            <div key={planMode} role="status" className="rounded-xl border border-[#EC7D55] bg-[#DBE6DD] p-3 space-y-2">
              <p className="text-sm font-bold text-[#253341]">{labels[planMode]} planı hazır{planScope}: {branchLabel} · {money(plan.total)}</p>
              <p className="text-xs text-[#3E5164]">
                {plan.switches.length ? `${plan.switches.length} ürün değişir` : 'Ürünler aynı kalır, yalnızca şube sabitlenir'}
                {' · '}mevcut seçime göre fark {sign}{money(Math.abs(plan.delta))}
              </p>
              {plan.switches.length > 0 && (
                <ul className="space-y-0.5 text-xs text-[#3E5164]">
                  {plan.switches.map(item => (
                    <li key={item.ingredient}>
                      • {item.ingredient}: {item.fromTitle ?? '—'} → {item.toTitle ?? '—'}
                      {typeof item.delta === 'number' && ` (${item.delta > 0 ? '+' : '−'}${money(Math.abs(item.delta))})`}
                    </li>
                  ))}
                </ul>
              )}
              {onApplyPlan && (
                <Button type="button" size="sm" onClick={() => { setAppliedPlanModes(prev => ({ ...prev, [planMode]: true })); onApplyPlan(plan); onModeChange(planMode); }}>
                  Planı uygula ({plan.switches.length ? `${plan.switches.length} ürün değişir` : 'şube sabitlenir'})
                </Button>
              )}
            </div>
          );
        })}
        {marketCount >= 3 && !planModes.length && (
          <p className="text-xs text-[#3E5164]">Bu sepet {marketCount} şubeye dağıldı. Daha az şubeyle alışveriş için Konum &amp; Marketler sayfasından market seçiminizi daraltabilirsiniz.</p>
        )}
        {extraWalkMinutes !== undefined && <p className="text-sm text-[#253341]">Tek şubeye göre yaklaşık {Math.round(Math.abs(extraWalkMinutes))} dk {extraWalkMinutes >= 0 ? 'ek' : 'daha az'} yürüyüş.</p>}
        {singleStoreCost === undefined && <p className="text-xs text-[#3E5164]">Aynı ürünlerin tamamı tek şubede bulunamadığı için tasarruf tutarı hesaplanmadı.</p>}
        <div className="rounded-xl border border-[#BCC7D2] bg-[#EDF3EE] p-3 space-y-2">
          <p className="text-xs text-[#253341]">{oldestPriceCheck ? `Sepetteki en eski fiyat kontrolü: ${dateLabel(oldestPriceCheck)} (Türkiye saati).` : 'Fiyat kontrol zamanı bilinmiyor.'}</p>
          {(stale || hasUnknownPriceChecks) && <p className="text-xs font-bold text-[#AB421C]">{hasUnknownPriceChecks ? 'Bazı ürünlerin kontrol zamanı bilinmiyor. ' : ''}{stale ? 'Sepette 30 dakikadan eski fiyat kayıtları var. ' : ''}Alışverişten önce fiyatları yeniden kontrol edin.</p>}
          <p className="text-xs text-[#3E5164]">Kontrol zamanı, fiyatın market servisinden alındığı zamandır. Mağazadaki güncel fiyat ve stok için garanti vermez.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRefreshPrices} disabled={isRefreshing}>{isRefreshing ? 'Fiyatlar kontrol ediliyor…' : 'Fiyatları yeniden kontrol et'}</Button>
          {refreshMessage && <p role="status" className="text-xs text-[#253341]">{refreshMessage}</p>}
        </div>
        <p className="text-xs text-[#3E5164]">Adet, satın alınacak paket veya ürün sayısıdır. Paket gramajı veya hacmi biliniyorsa tarif miktarına göre yaklaşık paket adedi önerilir; alışverişten önce kontrol edin.</p>
        <div className="space-y-3">{marketGroups.map(group => <MarketGroupCard key={group.depotKey} group={group} onRemoveItem={onRemoveItem} onQuantityChange={onQuantityChange} />)}</div>
        {!routeAvailable && <p role="status" className="text-sm text-[#3E5164]">{unavailableProducts.length ? 'Tüm ürünlerin seçili şubelerdeki fiyatları doğrulanana kadar rota gösterilemiyor.' : 'Bazı şubelerin konumu bulunamadı. Tüm duraklar doğrulanana kadar alışveriş rotası gösterilemiyor.'}</p>}
        <Button disabled={!routeAvailable || (marketCount === 1 && !onViewSingleRoute)} onClick={() => marketCount === 1 ? onViewSingleRoute?.(marketGroups[0].depotInfo) : onViewRoute()} className="w-full bg-[#EC7D55] text-[#253341] hover:bg-[#AB421C] hover:text-[#F5F9F5] rounded-xl font-bold">
          <MapPin className="h-4 w-4 mr-2" />{marketCount === 1 ? 'Tek mağaza rotasını gör' : 'Alışveriş rotasını gör'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="text-center min-w-0"><dd className="font-bold text-[#253341] break-words text-xs sm:text-sm">{value}</dd><dt className="text-xs text-[#3E5164] mt-1">{title}</dt></div>;
}

function MarketGroupCard({ group, onRemoveItem, onQuantityChange }: {
  group: MarketGroup; onRemoveItem: (id: string) => void; onQuantityChange: (id: string, quantity: number) => void;
}) {
  return <div className="p-3 sm:p-4 bg-[#EDF3EE] rounded-2xl border border-[#BCC7D2] space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <StoreBadge name={group.marketName} size="xs" />
        <span className="text-sm font-bold text-[#253341] break-words">{formatBranchName(group.depotInfo.depotName || group.marketName)}</span>
      </div>
      <span className="text-sm font-bold text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-2.5 py-0.5 rounded-lg">{money(group.subtotal)}</span>
    </div>
    {group.items.map(item => <div key={item.product.id} className="rounded-xl border border-[#BCC7D2] p-3 bg-[#F5F9F5] space-y-2">
      <div className="flex items-start gap-2 text-[#253341]">
        <Package className="h-4 w-4 shrink-0 mt-0.5 text-[#3E5164]" /><span className="text-sm font-bold break-words">{item.product.title}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[#253341]">
        <label className="flex items-center gap-2 text-xs text-[#3E5164]">Adet
          <input aria-label={`${item.product.title} adet`} type="number" min={1} max={999} step={1} value={itemQuantity(item)} onChange={e => onQuantityChange(item.product.id, Number(e.target.value))} className="w-20 rounded-lg border border-[#BCC7D2] bg-[#EDF3EE] text-[#253341] p-2 text-sm" />
        </label>
        <span className="text-xs text-[#3E5164]">{money(validPrice(item.selectedDepot.price) ?? 0)} / adet · <strong className="text-[#253341]">{money((validPrice(item.selectedDepot.price) ?? 0) * itemQuantity(item))}</strong></span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(item.product.id)} aria-label={`${item.product.title} sepetten çıkar`}>Çıkar</Button>
      </div>
      {item.selectedDepot.indexTime && <p className="text-[11px] text-[#3E5164]">Kaynak kayıt zamanı: {item.selectedDepot.indexTime}</p>}
      {item.selectedDepot.promotionText && <p className="text-xs font-medium text-[#AB421C]">Kampanya koşulu: {item.selectedDepot.promotionText}</p>}
      {item.product.priceCheckedAt && Number.isFinite(Date.parse(item.product.priceCheckedAt)) && <p className="text-[11px] text-[#3E5164]">Fiyat kontrolü: {dateLabel(item.product.priceCheckedAt)}</p>}
    </div>)}
  </div>;
}
