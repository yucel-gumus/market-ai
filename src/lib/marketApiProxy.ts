import { NextResponse } from 'next/server';

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

export function validateMarketProductSearchBody(
  body: MarketProductSearchBody
): string | null {
  const { latitude, longitude, distance } = body;

  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return 'Enlem -90 ile 90 arasında bir sayı olmalıdır';
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return 'Boylam -180 ile 180 arasında bir sayı olmalıdır';
  }
  if (typeof distance !== 'number' || distance < 1 || distance > 10) {
    return 'Mesafe 1 ile 10 arasında bir sayı olmalıdır';
  }
  if (!Array.isArray(body.depots)) {
    return 'depots bir dizi olmalıdır';
  }
  return null;
}

export async function proxyMarketApiPost(
  path: 'search' | 'searchByCategories',
  body: Record<string, unknown>
): Promise<NextResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_MARKET_API_URL;
  if (!apiBaseUrl) {
    console.error('❌ NEXT_PUBLIC_MARKET_API_URL ortam değişkeni ayarlanmamış');
    return NextResponse.json(
      { success: false, error: 'Market API URL\'si yapılandırılmamış' },
      { status: 500 }
    );
  }

  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/${path}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MarketAI/1.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).slice(0, 500);
      } catch {
        /* ignore */
      }
      console.error(`❌ Market API (${path}): ${response.status}`, detail);
      return NextResponse.json(
        {
          success: false,
          error: `Market arama servisi kullanılamıyor: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
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
      console.error(`❌ Market API proxy (${path}):`, error.message);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}