import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Lock, CheckCircle } from 'lucide-react';
import { useDealFlow } from '@/contexts/DealFlowContext';
import CreateDealForm from '@/components/broker/CreateDealForm';

const CreateDealWithCompany = () => {
  const navigate = useNavigate();
  const { selectedCompany, clearFlow } = useDealFlow();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!selectedCompany) {
      navigate('/broker-dashboard/select-company');
    } else {
      setShowForm(true);
    }
  }, [selectedCompany, navigate]);

  const handleSuccess = (dealId: string) => {
    clearFlow();
    navigate('/broker-dashboard', { 
      state: { 
        newDealId: dealId,
        selectedCompanyId: selectedCompany?.id 
      } 
    });
  };

  const handleCancel = () => {
    navigate('/broker-dashboard/deal-overview');
  };

  if (!selectedCompany || !showForm) {
    return null;
  }

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/broker-dashboard/deal-overview')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deal Overview
        </Button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create New Deal
          </h1>
          <p className="text-muted-foreground">
            Complete the deal details below
          </p>
        </div>

        {/* Selected Company Card - Locked */}
        <Card className="mb-8 border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      {selectedCompany.companyName}
                    </h3>
                    {selectedCompany.isVerified && (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleBadgeColor(selectedCompany.role)}>
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
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Locked</span>
              </div>
            </div>

            {/* Product Tags */}
            {selectedCompany.productTags && selectedCompany.productTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Products:</span>
                  {selectedCompany.productTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Deal Form - Embedded Mode */}
        <Card>
          <CardContent className="p-6">
            <CreateDealForm 
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              selectedCompanyId={selectedCompany.id}
              isEmbedded={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDealWithCompany;
