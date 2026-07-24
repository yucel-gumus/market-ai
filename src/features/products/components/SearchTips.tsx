'use client';

import { Lightbulb, Search, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SearchTips() {
  const tips = [
    {
      icon: <Search className="h-4 w-4 text-[#0E2C24]" />,
      text: "En az 2 karakter yazarak canlı aramayı başlatın"
    },
    {
      icon: <Clock className="h-4 w-4 text-[#0E2C24]" />,
      text: "Ürün adının tamamını yazmanız gerekmez"
    },
    {
      icon: <Search className="h-4 w-4 text-[#0E2C24]" />,
      text: "Sonuçlar anlık olarak güncellenir ve filtreler uygulanır"
    },
    {
      icon: <Search className="h-4 w-4 text-[#0E2C24]" />,
      text: "Açılan menüden sepetinize tek tıkla ürün ekleyin"
    },
    {
      icon: <MapPin className="h-4 w-4 text-[#0E2C24]" />,
      text: "Mesafeler seçtiğiniz konuma göre otomatik hesaplanır"
    }
  ];

  return (
    <Card className="bg-[#FFECE8] border-[#F7A898]/70 shadow-2xs rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold font-heading text-[#2D1E12]">
          <div className="p-1.5 rounded-lg bg-[#9BCEC1] text-[#0E2C24]">
            <Lightbulb className="h-4 w-4 stroke-[2.5]" />
          </div>
          Arama İpuçları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center gap-2.5 text-xs font-medium text-[#70372D]">
              <div className="p-1 rounded-md bg-[#FFEBD3]">
                {tip.icon}
              </div>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
