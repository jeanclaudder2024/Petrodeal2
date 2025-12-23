import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Clock, Sparkles } from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { toast } from 'sonner';
import PricingPlans from '@/components/PricingPlans';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import FuturisticTrialCountdown from '@/components/FuturisticTrialCountdown';
import UnsubscribeRequest from '@/components/UnsubscribeRequest';
import { Badge } from '@/components/ui/badge';
interface PromotionFrame {
  id: string;
  title: string;
  description: string;
  eligible_plans: string[];
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  show_countdown: boolean;
  show_on_subscription: boolean;
}

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
  selected_plan_tier?: string;
  is_trial_active?: boolean;
}

const Subscription = () => {
  const { user } = useAuth();
  const { accessType, trialDaysLeft } = useAccess();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  
  const selectedPlanFromUrl = searchParams.get('plan') || searchParams.get('tier');
  const [promotionFrame, setPromotionFrame] = useState<PromotionFrame | null>(null);

  useEffect(() => {
    checkSubscription();
    fetchPromotionFrame();
  }, [user]);

  const fetchPromotionFrame = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from('promotion_frames')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_subscription', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPromotionFrame(data as PromotionFrame);
      }
    } catch (err) {
      console.warn('Error fetching promotion frame:', err);
    }
  };

  const checkSubscription = async () => {
    if (!user?.email) {
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
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
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

      // Get enhanced data from subscribers table including subscription_end
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
            real_time_analytics,
            selected_plan_tier,
            is_trial_active,
            subscription_tier,
            subscription_end
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
            real_time_analytics: subData.real_time_analytics || false,
            selected_plan_tier: subData.selected_plan_tier || subData.subscription_tier,
            is_trial_active: subData.is_trial_active,
            subscription_end: subData.subscription_end
          };
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
        real_time_analytics: enhancedData.real_time_analytics || data?.real_time_analytics || false,
        selected_plan_tier: enhancedData.selected_plan_tier,
        is_trial_active: enhancedData.is_trial_active,
        subscription_end: enhancedData.subscription_end || data?.subscription_end || null
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
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
      toast.info('Opening subscription management...');
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error accessing customer portal:', error);
        toast.error(`Failed to access subscription management: ${error.message || 'Please try again or contact support.'}`);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open subscription management. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast.error('Failed to access subscription management. Please contact support.');
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Choose Your <br />
          <span className="text-foreground">
            Market Visibility Plan
          </span>
        </h1>
        <p className="text-xl text-foreground max-w-3xl mx-auto leading-relaxed mb-2">
          See the Market. Track the Assets. Act with Confidence.
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Professional subscription plans for real-time vessel tracking, port activity, refinery intelligence, and trade operations.
        </p>
      </div>

      {/* Promotion Frame */}
      {promotionFrame && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border-2 border-red-500/30 rounded-xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-red-500" />
            <h3 className="text-xl font-bold text-foreground">{promotionFrame.title}</h3>
            <Sparkles className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-muted-foreground text-sm mb-3">{promotionFrame.description}</p>
          {promotionFrame.discount_value > 0 && (
            <Badge className="text-lg px-4 py-2 bg-red-500 text-white font-bold">
              {promotionFrame.discount_type === 'percentage' 
                ? `${promotionFrame.discount_value}% OFF` 
                : `$${promotionFrame.discount_value} OFF`} on {promotionFrame.eligible_plans?.join(', ') || 'selected plans'}
            </Badge>
          )}
        </div>
      )}

      {/* Show trial countdown if user is in trial */}
      {user && (
        <div className="mb-6">
          <FuturisticTrialCountdown />
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

      {/* Always show pricing plans */}
      <PricingPlans
        onSubscribe={handleCheckout}
        currentTier={subscriptionData?.subscription_tier || undefined}
        isProcessing={processingCheckout}
        selectedPlan={selectedPlanFromUrl || undefined}
      />

      {/* Show login prompt for non-authenticated users */}
      {!user && (
        <div className="mt-8 p-6 bg-muted/30 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Log in or create an account to subscribe to any plan and start trading.
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}

      {/* Cancel Subscription Section - for subscribed users */}
      {user && subscriptionData?.subscribed && (
        <div className="mt-12">
          <UnsubscribeRequest 
            subscriptionEndDate={subscriptionData.subscription_end}
            isTrialActive={accessType === 'trial'}
          />
        </div>
      )}

      {/* Unsubscribe from Free Trial - for trial users */}
      {user && !subscriptionData?.subscribed && accessType === 'trial' && (
        <div className="mt-12">
          <UnsubscribeRequest 
            subscriptionEndDate={null}
            isTrialActive={true}
            showForTrial={true}
          />
        </div>
      )}
    </div>
  );
};

export default Subscription;
