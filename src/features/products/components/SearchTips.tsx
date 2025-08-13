'use client';

import { Lightbulb, Search, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SearchTips() {
  const tips = [
    {
      icon: <Search className="h-4 w-4 text-blue-500" />,
      text: "En az 2 karakter yazın"
    },
    {
      icon: <Clock className="h-4 w-4 text-green-500" />,
      text: "Ürün adını tam olarak yazmaya gerek yok"
    },
    {
      icon: <Search className="h-4 w-4 text-purple-500" />,
      text: "Sonuçlar otomatik olarak güncellenir"
    },
    {
      icon: <Search className="h-4 w-4 text-orange-500" />,
      text: "Dropdown'dan ürün seçebilirsiniz"
    },
    {
      icon: <MapPin className="h-4 w-4 text-red-500" />,
      text: "Mesafeler kuş uçuşu olarak gösterilir"
    }
  ];

  return (
    <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Lightbulb className="h-5 w-5" />
          Arama İpuçları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
              {tip.icon}
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
