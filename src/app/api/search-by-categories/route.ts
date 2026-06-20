import { NextRequest, NextResponse } from 'next/server';
import {
  MarketProductSearchBody,
  proxyMarketApiPost,
  validateMarketProductSearchBody,
} from '@/lib/marketApiProxy';

export async function POST(request: NextRequest) {
  let body: MarketProductSearchBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'İstek gövdesinde geçersiz JSON' },
      { status: 400 }
    );
  }

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
    pages: typeof body.pages === 'number' ? body.pages : 0,
    size: typeof body.size === 'number' ? body.size : 50,
    latitude: body.latitude,
    longitude: body.longitude,
    distance: body.distance,
    depots: body.depots,
    menuCategory: typeof body.menuCategory === 'boolean' ? body.menuCategory : false,
  };

  return proxyMarketApiPost('searchByCategories', payload);
}