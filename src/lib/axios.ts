import { TIMEOUTS_MS } from '@/constants';
import { logger } from '@/lib/logger';

export interface ApiRequestConfig {
  params?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export class ApiClientError extends Error {
  status: number | string;
  data: unknown;
  isNetworkError: boolean;

  constructor(message: string, status: number | string, data: unknown, isNetworkError: boolean) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

function buildUrl(url: string, baseURL: string, params?: ApiRequestConfig['params']): string {
  const full = /^https?:\/\//i.test(url)
    ? url
    : `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  if (!params) return full;

  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      search.set(key, String(val));
    }
  }
  const qs = search.toString();
  if (!qs) return full;
  return `${full}${full.includes('?') ? '&' : '?'}${qs}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (typeof response.text === 'function') {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (typeof response.json === 'function') {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

async function request<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<{ data: T }> {
  if (config?.signal?.aborted) {
    throw config.signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
  }

  const targetUrl = buildUrl(url, apiClient.defaults.baseURL, config?.params);
  const timeoutSignal = AbortSignal.timeout(config?.timeout ?? TIMEOUTS_MS.API_CLIENT);
  const signal = config?.signal ? AbortSignal.any([config.signal, timeoutSignal]) : timeoutSignal;

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
      const errorMessage =
        (typeof record?.error === 'string' && record.error) ||
        (typeof record?.detail === 'string' && record.detail) ||
        (typeof record?.message === 'string' && record.message) ||
        response.statusText ||
        'Unknown error';
      const statusCode = response.status || 'No status';

      logger.error('apiClient', `API Error [${statusCode}]`, {
        url,
        method,
        message: errorMessage,
        response: data,
      });

      throw new ApiClientError(errorMessage, statusCode, data, false);
    }

    return { data: data as T };
  } catch (error: unknown) {
    if (error instanceof ApiClientError) throw error;
    if (config?.signal?.aborted) throw error;

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('apiClient', 'API Error [No status]', {
      url,
      method,
      message,
    });

    throw new ApiClientError(message, 'No status', undefined, true);
  }
}

export const apiClient = {
  defaults: {
    baseURL: '/api',
  },
  get<T = unknown>(url: string, config?: ApiRequestConfig): Promise<{ data: T }> {
    return request<T>('GET', url, undefined, config);
  },
  post<T = unknown>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<{ data: T }> {
    return request<T>('POST', url, body, config);
  },
};

export default apiClient;
