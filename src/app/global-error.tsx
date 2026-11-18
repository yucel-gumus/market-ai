'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex items-center justify-center bg-[#EDF3EE] text-[#253341] p-4">
        <div className="max-w-md w-full rounded-3xl bg-[#DCE3EA] border border-[#BCC7D2] p-8 text-center shadow-md space-y-4">
          <h1 className="text-xl font-bold text-[#253341]">Uygulama Geçici Olarak Kullanılamıyor</h1>
          <p className="text-sm text-[#3E5164]">
            Beklenmeyen bir sistem hatası oluştu. Sayfayı yenileyerek tekrar deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-2xl bg-[#EC7D55] px-5 py-2.5 text-sm font-bold text-[#253341] hover:bg-[#AB421C] hover:text-[#F5F9F5] transition-colors cursor-pointer"
          >
            Sayfayı Yenile
          </button>
        </div>
      </body>
    </html>
  );
}
