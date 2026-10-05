import { NextRequest, NextResponse } from 'next/server';
import {
  ACCEPT_LANGUAGE,
  CACHE_HEADERS,
  DEFAULTS,
  DISTANCE,
  MARKET_API_PATHS,
  MARKET_ORIGIN,
  MARKET_REFERER,
  TIMEOUTS_MS,
  UPSTREAM_ERROR_DETAIL_MAX,
  USER_AGENT,
} from '@/constants';
import { getMarketApiUrl, isProduction } from '@/lib/env';
import { logger } from '@/lib/logger';

export type MarketProductSearchBody = Partial<import('@/types').ProductSearchRequest> & { identities?: string[]; identityType?: string };
export type MarketApiPath = typeof MARKET_API_PATHS[keyof typeof MARKET_API_PATHS];
export const MARKET_FILTER_FIELDS = ['menu_category', 'main_category', 'sub_category', 'market_names', 'brand', 'refined_quantity_unit', 'refined_volume_weight', 'offer_price', 'offer_discount'] as const;

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

  if (!Number.isFinite(latitude) || typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return 'Enlem -90 ile 90 arasında bir sayı olmalıdır';
  }
  if (!Number.isFinite(longitude) || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return 'Boylam -180 ile 180 arasında bir sayı olmalıdır';
  }
  if (
    !Number.isFinite(distance) || typeof distance !== 'number' ||
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
  if (!Array.isArray(body.depots) || !body.depots.length || body.depots.length > 1000 || body.depots.some(d => typeof d !== 'string' || !d.trim() || d.length > 200)) {
    return 'depots bir dizi olmalıdır';
  }
  if (body.pages !== undefined && (!Number.isSafeInteger(body.pages) || body.pages < 0)) return 'pages sıfır veya pozitif tam sayı olmalıdır';
  if (body.size !== undefined && (!Number.isInteger(body.size) || body.size < 1 || body.size > DEFAULTS.MAX_PAGE_SIZE)) return `size 1 ile ${DEFAULTS.MAX_PAGE_SIZE} arasında tam sayı olmalıdır`;
  for (const field of MARKET_FILTER_FIELDS) {
    const values = body[field];
    if (values !== undefined && (!Array.isArray(values) || values.length > 100 || values.some(v => typeof v !== 'string' || !v.trim() || v.length > 200))) return `${field} geçerli metinlerden oluşan bir dizi olmalıdır`;
  }
  if (body.order && (!['lowest_price', 'offer_unit_price'].includes(body.order.name) || !['asc', 'desc'].includes(body.order.type))) return 'Geçersiz sıralama';
  return null;
}

type CallMarketApiResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export async function callMarketApi(
  path: MarketApiPath,
  body: Record<string, unknown>,
  timeoutMs: number = TIMEOUTS_MS.MARKET_API,
  method: 'GET' | 'POST' = 'POST'
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

  const apiRoot = apiBaseUrl.replace(/\/$/, '').replace(/\/v\d+$/, '');
  const apiUrl = `${apiRoot}/${path}`;

  try {
    const response = await fetch(apiUrl, {
      method,
      headers: {
        Accept: 'application/json',
        'Accept-Language': ACCEPT_LANGUAGE,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Referer: MARKET_REFERER,
        Origin: MARKET_ORIGIN,
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
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

  const res = NextResponse.json(isPlainObject(result.data)
    ? { ...result.data, checkedAt: new Date().toISOString() } : result.data);
  res.headers.set('Cache-Control', CACHE_HEADERS.SHORT);
  return res;
}

/** search-products ve search-by-categories için ortak POST handler */
export async function handleMarketProductSearchRoute(
  request: NextRequest,
  path: typeof MARKET_API_PATHS.SEARCH | typeof MARKET_API_PATHS.SEARCH_BY_CATEGORIES | typeof MARKET_API_PATHS.LIST_SYNC
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

    const hasKeywords = typeof body.keywords === 'string' && body.keywords.trim().length > 0 && body.keywords.length <= 500;
    const hasCategories = ['menu_category', 'main_category', 'sub_category'].some(field => Array.isArray(raw[field]) && (raw[field] as unknown[]).length > 0);
    if (path === MARKET_API_PATHS.LIST_SYNC) {
      if (body.identityType !== 'id' || !Array.isArray(body.identities) || !body.identities.length || body.identities.length > 100 || body.identities.some(id => typeof id !== 'string' || !id.trim() || id.length > 100)) {
        return NextResponse.json({ success: false, error: 'Geçerli ürün kimlikleri gerekli' }, { status: 400 });
      }
    } else if ((path === MARKET_API_PATHS.SEARCH && !hasKeywords) || (path === MARKET_API_PATHS.SEARCH_BY_CATEGORIES && !hasCategories)) {
      return NextResponse.json({ success: false, error: 'Geçerli arama kelimesi veya kategori gerekli' }, { status: 400 });
    }

    const validationError = validateMarketProductSearchBody(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      ...(hasKeywords ? { keywords: body.keywords!.trim() } : {}),
      pages: typeof body.pages === 'number' ? body.pages : DEFAULTS.PAGE,
      size: typeof body.size === 'number' ? body.size : DEFAULTS.PAGE_SIZE,
      latitude: body.latitude,
      longitude: body.longitude,
      distance: body.distance,
      depots: body.depots,
    };

    for (const field of MARKET_FILTER_FIELDS) if (body[field] !== undefined) payload[field] = body[field];
    if (body.order) payload.order = body.order;
    if (path === MARKET_API_PATHS.LIST_SYNC) { payload.identities = body.identities; payload.identityType = 'id'; }

    return proxyMarketApiPost(path, payload);
  } catch (error: unknown) {
    console.error(`❌ Market product search (${path}):`, error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
