'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedMarketData {
  distance: number;
  address: string;
  selectedMarkets: Array<{
    id: string;
    name: string;
    address: string;
    distance: number;
    latitude: number;
    longitude: number;
  }>;
  timestamp: string;
  totalMarkets: number;
  selectedCount: number;
}

export default function AiChatPage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState<SavedMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('marketSearchData');
      if (savedData) {
        const data = JSON.parse(savedData) as SavedMarketData;
        setMarketData(data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGoBack = () => {
    router.push('/');
  };
  const gotoProductSearch = () => {
    router.push('/product-search');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Veri Bulunamadı</h2>
              <p className="text-muted-foreground mb-4">
                Market verisi bulunamadı. Lütfen önce market araması yapın.
              </p>
              <Button onClick={handleGoBack}>
                Ana Sayfaya Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>


          <Button
                onClick={gotoProductSearch}
                size="sm"
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out group"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ürün Ara</span>
                  <div className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
                  </div>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
              </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Market Asistanı</h1>
            <p className="text-muted-foreground">Seçtiğiniz marketler için AI destekli sohbet</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>AI Sohbet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">🤖</div>
              <p>AI sohbet özelliği yakında burada olacak!</p>
              <p className="text-sm mt-2">
                Seçtiğiniz marketler hakkında sorular sorabilecek ve
                AI asistanından öneriler alabileceksiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
