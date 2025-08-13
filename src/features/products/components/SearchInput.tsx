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
  placeholder = "Ürün adı yazın... (en az 2 karakter)",
  className
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-12"
        autoComplete="off"
      />
      
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {value && !isLoading && (
          <Button 
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
