import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, ArrowLeft } from 'lucide-react';
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
  };
}

const SelectDealCompany = () => {
  const navigate = useNavigate();
  const { setSelectedCompany } = useDealFlow();
  const [companies, setCompanies] = useState<DealCompany[]>([]);
  const [loading, setLoading] = useState(true);

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
            is_verified
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

  const handleSelectCompany = (company: DealCompany) => {
    setSelectedCompany({
      id: company.id,
      companyId: company.company_id,
      companyName: company.companies.name,
      country: company.companies.country,
      role: company.role,
      productTags: company.product_tags || [],
      isVerified: company.companies.is_verified || false,
    });
    navigate('/broker-dashboard/deal-overview');
  };

  const getOrderNumber = (order: number) => {
    const numbers = ['①', '②', '③'];
    return numbers[order - 1] || order.toString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Principal':
        return 'bg-blue-600 text-white';
      case 'Mandated Seller':
        return 'bg-emerald-600 text-white';
      case 'Mandated Buyer':
        return 'bg-amber-600 text-white';
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
          <Button
            variant="ghost"
            onClick={() => navigate('/broker-dashboard')}
            className="mb-6"
          >
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
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-sm mb-2">What to do next:</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    Contact the administration team to request company setup
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    Administrators can add companies via Admin Panel → Broker → Deal Companies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    Once configured, you'll see available companies here
                  </li>
                </ul>
              </div>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/broker-dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Select the Company for This Deal
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose one of the approved companies to proceed with your deal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
            >
              <CardContent className="p-6">
                {/* Large Number Badge */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {getOrderNumber(company.display_order)}
                    </span>
                  </div>
                </div>

                {/* Company Name */}
                <h3 className="text-xl font-bold text-center text-foreground mb-2">
                  {company.companies.name}
                </h3>

                {/* Country */}
                {company.companies.country && (
                  <p className="text-center text-muted-foreground mb-4">
                    📍 {company.companies.country}
                  </p>
                )}

                {/* Role Badge */}
                <div className="flex justify-center mb-4">
                  <Badge className={getRoleBadgeColor(company.role)}>
                    {company.role}
                  </Badge>
                </div>

                {/* Product Tags */}
                {company.product_tags && company.product_tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {company.product_tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Verified Badge */}
                {company.companies.is_verified && (
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  </div>
                )}

                {/* Select Button */}
                <Button
                  onClick={() => handleSelectCompany(company)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Select Company
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectDealCompany;
