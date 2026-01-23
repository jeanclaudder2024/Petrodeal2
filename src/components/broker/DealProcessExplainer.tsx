import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FileSignature, 
  FolderOpen, 
  Building2, 
  ScrollText, 
  Ship, 
  ClipboardCheck, 
  Coins,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Buyer Acceptance',
    description: 'Buyer issues official ICPO addressed to the end seller',
    icon: FileText,
    actionOwner: 'Buyer',
    color: 'bg-blue-500'
  },
  {
    number: 2,
    title: 'Contract Signing',
    description: 'Seller issues draft SPA, buyer signs and returns',
    icon: FileSignature,
    actionOwner: 'Seller/Buyer',
    color: 'bg-indigo-500'
  },
  {
    number: 3,
    title: 'PPOP Documents',
    description: 'Seller releases partial Proof of Product documents',
    icon: FolderOpen,
    actionOwner: 'Seller',
    color: 'bg-purple-500'
  },
  {
    number: 4,
    title: 'Bank Instrument',
    description: 'Buyer issues DLC MT700 or SBLC MT760',
    icon: Building2,
    actionOwner: 'Buyer',
    color: 'bg-pink-500'
  },
  {
    number: 5,
    title: 'Full POP + 2% PB',
    description: 'Seller releases full POP upon instrument confirmation',
    icon: ScrollText,
    actionOwner: 'Seller',
    color: 'bg-rose-500'
  },
  {
    number: 6,
    title: 'Shipment Begins',
    description: 'Cargo shipment commences to destination port',
    icon: Ship,
    actionOwner: 'Seller',
    color: 'bg-orange-500'
  },
  {
    number: 7,
    title: 'Inspection & Payment',
    description: 'Buyer conducts SGS/CIQ inspection, payment released',
    icon: ClipboardCheck,
    actionOwner: 'Buyer',
    color: 'bg-amber-500'
  },
  {
    number: 8,
    title: 'Commissions',
    description: 'Intermediary commissions paid within 2-4 days',
    icon: Coins,
    actionOwner: 'Seller',
    color: 'bg-emerald-500'
  }
];

const benefits = [
  {
    icon: Shield,
    title: 'Protected Transaction',
    description: 'Each step is verified before proceeding to ensure compliance and reduce risk'
  },
  {
    icon: Clock,
    title: 'Clear Timeline',
    description: 'Structured workflow with defined milestones keeps all parties aligned'
  },
  {
    icon: CheckCircle,
    title: 'Audit Trail',
    description: 'Complete documentation of every step for transparency and accountability'
  }
];

interface DealProcessExplainerProps {
  onViewSteps?: () => void;
}

const DealProcessExplainer: React.FC<DealProcessExplainerProps> = ({ onViewSteps }) => {
  return (
    <Card className="border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <FileSignature className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl">Understanding Deal Steps</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              How structured deal progression protects all parties
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Introduction */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Why This Structure Matters</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Oil trading involves significant value and complexity. Our 8-step process ensures 
            each party fulfills their obligations before the transaction progresses. This protects 
            sellers, buyers, and intermediaries while creating a verifiable audit trail.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">{benefit.title}</h4>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Step Timeline */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span>Deal Steps Overview</span>
            <Badge variant="outline" className="text-xs font-normal">8 Steps</Badge>
          </h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 hidden md:block" />
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div 
                  key={step.number}
                  className="flex items-start gap-4 group"
                >
                  {/* Step Number Circle */}
                  <div className={`relative z-10 w-12 h-12 rounded-full ${step.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                    <step.icon className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 group-hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Step {step.number}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm">{step.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {step.actionOwner}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Progress */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            How to Progress Through Steps
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              Click "View Steps" on any active deal to see the current progress
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              Upload required documents or add notes for the current step
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              Submit the step for IPTO review (when applicable)
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              Once approved, the next step unlocks automatically
            </li>
          </ol>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-700 pt-4">
          <p>
            <strong>Disclaimer:</strong> International Petroleum Trade Oversight (IPTO) acts as an independent 
            workflow reviewer only. IPTO does not guarantee payment, delivery, or performance of any transaction.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealProcessExplainer;
