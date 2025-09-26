import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
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
  Zap
} from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Basic Plan",
      subtitle: "Perfect for newcomers and small brokers stepping into global oil trading",
      monthlyPrice: 29.99,
      annualPrice: 299.90,
      icon: Ship,
      popular: false,
      features: [
        { icon: MapPin, text: "Geographic Coverage: 4 Regions" },
        { icon: Anchor, text: "Ports Access: 30 Global Ports" },
        { icon: Ship, text: "Vessel Tracking: Up to 90 Vessels" },
        { icon: Factory, text: "Refinery Database: 15 Major Refineries" },
        { icon: FileText, text: "Core Documents: LOI, ICPO, BDN, Invoice Templates" },
        { icon: BarChart3, text: "Reports: Monthly Basic Reports" },
        { icon: Phone, text: "Support: Email Support" },
        { icon: Globe, text: "Deals: Direct Access to Oil Trading Deals" }
      ],
      buttonText: "Get Started",
      buttonClass: "hero-button"
    },
    {
      name: "Professional Plan",
      subtitle: "Designed for active brokers and medium-sized companies needing broader coverage",
      monthlyPrice: 89.99,
      annualPrice: 899.90,
      icon: Crown,
      popular: true,
      features: [
        { icon: MapPin, text: "Geographic Coverage: 6 Regions" },
        { icon: Anchor, text: "Ports Access: 100+ Global Ports" },
        { icon: Ship, text: "Vessel Tracking: 180+ Vessels" },
        { icon: Factory, text: "Refinery Database: 70 Active Refineries" },
        { icon: FileText, text: "Advanced Documents: ICPO, SPA, B/L, SGS, CIF Templates" },
        { icon: BarChart3, text: "Reports: Weekly Detailed Reports + Smart Alerts" },
        { icon: Phone, text: "Support: Priority Email & Live Chat" },
        { icon: Users, text: "Multi-User Access: Up to 5 Seats" },
        { icon: Globe, text: "Deals: Direct Global Oil Trading Opportunities" },
        { icon: Zap, text: "Networking: Connect with International Energy Companies" }
      ],
      buttonText: "Get Professional",
      buttonClass: "hero-button"
    },
    {
      name: "Enterprise Plan",
      subtitle: "The ultimate solution for large corporations, global brokerage firms, and integrated trading networks",
      monthlyPrice: 199.99,
      annualPrice: 1999.90,
      icon: Zap,
      popular: false,
      features: [
        { icon: MapPin, text: "Geographic Coverage: 7 Global Regions" },
        { icon: Anchor, text: "Ports Access: 120+ Global Ports" },
        { icon: Ship, text: "Vessel Tracking: 500+ Vessels in Real-Time" },
        { icon: Factory, text: "Refinery Database: Full Global Refinery Access" },
        { icon: FileText, text: "Complete Documentation Suite: All Templates + API Sync" },
        { icon: BarChart3, text: "Reports: Real-Time Analytics & Forecasting" },
        { icon: Zap, text: "Integration: API Keys for Direct System-to-System Connectivity" },
        { icon: Phone, text: "Support: Dedicated Account Manager + 24/7 Support" },
        { icon: Users, text: "Corporate Access: 20+ Users with Teams Management" },
        { icon: Globe, text: "Deals: Direct Global Oil Trading Opportunities" },
        { icon: Crown, text: "Networking: Advanced Access to Global Energy & Trading Companies" }
      ],
      buttonText: "Go Enterprise",
      buttonClass: "premium-button"
    }
  ];

  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-muted/20 to-background/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            🛢️ PetroDealHub <br />
            <span className="gradient-gold bg-clip-text text-transparent">
              Subscription Plans
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From exploration to professional trading, we have the perfect plan to 
            accelerate your maritime trading success.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
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
          {isAnnual && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Save 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const period = isAnnual ? 'year' : 'month';
            
            return (
              <Card 
                key={index}
                className={`trading-card relative ${plan.popular ? 'border-primary shadow-elegant scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="gradient-hero px-4 py-1 rounded-full text-sm text-primary-foreground font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${plan.name === 'Enterprise Plan' ? 'gradient-gold' : 'gradient-hero'} flex items-center justify-center shadow-glow`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.subtitle}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-foreground">
                      ${price}
                      <span className="text-lg text-muted-foreground font-normal">
                        /{period}
                      </span>
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-muted-foreground">
                        ${plan.monthlyPrice}/month when billed annually
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button className={`w-full ${plan.buttonClass}`}>
                    {plan.buttonText}
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <feature.icon className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16">
          <div className="inline-block">
            <Card className="trading-card">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-left">
                    <h3 className="text-xl font-semibold mb-2">Enterprise Solutions</h3>
                    <p className="text-muted-foreground">
                      Custom solutions for large trading firms and maritime corporations.
                    </p>
                  </div>
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-24 h-24 border border-gold/20 rounded-full animate-float" />
      <div className="absolute bottom-20 left-20 w-16 h-16 border border-primary/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
    </section>
  );
};

export default Pricing;