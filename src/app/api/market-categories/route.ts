import { NextResponse } from 'next/server';
import { MARKET_API_PATHS } from '@/constants';
import { callMarketApi, isPlainObject } from '@/lib/marketApiProxy';

export async function GET() {
  const result = await callMarketApi(MARKET_API_PATHS.CATEGORIES, {}, undefined, 'GET');
  if (!result.ok) return result.response;
  const validNode = (value: unknown): boolean => isPlainObject(value) && typeof value.name === 'string' && typeof value.id === 'number'
    && Array.isArray(value.children) && value.children.every(validNode);
  if (!isPlainObject(result.data) || !Array.isArray(result.data.content) || !result.data.content.length || !result.data.content.every(validNode)) {
    return NextResponse.json({ success: false, error: 'Market kategori yanıtı geçersiz' }, { status: 502 });
  }
  return NextResponse.json(result.data, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } });
}
