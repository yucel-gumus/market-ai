'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[#EDF3EE] text-[#253341]">
      <div className="max-w-md w-full rounded-3xl bg-[#DCE3EA] border border-[#BCC7D2] p-6 sm:p-8 text-center shadow-md space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2A488]/40 border border-[#AB421C] text-[#AB421C]">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-heading text-[#253341]">
            Beklenmeyen bir hata oluştu
          </h1>
          <p className="text-sm font-medium text-[#3E5164]">
            Sayfa yüklenirken geçici bir sorun yaşandı. İşlemi yeniden deneyebilir veya ana sayfaya dönebilirsiniz.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-[#EC7D55] text-[#253341] hover:bg-[#AB421C] hover:text-[#F5F9F5] font-bold"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            Tekrar Dene
          </Button>
          <Button asChild variant="outline" className="rounded-2xl font-bold">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Ana Sayfa
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
