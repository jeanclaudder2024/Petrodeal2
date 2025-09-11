import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Cpu, 
  Shield, 
  Zap, 
  Gauge, 
  TrendingUp, 
  Database,
  Lock,
  Activity,
  Target,
  Radar
} from "lucide-react";

const IndustrialWhySection = () => {
  const navigate = useNavigate();
  
  const industrialFeatures = [
    {
      icon: Cpu,
      title: "NEURAL PROCESSING CORE",
      description: "Intelligence: Live Market & Logistics Insights (Routes, Refinery Output)",
      gradient: "from-accent to-accent/60",
      metrics: "2.4TB/s processing",
      category: "INTELLIGENCE"
    },
    {
      icon: Shield,
      title: "FORTRESS SECURITY PROTOCOL",
      description: "Security: End-To-End Encryption with ICC/UNCITRAL/FOSFA/GAFTA Contract Alignment",
      gradient: "from-primary to-primary/60", 
      metrics: "AES-256 encryption",
      category: "SECURITY"
    },
    {
      icon: Zap,
      title: "QUANTUM SPEED ENGINE", 
      description: "Performance: Reliable Execution & 87% Faster Closing Times",
      gradient: "from-gold to-gold/60",
      metrics: "<50ms latency",
      category: "PERFORMANCE"
    },
    {
      icon: Database,
      title: "INDUSTRIAL DATA MATRIX",
      description: "Coverage: 250+ Ports & 180+ Refineries Across 50+ Countries",
      gradient: "from-accent-green to-accent-green/60",
      metrics: "50+ countries",
      category: "COVERAGE"
    },
    {
      icon: Gauge,
      title: "PRECISION MONITORING HUB",
      description: "Monitoring: 24/7 Oversight of Vessels and Pricing Trends",
      gradient: "from-water to-water/60",
      metrics: "99.9% accuracy",
      category: "MONITORING"  
    },
    {
      icon: Activity,
      title: "REAL-TIME PULSE SYSTEM",
      description: "Live market pulse tracking with Compliance: Verified Documents & Commission Protection Embedded in Every Deal",
      gradient: "from-accent to-primary",
      metrics: "Real-time alerts",
      category: "ANALYTICS"
    }
  ];

  const performanceStats = [
    { label: "PROCESSING SPEED", value: "2.4TB/s", icon: Cpu },
    { label: "SYSTEM UPTIME", value: "99.99%", icon: Activity },
    { label: "SECURITY LAYERS", value: "256-bit", icon: Shield },
    { label: "RESPONSE TIME", value: "<50ms", icon: Zap }
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      {/* Industrial Background Elements */}
      <div className="absolute inset-0">
        {/* Circuit Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M10 10h20v20h-20z M70 10h20v20h-20z M40 40h20v20h-20z" 
                      fill="none" stroke="currentColor" strokeWidth="0.5"/>
                <circle cx="20" cy="20" r="2" fill="currentColor"/>
                <circle cx="80" cy="20" r="2" fill="currentColor"/>
                <circle cx="50" cy="50" r="2" fill="currentColor"/>
                <path d="M20 20h30 M50 20v30 M50 50h30" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>

        {/* Energy Fields */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-pulse animation-delay-2000" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-card/80 border border-accent/30 backdrop-blur-sm mb-6 sm:mb-8 animate-fade-in-up shadow-energy">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-accent mr-2 sm:mr-3" />
            <span className="font-orbitron text-xs sm:text-sm font-medium text-accent tracking-wider">SYSTEM CAPABILITIES</span>
          </div>
          
          <h2 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-tight animate-fade-in-up animation-delay-200">
            <span className="block text-foreground">INDUSTRIAL</span>
            <span className="block bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
              EXCELLENCE
            </span>
          </h2>
          
          <p className="font-rajdhani text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400 px-4">
           Built for strict petroleum requirements: secure infrastructure, ICC/UNCITRAL alignment, and real-time tracking of vessels and refineries—enabling faster, safer, dispute-free transactions.
          </p>
        </div>

        {/* Performance Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12 sm:mb-16 md:mb-20 animate-fade-in-up animation-delay-600">
          {performanceStats.map((stat, index) => (
            <Card 
              key={index}
              className="relative p-3 sm:p-4 md:p-6 bg-card/60 backdrop-blur-sm border border-border/50 hover:border-accent/40 transition-all duration-300 shadow-energy group"
            >
              <div className="absolute inset-0 bg-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-orbitron text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="font-rajdhani text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider sm:tracking-widest">{stat.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Industrial Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16">
          {industrialFeatures.map((feature, index) => (
            <Card
              key={index}
              className={`group relative p-4 sm:p-6 md:p-8 bg-card/40 backdrop-blur-sm border border-border/30 hover:border-accent/50 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up shadow-energy overflow-hidden`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Animated Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
              <div className="absolute inset-[1px] rounded-lg bg-card/90 backdrop-blur-sm" />
              
              {/* Category Badge */}
              <div className="relative z-10 mb-6">
                <Badge className={`bg-gradient-to-r ${feature.gradient} text-white font-orbitron text-xs tracking-wider px-3 py-1`}>
                  {feature.category}
                </Badge>
              </div>

              <div className="relative z-10">
                {/* Icon Container */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-4 sm:mb-6 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="font-orbitron text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 text-foreground group-hover:text-accent transition-colors">
                  {feature.title}
                </h3>
                
                <p className="font-rajdhani text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                  {feature.description}
                </p>

                {/* Metrics */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                  <div className="font-orbitron text-xs text-accent font-medium tracking-wider">
                    {feature.metrics}
                  </div>
                  <Radar className="w-4 h-4 text-accent/60 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Industrial CTA Section */}
        <div className="text-center bg-card/20 backdrop-blur-sm border border-accent/20 rounded-2xl p-6 sm:p-8 md:p-12 animate-fade-in-up animation-delay-800 shadow-industrial">
          <div className="max-w-3xl mx-auto">
            <div className="font-orbitron text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
              INITIALIZE PETROLEUM INTELLIGENCE SYSTEMS
            </div>
            
            <p className="font-rajdhani text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
              Deploy industrial-grade trading capabilities. Access real-time intelligence networks. 
              Execute with precision and security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-orbitron font-bold transition-all duration-300 hover:scale-105 shadow-flame border border-accent/50 w-full sm:w-auto"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ACCESS SYSTEM
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const element = document.getElementById("how-it-works");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-card/60 hover:bg-card/80 border border-primary/40 hover:border-primary text-foreground font-rajdhani font-semibold backdrop-blur-sm shadow-energy w-full sm:w-auto"
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                VIEW SPECIFICATIONS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustrialWhySection;