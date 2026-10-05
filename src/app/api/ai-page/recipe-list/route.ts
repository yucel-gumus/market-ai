import { createBackendProxyHandler } from '@/lib/backendProxy';

// Bkz. select-products: Vercel varsayılan süresi tek LLM çağrısını bile kesebiliyor.
export const maxDuration = 60;

export const POST = createBackendProxyHandler('recipe-list');
