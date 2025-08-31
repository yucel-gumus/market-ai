
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
  brand?: string;
  logo?: string;
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

export interface ProductSearchRequest {
  keywords: string;
  pages: number;
  size: number;
  latitude: number;
  longitude: number;
  distance: number;
  depots: string[];
}

export interface ProductDepotInfo {
  depotId: string;
  depotName: string;
  price: number;
  unitPrice: string;
  marketAdi: string;
  latitude?: number;
  longitude?: number;
  id?: string;
}

export interface Product {
  id: string;
  title: string;
  refinedVolumeOrWeight?: string;
  productDepotInfoList: ProductDepotInfo[];
}

export interface ProductSearchResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CartItem {
  product: Product;
  selectedDepot: ProductDepotInfo;
  addedAt: Date;
}

export interface OptimizedShopping {
  marketGroups: MarketGroup[];
  totalCost: number;
  marketCount: number;
  route?: RouteStep[];
}

export interface MarketGroup {
  marketName: string;
  depotInfo: ProductDepotInfo;
  items: CartItem[];
  subtotal: number;
  distance?: number;
}

export interface RouteStep {
  marketName: string;
  depot: ProductDepotInfo;
  items: CartItem[];
  stepNumber: number;
  distanceFromPrevious?: number;
  estimatedTime?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchSettings {
  latitude: number;
  longitude: number;
  distance: number;
  pages: number;
  size: number;
  depots: string[];
  selectedMarkets: Market[];
}

export interface SearchStats {
  totalResults: number;
}

export interface RouteInfo {
  distance: string | number;
  time: string | number;
  timeText?: string;
  routeType?: string;
  error?: string;
}
