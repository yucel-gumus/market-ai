import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../_proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return proxyToBackend('recipe-with-calories', body);
  } catch (error) {
    console.error('❌ recipe-with-calories isteği parse edilemedi:', error);
    return NextResponse.json(
      { success: false, error: 'Geçersiz istek gövdesi' },
      { status: 400 }
    );
  }
}
