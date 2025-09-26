import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Check, 
  Star, 
  TrendingUp, 
  Users, 
  MessageCircle,
  CreditCard,
  Loader2,
  Globe,
  Award,
  FileText,
  Zap,
  Network,
  Smartphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const BrokerMembership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkMembershipStatus();
    }
  }, [user]);

  const checkMembershipStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-broker-membership');
      
      if (error) throw error;
      
      setMembershipStatus(data);
      
      // If user already has paid membership, redirect to setup or dashboard
      if (data.has_membership && data.payment_status === 'paid') {
        navigate('/broker-setup');
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setCheckingMembership(false);
    }
  };

  const handlePurchaseMembership = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase broker membership.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-broker-checkout');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const keyBenefits = [
    {
      icon: Globe,
      title: "International Broker Status",
      description: "Recognition under the International Petroleum Brokers Council (IPBC, USA)."
    },
    {
      icon: Award,
      title: "Official Membership Card",
      description: "Personalized card issued by the Global Oil & Energy Brokers Alliance (GOEBA)."
    },
    {
      icon: Users,
      title: "Direct Access to Major Companies",
      description: "Connect with ExxonMobil, Rosneft, ADNOC & more through PetroDealHub."
    },
    {
      icon: Shield,
      title: "Commission Protection Guarantee",
      description: "Secured by the Energy Trade Verification Council (ETVC)."
    },
    {
      icon: Zap,
      title: "Priority Deal Matching",
      description: "Be the first to receive notifications of new deals matching your profile."
    },
    {
      icon: Network,
      title: "Global Networking Events",
      description: "Exclusive access to the PetroGlobal Networking Series and private broker sessions."
    }
  ];

  const includedFeatures = [
    { icon: Globe, text: "Lifetime Verified Broker Badge – by IPBC" },
    { icon: Award, text: "Official Membership Card – issued by GOEBA" },
    { icon: TrendingUp, text: "Unlimited Deal Management Tools – powered by PetroDealHub" },
    { icon: FileText, text: "Secure Document Upload & Digital Signature – verified by ETVC" },
    { icon: Users, text: "Direct Corporate Access – Buyers, Sellers & Refineries worldwide" },
    { icon: Star, text: "Premium Broker Listing – in the Global Oil & Gas Brokerage Network" },
    { icon: Shield, text: "Commission Protection & Verified Deal Framework – by ETVC" },
    { icon: TrendingUp, text: "Professional Market Reports – powered by PetroGlobal Market Insights" },
    { icon: MessageCircle, text: "Webinars, Conferences & Private Sessions – hosted under WETBA" },
    { icon: Smartphone, text: "Mobile-Optimized Dashboard – full access on any device" },
    { icon: Award, text: "Annual International Broker Certificate – renewed by PetroDealHub Global Certification Board" }
  ];

  if (checkingMembership) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Globe className="h-12 w-12 text-primary" />
              <Globe className="h-8 w-8 text-primary/70" />
              <Globe className="h-6 w-6 text-primary/50" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              🌍 Become a Verified International Oil Broker – For Life
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
              🌍 Pay once, join forever. Gain official recognition, protect your commissions, and access 
              global oil & gas deals with top companies through PetroDealHub.
            </p>
            <Button 
              onClick={handlePurchaseMembership}
              disabled={loading || (membershipStatus?.has_membership && membershipStatus?.payment_status === 'paid')}
              className="h-16 px-12 text-xl bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processing...
                </>
              ) : membershipStatus?.has_membership && membershipStatus?.payment_status === 'paid' ? (
                <>
                  <Check className="mr-2 h-6 w-6" />
                  Membership Active
                </>
              ) : (
                <>
                  🌍 Join Now – Lifetime Broker Membership $999
                </>
              )}
            </Button>
          </div>

          {/* Membership Status */}
          {membershipStatus && (
            <Card className="mb-12 border-primary shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant={membershipStatus.payment_status === 'paid' ? 'default' : 'outline'}>
                      {membershipStatus.payment_status || 'Not Paid'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membership Status</p>
                    <Badge variant={membershipStatus.membership_status === 'active' ? 'default' : 'outline'}>
                      {membershipStatus.membership_status || 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Status</p>
                    <Badge variant={membershipStatus.verification_status === 'verified' ? 'default' : 'outline'}>
                      {membershipStatus.verification_status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Section */}
          <Card className="mb-16 border-primary shadow-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                <Globe className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="text-6xl font-bold text-primary mb-4">
                🌍 $999
              </div>
              <CardTitle className="text-2xl font-bold mb-4">One-Time Payment</CardTitle>
              <div className="space-y-2 text-lg">
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>✔ Lifetime Access</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>✔ No Recurring Fees</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>✔ 30-Day Money-Back Guarantee</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg mb-4">🌍 Secure payment via Stripe</p>
                <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="bg-white px-3 py-1 rounded border">Stripe</span>
                  <span className="bg-white px-3 py-1 rounded border">Visa</span>
                  <span className="bg-white px-3 py-1 rounded border">MasterCard</span>
                  <span className="bg-white px-3 py-1 rounded border">AmEx</span>
                  <span className="bg-white px-3 py-1 rounded border">PayPal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Benefits */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Key Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {keyBenefits.map((benefit, index) => (
                <Card key={index} className="h-full border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-2">🌍 {benefit.title}</CardTitle>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <Card className="mb-16 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl text-center mb-8">What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {includedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-primary/10">
                    <feature.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trust Elements */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-6">Trusted Partners & Certifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {['IPBC', 'GOEBA', 'ETVC', 'WETBA', 'PetroGlobal Insights'].map((partner) => (
                  <div key={partner} className="bg-white border rounded-lg p-4 text-center font-semibold text-primary">
                    {partner}
                  </div>
                ))}
              </div>
              
              <Separator className="my-8" />
              
              <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>🌍 Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>✅ Verified Member</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>🌍 Trusted by Brokers Worldwide</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Call-to-Action */}
          <Card className="border-primary shadow-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="text-center py-16">
              <Globe className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">
                🌍 Join the International Petroleum Brokers Council Today
              </h2>
              <p className="text-2xl text-muted-foreground mb-4">
                🌍 Pay Once – Lifetime Membership $999
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                🌍 Secure payment with Stripe and global card providers
              </p>
              <Button 
                onClick={handlePurchaseMembership}
                disabled={loading || (membershipStatus?.has_membership && membershipStatus?.payment_status === 'paid')}
                className="h-16 px-12 text-xl bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Processing...
                  </>
                ) : membershipStatus?.has_membership && membershipStatus?.payment_status === 'paid' ? (
                  <>
                    <Check className="mr-2 h-6 w-6" />
                    Membership Active
                  </>
                ) : (
                  <>
                    🌍 Join Now – Become an International Broker
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrokerMembership;