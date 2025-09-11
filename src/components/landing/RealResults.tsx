import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Clock, Star, Quote, ArrowRight, Award } from "lucide-react";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
const RealResults = () => {
  const navigate = useNavigate();
  const {
    content
  } = useLandingPageContent('real_results');
  const stats = [{
    icon: TrendingUp,
    value: "$2.4B",
    label: "Trading Volume",
    description: "Processed through our platform in 2024",
    gradient: "from-accent to-gold"
  }, {
    icon: Users,
    value: "15,000+",
    label: "Active Traders",
    description: "Growing community of verified professionals",
    gradient: "from-primary to-water"
  }, {
    icon: Clock,
    value: "87%",
    label: "Faster Deals",
    description: "Average time reduction in deal completion",
    gradient: "from-water to-accent-green"
  }, {
    icon: Award,
    value: "99.9%",
    label: "Success Rate",
    description: "Deals completed without disputes",
    gradient: "from-gold to-accent"
  }];
  const testimonials = [{
    name: "Sarah Chen",
    role: "Head of Trading",
    company: "Maritime Energy Solutions",
    image: "/api/placeholder/64/64",
    quote: "PetroDealHub transformed our trading operations. We're closing 3x more deals with half the paperwork. The AI insights alone have saved us millions.",
    rating: 5
  }, {
    name: "Marcus Rodriguez",
    role: "Senior Broker",
    company: "Global Petroleum Brokers",
    image: "/api/placeholder/64/64",
    quote: "The transparency and speed of this platform is incredible. What used to take weeks now happens in days. It's revolutionized how we do business.",
    rating: 5
  }, {
    name: "Elena Popovich",
    role: "Trading Director",
    company: "Baltic Oil Trading",
    image: "/api/placeholder/64/64",
    quote: "Risk management has never been easier. The real-time data and automated compliance features give us confidence in every transaction.",
    rating: 5
  }];
  return <section className="py-32 relative overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/20 bg-slate-700">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6 animate-fade-in-up">
            <Star className="w-4 h-4 text-gold mr-2" />
            <span className="text-sm font-medium text-gold">Proven Results</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-200 text-zinc-50 md:text-7xl">
            {content?.title || "Real Impact, Real Results"}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            {content?.description || "Join thousands of professionals who have transformed their trading operations and achieved unprecedented success with PetroDealHub."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => <Card key={index} className={`group relative p-8 text-center border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in-up`} style={{
          animationDelay: `${index * 0.1}s`
        }}>
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
              <div className="absolute inset-[1px] rounded-xl bg-card" />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="text-4xl font-bold mb-2 text-primary group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {stat.label}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </Card>)}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12 animate-fade-in-up text-orange-400">
            What Industry Leaders Say
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className={`group p-8 border-0 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-fade-in-up`} style={{
            animationDelay: `${(index + 4) * 0.1}s`
          }}>
                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  <p className="text-muted-foreground leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                  </div>
                </div>
              </Card>)}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-accent/10 to-gold/10 rounded-3xl p-12 backdrop-blur-sm border border-primary/20 animate-fade-in-up animation-delay-800">
          <h3 className="text-4xl font-bold mb-4 text-white">
            Ready To Trade Smarter, Safer, And Globally?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Don’t Let Outdated Processes Slow You Down. With PetroDealHub, Every Deal Is Protected by International Contracts, Verified Brokers, And Guaranteed Commission Protection.
          </p>
          
          <Button size="lg" onClick={() => navigate("/auth")} className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-primary via-accent to-gold hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>;
};
export default RealResults;