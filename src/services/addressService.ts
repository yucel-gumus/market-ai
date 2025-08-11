import apiClient from '@/lib/axios';
import { AddressSearchResult, ParsedAddress, ApiResponse } from '@/types';

export class AddressService {
  static async searchAddresses(query: string): Promise<ParsedAddress[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await apiClient.get<ApiResponse<AddressSearchResult[]>>(
        '/search-addresses',
        {
          params: { words: query },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Adres arama başarısız');
      }

      return this.transformAddresses(response.data.data);
      
    } catch (error: unknown) {
      console.error('❌ Adres arama başarısız:', error);
      
      if (error && typeof error === 'object' && 'isNetworkError' in error) {
        throw new Error('Adres arama sırasında ağ hatası oluştu');
      }
      
      if (error instanceof Error) {
        throw new Error(error.message || 'Adres arama başarısız');
      }
      
      throw new Error('Adres arama başarısız');
    }
  }

  private static transformAddresses(rawAddresses: AddressSearchResult[]): ParsedAddress[] {
    return rawAddresses
      .map((raw, index) => {
        try {
          const parsedAddress: ParsedAddress = {
            fullAddress: raw[0] || '',
            street: raw[3] || '',
            neighborhood: raw[4] || '',
            district: raw[5] || '',
            city: raw[6] || '',
            longitude: Number(raw[7]) || 0,
            latitude: Number(raw[8]) || 0,
            additionalInfo: raw[15] || '',
          };

          if (!parsedAddress.fullAddress || 
              !parsedAddress.latitude || 
              !parsedAddress.longitude) {
            return null;
          }

          return parsedAddress;
        } catch (parseError) {
          console.error(`❌ ${index} numaralı adres parse edilemedi:`, parseError);
          return null;
        }
      })
      .filter((address): address is ParsedAddress => address !== null)
      .slice(0, 10);
  }
  static formatAddressForDisplay(address: ParsedAddress): string {
    const parts = [
      address.street,
      address.neighborhood,
      address.district,
      address.city,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : address.fullAddress;
  }
  static getShortAddress(address: ParsedAddress): string {
    const parts = [
      address.neighborhood,
      address.district,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : address.city || address.fullAddress;
  }
}
