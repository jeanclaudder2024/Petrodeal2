import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Mail, 
  Phone,
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LoadingFallback from '@/components/LoadingFallback';

interface BrokerProfile {
  id: string;
  full_name: string;
  company_name: string;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

const BrokerVerificationWaiting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      // First check if user has paid broker membership
      const { data: membershipData } = await supabase.functions.invoke('check-broker-membership');
      
      if (!membershipData.has_membership || membershipData.payment_status !== 'paid') {
        console.log('No paid membership found, redirecting to broker-membership');
        navigate('/broker-membership');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('broker_profiles')
        .select('id, full_name, company_name, verified_at, verification_notes, created_at')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If no profile found, redirect to setup
        if (error.code === 'PGRST116') {
          navigate('/broker-setup');
          return;
        }
        throw error;
      }

      setProfile(profileData);

      // If already verified, redirect to dashboard
      if (profileData.verified_at) {
        navigate('/broker-dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast({
        title: "Error",
        description: "Failed to check verification status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setChecking(true);
    await checkVerificationStatus();
    setChecking(false);
  };

  const handleBackToSetup = () => {
    navigate('/broker-setup');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">No broker profile found. Please complete your setup first.</p>
          <Button onClick={() => navigate('/broker-setup')}>
            Complete Setup
          </Button>
        </div>
      </div>
    );
  }

  const daysSinceSubmission = Math.floor(
    (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-foreground">Verification in Progress</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your broker profile is being reviewed by our admin team
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              Verification Status
              <Badge variant="outline" className="ml-auto text-yellow-600 border-yellow-600">
                Pending Review
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Submitted:</span>
                <span className="text-sm font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Days Since Submission:</span>
                <span className="text-sm font-medium">{daysSinceSubmission} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expected Timeline:</span>
                <span className="text-sm font-medium">1-2 business days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submitted Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Full Name:</span>
                <p className="font-medium">{profile.full_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Company:</span>
                <p className="font-medium">{profile.company_name || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Document Review</p>
                  <p className="text-sm text-muted-foreground">
                    Our admin team is reviewing your submitted documents and profile information
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-muted-foreground">Verification Decision</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once your profile is approved or if additional information is needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-muted-foreground">Dashboard Access</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you'll gain full access to the broker dashboard and can start managing deals
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            onClick={handleRefreshStatus}
            disabled={checking}
            className="w-full"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleBackToSetup}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleContactSupport}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you have questions about the verification process or need to update your information:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleContactSupport}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('tel:+1234567890')}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerVerificationWaiting;