import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackTrialStarted } from '@/utils/analytics';

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
  
  // Track if initial check is complete to prevent page unmount on tab switch
  const initialCheckComplete = useRef(false);

  const checkAccess = async () => {
    if (!user?.email) {
      setAccessInfo({
        hasAccess: false,
        accessType: 'preview',
        trialDaysLeft: 0,
        isSubscribed: false,
        loading: false,
      });
      initialCheckComplete.current = true;
      return;
    }

    try {
      if (!initialCheckComplete.current) {
        setAccessInfo(prev => ({ ...prev, loading: true }));
      }

      let accessData: any = null;

      // Primary: try edge function
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (!error && data) {
          accessData = data;
        }
      } catch (edgeFnErr) {
        console.warn('check-subscription edge function failed, falling back to RPC:', edgeFnErr);
      }

      // Fallback 1: RPC check_user_access_with_lock
      if (!accessData && user?.email) {
        try {
          const { data, error } = await supabase.rpc('check_user_access_with_lock', {
            user_email: user.email
          });
          if (!error && data && (data as any[]).length > 0) {
            const row = (data as any[])[0];
            accessData = {
              subscribed: row.is_subscribed,
              trial_active: row.has_access && row.access_type === 'trial',
              access_type: row.access_type,
              trial_days_left: row.trial_days_left,
              is_locked: row.is_locked,
              locked_reason: row.locked_reason,
            };
          }
        } catch (rpcErr) {
          console.warn('check_user_access_with_lock RPC failed, falling back to direct query:', rpcErr);
        }
      }

      // Fallback 2: direct subscribers table query
      if (!accessData && user?.email) {
        try {
          const { data: sub } = await supabase
            .from('subscribers')
            .select('subscribed, subscription_status, subscription_tier, trial_end_date, is_trial_active, is_locked, locked_reason')
            .eq('email', user.email)
            .maybeSingle();
          if (sub) {
            const trialEnd = sub.trial_end_date ? new Date(sub.trial_end_date) : null;
            const trialActive = sub.is_trial_active && trialEnd && trialEnd > new Date();
            const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
            accessData = {
              subscribed: sub.subscribed && sub.subscription_status === 'active',
              trial_active: trialActive,
              access_type: sub.subscribed && sub.subscription_status === 'active' ? 'subscription' : trialActive ? 'trial' : 'expired',
              trial_days_left: daysLeft,
              is_locked: sub.is_locked,
              locked_reason: sub.locked_reason,
            };
          }
        } catch (dbErr) {
          console.warn('Direct subscribers query failed:', dbErr);
        }
      }

      if (accessData) {
        setAccessInfo({
          hasAccess: accessData.subscribed || accessData.trial_active || false,
          accessType: accessData.access_type || 'preview',
          trialDaysLeft: accessData.trial_days_left || 0,
          isSubscribed: accessData.subscribed || false,
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
      initialCheckComplete.current = true;
    } catch (error) {
      console.error('All access checks failed:', error);
      setAccessInfo({
        hasAccess: false,
        accessType: 'preview',
        trialDaysLeft: 0,
        isSubscribed: false,
        loading: false,
      });
      initialCheckComplete.current = true;
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

  // Reset initial check flag when user logs out, then check access
  useEffect(() => {
    if (!user) {
      initialCheckComplete.current = false;
    }
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