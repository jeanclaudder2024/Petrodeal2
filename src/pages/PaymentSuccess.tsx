import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, Shield, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAccess } from '@/contexts/AccessContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { startTrial } = useAccess();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isTrialFlow, setIsTrialFlow] = useState(false);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Check if this is a successful payment
      const success = searchParams.get('success');
      const sessionId = searchParams.get('session_id');
      
      if (success !== 'true' || !sessionId) {
        setError('Invalid payment confirmation - missing required parameters');
        setLoading(false);
        return;
      }

      // Verify Stripe session first
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-stripe-session', {
        body: { session_id: sessionId }
      });

      if (verificationError || !verificationData?.success) {
        setError('Payment verification failed. Please contact support.');
        setLoading(false);
        return;
      }

      const sessionData = verificationData.session;
      setSubscriptionDetails(sessionData);
      
      // Check if this is a trial flow
      const isTrialSubscription = sessionData.subscription?.trial_end && 
        new Date(sessionData.subscription.trial_end * 1000) > new Date();
      setIsTrialFlow(isTrialSubscription);

      // Get stored registration data (now from sessionStorage for security)
      const storedData = sessionStorage.getItem('pendingRegistration');
      if (!storedData) {
        // User might already be registered, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      const registrationData = JSON.parse(storedData);

      // Validate stored email matches session email
      if (registrationData.email !== sessionData.customer_email) {
        setError('Email mismatch detected. Please contact support.');
        setLoading(false);
        return;
      }

      // Complete the registration process (user will set password on first login via email)
      if (!registrationData.password) {
        setError('Registration failed: Password not found. Please restart registration and enter your password.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password, // Use the real password
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: registrationData.fullName,
            company: registrationData.company,
            country: registrationData.country,
            stripe_customer_id: sessionData.customer_id,
            subscription_tier: registrationData.selectedPlan,
            billing_cycle: registrationData.billingCycle
          }
        }
      });

      if (signUpError) {
        setError(`Registration failed: ${signUpError.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Send enhanced confirmation email with subscription details
        try {
          await supabase.functions.invoke('send-confirmation-email', {
            body: {
              user: {
                email: data.user.email,
                user_metadata: { 
                  full_name: registrationData.fullName,
                  subscription_plan: registrationData.selectedPlan,
                  is_trial: isTrialSubscription
                }
              },
              email_data: {
                token: '',
                token_hash: '',
                redirect_to: `${window.location.origin}/dashboard`,
                email_action_type: 'signup',
                site_url: window.location.origin
              }
            }
          });
        } catch (emailError) {
          // Continue with registration even if email fails
        }

        // Send billing/receipt email
        try {
          const planName = `PetroDealHub ${registrationData.selectedPlan?.charAt(0).toUpperCase() + registrationData.selectedPlan?.slice(1)} Plan`;
          const amount = sessionData.amount_total || 0;
          
          await supabase.functions.invoke('send-billing-email', {
            body: {
              user_email: data.user.email,
              user_name: registrationData.fullName || data.user.email?.split('@')[0] || 'User',
              subscription_details: {
                plan_name: planName,
                amount: amount,
                currency: sessionData.currency || 'usd',
                billing_cycle: registrationData.billingCycle || 'monthly',
                trial_end: sessionData.subscription?.trial_end ? new Date(sessionData.subscription.trial_end * 1000).toISOString() : undefined,
                subscription_id: sessionData.subscription?.id || sessionData.id,
                invoice_url: sessionData.invoice?.hosted_invoice_url
              },
              company_info: {
                company_name: registrationData.company,
                company_size: sessionData.custom_fields?.find((f: any) => f.key === 'company_size')?.dropdown?.value
              }
            }
          });
        } catch (billingEmailError) {
          // Continue even if billing email fails
        }

        // Clear the pending registration data
        sessionStorage.removeItem('pendingRegistration');
        setRegistrationComplete(true);

        const planText = registrationData.selectedPlan?.charAt(0).toUpperCase() + 
          registrationData.selectedPlan?.slice(1) || 'Selected';
        const trialText = isTrialSubscription ? ' with 5-day free trial' : '';

        toast({
          title: "Registration Complete!",
          description: `Welcome to PetroDealHub ${planText}${trialText}! Check your email to verify your account.`,
        });

        // Wait a moment then show completion screen
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    } catch (error) {
      setError('Failed to complete registration. Please contact support.');
      setLoading(false);
    }
  };

  const handleRetryRegistration = () => {
    navigate('/auth?mode=signup');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Completing Your Registration</h2>
              <p className="text-muted-foreground">
                Your payment was successful. We're now setting up your account...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Registration Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-y-3">
                <Button onClick={handleRetryRegistration} className="w-full">
                  Retry Registration
                </Button>
                <Button onClick={handleContactSupport} variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 light">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to PetroDealHub!</h2>
            
            {subscriptionDetails && (
              <div className="mb-6 p-4 bg-muted rounded-lg text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Subscription Details</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">
                      {subscriptionDetails.metadata?.tier?.charAt(0).toUpperCase() + 
                       subscriptionDetails.metadata?.tier?.slice(1) || 'Premium'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-medium">
                      {subscriptionDetails.metadata?.billing_cycle || 'Monthly'}
                    </span>
                  </div>
                  
                  {isTrialFlow && subscriptionDetails.subscription?.trial_end && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Trial Ends:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-blue-600">
                          {formatDate(subscriptionDetails.subscription.trial_end)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-green-600">
                      {isTrialFlow ? 'Free Trial Active' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground mb-6">
              {isTrialFlow 
                ? "Your free trial has started! Check your email to verify your account and set your password."
                : "Your subscription is now active! Check your email to verify your account and set your password."
              }
            </p>
            
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Access Dashboard
              </Button>
              <Button onClick={() => navigate('/subscription')} variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
            
            {isTrialFlow && (
              <p className="text-xs text-muted-foreground mt-4">
                No charges until your trial ends. Cancel anytime.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;