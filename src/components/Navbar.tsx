'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Search, Sparkles, MapPin, Lock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const marketSession = useAppStore((s) => s.marketSession);
  const selectedAddress = useAppStore((s) => s.selectedAddress);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const hasSelectedLocation = Boolean(
    (marketSession?.selectedAddress || selectedAddress) &&
      (marketSession?.selectedMarkets?.length ?? 0) > 0
  );

  const activeDistrict =
    marketSession?.selectedAddress?.district ||
    selectedAddress?.district ||
    marketSession?.selectedAddress?.neighborhood ||
    selectedAddress?.neighborhood ||
    'Konum Seçilmedi';

  const selectedMarketCount = marketSession?.selectedMarkets?.length || 0;

  const handleNavClick = (e: React.MouseEvent, href: string, requiresLocation: boolean) => {
    if (requiresLocation && !hasSelectedLocation) {
      e.preventDefault();
      setWarningMessage('Ürün aramak ve AI asistanını kullanmak için önce bir konum ve market seçmelisiniz.');
      router.push('/');
      setTimeout(() => setWarningMessage(null), 4000);
    }
  };

  const navItems = [
    {
      name: 'Konum & Marketler',
      href: '/',
      icon: Store,
      requiresLocation: false,
    },
    {
      name: 'Ürün Arama',
      href: '/product-search',
      icon: Search,
      requiresLocation: true,
    },
    {
      name: 'Yapay Zeka Asistanı',
      href: '/ai-chat',
      icon: Sparkles,
      requiresLocation: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FFEBD3]/90 border-b border-[#F5D3B3] shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-[#9BCEC1] text-[#0E2C24] shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight text-[#2D1E12]">
            Market<span className="text-[#4A1E17] bg-[#FFB6A6]/60 px-1.5 py-0.5 rounded-md ml-0.5">AI</span>
          </span>
        </Link>

        {/* Location Indicator Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFECE8] border border-[#F7A898]/60 text-xs font-bold text-[#4A1E17]">
          <MapPin className="h-4 w-4 text-[#0E2C24] shrink-0" />
          {hasSelectedLocation ? (
            <span>
              <span className="text-[#2D1E12]">{activeDistrict}</span>{' '}
              <span className="bg-[#9BCEC1] text-[#0E2C24] px-1.5 py-0.5 rounded-md ml-1">
                {selectedMarketCount} Market
              </span>
            </span>
          ) : (
            <span className="text-[#70372D]">📍 Henüz Konum Seçilmedi</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#FFECE8] border border-[#F7A898]/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isDisabled = item.requiresLocation && !hasSelectedLocation;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.requiresLocation)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#9BCEC1] text-[#0E2C24] shadow-xs'
                    : isDisabled
                    ? 'text-[#70372D]/60 hover:bg-[#FFB6A6]/20 cursor-not-allowed'
                    : 'text-[#4A1E17] hover:bg-[#FFB6A6]/40 hover:text-[#2D1E12]'
                }`}
                title={isDisabled ? 'Önce konum ve market seçmelisiniz' : item.name}
              >
                {isDisabled ? (
                  <Lock className="h-3.5 w-3.5 text-[#70372D]/60" />
                ) : (
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#0E2C24]' : 'text-[#70372D]'}`} />
                )}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side CTA / Cart indicator */}
        <div className="flex items-center gap-3">


          {/* Mobile navigation buttons */}
          <div className="flex md:hidden items-center gap-1 bg-[#FFECE8] p-1 rounded-xl border border-[#F7A898]/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isDisabled = item.requiresLocation && !hasSelectedLocation;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.requiresLocation)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    isActive ? 'bg-[#9BCEC1] text-[#0E2C24]' : 'text-[#70372D] hover:bg-[#FFB6A6]/40'
                  }`}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" />
                  {isDisabled && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4A1E17] rounded-full border border-[#FFECE8]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning Alert Banner when user clicks without location */}
      {warningMessage && (
        <div className="bg-[#FFECE8] border-t border-b border-[#F7A898] px-4 py-2 text-center text-xs font-bold text-[#4A1E17] animate-in fade-in slide-in-from-top-1">
          ⚠️ {warningMessage}
        </div>
      )}
    </header>
  );
}
