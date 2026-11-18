import { NextRequest, NextResponse } from 'next/server';
import { DISTANCE, TIMEOUTS_MS } from '@/constants';
import { getPythonApiKey, getPythonApiUrl, isProduction } from '@/lib/env';
import { logger } from '@/lib/logger';
import { isPlainObject, validateLatLngDistance } from '@/lib/marketApiProxy';
import { checkRateLimit } from '@/lib/rateLimit';

export type BackendOperation = 'recipe-list' | 'recipe-with-calories' | 'select-products';

const MAX_BACKEND_BODY_BYTES = 32_768;

export function validateBackendPayload(
  operation: BackendOperation,
  raw: Record<string, unknown>
): string | null {
  const recipeName = typeof raw.recipe_name === 'string' ? raw.recipe_name.trim() : '';
  if (recipeName.length < 2 || recipeName.length > 300) {
    return 'Geçerli bir yemek adı gerekli (2-300 karakter)';
  }

  if (operation === 'select-products') {
    const ingredients = raw.ingredients;
    const validIngredients =
      (typeof ingredients === 'string' && ingredients.trim().length >= 1 && ingredients.length <= 4000) ||
      (Array.isArray(ingredients) &&
        ingredients.length >= 1 &&
        ingredients.length <= 60 &&
        ingredients.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 120));
    if (!validIngredients) return 'Geçerli malzeme listesi gerekli';

    if (raw.latitude !== undefined || raw.longitude !== undefined || raw.distance !== undefined) {
      const hasCoords = raw.latitude !== undefined || raw.longitude !== undefined;
      const geoError = validateLatLngDistance({
        latitude: hasCoords ? (raw.latitude as number) : 0,
        longitude: hasCoords ? (raw.longitude as number) : 0,
        distance: raw.distance !== undefined ? (raw.distance as number) : DISTANCE.MIN_KM,
      });
      if (geoError) return geoError;
    }

    if (
      raw.depots !== undefined &&
      (!Array.isArray(raw.depots) ||
        raw.depots.length < 1 ||
        raw.depots.length > 1000 ||
        raw.depots.some((d) => typeof d !== 'string' || !d.trim() || d.length > 200))
    ) {
      return 'Geçerli mağaza kimlik listesi gerekli';
    }

    if (
      raw.ingredient_details !== undefined &&
      (!Array.isArray(raw.ingredient_details) ||
        raw.ingredient_details.length > 60 ||
        raw.ingredient_details.some(
          (item) =>
            !isPlainObject(item) ||
            typeof item.name !== 'string' ||
            !item.name.trim() ||
            item.name.length > 120 ||
            typeof item.amount !== 'number' ||
            !Number.isFinite(item.amount) ||
            item.amount <= 0 ||
            !['g', 'ml', 'adet'].includes(String(item.unit))
        ))
    ) {
      return 'Geçerli malzeme miktar bilgileri gerekli';
    }
  }

  return null;
}

/** Python LLM backend'e ortak proxy */
export async function proxyToBackend(
  operation: BackendOperation,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const apiBaseUrl = getPythonApiUrl();
  const apiKey = getPythonApiKey();

  if (!apiBaseUrl || !apiKey) {
    logger.error('llm', 'LLM backend yapılandırması eksik');
    return NextResponse.json(
      { success: false, error: 'LLM backend yapılandırılmamış' },
      { status: 500 }
    );
  }

  const base = apiBaseUrl.replace(/\/$/, '');

  try {
    const response = await fetch(`${base}/api/market-ai/${operation}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUTS_MS.LLM_BACKEND),
      cache: 'no-store',
    });

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = { success: false, error: 'Backend yanıtı JSON olarak ayrıştırılamadı' };
    }

    if (!response.ok) {
      const errorMessage =
        (data?.detail as string) ||
        (data?.message as string) ||
        (data?.error as string) ||
        'Backend hatası';

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    let message = 'LLM servisine ulaşılamadı';

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        message = 'LLM backend zaman aşımına uğradı';
      } else if (!isProduction()) {
        message = error.message;
      }
    }

    logger.error('llm', 'proxy hatası', { operation, error });

    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

/** ai-page route'ları için ortak POST fabrikası */
export function createBackendProxyHandler(operation: BackendOperation) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    const limited = checkRateLimit(request, `ai:${operation}`, 20);
    if (limited) return limited;

    try {
      const text = await request.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_BACKEND_BODY_BYTES) {
        return NextResponse.json(
          { success: false, error: 'İstek gövdesi çok büyük' },
          { status: 413 }
        );
      }

      let raw: unknown;

      try {
        raw = JSON.parse(text);
      } catch (error) {
        logger.error('llm', `${operation} parse edilemedi`, error);
        return NextResponse.json(
          { success: false, error: 'Geçersiz istek gövdesi' },
          { status: 400 }
        );
      }

      if (!isPlainObject(raw)) {
        return NextResponse.json(
          { success: false, error: 'İstek gövdesi bir nesne olmalıdır' },
          { status: 400 }
        );
      }

      const validationError = validateBackendPayload(operation, raw);
      if (validationError) {
        return NextResponse.json(
          { success: false, error: validationError },
          { status: 400 }
        );
      }

      return proxyToBackend(operation, raw);
    } catch (error) {
      logger.error('llm', `${operation} beklenmeyen hata`, error);
      return NextResponse.json(
        { success: false, error: 'Sunucu hatası' },
        { status: 500 }
      );
    }
  };
}
