'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, MapPin } from 'lucide-react';
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
          <div>
            <h1 className="text-2xl font-bold">AI Market Asistanı</h1>
            <p className="text-muted-foreground">Seçtiğiniz marketler için AI destekli sohbet</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Seçilen Marketler ({marketData.selectedCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Konum:</span>
                <span className="text-muted-foreground">{marketData.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Arama Mesafesi:</span>
                <span className="text-muted-foreground">{marketData.distance} km</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Seçilen Marketler:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {marketData.selectedMarkets.map((market) => (
                  <div 
                    key={market.id} 
                    className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg"
                  >
                    <Store className="h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{market.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(market.distance)}m uzaklıkta
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
