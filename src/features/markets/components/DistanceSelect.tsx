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
          "w-full",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <SelectValue 
              placeholder="Mesafe seçin..."
              className="flex-1"
            />
          </div>
        </SelectTrigger>
        
        <SelectContent align="start" className="w-full">
          {distanceOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  yakınındaki marketler
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="mt-1 text-xs text-muted-foreground">
        Seçilen konumun {value} km yakınındaki marketler gösterilecek
      </div>
    </div>
  );
}
