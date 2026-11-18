import { describe, expect, it } from 'vitest';
import { ApiClientError } from './axios';
import { getErrorMessage, isApiError, toErrorMessage } from './errorUtils';

describe('ApiClientError and errorUtils', () => {
  it('makes ApiClientError an Error instance compatible with isApiError and getErrorMessage', () => {
    const notFoundErr = new ApiClientError('Kayıt yok', 404, null, false);
    expect(notFoundErr).toBeInstanceOf(Error);
    expect(isApiError(notFoundErr, [404])).toBe(true);
    expect(getErrorMessage(notFoundErr)).toBe('Aranan bilgi bulunamadı.');

    const netErr = new ApiClientError('timeout', 'No status', undefined, true);
    expect(getErrorMessage(netErr)).toBe('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
  });

  it('extracts readable messages from Error, plain { message } objects, strings, and falls back otherwise', () => {
    expect(toErrorMessage(new ApiClientError('Özel sunucu hatası', 502, null, false))).toBe('Özel sunucu hatası');
    expect(toErrorMessage({ message: 'Nesne hatası', status: 500 })).toBe('Nesne hatası');
    expect(toErrorMessage('Düz metin')).toBe('Düz metin');
    expect(toErrorMessage({ message: '   ' }, 'Varsayılan')).toBe('Varsayılan');
    expect(toErrorMessage(null, 'Varsayılan')).toBe('Varsayılan');
  });
});
