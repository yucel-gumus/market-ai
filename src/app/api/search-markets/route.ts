import { NextRequest, NextResponse } from 'next/server';
import { CACHE_HEADERS, MARKET_API_PATHS, TIMEOUTS_MS } from '@/constants';
import {
  callMarketApi,
  isPlainObject,
  validateLatLngDistance,
} from '@/lib/marketApiProxy';
import { Market, MarketSearchRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    let raw: unknown;

    try {
      raw = await request.json();
    } catch (parseError) {
      console.error('❌ İstek gövdesinde geçersiz JSON:', parseError);
      return NextResponse.json(
        { success: false, error: 'İstek gövdesinde geçersiz JSON' },
        { status: 400 }
      );
    }

    if (!isPlainObject(raw)) {
      return NextResponse.json(
        { success: false, error: 'İstek gövdesi bir nesne olmalıdır' },
        { status: 400 }
      );
    }

    const body = raw as unknown as MarketSearchRequest;
    const { distance, latitude, longitude } = body;

    const validationError = validateLatLngDistance({
      distance,
      latitude,
      longitude,
    });
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const result = await callMarketApi(
      MARKET_API_PATHS.NEAREST,
      { distance, latitude, longitude },
      TIMEOUTS_MS.MARKET_NEAREST
    );

    if (!result.ok) return result.response;

    const data = result.data as Market[];
    const res = NextResponse.json({
      success: true,
      data,
      metadata: {
        distance,
        coordinates: { latitude, longitude },
        count: Array.isArray(data) ? data.length : 0,
      },
    });
    res.headers.set('Cache-Control', CACHE_HEADERS.MEDIUM);
    return res;
  } catch (error: unknown) {
    let errorMessage = 'Sunucu hatası';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = 'Market arama servisi zaman aşımı';
        statusCode = 504;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Market arama servisi kullanılamıyor';
        statusCode = 503;
      }
      console.error('❌ Market Arama API Hatası:', {
        message: error.message,
        name: error.name,
      });
    } else {
      console.error('❌ Bilinmeyen hata:', error);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
