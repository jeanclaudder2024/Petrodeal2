import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Factory, 
  MapPin, 
  Ship, 
  Shield, 
  Users, 
  TrendingUp, 
  Globe, 
  CheckCircle,
  Mail,
  Anchor,
  BarChart3,
  AlertTriangle,
  Database
} from "lucide-react";

const RefineryNews = () => {
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      title: "Production Capacity",
      description: "View current and historical throughput by fuel type (crude, diesel, jet fuel, etc.)."
    },
    {
      icon: <Database className="w-6 h-6 text-white" />,
      title: "Tank & Storage Info",
      description: "Access storage capacity, tank types, and availability when shared."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: "Product Inventory Status",
      description: "Get real-time or recent estimates of product types stored or refined."
    },
    {
      icon: <Anchor className="w-6 h-6 text-white" />,
      title: "Port & Berth Integration",
      description: "Know which ports and berths are linked to each refinery and how to connect."
    },
    {
      icon: <Ship className="w-6 h-6 text-white" />,
      title: "Vessel Connectivity",
      description: "Match refinery ports to incoming or outgoing tankers visible on our vessel map."
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Ownership & Operator Data",
      description: "See who operates and owns the refinery and whether it is active in deal flows."
    },
    {
      icon: <Mail className="w-6 h-6 text-white" />,
      title: "Refinery-Level Contact Gateways",
      description: "Verified contact points (when available) to streamline deal confirmation."
    }
  ];

  const keyRefineries = [
    "Rotterdam Refinery (Netherlands)",
    "Port Arthur & Galveston (USA)", 
    "Jamnagar Refinery (India)",
    "Ras Tanura & Jazan (Saudi Arabia)",
    "Ruwais (UAE)",
    "Singapore Refining Company (Singapore)",
    "Sidi Kerir & Alexandria (Egypt)",
    "Abidjan (Ivory Coast)"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Refinery Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Refineries
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Global Intelligence for Oil Infrastructure
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary" className="text-sm">Unmatched Access</Badge>
              <Badge variant="secondary" className="text-sm">Verified Insight</Badge>
              <Badge variant="secondary" className="text-sm">Smarter Oil Trade</Badge>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we deliver comprehensive refinery intelligence — transforming static infrastructure 
                data into dynamic deal-making tools. Our platform provides unparalleled access to one of the largest 
                global refinery databases, enabling petroleum professionals to trace, validate, and engage with oil 
                infrastructure like never before.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                <strong>Whether you're a broker verifying a deal, a trader tracking delivery points, or a company 
                assessing storage and shipment capacities — our Refineries section empowers you with the information you need.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Our Refineries Section Provides */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              What Our Refineries Section Provides
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

      {/* Global Map of Refineries */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                A Global Map of Refineries — at Your Fingertips
              </h2>
              <p className="text-lg text-muted-foreground mt-4">
                PetroDealHub features intelligence on hundreds of refineries, including the most strategic and active ones in the world
              </p>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keyRefineries.map((refinery, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Factory className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground font-medium">{refinery}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Many more across Europe, Latin America, East Asia, and the Middle East
                </p>
              </div>
            </Card>

            <div className="text-center">
              <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
                <p className="text-lg text-muted-foreground">
                  With PetroDealHub, you gain access to{" "}
                  <span className="font-semibold text-foreground">
                    the largest operational database of refineries globally
                  </span>{" "}
                  — empowering brokers and companies with refinery-specific visibility that no general logistics or port database can provide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription-Based */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Subscription-Based, Commercial-Grade
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                This service is available to verified members via subscription only. It's built for petroleum 
                professionals — buyers, brokers, refiners, and logistics teams — who require real, actionable 
                refinery context.
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
                PetroDealHub's refinery data is compiled from public maritime sources, terminal inputs, and commercial 
                indicators. It is not a legal or official source. Data is provided to support commercial insight only 
                and may include estimates, partial updates, or inferred links. Our platform does not claim official 
                refinery authority, and is not legally responsible for the accuracy or use of third-party data.
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
              <Factory className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Experience Refinery Logistics as a Strategic Advantage
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Join PetroDealHub and transform how you engage with global oil infrastructure.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
                >
                  Join PetroDealHub
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  refinery@petrodealhub.com
                </Button>
              </div>
            </div>
              
            <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
              <p className="text-xl font-semibold text-foreground mb-2">
                PetroDealHub Refineries
              </p>
              <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                Global Intelligence for Oil Infrastructure
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefineryNews;