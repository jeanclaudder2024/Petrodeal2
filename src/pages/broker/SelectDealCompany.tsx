import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Building2, ArrowLeft, Globe, Shield, FileText, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDealFlow } from '@/contexts/DealFlowContext';
import { toast } from 'sonner';

interface DealCompany {
  id: string;
  company_id: number;
  role: string;
  product_tags: string[];
  display_order: number;
  is_enabled: boolean;
  companies: {
    id: number;
    name: string;
    country: string | null;
    is_verified: boolean | null;
    logo_url: string | null;
  };
}

const SelectDealCompany = () => {
  const navigate = useNavigate();
  const { setSelectedCompany } = useDealFlow();
  const [companies, setCompanies] = useState<DealCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCompany, setConfirmCompany] = useState<DealCompany | null>(null);

  useEffect(() => {
    fetchDealCompanies();
  }, []);

  const fetchDealCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('broker_deal_companies')
        .select(`
          id,
          company_id,
          role,
          product_tags,
          display_order,
          is_enabled,
          companies (
            id,
            name,
            country,
            is_verified,
            logo_url
          )
        `)
        .eq('is_enabled', true)
        .order('display_order');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching deal companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (!confirmCompany) return;
    setSelectedCompany({
      id: confirmCompany.id,
      companyId: confirmCompany.company_id,
      companyName: confirmCompany.companies.name,
      country: confirmCompany.companies.country,
      role: confirmCompany.role,
      productTags: confirmCompany.product_tags || [],
      isVerified: confirmCompany.companies.is_verified || false,
    });
    setConfirmCompany(null);
    navigate('/broker-dashboard/deal-overview');
  };

  const getPriorityLabel = (order: number) => {
    if (order === 1) return 'Primary Mandate';
    if (order === 2) return 'Priority #2';
    return `Priority #${order}`;
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Principal':
        return 'bg-[hsl(215,70%,25%)] text-white border-[hsl(215,70%,35%)]';
      case 'Mandated Seller':
        return 'bg-emerald-700 text-white border-emerald-600';
      case 'Mandated Buyer':
        return 'bg-amber-700 text-white border-amber-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/broker-dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="border-2 border-amber-200 dark:border-amber-900/50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No Deal Companies Configured</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Deal companies have not been set up yet. These are pre-approved companies you can create deals with.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/broker-dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button onClick={() => navigate('/support')}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Legal Banner */}
        <div className="bg-[hsl(215,50%,12%)] text-[hsl(215,20%,80%)] py-2.5 px-4 text-center">
          <p className="text-xs tracking-wide">
            <Shield className="h-3 w-3 inline mr-1.5 -mt-0.5" />
            All companies listed below are compliance-approved entities. Selection confirms mandate authorization.
          </p>
        </div>

        <div className="max-w-[1200px] mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate('/broker-dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Select Approved Counterparty for Execution
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose from your compliance-approved mandates to proceed with this transaction.
            </p>
          </div>

          {/* Company Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {companies.map((company) => {
              const isVerified = company.companies.is_verified;
              const isDisabled = !isVerified;

              return (
                <Card
                  key={company.id}
                  className={`relative overflow-hidden transition-all duration-300 border-2 group ${
                    isDisabled
                      ? 'opacity-60 border-muted bg-muted/30'
                      : 'hover:shadow-xl hover:border-[hsl(215,60%,30%)] hover:shadow-[hsl(215,50%,20%)]/10'
                  }`}
                >
                  {/* Priority Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-amber-500/90 text-white border-amber-400 text-[10px] uppercase tracking-wider font-semibold">
                      {getPriorityLabel(company.display_order)}
                    </Badge>
                  </div>

                  {/* Disabled Overlay */}
                  {isDisabled && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex flex-col items-center gap-2">
                            <Lock className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground font-medium">Verification Pending</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This company has not completed verification yet.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  <CardContent className="p-6 pt-12">
                    {/* Company Logo + Name */}
                    <div className="flex items-center gap-3 mb-4">
                      {company.companies.logo_url ? (
                        <img 
                          src={company.companies.logo_url} 
                          alt={company.companies.name} 
                          className="w-12 h-12 rounded-lg object-contain border border-border bg-white p-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-foreground">
                        {company.companies.name}
                      </h3>
                    </div>

                    {/* Structured Info */}
                    <div className="space-y-3 mb-5">
                      {company.companies.country && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Headquarters:</span>
                          <span className="font-medium text-foreground">{company.companies.country}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Mandate Type:</span>
                        <Badge className={getRoleBadgeStyle(company.role)} variant="outline">
                          {company.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Compliance:</span>
                        {isVerified ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Tags */}
                    {company.product_tags && company.product_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {company.product_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Trust Signal */}
                    {isVerified && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-5">
                            <Shield className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Compliance Approved Entity</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This company has completed full KYC and mandate verification.</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Select Button */}
                    <Button
                      onClick={() => setConfirmCompany(company)}
                      disabled={isDisabled}
                      className="w-full bg-[hsl(215,60%,25%)] hover:bg-[hsl(215,60%,30%)] text-white transition-all duration-200 group-hover:shadow-md"
                    >
                      Proceed with {company.companies.name.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={!!confirmCompany} onOpenChange={() => setConfirmCompany(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Counterparty Selection</DialogTitle>
              <DialogDescription>
                You are selecting <strong>{confirmCompany?.companies.name}</strong> as the counterparty for this transaction. This will proceed to deal creation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{confirmCompany?.companies.name}</p>
                  <p className="text-sm text-muted-foreground">{confirmCompany?.role} • {confirmCompany?.companies.country}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmCompany(null)}>Cancel</Button>
              <Button onClick={handleConfirmSelection} className="bg-[hsl(215,60%,25%)] hover:bg-[hsl(215,60%,30%)] text-white">
                Confirm Selection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default SelectDealCompany;
