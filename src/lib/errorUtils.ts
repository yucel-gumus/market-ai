type ApiLikeError = Error & {
  status?: number | string;
  message: string;
  isNetworkError?: boolean;
};

export function isApiError(
  error: Error,
  statusCodes: number[] = [400, 404]
): boolean {
  const e = error as ApiLikeError;
  if (typeof e.status === 'number' && statusCodes.includes(e.status)) {
    return true;
  }
  return statusCodes.some((code) => e.message?.includes(code.toString()));
}

const ERROR_MESSAGES = {
  NETWORK: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
  API_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  NOT_FOUND: 'Aranan bilgi bulunamadı.',
  INVALID_INPUT: 'Geçersiz giriş. Lütfen bilgileri kontrol edin.',
  GENERIC: 'Bir hata oluştu. Lütfen tekrar deneyin.',
} as const;

function getErrorType(error: Error): keyof typeof ERROR_MESSAGES {
  const e = error as ApiLikeError;
  if (
    e.isNetworkError ||
    e.message?.includes('Network Error') ||
    e.message?.includes('fetch')
  ) {
    return 'NETWORK';
  }
  if (isApiError(error, [404])) return 'NOT_FOUND';
  if (isApiError(error, [400])) return 'INVALID_INPUT';
  if (isApiError(error, [500, 502, 503, 504])) return 'API_ERROR';
  return 'GENERIC';
}

export function getErrorMessage(error: Error): string {
  return ERROR_MESSAGES[getErrorType(error)];
}

export function toErrorMessage(err: unknown, fallback = 'Bir hata oluştu'): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string') return err;
  return fallback;
}
