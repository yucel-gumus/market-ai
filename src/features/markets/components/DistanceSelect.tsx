'use client';

import { Ruler } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDistanceOptions } from '../hooks/useMarketSearch';

interface DistanceSelectProps {
  value: number;
  onValueChange: (distance: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DistanceSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  className 
}: DistanceSelectProps) {
  const distanceOptions = useDistanceOptions();

  const handleValueChange = (stringValue: string) => {
    const numericValue = parseInt(stringValue, 10);
    if (!isNaN(numericValue)) {
      onValueChange(numericValue);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        value={value.toString()}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(
          "w-full h-12 rounded-2xl bg-[#FFEBD3] border-[#F7A898] text-[#2D1E12] font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-[#9BCEC1]/60",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <div className="flex items-center gap-2.5 text-[#2D1E12]">
            <Ruler className="h-5 w-5 text-[#9BCEC1] stroke-[2.5]" />
            <SelectValue 
              placeholder="Mesafe seçin..."
              className="flex-1"
            />
          </div>
        </SelectTrigger>
        
        <SelectContent align="start" className="w-full bg-[#FFECE8] border-[#F7A898] rounded-2xl shadow-xl">
          {distanceOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              className="flex items-center gap-2 cursor-pointer font-medium hover:bg-[#9BCEC1] hover:text-[#0E2C24] transition-colors rounded-xl"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold">{option.label}</span>
                <span className="text-xs text-[#70372D] ml-2">
                  yakınındaki marketler
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="mt-2 text-xs font-semibold text-[#70372D]">
        Seçilen konumun <span className="text-[#0E2C24] font-bold bg-[#9BCEC1] px-1.5 py-0.5 rounded-md">{value} km</span> yakınındaki marketler taranacak
      </div>
    </div>
  );
}
