'use client';

import { Store, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarketListStatesProps {
  className?: string;
}

type LoadingStateProps = MarketListStatesProps;

interface ErrorStateProps extends MarketListStatesProps {
  error: Error;
  onRetry?: () => void;
}

type EmptyStateProps = MarketListStatesProps;

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="bg-[#EDF3EE] border-[#BCC7D2]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#EC7D55] border-t-transparent" />
            <span className="font-bold text-sm text-[#253341]">Marketler taranıyor...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-[#AB421C] bg-[#F2A488]/25">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-[#253341]">
            <AlertCircle className="h-6 w-6 text-[#AB421C] shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-base font-heading text-[#253341]">Market arama hatası</h3>
              <p className="text-sm mt-1 text-[#3E5164] font-medium">
                {error.message || 'Marketler aranırken bir hata oluştu'}
              </p>
            </div>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="default" 
                size="sm"
                className="ml-auto font-bold"
              >
                Tekrar Dene
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="bg-[#EDF3EE] border-[#BCC7D2]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3 text-[#3E5164]">
            <div className="p-4 rounded-2xl bg-[#DBE6DD] border border-[#BCC7D2]">
              <Store className="h-10 w-10 text-[#253341]" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#253341] font-heading">Market bulunamadı</h3>
              <p className="text-sm mt-1 font-medium text-[#3E5164]">
                Seçilen konum ve mesafe aralığında kayıtlı market bulunamadı.
                <br />
                Arama mesafesini artırarak tekrar deneyebilirsiniz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
