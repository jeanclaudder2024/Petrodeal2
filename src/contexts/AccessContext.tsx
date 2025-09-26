import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AccessInfo {
  hasAccess: boolean;
  accessType: 'subscription' | 'trial' | 'expired' | 'preview';
  trialDaysLeft: number;
  isSubscribed: boolean;
  loading: boolean;
}

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
      // استخدام الدالة الجديدة المحسنة
      const { data, error } = await supabase.rpc('check_user_access_unified', {
        user_email: user.email
      });

      if (error) {
        console.error('Error checking access:', error);
        // Default to preview access if error
        setAccessInfo({
          hasAccess: false,
          accessType: 'preview',
          trialDaysLeft: 0,
          isSubscribed: false,
          loading: false,
        });
        return;
      }

      if (data && data.length > 0) {
        const accessData = data[0];
        setAccessInfo({
          hasAccess: accessData.has_access,
          accessType: accessData.access_type as 'subscription' | 'trial' | 'expired',
          trialDaysLeft: accessData.trial_days_left,
          isSubscribed: accessData.is_subscribed,
          loading: false,
        });
      } else {
        // No record found, user needs to start trial
        setAccessInfo({
          hasAccess: false,
          accessType: 'expired',
          trialDaysLeft: 0,
          isSubscribed: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error in checkAccess:', error);
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
      // استخدام الدالة الجديدة لبدء فترة تجربة مع اشتراك
      const { data, error } = await supabase.rpc('start_subscription_with_trial', {
        user_email: user.email,
        user_id_param: user.id,
        plan_tier_param: 'basic',
        trial_days: 5
      });

      if (error) {
        console.error('Error starting trial:', error);
        toast({
          title: "Error",
          description: "Failed to start trial period",
          variant: "destructive"
        });
        return;
      }

      // Handle JSON response from function
      const result = data as { success?: boolean; error?: string };
      if (result && !result.success) {
        console.error('Trial start failed:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to start trial period",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Trial Started!",
        description: "Your 5-day free trial has begun with Basic plan features. Enjoy exploring the platform!",
      });

      // Refresh access info
      await checkAccess();
    } catch (error) {
      console.error('Error in startTrial:', error);
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