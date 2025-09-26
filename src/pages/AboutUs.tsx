import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Globe, Shield, Target, Users, TrendingUp, CheckCircle } from "lucide-react";

const AboutUs = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower brokers, refinery managers, traders, and decision-makers with comprehensive tools for tracking, verifying, and validating every stage of the petroleum deal cycle."
    },
    {
      icon: Shield,
      title: "Trust & Transparency", 
      description: "We help companies avoid misinformation, maintain deal visibility from Day 1 to final delivery, and operate with clear legal structures and honest pricing mechanisms."
    },
    {
      icon: Globe,
      title: "Global Standards",
      description: "Built for professionals worldwide in crude trading, marine logistics, refinery operations, compliance teams, and national oil companies."
    }
  ];

  const capabilities = [
    "Track, verify, and validate every stage of the petroleum deal cycle",
    "Ensure full visibility and transparency over shipments, documents, offers, and pricing", 
    "Provide real-time data intelligence on refineries, vessels, and trade dynamics",
    "Offer secure environments for negotiating and managing deals",
    "Help users protect capital, minimize risk, and close verified deals with confidence"
  ];

  const industries = [
    "Crude and refined product trading",
    "Marine shipping and logistics", 
    "Refinery deal desks",
    "Compliance and documentation teams",
    "National oil companies and energy-focused institutions"
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              About Us
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Where Oil Trade Meets Intelligence, Transparency, and Global Precision.
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PetroDealHub, we are not just a platform — we are a movement redefining how the world 
                approaches oil trading, deal visibility, and transactional trust. We are proud to be the 
                first global platform dedicated to tracking every step of the oil trade process — from 
                initial inquiry and documentation, to refinery coordination and real-time tanker mapping — 
                all in one secure, intuitive ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {values.map((value, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-elegant transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Capabilities */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              What We Enable
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <CheckCircle className="w-6 h-6 text-accent-green mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">
                    {capability}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Standards */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              A Platform Built for Global Standards
            </h2>
            <div className="text-center mb-12">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                PetroDealHub serves as a comprehensive commercial interface for professionals in:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {industries.map((industry, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-elegant transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {industry}
                  </p>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our systems are built on structured data layers, secure pipelines, verified business logic, 
                and a user experience crafted for real traders and decision-makers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Training & Support */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <Users className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Training. Support. Empowerment.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe knowledge drives precision. That's why PetroDealHub offers continuous onboarding, 
                guidance, and training modules for our subscribers. Whether you're an emerging broker or a 
                seasoned refinery executive, you'll always know what's next, what's required, and what's 
                real in your deal pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Scale */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
              Driven by Vision. Designed for Scale.
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Our team spans multiple countries and time zones, combining deep oil & gas expertise 
                with scalable digital architecture. Whether you're in Houston, Dubai, Rotterdam, or 
                Singapore — PetroDealHub speaks your language.
              </p>
              <p>
                We are building the future of petroleum trading — one deal, one tanker, one secure 
                connection at a time.
              </p>
            </div>
            
            <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-accent-green/10 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Globe className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-bold text-foreground">PetroDealHub</h3>
              </div>
              <p className="text-xl text-muted-foreground mb-2">
                The Global Oil Trade Platform
              </p>
              <p className="text-lg font-semibold bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent">
                Precision. Protection. Power.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;