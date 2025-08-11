'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAddressSearch } from '../hooks/useAddressSearch';
import { ParsedAddress } from '@/types';
import { AddressService } from '@/services/addressService';

interface AddressSearchProps {
  onAddressSelect: (address: ParsedAddress | null) => void;
  selectedAddress: ParsedAddress | null;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}
export function AddressSearch({ 
  onAddressSelect, 
  selectedAddress, 
  isLoading = false, 
  placeholder = "Adres ara...",
  className 
}: AddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  
  const { 
    data: addresses = [], 
    isLoading: isSearchLoading, 
    error: searchError 
  } = useAddressSearch(debouncedQuery);

  useEffect(() => {
    if (selectedAddress) {
      setSearchQuery(AddressService.formatAddressForDisplay(selectedAddress));
      setIsOpen(false);
    }
  }, [selectedAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-address-search]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(true);
    
    if (!value.trim() && selectedAddress) {
      onAddressSelect(null);
    }
  };

  const handleAddressSelect = (address: ParsedAddress) => {
    onAddressSelect(address);
    setSearchQuery(AddressService.formatAddressForDisplay(address));
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (addresses.length > 0 || searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onAddressSelect(null);
    setIsOpen(false);
  };

  const showLoading = isLoading || isSearchLoading;
  const shouldShowDropdown = isOpen && (addresses.length > 0 || showLoading || searchError);

  return (
    <div 
      className={cn("relative w-full", className)} 
      data-address-search
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className={cn(
            "pl-10 pr-20",
            searchError && "border-destructive focus-visible:ring-destructive",
            selectedAddress && "border-green-500 focus-visible:ring-green-500"
          )}
          disabled={isLoading}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
          {selectedAddress && (
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-destructive/10"
              >
                <span className="sr-only">Temizle</span>
                ×
              </Button>
            </div>
          )}
          
          {showLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
          )}
          
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "transform rotate-180"
            )} 
          />
        </div>
      </div>

      {shouldShowDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-0 shadow-lg border">
          <div className="max-h-60 overflow-y-auto">
            {showLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
                  Adresler aranıyor...
                </div>
              </div>
            )}

            {searchError && !showLoading && (
              <div className="p-4 text-center text-sm text-destructive">
                <div className="flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  Adres arama sırasında hata oluştu
                </div>
              </div>
            )}

            {addresses.length > 0 && !showLoading && (
              <>
                {addresses.map((address, index) => (
                  <Button
                    key={`${address.latitude}-${address.longitude}-${index}`}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left hover:bg-accent/50"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {AddressService.formatAddressForDisplay(address)}
                        </div>
                        {address.additionalInfo && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {address.additionalInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </>
            )}

            {!showLoading && !searchError && addresses.length === 0 && searchQuery.length >= 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  &ldquo;{searchQuery}&rdquo; için adres bulunamadı
                </div>
              </div>
            )}

            {!showLoading && !searchError && searchQuery.length < 2 && searchQuery.length > 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                En az 2 karakter girin
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
