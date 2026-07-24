'use client';

import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorDisplay({ error, onRetry, onGoHome }: ErrorDisplayProps) {
  return (
    <Card className="border-[#F7A898] bg-[#FFECE8] rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#4A1E17] font-bold font-heading flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[#4A1E17]" />
          Bir Hata Oluştu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[#70372D] text-sm font-medium mb-4">{error}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="bg-[#FFEBD3] text-[#4A1E17] border-[#F7A898] font-bold">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="default" size="sm" className="bg-[#9BCEC1] text-[#0E2C24] font-bold">
              <Home className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SearchErrorDisplayProps {
  error: string;
}

export function SearchErrorDisplay({ error }: SearchErrorDisplayProps) {
  return (
    <div className="flex items-center gap-2 p-3 mt-2 bg-[#FFECE8] border border-[#F7A898] rounded-xl text-[#4A1E17] text-xs font-semibold">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}
