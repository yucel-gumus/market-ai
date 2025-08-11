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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Marketler aranıyor...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <div className="flex-1">
              <h3 className="font-semibold">Market arama hatası</h3>
              <p className="text-sm mt-1 text-muted-foreground">
                {error.message || 'Marketler aranırken bir hata oluştu'}
              </p>
            </div>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="ml-auto"
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
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Store className="h-12 w-12" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Market bulunamadı</h3>
              <p className="text-sm mt-1">
                Seçilen konum ve mesafe içinde market bulunamadı. 
                <br />
                Mesafeyi artırarak tekrar deneyebilirsiniz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
