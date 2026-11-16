'use client';

import { Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { StoreBadge } from '@/components/StoreBadge';
import { cn } from '@/lib/utils';
import { marketKey as keyOfMarket } from '@/lib/marketUtils';
import { formatBranchName } from '@/lib/stringUtils';
import { Market } from '@/types';
import { MarketService } from '@/services/marketService';

interface MarketCardProps {
  market: Market;
  isVisible: boolean;
  onToggleMarket: (market: Market) => void;
}

export function MarketCard({ market, isVisible, onToggleMarket }: MarketCardProps) {
  const marketKey = keyOfMarket(market);
  const branchLabel = formatBranchName(market.address || market.name);

  return (
    <Card className={cn(
      "transition-all duration-200 border-[#BCC7D2] bg-[#EDF3EE] hover:bg-[#DBE6DD]/70",
      isVisible 
        ? "shadow-xs opacity-100 ring-2 ring-[#EC7D55]/55 border-[#EC7D55]" 
        : "opacity-65 hover:opacity-95"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center">
            <Checkbox
              id={`market-${marketKey}`}
              aria-label={`${market.name} ${branchLabel} marketini seç`}
              checked={isVisible}
              onCheckedChange={() => onToggleMarket(market)}
            />
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <StoreBadge name={market.brand || market.name} size="md" />
              
              {/* Şube Adı & Mesafe */}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#253341] font-heading leading-tight truncate">
                  {branchLabel}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <Navigation className="h-3 w-3 text-[#AB421C] shrink-0" />
                  <span className="text-xs font-bold bg-[#DBE6DD] border border-[#BCC7D2] text-[#253341] px-2 py-0.5 rounded-md shadow-2xs">
                    {MarketService.formatDistance(market.distance)}
                  </span>
                  <span className="text-xs text-[#3E5164] font-medium">mesafede</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
