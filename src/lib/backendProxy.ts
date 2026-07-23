import { NextRequest, NextResponse } from 'next/server';
import { TIMEOUTS_MS } from '@/constants';
import { getPythonApiKey, getPythonApiUrl } from '@/lib/env';
import { logger } from '@/lib/logger';
import { isPlainObject } from '@/lib/marketApiProxy';

/** Python LLM backend'e ortak proxy */
export async function proxyToBackend(
  operation: string,
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
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    let message = 'LLM isteği başarısız';

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        message = 'LLM backend zaman aşımına uğradı';
      } else {
        message = error.message;
      }
    }

    logger.error('llm', 'proxy hatası', { operation, error });

    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

/** ai-page route'ları için ortak POST fabrikası */
export function createBackendProxyHandler(operation: string) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    try {
      let raw: unknown;

      try {
        raw = await request.json();
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
