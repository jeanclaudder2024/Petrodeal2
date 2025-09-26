import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Ship, 
  TrendingUp, 
  Users, 
  Wifi,
  Building2,
  BarChart3,
  Scale,
  Search,
  Code,
  FileText,
  MapPin,
  Mail,
  Rocket,
  Target,
  Briefcase
} from "lucide-react";

const Careers = () => {
  const whyWorkWithUs = [
    {
      icon: Globe,
      title: "Global Impact",
      description: "Contribute to projects that influence trade flows, fuel infrastructure, and economic resilience worldwide."
    },
    {
      icon: Ship,
      title: "Real-World Trade",
      description: "Collaborate with brokers, refineries, and shipping agents on live workflows and real trade scenarios."
    },
    {
      icon: TrendingUp,
      title: "High-Performance Culture",
      description: "Thrive in a data-driven environment where innovation, precision, and speed matter."
    },
    {
      icon: Users,
      title: "Trusted Network",
      description: "Join a community of professionals shaping the digital future of oil logistics and commercial intelligence."
    },
    {
      icon: Wifi,
      title: "Remote & Hybrid Roles",
      description: "Our team spans multiple continents, with flexible work models to support productivity and well-being."
    }
  ];

  const expertiseAreas = [
    { icon: BarChart3, area: "Oil trading and brokering" },
    { icon: Building2, area: "Refinery operations and downstream strategy" },
    { icon: Ship, area: "Tanker logistics and marine traffic coordination" },
    { icon: Target, area: "Business development in energy markets" },
    { icon: Code, area: "Digital trade infrastructure (product, tech, UX)" },
    { icon: Scale, area: "Legal and compliance in petroleum contracts" },
    { icon: Search, area: "Research & market intelligence (energy economics, OPEC trends)" }
  ];

  const currentOpenings = [
    {
      title: "Senior Oil Trade Analyst",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Refinery Account Manager (Gulf & MENA)",
      location: "Dubai / Remote",
      type: "Full-time"
    },
    {
      title: "Platform Product Manager – Maritime Tools",
      location: "US or Europe",
      type: "Full-time"
    },
    {
      title: "Head of Broker Partnerships",
      location: "Flexible",
      type: "Senior Level"
    },
    {
      title: "Contract Specialist – Oil & Commodities",
      location: "Remote",
      type: "Full-time"
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
              🚀 Join Our Team
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Careers at PetroDealHub
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Shape the Future of Global Oil Trade
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                At PetroDealHub, we don't just build platforms — we build the tools that power petroleum 
                trade across continents. We're redefining how brokers, refineries, and shipping operators 
                connect, communicate, and close deals in the ever-evolving world of energy.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                As a U.S.-based global platform, we combine technological innovation, trade insight, and 
                operational intelligence to drive value for our partners and users. And we're always on 
                the lookout for bold minds ready to lead the next phase of our growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Why Work With Us?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {whyWorkWithUs.slice(0, 3).map((benefit, index) => (
              <Card 
                key={index}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
            {whyWorkWithUs.slice(3).map((benefit, index) => (
              <Card 
                key={index + 3}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Who We're Looking For
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We hire globally. If you have expertise in the following fields, we want to hear from you:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {expertiseAreas.map((expertise, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center flex-shrink-0">
                    <expertise.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {expertise.area}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Current Openings
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {currentOpenings.map((job, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-green rounded-xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                        📌 {job.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <Badge variant="outline">
                          {job.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-6">
              Interested in joining a platform that connects the world's energy movers?
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Send your resume and cover letter to:
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
            >
              <Mail className="w-5 h-5 mr-2" />
              careers@petrodealhub.com
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
              Work Where Oil Meets Opportunity
            </h2>
            
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Whether you're a seasoned broker, a trade lawyer, or a digital product thinker — 
                if you're ready to work at the intersection of energy, commerce, and technology, 
                PetroDealHub is the place for you.
              </p>
              
              <div className="p-6 bg-gradient-to-r from-accent/10 to-accent-green/10 rounded-xl border border-accent/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Rocket className="w-8 h-8 text-accent" />
                  <p className="text-xl font-semibold text-foreground">
                    🚀 Let's move the barrels. Let's build the future. Together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;