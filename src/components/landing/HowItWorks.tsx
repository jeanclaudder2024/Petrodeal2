import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, Database, Handshake, FileText, ArrowRight, CheckCircle } from "lucide-react";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
const HowItWorks = () => {
  const navigate = useNavigate();
  const {
    content
  } = useLandingPageContent('how_it_works');
  const steps = [{
    icon: Search,
    title: "Discover & Analyze",
    description: "Advanced Petroleum Intelligence Identifies Real Opportunities and Provides Global Vessel Tracking in Real Time.",
    details: ["Verified Vessel Positions Across Major Routes", "Market Price and Trend Analysis", "Route Optimization & Logistics Planning", "Risk And Compliance Assessment"],
    gradient: "from-primary to-primary-glow",
    delay: "0s"
  }, {
    icon: Database,
    title: "Connect & Network",
    description: "Join Our Network of Verified International Oil Brokers, Refineries, And Trading Partners Through Secure Communication..",
    details: ["ICC & UNCITRAL-Recognized Broker Membership", "Verified Partner Connections Worldwide", "Instant Deal Notifications", "Reputation & Compliance Scoring"],
    gradient: "from-accent to-gold",
    delay: "0.2s"
  }, {
    icon: Handshake,
    title: "Negotiate & Close",
    description: "Close Deals Faster with Structured Templates and Guaranteed Commission Protection.",
    details: ["Secure Contract Templates (ICPO, SPA, B/L, GAFTA & FOSFA Standards)", "Digital Negotiation Tools for Efficiency", "Deal Progress Tracking with Full Transparency", "Performance & Compliance Analytics"],
    gradient: "from-water to-accent-green",
    delay: "0.4s"
  }, {
    icon: FileText,
    title: "Execute & Deliver",
    description: "Ensure Smooth Completion of Every Transaction with Verified Documents, Global Compliance, And Commission Protection.",
    details: ["Verified Trade Documents (LOI, ICPO, SPA, B/L, SGS, POP)", "Compliance With ICC & UNCITRAL International Standards", "Commission Protection Built into Every Deal", "Secure Payment Tracking & Delivery Confirmation"],
    gradient: "from-gold to-secondary",
    delay: "0.6s"
  }];
  return <section className="py-32 relative overflow-hidden bg-gradient-to-b from-background to-muted/20 bg-slate-700">
      {/* Background Elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-gradient-to-l from-accent/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 animate-fade-in-up">
            <span className="text-sm font-medium text-accent">How It Works</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200 text-slate-50">
            {content?.title || "From Discovery to Deal Completion"}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            {content?.description || "Our streamlined process transforms complex oil trading into a seamless, efficient experience that saves time and maximizes profits."}
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {steps.map((step, index) => <Card key={index} className={`group relative p-8 border-0 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up`} style={{
          animationDelay: step.delay
        }}>
              {/* Step Number */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                {index + 1}
              </div>
              
              <div className="flex items-start gap-6 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Feature List */}
              <div className="grid grid-cols-2 gap-3">
                {step.details.map((detail, idx) => <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{detail}</span>
                  </div>)}
              </div>
              
              {/* Arrow for larger screens */}
              {index < steps.length - 1 && <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>}
            </Card>)}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/5 via-accent/5 to-gold/5 rounded-3xl p-12 backdrop-blur-sm border border-primary/10 animate-fade-in-up animation-delay-800">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Petrodealhub’s Verified Network of International Brokers and Partners—Closing Deals Faster, Safer, And with Full Commission Protection Under Global Standards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="px-10 py-4 text-lg font-semibold border-2 border-primary/20 hover:border-primary/40 bg-orange-500 hover:bg-orange-400">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HowItWorks;