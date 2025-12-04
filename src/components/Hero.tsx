import { Button } from "@/components/ui/button";
import { ArrowRight, Gauge, Shield, Zap, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";
import heroImage from "@/assets/hero-oil-trading.jpg";
const Hero = () => {
  const navigate = useNavigate();
  const {
    content
  } = useLandingPageContent("hero");
  const handleStartTrial = () => navigate("/auth");
  const handleSystemOverview = () => {
    const el = document.getElementById("about");
    if (el) el.scrollIntoView({
      behavior: "smooth"
    });
  };

  // Title pieces with safe fallbacks
  const rawTitle = content?.title || "PETRO DEAL HUB";
  // Force “PETRO DEAL HUB” on one line (no wrap)
  const titleOneLine = rawTitle.replace(/\s+/g, " ").trim();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-20 sm:pt-24 md:pt-28 lg:pt-[180px]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }} aria-hidden="true" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.12]">
          <div className="absolute inset-0" style={{
          backgroundImage: `
                linear-gradient(hsl(var(--accent) / 0.25) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--accent) / 0.25) 1px, transparent 1px)
              `,
          backgroundSize: "60px 60px"
        }} aria-hidden="true" />
        </div>
        {/* Soft glows */}
        <div className="absolute -top-10 -left-10 w-[28rem] h-[28rem] bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[22rem] h-[22rem] bg-primary/15 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Status badge */}
        <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-card/80 border border-accent/30 backdrop-blur-sm mb-7 shadow-sm">
          <span className="w-2 h-2 bg-accent rounded-full mr-3 animate-pulse" />
          <span className="text-xs font-orbitron tracking-[0.2em] text-accent">
            PETROLEUM INTELLIGENCE SYSTEM
          </span>
          <ArrowRight className="w-4 h-4 ml-3 text-accent" aria-hidden="true" />
        </div>

        {/* Headline — single line */}
      <h1 className="
    font-orbitron font-extrabold tracking-tight
    text-5xl sm:text-6xl md:text-7xl lg:text-8xl
    leading-none mb-6 mt-20   /* 👈 added margin-top */
    [text-wrap:nowrap]
  " aria-label={titleOneLine}>
  <span className="
      inline-block align-baseline
      bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--primary))] to-[hsl(var(--accent-blue))]
      bg-clip-text text-transparent drop-shadow-[0_2px_12px_hsla(0,0%,100%,0.04)]
    ">
    {titleOneLine}
  </span>
      </h1>


        {/* Subheading */}
        <p className="font-rajdhani text-base sm:text-lg md:text-xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed">
          {content?.subtitle || "Industrial-grade petroleum trading platform"}
        </p>

        {/* Value sentence (punchier, attractive) */}
        <p className="mt-4 text-sm sm:text-base max-w-3xl mx-auto text-[color:var(--accent-blue)]/95 text-slate-50 md:text-lg">
          {content?.description || "Direct broker membership • Real-time vessel & refinery mapping • Contract-backed commission protection"}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleStartTrial} className="
              group relative px-10 py-6 text-base md:text-lg font-orbitron font-bold
              bg-accent text-accent-foreground border border-accent/50
              shadow-[0_8px_30px_hsla(var(--accent)/0.35)]
              hover:shadow-[0_12px_36px_hsla(var(--accent)/0.5)]
              hover:scale-[1.02] transition
            ">
            <Zap className="w-5 h-5 mr-3 group-hover:rotate-12 transition" aria-hidden="true" />
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition" aria-hidden="true" />
          </Button>

          <Button size="lg" variant="outline" onClick={handleSystemOverview} className="px-10 py-6 text-base md:text-lg font-rajdhani font-semibold border-2 border-primary/40 bg-card/60 hover:border-primary hover:bg-primary/10 backdrop-blur-sm transition text-slate-50">
            <Shield className="w-5 h-5 mr-3" aria-hidden="true" />
            System Overview
          </Button>
        </div>

        {/* Metrics */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {(content?.content?.metrics?.length ? content.content.metrics : [{
          value: "99.9%",
          label: "SYSTEM UPTIME",
          icon: Gauge,
          tone: "accent"
        }, {
          value: "100%",
          label: "Guaranteed Commission Protection",
          icon: Shield,
          tone: "primary"
        }, {
          value: "15K+",
          label: "ACTIVE TERMINALS",
          icon: Zap,
          tone: "gold"
        }]).map((m: any, i: number) => {
          const Icon = m.icon || (i === 0 ? Gauge : i === 1 ? Shield : Zap);
          const tone = m.tone || (i === 0 ? "accent" : i === 1 ? "primary" : "gold");
          const toneBg = tone === "accent" ? "from-accent/6" : tone === "primary" ? "from-primary/6" : "from-gold/6";
          const toneText = tone === "accent" ? "text-accent" : tone === "primary" ? "text-primary" : "text-gold";
          return <div key={i} className="
                  relative p-6 rounded-xl bg-card/60 border border-border/50
                  hover:border-accent/40 transition
                ">
                <div className={`absolute inset-0 bg-gradient-to-br ${toneBg} to-transparent rounded-xl opacity-0 hover:opacity-100 transition`} />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-muted/40 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${toneText}`} aria-hidden="true" />
                  </div>
                  <div className={`font-orbitron text-2xl font-bold mb-1 ${toneText}`}>
                    {m.value}
                  </div>
                  <div className="font-rajdhani text-xs tracking-[0.25em] text-muted-foreground">
                    {m.label}
                  </div>
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce">
        <div className="flex flex-col items-center">
          <div className="font-rajdhani text-[10px] text-muted-foreground tracking-[0.3em] mb-2">
            SCROLL TO ACCESS
          </div>
          <div className="w-8 h-12 border-2 border-accent/40 rounded-full flex justify-center relative">
            <ChevronDown className="w-4 h-4 text-accent absolute top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;