import { describe, expect, it } from 'vitest';
import { hiddenKeysForPreselection, isSameLocation, sessionMatchesSelection, settingsFromSession } from './locationSession';
import { marketKey } from './marketUtils';
import type { Market, MarketSearchSession, ParsedAddress } from '@/types';

const address: ParsedAddress = {
  fullAddress: 'Kızılcaşar Mh. Gölbaşı Ankara',
  street: '',
  neighborhood: 'Kızılcaşar Mh.',
  district: 'Gölbaşı',
  city: 'Ankara',
  latitude: 39.8156651,
  longitude: 32.72150354,
  additionalInfo: '',
};

const otherAddress: ParsedAddress = {
  ...address,
  neighborhood: 'Çukurambar Mh.',
  district: 'Çankaya',
  latitude: 39.9032,
  longitude: 32.8008,
};

const markets: Market[] = [
  { id: 'a', name: 'bim', address: 'Kızılcaşargölbaşı', distance: 1, latitude: 39.81, longitude: 32.72 },
  { id: 'b', name: 'a101', address: 'Incek Gölbaşı Ankara', distance: 2, latitude: 39.82, longitude: 32.73 },
];

const session: MarketSearchSession = {
  distance: 5,
  selectedAddress: address,
  selectedMarkets: markets,
  totalMarkets: 12,
  selectedCount: 2,
};

describe('isSameLocation', () => {
  it('aynı koordinatı eşit sayar, kayan nokta gürültüsünü yutar', () => {
    expect(isSameLocation(address, { ...address, latitude: address.latitude + 1e-9 })).toBe(true);
  });

  it('farklı koordinatı eşit saymaz', () => {
    expect(isSameLocation(address, otherAddress)).toBe(false);
  });

  it('boş değerlerde false döner', () => {
    expect(isSameLocation(null, address)).toBe(false);
    expect(isSameLocation(address, undefined)).toBe(false);
  });
});

describe('sessionMatchesSelection', () => {
  it('aynı adres ve mesafede oturum geçerlidir', () => {
    expect(sessionMatchesSelection(session, address, 5)).toBe(true);
  });

  it('adres değiştiyse geçersizdir (eski şubeler yeni konuma ait değil)', () => {
    expect(sessionMatchesSelection(session, otherAddress, 5)).toBe(false);
  });

  it('mesafe değiştiyse geçersizdir', () => {
    expect(sessionMatchesSelection(session, address, 3)).toBe(false);
  });

  it('adres temizlendiyse geçersizdir', () => {
    expect(sessionMatchesSelection(session, null, 5)).toBe(false);
  });

  it('market seçilmemiş oturum geçersizdir', () => {
    expect(sessionMatchesSelection({ ...session, selectedMarkets: [] }, address, 5)).toBe(false);
  });

  it('oturum yoksa geçersizdir', () => {
    expect(sessionMatchesSelection(null, address, 5)).toBe(false);
  });
});

describe('settingsFromSession', () => {
  const defaults = { pages: 1, size: 20 };

  it('geçerli oturumda arama ayarlarını üretir', () => {
    const settings = settingsFromSession(session, address, 5, defaults);
    expect(settings).toMatchObject({
      latitude: address.latitude,
      longitude: address.longitude,
      distance: 5,
      pages: 1,
      size: 20,
      depots: ['a', 'b'],
    });
  });

  it('adres değiştiyse null döner: eski şubelerle arama yapılmaz', () => {
    expect(settingsFromSession(session, otherAddress, 5, defaults)).toBeNull();
  });

  it('mesafe değiştiyse null döner', () => {
    expect(settingsFromSession(session, address, 3, defaults)).toBeNull();
  });
});

describe('hiddenKeysForPreselection', () => {
  it('kayıtlı seçimde olmayan şubeleri gizli işaretler', () => {
    expect(hiddenKeysForPreselection(markets, ['b'], marketKey)).toEqual(new Set(['a']));
  });

  it('tümü seçiliyse hiçbir şube gizlenmez', () => {
    expect(hiddenKeysForPreselection(markets, ['a', 'b'], marketKey)).toEqual(new Set());
  });

  it('id boşken adres konumdan türeyen anahtarı kullanır', () => {
    const noId: Market[] = [{ id: '', name: 'sok', address: 'Incek', distance: 1, latitude: 1, longitude: 2 }];
    expect(marketKey(noId[0])).toBe('sok-Incek-1-2');
    expect(hiddenKeysForPreselection(noId, ['sok-Incek-1-2'], marketKey)).toEqual(new Set());
  });

  it('kayıtlı seçim listeyle hiç örtüşmüyorsa hiçbir şeyi gizlemez', () => {
    expect(hiddenKeysForPreselection(markets, ['yok-1', 'yok-2'], marketKey)).toEqual(new Set());
  });
});
