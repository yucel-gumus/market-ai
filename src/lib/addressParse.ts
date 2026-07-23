import type { AddressSearchResult, ParsedAddress } from '@/types';

/**
 * Upstream adres API tuple alanları (sabit index sözleşmesi).
 * raw[0]=full, raw[3]=street, raw[4]=neighborhood, raw[5]=district,
 * raw[6]=city, raw[7]=lon, raw[8]=lat, raw[15]=extra
 */
export function parseAddressResult(raw: AddressSearchResult): ParsedAddress | null {
  const fullAddress = raw[0] || '';
  const longitude = Number(raw[7]) || 0;
  const latitude = Number(raw[8]) || 0;

  if (!fullAddress || !latitude || !longitude) return null;

  return {
    fullAddress,
    street: raw[3] || '',
    neighborhood: raw[4] || '',
    district: raw[5] || '',
    city: raw[6] || '',
    longitude,
    latitude,
    additionalInfo: raw[15] || '',
  };
}
