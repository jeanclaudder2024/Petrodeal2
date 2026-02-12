import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, ArrowRight, CheckCircle2, Download, Infinity } from 'lucide-react';
import { DocumentTemplate } from './types';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate | null;
}

export default function UpgradeDialog({ isOpen, onClose, template }: UpgradeDialogProps) {
  const navigate = useNavigate();

  if (!template) return null;

  const displayName = template.metadata?.display_name || template.name || template.title || 'This document';
  const isLimitReached = template.remaining_downloads !== undefined && 
                          template.remaining_downloads !== null && 
                          template.remaining_downloads <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upgrade your plan to access this document
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="font-medium text-base mb-3">{displayName}</p>
          
          {isLimitReached ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Your monthly download limit for this template has been reached.</p>
              {template.max_downloads !== null && template.max_downloads !== undefined && (
                <p>
                  You've used <strong>{template.max_downloads}</strong> out of{' '}
                  <strong>{template.max_downloads}</strong> downloads this month.
                </p>
              )}
            </div>
          ) : template.plan_name ? (
            <p className="text-sm text-muted-foreground">
              This template requires the <strong>{template.plan_name}</strong> plan to access.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This template is not available in your current plan.
            </p>
          )}

          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">Benefits of Upgrading</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Access to all premium document templates
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-green-500" />
                    Increased or unlimited monthly downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <Infinity className="h-3.5 w-3.5 text-green-500" />
                    Priority support and compliance features
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate('/subscription');
            }}
            className="w-full sm:w-auto group"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            View Plans & Upgrade
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
