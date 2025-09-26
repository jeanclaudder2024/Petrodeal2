import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Anchor, 
  MapPin, 
  Ship, 
  Shield, 
  Users, 
  TrendingUp, 
  Globe, 
  CheckCircle,
  Mail,
  Factory,
  BarChart3,
  AlertTriangle
} from "lucide-react";

const PortNews = () => {
  const features = [
    {
      icon: <Anchor className="w-6 h-6 text-white" />,
      title: "Full Port Profiles",
      description: "Explore port infrastructure, cargo handling capacity, berth specifications, customs protocols, and operational zones."
    },
    {
      icon: <Ship className="w-6 h-6 text-white" />,
      title: "Tanker Activity Insights",
      description: "Real-time and recent data on vessel arrivals, departures, berthing schedules, and linked cargo manifests."
    },
    {
      icon: <Factory className="w-6 h-6 text-white" />,
      title: "Refinery-Port Connectivity",
      description: "See which ports are directly tied to nearby refineries and how their pipelines or transport routes function."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      title: "Shipment Flow Intelligence",
      description: "Discover which products are moving in and out of ports, including quantities, destination markets, and deal links when available."
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Contact Gateways",
      description: "Commercial contacts at select ports for cargo validation and logistical collaboration."
    },
    {
      icon: <Globe className="w-6 h-6 text-white" />,
      title: "Global Port Intelligence",
      description: "Visual and searchable interface across hundreds of active petroleum ports."
    }
  ];

  const keyPorts = [
    "Houston & Galveston (USA)",
    "Rotterdam (Netherlands)", 
    "Fujairah (UAE)",
    "Ras Tanura (Saudi Arabia)",
    "Sikka & Mumbai (India)",
    "Singapore",
    "Suez & Alexandria (Egypt)",
    "Santos (Brazil)",
    "Antwerp (Belgium)",
    "Durban (South Africa)"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Port Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Ports
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Strategic Access Points for Global Petroleum Trade
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                PetroDealHub offers an advanced and commercial-grade Ports section that provides full visibility 
                into the most critical maritime gateways in the global petroleum supply chain. Our Ports coverage 
                enables you to understand, track, and engage with worldwide oil terminals, shipping routes, berth 
                operations, and refinery-linked port facilities — all in one place.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                <strong>Whether you're managing a shipment, closing a deal, or planning vessel logistics, our 
                data-rich interface provides a competitive advantage across the petroleum trade ecosystem.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              What You Get in Our Ports Section
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  {feature.icon}
                </div>
                
                <h3 className="text-lg font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Ports */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Key Petroleum Ports Featured in PetroDealHub
              </h2>
              <p className="text-lg text-muted-foreground mt-4">
                Our platform includes strategic intelligence on vital petroleum hubs worldwide
              </p>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keyPorts.map((port, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground font-medium">{port}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="text-center">
              <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
                <p className="text-lg text-muted-foreground">
                  From East Asia to North America and from the Gulf to West Africa — our Ports section represents{" "}
                  <span className="font-semibold text-foreground">
                    a global petroleum logistics map built for action
                  </span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscriber Access */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Exclusively Available to Subscribers
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                The Ports section is accessible to verified users through subscription tiers. It is designed for 
                professionals in oil trading, vessel operations, port services, and strategic procurement who 
                require direct access to port-related shipment intelligence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Important Disclaimer
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Port data is aggregated from shipping signals, terminal inputs, and public databases. It is intended 
                for commercial navigation, planning, and insights — not as legal or operational confirmation. 
                PetroDealHub is not liable for shipping discrepancies, port delays, or customs outcomes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Anchor className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Access Smarter Port Logistics
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Trade with confidence. Subscribe to PetroDealHub and unlock global trade gateways.
              </p>
              
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                Subscribe to PetroDealHub
              </Button>
            </div>
              
            <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
              <p className="text-xl font-semibold text-foreground mb-2">
                PetroDealHub Ports
              </p>
              <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                Unlock Global Trade Gateways with PetroDealHub
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PortNews;