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
      <Card className="bg-[#FFECE8] border-[#F7A898]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#9BCEC1] border-t-transparent" />
            <span className="font-bold text-sm text-[#4A1E17]">Marketler taranıyor...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-[#F7A898] bg-[#FFECE8]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-[#4A1E17]">
            <AlertCircle className="h-6 w-6 text-[#4A1E17] shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-base font-heading">Market arama hatası</h3>
              <p className="text-sm mt-1 text-[#70372D] font-medium">
                {error.message || 'Marketler aranırken bir hata oluştu'}
              </p>
            </div>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="ml-auto bg-[#9BCEC1] text-[#0E2C24] border-none font-bold"
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
      <Card className="bg-[#FFECE8] border-[#F7A898]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3 text-[#70372D]">
            <div className="p-4 rounded-2xl bg-[#FFEBD3]">
              <Store className="h-10 w-10 text-[#4A1E17]" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#2D1E12] font-heading">Market bulunamadı</h3>
              <p className="text-sm mt-1 font-medium text-[#70372D]">
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
