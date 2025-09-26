import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Crown, 
  AlertTriangle,
  CreditCard,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';

const TrialStatus = () => {
  const { accessType, trialDaysLeft, isSubscribed, hasAccess } = useAccess();
  const navigate = useNavigate();

  if (isSubscribed) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Premium Subscriber</p>
                <p className="text-sm text-green-600">Full platform access</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accessType === 'trial' && hasAccess) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Free Trial Active</p>
                <p className="text-sm text-blue-600">
                  {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Trial
              </Badge>
              {trialDaysLeft <= 2 && (
                <Button 
                  size="sm" 
                  onClick={() => navigate('/subscription')}
                  className="ml-2"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
          {trialDaysLeft <= 2 && (
            <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
              Your trial expires soon. Upgrade to continue accessing the platform.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (accessType === 'expired' || !hasAccess) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Trial Expired</p>
                <p className="text-sm text-red-600">
                  Subscribe to continue using the platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                Expired
              </Badge>
              <Button 
                size="sm" 
                onClick={() => navigate('/subscription')}
                className="ml-2"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Subscribe
              </Button>
            </div>
          </div>
          <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
            Your free trial has ended. Please subscribe to regain access to all platform features.
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default TrialStatus;