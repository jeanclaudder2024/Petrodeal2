import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Download,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  Shield,
  Loader2,
  Infinity,
  Crown,
  FileCheck,
  Scale
} from 'lucide-react';
import { DocumentTemplate, ProcessingStatus } from './types';

interface DocumentCardProps {
  template: DocumentTemplate;
  status: ProcessingStatus | undefined;
  isLocked: boolean;
  isProcessing: boolean;
  remainingDownloads?: number | null;
  maxDownloads?: number | null;
  onDownload: () => void;
  onUpgrade: () => void;
  onPreview?: () => void;
}

const getDocumentIcon = (fileName: string): { icon: React.ReactNode; code: string } => {
  const name = fileName.toLowerCase();
  if (name.includes('alloc') || name.includes('allocation')) {
    return { icon: <FileText className="h-5 w-5" />, code: 'ALLOC' };
  }
  if (name.includes('sgs') || name.includes('inspection')) {
    return { icon: <FileCheck className="h-5 w-5" />, code: 'SGS' };
  }
  if (name.includes('lading') || name.includes('b/l') || name.includes('bol')) {
    return { icon: <Scale className="h-5 w-5" />, code: 'B/L' };
  }
  if (name.includes('spa') || name.includes('purchase') || name.includes('agreement')) {
    return { icon: <FileText className="h-5 w-5" />, code: 'SPA' };
  }
  if (name.includes('invoice')) {
    return { icon: <FileText className="h-5 w-5" />, code: 'INV' };
  }
  if (name.includes('certificate') || name.includes('cert')) {
    return { icon: <Shield className="h-5 w-5" />, code: 'CERT' };
  }
  if (name.includes('aml') || name.includes('compliance')) {
    return { icon: <Lock className="h-5 w-5" />, code: 'AML' };
  }
  return { icon: <FileText className="h-5 w-5" />, code: 'DOC' };
};

// Generate a deterministic reference ID from template
const generateRefId = (fileName: string, code: string) => {
  const hash = Math.abs([...fileName].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 100000);
  return `PDH-${code}-2026-${hash.toString().padStart(5, '0')}`;
};

export default function DocumentCard({
  template,
  status,
  isLocked,
  isProcessing,
  remainingDownloads,
  maxDownloads,
  onDownload,
  onUpgrade,
  onPreview
}: DocumentCardProps) {
  const displayName = template.metadata?.display_name || template.name || template.title || template.file_name?.replace('.docx', '') || 'Document';
  const description = template.description || template.metadata?.description || '';
  const { icon: docIcon, code: docCode } = getDocumentIcon(template.file_name || '');
  const refId = generateRefId(template.file_name || 'doc', docCode);
  
  const isUnlimited = maxDownloads === null;
  const hasDownloadsLeft = remainingDownloads === undefined || remainingDownloads === null || remainingDownloads > 0;

  const getStatusBadge = () => {
    if (isLocked && !hasDownloadsLeft) {
      return <Badge variant="destructive" className="text-xs">Limit Reached</Badge>;
    }
    if (isLocked) {
      return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Premium</Badge>;
    }
    if (status?.status === 'completed') {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Verified</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-[hsl(210,20%,80%)] text-[hsl(210,55%,30%)]">System Issued</Badge>;
  };

  return (
    <div className={`group relative rounded-lg border bg-[hsl(210,30%,98%)] transition-all duration-200 ${
      isLocked 
        ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10' 
        : 'border-[hsl(210,20%,85%)] hover:border-[hsl(210,55%,40%)] hover:shadow-md'
    }`}>
      <div className="p-4">
        {/* Top Row: Icon, Title, Status Badge */}
        <div className="flex items-start gap-4">
          {/* Document Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
            isLocked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' : 'bg-[hsl(210,40%,92%)] text-[hsl(210,55%,30%)]'
          }`}>
            {docIcon}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">({docCode})</span>
                  <h3 className="font-semibold text-base leading-tight text-[hsl(210,55%,18%)]">{displayName}</h3>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              {getStatusBadge()}
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                PDF
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                PetroDealHub Trade System
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70">{refId}</span>
              {isUnlimited ? (
                <span className="flex items-center gap-1 text-[hsl(210,55%,40%)]">
                  <Infinity className="h-3 w-3" />
                  Unlimited Access
                </span>
              ) : maxDownloads !== undefined && maxDownloads !== null ? (
                <span className={`flex items-center gap-1 ${
                  remainingDownloads === 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'
                }`}>
                  <Download className="h-3 w-3" />
                  {remainingDownloads ?? maxDownloads} / {maxDownloads} remaining
                </span>
              ) : null}
            </div>

            {/* Processing Status */}
            {status && status.status !== 'idle' && status.status !== 'completed' && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[hsl(210,55%,30%)]">
                    {status.message || 'Processing...'}
                  </span>
                  {status.progress !== undefined && (
                    <span className="text-xs font-semibold text-[hsl(210,55%,30%)]">
                      {status.progress}%
                    </span>
                  )}
                </div>
                <Progress value={status.progress || 0} className="h-1.5 [&>div]:bg-[hsl(210,55%,30%)]" />
              </div>
            )}

            {/* Locked Message */}
            {isLocked && (
              <div className="mt-3 p-2.5 bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    {!hasDownloadsLeft ? (
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Monthly download limit reached
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        {template.plan_name ? `Requires ${template.plan_name} plan` : 'Premium document'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[hsl(210,20%,90%)]">
          {onPreview && !isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              disabled={isProcessing}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Preview
            </Button>
          )}
          
          {isLocked ? (
            <Button
              size="sm"
              onClick={onUpgrade}
              className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              <Crown className="h-4 w-4 mr-1.5" />
              Upgrade to Unlock
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onDownload}
                    disabled={isProcessing}
                    className="bg-[hsl(210,55%,25%)] hover:bg-[hsl(210,55%,20%)]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-1.5" />
                        Download Official Copy
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Official certified copy — Download activity logged</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Trust Footer */}
      <div className="px-4 py-2.5 bg-[hsl(210,30%,96%)] border-t border-[hsl(210,20%,90%)] rounded-b-lg">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secured handling
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Compliance verified
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Activity logged
          </span>
        </div>
      </div>
    </div>
  );
}
