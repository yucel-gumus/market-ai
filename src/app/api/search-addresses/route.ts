import { NextRequest, NextResponse } from 'next/server';
import { CACHE_HEADERS, SEARCH, TIMEOUTS_MS, USER_AGENT } from '@/constants';
import { getAddressApiUrl } from '@/lib/env';
import { logger } from '@/lib/logger';
import { AddressSearchResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const words = searchParams.get('words');

    if (!words) {
      return NextResponse.json(
        { success: false, error: 'Gerekli parametre eksik: words' },
        { status: 400 }
      );
    }

    if (words.length < SEARCH.MIN_QUERY_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Arama sorgusu en az ${SEARCH.MIN_QUERY_LENGTH} karakter olmalıdır`,
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = getAddressApiUrl();
    if (!apiBaseUrl) {
      logger.error('addressApi', 'ADDRESS_API_URL ortam değişkeni ayarlanmamış');
      return NextResponse.json(
        { success: false, error: "Adres API URL'si yapılandırılmamış" },
        { status: 500 }
      );
    }

    const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/AutoSuggestion/Search?words=${encodeURIComponent(words)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(TIMEOUTS_MS.ADDRESS_API),
    });

    if (!response.ok) {
      logger.error('addressApi', `Upstream: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Adres arama servisi kullanılamıyor: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data: AddressSearchResult[] = await response.json();
    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', CACHE_HEADERS.MEDIUM);
    return res;
  } catch (error: unknown) {
    let errorMessage = 'Sunucu hatası';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = 'Adres arama servisi zaman aşımı';
        statusCode = 504;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Adres arama servisi kullanılamıyor';
        statusCode = 503;
      }

      logger.error('addressApi', 'Arama hatası', {
        message: error.message,
        name: error.name,
      });
    } else {
      logger.error('addressApi', 'Bilinmeyen hata', error);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
