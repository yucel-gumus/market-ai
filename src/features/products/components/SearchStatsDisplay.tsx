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
    <div className="flex flex-wrap gap-4 mt-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        <span className="font-medium">{stats.totalResults}</span> sonuç
      </div>
    </div>
  );
}
