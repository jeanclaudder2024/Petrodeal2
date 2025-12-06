import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  Crown, 
  Ship, 
  Anchor, 
  MapPin, 
  Factory, 
  FileText, 
  BarChart3, 
  Phone, 
  Users,
  Globe,
  Zap,
  CreditCard,
  Percent
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';

interface PricingPlansProps {
  onSubscribe: (tier: string, billingCycle: string) => void;
  currentTier?: string;
  isProcessing?: boolean;
  selectedPlan?: string; // Plan to highlight/scroll to from URL parameter
}

interface Discount {
  discount_percentage: number;
  discount_name: string | null;
  plan_tier: string;
  billing_cycle: string;
}

interface DatabasePlan {
  id: string;
  plan_name: string;
  plan_tier: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
  is_popular: boolean;
  sort_order: number;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ 
  onSubscribe, 
  currentTier, 
  isProcessing = false,
  selectedPlan 
}) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [dbPlans, setDbPlans] = useState<DatabasePlan[]>([]);
  const planRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchActiveDiscounts();
    fetchDynamicPlans();
  }, []);

  // Scroll to and highlight selected plan from URL
  useEffect(() => {
    if (!selectedPlan || dbPlans.length === 0) return;
    
    // Wait for DOM to update with plans
    const timeoutId = setTimeout(() => {
      const planTier = selectedPlan.toLowerCase();
      const planElement = planRefs.current[planTier];
      
      if (planElement) {
        // Scroll to plan with smooth behavior
        planElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight animation
        planElement.classList.add('animate-pulse');
        setTimeout(() => {
          planElement.classList.remove('animate-pulse');
        }, 2000);
      }
    }, 500); // Wait for plans to render
    
    return () => clearTimeout(timeoutId);
  }, [selectedPlan, dbPlans]);

  const fetchDynamicPlans = async () => {
    const plansData = await fetchPlans();
    setDbPlans(plansData);
  };

  const fetchActiveDiscounts = async () => {
    try {
      const { data, error } = await db
        .from('subscription_discounts')
        .select('discount_percentage, discount_name, plan_tier, billing_cycle')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);

      if (error) {
        console.warn('Error fetching discounts, using none:', error);
        setDiscounts([]);
        return;
      }

      setDiscounts(data || []);
    } catch (error) {
      console.warn('Error fetching discounts, using none:', error);
      setDiscounts([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await db
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Error fetching plans, using static plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching plans, using static plans:', error);
      return [];
    }
  };

  const getDiscountForPlan = (planTier: string, billingCycle: string) => {
    return discounts.find(d => d.plan_tier === planTier && d.billing_cycle === billingCycle);
  };

  const handleSubscribe = (tier: string) => {
    const billingCycle = isAnnual ? 'annual' : 'monthly';
    onSubscribe(tier, billingCycle);
  };

  // Use dynamic plans from database or fallback to static plans
  const staticPlans = [
    {
      tier: 'basic',
      name: 'Basic Plan',
      subtitle: 'Perfect for newcomers and small brokers stepping into global oil trading',
      monthlyPrice: 29.99,
      annualPrice: 299.90,
      icon: Ship,
      popular: false,
      features: [
        { icon: MapPin, text: 'Geographic Coverage: 4 Regions' },
        { icon: Anchor, text: 'Ports Access: 30 Global Ports' },
        { icon: Ship, text: 'Vessel Tracking: Up to 90 Vessels' },
        { icon: Factory, text: 'Refinery Database: 15 Major Refineries' },
        { icon: FileText, text: 'Core Documents: LOI, ICPO, BDN, Invoice Templates' },
        { icon: BarChart3, text: 'Reports: Monthly Basic Reports' },
        { icon: Phone, text: 'Support: Email Support' },
        { icon: Globe, text: 'Deals: Direct Access to Oil Trading Deals' }
      ],
      highlight: 'Ideal for testing the market with balanced access to core data and essential documents.'
    },
    {
      tier: 'professional',
      name: 'Professional Plan',
      subtitle: 'Designed for active brokers and medium-sized companies needing broader coverage',
      monthlyPrice: 89.99,
      annualPrice: 899.90,
      icon: Crown,
      popular: true,
      features: [
        { icon: MapPin, text: 'Geographic Coverage: 6 Regions' },
        { icon: Anchor, text: 'Ports Access: 100+ Global Ports' },
        { icon: Ship, text: 'Vessel Tracking: 180+ Vessels' },
        { icon: Factory, text: 'Refinery Database: 70 Active Refineries' },
        { icon: FileText, text: 'Advanced Documents: ICPO, SPA, B/L, SGS, CIF Templates' },
        { icon: BarChart3, text: 'Reports: Weekly Detailed Reports + Smart Alerts' },
        { icon: Phone, text: 'Support: Priority Email & Live Chat' },
        { icon: Users, text: 'Multi-User Access: Up to 5 Seats' },
        { icon: Globe, text: 'Deals: Direct Global Oil Trading Opportunities' },
        { icon: Zap, text: 'Networking: Connect with International Energy Companies' }
      ],
      highlight: 'Best for growing firms seeking speed, diversity, and real deal opportunities with global partners.'
    },
    {
      tier: 'enterprise',
      name: 'Enterprise Plan',
      subtitle: 'The ultimate solution for large corporations, global brokerage firms, and integrated trading networks',
      monthlyPrice: 199.99,
      annualPrice: 1999.90,
      icon: Zap,
      popular: false,
      features: [
        { icon: MapPin, text: 'Geographic Coverage: 7 Global Regions' },
        { icon: Anchor, text: 'Ports Access: 120+ Global Ports' },
        { icon: Ship, text: 'Vessel Tracking: 500+ Vessels in Real-Time' },
        { icon: Factory, text: 'Refinery Database: Full Global Refinery Access' },
        { icon: FileText, text: 'Complete Documentation Suite: All Templates + API Sync' },
        { icon: BarChart3, text: 'Reports: Real-Time Analytics & Forecasting' },
        { icon: Zap, text: 'Integration: API Keys for Direct System-to-System Connectivity' },
        { icon: Phone, text: 'Support: Dedicated Account Manager + 24/7 Support' },
        { icon: Users, text: 'Corporate Access: 20+ Users with Teams Management' },
        { icon: Globe, text: 'Deals: Direct Global Oil Trading Opportunities' },
        { icon: Crown, text: 'Networking: Advanced Access to Global Energy & Trading Companies' }
      ],
      highlight: 'Perfect for enterprises needing real-time data, advanced analytics, and international deal-making power.'
    }
  ];

  const displayPlans = dbPlans.length > 0 ? dbPlans.map(dbPlan => ({
    tier: dbPlan.plan_tier,
    name: dbPlan.plan_name,
    subtitle: dbPlan.description,
    monthlyPrice: dbPlan.monthly_price,
    annualPrice: dbPlan.annual_price,
    icon: dbPlan.plan_tier === 'enterprise' ? Zap : dbPlan.plan_tier === 'professional' ? Crown : Ship,
    popular: dbPlan.is_popular,
    features: dbPlan.features.map(feature => ({ icon: Check, text: feature })),
    highlight: `Perfect for ${dbPlan.plan_tier} level users.`
  })) : staticPlans;

  // Check if plan is selected from URL parameter
  const isSelectedFromUrl = (tier: string) => {
    return selectedPlan && tier.toLowerCase() === selectedPlan.toLowerCase();
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch 
          checked={isAnnual} 
          onCheckedChange={setIsAnnual}
          className="data-[state=checked]:bg-primary"
        />
        <span className={`text-sm font-medium ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
          Annual
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {displayPlans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const period = isAnnual ? 'year' : 'month';
          const isCurrentPlan = currentTier === plan.tier;
          const billingCycle = isAnnual ? 'annual' : 'monthly';
          const discount = getDiscountForPlan(plan.tier, billingCycle);
          const discountedPrice = discount ? price * (100 - discount.discount_percentage) / 100 : price;
          
          const isSelected = isSelectedFromUrl(plan.tier);
          
          return (
            <Card 
              key={plan.tier}
              ref={(el) => {
                planRefs.current[plan.tier] = el;
              }}
              className={`trading-card relative ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${
                isSelected ? 'ring-4 ring-blue-500 shadow-lg scale-105 z-10' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {discount && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-red-500 text-white">
                    <Percent className="h-3 w-3 mr-1" />
                    {discount.discount_percentage}% OFF
                  </Badge>
                </div>
              )}
              
              {isSelected && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="bg-blue-500 text-white animate-pulse">
                    Selected Plan
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4" style={{ right: discount ? '120px' : '16px' }}>
                  <Badge className="bg-green-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${
                  plan.tier === 'enterprise' ? 'gradient-gold' : 'gradient-hero'
                } flex items-center justify-center shadow-glow`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.subtitle}
                </p>
                
                <div className="space-y-2">
                  {discount ? (
                    <div className="space-y-1">
                      <div className="text-2xl line-through text-muted-foreground">
                        ${price.toFixed(2)}
                      </div>
                      <div className="text-4xl font-bold text-foreground">
                        ${discountedPrice.toFixed(2)}
                        <span className="text-lg text-muted-foreground font-normal">
                          /{period}
                        </span>
                      </div>
                      {discount.discount_name && (
                        <div className="text-sm text-red-600 font-medium">
                          {discount.discount_name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-foreground">
                      ${price.toFixed(2)}
                      <span className="text-lg text-muted-foreground font-normal">
                        /{period}
                      </span>
                    </div>
                  )}
                  {isAnnual && (
                    <div className="text-sm text-muted-foreground">
                      ${plan.monthlyPrice}/month when billed annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Action Button */}
                <Button
                  className={`w-full ${plan.popular ? 'hero-button' : ''} ${
                    plan.tier === 'enterprise' ? 'premium-button' : ''
                  }`}
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={isCurrentPlan || isProcessing}
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : isCurrentPlan ? (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                      <span className="text-sm leading-relaxed">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Highlight */}
                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm text-muted-foreground italic">
                    💡 {plan.highlight}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Note */}
      <div className="text-center p-6 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🛢️ PetroDealHub Subscription Plans</h3>
        <p className="text-sm text-muted-foreground">
          All plans include access to our AI-powered trading insights and real-time market data. 
          Upgrade or downgrade anytime with no commitments.
        </p>
      </div>
    </div>
  );
};

export default PricingPlans;