'use client';

import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string;
  onGoHome?: () => void;
}

export function ErrorDisplay({ error, onGoHome }: ErrorDisplayProps) {
  return (
    <Card className="border-[#AB421C] bg-[#F2A488]/25 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#253341] font-bold font-heading flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[#AB421C]" />
          Bir Hata Oluştu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[#3E5164] text-sm font-medium mb-4">{error}</p>
        <div className="flex gap-2">
          {onGoHome && (
            <Button onClick={onGoHome} variant="default" size="sm" className="font-bold">
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
    <div className="flex items-center gap-2 p-3 mt-2 bg-[#F2A488]/30 border border-[#AB421C] rounded-xl text-[#253341] text-xs font-semibold">
      <AlertCircle className="h-4 w-4 shrink-0 text-[#AB421C]" />
      <span>{error}</span>
    </div>
  );
}
