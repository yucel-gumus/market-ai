'use client';

import { Lightbulb, Search, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SearchTips() {
  const tips = [
    {
      icon: <Search className="h-4 w-4 text-[#253341]" />,
      text: "En az 2 karakter yazarak canlı aramayı başlatın"
    },
    {
      icon: <Clock className="h-4 w-4 text-[#253341]" />,
      text: "Ürün adının tamamını yazmanız gerekmez"
    },
    {
      icon: <Search className="h-4 w-4 text-[#253341]" />,
      text: "Sonuçlar anlık olarak güncellenir ve filtreler uygulanır"
    },
    {
      icon: <Search className="h-4 w-4 text-[#253341]" />,
      text: "Açılan menüden sepetinize tek tıkla ürün ekleyin"
    },
    {
      icon: <MapPin className="h-4 w-4 text-[#253341]" />,
      text: "Mesafeler seçtiğiniz konuma göre otomatik hesaplanır"
    }
  ];

  return (
    <Card className="bg-[#DCE3EA] border-[#BCC7D2] shadow-2xs rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold font-heading text-[#253341]">
          <div className="p-1.5 rounded-lg bg-[#EC7D55] text-[#253341]">
            <Lightbulb className="h-4 w-4 stroke-[2.5]" />
          </div>
          Arama İpuçları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center gap-2.5 text-xs font-medium text-[#3E5164]">
              <div className="p-1 rounded-md bg-[#DBE6DD] border border-[#BCC7D2]">
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
