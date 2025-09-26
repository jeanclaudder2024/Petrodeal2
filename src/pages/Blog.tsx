import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  FileText, 
  BookOpen, 
  Users, 
  Zap,
  Globe,
  Edit3,
  Mail,
  Lightbulb,
  BarChart3,
  Shield,
  Target,
  ArrowRight
} from "lucide-react";

const Blog = () => {
  const blogValues = [
    {
      icon: TrendingUp,
      title: "Industry Intelligence",
      description: "Stay ahead with insights into market trends, global price shifts, refinery movements, and regulatory updates."
    },
    {
      icon: Target,
      title: "Deal Strategy", 
      description: "Learn how top brokers structure offers, negotiate terms, and validate documents across regions."
    },
    {
      icon: BookOpen,
      title: "Platform How-To Guides",
      description: "Deep dives into using PetroDealHub's features — from uploading a deal to reviewing a vessel's route."
    },
    {
      icon: Users,
      title: "Expert Commentary",
      description: "Articles from seasoned professionals with real experience in crude, refined products, tankers, port operations, and risk management."
    },
    {
      icon: Zap,
      title: "AI, TradeTech & Petroleum",
      description: "How smart platforms are reshaping legacy trading workflows."
    }
  ];

  const sampleArticles = [
    {
      emoji: "",
      title: "The Rise of Digital Oil Brokerage: How Smart Platforms Are Replacing Old Models",
      description: "Explore how PetroDealHub and similar technologies are changing the broker's role forever."
    },
    {
      emoji: "", 
      title: "Tanker-to-Refinery Deals: How to Verify Real-World Shipment Paths",
      description: "Understand the key documents and digital tools to validate that a tanker is truly en route to a legitimate refinery."
    },
    {
      emoji: "",
      title: "LOI vs FCO: What Makes a Legitimate First Offer in Oil Trade?",
      description: "We break down the documentation logic and how buyers should issue intent the right way."
    },
    {
      emoji: "",
      title: "Insider's View: Why Many Oil Deals Fail Before They Start", 
      description: "A detailed guide on the missteps brokers make — and how PetroDealHub simplifies and secures the early steps of a transaction."
    },
    {
      emoji: "",
      title: "The Future of Trade Intelligence in Oil Logistics",
      description: "Learn how big data, blockchain, and smart APIs are creating real-time visibility for cargo, documents, and compliance."
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
               Industry Insights
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Blog – Insights That Fuel Global Oil Trade
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Expert Articles. Real-World Value. PetroDealHub Perspective.
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-elegant">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                At PetroDealHub, we believe that knowledge is as powerful as the deal itself.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our Blog is not just a space for content — it's a strategic resource center built to empower 
                brokers, traders, refinery managers, and energy professionals with insights that matter. 
                From the intricate world of oil documentation to the evolving global tanker routes — 
                every article is written to bridge experience, data, and decision-making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Our Blog Matters */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               Why Our Blog Matters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {blogValues.slice(0, 3).map((value, index) => (
              <Card 
                key={index}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-green flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {value.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
            {blogValues.slice(3).map((value, index) => (
              <Card 
                key={index + 3}
                className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-0 bg-background/80 backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-foreground">
                  {value.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Articles */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               Sample Article Topics
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {sampleArticles.map((article, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-accent to-accent-green rounded-xl flex items-center justify-center text-white text-xl">
                    {article.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Focus */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <Globe className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                 Global Focus. Local Relevance.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our content reflects every region where oil moves — from the Americas and Europe, 
                to the Middle East, Asia, and Africa. Whether you're closing a deal in Texas or 
                verifying documents from Singapore, our insights translate across borders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribute Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-accent-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center border-0 bg-background/80 backdrop-blur-sm shadow-elegant">
              <div className="mb-6">
                <Edit3 className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                   Want to Contribute?
                </h2>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We welcome articles from professionals in the industry.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Submit a piece and let your experience become part of the global conversation.
                </p>
              </div>

              <Button 
                size="lg"
                className="bg-gradient-to-r from-accent to-accent-green hover:shadow-elegant px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                blog@petrodealhub.com
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Tagline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-accent-green/10 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Lightbulb className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-bold text-foreground">PetroDealHub Blog</h3>
              </div>
              
              <div className="space-y-2 text-lg">
                <p className="text-muted-foreground">
                  Where Trading Meets Insight.
                </p>
                <p className="text-muted-foreground">
                  Where Documents Meet Strategy.
                </p>
                <p className="bg-gradient-to-r from-accent to-accent-green bg-clip-text text-transparent font-semibold">
                  Where Oil Moves Smarter.
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

export default Blog;