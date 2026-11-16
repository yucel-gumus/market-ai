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
  onFocus?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  onFocus,
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
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3E5164]">
        <Search className="h-5 w-5" />
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        onFocus={onFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-12 h-12 rounded-2xl bg-[#F5F9F5] border-[#BCC7D2] text-[#253341] font-medium placeholder:text-[#3E5164]/65 focus-visible:border-[#EC7D55] focus-visible:ring-2 focus-visible:ring-[#EC7D55]/45 shadow-xs"
        autoComplete="off"
      />
      
      <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-[#EC7D55]" />
        )}
        {value && !isLoading && (
          <Button 
            type="button"
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-[#DBE6DD] text-[#253341]"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
