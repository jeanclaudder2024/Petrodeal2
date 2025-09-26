import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { Loader2 } from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { toast } from 'sonner';
import PricingPlans from '@/components/PricingPlans';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import TrialCountdown from '@/components/TrialCountdown';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  vessel_limit: number;
  port_limit: number;
  regions_limit?: number;
  refinery_limit?: number;
  document_access?: string[];
  support_level?: string;
  user_seats?: number;
  api_access?: boolean;
  real_time_analytics?: boolean;
}

const Subscription = () => {
  const { user } = useAuth();
  const { accessType, trialDaysLeft } = useAccess();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [user]); // Check subscription whenever user changes

  const checkSubscription = async () => {
    if (!user?.email) {
      console.log('No user or email, using default values');
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'trial',
        subscription_end: null,
        vessel_limit: 10,
        port_limit: 5,
        regions_limit: 1,
        refinery_limit: 5,
        document_access: ['basic'],
        support_level: 'email',
        user_seats: 1,
        api_access: false,
        real_time_analytics: false
      });
      setLoading(false);
      return;
    }

    setCheckingSubscription(true);
    try {
      console.log('Checking subscription for user:', user.email);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn('Subscription check failed, using defaults:', error);
        setSubscriptionData({
          subscribed: false,
          subscription_tier: 'trial',
          subscription_end: null,
          vessel_limit: 10,
          port_limit: 5,
          regions_limit: 1,
          refinery_limit: 5,
          document_access: ['basic'],
          support_level: 'email',
          user_seats: 1,
          api_access: false,
          real_time_analytics: false
        });
        return;
      }

      console.log('Subscription data received:', data);

      // Try to get enhanced subscription data from database
      let enhancedData: Partial<SubscriptionData> = {};
      try {
        const { data: subData } = await db
          .from('subscribers')
          .select(`
            vessel_limit, 
            port_limit, 
            regions_limit, 
            refinery_limit,
            document_access,
            support_level,
            user_seats,
            api_access,
            real_time_analytics
          `)
          .eq('email', user?.email)
          .maybeSingle();

        if (subData) {
          enhancedData = {
            vessel_limit: subData.vessel_limit || 10,
            port_limit: subData.port_limit || 5,
            regions_limit: subData.regions_limit || 1,
            refinery_limit: subData.refinery_limit || 5,
            document_access: subData.document_access || ['basic'],
            support_level: subData.support_level || 'email',
            user_seats: subData.user_seats || 1,
            api_access: subData.api_access || false,
            real_time_analytics: subData.real_time_analytics || false
          };
          console.log('Enhanced subscription data found:', enhancedData);
        }
      } catch (dbError) {
        console.warn('Error fetching enhanced subscription data:', dbError);
      }

      setSubscriptionData({
        ...data,
        vessel_limit: enhancedData.vessel_limit || data?.vessel_limit || 10,
        port_limit: enhancedData.port_limit || data?.port_limit || 5,
        regions_limit: enhancedData.regions_limit || data?.regions_limit || 1,
        refinery_limit: enhancedData.refinery_limit || data?.refinery_limit || 5,
        document_access: enhancedData.document_access || data?.document_access || ['basic'],
        support_level: enhancedData.support_level || data?.support_level || 'email',
        user_seats: enhancedData.user_seats || data?.user_seats || 1,
        api_access: enhancedData.api_access || data?.api_access || false,
        real_time_analytics: enhancedData.real_time_analytics || data?.real_time_analytics || false
      });
    } catch (error) {
      console.error('Error checking subscription, using defaults:', error);
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'trial',
        subscription_end: null,
        vessel_limit: 10,
        port_limit: 5,
        regions_limit: 1,
        refinery_limit: 5,
        document_access: ['basic'],
        support_level: 'email',
        user_seats: 1,
        api_access: false,
        real_time_analytics: false
      });
    } finally {
      setCheckingSubscription(false);
      setLoading(false);
    }
  };

  const handleCheckout = async (tier: string, billingCycle: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    setProcessingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier, billing_cycle: billingCycle }
      });
      
      if (error) {
        console.error('Error creating checkout:', error);
        toast.error(`Failed to create checkout: ${error.message || 'Unknown error'}`);
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Opening Stripe checkout...');
      } else {
        toast.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error accessing customer portal:', error);
        toast.error('Failed to access subscription management');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast.error('Failed to access subscription management');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Choose Your <br />
          <span className="gradient-gold bg-clip-text text-transparent">
            Trading Advantage
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          From exploration to professional trading, we have the perfect plan to 
          accelerate your maritime trading success.
        </p>
      </div>

      {/* Show trial countdown if user is in trial */}
      {user && (
        <div className="mb-6">
          <TrialCountdown />
        </div>
      )}

      {/* Show subscription status only if user is logged in */}
      {user && (
        <SubscriptionStatus
          subscriptionData={subscriptionData}
          checkingSubscription={checkingSubscription}
          onRefreshStatus={checkSubscription}
          onManageSubscription={handleManageSubscription}
        />
      )}

      {/* Always show pricing plans - even for non-logged in users */}
      <PricingPlans
        onSubscribe={handleCheckout}
        currentTier={subscriptionData?.subscription_tier || undefined}
        isProcessing={processingCheckout}
      />

      {/* Show login prompt for non-authenticated users */}
      {!user && (
        <div className="mt-8 p-6 bg-muted/30 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Log in or create an account to subscribe to any plan and start trading.
          </p>
          <a 
            href="/auth" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
        </div>
      )}
    </div>
  );
};

export default Subscription;