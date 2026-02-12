import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Infinity, Download, BarChart3 } from 'lucide-react';

interface PlanStatusFooterProps {
  planName?: string | null;
  planTier?: string | null;
  totalDownloads?: number;
  maxDownloads?: number | null;
  remainingDownloads?: number;
}

export default function PlanStatusFooter({
  planName,
  planTier,
  totalDownloads,
  maxDownloads,
  remainingDownloads
}: PlanStatusFooterProps) {
  const isUnlimited = maxDownloads === null;
  const tierColor = planTier === 'enterprise' 
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : planTier === 'professional'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-muted/30 border-t rounded-b-lg">
      <div className="flex items-center gap-3">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">Your Plan:</span>
        <Badge variant="secondary" className={tierColor}>
          {planName || 'Free'}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {isUnlimited ? (
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Infinity className="h-4 w-4" />
            Unlimited downloads
          </span>
        ) : maxDownloads !== undefined && maxDownloads !== null ? (
          <span className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            {remainingDownloads ?? maxDownloads} / {maxDownloads} downloads remaining
          </span>
        ) : null}
        
        {totalDownloads !== undefined && totalDownloads > 0 && (
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {totalDownloads} total downloads
          </span>
        )}
      </div>
    </div>
  );
}
