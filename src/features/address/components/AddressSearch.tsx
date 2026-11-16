'use client';

import { useState, useEffect, useMemo } from 'react';
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
    isFetching: isSearchFetching,
    isPending: isSearchPending,
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

  const showLoading = isLoading || isSearchLoading || isSearchFetching || isSearchPending || searchQuery.trim() !== debouncedQuery.trim();
  const shouldShowDropdown = isOpen && searchQuery.trim().length > 0;
  // Aynı adres birden fazla kez dönebiliyor (servis tekrarları): gösterimde tekilleştir.
  const uniqueAddresses = useMemo(() => {
    const seen = new Set<string>();
    return addresses.filter((address) => {
      const key = AddressService.formatAddressForDisplay(address);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [addresses]);
  // "Sonuç bulunamadı" yalnızca arama gerçekten tamamlandığında söylenir; aksi halde
  // kullanıcı arama sürerken "yok" sanıp vazgeçiyor.
  const searchSettled = !showLoading && !searchError && searchQuery.trim() === debouncedQuery.trim();

  return (
    <div 
      className={cn("relative w-full", className)} 
      data-address-search
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3E5164]">
          <Search className="h-5 w-5" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className={cn(
            "pl-11 pr-24 h-12 rounded-2xl border-[#BCC7D2] bg-[#F5F9F5] text-[#253341] font-medium placeholder:text-[#3E5164]/65 focus-visible:border-[#EC7D55] focus-visible:ring-2 focus-visible:ring-[#EC7D55]/45 shadow-xs",
            selectedAddress && "border-[#EC7D55] bg-[#F5F9F5] ring-2 ring-[#EC7D55]/30 font-semibold"
          )}
          disabled={isLoading}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
          {selectedAddress && (
            <div className="flex items-center gap-1.5 bg-[#EC7D55] text-[#253341] px-2 py-1 rounded-xl text-xs font-bold shadow-2xs">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Seçildi</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 p-0.5 rounded-full hover:bg-[#AB421C] hover:text-[#F5F9F5] transition-colors"
                aria-label="Adresi Temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          
          {showLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-[#EC7D55] border-t-transparent rounded-full" />
          )}
          
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-[#3E5164] transition-transform duration-200 cursor-pointer",
              isOpen && "transform rotate-180 text-[#AB421C]"
            )} 
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
      </div>

      {shouldShowDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 p-1.5 bg-[#DCE3EA] border-[#BCC7D2] shadow-xl rounded-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto divide-y divide-[#BCC7D2]/50">
            {showLoading && (
              <div className="p-4 text-center text-sm font-medium text-[#3E5164]">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-[#EC7D55] border-t-transparent rounded-full" />
                  Adresler aranıyor...
                </div>
              </div>
            )}

            {searchError && !showLoading && (
              <div className="p-4 text-center text-sm font-semibold text-[#253341] bg-[#F2A488]/35 border border-[#AB421C] rounded-xl">
                Adres arama sırasında bir hata oluştu
              </div>
            )}

            {uniqueAddresses.length > 0 && !showLoading && (
              <div className="space-y-1 p-1">
                {uniqueAddresses.map((address, index) => (
                  <Button
                    key={`${address.latitude}-${address.longitude}-${index}`}
                    variant="ghost"
                    data-address-option
                    className="w-full justify-start h-auto p-3 text-left rounded-xl bg-[#EDF3EE]/70 hover:bg-[#EC7D55] hover:text-[#253341] transition-all group"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="p-2 rounded-lg bg-[#DBE6DD] text-[#253341] group-hover:bg-[#253341] group-hover:text-[#F5F9F5] transition-colors mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#253341] truncate">
                          {AddressService.formatAddressForDisplay(address)}
                        </div>
                        {address.additionalInfo && (
                          <div className="text-xs text-[#3E5164] group-hover:text-[#253341]/90 mt-0.5 truncate">
                            {address.additionalInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {searchSettled && uniqueAddresses.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="p-4 text-center text-sm font-medium text-[#3E5164]">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-[#AB421C]" />
                  &ldquo;{searchQuery}&rdquo; için sonuç bulunamadı
                </div>
              </div>
            )}

            {!showLoading && !searchError && searchQuery.trim().length < 2 && searchQuery.trim().length > 0 && (
              <div className="p-4 text-center text-xs font-semibold text-[#3E5164]">
                En az 2 karakter yazın...
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
