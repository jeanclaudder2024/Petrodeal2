import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  FileText, 
  Building2, 
  Shield, 
  BarChart3, 
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Lock,
  Users,
  Rocket
} from "lucide-react";

const APIIntegration = () => {
  const apiFeatures = [
    {
      icon: Zap,
      title: "Real-time Tanker Tracking",
      description: "Track tankers in real-time and receive automated status updates"
    },
    {
      icon: FileText,
      title: "Deal Documentation Integration",
      description: "Integrate deal documentation directly into your back-office systems"
    },
    {
      icon: Building2,
      title: "Refinery Mapping",
      description: "Map refinery capabilities and match them to shipment specs"
    },
    {
      icon: Shield,
      title: "Document Verification",
      description: "Verify offers and documents via API before executing transactions"
    },
    {
      icon: BarChart3,
      title: "Custom Dashboards", 
      description: "Build custom dashboards for your team using live trading data"
    },
    {
      icon: CheckCircle,
      title: "Compliance Automation",
      description: "Automate compliance checks and broker activity reports"
    }
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "api@petrodealhub.com",
      href: "mailto:api@petrodealhub.com"
    },
    {
      icon: Phone,
      label: "Phone", 
      value: "+1 (800) 555-API1",
      href: "tel:+18005554271"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "United States, with international coverage",
      href: null
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Enterprise API
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              API Integration
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Seamless Connectivity for Leading Oil & Energy Enterprises
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we recognize that major trading firms, refineries, brokers, and maritime 
                operators demand more than just visibility — they need direct integration into their internal 
                systems to accelerate deal flow, monitor movements, and secure transactions with precision.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                That's why we offer exclusive access to our <strong>PetroDealHub API</strong> — a secure, 
                enterprise-grade interface designed to empower your systems with real-time oil trade data, 
                shipment insights, deal tracking, refinery mapping, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               What Can You Do with PetroDealHub API?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {apiFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our API is built for secure, scalable, high-performance environments, enabling true digital 
              transformation in the petroleum supply chain.
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Access */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Lock className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                   Enterprise-Only Access
                </h2>
              </div>
            </div>

            <Card className="p-8 mb-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Access to PetroDealHub's API is not public and is currently limited to <strong>vetted enterprise clients only</strong>.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                If your organization is interested in API access, please contact us directly. We'll schedule a consultation to:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                  <Users className="w-6 h-6 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">Understand your integration needs</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                  <Shield className="w-6 h-6 text-accent-green flex-shrink-0" />
                  <span className="text-muted-foreground">Evaluate your system security</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Discuss data access levels and scope</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                 Request Access
              </h2>
              <p className="text-lg text-muted-foreground">
                To request access to our enterprise API, please contact our Business Solutions team:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {contactInfo.map((contact, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-elegant transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                    <contact.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {contact.label}
                  </h3>
                  {contact.href ? (
                    <a 
                      href={contact.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">
                      {contact.value}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Business Solutions Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Rocket className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                 Build the Future of Petroleum Trading
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                PetroDealHub is more than a platform — it's a connected ecosystem designed for speed, scale, and trust. 
                If your company is ready to integrate with the future of oil trade infrastructure, we're ready to build with you.
              </p>
              
              <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
                <p className="text-xl font-semibold text-foreground mb-2">
                  PetroDealHub API
                </p>
                <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                  Secure. Connected. Built for Enterprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default APIIntegration;