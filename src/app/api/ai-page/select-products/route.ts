import { createBackendProxyHandler } from '@/lib/backendProxy';

// Vercel fonksiyon süresi: varsayılan (Hobby 10 sn / Pro 15 sn) LLM çağrısını kesiyor.
// 60 sn Hobby'de de izin verilen üst sınır; Pro'da 300'e çıkarılabilir.
export const maxDuration = 60;

export const POST = createBackendProxyHandler('select-products');
