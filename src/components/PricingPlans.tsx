import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Percent,
  Shield,
  Clock
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';

interface PricingPlansProps {
  onSubscribe: (tier: string, billingCycle: string) => void;
  currentTier?: string;
  isProcessing?: boolean;
  selectedPlan?: string;
}

interface Discount {
  discount_percentage: number;
  discount_name: string | null;
  plan_tier: string;
  billing_cycle: string;
}

interface PromotionFrame {
  id: string;
  discount_type: string;
  discount_value: number;
  eligible_plans: string[];
  billing_cycle: string;
  show_on_subscription: boolean;
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
  const [isAnnual, setIsAnnual] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [promotionFrames, setPromotionFrames] = useState<PromotionFrame[]>([]);
  const [dbPlans, setDbPlans] = useState<DatabasePlan[]>([]);
  const planRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchActiveDiscounts();
    fetchPromotionFrames();
    fetchDynamicPlans();
  }, []);

  useEffect(() => {
    if (!selectedPlan || dbPlans.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const planTier = selectedPlan.toLowerCase();
      const planElement = planRefs.current[planTier];
      
      if (planElement) {
        planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        planElement.classList.add('animate-pulse');
        setTimeout(() => {
          planElement.classList.remove('animate-pulse');
        }, 2000);
      }
    }, 500);
    
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
        setDiscounts([]);
        return;
      }
      setDiscounts(data || []);
    } catch (error) {
      setDiscounts([]);
    }
  };

  const fetchPromotionFrames = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from('promotion_frames')
        .select('id, discount_type, discount_value, eligible_plans, billing_cycle, show_on_subscription')
        .eq('is_active', true)
        .eq('show_on_subscription', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gt.${now}`);

      if (error) {
        setPromotionFrames([]);
        return;
      }
      setPromotionFrames(data || []);
    } catch (error) {
      setPromotionFrames([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await db
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  };

  // Check if discount applies to current billing cycle
  const getDiscountForPlan = (planTier: string, billingCycle: string) => {
    // Check subscription_discounts first - filter by billing_cycle
    const subscriptionDiscount = discounts.find(d => 
      d.plan_tier === planTier && 
      (d.billing_cycle === billingCycle || d.billing_cycle === 'both')
    );
    
    // Check promotion_frames - filter by billing_cycle
    const promoFrame = promotionFrames.find(p => 
      p.eligible_plans?.includes(planTier) && 
      (p.billing_cycle === billingCycle || p.billing_cycle === 'both')
    );
    
    // If promotion frame has a higher discount and matches billing cycle, use it
    if (promoFrame && promoFrame.discount_value > 0) {
      const promoDiscount = promoFrame.discount_type === 'percentage' ? promoFrame.discount_value : 0;
      if (!subscriptionDiscount || promoDiscount > subscriptionDiscount.discount_percentage) {
        return {
          discount_percentage: promoDiscount,
          discount_name: 'Limited Time Offer',
          plan_tier: planTier,
          billing_cycle: promoFrame.billing_cycle
        };
      }
    }
    
    return subscriptionDiscount;
  };

  const handleSubscribe = (tier: string) => {
    const billingCycle = isAnnual ? 'annual' : 'monthly';
    onSubscribe(tier, billingCycle);
  };

  const isSelectedFromUrl = useCallback((tier: string) => {
    if (!selectedPlan || !tier) return false;
    return tier.toLowerCase() === selectedPlan.toLowerCase();
  }, [selectedPlan]);

  const staticPlans = [
    {
      tier: 'basic',
      name: 'Basic Plan',
      subtitle: 'Individual brokers and analysts',
      monthlyPrice: 1999,
      annualPrice: 19990,
      icon: Ship,
      popular: false,
      features: [
        { icon: MapPin, text: 'Geographic coverage (4 regions)' },
        { icon: Anchor, text: 'Port access (2 ports)' },
        { icon: Ship, text: 'Vessel tracking (up to 10 vessels)' },
        { icon: Factory, text: 'Refinery database access' },
        { icon: FileText, text: 'Basic document library' },
        { icon: Phone, text: 'Support during business hours' },
      ],
      highlight: 'Perfect for individual brokers and analysts getting started.'
    },
    {
      tier: 'professional',
      name: 'Professional Plan',
      subtitle: 'Professional traders, brokers, and firms',
      monthlyPrice: 189.99,
      annualPrice: 1899.90,
      icon: Crown,
      popular: true,
      features: [
        { icon: MapPin, text: 'Geographic coverage (7 regions)' },
        { icon: Anchor, text: 'Port access (8 ports)' },
        { icon: Ship, text: 'Vessel tracking (up to 25 vessels)' },
        { icon: FileText, text: 'Advanced document templates (SPA, B/L, SGS, etc.)' },
        { icon: Zap, text: 'AI-assisted market alerts' },
        { icon: Phone, text: 'Priority email & chat support' },
        { icon: BarChart3, text: 'Advanced dashboard & analytics' },
      ],
      highlight: 'Best for growing firms seeking speed and real deal opportunities.'
    },
    {
      tier: 'enterprise',
      name: 'Enterprise Plan',
      subtitle: 'Institutions, large trading desks, enterprises',
      monthlyPrice: 599.99,
      annualPrice: 5999.90,
      icon: Zap,
      popular: false,
      features: [
        { icon: Globe, text: 'Global geographic coverage' },
        { icon: Anchor, text: 'Unlimited port access' },
        { icon: Ship, text: 'Unlimited vessel tracking' },
        { icon: FileText, text: 'Full document automation & AI insights' },
        { icon: BarChart3, text: 'Custom alerts & reporting' },
        { icon: Users, text: 'Dedicated account manager' },
        { icon: Zap, text: 'API & system integrations' },
      ],
      highlight: 'Perfect for enterprises needing real-time data and advanced analytics.'
    }
  ];

  // Helper function to get tier icon - defined outside useMemo for stability
  const getTierIcon = useCallback((tier: string | null | undefined): React.ComponentType<any> => {
    const normalizedTier = (tier || '').toLowerCase().trim();
    console.log('Getting icon for tier:', tier, '-> normalized:', normalizedTier);
    if (normalizedTier.includes('basic') || normalizedTier.includes('starter')) {
      return Ship;
    }
    if (normalizedTier.includes('professional') || normalizedTier.includes('pro')) {
      return Crown;
    }
    if (normalizedTier.includes('enterprise') || normalizedTier.includes('business')) {
      return Zap;
    }
    // Default icon based on position if no match
    return Ship;
  }, []);

  const displayPlans = useMemo(() => {
    console.log('DB Plans loaded:', dbPlans.length, dbPlans.map(p => ({ tier: p.plan_tier, name: p.plan_name })));
    
    if (dbPlans.length > 0) {
      return dbPlans.map((dbPlan, index) => {
        const IconComponent = getTierIcon(dbPlan.plan_tier);
        // Use index-based icon as fallback
        const FallbackIcons = [Ship, Crown, Zap];
        const FinalIcon = IconComponent || FallbackIcons[index % 3];
        
        return {
          tier: dbPlan.plan_tier || '',
          name: dbPlan.plan_name || '',
          subtitle: dbPlan.description || '',
          monthlyPrice: dbPlan.monthly_price || 0,
          annualPrice: dbPlan.annual_price || 0,
          icon: FinalIcon,
          popular: dbPlan.is_popular || false,
          features: (dbPlan.features || []).map(feature => ({ icon: Check, text: feature })),
          highlight: `Perfect for ${dbPlan.plan_tier} level users.`
        };
      });
    }
    return staticPlans;
  }, [dbPlans, getTierIcon]);

  if (!displayPlans || displayPlans.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  const currentBillingCycle = isAnnual ? 'annual' : 'monthly';

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center p-1 bg-gradient-to-r from-muted/80 via-muted to-muted/80 rounded-full shadow-inner border border-border/50">
          <button
            className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              !isAnnual 
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg transform scale-[1.02]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              isAnnual 
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg transform scale-[1.02]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setIsAnnual(true)}
          >
            Annual
            <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
              -20%
            </span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAnnual ? '✨ You save 20% with annual billing!' : 'Switch to annual to save 20%'}
        </p>
      </div>

      {/* Connected Plans Container */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block" />
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {displayPlans.map((plan, index) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const period = isAnnual ? 'year' : 'month';
            const isCurrentPlan = currentTier === plan.tier;
            const discount = getDiscountForPlan(plan.tier, currentBillingCycle);
            const discountedPrice = discount ? price * (100 - discount.discount_percentage) / 100 : price;
            const isSelected = isSelectedFromUrl(plan.tier);
            
            return (
              <Card 
                key={plan.tier}
                ref={(el) => { planRefs.current[plan.tier] = el; }}
                className={`relative transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary md:scale-105 md:-mt-4 md:mb-4 z-10' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${
                  isSelected ? 'ring-4 ring-blue-500 shadow-xl scale-105 z-20' : ''
                } hover:shadow-lg hover:-translate-y-1`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {discount && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-red-500 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      {discount.discount_percentage}% OFF
                      {discount.billing_cycle !== 'both' && ` (${discount.billing_cycle})`}
                    </Badge>
                  </div>
                )}
                
                {isSelected && !isCurrentPlan && (
                  <div className="absolute -top-3 left-4">
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

                <CardHeader className="text-center space-y-4 pb-2">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${
                    plan.tier === 'enterprise' ? 'gradient-gold' : plan.popular ? 'gradient-hero' : 'bg-primary/10'
                  } flex items-center justify-center shadow-lg`}>
                    <plan.icon className={`h-8 w-8 ${plan.tier === 'enterprise' || plan.popular ? 'text-white' : 'text-primary'}`} />
                  </div>
                  
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Best for: {plan.subtitle}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    {discount ? (
                      <>
                        <div className="text-lg line-through text-muted-foreground">
                          ${price.toFixed(2)}
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                          ${discountedPrice.toFixed(2)}
                          <span className="text-base text-muted-foreground font-normal">
                            /{period}
                          </span>
                        </div>
                        {discount.discount_name && (
                          <div className="text-xs text-red-600 font-medium">
                            {discount.discount_name}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-foreground">
                        ${price.toFixed(2)}
                        <span className="text-base text-muted-foreground font-normal">
                          /{period}
                        </span>
                      </div>
                    )}
                  </div>

                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
                    <Clock className="h-3 w-3 mr-1" />
                    5-day free trial included
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    className={`w-full h-12 text-base font-semibold ${plan.popular ? 'hero-button' : ''} ${
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

                  <div className="space-y-2 pt-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <feature.icon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary mt-4">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {plan.highlight}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stripe Security Badge */}
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-muted-foreground">Secure payment powered by</span>
          <span className="font-semibold text-foreground">Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
