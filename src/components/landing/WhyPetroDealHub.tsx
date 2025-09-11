import { Card } from "@/components/ui/card";
import { Clock, Shield, Globe, FileCheck, Zap, Target, TrendingUp, Award } from "lucide-react";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";

const WhyPetroDealHub = () => {
  const { content } = useLandingPageContent('why_section');
  const mainPillars = [
    {
      icon: Zap,
      title: "Lightning Speed",
      description: "Close deals 10x faster with automated workflows and real-time data synchronization.",
      gradient: "from-accent via-gold to-accent-green",
      stats: "10x Faster"
    },
    {
      icon: Shield,
      title: "Total Transparency", 
      description: "Complete visibility across the entire trading chain with blockchain-verified transactions.",
      gradient: "from-primary via-water to-primary-glow",
      stats: "100% Verified"
    },
    {
      icon: Globe,
      title: "Global Intelligence",
      description: "AI-powered market insights covering 15,000+ vessels and 2,000+ refineries worldwide.",
      gradient: "from-water via-accent to-gold",
      stats: "15K+ Vessels"
    },
    {
      icon: Award,
      title: "Enterprise Grade",
      description: "Bank-level security with 99.99% uptime and compliance with international standards.",
      gradient: "from-gold via-primary to-accent",
      stats: "99.99% Uptime"
    }
  ];

  const benefits = [
    { icon: Clock, label: "Reduce deal time", value: "From weeks to hours" },
    { icon: TrendingUp, label: "Increase profits", value: "Up to 25% more" },
    { icon: Target, label: "Better accuracy", value: "99.9% precision" },
    { icon: FileCheck, label: "Automated docs", value: "Zero manual work" }
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-accent/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in-up">
            <span className="text-sm font-medium text-primary">Why Choose Us</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200">
            {content?.title || "Traditional oil trading is broken. We fixed it."}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            {content?.description || "Transform your petroleum trading operations with cutting-edge technology that delivers measurable results from day one."}
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {mainPillars.map((pillar, index) => (
            <Card 
              key={index}
              className={`group relative p-8 border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up`}
              style={{ animationDelay: `${(index + 2) * 0.2}s` }}
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${pillar.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
              <div className="absolute inset-[1px] rounded-xl bg-card" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <pillar.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{pillar.stats}</div>
                    <div className="text-xs text-muted-foreground">Performance</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {pillar.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up animation-delay-1000">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
            >
              <benefit.icon className="w-8 h-8 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <div className="font-semibold mb-2">{benefit.label}</div>
              <div className="text-sm text-muted-foreground">{benefit.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPetroDealHub;