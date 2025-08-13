/**
 * Centralized Error Handling Utilities
 * Avoid code duplication across hooks and services
 */

/**
 * API error checker - used across multiple hooks
 */
export function isApiError(error: Error, statusCodes: number[] = [400, 404]): boolean {
  return statusCodes.some(code => error.message.includes(code.toString()));
}

/**
 * Common error messages for UI display
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
  API_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  NOT_FOUND: 'Aranan bilgi bulunamadı.',
  INVALID_INPUT: 'Geçersiz giriş. Lütfen bilgileri kontrol edin.',
  GENERIC: 'Bir hata oluştu. Lütfen tekrar deneyin.'
} as const;

/**
 * Error type detection
 */
export function getErrorType(error: Error): keyof typeof ERROR_MESSAGES {
  if (error.message.includes('Network Error') || error.message.includes('fetch')) {
    return 'NETWORK';
  }
  
  if (isApiError(error, [404])) {
    return 'NOT_FOUND';
  }
  
  if (isApiError(error, [400])) {
    return 'INVALID_INPUT';
  }
  
  if (isApiError(error, [500, 502, 503])) {
    return 'API_ERROR';
  }
  
  return 'GENERIC';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: Error): string {
  const errorType = getErrorType(error);
  return ERROR_MESSAGES[errorType];
}
