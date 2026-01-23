import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Handshake, 
  FileCheck, 
  Shield, 
  DollarSign, 
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Workflow,
  Building2,
  Clock,
  Lock
} from 'lucide-react';

const DealInfoNotice = () => {
  const steps = [
    { number: 1, label: "Select Company", description: "Choose verified partner" },
    { number: 2, label: "Create Deal", description: "Define terms & quantity" },
    { number: 3, label: "Progress Steps", description: "Complete 8-step workflow" },
    { number: 4, label: "IPTO Review", description: "Each step verified" },
    { number: 5, label: "Complete Deal", description: "Finalize transaction" },
  ];

  return (
    <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-slate-500/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Handshake className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              What is a Deal by PetroDealHub?
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Secure Trading
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Structured Deal Workflow Platform
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* Description */}
        <div className="bg-background/60 rounded-xl p-4 border border-border/50">
          <p className="text-muted-foreground leading-relaxed">
            A <span className="font-semibold text-foreground">Deal</span> on PetroDealHub is a structured, 
            verified transaction workflow between buyers and sellers in the petroleum trading industry. 
            Each deal follows an 8-step process with independent oversight to ensure transparency, 
            compliance, and security for all parties involved.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold text-foreground">Verified Workflow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Each step is reviewed by IPTO before proceeding to the next stage
            </p>
          </div>
          
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-foreground">Commission Protection</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your commission is protected through IMFPA agreements
            </p>
          </div>
          
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-foreground">Document Security</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All documents are securely stored and timestamped
            </p>
          </div>
        </div>

        {/* How Deals Work */}
        <div className="bg-muted/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">How Deals Work</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center text-center min-w-[100px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                    step.number === 3 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {step.number}
                  </div>
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{step.description}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* The 8-Step Process Overview */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-foreground">8-Step Deal Process</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: 1, name: "Buyer Acceptance" },
              { num: 2, name: "Contract Signing" },
              { num: 3, name: "PPOP Documents" },
              { num: 4, name: "Bank Instrument" },
              { num: 5, name: "Full POP + 2% PB" },
              { num: 6, name: "Shipment Begins" },
              { num: 7, name: "Final Inspection" },
              { num: 8, name: "Commission Payment" },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {step.num}
                </span>
                <span className="text-muted-foreground">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Important Notice</p>
            <p className="text-sm text-muted-foreground">
              All deals require <span className="font-medium text-amber-600">IPTO oversight</span>. 
              Each step must be reviewed and approved before proceeding to the next stage. 
              Document uploads are mandatory for certain steps. IPTO acts as an independent workflow reviewer 
              and does not guarantee payment, delivery, or performance.
            </p>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Pro Tips</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Keep all trade documents organized and ready for upload
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Ensure counterparty information is accurate before submission
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Contact support if any step requires clarification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Complete your IMFPA agreement to protect your commission
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealInfoNotice;
