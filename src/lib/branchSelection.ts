import { haversineKm } from '@/lib/geo';
import type { Market, ParsedAddress, Product } from '@/types';

/**
 * Kullanıcının seçtiği marketlerde geçerli fiyatı OLMAYAN bir ürün elle seçilirse,
 * onu taşıyan şubeyi seçime eklemek için `Market` üretir.
 *
 * Neden gerekli: sepet karşılaştırması yalnızca seçili marketlerde geçerli fiyatlarla
 * çalışır. Şube seçime eklenmezse ürün "seçili şubelerde geçersiz" sayılır ve tüm
 * karşılaştırma modları kilitlenir — kullanıcı da bunu kendi seçimiyle yapmış olur.
 *
 * @returns Eklenecek şube; ürün zaten seçili marketlerde varsa ya da şube bilgisi
 *          yoksa `null` (o zaman seçime dokunulmaz).
 */
export function branchForProduct(
  product: Product,
  selectedIds: Iterable<string>,
  address?: ParsedAddress | null
): Market | null {
  const selected = new Set(selectedIds);
  const depots = (product.productDepotInfoList ?? []).filter(d => Number.isFinite(d.price) && d.price > 0);
  if (!depots.length) return null;
  // Kullanıcının marketinde zaten satılıyorsa şube eklemeye gerek yok.
  if (depots.some(d => selected.has(d.depotId))) return null;
  const depot = depots[0]; // sunucu depo listesini en ucuzdan pahalıya sıralar
  const hasCoords = Number.isFinite(depot.latitude) && Number.isFinite(depot.longitude);
  return {
    id: depot.depotId,
    name: depot.depotName || depot.marketAdi || depot.depotId,
    address: depot.depotName || depot.marketAdi || '',
    // Sepetin rota/yürüyüş hesabı kuş uçuşu mesafeyle çalışır; koordinat yoksa 0 kalır.
    distance:
      address && hasCoords
        ? Number(haversineKm(address.latitude, address.longitude, depot.latitude as number, depot.longitude as number).toFixed(2))
        : 0,
    latitude: depot.latitude ?? address?.latitude ?? 0,
    longitude: depot.longitude ?? address?.longitude ?? 0,
    brand: depot.marketAdi,
  };
}
