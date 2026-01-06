import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackTrialStarted } from '@/utils/analytics';

interface AccessInfo {
  hasAccess: boolean;
  accessType: 'subscription' | 'trial' | 'expired' | 'preview';
  trialDaysLeft: number;
  isSubscribed: boolean;
  loading: boolean;}

interface AccessContextType extends AccessInfo {
  checkAccess: () => Promise<void>;
  startTrial: () => Promise<void>;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accessInfo, setAccessInfo] = useState<AccessInfo>({
    hasAccess: false,
    accessType: 'preview',
    trialDaysLeft: 0,
    isSubscribed: false,
    loading: true,
  });

  const checkAccess = async () => {
    if (!user?.email) {
      setAccessInfo({
        hasAccess: false,
        accessType: 'preview',
        trialDaysLeft: 0,
        isSubscribed: false,
        loading: false,
      });
      return;
    }

    try {
      setAccessInfo(prev => ({ ...prev, loading: true }));
      // Use the new check-subscription function
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        setAccessInfo({
          hasAccess: false,
          accessType: 'preview',
          trialDaysLeft: 0,
          isSubscribed: false,
          loading: false,
        });
        return;
      }
      if (data) {
        setAccessInfo({
          hasAccess: data.subscribed || data.trial_active,
          accessType: data.access_type || 'preview',
          trialDaysLeft: data.trial_days_left || 0,
          isSubscribed: data.subscribed || false,
          loading: false,
        });
      } else {
        setAccessInfo({
          hasAccess: false,
          accessType: 'expired',
          trialDaysLeft: 0,
          isSubscribed: false,
          loading: false,
        });
      }
    } catch (error) {
      setAccessInfo({
        hasAccess: false,
        accessType: 'preview',
        trialDaysLeft: 0,
        isSubscribed: false,
        loading: false,
      });
    }
  };

  const startTrial = async () => {
    if (!user?.email || !user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }
    try {
      // Use the new start_trial_with_plan function
      const { data, error } = await supabase.rpc('start_trial_with_plan', {
        user_email: user.email,
        user_id_param: user.id,
        plan_tier_param: 'basic',
        trial_days: 5
      });
      if (error) {
        toast({
          title: "Error",
          description: "Failed to start trial period",
          variant: "destructive"
        });
        return;
      }
      const result = data as { success?: boolean; error?: string };
      if (result && !result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to start trial period",
          variant: "destructive"
        });
        return;
      }
      // Track trial start in GA4
      trackTrialStarted(5);
      toast({
        title: "Trial Started!",
        description: "Your 5-day free trial has begun with Basic plan features. Enjoy exploring the platform!",
      });
      await checkAccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start trial period",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkAccess();
  }, [user]);

  const contextValue: AccessContextType = {
    ...accessInfo,
    checkAccess,
    startTrial,
  };

  return (
    <AccessContext.Provider value={contextValue}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};