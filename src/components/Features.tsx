import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Ship, 
  MapPin, 
  Building2, 
  TrendingUp, 
  Bot, 
  Shield,
  BarChart3,
  Globe,
  Zap
} from "lucide-react";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";

const Features = () => {
  const { content } = useLandingPageContent('features');
  
  const features = [
    {
      icon: Ship,
      title: "Real-Time Vessel Tracking",
      description: "Monitor oil tankers and cargo vessels worldwide with live GPS data and route optimization.",
      gradient: "gradient-hero"
    },
    {
      icon: MapPin,
      title: "Port & Refinery Intelligence",
      description: "Access comprehensive data on global ports, refineries, and terminal operations.",
      gradient: "gradient-card"
    },
    {
      icon: Building2,
      title: "Company Network",
      description: "Connect with verified trading companies, brokers, and maritime service providers.",
      gradient: "gradient-card"
    },
    {
      icon: TrendingUp,
      title: "Oil Price Analytics",
      description: "Real-time oil pricing data with advanced analytics for Brent, WTI, and regional markets.",
      gradient: "gradient-card"
    },
    {
      icon: Bot,
      title: "AI Trading Assistant",
      description: "Get intelligent insights, deal guidance, and market analysis powered by advanced AI.",
      gradient: "gradient-gold"
    },
    {
      icon: Shield,
      title: "Secure Trading Platform",
      description: "Bank-grade security for all transactions with end-to-end encryption and compliance.",
      gradient: "gradient-card"
    },
    {
      icon: BarChart3,
      title: "Market Intelligence",
      description: "Advanced analytics and reporting tools for informed trading decisions.",
      gradient: "gradient-card"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Worldwide maritime data coverage with regional market insights and local expertise.",
      gradient: "gradient-card"
    },
    {
      icon: Zap,
      title: "Instant Execution",
      description: "Lightning-fast trade execution with real-time confirmations and settlement tracking.",
      gradient: "gradient-card"
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {content?.title || "Advanced Maritime Trading Technology"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {content?.description || "Harness the power of AI and real-time data to dominate the oil trading markets with our comprehensive maritime intelligence platform."}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="trading-card group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="space-y-4">
                <div className={`w-12 h-12 rounded-lg ${feature.gradient} flex items-center justify-center group-hover:shadow-glow transition-smooth`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-fast">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Join 500+ Maritime Trading Professionals
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 right-10 w-20 h-20 border border-primary/20 rounded-full animate-float" />
      <div className="absolute bottom-1/4 left-10 w-16 h-16 border border-accent/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default Features;