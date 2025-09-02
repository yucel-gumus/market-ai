import { NextRequest, NextResponse } from 'next/server';
import { MarketSearchRequest, Market } from '@/types';

export async function POST(request: NextRequest) {
  try {
    let body: MarketSearchRequest;
    
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ İstek gövdesinde geçersiz JSON:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'İstek gövdesinde geçersiz JSON' 
        },
        { status: 400 }
      );
    }

    const { distance, latitude, longitude } = body;

    if (typeof distance !== 'number' || distance < 1 || distance > 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesafe 1 ile 10 arasında bir sayı olmalıdır' 
        },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enlem -90 ile 90 arasında bir sayı olmalıdır' 
        },
        { status: 400 }
      );
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Boylam -180 ile 180 arasında bir sayı olmalıdır' 
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_MARKET_API_URL;
    if (!apiBaseUrl) {
      console.error('❌ NEXT_PUBLIC_MARKET_API_URL ortam değişkeni ayarlanmamış');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Market API URL\'si yapılandırılmamış' 
        },
        { status: 500 }
      );
    }

    const apiUrl = `${apiBaseUrl}/nearest`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MarketAI/1.0',
      },
      body: JSON.stringify({
        distance,
        latitude,
        longitude,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`❌ Market API Hatası: ${response.status} ${response.statusText}`);
      
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData ? ` - ${errorData}` : '';
      } catch {
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Market arama servisi kullanılamıyor: ${response.status}${errorDetails}` 
        },
        { status: response.status }
      );
    }

    const data: Market[] = await response.json();

    const res = NextResponse.json({
      success: true,
      data: data,
      metadata: {
        distance,
        coordinates: { latitude, longitude },
        count: data.length,
      },
    });
    // Short-lived cache to reduce backend pressure
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
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
        stack: error.stack,
      });
    } else {
      console.error('❌ Bilinmeyen hata:', error);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: statusCode }
    );
  }
}
