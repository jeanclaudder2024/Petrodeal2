import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight,
  Shield, 
  Clock, 
  FileText, 
  CheckCircle,
  Handshake,
  Fuel,
  Scale,
  CreditCard,
  Search,
  Ship
} from 'lucide-react';
import { useDealFlow } from '@/contexts/DealFlowContext';

const dealSteps = [
  {
    step: 1,
    name: 'Initial Contact',
    icon: Handshake,
    documents: ['CIS', 'KYC', 'NDA'],
    description: 'Exchange initial company information and sign confidentiality agreements'
  },
  {
    step: 2,
    name: 'Offer',
    icon: FileText,
    documents: ['SCO', 'Product Specifications'],
    description: 'Present and review the soft corporate offer with product details'
  },
  {
    step: 3,
    name: 'Proof of Product',
    icon: Fuel,
    documents: ['POP', 'Allocation Letter'],
    description: 'Verify product availability and allocation confirmation'
  },
  {
    step: 4,
    name: 'Agreement',
    icon: Scale,
    documents: ['FCO', 'SPA Draft'],
    description: 'Finalize the full corporate offer and draft sale/purchase agreement'
  },
  {
    step: 5,
    name: 'Financial Instrument',
    icon: CreditCard,
    documents: ['LC', 'SBLC', 'MT700'],
    description: 'Issue and verify banking instruments for payment security'
  },
  {
    step: 6,
    name: 'Inspection',
    icon: Search,
    documents: ['SGS', 'Q&Q'],
    description: 'Conduct quality and quantity inspection by certified agency'
  },
  {
    step: 7,
    name: 'Shipping',
    icon: Ship,
    documents: ['B/L', 'NOR', 'Charter Party'],
    description: 'Execute shipping arrangements and documentation'
  },
  {
    step: 8,
    name: 'Completion',
    icon: CheckCircle,
    documents: ['Deal closure', 'Commission confirmation'],
    description: 'Finalize the transaction and confirm commission payments'
  }
];

const benefits = [
  {
    icon: Shield,
    title: 'Prevent Fake Deals',
    description: 'Filter out non-serious and fraudulent transactions'
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Structured process eliminates unnecessary back-and-forth'
  },
  {
    icon: FileText,
    title: 'Protect Documentation',
    description: 'Ensure all required documents are properly collected'
  },
  {
    icon: CheckCircle,
    title: 'Executable Transactions',
    description: 'Only complete deals that can be successfully closed'
  }
];

const DealOverview = () => {
  const navigate = useNavigate();
  const { selectedCompany } = useDealFlow();

  useEffect(() => {
    if (!selectedCompany) {
      navigate('/broker-dashboard/select-company');
    }
  }, [selectedCompany, navigate]);

  if (!selectedCompany) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/broker-dashboard/select-company')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Company Selection
        </Button>

        {/* Selected Company Banner */}
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  {selectedCompany.companyName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedCompany.companyName}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedCompany.role}
                  </Badge>
                  {selectedCompany.country && (
                    <span className="text-sm text-muted-foreground">
                      📍 {selectedCompany.country}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Deal Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Deal Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6">
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>This is a <strong>structured brokered oil deal</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>The deal follows a <strong>fixed multi-step process</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Each step requires <strong>specific documents</strong> before moving forward.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>This structure <strong>protects brokers</strong> and filters non-serious deals.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Why This Structure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Why This Structure Exists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <benefit.icon className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Deal Steps Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Deal Steps Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              
              <div className="space-y-6">
                {dealSteps.map((step, index) => (
                  <div key={step.step} className="relative flex gap-4 md:gap-6">
                    {/* Step Number Circle */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center z-10 shadow-lg">
                      <step.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            STEP {step.step}
                          </span>
                          <h4 className="font-semibold text-foreground">
                            {step.name}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {step.documents.map((doc, docIndex) => (
                            <Badge key={docIndex} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate('/broker-dashboard/create-deal')}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
          >
            Proceed to Create Deal
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DealOverview;
