
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

export interface ProductSearchRequest {
  keywords?: string;
  menu_category?: string[];
  main_category?: string[];
  sub_category?: string[];
  market_names?: string[];
  brand?: string[];
  refined_quantity_unit?: string[];
  refined_volume_weight?: string[];
  offer_price?: string[];
  offer_discount?: string[];
  order?: { name: 'lowest_price' | 'offer_unit_price'; type: 'asc' | 'desc' };
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
  unitPriceValue?: number;
  indexTime?: string;
  discount?: boolean;
  discountRatio?: number | null;
  promotionText?: string | null;
  marketAdi: string;
  latitude?: number;
  longitude?: number;
  id?: string;
}

export interface Product {
  id: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  refinedVolumeOrWeight?: string;
  main_category?: string;
  menu_category?: string;
  categories?: string[];
  productDepotInfoList: ProductDepotInfo[];
  /** Market servisinden fiyatların alındığı zaman; kaynağın fiyat güncelleme tarihi değildir. */
  priceCheckedAt?: string;
}

export interface ProductSearchResponse {
  checkedAt?: string;
  content: Product[];
  numberOfFound?: number;
  searchResultType?: number;
  facetMap?: Record<string, unknown> | null;
  /** Legacy field is optional; the live service does not return it. */
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface MarketCategory {
  id: number;
  parentId: number | null;
  name: string;
  children: MarketCategory[];
}

export interface CartItem {
  product: Product;
  selectedDepot: ProductDepotInfo;
  addedAt: Date;
  quantity?: number;
}

export type ShoppingMode = 'single' | 'two' | 'cheapest';

export interface ShoppingOption {
  mode: ShoppingMode;
  items: CartItem[];
  totalCost: number;
  marketCount: number;
  feasible: boolean;
  reason?: string;
  /** Kuş uçuşu, başlangıçtan mağazalara; eve dönüş dahil değildir. */
  estimatedWalkMinutes?: number;
}

export interface OptimizedShopping {
  totalQuantity?: number;
  unavailableProducts?: Product[];
  marketGroups: MarketGroup[];
  totalCost: number;
  marketCount: number;
  /** Aynı sepetin en ucuz tek şubedeki maliyetine göre fark. */
  totalSavings?: number;
  mode?: ShoppingMode;
  options?: ShoppingOption[];
  singleStoreCost?: number;
  extraWalkMinutes?: number;
  oldestPriceCheck?: string;
  hasUnknownPriceChecks?: boolean;
  route?: RouteStep[];
}

/** localStorage / store'a yazılan market arama oturumu */
export interface MarketSearchSession {
  distance: number;
  selectedAddress: ParsedAddress | null;
  selectedMarkets: Market[];
  timestamp?: string;
  totalMarkets?: number;
  selectedCount?: number;
}

export interface MarketGroup {
  depotKey: string;
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

export interface ConsolidationBranch {
  depotId: string;
  depotName?: string;
  marketAdi?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ConsolidationItem {
  ingredient: string;
  product: Product;
  depotId: string;
  price: number;
}

export interface ConsolidationSwitch {
  ingredient: string;
  fromTitle?: string;
  toTitle?: string;
  /** Fark hesaplanamadıysa sunucu null gönderir. */
  delta?: number | null;
}

export interface ConsolidationPlan {
  branches: ConsolidationBranch[];
  total: number;
  delta: number;
  items: ConsolidationItem[];
  switches: ConsolidationSwitch[];
}

export interface ConsolidationPlans {
  single?: ConsolidationPlan | null;
  two?: ConsolidationPlan | null;
}

export interface SearchStats {
  totalResults: number;
  loadedResults?: number;
  complete?: boolean;
  loadingMore?: boolean;
}

export interface RouteInfo {
  distance: string | number;
  time: string | number;
  timeText?: string;
  routeType?: string;
  error?: string;
}
