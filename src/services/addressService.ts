import { SEARCH } from '@/constants';
import { parseAddressResult } from '@/lib/addressParse';
import apiClient from '@/lib/axios';
import { logger } from '@/lib/logger';
import { AddressSearchResult, ParsedAddress, ApiResponse } from '@/types';

export class AddressService {
  static async searchAddresses(query: string): Promise<ParsedAddress[]> {
    if (!query || query.length < SEARCH.MIN_QUERY_LENGTH) {
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
      logger.error('addressService', 'Adres arama başarısız', error);

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
          return parseAddressResult(raw);
        } catch (parseError) {
          logger.error('addressService', `${index} numaralı adres parse edilemedi`, parseError);
          return null;
        }
      })
      .filter((address): address is ParsedAddress => address !== null)
      .slice(0, SEARCH.ADDRESS_RESULT_LIMIT);
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
}
