import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';

interface AccessGateProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showUpgradePrompt?: boolean;
}

const AccessGate: React.FC<AccessGateProps> = ({ 
  children, 
  fallbackMessage,
  showUpgradePrompt = true 
}) => {
  const { hasAccess, accessType, trialDaysLeft, loading } = useAccess();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied - show appropriate message
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="text-red-800">
          {accessType === 'expired' ? 'Access Expired' : 'Premium Feature'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          {accessType === 'expired' ? (
            <div>
              <p className="text-red-700 font-medium">Your free trial has ended</p>
              <p className="text-sm text-red-600">
                Subscribe to continue accessing the platform and all its features.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-red-700 font-medium">
                {fallbackMessage || 'This feature requires a subscription'}
              </p>
              <p className="text-sm text-red-600">
                Upgrade your plan to unlock this feature and get full platform access.
              </p>
            </div>
          )}
        </div>

        {accessType === 'trial' && trialDaysLeft > 0 && (
          <div className="p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Trial expires in {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        )}

        {showUpgradePrompt && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/subscription')}
              className="group"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {accessType === 'expired' ? 'Subscribe Now' : 'Upgrade Plan'}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {accessType !== 'expired' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
              >
                Start Free Trial
              </Button>
            )}
          </div>
        )}

        {accessType === 'expired' && (
          <div className="text-xs text-muted-foreground">
            <p>
              Need help? Contact our support team for assistance with your subscription.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessGate;