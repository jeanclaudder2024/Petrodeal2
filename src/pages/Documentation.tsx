import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  Users, 
  Shield, 
  CheckCircle, 
  Globe, 
  Download,
  Mail,
  AlertTriangle,
  Edit,
  Lock,
  Target
} from "lucide-react";

const Documentation = () => {
  const templateFeatures = [
    "Available in fully editable DOCX or PDF formats",
    "Professionally formatted for real-world oil deal environments", 
    "Structured based on common practices and expectations in international oil trade",
    "Intended for customization by the involved parties based on their agreement"
  ];

  const documentCategories = [
    {
      title: "Letter of Intent (LOI)",
      description: "Expresses the buyer's or seller's intent to engage in a petroleum deal."
    },
    {
      title: "Irrevocable Corporate Purchase Order (ICPO)", 
      description: "Standard document issued by buyers to proceed with a defined deal offer."
    },
    {
      title: "Full Corporate Offer (FCO)",
      description: "Detailed terms from the seller outlining product, pricing, quantity, and terms."
    },
    {
      title: "Sales & Purchase Agreement (SPA)",
      description: "Commercial agreement between parties; we offer standard frameworks."
    },
    {
      title: "Bill of Lading (B/L)",
      description: "Template reflecting standard transport documentation linked to tankers or vessels."
    },
    {
      title: "SGS Inspection Certificate",
      description: "A placeholder format based on how cargo is typically inspected and certified."
    },
    {
      title: "Safety Data Sheet (SDS)",
      description: "Outlines petroleum product properties and safety handling references."
    },
    {
      title: "Port Receipts & Tank Entry Documents",
      description: "Includes basic templates that reflect industry practices in loading/unloading."
    }
  ];

  const whyProvide = [
    "To accelerate deal readiness for brokers and intermediaries",
    "To enhance transparency and avoid common delays due to document misalignment",
    "To support onboarding of new traders, companies, and partners into the petroleum trading process",
    "To streamline communication between tankers, refineries, and buyers"
  ];

  const confidentialityPoints = [
    "PetroDealHub does not sign or execute any documents on behalf of users",
    "We do not guarantee legal enforceability of any template used off-platform",
    "We offer these templates as a service to assist and organize the deal process, not as legal counsel or official deal certification"
  ];

  const targetUsers = [
    "Professional brokers working with new counterparties",
    "Refinery managers preparing structured offers",
    "Legal teams needing a starting framework for review", 
    "Small oil trading firms navigating international workflows"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-accent to-accent-green text-white">
              Documentation Center
            </Badge>
            <div className="flex items-center justify-center gap-3 mb-6">
              <BookOpen className="w-12 h-12 text-accent" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Documentation Center
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Professional Resources to Empower Global Oil Transactions
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we understand that documentation lies at the core of every successful oil transaction. 
                Our platform offers a wide range of professionally structured templates and deal-oriented materials, 
                designed to help brokers, refineries, shipping agents, and traders operate with clarity and confidence 
                in complex international markets.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                <strong>We don't act as a legal authority or certification body.</strong> Rather, PetroDealHub provides 
                smart access to business-ready templates and documentation frameworks that reflect industry standards 
                and common deal practices — always with full transparency that the platform does not bear legal 
                responsibility for the final content of any document used outside the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <FileText className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  What Our Documentation Section Offers
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Edit className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-bold text-foreground">Editable & Deal-Driven Templates</h3>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6">
                All templates provided through our Documentation Center are:
              </p>

              <div className="space-y-3">
                {templateFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-foreground">
                  <strong>We help you accelerate deal preparation — but you remain responsible for validation, 
                  compliance, and signature finalization.</strong>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Document Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Included Document Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentCategories.map((doc, index) => (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-green flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{doc.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed ml-11">{doc.description}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 inline-block">
                <p className="text-foreground">
                  <strong>📌 Note:</strong> All documentation files provided are for operational reference. 
                  They are not legally binding unless reviewed, completed, and signed by authorized entities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Provide */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Target className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Why We Provide These Documents
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="space-y-4">
                {whyProvide.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{reason}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Confidentiality */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Lock className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Confidentiality & Usage Policy
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="space-y-4">
                {confidentialityPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-8 h-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Who Is It For?
                </h2>
              </div>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <p className="text-lg text-muted-foreground mb-6">
                Our documentation resources are best suited for:
              </p>
              <div className="space-y-3">
                {targetUsers.map((user, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{user}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Customization Support */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Customization Support Available
              </h2>
            </div>

            <Card className="p-8 border-0 bg-background/80 backdrop-blur-sm shadow-elegant text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Do you need help tailoring a document to a specific transaction or jurisdiction?
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Our team can guide you to the right format, or help you request professional assistance 
                through our extended partner network.
              </p>
              
              <Button 
                variant="outline" 
                size="lg"
                className="flex items-center gap-2 mx-auto"
              >
                <Mail className="w-5 h-5" />
                documentation@petrodealhub.com
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <BookOpen className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                We Don't Just Power Deals
              </h2>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                We Support Every Step of Them. Access professional documentation resources designed for the global oil market.
              </p>
              
              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Download className="w-5 h-5 mr-2" />
                Access Documentation Center
              </Button>
            </div>
              
            <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
              <p className="text-xl font-semibold text-foreground mb-2">
                PetroDealHub Documentation
              </p>
              <p className="text-lg bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-medium">
                Professional Resources to Empower Global Oil Transactions
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Documentation;