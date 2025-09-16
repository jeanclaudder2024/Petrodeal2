import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Lock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  onPaymentSuccess: (paymentMethodId: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  loading?: boolean;
  customerEmail: string;
  userId: string;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ 
  onPaymentSuccess, 
  onValidationChange, 
  loading = false,
  customerEmail,
  userId 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckoutRedirect = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Store user info for after checkout
      localStorage.setItem('trialUserId', userId);
      localStorage.setItem('trialUserEmail', customerEmail);
      localStorage.setItem('pendingTrialActivation', 'true');
      
      // Direct redirect to your pre-configured Stripe checkout link
      const checkoutUrl = 'https://buy.stripe.com/test_cNifZjble4BLfIv5JM00000';
      
      // Create return URL to step 6 with payment success indicator
      const origin = window.location.origin;
      const returnUrl = `${origin}/auth?mode=register&step=6&payment_success=true`;
      
      // Add parameters for Stripe checkout
      const urlParams = new URLSearchParams({
        prefilled_email: customerEmail,
        success_url: returnUrl,
        cancel_url: `${origin}/auth?mode=register&step=5&payment_cancelled=true`
      });
      
      const finalUrl = `${checkoutUrl}?${urlParams.toString()}`;
      
      // Redirect to Stripe checkout
      window.location.href = finalUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  // Function to load Stripe.js
  const loadStripe = (publishableKey: string) => {
    return new Promise<any>((resolve, reject) => {
      if (window.Stripe) {
        resolve(window.Stripe(publishableKey));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe(publishableKey));
        } else {
          reject(new Error('Stripe.js failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Start Your Free Trial
        </CardTitle>
        <CardDescription>
          Begin your 5-day free trial with secure Stripe checkout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900">5-Day Free Trial</h4>
                <p className="text-sm text-blue-700 mt-1">
                  No charges for 5 days. Cancel anytime during the trial period.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Secure payment processing by Stripe</p>
            <p>✓ No hidden fees or commitments</p>
            <p>✓ Cancel anytime during trial</p>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCheckoutRedirect}
          disabled={isProcessing || loading}
          className="w-full"
          size="lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {isProcessing ? 'Redirecting...' : 'Continue to Secure Checkout'}
        </Button>

        <div className="flex items-center justify-center text-sm text-gray-500">
          <Lock className="w-4 h-4 mr-1" />
          Secured by Stripe
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;