import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Ship, 
  MapPin, 
  Clock, 
  Shield, 
  Users, 
  TrendingUp, 
  Globe, 
  CheckCircle,
  Mail,
  Anchor,
  Factory,
  BarChart3
} from "lucide-react";

const VesselNews = () => {
  const features = [
    {
      icon: <Ship className="w-6 h-6 text-white" />,
      title: "Live Vessel Data",
      description: "Real-time AIS tracking integrated with global maritime sources."
    },
    {
      icon: <MapPin className="w-6 h-6 text-white" />,
      title: "Port-to-Port Route Monitoring",
      description: "Know where the vessel is coming from and where it's going — from origin terminal to destination refinery."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      title: "Cargo Details",
      description: "Access insights about the type of petroleum product, estimated quantity, and storage method."
    },
    {
      icon: <Factory className="w-6 h-6 text-white" />,
      title: "Refinery Matching",
      description: "See which refinery is linked to the tanker, if available."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: "Deal Reference",
      description: "Link vessels to ongoing or historical deals within the platform (if authorized by user)."
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Ownership & Operator Info",
      description: "Learn which company owns or manages the ship, and whether it's under contract or available."
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      title: "ETA & Transit Status",
      description: "Track estimated arrival times and live positioning on the map."
    },
    {
      icon: <Shield className="w-6 h-6 text-white" />,
      title: "Compliance Markers",
      description: "Highlight tankers that match international safety, documentation, or inspection standards."
    }
  ];

  const professionals = [
    {
      title: "For Brokers:",
      description: "Verify that a seller's tanker actually exists, is active, and is heading toward a legitimate port or refinery.",
      icon: <Users className="w-5 h-5 text-white" />
    },
    {
      title: "For Buyers:",
      description: "Track your shipment in real time and stay updated on delays, route changes, or potential issues.",
      icon: <TrendingUp className="w-5 h-5 text-white" />
    },
    {
      title: "For Refineries:",
      description: "Coordinate incoming deliveries with confidence. Manage berth availability, storage, and inspection readiness.",
      icon: <Factory className="w-5 h-5 text-white" />
    },
    {
      title: "For Traders & Analysts:",
      description: "Gain strategic insights into market movement and supply flow patterns worldwide.",
      icon: <BarChart3 className="w-5 h-5 text-white" />
    }
  ];

  const keyFeatures = [
    { feature: "Vessel Name & IMO", description: "Unique identifier for every ship" },
    { feature: "Cargo Type", description: "Crude, diesel, jet fuel, LPG, etc." },
    { feature: "Route Map", description: "Origin & destination with live tracking" },
    { feature: "Linked Refinery", description: "When disclosed by the shipper" },
    { feature: "Deal Context", description: "Tied to PetroDealHub offers (optional)" },
    { feature: "Global Coverage", description: "Includes tankers in Americas, Europe, Asia, Africa, and the Middle East" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Vessel Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Vessels
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Real-Time Tracking of Global Oil Shipments
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary" className="text-sm">Total Visibility</Badge>
              <Badge variant="secondary" className="text-sm">Verified Data</Badge>
              <Badge variant="secondary" className="text-sm">Smarter Petroleum Deals</Badge>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we understand that every successful oil trade depends on trust, timing, and transparency. 
                That's why our platform offers a dedicated Vessels Section designed to help brokers, buyers, refiners, 
                and logistic managers gain real-time visibility into the movement of oil tankers, product carriers, 
                and cargo vessels across the globe.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                <strong>This isn't just tracking — this is deal intelligence in motion.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* What Our Vessel Tracking Offers */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              What Our Vessel Tracking Offers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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

      {/* Why It Matters */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Why It Matters for Petroleum Professionals
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {professionals.map((prof, index) => (
                <Card key={index} className="p-6 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                      {prof.icon}
                    </div>
                    <h3 className="font-semibold text-foreground">{prof.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{prof.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Table */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Key Features at a Glance
              </h2>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="space-y-4">
                {keyFeatures.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 rounded-xl bg-muted/30">
                    <span className="font-medium text-foreground">{item.feature}:</span>
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Verified Tracking Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Verified Tracking. Confidential Deals.
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                All tracking data is sourced from trusted marine intelligence providers and integrated securely 
                into the PetroDealHub system. While vessel movements are public by nature, deal-specific links 
                or cargo confirmations are only visible to authorized users involved in the transaction.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Decision Power Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Ship className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                This is Not Just Data. This is Decision Power.
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                From verifying a deal's legitimacy to planning a terminal delivery, our Vessels Section turns 
                complex oil logistics into clear, actionable intelligence — and keeps you ahead in a competitive market.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Want to track a specific tanker?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Or need to validate a seller's shipping claim?
              </p>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant mb-8">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                vessels@petrodealhub.com
              </Button>
            </div>
              
            <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
              <p className="text-xl font-semibold text-foreground mb-2">
                PetroDealHub
              </p>
              <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                Because Every Legit Deal Has a Legit Vessel Behind It.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VesselNews;