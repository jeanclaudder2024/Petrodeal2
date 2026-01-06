import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  Lock, 
  DollarSign, 
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Workflow
} from 'lucide-react';

const IMFPAInfoNotice = () => {
  const steps = [
    { number: 1, label: "Create Deal", description: "Start a new trading deal" },
    { number: 2, label: "Complete Steps 1-7", description: "Progress through deal workflow" },
    { number: 3, label: "Step 8 Approval", description: "Unlock seller/buyer fields" },
    { number: 4, label: "Fill IMFPA", description: "Complete all agreement fields" },
    { number: 5, label: "Sign & Submit", description: "Digital signature & submission" },
  ];

  return (
    <Card className="mb-6 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-primary/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              What is IMFPA?
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                Commission Protection
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Irrevocable Master Fee Protection Agreement
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* Description */}
        <div className="bg-background/60 rounded-xl p-4 border border-border/50">
          <p className="text-muted-foreground leading-relaxed">
            The <span className="font-semibold text-foreground">IMFPA</span> is a legally binding document that protects your commission 
            in oil trading deals. It establishes an irrevocable agreement between all parties 
            (broker, seller, and buyer) to ensure your fee is protected throughout the transaction.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-foreground">Commission Security</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your commission is legally protected and cannot be bypassed
            </p>
          </div>
          
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-foreground">Legal Documentation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Internationally recognized agreement with governing law provisions
            </p>
          </div>
          
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-foreground">Secure Process</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Digital signatures and encrypted document handling
            </p>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-muted/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">How IMFPA Works</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center text-center min-w-[100px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                    step.number === 3 
                      ? 'bg-amber-500 text-white' 
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

        {/* Important Notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Important Notice</p>
            <p className="text-sm text-muted-foreground">
              Seller and Buyer entity fields are <span className="font-medium text-amber-600">locked until Step 8 is approved</span>. 
              This ensures deal verification before finalizing the IMFPA. You can fill in broker information and commission 
              terms beforehand.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Pro Tips</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Use "AI Generate" to auto-fill common fields based on your deal type
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Always verify bank details before signing the agreement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Download and keep a copy of the signed IMFPA for your records
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IMFPAInfoNotice;