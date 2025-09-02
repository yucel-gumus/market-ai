import axios from 'axios';
// For Node.js server-side keep-alive to reduce TCP/TLS overhead
// These will be tree-shaken on the client
let httpAgent: any = undefined;
let httpsAgent: any = undefined;
try {
  // Optional: only available in Node runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const http = require('http');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const https = require('https');
  httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
  httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
} catch {}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Attach keep-alive agents only in Node.js
  httpAgent,
  httpsAgent,
});

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
