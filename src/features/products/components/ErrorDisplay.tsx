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
    <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/20 dark:border-red-800">
      <CardHeader>
        <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Hata
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="default" size="sm">
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
    <div className="flex items-center gap-2 p-3 mt-2 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm">{error}</span>
    </div>
  );
}
