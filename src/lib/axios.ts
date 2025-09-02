
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';

const httpAgent: http.Agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent: https.Agent = new https.Agent({ keepAlive: true, maxSockets: 50 });


export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  httpAgent,
  httpsAgent,
} as AxiosRequestConfig);

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'No status';
    
    console.error(`❌ API Error [${statusCode}]:`, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: errorMessage,
      response: error.response?.data,
    });

    const transformedError = {
      message: errorMessage,
      status: statusCode,
      data: error.response?.data,
      isNetworkError: !error.response,
    };

    return Promise.reject(transformedError);
  }
);

export default apiClient;
