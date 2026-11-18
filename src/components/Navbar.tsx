'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Search, Sparkles, MapPin, Lock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { sessionMatchesSelection } from '@/lib/locationSession';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const marketSession = useAppStore((s) => s.marketSession);
  const selectedAddress = useAppStore((s) => s.selectedAddress);
  const selectedDistance = useAppStore((s) => s.selectedDistance);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  // Oturum ancak ekrandaki adres/mesafeyle uyuşuyorsa geçerlidir. Uyuşmuyorsa rozet eski
  // ilçeyi ve eski market sayısını gösterip "seçimim güncellenmiyor" hissi veriyordu.
  const sessionIsCurrent = sessionMatchesSelection(marketSession, selectedAddress, selectedDistance);
  const selectedMarketCount = sessionIsCurrent ? marketSession!.selectedMarkets.length : 0;
  // Ürün arama ve asistan için market seçimi şart; ama adres seçildiği anda rozet bunu göstermeli
  // (oturum "Kensai ile Devam Et" ile kaydedilene kadar "konum seçilmedi" demesi kafa karıştırıyordu).
  const hasPickedLocation = Boolean(selectedAddress);
  const hasSelectedLocation = hasPickedLocation && selectedMarketCount > 0;

  const activeDistrict =
    selectedAddress?.district ||
    selectedAddress?.neighborhood ||
    'Konum Seçilmedi';

  const handleNavClick = (e: React.MouseEvent, href: string, requiresLocation: boolean) => {
    if (requiresLocation && !hasSelectedLocation) {
      e.preventDefault();
      setWarningMessage('Ürün aramak ve AI asistanını kullanmak için önce bir konum ve market seçmelisiniz.');
      router.push('/');
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setWarningMessage(null), 4000);
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
      name: 'KENSAI',
      href: '/ai-chat',
      icon: Sparkles,
      requiresLocation: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#DCE3EA]/92 border-b border-[#BCC7D2] shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-[#EC7D55] text-[#253341] shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-[#AB421C] group-hover:text-[#F5F9F5]">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight text-[#253341]">
            Market<span className="text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-1.5 py-0.5 rounded-md ml-0.5">AI</span>
          </span>
        </Link>

        {/* Location Indicator Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EDF3EE] border border-[#BCC7D2] text-xs font-bold text-[#253341]">
          <MapPin className="h-4 w-4 text-[#AB421C] shrink-0" />
          {hasSelectedLocation ? (
            <span>
              <span className="text-[#253341]">{activeDistrict}</span>{' '}
              <span className="bg-[#EC7D55] text-[#253341] px-1.5 py-0.5 rounded-md ml-1">
                {selectedMarketCount} Market
              </span>
            </span>
          ) : hasPickedLocation ? (
            <span>
              <span className="text-[#253341]">{activeDistrict}</span>{' '}
              <span className="bg-[#F2A488] text-[#253341] px-1.5 py-0.5 rounded-md ml-1">
                market seçilmedi
              </span>
            </span>
          ) : (
            <span className="text-[#3E5164]">📍 Henüz Konum Seçilmedi</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Ana menü" className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#EDF3EE] border border-[#BCC7D2]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isDisabled = item.requiresLocation && !hasSelectedLocation;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.requiresLocation)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                    ? 'bg-[#EC7D55] text-[#253341] shadow-xs hover:bg-[#AB421C] hover:text-[#F5F9F5]'
                    : isDisabled
                      ? 'text-[#3E5164]/60 hover:bg-[#DBE6DD]/60 cursor-not-allowed'
                      : 'text-[#3E5164] hover:bg-[#DBE6DD] hover:text-[#253341]'
                  }`}
                title={isDisabled ? 'Önce konum ve market seçmelisiniz' : item.name}
              >
                {isDisabled ? (
                  <Lock className="h-3.5 w-3.5 opacity-70" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side CTA / Mobile nav */}
        <div className="flex items-center gap-3">
          {/* Mobile navigation buttons */}
          <nav aria-label="Mobil menü" className="flex md:hidden items-center gap-1 bg-[#EDF3EE] p-1 rounded-xl border border-[#BCC7D2]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isDisabled = item.requiresLocation && !hasSelectedLocation;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.requiresLocation)}
                  className={`p-2 rounded-lg transition-colors relative ${isActive ? 'bg-[#EC7D55] text-[#253341]' : 'text-[#3E5164] hover:bg-[#DBE6DD] hover:text-[#253341]'
                    }`}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {isDisabled && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#AB421C] rounded-full border border-[#EDF3EE]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Warning Alert Banner when user clicks without location */}
      {warningMessage && (
        <div role="status" className="bg-[#F2A488] border-t border-b border-[#AB421C] px-4 py-2 text-center text-xs font-bold text-[#253341] animate-in fade-in slide-in-from-top-1">
          ⚠️ {warningMessage}
        </div>
      )}
    </header>
  );
}
