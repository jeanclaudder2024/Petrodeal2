import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  FileCheck,
  Scale,
  Download,
  CheckCircle2,
  FileWarning,
  Clock,
  Lock,
  FileText,
  Globe,
  Ship,
  Leaf
} from 'lucide-react';

// Compliance frameworks with legal-safe tooltips
const complianceFrameworks = [
  { 
    id: 'sgs', 
    label: 'SGS', 
    icon: FileCheck,
    tooltip: 'Aligned with SGS-style inspection and verification structures.' 
  },
  { 
    id: 'icc', 
    label: 'ICC', 
    icon: Globe,
    tooltip: 'Compatible with ICC trade and documentation frameworks.' 
  },
  { 
    id: 'iso', 
    label: 'ISO', 
    icon: FileText,
    tooltip: 'Structured according to ISO-compliant documentation practices.' 
  },
  { 
    id: 'imo', 
    label: 'IMO', 
    icon: Ship,
    tooltip: 'Maritime data aligned with IMO regulatory structures.' 
  },
  { 
    id: 'marpol', 
    label: 'MARPOL', 
    icon: Leaf,
    tooltip: 'Environmental compliance structure aligned with MARPOL conventions.' 
  },
];

interface SecureDownloadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  status: 'verifying' | 'validating' | 'downloading' | 'completed' | 'failed' | 'idle';
  progress: number;
  message: string;
  onRetry?: () => void;
}

export default function SecureDownloadFlow({
  isOpen,
  onClose,
  documentName,
  status,
  progress,
  message,
  onRetry
}: SecureDownloadFlowProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Elapsed time counter
  useEffect(() => {
    if (status === 'idle' || status === 'completed' || status === 'failed') {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Reset on open
  useEffect(() => {
    if (isOpen) setElapsedSeconds(0);
  }, [isOpen]);

  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Shield className="h-6 w-6 text-[hsl(210,60%,30%)] animate-pulse" />;
      case 'validating':
        return <FileCheck className="h-6 w-6 text-[hsl(210,60%,30%)] animate-pulse" />;
      case 'downloading':
        return <Download className="h-6 w-6 text-[hsl(210,60%,30%)] animate-bounce" />;
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <FileWarning className="h-6 w-6 text-destructive" />;
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const isProcessing = status === 'verifying' || status === 'validating' || status === 'downloading';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && status !== 'downloading' && onClose()}>
      <DialogContent className="sm:max-w-md border-[hsl(210,20%,85%)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[hsl(210,55%,18%)]">
            {getStatusIcon()}
            <span>Secure Trade Document Processing</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="font-medium text-foreground">{documentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* System Status Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[hsl(210,30%,96%)] border border-[hsl(210,20%,88%)]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-[hsl(210,55%,25%)]">System Status: Active</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Est. ~4–8 sec</span>
                <span className="font-mono">{formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>
          )}

          {/* Status Steps */}
          <div className="space-y-3">
            <StepRow
              active={status === 'verifying'}
              done={status === 'validating' || status === 'downloading' || status === 'completed'}
              failed={status === 'failed'}
              icon={<Shield className="h-4 w-4" />}
              label="Verifying access permissions"
              sublabel="Ensuring authorized trade party access"
            />
            <StepRow
              active={status === 'validating'}
              done={status === 'downloading' || status === 'completed'}
              failed={false}
              icon={<Scale className="h-4 w-4" />}
              label="Validating document integrity"
              sublabel="Preventing tampering or unauthorized modification"
            />
            <StepRow
              active={status === 'downloading'}
              done={status === 'completed'}
              failed={false}
              icon={<Download className="h-4 w-4" />}
              label="Preparing official certified copy"
              sublabel="Issued under platform compliance framework"
            />
          </div>

          {/* Progress Bar */}
          {status !== 'idle' && status !== 'failed' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2 [&>div]:bg-[hsl(210,55%,30%)]" />
              <p className="text-xs text-center text-muted-foreground">
                {message || 'Processing...'}
              </p>
            </div>
          )}

          {/* Compliance Frameworks */}
          {(status === 'downloading' || status === 'completed') && (
            <div className="pt-4 border-t border-[hsl(210,20%,88%)] animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
                Compliance & Verification Frameworks
              </p>
              <TooltipProvider>
                <div className="flex items-center justify-center gap-4">
                  {complianceFrameworks.map((framework, index) => {
                    const IconComponent = framework.icon;
                    return (
                      <Tooltip key={framework.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex flex-col items-center gap-1 opacity-0 animate-in fade-in duration-700"
                            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                          >
                            <div className="w-8 h-8 rounded-md bg-[hsl(210,30%,96%)] flex items-center justify-center border border-[hsl(210,20%,88%)]">
                              <IconComponent className="h-4 w-4 text-[hsl(210,55%,30%)]" />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {framework.label}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                          {framework.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              <p className="text-[10px] text-muted-foreground text-center mt-3 italic">
                Document processing follows verification frameworks compatible with recognized industry standards.
              </p>
            </div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Official Trade Document Released
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Integrity & Compliance Verified · Activity Recorded in Audit Log
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 italic">
                    This document is suitable for professional trade use
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FileWarning className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Processing failed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message || 'Please try again or contact support'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === 'completed' && (
            <Button onClick={onClose} className="w-full bg-[hsl(210,55%,25%)] hover:bg-[hsl(210,55%,20%)]">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
          {status === 'failed' && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {onRetry && (
                <Button onClick={onRetry} className="flex-1 bg-[hsl(210,55%,25%)] hover:bg-[hsl(210,55%,20%)]">
                  Retry
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Step row sub-component
function StepRow({ active, done, failed, icon, label, sublabel }: {
  active: boolean;
  done: boolean;
  failed: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? 'bg-green-100 dark:bg-green-900/30' : active ? 'bg-[hsl(210,40%,92%)]' : 'bg-muted'
      }`}>
        {active ? (
          <span className="text-[hsl(210,55%,30%)] animate-pulse">{icon}</span>
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>
      <div>
        <span className={`text-sm block ${active ? 'font-medium text-[hsl(210,55%,25%)]' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{sublabel}</span>
      </div>
    </div>
  );
}
