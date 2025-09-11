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
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'trial',
        subscription_end: null,
        vessel_limit: 10,
        port_limit: 20
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Checking subscription for user:', user.email);
      
      // Call the check-subscription function
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn('Subscription check failed, using defaults:', error);
        // Set default trial limits for all users - ensure app keeps working
        setSubscriptionData({
          subscribed: false,
          subscription_tier: 'trial',
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
          subscription_tier: data.subscription_tier || 'trial',
          subscription_end: data.subscription_end || null,
          vessel_limit: data.vessel_limit || 10,
          port_limit: data.port_limit || 20
        });
      } else {
        // Fallback to default if no data
        console.warn('No subscription data received, using defaults');
        setSubscriptionData({
          subscribed: false,
          subscription_tier: 'trial',
          subscription_end: null,
          vessel_limit: 10,
          port_limit: 20
        });
      }
    } catch (error) {
      console.error('Error checking subscription, using defaults:', error);
      // Always provide fallback data to prevent UI blocking
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'trial',
        subscription_end: null,
        vessel_limit: 10,
        port_limit: 20
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

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