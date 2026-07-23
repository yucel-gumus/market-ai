import { NextRequest, NextResponse } from 'next/server';
import {
  CACHE_HEADERS,
  DEFAULTS,
  DISTANCE,
  MARKET_API_PATHS,
  TIMEOUTS_MS,
  UPSTREAM_ERROR_DETAIL_MAX,
  USER_AGENT,
} from '@/constants';
import { getMarketApiUrl, isProduction } from '@/lib/env';
import { logger } from '@/lib/logger';

export type MarketProductSearchBody = {
  keywords?: string;
  pages?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
  depots?: string[];
  menuCategory?: boolean;
};

export type MarketApiPath =
  | typeof MARKET_API_PATHS.SEARCH
  | typeof MARKET_API_PATHS.SEARCH_BY_CATEGORIES
  | typeof MARKET_API_PATHS.NEAREST;

/** JSON body'nin plain object olup olmadığını doğrular (null/array/primitive reddedilir) */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateLatLngDistance(body: {
  latitude?: number;
  longitude?: number;
  distance?: number;
}): string | null {
  const { latitude, longitude, distance } = body;

  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return 'Enlem -90 ile 90 arasında bir sayı olmalıdır';
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return 'Boylam -180 ile 180 arasında bir sayı olmalıdır';
  }
  if (
    typeof distance !== 'number' ||
    distance < DISTANCE.MIN_KM ||
    distance > DISTANCE.MAX_KM
  ) {
    return `Mesafe ${DISTANCE.MIN_KM} ile ${DISTANCE.MAX_KM} arasında bir sayı olmalıdır`;
  }
  return null;
}

export function validateMarketProductSearchBody(
  body: MarketProductSearchBody
): string | null {
  const geoError = validateLatLngDistance(body);
  if (geoError) return geoError;
  if (!Array.isArray(body.depots)) {
    return 'depots bir dizi olmalıdır';
  }
  return null;
}

type CallMarketApiResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export async function callMarketApi(
  path: MarketApiPath,
  body: Record<string, unknown>,
  timeoutMs: number = TIMEOUTS_MS.MARKET_API
): Promise<CallMarketApiResult> {
  const apiBaseUrl = getMarketApiUrl();
  if (!apiBaseUrl) {
    logger.error('marketApi', 'MARKET_API_URL ortam değişkeni ayarlanmamış');
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Market API URL'si yapılandırılmamış" },
        { status: 500 }
      ),
    };
  }

  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/${path}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).slice(0, UPSTREAM_ERROR_DETAIL_MAX);
      } catch {
        /* ignore */
      }
      logger.error('marketApi', `Upstream ${path}: ${response.status}`, detail);

      const errorMessage =
        !isProduction() && detail
          ? `Market arama servisi kullanılamıyor: ${response.status} - ${detail}`
          : `Market arama servisi kullanılamıyor: ${response.status}`;

      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: errorMessage },
          { status: response.status }
        ),
      };
    }

    const data = await response.json();
    return { ok: true, data };
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
      logger.error('marketApi', `proxy (${path})`, error.message);
    }

    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      ),
    };
  }
}

export async function proxyMarketApiPost(
  path: Exclude<MarketApiPath, typeof MARKET_API_PATHS.NEAREST>,
  body: Record<string, unknown>
): Promise<NextResponse> {
  const result = await callMarketApi(path, body, TIMEOUTS_MS.MARKET_API);
  if (!result.ok) return result.response;

  const res = NextResponse.json(result.data);
  res.headers.set('Cache-Control', CACHE_HEADERS.SHORT);
  return res;
}

/** search-products ve search-by-categories için ortak POST handler */
export async function handleMarketProductSearchRoute(
  request: NextRequest,
  path: typeof MARKET_API_PATHS.SEARCH | typeof MARKET_API_PATHS.SEARCH_BY_CATEGORIES,
  options: { includeMenuCategory?: boolean } = {}
): Promise<NextResponse> {
  try {
    let raw: unknown;

    try {
      raw = await request.json();
    } catch {
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

    const body = raw as unknown as MarketProductSearchBody;

    if (!body.keywords || String(body.keywords).trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'keywords gerekli' },
        { status: 400 }
      );
    }

    const validationError = validateMarketProductSearchBody(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      keywords: String(body.keywords).trim(),
      pages: typeof body.pages === 'number' ? body.pages : DEFAULTS.PAGE,
      size: typeof body.size === 'number' ? body.size : DEFAULTS.PAGE_SIZE,
      latitude: body.latitude,
      longitude: body.longitude,
      distance: body.distance,
      depots: body.depots,
    };

    if (options.includeMenuCategory) {
      payload.menuCategory =
        typeof body.menuCategory === 'boolean' ? body.menuCategory : false;
    }

    return proxyMarketApiPost(path, payload);
  } catch (error: unknown) {
    console.error(`❌ Market product search (${path}):`, error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
