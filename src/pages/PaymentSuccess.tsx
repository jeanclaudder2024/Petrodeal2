import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Check if this is a successful payment
      const success = searchParams.get('success');
      if (success !== 'true') {
        setError('Invalid payment confirmation');
        setLoading(false);
        return;
      }

      // Get stored registration data
      const storedData = localStorage.getItem('pendingRegistration');
      if (!storedData) {
        // User might already be registered, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      const registrationData = JSON.parse(storedData);

      // Complete the registration process
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
          data: {
            full_name: registrationData.fullName,
            company: registrationData.company,
            country: registrationData.country
          }
        }
      });

      if (signUpError) {
        console.error('Registration error:', signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Add user to subscribers table with subscription status
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .upsert({
            email: registrationData.email,
            full_name: registrationData.fullName,
            company: registrationData.company,
            country: registrationData.country,
            phone: registrationData.phone,
            subscribed: registrationData.paymentMethod === 'subscription',
            is_trial_active: registrationData.paymentMethod === 'trial',
            trial_end_date: registrationData.paymentMethod === 'trial' 
              ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() 
              : null,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });

        if (subscriberError) {
          console.error('Error adding to subscribers:', subscriberError);
        }

        // Supabase will automatically send email verification
        // No custom email function needed

        // Clear the pending registration data
        localStorage.removeItem('pendingRegistration');
        setRegistrationComplete(true);

        toast({
          title: "Registration Complete!",
          description: "Your account has been created and your subscription is now active.",
        });

        // Wait a moment then redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      setError('Failed to complete registration. Please contact support.');
    } finally {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to PetroDealHub!</h2>
            <p className="text-muted-foreground mb-6">
              Your payment was successful and your account has been created. You now have full access to all premium features.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Access Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;