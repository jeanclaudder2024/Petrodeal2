import React, { useEffect, useCallback, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface AccessData {
  access_type?: string;
  trial_active?: boolean;
  trial_days_left?: number;
  trial_used?: boolean;
}

const TrialCountdown: React.FC = () => {
  const navigate = useNavigate();
  const [accessData, setAccessData] = useState<AccessData | null>(null);

  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setAccessData(data);
    } catch (error) {
      console.error('Error checking access:', error);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Don't show countdown if:
  // - Trial is already used or expired
  // - User has active subscription
  // - Access type is not trial
  if (!accessData || 
      accessData.trial_used || 
      accessData.access_type === 'expired' || 
      accessData.access_type === 'subscription' ||
      accessData.access_type !== 'trial' ||
      !accessData.trial_active) {
    return null;
  }

  const trialDaysLeft = accessData.trial_days_left || 0;
  const isLastDay = trialDaysLeft <= 1;
  const isUrgent = trialDaysLeft <= 2;

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
                  {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
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