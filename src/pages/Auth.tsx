import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import MultiStepRegistration from '@/components/MultiStepRegistration';
import { supabase } from '@/integrations/supabase/client';
const Auth = () => {
  const {
    user,
    signIn,
    resetPassword,
    loading
  } = useAuth();
  const {
    hasAccess,
    accessType
  } = useAccess();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Redirect authenticated users with access
  useEffect(() => {
    if (user && !loading && hasAccess && (accessType === 'trial' || accessType === 'subscription')) {
      navigate('/dashboard');
    }
  }, [user, loading, hasAccess, accessType, navigate]);

  // Show multi-step registration for signup mode
  if (isSignUp) {
    return <MultiStepRegistration />;
  }
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const {
      error
    } = await signIn(signInData.email, signInData.password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    // After successful login, check if user is in subscribers table
    try {
      const { data, error: subError } = await supabase
        .from('subscribers')
        .select('id, is_trial_active, trial_end_date, subscribed')
        .eq('email', signInData.email)
        .single();
      
      if (subError || !data) {
        // Try to insert the user into subscribers table automatically
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (user) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          const { error: insertError } = await supabase.from('subscribers').insert({
            user_id: user.id,
            email: user.email,
            trial_start_date: now.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            unified_trial_end_date: trialEnd.toISOString(),
            is_trial_active: true,
            subscribed: false,
            subscription_tier: 'trial',
            trial_with_subscription: true,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });
          if (insertError) {
            // Don't block login for this error
          }
        }
      } else {
        // User exists - DO NOT auto-renew trial
        // Expired trials require admin intervention or payment
        console.log('User subscription status:', data);
      }
    } catch (err) {
      // Don't block login for this error
    }
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in."
    });
    navigate('/dashboard');
    setIsLoading(false);
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const {
      error
    } = await resetPassword(resetEmail);
    if (!error) {
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions."
      });
      setIsResetOpen(false);
      setResetEmail('');
    } else {
      toast({
        title: "Reset Failed",
        description: error.message || 'Failed to send reset email',
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center p-4 light">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" alt="PetroDeallHub" className="w-auto" style={{
            height: '156px'
          }} />
          </div>
          <p className="text-muted-foreground">
            Professional Oil Trading Platform
          </p>
        </div>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="signin-email" type="email" placeholder="Enter your email" className="pl-10" value={signInData.email} onChange={e => setSignInData({
                  ...signInData,
                  email: e.target.value
                })} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="signin-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" className="pl-10 pr-10" value={signInData.password} onChange={e => setSignInData({
                  ...signInData,
                  password: e.target.value
                })} required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full hero-button" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <div className="flex justify-between items-center text-sm">
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0">
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="reset-email" type="email" placeholder="Enter your email" className="pl-10" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have an account?
              </p>
              <Button variant="outline" onClick={() => setIsSignUp(true)} className="w-full text-gray-50 bg-orange-600 hover:bg-orange-500">
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Auth;