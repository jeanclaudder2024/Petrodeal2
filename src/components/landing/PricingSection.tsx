import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Crown, Star, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
import { useState, useEffect } from "react";
import { db } from '@/lib/supabase-helper';

interface Discount {
  discount_percentage: number;
  discount_name: string | null;
  plan_tier: string;
  billing_cycle: 'monthly' | 'annual';
}

const PricingSection = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchActiveDiscounts();
  }, []);

  const fetchActiveDiscounts = async () => {
    try {
      const { data, error } = await db
        .from('subscription_discounts')
        .select('discount_percentage, discount_name, plan_tier, billing_cycle')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching discounts:', error);
        return;
      }

      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const getDiscountForPlan = (planTier: string): Discount | null => {
    const billingCycle = isAnnual ? 'annual' : 'monthly';
    return discounts.find(discount => 
      discount.plan_tier === planTier && discount.billing_cycle === billingCycle
    ) || null;
  };

  const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
  };
  const plans = [{
    name: "Basic Plan",
    tier: "basic",
    monthlyPrice: 29.99,
    annualPrice: 299.90,
    description: "Perfect for newcomers and small brokers stepping into global oil trading",
    features: [
      "Geographic Coverage: 4 Regions",
      "Ports Access: 30 Global Ports", 
      "Vessel Tracking: Up to 90 Vessels",
      "Refinery Database: 15 Major Refineries",
      "Core Documents: LOI, ICPO, BDN, Invoice Templates",
      "Reports: Monthly Basic Reports",
      "Support: Email Support",
      "Deals: Direct Access to Oil Trading Deals"
    ],
    cta: "Get Started",
    popular: false,
    icon: Zap,
    gradient: "from-water to-primary",
    onClick: () => navigate("/auth")
  }, {
    name: "Professional Plan",
    tier: "professional", 
    monthlyPrice: 89.99,
    annualPrice: 899.90,
    description: "Designed for active brokers and medium-sized companies needing broader coverage",
    features: [
      "Geographic Coverage: 6 Regions",
      "Ports Access: 100+ Global Ports",
      "Vessel Tracking: 180+ Vessels", 
      "Refinery Database: 70 Active Refineries",
      "Advanced Documents: ICPO, SPA, B/L, SGS, CIF Templates",
      "Reports: Weekly Detailed Reports + Smart Alerts",
      "Support: Priority Email & Live Chat",
      "Multi-User Access: Up to 5 Seats",
      "Deals: Direct Global Oil Trading Opportunities",
      "Networking: Connect with International Energy Companies"
    ],
    cta: "Get Started",
    popular: true,
    icon: Crown,
    gradient: "from-accent to-gold",
    onClick: () => navigate("/auth")
  }, {
    name: "Enterprise Plan",
    tier: "enterprise",
    monthlyPrice: 199.99,
    annualPrice: 1999.90,
    description: "The ultimate solution for large corporations, global brokerage firms, and integrated trading networks",
    features: [
      "Geographic Coverage: 7 Global Regions",
      "Ports Access: 120+ Global Ports",
      "Vessel Tracking: 500+ Vessels in Real-Time",
      "Refinery Database: Full Global Refinery Access", 
      "Complete Documentation Suite: All Templates + API Sync",
      "Reports: Real-Time Analytics & Forecasting",
      "Integration: API Keys for Direct System-to-System Connectivity",
      "Support: Dedicated Account Manager + 24/7 Support",
      "Corporate Access: 20+ Users with Teams Management",
      "Deals: Direct Global Oil Trading Opportunities",
      "Networking: Advanced Access to Global Energy & Trading Companies"
    ],
    cta: "Get Started",
    popular: false,
    icon: Star,
    gradient: "from-primary to-accent-green",
    onClick: () => navigate("/auth")
  }];
  return <section className="py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background bg-slate-700" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 animate-fade-in-up">
            <Crown className="w-4 h-4 text-accent mr-2" />
            <span className="text-sm font-medium text-accent">Subscription Plans</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200 text-zinc-50 md:text-7xl">
            Choose Your Trading Power
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Scale your oil trading operations with flexible plans designed for every level of business, from independent traders to global enterprises.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-12 mb-8 animate-fade-in-up animation-delay-600">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isAnnual ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge className="bg-green-500 text-white ml-2">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const period = isAnnual ? 'year' : 'month';
            const discount = getDiscountForPlan(plan.tier);
            const discountedPrice = discount ? calculateDiscountedPrice(price, discount.discount_percentage) : price;
            
            return <Card key={index} className={`group relative p-8 border-0 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up ${plan.popular ? 'ring-2 ring-accent/50 shadow-accent/20' : ''}`} style={{
            animationDelay: `${index * 0.2}s`
          }}>
                {plan.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-accent to-gold text-white px-6 py-1 shadow-lg">
                      Most Popular
                    </Badge>
                  </div>}
                  
                {discount && <div className="absolute -top-4 right-4">
                    <Badge className="bg-red-500 text-white px-4 py-1 shadow-lg">
                      <Percent className="h-3 w-3 mr-1" />
                      {discount.discount_percentage}% OFF
                    </Badge>
                  </div>}

              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
              <div className="absolute inset-[1px] rounded-xl bg-card" />
              
              <div className="relative z-10">
                {/* Plan Icon */}
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Details */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    {discount ? (
                      <div className="space-y-1">
                        <div className="text-2xl line-through text-muted-foreground">
                          ${price.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-4xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-2">/ {period}</span>
                        </div>
                        {discount.discount_name && (
                          <div className="text-sm text-red-600 font-medium">
                            {discount.discount_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-primary">${price.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-2">/ {period}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>)}
                </div>

                {/* CTA Button */}
                <Button onClick={plan.onClick} className={`w-full py-3 text-lg font-semibold bg-gradient-to-r ${plan.gradient} hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
                  {plan.cta}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                {/* 5-Day Free Trial Text */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground font-medium">
                    Includes 5-day free trial period
                  </p>
                </div>
              </div>
            </Card>;
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16 animate-fade-in-up animation-delay-800">
          <p className="text-muted-foreground mb-4">
            All plans include 30-day money-back guarantee and secure payment processing
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <span>✓ Cancel anytime</span>
            <span>✓ Secure payments</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </div>
    </section>;
};
export default PricingSection;