import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
const FinalCTA = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const {
    content
  } = useLandingPageContent('final_cta');
  useEffect(() => {
    if (!sectionRef.current) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.15
    });
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Demo Request Submitted",
        description: "We'll contact you within 24 hours to schedule your demo."
      });
      setFormData({
        name: "",
        email: "",
        company: "",
        message: ""
      });
      setSubmitting(false);
    }, 900);
  };
  const handleInputChange = (field: keyof typeof formData, value: string) => setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  return <section ref={sectionRef} className="relative overflow-hidden py-24 md:py-28">
      {/* Professional minimal background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      {/* Thin structure lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-border/60" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-border/60" />

      {/* Soft spotlights */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 w-[24rem] h-[24rem] rounded-full bg-accent-green/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] h-[22rem] rounded-full bg-primary/10 blur-3xl" />

      {/* Floating particles */}
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-slate-700">
        <span className="particle" />
        <span className="particle delay-1" />
        <span className="particle delay-2" />
        <span className="particle delay-3" />
        <span className="particle delay-4" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`max-w-4xl mx-auto text-center mb-12 md:mb-16 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
            {content?.title || "Transform Your Global Petroleum Trading"}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {content?.description || "Join hundreds of traders and brokers who are already revolutionizing their operations with PetroDealHub."}
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 max-w-6xl mx-auto items-center">
          {/* Left: CTAs + benefits */}
          <div className={`space-y-8 transition-all duration-700 ${visible ? "animate-fade-up [animation-delay:80ms]" : "opacity-0 translate-y-6"}`}>
            <div className="space-y-4">
              <Button size="lg" onClick={() => navigate("/contact")} className="w-full hero-button px-8 py-6 text-xl shadow-elegant hover:shadow-glow transition-transform hover:scale-[1.02] bg-orange-500 hover:bg-orange-400">
                Book Your Free Demo
              </Button>

              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="w-full px-8 py-6 text-xl border-primary/30 hover:bg-primary/10 text-foreground">
                Start Free 5-Day Trial
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <h4 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
            Why PetroDealHub?
          </h4>
              {[{
              dot: "bg-accent",
              text: " Verified International Broker Membership (ICC & UNCITRAL compliant)"
            }, {
              dot: "bg-accent-green",
              text: "Commission protection built into every deal (GAFTA & FOSFA standards)"
            }, {
              dot: "bg-primary",
              text: " Direct connections with leading oil companies worldwide (Aramco, ADNOC, Rosneft, ExxonMobil, Shell, BP, TotalEnergies)"
            }].map((b, i) => <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${b.dot}`} />
                  <span className="text-muted-foreground">{b.text}</span>
                </div>)}
            </div>
          </div>

          {/* Right: Form Card */}
          <Card className={`relative p-8 md:p-10 border bg-card/80 backdrop-blur-md transition-all duration-700 ${visible ? "animate-fade-up [animation-delay:160ms]" : "opacity-0 translate-y-6"}`}>
            {/* Gradient ring frame */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-60" style={{
            background: "linear-gradient(135deg, hsla(var(--primary),0.25), hsla(var(--accent),0.25))",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)"
          }} />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-2xl font-bold text-foreground mb-1">Quick Contact</h3>
                <p className="text-muted-foreground">Get a personalized demo tailored to your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="John Doe" required className="mt-1 focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Business Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="john@company.com" required className="mt-1 focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
              </div>

              <div>
                <Label htmlFor="company" className="text-sm font-medium">Company Name *</Label>
                <Input id="company" value={formData.company} onChange={e => handleInputChange("company", e.target.value)} placeholder="Your Company" required className="mt-1 focus-visible:ring-2 focus-visible:ring-accent" />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium">Tell us about your needs</Label>
                <Textarea id="message" value={formData.message} onChange={e => handleInputChange("message", e.target.value)} placeholder="Describe your current trading challenges and what you're looking for..." className="mt-1 min-h-[110px] focus-visible:ring-2 focus-visible:ring-accent" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full hero-button py-3 text-base md:text-lg relative overflow-hidden bg-orange-500 hover:bg-orange-400">
                <span className={`transition-opacity ${submitting ? "opacity-0" : "opacity-100"}`}>
                  Submit Request
                </span>
                {/* loading shimmer */}
                {submitting && <span className="absolute inset-0 flex items-center justify-center text-sm">
                    Processing…
                  </span>}
                <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent [mask-image:linear-gradient(90deg,transparent,black,transparent)] animate-shine" />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Scoped animations */}
      <style>{`
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 700ms cubic-bezier(.2,.65,.3,1) both; }

        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: .35; }
          50% { transform: translateY(-12px) translateX(6px); opacity: .6; }
          100% { transform: translateY(0) translateX(0); opacity: .35; }
        }
        .particle {
          position: absolute;
          width: 8px; height: 8px;
          left: 10%; top: 65%;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, hsla(var(--accent),.9), hsla(var(--accent),0));
          animation: float 6s ease-in-out infinite;
          filter: blur(0.5px);
        }
        .particle.delay-1 { left: 22%; top: 30%; width: 10px; height: 10px; animation-duration: 7.2s; }
        .particle.delay-2 { left: 48%; top: 20%; width: 6px; height: 6px; animation-duration: 5.4s; }
        .particle.delay-3 { left: 72%; top: 70%; width: 9px; height: 9px; animation-duration: 6.6s; }
        .particle.delay-4 { left: 85%; top: 40%; width: 7px; height: 7px; animation-duration: 7.8s; }

        @keyframes shine {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
        .animate-shine { animation: shine 1.9s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-shine { animation: none !important; }
          .particle { display:none; }
        }
      `}</style>
    </section>;
};
export default FinalCTA;