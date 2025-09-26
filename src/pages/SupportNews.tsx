import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Headphones, 
  BookOpen, 
  Users, 
  Shield, 
  Clock, 
  Globe, 
  CheckCircle,
  Mail,
  MessageSquare,
  PlayCircle,
  Settings,
  UserCheck
} from "lucide-react";

const SupportNews = () => {
  const supportFeatures = [
    {
      icon: <BookOpen className="w-6 h-6 text-white" />,
      title: "Knowledge Base & FAQs",
      description: "Get instant answers to the most common questions about account setup, document handling, tracking tools, and deal progression."
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-white" />,
      title: "Step-by-Step Tutorials",
      description: "From sending your first offer to verifying a B/L or coordinating with a tanker — our guides break down every action into simple, visual steps."
    },
    {
      icon: <Settings className="w-6 h-6 text-white" />,
      title: "Technical Support & Incident Help",
      description: "Having issues with login, data sync, or offer submission? Our technical team diagnoses platform errors and assists with data flow."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      title: "Ticketing System (24/7)",
      description: "Submit support requests anytime via your dashboard. Each ticket is tracked, time-stamped, and managed by our global support workflow."
    },
    {
      icon: <UserCheck className="w-6 h-6 text-white" />,
      title: "Dedicated Account Managers",
      description: "Premium subscribers and enterprise partners receive one-on-one support from assigned account managers who understand your use case."
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Live Onboarding & Training",
      description: "New to PetroDealHub? Schedule a live onboarding session with our experts — tailored to your company's structure and market focus."
    }
  ];

  const supportBenefits = [
    "Rapid multilingual support",
    "Region-aware compliance assistance", 
    "Confidential handling of sensitive client and transaction data"
  ];

  const regions = [
    "North America", "Europe", "Latin America", "Asia", "Middle East", "Africa"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Support Excellence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Support Center
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Your Trusted Partner in Every Step of the Oil Deal Lifecycle
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we understand that time is critical, trust is non-negotiable, and support must be 
                immediate and intelligent. That's why we offer a world-class Support Center designed for traders, 
                brokers, refinery managers, and integration teams across the globe.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                <strong>Whether you're managing your first deal or integrating our platform into your enterprise 
                systems — we're here, every step of the way.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Ecosystem */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Settings className="w-8 h-8 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What You'll Find in Our Support Ecosystem
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {supportFeatures.map((feature, index) => (
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

      {/* Global Coverage */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Global Coverage. Localized Response.
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                At PetroDealHub, we proudly serve companies and professionals across{" "}
                <span className="font-semibold text-foreground">
                  {regions.join(", ")}
                </span>{" "}
                — covering every oil trading region in the world without exception.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Whether you're closing a deal in Rotterdam, verifying cargo in Houston, or tracking a shipment 
                in Singapore, our support operations are designed to respond with speed, clarity, and regional expertise.
              </p>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground mb-4">We ensure:</h3>
                {supportBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Never Alone */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  You're Never Alone in a Deal
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                In an industry where timing, accuracy, and document precision can define millions in value — 
                PetroDealHub ensures you're never alone. Our support teams bridge the gap between action and assurance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Headphones className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Need Help?
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant text-center">
              <div className="space-y-6">
                <div>
                  <p className="text-lg text-muted-foreground mb-4">
                    Reach us at:
                  </p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Mail className="w-5 h-5" />
                    support@petrodealhub.com
                  </Button>
                </div>
                
                <div className="text-muted-foreground">
                  <p>Or open a support ticket directly from your account dashboard.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Headphones className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Precision Trade Support
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Built for the Global Oil Market. Experience world-class support that understands your business.
              </p>
              
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                Access Support Center
              </Button>
            </div>
              
            <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
              <p className="text-xl font-semibold text-foreground mb-2">
                PetroDealHub Support
              </p>
              <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                Precision Trade Support, Built for the Global Oil Market
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SupportNews;