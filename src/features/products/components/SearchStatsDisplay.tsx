'use client';

import { SEARCH } from '@/constants';
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
  if (query.trim().length < SEARCH.MIN_QUERY_LENGTH || isLoading) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-4 mt-3 p-2.5 bg-[#EDF3EE] border border-[#BCC7D2] rounded-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-[#3E5164]">
        <BarChart3 className="h-4 w-4 text-[#AB421C]" />
        <span>
          <span className="text-[#253341] bg-[#DBE6DD] border border-[#BCC7D2] px-1.5 py-0.5 rounded-md">
            {stats.loadedResults ?? stats.totalResults}
          </span>{' '}
          / {stats.totalResults} ürün{' '}
          {error
            ? '· Arama eksik, yeniden deneyin'
            : stats.complete
              ? '· Tüm sonuçlar yüklendi'
              : stats.loadingMore
                ? '· Diğer sonuçlar yükleniyor…'
                : '· Arama henüz tamamlanmadı'}
        </span>
      </div>
    </div>
  );
}
