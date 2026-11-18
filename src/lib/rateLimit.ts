import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const buckets = new Map<string, { resetAt: number; count: number }>();
let lastPrune = Date.now();

function getClientIp(request: NextRequest): string {
  const realIp = request.headers?.get?.('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return 'unknown';
}

function pruneExpired(now: number) {
  if (now - lastPrune < WINDOW_MS) return;
  lastPrune = now;
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
}

/** İstemci IP + endpoint kovası başına sabit pencereli hız sınırı uygular. */
export function checkRateLimit(
  request: NextRequest,
  bucket: string,
  limitPerMinute: number
): NextResponse | null {
  const now = Date.now();
  pruneExpired(now);

  const key = `${bucket}:${getClientIp(request)}`;
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { resetAt: now + WINDOW_MS, count: 1 });
    return null;
  }

  entry.count += 1;
  if (entry.count > limitPerMinute) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      { success: false, error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } }
    );
  }

  return null;
}
