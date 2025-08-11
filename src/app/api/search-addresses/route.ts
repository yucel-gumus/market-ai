import { NextRequest, NextResponse } from 'next/server';
import { AddressSearchResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const words = searchParams.get('words');
    if (!words) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gerekli parametre eksik: words' 
        },
        { status: 400 }
      );
    }
    if (words.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Arama sorgusu en az 2 karakter olmalıdır' 
        },
        { status: 400 }
      );
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_ADDRESS_API_URL;
    if (!apiBaseUrl) {
      console.error('❌ NEXT_PUBLIC_ADDRESS_API_URL ortam değişkeni ayarlanmamış');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Adres API URL\'si yapılandırılmamış' 
        },
        { status: 500 }
      );
    }

    const apiUrl = `${apiBaseUrl}/AutoSuggestion/Search?words=${encodeURIComponent(words)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MarketAI/1.0',
      },
      signal: AbortSignal.timeout(8000), 
    });
    if (!response.ok) {
      console.error(`❌ Adres API Hatası: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Adres arama servisi kullanılamıyor: ${response.status}` 
        },
        { status: response.status }
      );
    }


    const data: AddressSearchResult[] = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });

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

      console.error('❌ Adres Arama API Hatası:', {
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
