import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield, Scale, FileCheck } from 'lucide-react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function LegalDisclaimerModal({
  isOpen,
  onAccept,
  onCancel
}: LegalDisclaimerModalProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      // Store acceptance in localStorage
      localStorage.setItem('trade_docs_disclaimer_accepted', 'true');
      localStorage.setItem('trade_docs_disclaimer_timestamp', new Date().toISOString());
      onAccept();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Legal Notice
          </DialogTitle>
          <DialogDescription className="sr-only">
            Legal disclaimer for document download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
              This document is provided for <strong>legitimate commercial use only</strong>. 
              Redistribution, misuse, or unauthorized disclosure is <strong>strictly prohibited</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Confidential Commercial Document</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This document contains commercially sensitive information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Legal Responsibility</p>
                <p className="text-xs text-muted-foreground mt-1">
                  User assumes full legal responsibility for proper use
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Access Logged</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All download activities are logged for compliance purposes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="agree-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label
              htmlFor="agree-terms"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree and accept responsibility for the proper use of this document
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to check if disclaimer was accepted
export function hasAcceptedDisclaimer(): boolean {
  return localStorage.getItem('trade_docs_disclaimer_accepted') === 'true';
}
