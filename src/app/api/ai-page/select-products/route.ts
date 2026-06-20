import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../_proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return proxyToBackend('select-products', body);
  } catch (error) {
    console.error('❌ select-products isteği parse edilemedi:', error);
    return NextResponse.json(
      { success: false, error: 'Geçersiz istek gövdesi' },
      { status: 400 }
    );
  }
}
