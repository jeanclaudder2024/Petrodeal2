import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Building, MapPin, Ship, Zap, Target } from "lucide-react";

// Import images
import company1 from "@/assets/company-1.jpg";
import company2 from "@/assets/company-2.jpg";  
import company3 from "@/assets/company-3.jpg";
import port1 from "@/assets/port-1.jpg";
import port2 from "@/assets/port-2.jpg";
import port3 from "@/assets/port-3.jpg";
import port4 from "@/assets/port-4.jpg";
import refinery1 from "@/assets/refinery-1.jpg";
import refinery2 from "@/assets/refinery-2.jpg";
import refinery3 from "@/assets/refinery-3.jpg";

const IndustrialImageGallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const networkNodes = [
    {
      image: port1,
      title: "ROTTERDAM TERMINAL",
      location: "NETHERLANDS • EU-ZONE",
      type: "CRITICAL PORT",
      icon: Anchor,
      description: "Primary European petroleum distribution hub - 469M tons annual capacity",
      status: "ACTIVE",
      throughput: "469M tons/yr"
    },
    {
      image: refinery1,
      title: "SHELL PERNIS COMPLEX", 
      location: "NETHERLANDS • EU-ZONE",
      type: "MAJOR REFINERY",
      icon: Building,
      description: "Advanced petroleum refining complex - 416K bpd processing capacity",
      status: "OPERATIONAL",
      throughput: "416K bpd"
    },
    {
      image: company1,
      title: "EXXONMOBIL HQ",
      location: "TEXAS • US-ZONE",
      type: "CORPORATE HUB",
      icon: Building,
      description: "Global energy operations command center - Fortune 500 enterprise",
      status: "CONNECTED",
      throughput: "Global ops"
    },
    {
      image: port2,
      title: "HOUSTON TERMINAL",
      location: "HOUSTON • AMERICAS-ZONE", 
      type: "STRATEGIC PORT",
      icon: Ship,
      description: "Asia-Pacific petroleum transshipment nexus - 630M tons capacity",
      status: "ACTIVE",
      throughput: "630M tons/yr"
    },
    {
      image: refinery2,
      title: "ARAMCO COMPLEX",
      location: "SAUDI ARABIA • ME-ZONE",
      type: "MEGA REFINERY",
      icon: Building,
      description: "Integrated petroleum processing facility - 2.1M bpd capacity",
      status: "OPERATIONAL",
      throughput: "2.1M bpd"
    },
    {
      image: port3,
      title: "HOUSTON CHANNEL",
      location: "TEXAS • US-ZONE",
      type: "ENERGY CORRIDOR",
      icon: Anchor,
      description: "Americas petrochemical processing hub - 280M tons throughput",
      status: "ACTIVE", 
      throughput: "280M tons/yr"
    },
    {
      image: company2,
      title: "BP COMMAND CENTER",
      location: "LONDON • EU-ZONE",
      type: "CONTROL NODE",
      icon: MapPin,
      description: "European petroleum operations headquarters - Global coordination",
      status: "CONNECTED",
      throughput: "Multi-regional"
    },
    {
      image: refinery3,
      title: "RELIANCE COMPLEX",
      location: "INDIA • APAC-ZONE",
      type: "PROCESSING HUB",
      icon: Building,
      description: "World-scale petroleum refinery - 1.24M bpd processing power",
      status: "OPERATIONAL", 
      throughput: "1.24M bpd"
    },
    {
      image: port4,
      title: "ANTWERP TERMINAL",
      location: "BELGIUM • EU-ZONE",
      type: "CHEMICAL PORT",
      icon: Ship,
      description: "European chemical cluster nexus - 230M tons annual capacity",
      status: "ACTIVE",
      throughput: "230M tons/yr"
    },
    {
      image: company3,
      title: "TOTAL ENERGIES",
      location: "FRANCE • EU-ZONE", 
      type: "ENERGY NEXUS",
      icon: Building,
      description: "Integrated energy systems headquarters - Sustainable operations",
      status: "CONNECTED",
      throughput: "Integrated ops"
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % networkNodes.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [networkNodes.length]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CRITICAL PORT':
      case 'STRATEGIC PORT': 
      case 'ENERGY CORRIDOR':
      case 'CHEMICAL PORT':
        return 'from-water to-primary';
      case 'MAJOR REFINERY':
      case 'MEGA REFINERY':
      case 'PROCESSING HUB':
        return 'from-accent to-gold';
      case 'CORPORATE HUB':
      case 'CONTROL NODE':
      case 'ENERGY NEXUS':
        return 'from-primary to-accent-green';
      default:
        return 'from-accent to-primary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-accent';
      case 'OPERATIONAL':
        return 'text-gold';
      case 'CONNECTED':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      {/* Industrial Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="industrial-grid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M20 20h80v80h-80z M60 20v80 M20 60h80" 
                    fill="none" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="60" cy="60" r="3" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#industrial-grid)"/>
        </svg>
      </div>

      {/* Energy Field Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-industrial-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-industrial-pulse animation-delay-2000" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 rounded-lg bg-card/80 border border-accent/30 backdrop-blur-sm mb-8 animate-fade-in-up shadow-energy">
            <Target className="w-4 h-4 text-accent mr-3 animate-radar-sweep" />
            <span className="font-orbitron text-sm font-medium text-accent tracking-wider">GLOBAL NETWORK</span>
          </div>
          
          <h2 className="font-orbitron text-6xl md:text-8xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200">
            <span className="block text-foreground">NETWORK</span>
            <span className="block bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
              INFRASTRUCTURE
            </span>
          </h2>
          
          <p className="font-rajdhani text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Access our industrial-grade petroleum infrastructure network. Real-time connectivity to ports, 
            refineries, and corporate operations centers across all major trading zones.
          </p>
        </div>

        {/* Main Network Display */}
        <div className="relative max-w-6xl mx-auto">
          <Card className="group relative h-96 md:h-[500px] overflow-hidden bg-card/40 backdrop-blur-sm border border-border/30 hover:border-accent/50 transition-all duration-1000 shadow-industrial animate-fade-in-up animation-delay-600">
            {/* Network Image */}
            <div className="absolute inset-0">
              <img
                src={networkNodes[currentIndex].image}
                alt={networkNodes[currentIndex].title}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              
              {/* Overlay Grid Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--accent) / 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--accent) / 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }} />
              </div>
            </div>

            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 right-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor(networkNodes[currentIndex].status) === 'text-accent' ? 'bg-accent' : getStatusColor(networkNodes[currentIndex].status) === 'text-gold' ? 'bg-gold' : 'bg-primary'}`} />
                  <span className={`font-orbitron text-sm font-bold tracking-wider ${getStatusColor(networkNodes[currentIndex].status)}`}>
                    {networkNodes[currentIndex].status}
                  </span>
                </div>
                
                <Badge className={`bg-gradient-to-r ${getTypeColor(networkNodes[currentIndex].type)} text-white font-orbitron text-xs tracking-wider px-4 py-2`}>
                  {networkNodes[currentIndex].type}
                </Badge>
              </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(networkNodes[currentIndex].type)} flex items-center justify-center shadow-lg`}>
                    {(() => {
                      const IconComponent = networkNodes[currentIndex].icon;
                      return <IconComponent className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  
                  <div>
                    <h3 className="font-orbitron text-2xl font-bold text-foreground mb-1">
                      {networkNodes[currentIndex].title}
                    </h3>
                    <div className="font-rajdhani text-accent text-sm font-medium tracking-wider">
                      {networkNodes[currentIndex].location}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="font-rajdhani text-muted-foreground mb-4 max-w-3xl">
                {networkNodes[currentIndex].description}
              </p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-accent/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="font-orbitron text-sm font-bold text-accent">
                    {networkNodes[currentIndex].throughput}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Network Status Indicators */}
          <div className="flex justify-center mt-8 gap-3">
            {networkNodes.map((_, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-4 h-4 rounded-sm border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-accent border-accent shadow-lg scale-110'
                      : 'bg-transparent border-muted-foreground/30 hover:border-accent/50 hover:scale-105'
                  }`}
                  aria-label={`Access node ${index + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Network Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in-up animation-delay-800">
          <Card className="industrial-card p-6 text-center">
            <div className="font-orbitron text-3xl font-bold text-accent mb-2">250+</div>
            <div className="status-text text-muted-foreground">Global Terminals</div>
          </Card>
          <Card className="industrial-card p-6 text-center">
            <div className="font-orbitron text-3xl font-bold text-gold mb-2">180+</div>
            <div className="status-text text-muted-foreground">Processing Hubs</div>
          </Card>
          <Card className="industrial-card p-6 text-center">
            <div className="font-orbitron text-3xl font-bold text-primary mb-2">50+</div>
            <div className="status-text text-muted-foreground">Trading Zones</div>
          </Card>
          <Card className="industrial-card p-6 text-center">
            <div className="font-orbitron text-3xl font-bold text-water mb-2">24/7</div>
            <div className="status-text text-muted-foreground">System Uptime</div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default IndustrialImageGallery;