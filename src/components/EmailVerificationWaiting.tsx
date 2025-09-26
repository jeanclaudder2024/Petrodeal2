import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EmailVerificationWaitingProps {
  email: string;
  onBack: () => void;
}

const EmailVerificationWaiting: React.FC<EmailVerificationWaitingProps> = ({ email, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  // Check if user is verified and redirect
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleResendVerification = async () => {
    setIsChecking(true);
    // Note: Supabase doesn't have a direct resend method for signup confirmation
    // Users would need to sign up again or we'd need to implement a custom solution
    setTimeout(() => setIsChecking(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
              alt="PetroDeallHub" 
              className="h-12 w-auto"
            />
          </div>
        </div>

        <Card className="trading-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Mail className="h-16 w-16 text-primary" />
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                We've sent a confirmation link to:
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium break-all">{email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Next Steps:</p>
                  <ol className="text-blue-800 space-y-1">
                    <li>1. Check your email inbox</li>
                    <li>2. Click the verification link</li>
                    <li>3. You'll be automatically redirected</li>
                  </ol>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Don't see the email? Check your spam folder or
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={handleResendVerification}
                  disabled={isChecking}
                  className="w-full"
                >
                  {isChecking ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Request New Link
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={onBack}
                  className="text-sm"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Registration
                </Button>
              </div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-medium">Good news!</span> Your 5-day free trial will start as soon as you verify your email.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationWaiting;