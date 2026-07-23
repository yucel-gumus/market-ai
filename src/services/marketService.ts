import { DISTANCE } from '@/constants';
import apiClient from '@/lib/axios';
import { haversineKm } from '@/lib/geo';
import { logger } from '@/lib/logger';
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
      logger.error('marketService', 'Market arama başarısız', error);
      
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

    if (
      typeof distance !== 'number' ||
      distance < DISTANCE.MIN_KM ||
      distance > DISTANCE.MAX_KM
    ) {
      logger.warn('marketService', 'Geçersiz mesafe', distance);
      return false;
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      logger.warn('marketService', 'Geçersiz enlem', latitude);
      return false;
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      logger.warn('marketService', 'Geçersiz boylam', longitude);
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
          logger.error('marketService', `${index} market parse edilemedi`, parseError);
          return null;
        }
      })
      .filter((market): market is Market => market !== null)
      .sort((a, b) => a.distance - b.distance);
  }

  private static parseDistance(value: unknown): number {
    const distance = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(distance)) return 0;
    
    if (distance > 100) {
      return Math.round((distance / 1000) * 100) / 100; 
    }
    
    return Math.max(0, distance);
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
    const d = haversineKm(lat1, lon1, lat2, lon2);
    return Number.isFinite(d) ? d : 0;
  }

  static formatDistance(distance: number): string {
    if (distance < 0.01) return '< 10m';
    if (distance < 0.1) return `${Math.round(distance * 1000)}m`;
    if (distance < 1) return `${Math.round(distance * 100) / 100}km`;
    return `${Math.round(distance * 10) / 10}km`;
  }

  static getDistanceOptions() {
    return [...DISTANCE.OPTIONS];
  }
}
