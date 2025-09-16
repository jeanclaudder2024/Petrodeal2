import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase-helper';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  vessel_limit: number;
  port_limit: number;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  isWithinVesselLimit: (currentCount: number) => boolean;
  isWithinPortLimit: (currentCount: number) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    // CRITICAL FIX: Don't reset subscription data when user is null during auth loading
    // Only reset when user is explicitly null AND auth is not loading (actual logout)
    if (!user) {
      if (!authLoading) {
        // User is actually logged out, clear subscription data
        setSubscriptionData(null);
      }
      // If auth is still loading, preserve existing subscription data
      setLoading(false);
      return;
    }

    try {
      console.log('Checking subscription for user:', user.email);
      
      // Call the check-subscription function
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn('Subscription check failed:', error);
        // CRITICAL FIX: Don't default to trial on error - preserve existing state or use minimal defaults
        // This prevents paid users from seeing trial messages due to temporary API issues
        const existingData = subscriptionData;
        if (existingData) {
          console.log('Preserving existing subscription data due to API error');
          return; // Keep existing data
        }
        
        // Only set trial defaults for completely new sessions
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null, // Don't assume trial on error
          subscription_end: null,
          vessel_limit: 10,
          port_limit: 20
        });
        return;
      }

      // Handle successful response with comprehensive data
      if (data) {
        console.log('Subscription data received:', data);
        setSubscriptionData({
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null, // Don't default to trial
          subscription_end: data.subscription_end || null,
          vessel_limit: data.vessel_limit || 10,
          port_limit: data.port_limit || 20
        });
      } else {
        // Fallback to minimal defaults if no data (don't assume trial)
        console.warn('No subscription data received, using minimal defaults');
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null, // Don't assume trial
          subscription_end: null,
          vessel_limit: 10,
          port_limit: 20
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // CRITICAL FIX: Preserve existing data on network errors
      const existingData = subscriptionData;
      if (existingData) {
        console.log('Preserving existing subscription data due to network error');
        return; // Keep existing data
      }
      
      // Only set minimal defaults for new sessions
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null, // Don't assume trial on error
        subscription_end: null,
        vessel_limit: 10,
        port_limit: 20
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check subscription when auth loading is complete
    if (!authLoading) {
      checkSubscription();
    }
  }, [user, authLoading]);

  const isWithinVesselLimit = (currentCount: number) => {
    if (!subscriptionData) return currentCount <= 10; // Default free limit
    return currentCount <= subscriptionData.vessel_limit;
  };

  const isWithinPortLimit = (currentCount: number) => {
    if (!subscriptionData) return currentCount <= 20; // Default free limit
    return currentCount <= subscriptionData.port_limit;
  };

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscriptionData, 
        loading, 
        checkSubscription, 
        isWithinVesselLimit, 
        isWithinPortLimit 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};