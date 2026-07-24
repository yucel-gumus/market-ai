'use client';

import { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = "Ürün adı yazın... (Örn: Süt, Zeytin, Mercimek)",
  className
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#70372D]">
        <Search className="h-5 w-5" />
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-12 h-12 rounded-2xl bg-[#FFEBD3] border-[#F7A898] text-[#2D1E12] font-medium placeholder:text-[#854B41]/60 focus-visible:border-[#9BCEC1] focus-visible:ring-2 focus-visible:ring-[#9BCEC1]/60 shadow-xs"
        autoComplete="off"
      />
      
      <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-[#9BCEC1]" />
        )}
        {value && !isLoading && (
          <Button 
            type="button"
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-[#FFB6A6]/40 text-[#4A1E17]"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
