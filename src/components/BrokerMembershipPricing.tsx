import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Check, 
  Crown, 
  Users, 
  Globe, 
  FileText, 
  Award,
  Percent,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const BrokerMembershipPricing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePurchaseMembership = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase broker membership.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-broker-checkout');
      
      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to create payment session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, text: "Verified Broker Badge & Profile" },
    { icon: Users, text: "Direct Access to Global Oil Companies" },
    { icon: Globe, text: "International Deal Management" },
    { icon: FileText, text: "Advanced Documentation Suite" },
    { icon: Award, text: "ICC & UNCITRAL Compliance" },
    { icon: Zap, text: "Priority Support & Verification" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Broker Lifetime Membership
        </h1>
        <p className="text-lg text-muted-foreground">
          Join the elite network of verified international oil brokers
        </p>
      </div>

      <Card className="relative border-2 border-primary/20 shadow-2xl">
        {/* Discount Badge */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-red-500 text-white px-6 py-2 text-lg shadow-lg">
            <Percent className="h-4 w-4 mr-2" />
            50% OFF - Limited Time
          </Badge>
        </div>

        <CardHeader className="text-center pt-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 text-white" />
          </div>
          
          <CardTitle className="text-3xl mb-2">Broker Lifetime Membership</CardTitle>
          <p className="text-muted-foreground mb-6">
            One-time payment for lifetime access to all broker features
          </p>

          {/* Pricing Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl text-muted-foreground line-through">
                $999
              </span>
              <span className="text-5xl font-bold text-foreground">
                $499
              </span>
            </div>
            <div className="text-sm text-green-600 font-semibold">
              Save $500 - Limited Time Offer!
            </div>
            <div className="text-sm text-muted-foreground">
              One-time payment • No recurring fees • Lifetime access
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePurchaseMembership}
            disabled={loading}
            className="w-full hero-button py-6 text-xl shadow-elegant hover:shadow-glow transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="h-5 w-5 mr-2" />
                Get Broker Membership - $499
              </>
            )}
          </Button>

          {/* Trust Indicators */}
          <div className="text-center space-y-2 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          After payment, you'll be redirected to complete your broker profile setup and verification process.
        </p>
      </div>
    </div>
  );
};

export default BrokerMembershipPricing;
