import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[#EDF3EE] text-[#253341]">
      <div className="max-w-md w-full rounded-3xl bg-[#DCE3EA] border border-[#BCC7D2] p-6 sm:p-8 text-center shadow-md space-y-5">
        <div className="inline-flex items-center justify-center rounded-2xl bg-[#DBE6DD] border border-[#BCC7D2] px-4 py-1.5 text-sm font-extrabold text-[#AB421C]">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-[#253341]">
            Sayfa Bulunamadı
          </h1>
          <p className="text-sm font-medium text-[#3E5164]">
            Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Market aramasına veya tarif asistanına ana sayfadan devam edebilirsiniz.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-2xl bg-[#EC7D55] text-[#253341] hover:bg-[#AB421C] hover:text-[#F5F9F5] font-bold">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Ana Sayfaya Dön
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl font-bold">
            <Link href="/ai-chat">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              Tarif Asistanı
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
