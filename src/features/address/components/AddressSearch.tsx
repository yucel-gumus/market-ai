'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
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
  placeholder = "Adres ara (Örn: Kızılcaşar Mahallesi, Gölbaşı, Ankara)...",
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
    if (searchQuery.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onAddressSelect(null);
    setIsOpen(false);
  };

  const showLoading = isLoading || isSearchLoading;
  const shouldShowDropdown = isOpen && searchQuery.trim().length > 0;

  return (
    <div 
      className={cn("relative w-full", className)} 
      data-address-search
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70372D]">
          <Search className="h-5 w-5" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className={cn(
            "pl-11 pr-24 h-12 rounded-2xl border-[#F7A898] bg-[#FFEBD3] text-[#2D1E12] font-medium placeholder:text-[#854B41]/60 focus-visible:border-[#9BCEC1] focus-visible:ring-2 focus-visible:ring-[#9BCEC1]/60 shadow-xs",
            selectedAddress && "border-[#9BCEC1] bg-[#FFEBD3] ring-2 ring-[#9BCEC1]/40 font-semibold"
          )}
          disabled={isLoading}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
          {selectedAddress && (
            <div className="flex items-center gap-1.5 bg-[#9BCEC1] text-[#0E2C24] px-2 py-1 rounded-xl text-xs font-bold shadow-2xs">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Seçildi</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 p-0.5 rounded-full hover:bg-[#83BEB0] transition-colors"
                aria-label="Adresi Temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          
          {showLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-[#9BCEC1] border-t-transparent rounded-full" />
          )}
          
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-[#70372D] transition-transform duration-200 cursor-pointer",
              isOpen && "transform rotate-180 text-[#0E2C24]"
            )} 
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
      </div>

      {shouldShowDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 p-1.5 bg-[#FFECE8] border-[#F7A898] shadow-xl rounded-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto divide-y divide-[#F7A898]/30">
            {showLoading && (
              <div className="p-4 text-center text-sm font-medium text-[#70372D]">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-[#9BCEC1] border-t-transparent rounded-full" />
                  Adresler aranıyor...
                </div>
              </div>
            )}

            {searchError && !showLoading && (
              <div className="p-4 text-center text-sm font-semibold text-[#4A1E17] bg-[#FFB6A6]/40 rounded-xl">
                Adres arama sırasında bir hata oluştu
              </div>
            )}

            {addresses.length > 0 && !showLoading && (
              <div className="space-y-1 p-1">
                {addresses.map((address, index) => (
                  <Button
                    key={`${address.latitude}-${address.longitude}-${index}`}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left rounded-xl hover:bg-[#9BCEC1] hover:text-[#0E2C24] transition-all group"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="p-2 rounded-lg bg-[#FFB6A6] text-[#4A1E17] group-hover:bg-[#0E2C24] group-hover:text-[#9BCEC1] transition-colors mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#2D1E12] group-hover:text-[#0E2C24] truncate">
                          {AddressService.formatAddressForDisplay(address)}
                        </div>
                        {address.additionalInfo && (
                          <div className="text-xs text-[#70372D] group-hover:text-[#0E2C24]/80 mt-0.5 truncate">
                            {address.additionalInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {!showLoading && !searchError && addresses.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="p-4 text-center text-sm font-medium text-[#70372D]">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-[#FFB6A6]" />
                  &ldquo;{searchQuery}&rdquo; için sonuç bulunamadı
                </div>
              </div>
            )}

            {!showLoading && !searchError && searchQuery.trim().length < 2 && searchQuery.trim().length > 0 && (
              <div className="p-4 text-center text-xs font-semibold text-[#70372D]">
                En az 2 karakter yazın...
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
