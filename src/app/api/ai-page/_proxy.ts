import { NextResponse } from 'next/server';

const BACKEND_TIMEOUT_MS = 60_000;

export async function proxyToBackend(
  operation: string,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL;
  const apiKey = process.env.PYTHON_API_KEY;

  if (!apiBaseUrl || !apiKey) {
    console.error('❌ LLM backend yapılandırması eksik');
    return NextResponse.json(
      { success: false, error: 'LLM backend yapılandırılmamış' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/market-ai/${operation}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
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

    console.error('❌ LLM proxy hatası:', { operation, error });

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
