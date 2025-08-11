import apiClient from '@/lib/axios';
import { MarketSearchRequest, Market, ApiResponse } from '@/types';

export class MarketService {

  static async searchNearbyMarkets(request: MarketSearchRequest): Promise<Market[]> {
    if (!this.validateSearchRequest(request)) {
      throw new Error('Geçersiz market arama parametreleri');
    }

    try {
      const response = await apiClient.post<ApiResponse<Market[]>>(
        '/search-markets',
        request
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Market arama başarısız');
      }

      return this.transformMarkets(response.data.data, request);
      
    } catch (error: unknown) {
      console.error('❌ Market arama başarısız:', error);
      
      if (error && typeof error === 'object' && 'isNetworkError' in error) {
        throw new Error('Market arama sırasında ağ hatası oluştu');
      }
      
      if (error instanceof Error) {
        throw new Error(error.message || 'Market arama başarısız');
      }
      
      throw new Error('Market arama başarısız');
    }
  }
  private static validateSearchRequest(request: MarketSearchRequest): boolean {
    const { distance, latitude, longitude } = request;

    if (typeof distance !== 'number' || distance < 1 || distance > 10) {
      console.error('❌ Geçersiz mesafe:', distance);
      return false;
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      console.error('❌ Geçersiz enlem:', latitude);
      return false;
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      console.error('❌ Geçersiz boylam:', longitude);
      return false;
    }

    return true;
  }
  private static transformMarkets(rawMarkets: unknown[], searchRequest: MarketSearchRequest): Market[] {
    if (!Array.isArray(rawMarkets)) {
      return [];
    }

    return rawMarkets
      .map((rawMarket: unknown, index) => {
        try {
          const marketData = rawMarket as Record<string, unknown>;
          const location = marketData.location as { lat?: number; lon?: number } || {};
          
          const market: Market = {
            id: String(marketData.id || marketData.Id || `market-${index}`),
            name: String(marketData.marketName || marketData.name || marketData.Name || 'Unknown Market'),
            address: String(marketData.sellerName || marketData.address || marketData.Address || marketData.fullAddress || 'Address not available'),
            distance: this.parseDistance(marketData.distance || marketData.Distance || 0),
            latitude: this.parseCoordinate(location.lat || marketData.latitude || marketData.Latitude || 0),
            longitude: this.parseCoordinate(location.lon || marketData.longitude || marketData.Longitude || 0),
          };

          if (!market.name || !market.address) {
            return null;
          }

          if (!market.distance && market.latitude && market.longitude) {
            market.distance = this.calculateDistance(
              searchRequest.latitude,
              searchRequest.longitude,
              market.latitude,
              market.longitude
            );
          }

          return market;
        } catch (parseError) {
          console.error(`❌ ${index} numaralı market parse edilemedi:`, parseError);
          return null;
        }
      })
      .filter((market): market is Market => market !== null)
      .sort((a, b) => a.distance - b.distance);
  }

  private static parseDistance(value: unknown): number {
    const distance = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(distance) ? 0 : Math.max(0, distance);
  }
  private static parseCoordinate(value: unknown): number {
    const coordinate = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(coordinate) ? 0 : coordinate;
  }
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
  }
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  static formatDistance(distance: number): string {
    if (distance < 0.01) {
      return '< 10m';
    } else if (distance < 0.1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 1) {
      return `${Math.round(distance * 100) / 100}km`;
    } else {
      return `${Math.round(distance * 10) / 10}km`;
    }
  }
  static getDistanceOptions() {
    return [
      { value: 1, label: '1 km' },
      { value: 2, label: '2 km' },
      { value: 3, label: '3 km' },
      { value: 5, label: '5 km' },
      { value: 7, label: '7 km' },
      { value: 10, label: '10 km' },
    ];
  }
}
