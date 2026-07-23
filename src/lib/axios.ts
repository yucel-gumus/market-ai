import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import { TIMEOUTS_MS } from '@/constants';

const httpAgent: http.Agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent: https.Agent = new https.Agent({ keepAlive: true, maxSockets: 50 });

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: TIMEOUTS_MS.API_CLIENT,
  headers: {
    'Content-Type': 'application/json',
  },
  httpAgent,
  httpsAgent,
} as AxiosRequestConfig);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage =
      error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'No status';

    console.error(`❌ API Error [${statusCode}]:`, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: errorMessage,
      response: error.response?.data,
    });

    return Promise.reject({
      message: errorMessage,
      status: statusCode,
      data: error.response?.data,
      isNetworkError: !error.response,
    });
  }
);

export default apiClient;
