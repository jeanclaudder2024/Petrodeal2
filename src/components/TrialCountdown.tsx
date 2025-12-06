import React, { useEffect, useCallback, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '@/contexts/AccessContext';
import { supabase } from "@/integrations/supabase/client";

interface AccessData {
  access_type?: string;
  trial_active?: boolean;
  trial_days_left?: number;
  trial_used?: boolean;
}

const TrialCountdown: React.FC = () => {
  const navigate = useNavigate();
  const { accessType, trialDaysLeft: contextTrialDays } = useAccess();
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setAccessData(data);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Use context data as fallback if API data is not available
  const isTrial = accessType === 'trial' || accessData?.access_type === 'trial';
  const isExpired = accessType === 'expired' || accessData?.access_type === 'expired';
  const hasSubscription = accessType === 'subscription' || accessData?.access_type === 'subscription';
  
  // Get trial days from API first, fallback to context
  const trialDaysLeft = accessData?.trial_days_left ?? contextTrialDays ?? 0;
  const trialActive = accessData?.trial_active ?? isTrial;

  // Don't show countdown if:
  // - Loading (wait for data)
  // - Trial is expired
  // - User has active subscription
  // - Trial is not active
  if (loading) {
    return null; // Don't show while loading
  }

  if (isExpired || hasSubscription || !trialActive || !isTrial) {
    return null;
  }

  // Show countdown even if trial_days_left is 0 but trial is still active
  const displayDays = Math.max(0, trialDaysLeft);
  const isLastDay = displayDays <= 1;
  const isUrgent = displayDays <= 2;

  return (
    <Card className={`border-2 ${isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-primary/50 bg-primary/5'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              {isLastDay ? <Clock className="h-5 w-5 text-destructive" /> : <Calendar className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={isUrgent ? "destructive" : "default"} className="text-xs">
                  FREE TRIAL
                </Badge>
                <span className={`font-semibold ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
                  {displayDays} {displayDays === 1 ? 'day' : 'days'} left
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isLastDay 
                  ? "Your trial expires today! Upgrade to continue accessing all features."
                  : "Upgrade now to unlock unlimited access and premium features."
                }
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/subscription')}
            variant={isUrgent ? "destructive" : "default"}
            size="sm"
            className="whitespace-nowrap"
          >
            {isLastDay ? 'Upgrade Now' : 'View Plans'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialCountdown;