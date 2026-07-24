'use client';

import { SearchStats } from '@/types';
import { BarChart3 } from 'lucide-react';

interface SearchStatsDisplayProps {
  stats: SearchStats;
  query: string;
  isLoading?: boolean;
  error?: string | null;
}

export function SearchStatsDisplay({
  stats,
  query,
  isLoading = false,
  error
}: SearchStatsDisplayProps) {
  if (query.length < 2 || isLoading || error) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-4 mt-3 p-2.5 bg-[#FFECE8] border border-[#F7A898]/50 rounded-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-[#70372D]">
        <BarChart3 className="h-4 w-4 text-[#0E2C24]" />
        <span>Toplanmış <span className="text-[#0E2C24] bg-[#9BCEC1] px-1.5 py-0.5 rounded-md">{stats.totalResults}</span> ürün eşleşti</span>
      </div>
    </div>
  );
}
