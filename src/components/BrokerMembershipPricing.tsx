import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Check, 
  Crown, 
  Percent,
  Loader2,
  Tag,
  X,
  BadgeCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface BrokerMembershipContent {
  id: string;
  title: string;
  description: string;
  original_price: number;
  sale_price: number;
  discount_badge_text: string;
  savings_text: string;
  payment_note: string;
  guarantee_text: string;
  features: string[];
}

const BrokerMembershipPricing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [content, setContent] = useState<BrokerMembershipContent | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await db
        .from('broker_membership_content')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setContent({
          id: data.id,
          title: data.title || 'Broker Lifetime Membership',
          description: data.description || 'Join the elite network of verified international oil brokers',
          original_price: data.original_price || 999,
          sale_price: data.sale_price || data.price || 499,
          discount_badge_text: data.discount_badge_text || '50% OFF - Limited Time',
          savings_text: data.savings_text || 'Save $500 - Limited Time Offer!',
          payment_note: data.payment_note || 'One-time payment • No recurring fees • Lifetime access',
          guarantee_text: data.guarantee_text || '30-day money-back guarantee',
          features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]')
        });
      } else {
        setContent({
          id: '',
          title: 'Broker Lifetime Membership',
          description: 'Join the elite network of verified international oil brokers',
          original_price: 999,
          sale_price: 499,
          discount_badge_text: '50% OFF - Limited Time',
          savings_text: 'Save $500 - Limited Time Offer!',
          payment_note: 'One-time payment • No recurring fees • Lifetime access',
          guarantee_text: '30-day money-back guarantee',
          features: [
            'Verified Broker Badge & Profile',
            'Direct Access to Global Oil Companies',
            'International Deal Management',
            'Advanced Documentation Suite',
            'ICC & UNCITRAL Compliance',
            'Priority Support & Verification'
          ]
        });
      }
    } catch (error) {
      console.error('Error loading broker content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    setPromoError(null);
    setPromoApplied(false);
    setDiscountedPrice(null);
    setDiscountPercentage(0);

    try {
      const { data, error } = await supabase.functions.invoke('create-broker-checkout', {
        body: { promo_code: promoCode.trim().toUpperCase(), validate_only: true }
      });

      if (error) throw error;

      if (data?.valid === false) {
        setPromoError(data.error || 'Invalid promo code');
      } else if (data?.valid === true) {
        setPromoApplied(true);
        setDiscountPercentage(data.discount_percentage || 0);
        if (data.discounted_amount != null) {
          setDiscountedPrice(data.discounted_amount / 100);
        }
      } else {
        setPromoError('Unable to validate promo code');
      }
    } catch (err: any) {
      setPromoError(err.message || 'Failed to validate promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoError(null);
    setPromoApplied(false);
    setDiscountedPrice(null);
    setDiscountPercentage(0);
  };

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
      const body: Record<string, string> = {};
      if (promoApplied && promoCode.trim()) {
        body.promo_code = promoCode.trim().toUpperCase();
      }

      const { data, error } = await supabase.functions.invoke('create-broker-checkout', {
        body
      });
      
      if (error) throw error;

      if (data?.promo_warning) {
        toast({
          title: "Promo code not applied",
          description: data.promo_warning,
        });
      }

      if (data?.error) {
        throw new Error(data.error);
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

  if (contentLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Unable to load membership content.</p>
      </div>
    );
  }

  // Compute display price
  const displayPrice = promoApplied && discountedPrice != null ? discountedPrice : content.sale_price;
  const showStrikethrough = promoApplied && discountedPrice != null && discountedPrice < content.sale_price;
  const savingsAmount = showStrikethrough
    ? content.sale_price - displayPrice
    : content.original_price - content.sale_price;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {content.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {content.description}
        </p>
      </div>

      <Card className="relative border-2 border-primary/20 shadow-2xl">
        {/* Discount Badge */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-red-500 text-white px-6 py-2 text-lg shadow-lg">
            <Percent className="h-4 w-4 mr-2" />
            {promoApplied && discountPercentage > 0
              ? `${discountPercentage}% OFF — Code Applied`
              : content.discount_badge_text}
          </Badge>
        </div>

        <CardHeader className="text-center pt-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 text-white" />
          </div>
          
          <CardTitle className="text-3xl mb-2">{content.title}</CardTitle>
          <p className="text-muted-foreground mb-6">
            {content.description}
          </p>

          {/* Pricing Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              {/* Always show original_price as strikethrough */}
              <span className="text-2xl text-muted-foreground line-through">
                ${content.original_price.toFixed(0)}
              </span>

              {/* If promo applied and sale_price is different from final, show sale_price struck through too */}
              {showStrikethrough && (
                <span className="text-2xl text-muted-foreground/70 line-through">
                  ${content.sale_price.toFixed(0)}
                </span>
              )}

              <span className="text-5xl font-bold text-foreground">
                ${displayPrice.toFixed(0)}
              </span>
            </div>

            {/* Dynamic savings line */}
            <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
              {showStrikethrough
                ? `You save $${savingsAmount.toFixed(0)} with promo code!`
                : content.savings_text}
            </div>
            <div className="text-sm text-muted-foreground">
              {content.payment_note}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Promo Code Section */}
          <div className="max-w-md mx-auto space-y-3">
            {promoApplied ? (
              /* Success state */
              <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    {promoCode} — {discountPercentage}% OFF Applied
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={handleRemovePromo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              /* Input state */
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    className="pl-9 uppercase"
                    disabled={validatingPromo}
                  />
                </div>
                <Button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || validatingPromo}
                  className="px-6"
                >
                  {validatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Code'}
                </Button>
              </div>
            )}
            {promoError && (
              <p className="text-sm text-destructive text-center">{promoError}</p>
            )}
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePurchaseMembership}
            disabled={loading}
            className="w-full hero-button py-6 text-xl shadow-elegant hover:shadow-glow transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="h-5 w-5 mr-2" />
                Get Broker Membership — ${displayPrice.toFixed(0)}
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
              <span>{content.guarantee_text}</span>
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
