
export interface AddressSearchResult {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: number;
  8: number;
  9: number;
  10: number;
  11: number;
  12: number;
  13: number;
  14: number;
  15: string;
  16: number;
  17: string;
}

export interface ParsedAddress {
  fullAddress: string;
  street: string;
  neighborhood: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  additionalInfo: string;
}

export interface MarketSearchRequest {
  distance: number;
  latitude: number;
  longitude: number;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
export interface DistanceOption {
  value: number;
  label: string;
}
