import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Star, Quote, Play, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
const testimonials = [{
  name: "Sarah Chen",
  role: "Head of Trading",
  company: "Maritime Energy Solutions ",
  location: "Singapore",
  avatar: "SC",
  quote: "The commission protection system eliminated disputes and gave us confidence to scale internationally.",
  rating: 5,
  dealVolume: "$50M+",
  savings: "87% faster",
  gradient: "from-primary to-water"
}, {
  name: "Marcus Rodriguez",
  role: "Senior Petroleum Broker",
  company: "Global Oil Brokers Ltd",
  location: "USA",
  avatar: "MR",
  quote: "Compliance monitoring and access to ICPO and SPA contracts improved investor trust in every transaction.",
  rating: 5,
  dealVolume: "$125M+",
  savings: "3x more deals",
  gradient: "from-accent to-gold"
}, {
  name: "Elena Petrov",
  role: "Trading Director",
  company: "Northern Oil Trading",
  location: "London, UK",
  avatar: "EP",
  quote: "Market insights allowed us to time trades perfectly during volatility—one optimized deal covered our subscription cost",
  rating: 5,
  dealVolume: "$200M+",
  savings: "99.9% accuracy",
  gradient: "from-gold to-accent-green"
}, {
  name: "Ahmed Al-Rashid",
  role: "Chief Commercial Officer",
  company: "Gulf Energy Partners",
  location: "Dubai, UAE",
  avatar: "AR",
  quote: "Global coverage connected us with refineries across 3 continents in our first month—seamless expansion with verified brokers.",
  rating: 5,
  dealVolume: "$300M+",
  savings: "ROI 400%",
  gradient: "from-water to-primary"
}, {
  name: "Maria Santos",
  role: "Regional Manager",
  company: "Latin Petroleum Corp",
  location: "São Paulo, Brazil",
  avatar: "MS",
  quote: "24/7 support and training enabled our team to manage $180M in trades smoothly within weeks.",
  rating: 5,
  dealVolume: "$75M+",
  savings: "5 countries",
  gradient: "from-accent-green to-accent"
}, {
  name: "James Mitchell",
  role: "VP of Operations",
  company: "Atlantic Trading House",
  location: "New York, USA",
  avatar: "JM",
  quote: "Customer support is phenomenal. 24/7 assistance during critical deals made all the difference. The training program got our entire team up to speed in just 2 weeks.",
  rating: 5,
  dealVolume: "$180M+",
  savings: "24/7 support",
  gradient: "from-primary to-gold"
}];
const track = [...testimonials, ...testimonials]; // for seamless loop

const TestimonialsSection = () => {
  const navigate = useNavigate();
  const {
    content
  } = useLandingPageContent('testimonials');
  return <section className="relative overflow-hidden py-28">
      {/* Professional background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background bg-gray-800" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-border/60" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-border/60" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="outline" className="border-border/70 text-muted-foreground tracking-wide mb-4">
            Customer Testimonials
          </Badge>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 text-zinc-50 md:text-7xl">
            {content?.title || "Trusted by Industry Leaders"}
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            {content?.description || "Proof, not promises — measurable impact across trading desks worldwide."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
          {[{
          n: "$2.4B+",
          l: "Trading Volume",
          c: "text-primary"
        }, {
          n: "15,000+",
          l: "Active Users",
          c: "text-accent"
        }, {
          n: "98%",
          l: "Success Rate",
          c: "text-foreground"
        }, {
          n: "50+",
          l: "Countries",
          c: "text-foreground"
        }].map((s, i) => <div key={i} className="text-center p-6 rounded-xl border bg-card/70 backdrop-blur-sm">
              <div className={`text-3xl md:text-4xl font-bold ${s.c} mb-1`}>
                {s.n}
              </div>
              <div className="text-muted-foreground text-sm md:text-base">
                {s.l}
              </div>
            </div>)}
        </div>

        {/* Auto-scroll lanes */}
        <div className="relative overflow-hidden">
          {/* Fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-20" />

          {/* Lane 1 */}
          <div className="flex items-stretch gap-6 md:gap-8 w-[200%] will-change-transform animate-[t-scroll_42s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]" aria-label="Scrolling testimonials lane 1">
            {track.map((t, idx) => <TestimonialCard key={`l1-${idx}`} t={t} />)}
          </div>

          {/* Lane 2 */}
          <div className="mt-8 flex items-stretch gap-6 md:gap-8 w-[200%] will-change-transform animate-[t-scroll-rev_58s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]" aria-label="Scrolling testimonials lane 2">
            {track.map((t, idx) => <TestimonialCard key={`l2-${idx}`} t={t} />)}
          </div>

          {/* Keyframes */}
          <style>{`
            @keyframes t-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            @keyframes t-scroll-rev { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
            @media (prefers-reduced-motion: reduce) {
              .animate-[t-scroll_42s_linear_infinite],
              .animate-[t-scroll-rev_58s_linear_infinite] { animation: none !important; }
            }
          `}</style>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center rounded-2xl p-10 md:p-12 border bg-card/60 backdrop-blur-sm">
          <h3 className="text-3xl md:text-4xl font-bold mb-3">
            See PetroDealHub in Action
          </h3>

          <p className="text-base md:text-lg mb-7 text-muted-foreground">
            Short videos and real case studies from trading teams like yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/contact")} className="group px-7 py-4 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Video Testimonials
            </Button>

            <Button size="lg" variant="outline" onClick={() => {
            const el = document.getElementById("services");
            if (el) el.scrollIntoView({
              behavior: "smooth"
            });
          }} className="group px-7 py-4 text-lg font-semibold border-2 text-slate-50">
              <TrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              View Case Studies
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
function TestimonialCard({
  t
}: {
  t: any;
}) {
  return <Card tabIndex={0} className="relative shrink-0 w-[300px] md:w-[360px] p-0 border bg-card/80 backdrop-blur-md outline-none" aria-label={`Testimonial by ${t.name}, ${t.role} at ${t.company}`}>
      <div className="group relative p-7 md:p-8 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        {/* Minimalist frame */}
        <div className="absolute inset-[0] rounded-xl ring-1 ring-border/60" />
        {/* Subtle accent on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
        background: "linear-gradient(120deg, hsl(var(--primary)/0.06), transparent 30%, hsl(var(--accent)/0.06))"
      }} />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex justify-between items-start mb-4">
            <Quote className="w-6 h-6 text-muted-foreground/40" />
            <div className="flex gap-1">
              {Array.from({
              length: t.rating
            }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />)}
            </div>
          </div>

          {/* Quote */}
          <p className="text-muted-foreground leading-relaxed mb-5 italic">
            "{t.quote}"
          </p>

          {/* Profile */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold">
              {t.avatar}
            </div>
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-muted-foreground">{t.role}</div>
              <div className="text-xs text-muted-foreground">{t.company}</div>
              <div className="text-xs text-muted-foreground">{t.location}</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-4 pt-4 border-t border-border/40">
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-foreground">
                {t.dealVolume}
              </div>
              <div className="text-xs text-muted-foreground">Deal Volume</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-foreground">{t.savings}</div>
              <div className="text-xs text-muted-foreground">Improvement</div>
            </div>
          </div>
        </div>
      </div>
    </Card>;
}
export default TestimonialsSection;