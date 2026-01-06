import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, AlertCircle, Shield, Calendar, Lock, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackSubscriptionSuccess, trackTrialStarted } from '@/utils/analytics';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isTrialFlow, setIsTrialFlow] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  
  // Password entry state (SECURITY: password entered here, never stored)
  const [showPasswordEntry, setShowPasswordEntry] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

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

      // Get stored registration data
      const storedData = sessionStorage.getItem('pendingRegistration');
      if (!storedData) {
        // User might already be registered, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      const parsedData = JSON.parse(storedData);

      // Validate stored email matches session email
      if (parsedData.email !== sessionData.customer_email) {
        setError('Email mismatch detected. Please contact support.');
        setLoading(false);
        return;
      }

      // Store data and show password entry form
      setRegistrationData({ ...parsedData, sessionData });
      setShowPasswordEntry(true);
      setLoading(false);
      
    } catch (err) {
      setError('Failed to verify payment. Please contact support.');
      setLoading(false);
    }
  };

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleCreateAccount = async () => {
    if (!validatePassword()) return;
    if (!registrationData) return;

    setIsCreatingAccount(true);
    setPasswordError(null);

    try {
      const { sessionData } = registrationData;
      const isTrialSubscription = sessionData.subscription?.trial_end && 
        new Date(sessionData.subscription.trial_end * 1000) > new Date();

      // SECURITY: Password is entered here, used immediately, and never stored
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: password, // Direct from state, not stored
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
        setPasswordError(`Registration failed: ${signUpError.message}`);
        setIsCreatingAccount(false);
        return;
      }

      if (data.user) {
        // Send confirmation email
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
        } catch {
          // Continue even if email fails
        }

        // Send billing email
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
                company_name: registrationData.company
              }
            }
          });
        } catch {
          // Continue even if email fails
        }

        // Clear the pending registration data
        sessionStorage.removeItem('pendingRegistration');
        
        // Clear password from memory
        setPassword('');
        setConfirmPassword('');
        
        setRegistrationComplete(true);
        setShowPasswordEntry(false);

        const planText = registrationData.selectedPlan?.charAt(0).toUpperCase() + 
          registrationData.selectedPlan?.slice(1) || 'Selected';
        const trialText = isTrialSubscription ? ' with 5-day free trial' : '';

        // Track GA4 events
        const amount = sessionData.amount_total ? sessionData.amount_total / 100 : 0;
        trackSubscriptionSuccess(
          registrationData.selectedPlan || 'basic',
          registrationData.billingCycle || 'monthly',
          amount
        );
        if (isTrialSubscription) {
          trackTrialStarted(5);
        }

        toast({
          title: "Registration Complete!",
          description: `Welcome to PetroDealHub ${planText}${trialText}! Check your email to verify your account.`,
        });
      }
    } catch {
      setPasswordError('Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
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
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your payment...
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

  // Password entry form after successful payment
  if (showPasswordEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 light">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground">
                Create your password to complete registration
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isCreatingAccount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isCreatingAccount}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}

              <Button 
                onClick={handleCreateAccount} 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                disabled={isCreatingAccount || !password || !confirmPassword}
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-5 w-5" />
                    Create Password & Complete Registration
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your password is securely transmitted and never stored in the browser.
              </p>
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
                ? "Your free trial has started! Check your email to verify your account."
                : "Your subscription is now active! Check your email to verify your account."
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
